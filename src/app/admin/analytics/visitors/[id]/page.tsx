import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { countryFlag, countryName } from "@/lib/geo";
import { visitorLabel, deviceLabel, formatDuration } from "@/lib/visitor";

export const metadata = { title: "Visitor | Admin" };
export const dynamic = "force-dynamic";

/* Every page view this visitor has, newest visit first. Capped so one
   pathological crawler-like visitor cannot render a 50,000-row page; the
   header still reports the true total from the count, so a truncated list is
   visible rather than silently misleading. */
const MAX_VIEWS = 500;

function stamp(d: Date): string {
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  });
}

export default async function VisitorDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const visitor = await prisma.visitor.findUnique({
    where: { id },
    select: {
      id: true,
      country: true,
      countryCode: true,
      region: true,
      city: true,
      userAgent: true,
      email: true,
      emailCapturedAt: true,
      firstSeenAt: true,
      lastSeenAt: true,
    },
  });
  if (!visitor) notFound();

  const [sessions, views, viewTotal, timedAgg, sessionAgg] = await Promise.all([
    prisma.visitSession.findMany({
      where: { visitorId: id },
      orderBy: { startedAt: "desc" },
      select: { id: true, startedAt: true, lastActiveAt: true, activeMs: true },
    }),
    prisma.pageView.findMany({
      where: { visitorId: id },
      orderBy: { createdAt: "desc" },
      take: MAX_VIEWS,
      select: { id: true, path: true, createdAt: true, durationMs: true, sessionId: true },
    }),
    prisma.pageView.count({ where: { visitorId: id } }),
    // Averages must ignore unreported dwell: NULL is "unknown", not zero.
    prisma.pageView.aggregate({
      where: { visitorId: id, durationMs: { not: null, gt: 0 } },
      _avg: { durationMs: true },
      _sum: { durationMs: true },
      _count: { _all: true },
    }),
    prisma.visitSession.aggregate({
      where: { visitorId: id },
      _sum: { activeMs: true },
      _avg: { activeMs: true },
      _count: { _all: true },
    }),
  ]);

  const sessionTotal = sessionAgg._sum.activeMs ?? 0;
  const pageTotal = timedAgg._sum.durationMs ?? 0;
  // Same reconciliation as the table: sessions win where they exist, summed
  // page dwell covers rows written before session tracking shipped.
  const totalMs = Math.max(sessionTotal, pageTotal);

  const label = visitorLabel(visitor.id);
  const bySession = new Map<string, typeof views>();
  const orphans: typeof views = [];
  for (const v of views) {
    if (!v.sessionId) {
      orphans.push(v);
      continue;
    }
    const list = bySession.get(v.sessionId) ?? [];
    list.push(v);
    bySession.set(v.sessionId, list);
  }

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link
        href="/admin/analytics"
        className="text-bourbon-stone text-[10px] tracking-widest uppercase hover:text-bourbon-gold transition-colors"
      >
        ← Analytics
      </Link>

      {/* ---- Identity ---- */}
      <div className="mt-4 mb-8 pb-6 border-b border-bourbon-deep/10">
        <div className="flex items-center gap-3 flex-wrap mb-2">
          <span className="text-2xl leading-none">
            {visitor.countryCode ? countryFlag(visitor.countryCode) : "🌐"}
          </span>
          <h1 className="font-[family-name:var(--font-playfair)] text-2xl sm:text-3xl font-bold text-bourbon-deep">
            {visitor.email ?? label}
          </h1>
          {visitor.email && (
            <span className="text-[10px] tracking-widest uppercase px-1.5 py-0.5 bg-emerald-500/10 text-emerald-700">
              Identified
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap text-bourbon-stone text-xs">
          {visitor.email && <span className="font-mono">{label}</span>}
          {visitor.email && <span className="text-bourbon-stone/40">·</span>}
          <span>
            {[visitor.city, visitor.region, visitor.countryCode ? countryName(visitor.countryCode) ?? visitor.countryCode : null]
              .filter(Boolean)
              .join(", ") || "Unknown location"}
          </span>
          <span className="text-bourbon-stone/40">·</span>
          <span>{deviceLabel(visitor.userAgent)}</span>
          <span className="text-bourbon-stone/40">·</span>
          <span>First seen {stamp(visitor.firstSeenAt)} UTC</span>
          <span className="text-bourbon-stone/40">·</span>
          <span>Last seen {stamp(visitor.lastSeenAt)} UTC</span>
        </div>
      </div>

      {/* ---- Totals ---- */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
        <Stat
          label="Time on site"
          value={formatDuration(totalMs) ?? "—"}
          sub={totalMs > 0 ? "measured, visible time only" : "no time reported yet"}
        />
        <Stat
          label="Visits"
          value={sessionAgg._count._all.toLocaleString()}
          sub={
            sessionAgg._avg.activeMs
              ? `avg ${formatDuration(Math.round(sessionAgg._avg.activeMs)) ?? "—"}`
              : "no timed visits"
          }
        />
        <Stat
          label="Page views"
          value={viewTotal.toLocaleString()}
          sub={`${timedAgg._count._all.toLocaleString()} timed`}
        />
        <Stat
          label="Avg. on page"
          value={
            timedAgg._avg.durationMs
              ? formatDuration(Math.round(timedAgg._avg.durationMs)) ?? "—"
              : "—"
          }
          sub={timedAgg._count._all > 0 ? "across timed views" : "no timed views"}
        />
      </div>

      {/* ---- Activity ---- */}
      <section className="bg-white border border-bourbon-deep/10 p-5 sm:p-6">
        <div className="flex items-baseline justify-between gap-3 mb-4 pb-4 border-b border-bourbon-deep/10 flex-wrap">
          <h2 className="font-[family-name:var(--font-playfair)] text-xl font-bold text-bourbon-deep">
            Activity
          </h2>
          <span className="text-bourbon-stone text-[10px] tracking-widest uppercase">
            {viewTotal > MAX_VIEWS
              ? `Newest ${MAX_VIEWS} of ${viewTotal.toLocaleString()}`
              : `${viewTotal.toLocaleString()} page views`}
          </span>
        </div>

        {views.length === 0 ? (
          <p className="text-bourbon-stone text-sm py-6 text-center">
            No page views recorded for this visitor.
          </p>
        ) : (
          <div className="space-y-6">
            {sessions.map((s) => {
              const list = bySession.get(s.id);
              if (!list || list.length === 0) return null;
              return (
                <div key={s.id}>
                  <div className="flex items-baseline gap-2 flex-wrap mb-2">
                    <span className="text-bourbon-deep text-sm font-semibold">
                      {stamp(s.startedAt)} UTC
                    </span>
                    <span className="text-bourbon-stone/40">·</span>
                    <span className="text-bourbon-gold text-xs font-semibold">
                      {formatDuration(s.activeMs) ?? "unmeasured"}
                    </span>
                    <span className="text-bourbon-stone/40">·</span>
                    <span className="text-bourbon-stone text-xs">
                      {list.length} page{list.length === 1 ? "" : "s"}
                    </span>
                  </div>
                  <ViewList items={[...list].reverse()} />
                </div>
              );
            })}

            {orphans.length > 0 && (
              <div>
                <div className="flex items-baseline gap-2 flex-wrap mb-2">
                  <span className="text-bourbon-deep text-sm font-semibold">
                    Unassigned page views
                  </span>
                  <span className="text-bourbon-stone/40">·</span>
                  {/* Rows from before session tracking shipped, or views whose
                      session write lost a race. Shown rather than hidden so the
                      per-visit totals above visibly reconcile with the list. */}
                  <span className="text-bourbon-stone text-xs">
                    no visit recorded
                  </span>
                </div>
                <ViewList items={[...orphans].reverse()} />
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}

function ViewList({
  items,
}: {
  items: { id: string; path: string; createdAt: Date; durationMs: number | null }[];
}) {
  return (
    <ul className="border-l-2 border-bourbon-gold/25 pl-4 space-y-2">
      {items.map((v) => (
        <li key={v.id} className="flex items-baseline gap-3 flex-wrap">
          <Link
            href={v.path}
            className="text-bourbon-deep text-sm hover:text-bourbon-gold transition-colors break-all"
          >
            {v.path}
          </Link>
          <span className="text-bourbon-stone text-[11px] tabular-nums">
            {v.createdAt.toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
              second: "2-digit",
              timeZone: "UTC",
            })}
          </span>
          <span className="text-[11px] tabular-nums">
            {formatDuration(v.durationMs) ? (
              <span className="text-bourbon-gold font-semibold">
                {formatDuration(v.durationMs)}
              </span>
            ) : (
              <span className="text-bourbon-stone/50">unmeasured</span>
            )}
          </span>
        </li>
      ))}
    </ul>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white border border-bourbon-deep/10 p-4">
      <p className="text-bourbon-stone text-[10px] tracking-widest uppercase mb-1">
        {label}
      </p>
      <p className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-bourbon-deep leading-none">
        {value}
      </p>
      {sub && <p className="text-bourbon-stone text-[11px] mt-1.5">{sub}</p>}
    </div>
  );
}
