import { sendEmail } from "@/lib/mailer";

const SITE =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
  "https://bourbonoaklover.com";

/**
 * Tell the buyer their payment details are ready.
 *
 * The details themselves are deliberately NOT in this email. Account numbers
 * and wallet addresses sent over email are the exact thing payment-redirection
 * fraud relies on — a lookalike follow-up saying "our bank changed" is
 * indistinguishable to the recipient. The email carries only a pointer to the
 * signed-in dashboard, where the details can be trusted to be ours.
 */
export async function notifyPaymentDetailsIssued(input: {
  email: string;
  orderNumber: string;
  total: number;
  reissued: boolean;
}): Promise<boolean> {
  const { email, orderNumber, total, reissued } = input;
  const url = `${SITE}/account`;
  const heading = reissued
    ? "Updated payment details for your order"
    : "Your payment details are ready";

  return sendEmail({
    to: email,
    subject: `${heading} — ${orderNumber}`,
    html: `
      <div style="font-family:Georgia,serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#0C0A09">
        <p style="letter-spacing:.3em;text-transform:uppercase;font-size:11px;color:#CA8A04;margin:0 0 12px">Bourbon &amp; Oak</p>
        <h1 style="font-size:22px;margin:0 0 16px">${heading}</h1>
        <p style="font-size:15px;line-height:1.6;color:#44403C;margin:0 0 8px">
          Order <strong>${orderNumber}</strong> · $${total.toFixed(2)}
        </p>
        <p style="font-size:15px;line-height:1.6;color:#44403C;margin:0 0 24px">
          Sign in to your account to see exactly where to send payment, and to
          upload your receipt once you have paid.
        </p>
        <p style="margin:0 0 24px">
          <a href="${url}" style="display:inline-block;background:#CA8A04;color:#0C0A09;text-decoration:none;font-weight:bold;letter-spacing:.1em;text-transform:uppercase;font-size:13px;padding:14px 26px">
            Open your dashboard
          </a>
        </p>
        <p style="font-size:13px;line-height:1.6;color:#78716C;margin:0">
          For your safety we never put account or wallet details in an email.
          If you receive one claiming to be from us with payment details in it,
          it is not from us — check your dashboard instead.
        </p>
      </div>`,
    text: `${heading} for order ${orderNumber} ($${total.toFixed(2)}).\n\nSign in at ${url} to see where to send payment and to upload your receipt.\n\nWe never put account or wallet details in an email. If you get one claiming to be from us with payment details in it, it is not from us.`,
  });
}
