import { LINK_TTL_DAYS } from "@/lib/login-link";

const SITE =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
  "https://bourbonoaklover.com";

/** Absolute URL that signs the holder in. Shared with the order emails. */
export function signInLinkUrl(token: string): string {
  return `${SITE}/account/login/link?token=${encodeURIComponent(token)}`;
}

/**
 * The sign-in link email.
 *
 * Built rather than sent, so the caller owns delivery and the order emails can
 * embed the same URL in their own template.
 */
export function buildSignInLinkEmail(token: string): {
  subject: string;
  html: string;
  text: string;
} {
  const url = signInLinkUrl(token);
  return {
    subject: "Your Bourbon & Oak sign-in link",
    html: `
      <div style="font-family:Georgia,serif;max-width:480px;margin:0 auto;padding:32px 24px;color:#0C0A09">
        <p style="letter-spacing:.3em;text-transform:uppercase;font-size:11px;color:#CA8A04;margin:0 0 12px">Bourbon &amp; Oak</p>
        <h1 style="font-size:22px;margin:0 0 16px">Sign in to your account</h1>
        <p style="font-size:15px;line-height:1.6;color:#44403C;margin:0 0 24px">
          Tap the button and you&rsquo;re in — there&rsquo;s no code to type.
          The link works once and expires in ${LINK_TTL_DAYS} days.
        </p>
        <p style="margin:0 0 24px">
          <a href="${url}" style="display:inline-block;background:#CA8A04;color:#0C0A09;text-decoration:none;font-family:Helvetica,Arial,sans-serif;font-weight:bold;letter-spacing:.1em;text-transform:uppercase;font-size:13px;padding:14px 26px">
            Open my dashboard
          </a>
        </p>
        <p style="font-size:13px;line-height:1.6;color:#78716C;margin:0">
          If you didn&rsquo;t try to sign in you can ignore this email, and
          please don&rsquo;t forward it — anyone with this link can open your
          account.
        </p>
      </div>`,
    text: [
      "Sign in to your Bourbon & Oak account.",
      "",
      "Open this link and you're in — no code to type. It works once and",
      `expires in ${LINK_TTL_DAYS} days.`,
      "",
      url,
      "",
      "If you didn't try to sign in you can ignore this email. Please don't",
      "forward it — anyone with this link can open your account.",
    ].join("\n"),
  };
}
