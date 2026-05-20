import Link from "next/link";
import { prisma } from "@/lib/prisma";
import type { SubscriberStatus } from "@prisma/client";
import { toggleSubscriberStatus, deleteSubscriber } from "./actions";

export const metadata = { title: "Subscribers | Admin" };

type Filter = "subscribed" | "all" | "unsubscribed";

function parseFilter(value: string | string[] | undefined): Filter {
  const v = Array.isArray(value) ? value[0] : value;
  if (v === "all" || v === "unsubscribed" || v === "subscribed") return v;
  return "subscribed";
}

function formatDate(date: Date) {
  return date.toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default async function AdminSubscribersPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string | string[] }>;
}) {
  const sp = await searchParams;
  const filter = parseFilter(sp.filter);

  const where =
    filter === "subscribed"
      ? { status: "SUBSCRIBED" as SubscriberStatus }
      : filter === "unsubscribed"
        ? { status: "UNSUBSCRIBED" as SubscriberStatus }
        : {};

  const [subscribers, subscribedCount, allCount, unsubscribedCount] =
    await Promise.all([
      prisma.subscriber.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: 500,
      }),
      prisma.subscriber.count({ where: { status: "SUBSCRIBED" } }),
      prisma.subscriber.count(),
      prisma.subscriber.count({ where: { status: "UNSUBSCRIBED" } }),
    ]);

  const tabs: { id: Filter; label: string; count: number }[] = [
    { id: "subscribed", label: "Subscribed", count: subscribedCount },
    { id: "all", label: "All", count: allCount },
    { id: "unsubscribed", label: "Unsubscribed", count: unsubscribedCount },
  ];

  const csvHref = `/api/admin/subscribers/export?filter=${filter}`;

  return (
    <>
      <div className="mb-8 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-bourbon-gold text-xs tracking-[0.3em] uppercase mb-2">
            Inner Circle
          </p>
          <h1 className="font-[family-name:var(--font-playfair)] text-3xl sm:text-4xl font-bold text-bourbon-deep">
            Newsletter Subscribers
          </h1>
          <p className="text-bourbon-stone text-sm mt-2">
            {subscribedCount === 0
              ? "No active subscribers yet."
              : `${subscribedCount} active · ${allCount} total`}
          </p>
        </div>

        {allCount > 0 && (
          <a
            href={csvHref}
            className="inline-flex items-center gap-2 px-4 py-2 border border-bourbon-deep/20 text-bourbon-deep text-xs tracking-widest uppercase font-semibold hover:bg-bourbon-deep hover:text-bourbon-cream transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4" />
            </svg>
            Export CSV
          </a>
        )}
      </div>

      {/* Tabs */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        {tabs.map((t) => {
          const active = t.id === filter;
          return (
            <Link
              key={t.id}
              href={
                t.id === "subscribed"
                  ? "/admin/subscribers"
                  : `/admin/subscribers?filter=${t.id}`
              }
              className={`inline-flex items-center gap-2 px-4 py-2 text-[10px] tracking-widest uppercase font-semibold transition-colors ${
                active
                  ? "bg-bourbon-deep text-bourbon-cream"
                  : "bg-white border border-bourbon-deep/15 text-bourbon-deep hover:border-bourbon-gold hover:text-bourbon-gold"
              }`}
            >
              {t.label}
              <span
                className={`px-1.5 py-0.5 text-[10px] ${
                  active
                    ? "bg-bourbon-gold/30 text-bourbon-cream"
                    : "bg-bourbon-deep/10 text-bourbon-deep"
                }`}
              >
                {t.count}
              </span>
            </Link>
          );
        })}
      </div>

      <section className="bg-white border border-bourbon-deep/10 overflow-hidden">
        {subscribers.length === 0 ? (
          <p className="px-5 py-12 text-bourbon-stone text-sm text-center">
            {filter === "subscribed"
              ? "No active subscribers. Share the newsletter to start building your list."
              : filter === "unsubscribed"
                ? "Nobody has unsubscribed."
                : "No subscribers yet."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-bourbon-deep/10 text-left">
                  <th className="px-5 py-3 text-[10px] tracking-widest uppercase text-bourbon-stone font-semibold">
                    Email
                  </th>
                  <th className="px-5 py-3 text-[10px] tracking-widest uppercase text-bourbon-stone font-semibold">
                    Status
                  </th>
                  <th className="px-5 py-3 text-[10px] tracking-widest uppercase text-bourbon-stone font-semibold">
                    Source
                  </th>
                  <th className="px-5 py-3 text-[10px] tracking-widest uppercase text-bourbon-stone font-semibold">
                    Joined
                  </th>
                  <th className="px-5 py-3 text-[10px] tracking-widest uppercase text-bourbon-stone font-semibold text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {subscribers.map((s) => {
                  const isSubscribed = s.status === "SUBSCRIBED";
                  return (
                    <tr
                      key={s.id}
                      className="border-b border-bourbon-deep/5 hover:bg-bourbon-cream/40 transition-colors"
                    >
                      <td className="px-5 py-3">
                        <a
                          href={`mailto:${s.email}`}
                          className="text-bourbon-deep font-medium hover:text-bourbon-gold"
                        >
                          {s.email}
                        </a>
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-1 text-[10px] tracking-widest uppercase font-semibold ${
                            isSubscribed
                              ? "bg-bourbon-gold/15 text-bourbon-amber"
                              : "bg-bourbon-deep/10 text-bourbon-stone"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isSubscribed ? "bg-bourbon-gold" : "bg-bourbon-stone"
                            }`}
                          />
                          {isSubscribed ? "Subscribed" : "Unsubscribed"}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-bourbon-stone text-xs">
                        {s.source ?? "—"}
                      </td>
                      <td className="px-5 py-3 text-bourbon-stone text-xs">
                        {formatDate(s.createdAt)}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <form action={toggleSubscriberStatus.bind(null, s.id)}>
                            <button
                              type="submit"
                              className="text-[10px] tracking-widest uppercase font-semibold text-bourbon-stone hover:text-bourbon-gold transition-colors cursor-pointer"
                            >
                              {isSubscribed ? "Unsubscribe" : "Resubscribe"}
                            </button>
                          </form>
                          <span className="text-bourbon-deep/20">·</span>
                          <form action={deleteSubscriber.bind(null, s.id)}>
                            <button
                              type="submit"
                              className="text-[10px] tracking-widest uppercase font-semibold text-bourbon-stone hover:text-red-500 transition-colors cursor-pointer"
                            >
                              Delete
                            </button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
