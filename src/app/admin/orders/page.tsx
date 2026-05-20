import Link from "next/link";
import { OrderStatus, PaymentMethod, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Orders | Admin" };

const STATUS_FILTERS: { label: string; value: OrderStatus | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Pending", value: "PENDING" },
  { label: "Paid", value: "PAID" },
  { label: "Shipped", value: "SHIPPED" },
  { label: "Delivered", value: "DELIVERED" },
  { label: "Cancelled", value: "CANCELLED" },
  { label: "Refunded", value: "REFUNDED" },
];

const STATUS_BADGE: Record<OrderStatus, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  PAID: "bg-emerald-100 text-emerald-800",
  SHIPPED: "bg-sky-100 text-sky-800",
  DELIVERED: "bg-bourbon-gold/20 text-bourbon-deep",
  CANCELLED: "bg-red-100 text-red-700",
  REFUNDED: "bg-bourbon-deep/10 text-bourbon-deep/70",
};

const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  CARD: "Card",
  PAYPAL: "PayPal",
  CHIME: "Chime",
  APPLE_PAY: "Apple Pay",
  CRYPTO: "Crypto",
};

function isStatus(v: string | undefined): v is OrderStatus {
  return (
    v === "PENDING" ||
    v === "PAID" ||
    v === "SHIPPED" ||
    v === "DELIVERED" ||
    v === "CANCELLED" ||
    v === "REFUNDED"
  );
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const activeStatus: OrderStatus | "all" = isStatus(status) ? status : "all";

  const where: Prisma.OrderWhereInput =
    activeStatus === "all" ? {} : { status: activeStatus };

  const [orders, totalCount] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        orderNumber: true,
        fullName: true,
        email: true,
        total: true,
        status: true,
        paymentMethod: true,
        createdAt: true,
      },
    }),
    prisma.order.count({ where }),
  ]);

  return (
    <>
      <div className="mb-8">
        <p className="text-bourbon-gold text-xs tracking-[0.3em] uppercase mb-2">
          Cellar Operations
        </p>
        <h1 className="font-[family-name:var(--font-playfair)] text-3xl sm:text-4xl font-bold text-bourbon-deep">
          Orders
        </h1>
        <p className="text-bourbon-stone text-sm mt-2">
          {totalCount} {totalCount === 1 ? "order" : "orders"}
          {activeStatus !== "all" ? ` in ${activeStatus.toLowerCase()}` : ""}.
        </p>
      </div>

      {/* Status filter chips */}
      <div className="flex flex-wrap gap-2 mb-6">
        {STATUS_FILTERS.map((f) => {
          const active = activeStatus === f.value;
          const href =
            f.value === "all" ? "/admin/orders" : `/admin/orders?status=${f.value}`;
          return (
            <Link
              key={f.value}
              href={href}
              className={`px-3 py-1.5 text-xs font-semibold tracking-widest uppercase border transition-colors ${
                active
                  ? "bg-bourbon-deep text-bourbon-cream border-bourbon-deep"
                  : "bg-white text-bourbon-deep border-bourbon-deep/15 hover:border-bourbon-deep/40"
              }`}
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      <section className="bg-white border border-bourbon-deep/10 overflow-hidden">
        {orders.length === 0 ? (
          <p className="px-5 py-12 text-bourbon-stone text-sm text-center">
            No orders to show. Try a different filter.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-bourbon-deep/5 border-b border-bourbon-deep/10">
                <tr className="text-left text-[10px] tracking-widest uppercase text-bourbon-stone">
                  <th className="px-4 py-3 font-semibold">Order #</th>
                  <th className="px-4 py-3 font-semibold">Date</th>
                  <th className="px-4 py-3 font-semibold">Customer</th>
                  <th className="px-4 py-3 font-semibold">Payment</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-bourbon-deep/5">
                {orders.map((o) => (
                  <tr
                    key={o.id}
                    className="hover:bg-bourbon-gold/5 transition-colors"
                  >
                    <td className="px-4 py-3 align-top">
                      <Link
                        href={`/admin/orders/${o.id}`}
                        className="font-[family-name:var(--font-playfair)] font-bold text-bourbon-deep hover:text-bourbon-gold transition-colors"
                      >
                        {o.orderNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3 align-top text-bourbon-stone">
                      <div>
                        {o.createdAt.toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </div>
                      <div className="text-bourbon-stone/70 text-xs">
                        {o.createdAt.toLocaleTimeString(undefined, {
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="text-bourbon-deep font-semibold">
                        {o.fullName}
                      </div>
                      <div className="text-bourbon-stone text-xs">{o.email}</div>
                    </td>
                    <td className="px-4 py-3 align-top text-bourbon-deep">
                      {PAYMENT_LABEL[o.paymentMethod]}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <span
                        className={`inline-block px-2 py-1 text-[10px] font-bold tracking-widest uppercase ${STATUS_BADGE[o.status]}`}
                      >
                        {o.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 align-top text-right">
                      <span className="font-[family-name:var(--font-playfair)] font-bold text-bourbon-deep">
                        ${Number(o.total).toFixed(2)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
