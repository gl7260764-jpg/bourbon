import Link from "next/link";
import { OrderStatus, PaymentMethod, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  ORDER_STATUS_BADGE,
  ORDER_STATUS_LABEL,
  SETTLEMENT_LABEL,
} from "@/lib/order-status";

export const metadata = { title: "Orders | Admin" };
export const dynamic = "force-dynamic";

const PAGE_SIZE = 25;

const STATUS_FILTERS: (OrderStatus | "all")[] = [
  "all",
  "PENDING",
  "PAID",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
];

const PAYMENT_LABEL: Record<PaymentMethod, string> = {
  CARD: "Card",
  PAYPAL: "PayPal",
  CHIME: "Chime",
  APPLE_PAY: "Apple Pay",
  CRYPTO: "Crypto",
  ZELLE: "Zelle",
  CASH_APP: "Cash App",
  OTHER: "Other",
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

const money = (v: Prisma.Decimal | number) => `$${Number(v).toFixed(2)}`;

interface SearchParams {
  status?: string;
  settlement?: string;
  q?: string;
  page?: string;
}

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const activeStatus: OrderStatus | "all" = isStatus(sp.status) ? sp.status : "all";
  // Only one settlement view matters as a queue: orders where the buyer has
  // sent a reference and someone needs to verify it.
  const verifyQueue = sp.settlement === "verify";
  const query = (sp.q ?? "").trim().slice(0, 80);
  const page = Math.max(1, Number(sp.page) || 1);

  // Search covers what an operator actually has to hand when a customer gets
  // in touch: the order number from their email, or their name/address.
  const searchWhere: Prisma.OrderWhereInput = query
    ? {
        OR: [
          { orderNumber: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } },
          { fullName: { contains: query, mode: "insensitive" } },
          { phone: { contains: query, mode: "insensitive" } },
        ],
      }
    : {};

  const where: Prisma.OrderWhereInput = {
    ...searchWhere,
    ...(activeStatus === "all" ? {} : { status: activeStatus }),
    ...(verifyQueue ? { settlementState: "PROOF_SUBMITTED" as const } : {}),
  };

  // Tab counts are computed with search + settlement applied but the status
  // dimension stripped, so each tab reports its own real size rather than the
  // size of the tab you're already on.
  const countWhere: Prisma.OrderWhereInput = {
    ...searchWhere,
    ...(verifyQueue ? { settlementState: "PROOF_SUBMITTED" as const } : {}),
  };

  const [orders, totalCount, verifyCount, statusGroups] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        orderNumber: true,
        fullName: true,
        email: true,
        total: true,
        status: true,
        paymentMethod: true,
        paymentLabel: true,
        settlementState: true,
        paymentProofPublicId: true,
        createdAt: true,
        _count: { select: { items: true } },
      },
    }),
    prisma.order.count({ where }),
    prisma.order.count({ where: { settlementState: "PROOF_SUBMITTED" } }),
    prisma.order.groupBy({
      by: ["status"],
      where: countWhere,
      _count: { _all: true },
    }),
  ]);

  const countByStatus = new Map(statusGroups.map((g) => [g.status, g._count._all]));
  const allCount = statusGroups.reduce((n, g) => n + g._count._all, 0);
  const pageCount = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  /** Merge a change into the current params so no control drops another's state. */
  function buildHref(changes: Partial<SearchParams>) {
    const next = new URLSearchParams();
    const merged: SearchParams = {
      status: activeStatus === "all" ? undefined : activeStatus,
      settlement: verifyQueue ? "verify" : undefined,
      q: query || undefined,
      page: page > 1 ? String(page) : undefined,
      ...changes,
    };
    for (const [k, v] of Object.entries(merged)) {
      if (v !== undefined && v !== null && v !== "") next.set(k, String(v));
    }
    const qs = next.toString();
    return qs ? `/admin/orders?${qs}` : "/admin/orders";
  }

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
          {activeStatus !== "all" ? ` · ${ORDER_STATUS_LABEL[activeStatus]}` : ""}
          {verifyQueue ? " · awaiting verification" : ""}
          {query ? ` · matching “${query}”` : ""}
        </p>
      </div>

      {/* Verification queue — a count that is also the filter. */}
      {(verifyCount > 0 || verifyQueue) && (
        <Link
          href={verifyQueue ? buildHref({ settlement: undefined, page: undefined }) : buildHref({ settlement: "verify", page: undefined })}
          className={`flex items-center gap-3 mb-5 p-4 border transition-colors ${
            verifyQueue
              ? "bg-sky-50 border-sky-300"
              : "bg-white border-sky-200 hover:border-sky-400"
          }`}
        >
          <span className="font-[family-name:var(--font-playfair)] text-3xl font-bold text-sky-800 leading-none">
            {verifyCount}
          </span>
          <span className="flex-1">
            <span className="block text-bourbon-deep text-sm font-semibold">
              {verifyCount === 1 ? "Payment" : "Payments"} awaiting verification
            </span>
            <span className="block text-bourbon-stone text-xs">
              {verifyQueue
                ? "Showing the queue — click to clear this filter."
                : "The buyer sent a receipt or reference. Check the money landed, then confirm."}
            </span>
          </span>
        </Link>
      )}

      {/* Search — a GET form, so the URL stays the only list state. */}
      <form method="GET" action="/admin/orders" className="flex gap-2 mb-5">
        {activeStatus !== "all" && (
          <input type="hidden" name="status" value={activeStatus} />
        )}
        {verifyQueue && <input type="hidden" name="settlement" value="verify" />}
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Search order #, name, email or phone…"
          className="flex-1 px-4 py-2.5 bg-white border border-bourbon-deep/15 text-bourbon-deep text-sm focus:outline-none focus:border-bourbon-gold transition-colors"
        />
        <button
          type="submit"
          className="px-5 py-2.5 bg-bourbon-deep text-bourbon-cream text-xs font-semibold tracking-widest uppercase hover:bg-bourbon-gold hover:text-bourbon-deep transition-colors cursor-pointer"
        >
          Search
        </button>
        {query && (
          <Link
            href={buildHref({ q: undefined, page: undefined })}
            className="px-5 py-2.5 border border-bourbon-deep/20 text-bourbon-deep text-xs tracking-widest uppercase hover:border-bourbon-gold transition-colors flex items-center"
          >
            Clear
          </Link>
        )}
      </form>

      {/* Status chips, each carrying its own count. */}
      <div className="flex flex-wrap gap-2 mb-6">
        {STATUS_FILTERS.map((value) => {
          const active = activeStatus === value;
          const count = value === "all" ? allCount : countByStatus.get(value) ?? 0;
          return (
            <Link
              key={value}
              href={buildHref({
                status: value === "all" ? undefined : value,
                page: undefined,
              })}
              className={`px-3 py-1.5 text-xs font-semibold tracking-widest uppercase border transition-colors ${
                active
                  ? "bg-bourbon-deep text-bourbon-cream border-bourbon-deep"
                  : "bg-white text-bourbon-deep border-bourbon-deep/15 hover:border-bourbon-deep/40"
              }`}
            >
              {value === "all" ? "All" : ORDER_STATUS_LABEL[value]}
              <span className={active ? "text-bourbon-cream/60" : "text-bourbon-stone"}>
                {" "}
                {count}
              </span>
            </Link>
          );
        })}
      </div>

      <section className="bg-white border border-bourbon-deep/10">
        {orders.length === 0 ? (
          <p className="px-5 py-12 text-bourbon-stone text-sm text-center">
            {query
              ? `Nothing matches “${query}”.`
              : "No orders to show. Try a different filter."}
          </p>
        ) : (
          <>
            {/* Table at lg+ */}
            <div className="hidden lg:block overflow-x-auto">
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
                    <tr key={o.id} className="hover:bg-bourbon-gold/5 transition-colors">
                      <td className="px-4 py-3 align-top">
                        <Link
                          href={`/admin/orders/${o.id}`}
                          className="font-[family-name:var(--font-playfair)] font-bold text-bourbon-deep hover:text-bourbon-gold transition-colors"
                        >
                          {o.orderNumber}
                        </Link>
                        <div className="text-bourbon-stone text-xs mt-0.5">
                          {o._count.items} item{o._count.items === 1 ? "" : "s"}
                        </div>
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
                        <div className="text-bourbon-deep font-semibold">{o.fullName}</div>
                        <div className="text-bourbon-stone text-xs">{o.email}</div>
                      </td>
                      <td className="px-4 py-3 align-top text-bourbon-deep">
                        {o.paymentLabel ?? PAYMENT_LABEL[o.paymentMethod]}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <span
                          className={`inline-block px-2 py-1 text-[10px] font-bold tracking-widest uppercase ${ORDER_STATUS_BADGE[o.status]}`}
                        >
                          {ORDER_STATUS_LABEL[o.status]}
                        </span>
                        {o.status === "PENDING" && (
                          <div className="text-bourbon-stone text-[11px] mt-1">
                            {SETTLEMENT_LABEL[o.settlementState]}
                            {o.paymentProofPublicId ? " · receipt" : ""}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 align-top text-right">
                        <span className="font-[family-name:var(--font-playfair)] font-bold text-bourbon-deep">
                          {money(o.total)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Cards below lg — the same data, no sideways scrolling. */}
            <ul className="lg:hidden divide-y divide-bourbon-deep/5">
              {orders.map((o) => (
                <li key={o.id}>
                  <Link
                    href={`/admin/orders/${o.id}`}
                    className="block p-4 hover:bg-bourbon-gold/5 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <span className="font-[family-name:var(--font-playfair)] font-bold text-bourbon-deep">
                        {o.orderNumber}
                      </span>
                      <span className="font-[family-name:var(--font-playfair)] text-lg font-bold text-bourbon-deep">
                        {money(o.total)}
                      </span>
                    </div>
                    <p className="text-bourbon-deep text-sm font-semibold">{o.fullName}</p>
                    <p className="text-bourbon-stone text-xs break-words">{o.email}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      <span
                        className={`px-2 py-1 text-[10px] font-bold tracking-widest uppercase ${ORDER_STATUS_BADGE[o.status]}`}
                      >
                        {ORDER_STATUS_LABEL[o.status]}
                      </span>
                      {o.status === "PENDING" && o.paymentProofPublicId && (
                        <span className="px-2 py-1 text-[10px] font-bold tracking-widest uppercase bg-sky-100 text-sky-800">
                          Receipt
                        </span>
                      )}
                      <span className="text-bourbon-stone text-xs">
                        {o.createdAt.toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}{" "}
                        · {o._count.items} item{o._count.items === 1 ? "" : "s"}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      {/* Pagination. The old page silently capped at 100 orders with no way to
          reach the rest. */}
      {pageCount > 1 && (
        <div className="flex items-center justify-between gap-3 mt-5">
          <span className="text-bourbon-stone text-xs">
            Page {page} of {pageCount} · showing{" "}
            {(page - 1) * PAGE_SIZE + 1}–
            {Math.min(page * PAGE_SIZE, totalCount)} of {totalCount}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={buildHref({ page: page - 1 === 1 ? undefined : String(page - 1) })}
                className="px-4 py-2 border border-bourbon-deep/20 text-bourbon-deep text-xs tracking-widest uppercase hover:border-bourbon-gold transition-colors"
              >
                ← Newer
              </Link>
            )}
            {page < pageCount && (
              <Link
                href={buildHref({ page: String(page + 1) })}
                className="px-4 py-2 border border-bourbon-deep/20 text-bourbon-deep text-xs tracking-widest uppercase hover:border-bourbon-gold transition-colors"
              >
                Older →
              </Link>
            )}
          </div>
        </div>
      )}
    </>
  );
}
