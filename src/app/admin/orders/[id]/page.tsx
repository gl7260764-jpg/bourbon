import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { OrderStatus, PaymentMethod, ShippingMethod } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { updateOrderNotes, updateOrderStatus } from "./actions";

export const metadata = { title: "Order | Admin" };

const STATUS_BADGE: Record<OrderStatus, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  PAID: "bg-emerald-100 text-emerald-800",
  SHIPPED: "bg-sky-100 text-sky-800",
  DELIVERED: "bg-bourbon-gold/20 text-bourbon-deep",
  CANCELLED: "bg-red-100 text-red-700",
  REFUNDED: "bg-bourbon-deep/10 text-bourbon-deep/70",
};

const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  CARD: "Credit or Debit Card",
  PAYPAL: "PayPal",
  CHIME: "Chime",
  APPLE_PAY: "Apple Pay",
  CRYPTO: "Cryptocurrency",
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

interface StatusAction {
  label: string;
  next: OrderStatus;
  variant: "primary" | "secondary" | "danger";
}

function actionsFor(status: OrderStatus): StatusAction[] {
  switch (status) {
    case "PENDING":
      return [
        { label: "Mark paid", next: "PAID", variant: "primary" },
        { label: "Cancel order", next: "CANCELLED", variant: "danger" },
      ];
    case "PAID":
      return [
        { label: "Mark shipped", next: "SHIPPED", variant: "primary" },
        { label: "Refund", next: "REFUNDED", variant: "secondary" },
        { label: "Cancel order", next: "CANCELLED", variant: "danger" },
      ];
    case "SHIPPED":
      return [
        { label: "Mark delivered", next: "DELIVERED", variant: "primary" },
        { label: "Refund", next: "REFUNDED", variant: "secondary" },
      ];
    case "DELIVERED":
      return [{ label: "Refund", next: "REFUNDED", variant: "secondary" }];
    case "CANCELLED":
    case "REFUNDED":
      return [];
  }
}

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
            className={`px-3 py-1.5 text-xs font-bold tracking-widest uppercase ${STATUS_BADGE[order.status]}`}
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
              <p className="text-bourbon-stone text-sm mt-1 break-words">
                {order.email}
              </p>
              {order.phone && (
                <p className="text-bourbon-stone text-sm">{order.phone}</p>
              )}
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

            <section className="bg-white border border-bourbon-deep/10 p-5">
              <h2 className="text-bourbon-stone text-[10px] tracking-widest uppercase mb-3">
                Shipping method
              </h2>
              <p className="text-bourbon-deep font-semibold">{ship.label}</p>
              <p className="text-bourbon-stone text-sm mt-1">{ship.detail}</p>
              <p className="text-bourbon-stone text-sm mt-3">
                Cost:{" "}
                <span className="text-bourbon-deep font-semibold">
                  {shippingCost === 0 ? "Free" : `$${shippingCost.toFixed(2)}`}
                </span>
              </p>
            </section>

            <section className="bg-white border border-bourbon-deep/10 p-5">
              <h2 className="text-bourbon-stone text-[10px] tracking-widest uppercase mb-3">
                Payment
              </h2>
              <p className="text-bourbon-deep font-semibold">
                {PAYMENT_LABEL[order.paymentMethod]}
              </p>
              {discountRate > 0 && (
                <p className="text-bourbon-stone text-sm mt-2">
                  Discount applied:{" "}
                  <span className="text-bourbon-gold font-semibold">
                    {Math.round(discountRate * 100)}%
                  </span>
                </p>
              )}
            </section>
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
              <div className="flex items-center justify-between text-bourbon-stone">
                <span>Shipping</span>
                <span className="text-bourbon-deep">
                  {shippingCost === 0 ? "Free" : `$${shippingCost.toFixed(2)}`}
                </span>
              </div>
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
