import Image from "next/image";
import Link from "next/link";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { countryFlag, countryName } from "@/lib/geo";
import { visitorLabel, deviceLabel, formatDuration } from "@/lib/visitor";

export const metadata = { title: "Analytics | Admin" };
export const dynamic = "force-dynamic";

const DAYS_WINDOW = 30;
// Rows per page in the all-visitors table.
const VISITORS_PAGE_SIZE = 25;

/* Whitelisted sort orders. The column has to be interpolated raw (you cannot
   parameterise ORDER BY), so it must never come from user input directly —
   the key is looked up in this map and anything unrecognised falls back to
   `recent`. */
const VISITOR_SORTS = {
  recent: Prisma.sql`v."lastSeenAt" DESC`,
  time: Prisma.sql`total_ms DESC, v."lastSeenAt" DESC`,
  pages: Prisma.sql`views DESC, v."lastSeenAt" DESC`,
} as const;
type VisitorSort = keyof typeof VISITOR_SORTS;

type VisitorRow = {
  id: string;
  countryCode: string | null;
  city: string | null;
  userAgent: string | null;
  email: string | null;
  firstSeenAt: Date;
  lastSeenAt: Date;
  views: number;
  sessions: number;
  total_ms: number;
};

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

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; sort?: string }>;
}) {
  const sp = await searchParams;
  const sortKey: VisitorSort =
    sp.sort === "time" || sp.sort === "pages" ? sp.sort : "recent";
  const pageNum = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);
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
    newVisitorsWindow,
    returningVisitorsWindow,
    repeatVisitorsAllTime,
    pageViewsWindow,
    identifiedVisitors,
    subscriberSources,
    newVsReturningRaw,
    topPagesRaw,
    visitorRows,
    visitorTotal,
    sessionTimeRaw,
    pageTimeRaw,
    topPagesByTimeRaw,
    sessionsWindow,
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

    // First-ever visit landed inside the window.
    prisma.visitor.count({ where: { firstSeenAt: { gte: since } } }),

    // Came back on a later day than the one they were first seen — this is
    // the "old visitors return" number.
    prisma.$queryRaw<{ c: bigint }[]>`
      SELECT COUNT(DISTINCT vd."visitorId")::bigint AS c
      FROM "VisitDay" vd
      JOIN "Visitor" v ON v."id" = vd."visitorId"
      WHERE vd."date" >= ${since}
        AND v."firstSeenAt" < vd."date"
    `.then((r) => Number(r[0]?.c ?? 0)),

    // All-time loyalty: visitors seen on more than one distinct day.
    prisma.$queryRaw<{ c: bigint }[]>`
      SELECT COUNT(*)::bigint AS c FROM (
        SELECT "visitorId" FROM "VisitDay"
        GROUP BY "visitorId" HAVING COUNT(*) > 1
      ) AS repeats
    `.then((r) => Number(r[0]?.c ?? 0)),

    prisma.pageView.count({ where: { createdAt: { gte: since } } }),

    // Anonymous devices that have handed over an email.
    prisma.visitor.count({ where: { email: { not: null } } }),

    // Where those addresses came from — tells you whether the popup is
    // actually pulling its weight against the footer form.
    prisma.subscriber.groupBy({
      by: ["source"],
      _count: { _all: true },
      orderBy: { _count: { source: "desc" } },
      take: 6,
    }),

    // Per-day split. VisitDay is unique on (visitorId, date), so COUNT(*) is
    // already a distinct-visitor count.
    prisma.$queryRaw<{ day: Date; newv: bigint; returningv: bigint }[]>`
      SELECT vd."date" AS day,
             COUNT(*) FILTER (
               WHERE v."firstSeenAt" >= vd."date"
                 AND v."firstSeenAt" < vd."date" + INTERVAL '1 day'
             )::bigint AS newv,
             COUNT(*) FILTER (WHERE v."firstSeenAt" < vd."date")::bigint AS returningv
      FROM "VisitDay" vd
      JOIN "Visitor" v ON v."id" = vd."visitorId"
      WHERE vd."date" >= ${since}
      GROUP BY day
      ORDER BY day ASC
    `,

    prisma.$queryRaw<{ path: string; views: bigint; visitors: bigint }[]>`
      SELECT "path",
             COUNT(*)::bigint                  AS views,
             COUNT(DISTINCT "visitorId")::bigint AS visitors
      FROM "PageView"
      WHERE "createdAt" >= ${since}
      GROUP BY "path"
      ORDER BY views DESC
      LIMIT 12
    `,

    /* One page of the all-visitors table. Raw SQL because the page has to be
       ordered by aggregates (total time, page count) *before* it is sliced —
       doing that in JS would mean loading every visitor on every request.
       `total_ms` takes the GREATEST of the session total and the summed page
       dwell: sessions are the truth once they exist, but rows written before
       session tracking shipped only have per-view durations. */
    prisma.$queryRaw<VisitorRow[]>`
      SELECT v."id", v."countryCode", v."city", v."userAgent", v."email",
             v."firstSeenAt", v."lastSeenAt",
             COALESCE(pv.views, 0)::int AS views,
             COALESCE(s.sessions, 0)::int AS sessions,
             GREATEST(COALESCE(s.total_ms, 0), COALESCE(pv.pv_ms, 0))::int AS total_ms
      FROM "Visitor" v
      LEFT JOIN (
        SELECT "visitorId", COUNT(*)::int AS views,
               SUM(COALESCE("durationMs", 0))::int AS pv_ms
        FROM "PageView" GROUP BY "visitorId"
      ) pv ON pv."visitorId" = v."id"
      LEFT JOIN (
        SELECT "visitorId", COUNT(*)::int AS sessions,
               SUM("activeMs")::int AS total_ms
        FROM "VisitSession" GROUP BY "visitorId"
      ) s ON s."visitorId" = v."id"
      ORDER BY ${VISITOR_SORTS[sortKey]}
      LIMIT ${VISITORS_PAGE_SIZE} OFFSET ${(pageNum - 1) * VISITORS_PAGE_SIZE}
    `,

    // Total row count, for the pager.
    prisma.visitor.count(),

    // --- engagement time -------------------------------------------------
    // Average visit length. Only visits that actually reported time are
    // counted: a visit whose beacon never landed is *unmeasured*, not "zero
    // seconds", and folding those in as zeros would understate the average by
    // however many tabs the browser killed silently.
    prisma.$queryRaw<{ avgms: number | null; sessions: bigint }[]>`
      SELECT AVG("activeMs")::float8 AS avgms,
             COUNT(*)::bigint        AS sessions
      FROM "VisitSession"
      WHERE "startedAt" >= ${since}
        AND "activeMs" > 0
    `,

    // Same rule for per-page dwell: durationMs IS NULL means "never
    // reported", so it is excluded rather than averaged as zero.
    prisma.$queryRaw<{ avgms: number | null; views: bigint; totalms: bigint }[]>`
      SELECT AVG("durationMs")::float8              AS avgms,
             COUNT(*)::bigint                       AS views,
             COALESCE(SUM("durationMs"), 0)::bigint AS totalms
      FROM "PageView"
      WHERE "createdAt" >= ${since}
        AND "durationMs" IS NOT NULL
        AND "durationMs" > 0
    `,

    // Attention, not traffic: ranked by total time spent, so a long-read page
    // can outrank one that gets more clicks and loses them immediately.
    prisma.$queryRaw<
      { path: string; totalms: bigint; avgms: number; views: bigint }[]
    >`
      SELECT "path",
             SUM("durationMs")::bigint AS totalms,
             AVG("durationMs")::float8 AS avgms,
             COUNT(*)::bigint          AS views
      FROM "PageView"
      WHERE "createdAt" >= ${since}
        AND "durationMs" IS NOT NULL
        AND "durationMs" > 0
      GROUP BY "path"
      ORDER BY totalms DESC
      LIMIT 12
    `,

    // Every visit in the window, measured or not — the denominator that keeps
    // the average honest about its own coverage.
    prisma.visitSession.count({ where: { startedAt: { gte: since } } }),
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

  // New vs returning, aligned to the same continuous day range as the charts
  // above so a zero-activity day still renders a slot.
  const splitByDay = new Map(
    newVsReturningRaw.map((r) => [
      dayKey(r.day),
      { newV: Number(r.newv), returningV: Number(r.returningv) },
    ]),
  );
  const splitSeries = dayRange.map((d) => ({
    label: d.label,
    newV: splitByDay.get(d.key)?.newV ?? 0,
    returningV: splitByDay.get(d.key)?.returningV ?? 0,
  }));

  const activeInWindow = newVisitorsWindow + returningVisitorsWindow;
  const returningRate =
    activeInWindow > 0
      ? Math.round((returningVisitorsWindow / activeInWindow) * 100)
      : 0;

  const topPages = topPagesRaw.map((r) => ({
    path: r.path,
    views: Number(r.views),
    visitors: Number(r.visitors),
  }));
  const maxPageViews = topPages.reduce((m, p) => Math.max(m, p.views), 0);

  // Engagement time. Every "avg" below is null when there is nothing measured
  // yet, so the UI can render a real em-dash empty state instead of a "0m 0s"
  // that reads as "nobody stayed" when it actually means "no data".
  const measuredSessions = Number(sessionTimeRaw[0]?.sessions ?? 0);
  const avgSessionMs =
    measuredSessions > 0 ? Number(sessionTimeRaw[0]?.avgms ?? 0) : null;
  const avgSessionLabel = formatDuration(avgSessionMs);

  const timedPageViews = Number(pageTimeRaw[0]?.views ?? 0);
  const avgPageMs =
    timedPageViews > 0 ? Number(pageTimeRaw[0]?.avgms ?? 0) : null;
  const avgPageLabel = formatDuration(avgPageMs);
  const totalEngagedMs = Number(pageTimeRaw[0]?.totalms ?? 0);

  const topPagesByTime = topPagesByTimeRaw.map((r) => ({
    path: r.path,
    totalMs: Number(r.totalms),
    avgMs: Number(r.avgms),
    views: Number(r.views),
  }));
  const maxEngagedMs = topPagesByTime.reduce(
    (m, p) => Math.max(m, p.totalMs),
    0,
  );

  // Collapse the flat page-view rows into one ordered journey per visitor.
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
          Orders, visitors, engagement time, and product performance over the
          last {DAYS_WINDOW} days.
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10 [&>*:last-child]:col-span-2 sm:[&>*:last-child]:col-span-1">
        <Kpi label="Total orders" value={totalOrders.toLocaleString()} />
        <Kpi label="Total revenue" value={formatMoney(totalRevenue)} />
        <Kpi label="Unique visitors" value={totalVisitors.toLocaleString()} sub="all time" />
        <Kpi
          label="Visitors today"
          value={visitorsToday.toLocaleString()}
          sub={`${visitors7d.toLocaleString()} in last 7d`}
        />
        <Kpi
          label="New visitors"
          value={newVisitorsWindow.toLocaleString()}
          sub={`first visit in last ${DAYS_WINDOW}d`}
        />
        <Kpi
          label="Returning visitors"
          value={returningVisitorsWindow.toLocaleString()}
          sub={`came back after day one`}
        />
        <Kpi
          label="Return rate"
          value={`${returningRate}%`}
          sub={`of ${activeInWindow.toLocaleString()} active visitors`}
        />
        <Kpi
          label="Page views"
          value={pageViewsWindow.toLocaleString()}
          sub={`${repeatVisitorsAllTime.toLocaleString()} repeat visitors all time`}
        />
        <Kpi
          label="Avg. session"
          value={avgSessionLabel ?? "—"}
          sub={
            avgSessionLabel
              ? `measured on ${measuredSessions.toLocaleString()} of ${sessionsWindow.toLocaleString()} visits`
              : sessionsWindow > 0
                ? `${sessionsWindow.toLocaleString()} visits, none timed yet`
                : "no visits recorded yet"
          }
        />
        <Kpi
          label="Avg. time on page"
          value={avgPageLabel ?? "—"}
          sub={
            avgPageLabel
              ? `${timedPageViews.toLocaleString()} timed view${timedPageViews === 1 ? "" : "s"} · ${formatDuration(totalEngagedMs) ?? "0s"} total`
              : "no timed page views yet"
          }
        />
        <Kpi
          label="Identified"
          value={identifiedVisitors.toLocaleString()}
          sub={
            totalVisitors > 0
              ? `${Math.round((identifiedVisitors / totalVisitors) * 100)}% of visitors gave an email`
              : "no visitors yet"
          }
        />
      </div>

      {subscriberSources.length > 0 && (
        <section className="bg-white border border-bourbon-deep/10 p-5 sm:p-6 mb-10">
          <div className="flex items-baseline justify-between mb-4 pb-4 border-b border-bourbon-deep/10">
            <h2 className="font-[family-name:var(--font-playfair)] text-xl font-bold text-bourbon-deep">
              Where emails come from
            </h2>
            <span className="text-bourbon-stone text-[10px] tracking-widest uppercase">
              All time
            </span>
          </div>
          <ul className="flex flex-wrap gap-x-8 gap-y-3">
            {subscriberSources.map((s) => (
              <li key={s.source ?? "unknown"}>
                <p className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-bourbon-deep leading-none">
                  {s._count._all.toLocaleString()}
                </p>
                <p className="text-bourbon-stone text-[10px] tracking-widest uppercase mt-1">
                  {s.source ?? "unknown"}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
        <ChartCard title="Orders per day" data={ordersSeries} accent="gold" />
        <ChartCard title="Unique visitors per day" data={visitsSeries} accent="deep" />
      </div>

      <div className="mb-10">
        <StackedChartCard
          title="New vs returning visitors per day"
          data={splitSeries}
        />
      </div>

      {/* ---- All visitors -------------------------------------------------
          Sits directly under the charts: the KPIs say what happened in
          aggregate, the charts say when, and this says who. Every visitor the
          site has ever seen is reachable from here via the pager. */}
      <section className="bg-white border border-bourbon-deep/10 p-5 sm:p-6 mb-10">
        <div className="flex items-baseline justify-between gap-3 mb-4 pb-4 border-b border-bourbon-deep/10 flex-wrap">
          <h2 className="font-[family-name:var(--font-playfair)] text-xl font-bold text-bourbon-deep">
            All visitors
          </h2>
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-bourbon-stone text-[10px] tracking-widest uppercase">
              {visitorTotal.toLocaleString()} total
            </span>
            <div className="flex items-center gap-1">
              {(
                [
                  ["recent", "Recent"],
                  ["time", "Time spent"],
                  ["pages", "Pages"],
                ] as const
              ).map(([key, label]) => (
                <Link
                  key={key}
                  href={`/admin/analytics?sort=${key}`}
                  className={`text-[10px] tracking-widest uppercase px-2 py-1 transition-colors ${
                    sortKey === key
                      ? "bg-bourbon-deep text-bourbon-cream"
                      : "text-bourbon-stone hover:text-bourbon-deep"
                  }`}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {visitorRows.length === 0 ? (
          /* An out-of-range page is not the same as an empty site — saying
             "no visitors yet" when there are 266 of them would be a lie. */
          visitorTotal > 0 ? (
            <p className="text-bourbon-stone text-sm py-6 text-center">
              Page {pageNum} is past the end of{" "}
              {visitorTotal.toLocaleString()} visitors.{" "}
              <Link
                href={`/admin/analytics?sort=${sortKey}`}
                className="text-bourbon-gold font-semibold hover:text-bourbon-amber transition-colors"
              >
                Back to the first page
              </Link>
            </p>
          ) : (
            <p className="text-bourbon-stone text-sm py-6 text-center">
              No visitors recorded yet. Rows appear as soon as someone browses
              the site.
            </p>
          )
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-bourbon-stone text-[10px] tracking-widest uppercase">
                    <th className="font-semibold pb-2 pr-4">Visitor</th>
                    <th className="font-semibold pb-2 pr-4">Country</th>
                    <th className="font-semibold pb-2 pr-4 hidden sm:table-cell">Device</th>
                    <th className="font-semibold pb-2 pr-4 text-right">Pages</th>
                    <th className="font-semibold pb-2 pr-4 text-right">Time on site</th>
                    <th className="font-semibold pb-2 pr-4 hidden md:table-cell">Last seen</th>
                    <th className="font-semibold pb-2 sr-only">Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {visitorRows.map((v) => {
                    const spent = formatDuration(v.total_ms);
                    return (
                      <tr
                        key={v.id}
                        className="border-t border-bourbon-deep/5 hover:bg-bourbon-cream/40 transition-colors"
                      >
                        <td className="py-3 pr-4">
                          <Link
                            href={`/admin/analytics/visitors/${v.id}`}
                            className="text-bourbon-deep text-sm font-semibold hover:text-bourbon-gold transition-colors"
                          >
                            {v.email ?? visitorLabel(v.id)}
                          </Link>
                          {v.email && (
                            <span className="block text-bourbon-stone text-[10px] font-mono">
                              {visitorLabel(v.id)}
                            </span>
                          )}
                        </td>
                        <td className="py-3 pr-4 text-bourbon-stone text-sm whitespace-nowrap">
                          <span className="mr-1.5">
                            {v.countryCode ? countryFlag(v.countryCode) : "🌐"}
                          </span>
                          {v.countryCode
                            ? countryName(v.countryCode) ?? v.countryCode
                            : "Unknown"}
                          {v.city && (
                            <span className="block text-[10px] text-bourbon-stone/70">
                              {v.city}
                            </span>
                          )}
                        </td>
                        <td className="py-3 pr-4 text-bourbon-stone text-xs hidden sm:table-cell">
                          {deviceLabel(v.userAgent)}
                        </td>
                        <td className="py-3 pr-4 text-bourbon-deep text-sm text-right tabular-nums">
                          {v.views.toLocaleString()}
                        </td>
                        {/* A dash, not "0s" — an unmeasured visit is unknown,
                            not a visit of zero length. */}
                        <td className="py-3 pr-4 text-sm text-right tabular-nums">
                          {spent ? (
                            <span className="text-bourbon-deep font-semibold">{spent}</span>
                          ) : (
                            <span className="text-bourbon-stone/50">—</span>
                          )}
                        </td>
                        <td className="py-3 pr-4 text-bourbon-stone text-xs whitespace-nowrap hidden md:table-cell">
                          {v.lastSeenAt.toLocaleString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "numeric",
                            minute: "2-digit",
                            timeZone: "UTC",
                          })}
                        </td>
                        <td className="py-3 text-right">
                          <Link
                            href={`/admin/analytics/visitors/${v.id}`}
                            className="text-bourbon-gold text-[10px] tracking-widest uppercase font-semibold hover:text-bourbon-amber transition-colors whitespace-nowrap"
                          >
                            View →
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pager */}
            {visitorTotal > VISITORS_PAGE_SIZE && (
              <div className="flex items-center justify-between gap-3 mt-5 pt-4 border-t border-bourbon-deep/10">
                <span className="text-bourbon-stone text-xs">
                  {(pageNum - 1) * VISITORS_PAGE_SIZE + 1}–
                  {Math.min(pageNum * VISITORS_PAGE_SIZE, visitorTotal)} of{" "}
                  {visitorTotal.toLocaleString()}
                </span>
                <div className="flex items-center gap-2">
                  {pageNum > 1 ? (
                    <Link
                      href={`/admin/analytics?sort=${sortKey}&page=${pageNum - 1}`}
                      className="text-bourbon-deep text-xs tracking-widest uppercase font-semibold px-3 py-1.5 border border-bourbon-deep/20 hover:border-bourbon-gold hover:text-bourbon-gold transition-colors"
                    >
                      ← Prev
                    </Link>
                  ) : (
                    <span className="text-bourbon-stone/40 text-xs tracking-widest uppercase px-3 py-1.5 border border-bourbon-deep/5">
                      ← Prev
                    </span>
                  )}
                  <span className="text-bourbon-stone text-xs tabular-nums">
                    {pageNum} / {Math.ceil(visitorTotal / VISITORS_PAGE_SIZE)}
                  </span>
                  {pageNum * VISITORS_PAGE_SIZE < visitorTotal ? (
                    <Link
                      href={`/admin/analytics?sort=${sortKey}&page=${pageNum + 1}`}
                      className="text-bourbon-deep text-xs tracking-widest uppercase font-semibold px-3 py-1.5 border border-bourbon-deep/20 hover:border-bourbon-gold hover:text-bourbon-gold transition-colors"
                    >
                      Next →
                    </Link>
                  ) : (
                    <span className="text-bourbon-stone/40 text-xs tracking-widest uppercase px-3 py-1.5 border border-bourbon-deep/5">
                      Next →
                    </span>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </section>

      {/* Top pages */}
      <section className="bg-white border border-bourbon-deep/10 p-5 sm:p-6 mb-10">
        <div className="flex items-baseline justify-between mb-4 pb-4 border-b border-bourbon-deep/10">
          <h2 className="font-[family-name:var(--font-playfair)] text-xl font-bold text-bourbon-deep">
            Most visited pages
          </h2>
          <span className="text-bourbon-stone text-[10px] tracking-widest uppercase">
            Last {DAYS_WINDOW} days
          </span>
        </div>
        {topPages.length === 0 ? (
          <p className="text-bourbon-stone text-sm py-6 text-center">
            No page views recorded yet.
          </p>
        ) : (
          <ul className="space-y-3">
            {topPages.map((p) => {
              const pct = maxPageViews > 0 ? (p.views / maxPageViews) * 100 : 0;
              return (
                <li key={p.path}>
                  <div className="flex items-center justify-between gap-3 mb-1.5">
                    <Link
                      href={p.path}
                      target="_blank"
                      className="text-bourbon-deep text-sm font-semibold hover:text-bourbon-gold transition-colors truncate"
                    >
                      {p.path}
                    </Link>
                    <span className="text-bourbon-stone text-xs whitespace-nowrap">
                      {p.views.toLocaleString()} view
                      {p.views === 1 ? "" : "s"} ·{" "}
                      {p.visitors.toLocaleString()} visitor
                      {p.visitors === 1 ? "" : "s"}
                    </span>
                  </div>
                  <div className="h-1.5 bg-bourbon-deep/5 overflow-hidden">
                    <div
                      className="h-full bg-bourbon-gold"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Top pages by engagement time — the one that says where attention
          actually goes, as opposed to where the clicks land. */}
      <section className="bg-white border border-bourbon-deep/10 p-5 sm:p-6 mb-10">
        <div className="flex items-baseline justify-between mb-4 pb-4 border-b border-bourbon-deep/10">
          <h2 className="font-[family-name:var(--font-playfair)] text-xl font-bold text-bourbon-deep">
            Pages by engagement time
          </h2>
          <span className="text-bourbon-stone text-[10px] tracking-widest uppercase">
            Last {DAYS_WINDOW} days
          </span>
        </div>
        <p className="text-bourbon-stone text-[11px] -mt-2 mb-4">
          Visible time only — a backgrounded tab stops the clock, and a single
          view is capped at 30 minutes so one parked tab can&apos;t skew the
          ranking.
        </p>
        {topPagesByTime.length === 0 ? (
          <p className="text-bourbon-stone text-sm py-6 text-center">
            No engagement time recorded yet. It starts appearing once visitors
            leave a page they spent time on.
          </p>
        ) : (
          <ul className="space-y-3">
            {topPagesByTime.map((p) => {
              const pct =
                maxEngagedMs > 0 ? (p.totalMs / maxEngagedMs) * 100 : 0;
              return (
                <li key={p.path}>
                  <div className="flex items-center justify-between gap-3 mb-1.5">
                    <Link
                      href={p.path}
                      target="_blank"
                      className="text-bourbon-deep text-sm font-semibold hover:text-bourbon-gold transition-colors truncate"
                    >
                      {p.path}
                    </Link>
                    <span className="text-bourbon-stone text-xs whitespace-nowrap">
                      {formatDuration(p.totalMs) ?? "—"} total ·{" "}
                      {formatDuration(p.avgMs) ?? "—"} avg ·{" "}
                      {p.views.toLocaleString()} view
                      {p.views === 1 ? "" : "s"}
                    </span>
                  </div>
                  <div className="h-1.5 bg-bourbon-deep/5 overflow-hidden">
                    <div
                      className="h-full bg-bourbon-gold"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

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

function StackedChartCard({
  title,
  data,
}: {
  title: string;
  data: { label: string; newV: number; returningV: number }[];
}) {
  const max = Math.max(1, ...data.map((d) => d.newV + d.returningV));
  const totalNew = data.reduce((s, d) => s + d.newV, 0);
  const totalReturning = data.reduce((s, d) => s + d.returningV, 0);

  return (
    <section className="bg-white border border-bourbon-deep/10 p-5 sm:p-6">
      <div className="flex items-baseline justify-between gap-3 mb-4 pb-4 border-b border-bourbon-deep/10 flex-wrap">
        <h2 className="font-[family-name:var(--font-playfair)] text-xl font-bold text-bourbon-deep">
          {title}
        </h2>
        <div className="flex items-center gap-4 text-[10px] tracking-widest uppercase text-bourbon-stone">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-bourbon-gold" />
            New {totalNew.toLocaleString()}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 bg-bourbon-deep" />
            Returning {totalReturning.toLocaleString()}
          </span>
        </div>
      </div>

      {/* A visitor is counted once per day, so someone who returns on three
          days adds three to the "Returning" total here — that's why this
          number is larger than the distinct "Returning visitors" KPI. */}
      <p className="text-bourbon-stone text-[11px] -mt-2 mb-3">
        Each visitor counts once per day they were active.
      </p>

      <div className="flex items-end gap-[2px] h-40">
        {data.map((d, i) => {
          const total = d.newV + d.returningV;
          return (
            <div
              key={i}
              className="flex-1 flex flex-col justify-end h-full group relative"
            >
              <div
                className="w-full bg-bourbon-deep transition-opacity group-hover:opacity-80"
                style={{
                  height: `${(d.returningV / max) * 100}%`,
                  minHeight: d.returningV > 0 ? 2 : 0,
                }}
              />
              <div
                className="w-full bg-bourbon-gold transition-opacity group-hover:opacity-80"
                style={{
                  height: `${(d.newV / max) * 100}%`,
                  minHeight: d.newV > 0 ? 2 : 0,
                }}
              />
              <span className="absolute -top-12 left-1/2 -translate-x-1/2 px-2 py-1 bg-bourbon-deep text-bourbon-cream text-[10px] tracking-wider rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-10 text-left">
                {d.label}
                <br />
                {d.newV} new · {d.returningV} returning
                <br />
                {total} total
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
