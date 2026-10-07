import type { Order, OrderItem } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { appendMessage } from "@/lib/order-chat";
import { getOrCreateCustomerThread } from "@/lib/customer-chat";
import { buildInvoiceSnapshot } from "@/lib/invoice";
import { renderInvoicePdf } from "@/lib/invoice-pdf";
import { uploadInvoiceImage } from "@/lib/cloudinary";
import {
  fillWelcome,
  firstNameOf,
  getOrderWelcome,
} from "@/lib/order-welcome";

/**
 * Open a buyer's chat the moment their order lands.
 *
 * Checkout now sends people straight here instead of a confirmation page, so
 * this thread IS the confirmation: a picture of what they ordered, then a line
 * telling them a person is coming and roughly when.
 *
 * Every step is best effort and the function never throws. The order is already
 * written and paid-for intent is recorded; failing to draw a receipt image must
 * not turn a successful checkout into an error. Each failure degrades one notch
 * — no image, or no messages at all — rather than taking the order down with it.
 */
export async function openOrderChat(
  order: Order & { items: OrderItem[] },
  customerId: string,
): Promise<{ ok: boolean; threadId?: string; withImage: boolean }> {
  try {
    const thread = await getOrCreateCustomerThread(customerId);

    /* The same document the invoice renderer draws, in its "receipt" variant:
       no invoice number, nothing owed-sounding, because no invoice has been
       issued yet — that stays the operator's separate, deliberate act. */
    let media: { publicId: string; bytes: number } | null = null;
    try {
      const snapshot = buildInvoiceSnapshot(order, "", order.createdAt);
      const pdf = await renderInvoicePdf(snapshot, "receipt");
      const up = await uploadInvoiceImage(pdf);
      media = { publicId: up.publicId, bytes: up.bytes };
    } catch (err) {
      console.error(
        `[order-chat] receipt image failed for ${order.orderNumber}; sending text only:`,
        err,
      );
    }

    const welcome = await getOrderWelcome();
    const vars = {
      firstName: firstNameOf(order.fullName),
      orderNumber: order.orderNumber,
    };

    /* The caption stands on its own. A notification preview, a plain-text
       fallback or a client that cannot render the image still shows a sentence
       that makes sense without it. */
    /* Quantity, not line count: an order of 2x one bottle is two bottles, and
       calling it "1 item" reads as though half of it went missing. */
    const units = order.items.reduce((n, i) => n + i.quantity, 0);
    const caption = `Your order ${order.orderNumber} — ${units} ${
      units === 1 ? "bottle" : "bottles"
    }.`;

    await appendMessage({
      conversationId: thread.id,
      sender: "ADMIN",
      kind: media ? "IMAGE" : "TEXT",
      body: caption,
      contextOrderNumber: order.orderNumber,
      ...(media
        ? {
            mediaPublicId: media.publicId,
            mediaMimeType: "image/jpeg",
            mediaBytes: media.bytes,
          }
        : {}),
    });

    /* Greeting and promise as one message rather than two: two bubbles landing
       in the same instant reads as a bot talking to itself. */
    const lines = [
      fillWelcome(welcome.greeting, vars),
      fillWelcome(welcome.promise, vars),
      welcome.suggestInstall ? welcome.installLine : "",
    ].filter((l) => l.length > 0);

    await appendMessage({
      conversationId: thread.id,
      sender: "ADMIN",
      kind: "TEXT",
      body: lines.join("\n\n"),
      contextOrderNumber: order.orderNumber,
    });

    /* These are ours, and the buyer is about to be looking straight at them, so
       they must not arrive as an unread badge on a thread already open. */
    await prisma.conversation.update({
      where: { id: thread.id },
      data: { customerUnread: 0 },
    });

    return { ok: true, threadId: thread.id, withImage: media !== null };
  } catch (err) {
    console.error(`[order-chat] could not open chat for ${order.orderNumber}:`, err);
    return { ok: false, withImage: false };
  }
}
