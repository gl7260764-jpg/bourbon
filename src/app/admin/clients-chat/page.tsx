import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { SETTLEMENT_LABEL } from "@/lib/order-status";

export const metadata = { title: "Clients chat | Admin" };
export const dynamic = "force-dynamic";

/**
 * Order-scoped customer conversations.
 *
 * Deliberately separate from /admin/chat, which is the anonymous storefront
 * widget keyed to a device cookie. These threads belong to a named customer
 * and a specific order, and are worked from the order itself — so this page is
 * an index that routes you there, not a second reply surface. One inbox
 * mixing the two would bury a paying customer's payment question underneath
 * passing visitors asking about opening hours.
 */
export default async function ClientsChatPage() {
  const threads = await prisma.conversation.findMany({
    where: { orderId: { not: null } },
    orderBy: [{ adminUnread: "desc" }, { lastMessageAt: "desc" }],
    take: 100,
    select: {
      id: true,
      adminUnread: true,
      lastMessageAt: true,
      lastMessageFrom: true,
      order: {
        select: {
          id: true,
          orderNumber: true,
          email: true,
          fullName: true,
          total: true,
          status: true,
          settlementState: true,
        },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { kind: true, body: true, sender: true },
      },
    },
  });

  const waiting = threads.filter((t) => t.adminUnread > 0).length;

  return (
    <>
      <div className="mb-8">
        <h1 className="font-[family-name:var(--font-playfair)] text-3xl font-bold text-bourbon-deep">
          Clients chat
        </h1>
        <p className="text-bourbon-stone text-sm mt-1">
          Conversations attached to an order.{" "}
          {waiting > 0 ? (
            <span className="text-bourbon-deep font-semibold">
              {waiting} waiting on a reply.
            </span>
          ) : (
            "Nothing waiting on a reply."
          )}{" "}
          Anonymous storefront chats live under{" "}
          <Link href="/admin/chat" className="text-bourbon-gold hover:text-bourbon-amber transition-colors">
            Live Chat
          </Link>
          .
        </p>
      </div>

      {threads.length === 0 ? (
        <p className="text-bourbon-stone text-sm bg-white border border-bourbon-deep/10 p-6 text-center">
          No customer has started a conversation about an order yet. Threads
          appear here the moment one does.
        </p>
      ) : (
        <ul className="space-y-2">
          {threads.map((t) => {
            if (!t.order) return null;
            const last = t.messages[0];
            const preview =
              last?.kind === "IMAGE"
                ? "📷 Photo"
                : last?.kind === "VOICE"
                  ? "🎤 Voice note"
                  : (last?.body ?? "").slice(0, 110) || "No messages yet";
            return (
              <li key={t.id}>
                <Link
                  href={`/admin/orders/${t.order.id}`}
                  className="block bg-white border border-bourbon-deep/10 p-4 hover:border-bourbon-gold transition-colors"
                >
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-[family-name:var(--font-playfair)] font-bold text-bourbon-deep">
                          {t.order.fullName || t.order.email}
                        </span>
                        <span className="text-bourbon-stone text-xs font-mono">
                          {t.order.orderNumber}
                        </span>
                        {t.adminUnread > 0 && (
                          <span className="text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 bg-rose-100 text-rose-800">
                            {t.adminUnread} new
                          </span>
                        )}
                        {t.order.status === "PENDING" && (
                          <span className="text-[10px] tracking-widest uppercase px-2 py-0.5 bg-bourbon-cream text-bourbon-stone">
                            {SETTLEMENT_LABEL[t.order.settlementState]}
                          </span>
                        )}
                      </div>
                      <p className="text-bourbon-stone text-sm truncate max-w-xl">
                        {last?.sender === "ADMIN" && (
                          <span className="text-bourbon-stone/60">You: </span>
                        )}
                        {preview}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-[family-name:var(--font-playfair)] font-bold text-bourbon-deep">
                        ${Number(t.order.total).toFixed(2)}
                      </p>
                      <p className="text-bourbon-stone text-[11px] mt-0.5">
                        {t.lastMessageAt.toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                          timeZone: "UTC",
                        })}
                      </p>
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
