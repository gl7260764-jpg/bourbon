import { DISTILLERY } from "@/lib/locations";
import type { FollowUpDraft } from "@/lib/follow-up-constants";

/**
 * The follow-up email's shell.
 *
 * Built rather than sent: the caller owns delivery, because these go out
 * through the Brevo relay in campaign-mailer.ts rather than the invoice
 * mailbox, and the operator may have edited the body before pressing send.
 *
 * The sign-in button is appended here and is not part of the editable body.
 * Every one of these messages ends by pointing at the order, and an operator
 * trimming a paragraph must not be able to remove the only way to act on it.
 *
 * No payment details ever appear in this email, only a link to where they can
 * be trusted to be ours. Same rule as paymentDetailsEmail.ts, and the reason
 * is the same: a lookalike follow-up carrying an account number is the whole
 * mechanism of payment-redirection fraud.
 */

const esc = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** Straight quotes and dashes read as machine-written in a one-to-one email. */
const typeset = (s: string) =>
  esc(s)
    .replace(/(\w)'(\w)/g, "$1’$2")
    .replace(/ -- /g, " — ");

export interface FollowUpEmail {
  subject: string;
  html: string;
  text: string;
}

export function buildFollowUpEmail(input: {
  draft: Pick<FollowUpDraft, "orderNumber" | "ctaLabel">;
  /** The body as it will be sent — the operator's edit, if they made one. */
  subject: string;
  paragraphs: string[];
  /** One-click sign-in URL, or the plain account page when none could be minted. */
  orderUrl: string;
}): FollowUpEmail {
  const { draft, subject, paragraphs, orderUrl } = input;

  const bodyHtml = paragraphs
    .map(
      (p) =>
        `<p style="font-size:15px;line-height:1.65;color:#44403C;margin:0 0 16px">${typeset(p)}</p>`,
    )
    .join("\n        ");

  const html = `
      <div style="font-family:Georgia,serif;max-width:540px;margin:0 auto;padding:32px 24px;color:#0C0A09">
        <p style="letter-spacing:.3em;text-transform:uppercase;font-size:11px;color:#CA8A04;margin:0 0 20px">Bourbon &amp; Oak</p>
        ${bodyHtml}
        <p style="margin:24px 0 28px">
          <a href="${esc(orderUrl)}" style="display:inline-block;background:#CA8A04;color:#0C0A09;text-decoration:none;font-family:Helvetica,Arial,sans-serif;font-weight:bold;letter-spacing:.1em;text-transform:uppercase;font-size:13px;padding:14px 26px">
            ${esc(draft.ctaLabel)}
          </a>
        </p>
        <p style="font-size:13px;line-height:1.6;color:#78716C;margin:0 0 16px">
          That link signs you in without a password and goes straight to order
          ${esc(draft.orderNumber)}. Please don&rsquo;t forward it &mdash; anyone
          holding it can open your account. We never put account or wallet
          details in an email; if you receive one that does, it is not from us.
        </p>
        <p style="font-size:12px;line-height:1.6;color:#A8A29E;margin:0;padding-top:16px;border-top:1px solid #E7E5E4">
          You are receiving this because you placed order ${esc(draft.orderNumber)}
          with us. Reply to this email and a person will read it.<br>
          ${esc(DISTILLERY.name)}, ${esc(DISTILLERY.streetAddress)},
          ${esc(DISTILLERY.addressLocality)}, ${esc(DISTILLERY.addressRegion)}
          ${esc(DISTILLERY.postalCode)} &middot; ${esc(DISTILLERY.email)}
        </p>
      </div>`;

  const text = [
    ...paragraphs,
    "",
    `${draft.ctaLabel}: ${orderUrl}`,
    "",
    `That link signs you in without a password and goes straight to order ${draft.orderNumber}.`,
    "Please don't forward it — anyone holding it can open your account. We never",
    "put account or wallet details in an email; if you receive one that does, it",
    "is not from us.",
    "",
    `You are receiving this because you placed order ${draft.orderNumber} with us.`,
    "Reply to this email and a person will read it.",
    `${DISTILLERY.name}, ${DISTILLERY.streetAddress}, ${DISTILLERY.addressLocality}, ${DISTILLERY.addressRegion} ${DISTILLERY.postalCode}`,
    DISTILLERY.email,
  ].join("\n");

  return { subject, html, text };
}
