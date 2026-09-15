import nodemailer, { type Transporter } from "nodemailer";
import { DISTILLERY } from "@/lib/locations";

/**
 * Campaign mail goes out through Brevo's SMTP relay, never the Hostinger
 * mailbox in mailer.ts.
 *
 * The split is the point. Hostinger carries invoices and order emails; a
 * mailbox plan has a daily cap and is not meant for bulk mail, so a campaign
 * sent from it risks the one account every customer's invoice depends on. A
 * spam complaint against a campaign now lands on Brevo's reputation for this
 * domain, not on the invoice sender's.
 *
 * Environment:
 *   BREVO_SMTP_USER   SMTP login from Brevo → SMTP & API → SMTP (not your
 *                     account email)
 *   BREVO_SMTP_KEY    An SMTP key from the same page (not an API key)
 *   CAMPAIGN_FROM     e.g. Bourbon & Oak <news@bourbonoaklover.com> — the
 *                     domain must be authenticated in Brevo
 *   CAMPAIGN_REPLY_TO optional, defaults to the support address
 *   BREVO_SMTP_HOST / BREVO_SMTP_PORT optional overrides
 */

const REQUIRED = ["BREVO_SMTP_USER", "BREVO_SMTP_KEY", "CAMPAIGN_FROM"] as const;

export interface CampaignMailerConfig {
  ready: boolean;
  missing: string[];
  /** Safe to show the operator. Never includes the login or key. */
  from: string | null;
}

export function campaignMailerConfig(): CampaignMailerConfig {
  const missing = REQUIRED.filter((k) => !process.env[k]);
  return {
    ready: missing.length === 0,
    missing,
    from: process.env.CAMPAIGN_FROM ?? null,
  };
}

function createTransport(poolSize: number): Transporter {
  const port = Number(process.env.BREVO_SMTP_PORT ?? 587);
  return nodemailer.createTransport({
    host: process.env.BREVO_SMTP_HOST ?? "smtp-relay.brevo.com",
    port,
    // 587 upgrades with STARTTLS; only 465 starts encrypted.
    secure: port === 465,
    auth: {
      user: process.env.BREVO_SMTP_USER!,
      pass: process.env.BREVO_SMTP_KEY!,
    },
    pool: true,
    maxConnections: poolSize,
  });
}

interface SmtpErrorLike {
  message?: string;
  code?: string;
  response?: string;
  responseCode?: number;
}

/** What went wrong, in words the operator can act on. Never echoes credentials. */
export function describeSmtpError(err: unknown): string {
  const e = err as SmtpErrorLike;
  if (e?.code === "EAUTH") {
    return "Brevo rejected the SMTP login. Check BREVO_SMTP_USER and BREVO_SMTP_KEY — the key must be an SMTP key, not an API key.";
  }
  if (e?.code === "ECONNECTION" || e?.code === "ETIMEDOUT" || e?.code === "ESOCKET" || e?.code === "EDNS") {
    return "Could not reach Brevo's mail server. Nothing was sent — try again in a minute.";
  }
  if (e?.response) {
    // The server's own words, e.g. "550 5.1.1 mailbox unavailable".
    return `Rejected by the mail server: ${e.response.slice(0, 200)}`;
  }
  return (e?.message ?? "Unknown sending error.").slice(0, 200);
}

export interface CampaignEmail {
  to: string;
  subject: string;
  html: string;
  text: string;
  unsubscribeUrl: string;
  /** Groups the send in Brevo's statistics. */
  tag: string;
}

export type CampaignSendResult =
  | { ok: true; messageId: string }
  | { ok: false; error: string };

/**
 * Open one pooled connection set for the duration of a batch, then close it.
 *
 * A pooled transport cached at module level would outlive the request, and on
 * serverless a frozen instance wakes with dead sockets. Scoping the pool to
 * the batch keeps connection reuse where it helps — many messages in a row —
 * without keeping anything alive between requests.
 *
 * The connection is verified before `run` starts, so a wrong key or a Brevo
 * outage fails the whole batch up front instead of marking every recipient in
 * it as failed.
 */
export async function withCampaignMailer<T>(
  poolSize: number,
  run: (send: (mail: CampaignEmail) => Promise<CampaignSendResult>) => Promise<T>,
): Promise<{ ok: true; value: T } | { ok: false; error: string }> {
  const config = campaignMailerConfig();
  if (!config.ready) {
    return { ok: false, error: `Brevo is not configured. Missing: ${config.missing.join(", ")}.` };
  }

  const transport = createTransport(poolSize);
  try {
    await transport.verify();
  } catch (err) {
    transport.close();
    return { ok: false, error: describeSmtpError(err) };
  }

  const replyTo = process.env.CAMPAIGN_REPLY_TO ?? DISTILLERY.email;

  const send = async (mail: CampaignEmail): Promise<CampaignSendResult> => {
    try {
      const info = await transport.sendMail({
        from: process.env.CAMPAIGN_FROM,
        to: mail.to,
        replyTo,
        subject: mail.subject,
        html: mail.html,
        text: mail.text,
        headers: {
          /* RFC 8058 one-click unsubscribe. Gmail and Yahoo require both
             headers for bulk senders, and they are sent on every message
             regardless of what the visible footer says. The URL is this
             recipient's own — one shared link would let anyone unsubscribe
             the whole list. */
          "List-Unsubscribe": `<${mail.unsubscribeUrl}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
          // Brevo groups statistics by this header.
          "X-Mailin-Tag": mail.tag,
        },
      });
      return { ok: true, messageId: info.messageId };
    } catch (err) {
      return { ok: false, error: describeSmtpError(err) };
    }
  };

  try {
    return { ok: true, value: await run(send) };
  } finally {
    transport.close();
  }
}
