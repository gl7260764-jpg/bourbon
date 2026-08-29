import type { ChatMessageKind, ChatSender } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { signedChatMediaUrl } from "@/lib/cloudinary";

/**
 * Order-scoped conversations.
 *
 * One thread per order, created lazily on the first message so an order that
 * nobody ever asks about carries no empty row. Both the customer surface and
 * the admin surface go through here, which is what keeps authorisation in one
 * place instead of duplicated across four routes.
 */

export const MAX_BODY_CHARS = 4000;

export type ChatMessageView = {
  id: string;
  sender: ChatSender;
  kind: ChatMessageKind;
  body: string;
  createdAt: string;
  /** Signed, short-lived. Null for text messages. */
  mediaUrl: string | null;
  mediaDurationMs: number | null;
  /** Order this message is about, when it is about one. Rendered as a chip. */
  contextOrderNumber: string | null;
};

/**
 * Resolve the order a signed-in customer is allowed to talk about.
 *
 * Matches on the account link OR the order email, mirroring the dashboard —
 * orders placed before customer accounts existed have a null customerId and
 * would otherwise be unreachable by their own owner. Returns null rather than
 * throwing so callers answer 404 for both "no such order" and "not yours",
 * which keeps order numbers from being enumerable.
 */
export async function findOrderForCustomer(
  orderNumber: string,
  customer: { id: string; email: string },
) {
  return prisma.order.findFirst({
    where: {
      orderNumber,
      OR: [{ customerId: customer.id }, { email: customer.email }],
    },
    select: { id: true, orderNumber: true, email: true, customerId: true },
  });
}

export async function getOrCreateOrderThread(input: {
  orderId: string;
  customerId: string | null;
}) {
  const existing = await prisma.conversation.findUnique({
    where: { orderId: input.orderId },
    select: { id: true },
  });
  if (existing) return existing;

  return prisma.conversation.create({
    // visitorId is required by the storefront widget's schema and meaningless
    // for an order thread, so it carries a stable synthetic value rather than
    // an empty string that could collide across orders.
    data: {
      orderId: input.orderId,
      customerId: input.customerId,
      visitorId: `order:${input.orderId}`,
    },
    select: { id: true },
  });
}

export function toView(m: {
  id: string;
  sender: ChatSender;
  kind: ChatMessageKind;
  body: string;
  createdAt: Date;
  mediaPublicId: string | null;
  mediaDurationMs: number | null;
  contextOrderNumber?: string | null;
}): ChatMessageView {
  return {
    id: m.id,
    sender: m.sender,
    kind: m.kind,
    body: m.body,
    createdAt: m.createdAt.toISOString(),
    mediaUrl: m.mediaPublicId
      ? signedChatMediaUrl(m.mediaPublicId, m.kind === "VOICE" ? "audio" : "image")
      : null,
    mediaDurationMs: m.mediaDurationMs,
    contextOrderNumber: m.contextOrderNumber ?? null,
  };
}

export async function listMessages(conversationId: string): Promise<ChatMessageView[]> {
  const rows = await prisma.chatMessage.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true, sender: true, kind: true, body: true, createdAt: true,
      mediaPublicId: true, mediaDurationMs: true, contextOrderNumber: true,
    },
  });
  return rows.map(toView);
}

/**
 * Append a message and move the thread's denormalised counters in the same
 * transaction, so an inbox badge can never disagree with its own messages.
 */
export async function appendMessage(input: {
  conversationId: string;
  sender: ChatSender;
  kind: ChatMessageKind;
  body: string;
  mediaPublicId?: string | null;
  mediaMimeType?: string | null;
  mediaDurationMs?: number | null;
  mediaBytes?: number | null;
  /** Which order this message is about, when it is about one. Label only. */
  contextOrderNumber?: string | null;
}): Promise<ChatMessageView> {
  const fromCustomer = input.sender === "VISITOR";

  const [message] = await prisma.$transaction([
    prisma.chatMessage.create({
      data: {
        conversationId: input.conversationId,
        sender: input.sender,
        kind: input.kind,
        body: input.body,
        mediaPublicId: input.mediaPublicId ?? null,
        mediaMimeType: input.mediaMimeType ?? null,
        mediaDurationMs: input.mediaDurationMs ?? null,
        mediaBytes: input.mediaBytes ?? null,
        contextOrderNumber: input.contextOrderNumber ?? null,
      },
      select: {
        id: true, sender: true, kind: true, body: true, createdAt: true,
        mediaPublicId: true, mediaDurationMs: true, contextOrderNumber: true,
      },
    }),
    prisma.conversation.update({
      where: { id: input.conversationId },
      data: {
        lastMessageAt: new Date(),
        lastMessageFrom: input.sender,
        status: "OPEN",
        ...(fromCustomer
          ? { adminUnread: { increment: 1 } }
          : { customerUnread: { increment: 1 } }),
      },
    }),
  ]);

  return toView(message);
}

/** Clear the badge for whichever side just opened the thread. */
export async function markRead(
  conversationId: string,
  reader: "customer" | "admin",
): Promise<void> {
  await prisma.conversation.update({
    where: { id: conversationId },
    data: reader === "admin" ? { adminUnread: 0 } : { customerUnread: 0 },
  });
}
