import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { OrderStatus, PaymentMethod, ShippingMethod } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { signedProofUrl } from "@/lib/cloudinary";
import { updateOrderNotes, updateOrderStatus } from "./actions";
import SettlementPanel, { type SettlementData } from "./SettlementPanel";
import PaymentDetailsPanel, { type PaymentDetailsData } from "./PaymentDetailsPanel";
import OrderChatPanel from "./OrderChatPanel";
import {
  actionsFor,
  ORDER_STATUS_BADGE,
  settlementIsActionable,
  type StatusAction,
} from "@/lib/order-status";

export const metadata = { title: "Order | Admin" };

const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  CARD: "Credit or Debit Card",
  PAYPAL: "PayPal",
  CHIME: "Chime",
  APPLE_PAY: "Apple Pay",
  CRYPTO: "Cryptocurrency",
  ZELLE: "Zelle",
  CASH_APP: "Cash App",
  OTHER: "Other",
};

const SHIPPING_LABEL: Record<ShippingMethod, { label: string; detail: string }> = {
  STANDARD: { label: "Standard Ground", detail: "5–7 business days · USPS" },
  EXPRESS: { label: "Express", detail: "2–3 business days · UPS" },
  OVERNIGHT: { label: "Overnight", detail: "Next business day · FedEx" },
  WHITE_GLOVE: {
    label: "White Glove International",
    detail: "Signature, climate-controlled · 7–14 days · DHL Express",
  },
};

function buttonClass(variant: StatusAction["variant"]) {
  switch (variant) {
    case "primary":
      return "bg-bourbon-gold text-bourbon-deep hover:bg-bourbon-amber";
    case "secondary":
      return "bg-white text-bourbon-deep border border-bourbon-deep/20 hover:border-bourbon-deep/50";
    case "danger":
      return "bg-white text-red-700 border border-red-300 hover:bg-red-50";
  }
}

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true },
  });

  if (!order) notFound();

  // Customer context. Lifetime counts only money actually confirmed — orders
  // sitting in PENDING are not revenue yet, and showing them as such would
  // flatter every first-time buyer who never paid.
  const [customerOrderCount, lifetimeAgg] = await Promise.all([
    prisma.order.count({ where: { email: order.email } }),
    prisma.order.aggregate({
      where: {
        email: order.email,
        status: { in: ["PAID", "SHIPPED", "DELIVERED"] },
      },
      _sum: { total: true },
    }),
  ]);
  const customerLifetime = Number(lifetimeAgg._sum.total ?? 0);

  const updateStatus = async (formData: FormData) => {
    "use server";
    const next = formData.get("next");
    if (typeof next !== "string") return;
    await updateOrderStatus(id, next as OrderStatus);
  };

  const saveNotes = updateOrderNotes.bind(null, id);

  const ship = SHIPPING_LABEL[order.shippingMethod];
  const subtotal = Number(order.subtotal);
  const discount = Number(order.discount);
  const shippingCost = Number(order.shippingCost);
  const tax = Number(order.tax);
  const total = Number(order.total);
  const discountRate = Number(order.discountRate);

  const actions = actionsFor(order.status);

  /* Unread badge for the chat panel. A separate cheap lookup rather than an
     include on the order query, so orders that have never been messaged about
     don't pay for a join. */
  const conversationUnread =
    (
      await prisma.conversation.findUnique({
        where: { orderId: order.id },
        select: { adminUnread: true },
      })
    )?.adminUnread ?? 0;

  const paymentDetails: PaymentDetailsData = {
    orderId: order.id,
    orderNumber: order.orderNumber,
    body: order.paymentDetailsBody,
    issuedAt: order.paymentDetailsIssuedAt?.toISOString() ?? null,
    issuedBy: order.paymentDetailsIssuedBy,
    actionable: order.status === "PENDING",
  };

  const settlement: SettlementData = {
    orderId: order.id,
    orderNumber: order.orderNumber,
    state: order.settlementState,
    // Prefer the snapshot taken at order time; fall back to the enum label for
    // orders placed before payment rails became configurable.
    paymentLabel: order.paymentLabel ?? PAYMENT_LABEL[order.paymentMethod],
    paymentInstructions: order.paymentInstructions,
    paymentReference: order.paymentReference,
    amountReceived:
      order.amountReceived !== null ? Number(order.amountReceived) : null,
    settlementNote: order.settlementNote,
    updatedAt: order.settlementUpdatedAt?.toISOString() ?? null,
    updatedBy: order.settlementUpdatedBy,
    // Signed at render time; the stored asset has no public URL.
    proofUrl: order.paymentProofPublicId
      ? signedProofUrl(order.paymentProofPublicId)
      : null,
    proofUploadedAt: order.paymentProofUploadedAt?.toISOString() ?? null,
    total,
    actionable: settlementIsActionable(order.status),
  };

  return (
    <>
      {/* Top: back link + header */}
      <div className="mb-6">
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-1 text-bourbon-stone hover:text-bourbon-deep text-xs tracking-widest uppercase transition-colors"
        >
          ← All orders
        </Link>
      </div>

      <header className="bg-white border border-bourbon-deep/10 p-5 sm:p-7 mb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-bourbon-gold text-[10px] tracking-[0.3em] uppercase mb-2">
              Order
            </p>
            <h1 className="font-[family-name:var(--font-playfair)] text-3xl sm:text-4xl font-bold text-bourbon-deep">
              {order.orderNumber}
            </h1>
            <p className="text-bourbon-stone text-sm mt-2">
              Placed{" "}
              {order.createdAt.toLocaleString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </p>
          </div>
          <span
            className={`px-3 py-1.5 text-xs font-bold tracking-widest uppercase ${ORDER_STATUS_BADGE[order.status]}`}
          >
            {order.status}
          </span>
        </div>

        {actions.length > 0 && (
          <div className="mt-5 pt-5 border-t border-bourbon-deep/10 flex flex-wrap gap-2">
            {actions.map((a) => (
              <form key={a.next} action={updateStatus}>
                <input type="hidden" name="next" value={a.next} />
                <button
                  type="submit"
                  className={`px-4 py-2 text-xs font-semibold tracking-widest uppercase transition-colors cursor-pointer ${buttonClass(a.variant)}`}
                >
                  {a.label}
                </button>
              </form>
            ))}
          </div>
        )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        <div className="space-y-6">
          {/* Customer + shipping */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <section className="bg-white border border-bourbon-deep/10 p-5">
              <h2 className="text-bourbon-stone text-[10px] tracking-widest uppercase mb-3">
                Customer
              </h2>
              <p className="text-bourbon-deep font-semibold">{order.fullName}</p>
              {/* Clickable so the operator can reply about a payment without
                  retyping anything. */}
              <a
                href={`mailto:${order.email}?subject=${encodeURIComponent(`Your Bourbon & Oak order ${order.orderNumber}`)}`}
                className="block text-bourbon-stone hover:text-bourbon-gold text-sm mt-1 break-words underline decoration-bourbon-deep/20 transition-colors"
              >
                {order.email}
              </a>
              {order.phone && (
                <a
                  href={`tel:${order.phone.replace(/[^\d+]/g, "")}`}
                  className="block text-bourbon-stone hover:text-bourbon-gold text-sm underline decoration-bourbon-deep/20 transition-colors"
                >
                  {order.phone}
                </a>
              )}

              {/* Customer history — is this a repeat buyer or a first-timer?
                  Relevant when deciding how hard to chase a payment. */}
              <div className="mt-3 pt-3 border-t border-bourbon-deep/10">
                {customerOrderCount > 1 ? (
                  <Link
                    href={`/admin/orders?q=${encodeURIComponent(order.email)}`}
                    className="text-bourbon-deep hover:text-bourbon-gold text-sm font-semibold transition-colors"
                  >
                    {customerOrderCount} orders from this customer →
                  </Link>
                ) : (
                  <p className="text-bourbon-stone text-sm">First order</p>
                )}
                {customerLifetime > 0 && (
                  <p className="text-bourbon-stone text-xs mt-1">
                    ${customerLifetime.toFixed(2)} confirmed lifetime
                  </p>
                )}
              </div>
            </section>

            <section className="bg-white border border-bourbon-deep/10 p-5">
              <h2 className="text-bourbon-stone text-[10px] tracking-widest uppercase mb-3">
                Shipping address
              </h2>
              <p className="text-bourbon-deep font-semibold">{order.fullName}</p>
              <p className="text-bourbon-stone text-sm leading-relaxed mt-1">
                {order.addressLine1}
                {order.addressLine2 ? (
                  <>
                    <br />
                    {order.addressLine2}
                  </>
                ) : null}
                <br />
                {order.city}, {order.region} {order.postal}
                <br />
                {order.country}
              </p>
            </section>

            {/* Shipping stopped being customer-selectable and is now always
                free, so this only shows for orders that actually carried a
                method and a charge. */}
            {shippingCost > 0 && (
              <section className="bg-white border border-bourbon-deep/10 p-5">
                <h2 className="text-bourbon-stone text-[10px] tracking-widest uppercase mb-3">
                  Shipping method
                </h2>
                <p className="text-bourbon-deep font-semibold">{ship.label}</p>
                <p className="text-bourbon-stone text-sm mt-1">{ship.detail}</p>
                <p className="text-bourbon-stone text-sm mt-3">
                  Cost:{" "}
                  <span className="text-bourbon-deep font-semibold">
                    ${shippingCost.toFixed(2)}
                  </span>
                </p>
              </section>
            )}

            {/* Settlement replaces the old read-only payment card: same
                information, plus the controls to actually confirm the money. */}
            <PaymentDetailsPanel data={paymentDetails} />

            <OrderChatPanel
              orderNumber={order.orderNumber}
              unread={conversationUnread}
            />

            <SettlementPanel data={settlement} />

            {discountRate > 0 && (
              <section className="bg-white border border-bourbon-deep/10 p-5">
                <h2 className="text-bourbon-stone text-[10px] tracking-widest uppercase mb-3">
                  Discount
                </h2>
                <p className="text-bourbon-stone text-sm">
                  Applied:{" "}
                  <span className="text-bourbon-gold font-semibold">
                    {Math.round(discountRate * 100)}%
                  </span>
                </p>
              </section>
            )}
          </div>

          {/* Items */}
          <section className="bg-white border border-bourbon-deep/10 overflow-hidden">
            <h2 className="px-5 py-4 border-b border-bourbon-deep/10 font-[family-name:var(--font-playfair)] text-lg font-bold text-bourbon-deep">
              Items
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead className="bg-bourbon-deep/5 border-b border-bourbon-deep/10 text-left text-[10px] tracking-widest uppercase text-bourbon-stone">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Bottle</th>
                    <th className="px-4 py-3 font-semibold text-right">Unit</th>
                    <th className="px-4 py-3 font-semibold text-right">Qty</th>
                    <th className="px-4 py-3 font-semibold text-right">Line total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-bourbon-deep/5">
                  {order.items.map((it) => {
                    const unit = Number(it.unitPrice);
                    return (
                      <tr key={it.id}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="relative w-12 h-12 shrink-0 bg-bourbon-deep/5 overflow-hidden">
                              {it.productImage ? (
                                <Image
                                  src={it.productImage}
                                  alt={it.productName}
                                  fill
                                  className="object-cover"
                                  sizes="48px"
                                  unoptimized
                                />
                              ) : null}
                            </div>
                            <div className="min-w-0">
                              <p className="text-bourbon-deep font-semibold leading-tight">
                                {it.productName}
                              </p>
                              {it.ageLabel && (
                                <p className="text-bourbon-stone text-[10px] tracking-widest uppercase mt-0.5">
                                  {it.ageLabel}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right text-bourbon-deep">
                          ${unit.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-right text-bourbon-deep">
                          {it.quantity}
                        </td>
                        <td className="px-4 py-3 text-right font-[family-name:var(--font-playfair)] font-bold text-bourbon-deep">
                          ${(unit * it.quantity).toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* Notes */}
          <section className="bg-white border border-bourbon-deep/10 p-5 sm:p-6">
            <h2 className="font-[family-name:var(--font-playfair)] text-lg font-bold text-bourbon-deep mb-3">
              Internal notes
            </h2>
            <form action={saveNotes} className="space-y-3">
              <textarea
                name="notes"
                rows={4}
                defaultValue={order.notes ?? ""}
                placeholder="Add a note for the team (only visible in admin)…"
                className="w-full bg-white border border-bourbon-deep/15 px-3 py-3 text-bourbon-deep text-sm focus:outline-none focus:border-bourbon-gold transition-colors resize-y"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-bourbon-deep text-bourbon-cream text-xs font-semibold tracking-widest uppercase hover:bg-bourbon-deep/85 transition-colors cursor-pointer"
              >
                Save notes
              </button>
            </form>
          </section>
        </div>

        {/* Totals */}
        <aside>
          <div className="lg:sticky lg:top-6 bg-white border border-bourbon-deep/10 p-5 sm:p-6">
            <h2 className="font-[family-name:var(--font-playfair)] text-lg font-bold text-bourbon-deep mb-4 pb-4 border-b border-bourbon-deep/10">
              Totals
            </h2>

            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between text-bourbon-stone">
                <span>Subtotal</span>
                <span className="text-bourbon-deep">${subtotal.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div className="flex items-center justify-between text-bourbon-gold font-semibold">
                  <span>Discount</span>
                  <span>−${discount.toFixed(2)}</span>
                </div>
              )}
              {shippingCost > 0 && (
                <div className="flex items-center justify-between text-bourbon-stone">
                  <span>Shipping</span>
                  <span className="text-bourbon-deep">
                    ${shippingCost.toFixed(2)}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between text-bourbon-stone">
                <span>Tax</span>
                <span className="text-bourbon-deep">${tax.toFixed(2)}</span>
              </div>
            </div>

            <div className="mt-5 pt-5 border-t border-bourbon-deep/10 flex items-baseline justify-between">
              <span className="text-bourbon-stone text-xs tracking-widest uppercase">
                Total
              </span>
              <span className="font-[family-name:var(--font-playfair)] text-3xl font-bold text-bourbon-deep">
                ${total.toFixed(2)}
              </span>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
