import Link from "next/link";
import { prisma } from "@/lib/prisma";
import type { MessageStatus } from "@prisma/client";

export const metadata = { title: "Messages | Admin" };

type Filter = "unread" | "all" | "archived";

function parseFilter(value: string | string[] | undefined): Filter {
  const v = Array.isArray(value) ? value[0] : value;
  if (v === "all" || v === "archived" || v === "unread") return v;
  return "unread";
}

function relativeDate(date: Date) {
  const now = Date.now();
  const diff = now - date.getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const days = Math.floor(hr / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

function previewBody(body: string, max = 60) {
  const clean = body.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return clean.slice(0, max).trimEnd() + "…";
}

export default async function AdminMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string | string[] }>;
}) {
  const sp = await searchParams;
  const filter = parseFilter(sp.filter);

  const where =
    filter === "unread"
      ? { status: "UNREAD" as MessageStatus }
      : filter === "archived"
        ? { status: "ARCHIVED" as MessageStatus }
        : {};

  const [messages, unreadCount, allCount, archivedCount] = await Promise.all([
    prisma.contactMessage.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.contactMessage.count({ where: { status: "UNREAD" } }),
    prisma.contactMessage.count(),
    prisma.contactMessage.count({ where: { status: "ARCHIVED" } }),
  ]);

  const tabs: { id: Filter; label: string; count: number }[] = [
    { id: "unread", label: "Unread", count: unreadCount },
    { id: "all", label: "All", count: allCount },
    { id: "archived", label: "Archived", count: archivedCount },
  ];

  return (
    <>
      <div className="mb-8 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-bourbon-gold text-xs tracking-[0.3em] uppercase mb-2">
            Inbox
          </p>
          <h1 className="font-[family-name:var(--font-playfair)] text-3xl sm:text-4xl font-bold text-bourbon-deep">
            Messages
          </h1>
          <p className="text-bourbon-stone text-sm mt-2">
            {unreadCount === 0
              ? "Inbox zero. Nicely done."
              : `${unreadCount} unread · ${allCount} total`}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        {tabs.map((t) => {
          const active = t.id === filter;
          return (
            <Link
              key={t.id}
              href={t.id === "unread" ? "/admin/messages" : `/admin/messages?filter=${t.id}`}
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

      <section className="bg-white border border-bourbon-deep/10">
        {messages.length === 0 ? (
          <p className="px-5 py-12 text-bourbon-stone text-sm text-center">
            {filter === "unread"
              ? "No unread messages. Switch to All to browse older notes."
              : filter === "archived"
                ? "Nothing in the archive."
                : "No messages yet."}
          </p>
        ) : (
          <ul className="divide-y divide-bourbon-deep/5">
            {messages.map((m) => {
              const unread = m.status === "UNREAD";
              const archived = m.status === "ARCHIVED";
              return (
                <li key={m.id}>
                  <Link
                    href={`/admin/messages/${m.id}`}
                    className="flex items-start gap-4 px-5 py-4 hover:bg-bourbon-gold/5 transition-colors"
                  >
                    <span
                      aria-hidden
                      className={`mt-2 w-2.5 h-2.5 rounded-full shrink-0 ${
                        unread
                          ? "bg-bourbon-gold"
                          : archived
                            ? "bg-bourbon-deep/15"
                            : "bg-bourbon-stone/40"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-3 flex-wrap">
                        <p
                          className={`truncate ${
                            unread
                              ? "text-bourbon-deep font-bold"
                              : "text-bourbon-deep font-semibold"
                          }`}
                        >
                          {m.name}
                          <span className="text-bourbon-stone text-xs font-normal ml-2">
                            {m.email}
                          </span>
                        </p>
                        <p className="text-bourbon-stone text-[10px] tracking-widest uppercase whitespace-nowrap">
                          {relativeDate(m.createdAt)}
                        </p>
                      </div>
                      <p
                        className={`text-sm mt-1 line-clamp-1 ${
                          unread
                            ? "text-bourbon-deep"
                            : "text-bourbon-stone"
                        }`}
                      >
                        {m.subject ?? previewBody(m.body)}
                      </p>
                      {m.subject && (
                        <p className="text-bourbon-stone/80 text-xs mt-0.5 line-clamp-1">
                          {previewBody(m.body, 90)}
                        </p>
                      )}
                    </div>
                    {archived && (
                      <span className="px-2 py-1 text-[10px] tracking-widest uppercase bg-bourbon-deep/5 text-bourbon-stone font-semibold shrink-0">
                        Archived
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </>
  );
}
