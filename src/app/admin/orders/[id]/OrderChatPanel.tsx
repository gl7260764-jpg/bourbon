"use client";

import OrderChat from "@/components/OrderChat";

/** Admin side of the per-order thread. Same component the customer sees, with
    the sides flipped — so a change to bubbles or the composer lands on both. */
export default function OrderChatPanel({
  orderNumber,
  unread,
}: {
  orderNumber: string;
  unread: number;
}) {
  return (
    <section className="bg-white border border-bourbon-deep/10 p-5">
      <div className="flex items-baseline justify-between gap-3 mb-4 flex-wrap">
        <h2 className="font-[family-name:var(--font-playfair)] text-lg font-bold text-bourbon-deep">
          Chat with the customer
        </h2>
        {unread > 0 && (
          <span className="text-[10px] tracking-widest uppercase px-2 py-0.5 bg-rose-100 text-rose-800">
            {unread} unread
          </span>
        )}
      </div>
      <OrderChat
        endpoint={`/api/admin/orders/${orderNumber}/chat`}
        me="ADMIN"
        orderNumber={orderNumber}
        emptyHint="No messages on this order yet. Anything you send here appears on the customer's dashboard."
      />
    </section>
  );
}
