import { prisma } from "@/lib/prisma";

/**
 * One ongoing conversation per customer.
 *
 * Chat used to be a thread per order, which meant a buyer with three orders
 * had three inboxes and no obvious place to ask a general question. There is
 * now a single thread per person; a message can still name the order it is
 * about via ChatMessage.contextOrderNumber.
 *
 * The "one primary thread per customer" invariant cannot be a database
 * constraint — Prisma has no partial unique index — so every read and write
 * goes through here.
 */

/** The customer's single thread, creating it on first use. */
export async function getOrCreateCustomerThread(customerId: string) {
  const existing = await prisma.conversation.findFirst({
    where: { customerId, isPrimary: true },
    orderBy: { createdAt: "asc" },
  });
  if (existing) return existing;

  return prisma.conversation.create({
    data: {
      // Primary threads are keyed to a person, not a device, so the visitor
      // column carries a stable synthetic value rather than a cookie.
      visitorId: `customer:${customerId}`,
      customerId,
      isPrimary: true,
    },
  });
}

/**
 * Fold a customer's old per-order threads into their primary one.
 *
 * Messages are re-pointed rather than copied, so ids, timestamps and any
 * Cloudinary attachments survive untouched and nothing is duplicated. Each
 * migrated message keeps the order number it came from. The emptied order
 * threads are then deleted — they hold nothing, and leaving them would keep
 * showing an extra row in the admin inbox forever.
 *
 * Idempotent: running it twice moves nothing the second time.
 */
export async function mergeOrderThreadsIntoPrimary(customerId: string): Promise<{
  movedMessages: number;
  mergedThreads: number;
}> {
  const primary = await getOrCreateCustomerThread(customerId);

  const orderThreads = await prisma.conversation.findMany({
    where: { customerId, isPrimary: false, orderId: { not: null } },
    select: {
      id: true,
      customerUnread: true,
      adminUnread: true,
      order: { select: { orderNumber: true } },
    },
  });
  if (orderThreads.length === 0) return { movedMessages: 0, mergedThreads: 0 };

  let movedMessages = 0;
  for (const t of orderThreads) {
    const moved = await prisma.chatMessage.updateMany({
      where: { conversationId: t.id },
      data: {
        conversationId: primary.id,
        contextOrderNumber: t.order?.orderNumber ?? null,
      },
    });
    movedMessages += moved.count;
  }

  /* Detached from the order first: the relation cascades, so deleting an
     emptied thread while it still points at an order is fine, but clearing it
     makes the intent explicit and keeps the order's own `conversation`
     relation from resolving to a row that is about to disappear. */
  await prisma.conversation.updateMany({
    where: { id: { in: orderThreads.map((t) => t.id) } },
    data: { orderId: null },
  });
  await prisma.conversation.deleteMany({
    where: { id: { in: orderThreads.map((t) => t.id) } },
  });

  /* Unread is a counter on the conversation, not a flag per message, so the
     source threads' counters are carried across rather than recomputed — a
     recount would silently mark everything read. */
  const carriedCustomerUnread = orderThreads.reduce((n, t) => n + t.customerUnread, 0);
  const carriedAdminUnread = orderThreads.reduce((n, t) => n + t.adminUnread, 0);
  const newest = await prisma.chatMessage.findFirst({
    where: { conversationId: primary.id },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });

  await prisma.conversation.update({
    where: { id: primary.id },
    data: {
      customerUnread: { increment: carriedCustomerUnread },
      adminUnread: { increment: carriedAdminUnread },
      lastMessageAt: newest?.createdAt ?? undefined,
    },
  });

  return { movedMessages, mergedThreads: orderThreads.length };
}

/** Unread admin messages waiting for this customer — drives the navbar badge. */
export async function customerUnreadCount(customerId: string): Promise<number> {
  const rows = await prisma.conversation.findMany({
    where: { customerId },
    select: { customerUnread: true },
  });
  return rows.reduce((n, r) => n + r.customerUnread, 0);
}
