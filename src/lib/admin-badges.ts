import { prisma } from "@/lib/prisma";

/**
 * Unread counts behind the admin sidebar badges.
 *
 * The panel is worked from every page, not just the inboxes, so a message that
 * lands while the operator is in Orders or Analytics has to announce itself.
 * One query set feeds every badge and the header total.
 *
 * The two chat counts are deliberately disjoint — order-scoped threads on one
 * side, everything else on the other — so `total` is a real sum rather than
 * double-counting the threads /admin/chat and /admin/clients-chat both list.
 */
export interface AdminBadgeCounts {
  /** Order-scoped threads → /admin/clients-chat */
  clientsChat: number;
  /** Device-cookie storefront threads → /admin/chat */
  storefrontChat: number;
  /** Unread contact-form submissions → /admin/messages */
  contactMessages: number;
  total: number;
}

export async function getAdminBadgeCounts(): Promise<AdminBadgeCounts> {
  const [clients, storefront, contact] = await Promise.all([
    prisma.conversation.aggregate({
      where: { orderId: { not: null } },
      _sum: { adminUnread: true },
    }),
    /* OPEN only, because /admin/chat lists OPEN only. Counting a closed
       thread here would put a number on the rail that the page it points at
       cannot show, and so cannot be cleared. The clients-chat count above
       needs no such filter — that page lists order threads whatever their
       status. */
    prisma.conversation.aggregate({
      where: { orderId: null, status: "OPEN" },
      _sum: { adminUnread: true },
    }),
    prisma.contactMessage.count({ where: { status: "UNREAD" } }),
  ]);

  const clientsChat = clients._sum.adminUnread ?? 0;
  const storefrontChat = storefront._sum.adminUnread ?? 0;

  return {
    clientsChat,
    storefrontChat,
    contactMessages: contact,
    total: clientsChat + storefrontChat + contact,
  };
}
