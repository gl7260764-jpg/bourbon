import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Dashboard | Admin" };

function formatCurrency(n: number) {
  return n.toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

async function getStats() {
  const [
    productCount,
    categoryCount,
    orderCount,
    pendingOrderCount,
    unreadMessageCount,
    lowStockProducts,
    recentOrders,
    revenueAgg,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.category.count(),
    prisma.order.count(),
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.contactMessage.count({ where: { status: "UNREAD" } }),
    prisma.product.findMany({
      where: { stockBottles: { lt: 25 } },
      orderBy: { stockBottles: "asc" },
      take: 5,
      select: { id: true, slug: true, name: true, stockBottles: true, availability: true },
    }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        orderNumber: true,
        fullName: true,
        total: true,
        status: true,
        createdAt: true,
      },
    }),
    prisma.order.aggregate({
      _sum: { total: true },
      where: { status: { in: ["PAID", "SHIPPED", "DELIVERED"] } },
    }),
  ]);

  return {
    productCount,
    categoryCount,
    orderCount,
    pendingOrderCount,
    unreadMessageCount,
    lowStockProducts,
    recentOrders,
    revenue: revenueAgg._sum.total ? Number(revenueAgg._sum.total) : 0,
  };
}

export default async function AdminDashboard() {
  const stats = await getStats();

  const cards = [
    { label: "Revenue (paid+)", value: formatCurrency(stats.revenue), accent: true, href: "/admin/orders" },
    { label: "Orders", value: stats.orderCount.toString(), sub: `${stats.pendingOrderCount} pending`, href: "/admin/orders" },
    { label: "Products", value: stats.productCount.toString(), href: "/admin/products" },
    { label: "Categories", value: stats.categoryCount.toString(), href: "/admin/categories" },
    { label: "Unread messages", value: stats.unreadMessageCount.toString(), href: "/admin/messages" },
  ];

  return (
    <>
      <div className="mb-8">
        <p className="text-bourbon-gold text-xs tracking-[0.3em] uppercase mb-2">Overview</p>
        <h1 className="font-[family-name:var(--font-playfair)] text-3xl sm:text-4xl font-bold text-bourbon-deep">
          Dashboard
        </h1>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-10">
        {cards.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className={`group bg-white border border-bourbon-deep/10 p-5 hover:border-bourbon-gold transition-colors ${
              c.accent ? "ring-1 ring-bourbon-gold/30" : ""
            }`}
          >
            <p className="text-bourbon-stone text-[10px] tracking-widest uppercase mb-2">
              {c.label}
            </p>
            <p className="font-[family-name:var(--font-playfair)] text-3xl font-bold text-bourbon-deep">
              {c.value}
            </p>
            {c.sub && <p className="text-bourbon-stone text-xs mt-1">{c.sub}</p>}
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent orders */}
        <section className="bg-white border border-bourbon-deep/10">
          <div className="flex items-center justify-between px-5 py-4 border-b border-bourbon-deep/10">
            <h2 className="font-[family-name:var(--font-playfair)] text-lg font-bold text-bourbon-deep">
              Recent orders
            </h2>
            <Link href="/admin/orders" className="text-bourbon-gold text-xs tracking-widest uppercase hover:text-bourbon-amber transition-colors">
              View all →
            </Link>
          </div>
          {stats.recentOrders.length === 0 ? (
            <p className="px-5 py-8 text-bourbon-stone text-sm text-center">
              No orders yet. The first one will land here.
            </p>
          ) : (
            <ul className="divide-y divide-bourbon-deep/5">
              {stats.recentOrders.map((o) => (
                <li key={o.id}>
                  <Link
                    href={`/admin/orders/${o.id}`}
                    className="flex items-center justify-between gap-4 px-5 py-3 hover:bg-bourbon-gold/5 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-bourbon-deep font-semibold truncate">{o.fullName}</p>
                      <p className="text-bourbon-stone text-xs">
                        {o.orderNumber} · {new Date(o.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-[family-name:var(--font-playfair)] font-bold text-bourbon-deep">
                        ${Number(o.total).toFixed(2)}
                      </p>
                      <p className="text-bourbon-stone text-[10px] tracking-widest uppercase">
                        {o.status}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Low stock */}
        <section className="bg-white border border-bourbon-deep/10">
          <div className="flex items-center justify-between px-5 py-4 border-b border-bourbon-deep/10">
            <h2 className="font-[family-name:var(--font-playfair)] text-lg font-bold text-bourbon-deep">
              Low stock
            </h2>
            <Link href="/admin/products" className="text-bourbon-gold text-xs tracking-widest uppercase hover:text-bourbon-amber transition-colors">
              All products →
            </Link>
          </div>
          {stats.lowStockProducts.length === 0 ? (
            <p className="px-5 py-8 text-bourbon-stone text-sm text-center">
              Nothing below 25 bottles. Cellar is healthy.
            </p>
          ) : (
            <ul className="divide-y divide-bourbon-deep/5">
              {stats.lowStockProducts.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/admin/products/${p.id}`}
                    className="flex items-center justify-between gap-4 px-5 py-3 hover:bg-bourbon-gold/5 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-bourbon-deep font-semibold truncate">{p.name}</p>
                      <p className="text-bourbon-stone text-[10px] tracking-widest uppercase">
                        {p.availability}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 text-[11px] font-bold tracking-widest uppercase ${
                        p.stockBottles === 0
                          ? "bg-red-100 text-red-700"
                          : p.stockBottles < 10
                            ? "bg-amber-100 text-amber-800"
                            : "bg-bourbon-gold/15 text-bourbon-deep"
                      }`}
                    >
                      {p.stockBottles} btl
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
