import type { Invoice } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/mailer";
import { notifyAsync } from "@/lib/ntfy";
import { appendMessage } from "@/lib/order-chat";
import { getOrCreateCustomerThread } from "@/lib/customer-chat";
import { findOrCreateCustomer } from "@/lib/customer-auth";
import { customerChannel, publishChatMessage } from "@/lib/realtime";
import { snapshotOf, money } from "@/lib/invoice";
import { renderInvoiceEmail } from "@/lib/invoice-template";
import { invoiceFileName, renderInvoicePdf } from "@/lib/invoice-pdf";

/**
 * Getting an issued invoice to the customer.
 *
 * Two channels, deliberately independent: email can bounce while chat lands, or
 * SMTP can be unconfigured entirely. Each records its own timestamp on the
 * invoice and each reports its own success, so the operator is told what
 * actually happened rather than "sent".
 *
 * Neither throws. A delivery failure must not roll back an issued invoice — the
 * number is spent and the document exists either way, and the operator can
 * retry from the order page.
 */

const SITE = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://bourbonoaklover.com"
).replace(/\/$/, "");

export function invoiceViewUrl(invoiceNumber: string): string {
  return `${SITE}/invoice/${invoiceNumber}`;
}

export interface DeliveryResult {
  email: { attempted: boolean; ok: boolean; to?: string; error?: string };
  chat: { attempted: boolean; ok: boolean; error?: string };
}

/**
 * Email the invoice with the PDF attached.
 *
 * The document is also inlined into the body, so it is readable in clients that
 * hide attachments and on a phone where opening a PDF is friction.
 */
export async function emailInvoice(invoice: Invoice): Promise<{ ok: boolean; to: string; error?: string }> {
  const order = await prisma.order.findUnique({
    where: { id: invoice.orderId },
    select: { email: true },
  });
  const to = order?.email ?? "";
  if (!to) return { ok: false, to, error: "That order has no email address." };

  const snap = snapshotOf(invoice);
  const viewUrl = invoiceViewUrl(invoice.invoiceNumber);

  let pdf: Buffer | null = null;
  try {
    pdf = await renderInvoicePdf(snap);
  } catch (err) {
    // Send without the attachment rather than not at all: the document is in
    // the body, and a missing PDF is a worse outcome than a missing email.
    console.error(`[invoice] PDF render failed for ${invoice.invoiceNumber}:`, err);
  }

  const mail = renderInvoiceEmail(snap, { viewUrl, hasPdf: pdf !== null });

  const sent = await sendEmail({
    to,
    subject: mail.subject,
    html: mail.html,
    text: mail.text,
    replyTo: "support@bourbonoaklover.com",
    attachments: pdf
      ? [
          {
            filename: invoiceFileName(snap),
            content: pdf,
            contentType: "application/pdf",
          },
        ]
      : undefined,
  });

  if (!sent) {
    return { ok: false, to, error: "SMTP rejected the message or is not configured." };
  }

  await prisma.invoice.update({
    where: { id: invoice.id },
    data: { emailSentAt: new Date(), emailSentTo: to },
  });
  return { ok: true, to };
}

/**
 * Put the invoice in the customer's dashboard thread.
 *
 * Guest orders have no customer row, so one is created from the order email —
 * the same thing checkout does — otherwise there is no thread to deliver into
 * and the buyer could never see it.
 */
export async function chatInvoice(invoice: Invoice): Promise<{ ok: boolean; error?: string }> {
  const order = await prisma.order.findUnique({
    where: { id: invoice.orderId },
    select: { id: true, email: true, customerId: true, orderNumber: true },
  });
  if (!order) return { ok: false, error: "That order no longer exists." };

  try {
    let customerId = order.customerId;
    if (!customerId) {
      const customer = await findOrCreateCustomer(order.email, {});
      customerId = customer.id;
      // Link it back so the buyer's dashboard finds this order too.
      await prisma.order.update({
        where: { id: order.id },
        data: { customerId },
      });
    }

    const thread = await getOrCreateCustomerThread(customerId);
    const snap = snapshotOf(invoice);

    /* The body is written to stand on its own. A client that does not render
       the invoice card — an old build, a notification preview, the plain-text
       fallback — still shows a message that makes sense. */
    const body =
      snap.status === "PAID"
        ? `Here is your receipt for order ${order.orderNumber} — ${invoice.invoiceNumber}, ${money(Number(invoice.total))} paid in full.`
        : `Here is your invoice for order ${order.orderNumber} — ${invoice.invoiceNumber}, ${money(Number(invoice.total))} due.`;

    const message = await appendMessage({
      conversationId: thread.id,
      sender: "ADMIN",
      kind: "TEXT",
      body,
      contextOrderNumber: order.orderNumber,
      invoiceId: invoice.id,
    });

    await publishChatMessage(customerChannel(customerId), message);

    await prisma.invoice.update({
      where: { id: invoice.id },
      data: { chatSentAt: new Date() },
    });

    notifyAsync({
      event: "messages",
      title: `Invoice ${invoice.invoiceNumber} sent to chat`,
      message: `${order.email} · ${money(Number(invoice.total))}`,
      url: `/admin/chat?c=${thread.id}`,
      priority: 3,
    });

    return { ok: true };
  } catch (err) {
    console.error(`[invoice] chat delivery failed for ${invoice.invoiceNumber}:`, err);
    return { ok: false, error: "Could not post the invoice into the chat." };
  }
}

/** Send by the requested channels, reporting each one separately. */
export async function deliverInvoice(
  invoice: Invoice,
  channels: { email: boolean; chat: boolean },
): Promise<DeliveryResult> {
  const result: DeliveryResult = {
    email: { attempted: false, ok: false },
    chat: { attempted: false, ok: false },
  };

  if (channels.email) {
    result.email.attempted = true;
    const r = await emailInvoice(invoice);
    result.email = { attempted: true, ok: r.ok, to: r.to, error: r.error };
  }

  if (channels.chat) {
    result.chat.attempted = true;
    const r = await chatInvoice(invoice);
    result.chat = { attempted: true, ok: r.ok, error: r.error };
  }

  return result;
}
