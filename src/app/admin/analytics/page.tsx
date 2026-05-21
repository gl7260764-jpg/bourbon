import Image from "next/image";
import Link from "next/link";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { countryFlag, countryName } from "@/lib/geo";

export const metadata = { title: "Analytics | Admin" };
export const dynamic = "force-dynamic";

const DAYS_WINDOW = 30;

function formatMoney(v: number): string {
  return `$${v.toFixed(2)}`;
}

function startOfUtcDay(offsetDays: number): Date {
  const now = new Date();
  return new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() - offsetDays,
    ),
  );
}

function dayKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function buildDayRange(days: number): { key: string; label: string }[] {
  const out: { key: string; label: string }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = startOfUtcDay(i);
    out.push({
      key: dayKey(d),
      label: d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        timeZone: "UTC",
      }),
    });
  }
  return out;
}

export default async function AnalyticsPage() {
  const since = startOfUtcDay(DAYS_WINDOW - 1);
  const startOfToday = startOfUtcDay(0);
  const startOfLast7 = startOfUtcDay(6);

  // Run everything in parallel — they're independent reads.
  const [
    totalOrders,
    totalRevenueAgg,
    totalVisitors,
    visitorsToday,
    visitors7d,
    ordersByDayRaw,
    visitsByDayRaw,
    topProductsRaw,
    topCountriesRaw,
  ] = await Promise.all([
    prisma.order.count(),
    prisma.order.aggregate({ _sum: { total: true } }),
    prisma.visitor.count(),
    prisma.visitDay.count({ where: { date: { gte: startOfToday } } }),
    prisma.visitDay
      .findMany({
        where: { date: { gte: startOfLast7 } },
        distinct: ["visitorId"],
        select: { visitorId: true },
      })
      .then((rows) => rows.length),
    prisma.$queryRaw<{ day: Date; orders: bigint; revenue: Prisma.Decimal | null }[]>`
      SELECT date_trunc('day', "createdAt") AS day,
             COUNT(*)::bigint            AS orders,
             COALESCE(SUM("total"), 0)   AS revenue
      FROM "Order"
      WHERE "createdAt" >= ${since}
      GROUP BY day
      ORDER BY day ASC
    `,
    prisma.$queryRaw<{ day: Date; visitors: bigint }[]>`
      SELECT "date" AS day,
             COUNT(DISTINCT "visitorId")::bigint AS visitors
      FROM "VisitDay"
      WHERE "date" >= ${since}
      GROUP BY day
      ORDER BY day ASC
    `,
    prisma.$queryRaw<{ productId: string; units: bigint; revenue: Prisma.Decimal | null }[]>`
      SELECT "productId",
             SUM("quantity")::bigint              AS units,
             SUM("unitPrice" * "quantity")        AS revenue
      FROM "OrderItem"
      WHERE "productId" IS NOT NULL
      GROUP BY "productId"
      ORDER BY units DESC
      LIMIT 10
    `,
    prisma.visitor.groupBy({
      by: ["countryCode"],
      _count: { _all: true },
      where: { countryCode: { not: null } },
      orderBy: { _count: { countryCode: "desc" } },
      take: 10,
    }),
  ]);

  const totalRevenue = Number(totalRevenueAgg._sum.total ?? 0);

  // Hydrate top-product rows with product info.
  const topProductIds = topProductsRaw.map((r) => r.productId);
  const topProductInfo = topProductIds.length
    ? await prisma.product.findMany({
        where: { id: { in: topProductIds } },
        select: {
          id: true,
          name: true,
          slug: true,
          bottlePrice: true,
          images: {
            where: { isPrimary: true },
            take: 1,
            select: { url: true, alt: true },
          },
        },
      })
    : [];
  const productMap = new Map(topProductInfo.map((p) => [p.id, p]));

  const topProducts = topProductsRaw
    .map((r) => {
      const p = productMap.get(r.productId);
      if (!p) return null;
      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        image: p.images[0]?.url ?? null,
        alt: p.images[0]?.alt ?? p.name,
        unitsSold: Number(r.units),
        revenue: Number(r.revenue ?? 0),
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  // Build a continuous day series so charts have one bar per day even when
  // some days had zero activity.
  const dayRange = buildDayRange(DAYS_WINDOW);
  const ordersByDay = new Map(
    ordersByDayRaw.map((r) => [dayKey(r.day), { orders: Number(r.orders), revenue: Number(r.revenue ?? 0) }]),
  );
  const visitsByDay = new Map(
    visitsByDayRaw.map((r) => [dayKey(r.day), Number(r.visitors)]),
  );

  const ordersSeries = dayRange.map((d) => ({
    label: d.label,
    value: ordersByDay.get(d.key)?.orders ?? 0,
  }));
  const visitsSeries = dayRange.map((d) => ({
    label: d.label,
    value: visitsByDay.get(d.key) ?? 0,
  }));

  const topCountries = topCountriesRaw.map((r) => ({
    code: r.countryCode!,
    name: countryName(r.countryCode) ?? r.countryCode!,
    count: r._count._all,
  }));

  const maxCountry = topCountries.reduce((m, c) => Math.max(m, c.count), 0);

  return (
    <>
      <div className="mb-8">
        <p className="text-bourbon-gold text-xs tracking-[0.3em] uppercase mb-2">
          Insights
        </p>
        <h1 className="font-[family-name:var(--font-playfair)] text-3xl sm:text-4xl font-bold text-bourbon-deep">
          Analytics
        </h1>
        <p className="text-bourbon-stone text-sm mt-2">
          Orders, visitors, and product performance over the last {DAYS_WINDOW} days.
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <Kpi label="Total orders" value={totalOrders.toLocaleString()} />
        <Kpi label="Total revenue" value={formatMoney(totalRevenue)} />
        <Kpi label="Unique visitors" value={totalVisitors.toLocaleString()} sub="all time" />
        <Kpi
          label="Visitors today"
          value={visitorsToday.toLocaleString()}
          sub={`${visitors7d.toLocaleString()} in last 7d`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
        <ChartCard title="Orders per day" data={ordersSeries} accent="gold" />
        <ChartCard title="Unique visitors per day" data={visitsSeries} accent="deep" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top products */}
        <section className="bg-white border border-bourbon-deep/10 p-5 sm:p-6">
          <div className="flex items-baseline justify-between mb-4 pb-4 border-b border-bourbon-deep/10">
            <h2 className="font-[family-name:var(--font-playfair)] text-xl font-bold text-bourbon-deep">
              Most ordered
            </h2>
            <span className="text-bourbon-stone text-[10px] tracking-widest uppercase">
              Top 10
            </span>
          </div>
          {topProducts.length === 0 ? (
            <p className="text-bourbon-stone text-sm py-6 text-center">
              No orders placed yet.
            </p>
          ) : (
            <ol className="space-y-3">
              {topProducts.map((p, idx) => (
                <li key={p.id} className="flex items-center gap-3">
                  <span className="w-6 text-bourbon-stone text-xs font-semibold text-right">
                    {idx + 1}
                  </span>
                  <div className="relative w-12 h-12 shrink-0 bg-bourbon-deep/5 overflow-hidden">
                    {p.image && (
                      <Image
                        src={p.image}
                        alt={p.alt}
                        fill
                        className="object-cover"
                        sizes="48px"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/products/${p.slug}`}
                      target="_blank"
                      className="text-bourbon-deep text-sm font-semibold hover:text-bourbon-gold transition-colors truncate block"
                    >
                      {p.name}
                    </Link>
                    <p className="text-bourbon-stone text-xs mt-0.5">
                      {p.unitsSold.toLocaleString()} unit{p.unitsSold === 1 ? "" : "s"} · {formatMoney(p.revenue)}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>

        {/* Top countries */}
        <section className="bg-white border border-bourbon-deep/10 p-5 sm:p-6">
          <div className="flex items-baseline justify-between mb-4 pb-4 border-b border-bourbon-deep/10">
            <h2 className="font-[family-name:var(--font-playfair)] text-xl font-bold text-bourbon-deep">
              Visitors by country
            </h2>
            <span className="text-bourbon-stone text-[10px] tracking-widest uppercase">
              Top 10
            </span>
          </div>
          {topCountries.length === 0 ? (
            <p className="text-bourbon-stone text-sm py-6 text-center">
              No location data yet. Deploy to production so Vercel headers populate the country.
            </p>
          ) : (
            <ul className="space-y-3">
              {topCountries.map((c) => {
                const pct = maxCountry > 0 ? (c.count / maxCountry) * 100 : 0;
                return (
                  <li key={c.code} className="flex items-center gap-3">
                    <span className="text-2xl shrink-0 leading-none">
                      {countryFlag(c.code)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-bourbon-deep text-sm font-semibold truncate">
                          {c.name}
                        </span>
                        <span className="text-bourbon-stone text-xs whitespace-nowrap">
                          {c.count.toLocaleString()} visitor{c.count === 1 ? "" : "s"}
                        </span>
                      </div>
                      <div className="h-1.5 bg-bourbon-deep/5 overflow-hidden">
                        <div
                          className="h-full bg-bourbon-gold"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}

function Kpi({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white border border-bourbon-deep/10 p-4 sm:p-5">
      <p className="text-bourbon-stone text-[10px] tracking-widest uppercase mb-1.5">
        {label}
      </p>
      <p className="font-[family-name:var(--font-playfair)] text-2xl sm:text-3xl font-bold text-bourbon-deep leading-none">
        {value}
      </p>
      {sub && (
        <p className="text-bourbon-stone text-xs mt-2">{sub}</p>
      )}
    </div>
  );
}

function ChartCard({
  title,
  data,
  accent,
}: {
  title: string;
  data: { label: string; value: number }[];
  accent: "gold" | "deep";
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const total = data.reduce((s, d) => s + d.value, 0);
  const barColor = accent === "gold" ? "bg-bourbon-gold" : "bg-bourbon-deep";

  return (
    <section className="bg-white border border-bourbon-deep/10 p-5 sm:p-6">
      <div className="flex items-baseline justify-between mb-4 pb-4 border-b border-bourbon-deep/10">
        <h2 className="font-[family-name:var(--font-playfair)] text-xl font-bold text-bourbon-deep">
          {title}
        </h2>
        <span className="text-bourbon-stone text-[10px] tracking-widest uppercase">
          {total.toLocaleString()} total
        </span>
      </div>

      <div className="flex items-end gap-[2px] h-32">
        {data.map((d, i) => {
          const heightPct = (d.value / max) * 100;
          return (
            <div
              key={i}
              className="flex-1 flex flex-col justify-end h-full group relative"
              title={`${d.label}: ${d.value}`}
            >
              <div
                className={`${barColor} w-full transition-opacity group-hover:opacity-80`}
                style={{ height: `${heightPct}%`, minHeight: d.value > 0 ? 2 : 0 }}
              />
              {/* Tooltip */}
              <span className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-1 bg-bourbon-deep text-bourbon-cream text-[10px] tracking-wider rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-10">
                {d.label}: {d.value}
              </span>
            </div>
          );
        })}
      </div>

      <div className="flex justify-between mt-2 text-[10px] text-bourbon-stone">
        <span>{data[0]?.label}</span>
        <span>{data[Math.floor(data.length / 2)]?.label}</span>
        <span>{data[data.length - 1]?.label}</span>
      </div>
    </section>
  );
}
