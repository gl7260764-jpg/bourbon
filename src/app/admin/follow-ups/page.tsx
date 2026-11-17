import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { campaignMailerConfig } from "@/lib/campaign-mailer";
import {
  MAX_FOLLOW_UPS,
  MIN_GAP_DAYS,
  STALE_DAYS,
  TRACKS,
  TRACK_BADGE,
  TRACK_LABEL,
  TRACK_SUMMARY,
  type FollowUpTrack,
} from "@/lib/follow-up-constants";
import { loadFollowUpQueue } from "@/lib/order-follow-up";
import FollowUpQueue from "./FollowUpQueue";

export const metadata = { title: "Follow-ups | Admin" };
export const dynamic = "force-dynamic";

const money = (v: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(v);

export default async function AdminFollowUpsPage() {
  const [queue, mailer, pendingAll] = await Promise.all([
    loadFollowUpQueue(),
    Promise.resolve(campaignMailerConfig()),
    prisma.order.aggregate({
      where: { status: "PENDING" },
      _count: { _all: true },
      _sum: { total: true },
    }),
  ]);

  // What has already gone to the orders now in the queue, so a second nudge is
  // written with the first one visible.
  const history = await prisma.orderFollowUp.findMany({
    where: { orderId: { in: queue.drafts.map((d) => d.orderId) } },
    orderBy: { sequence: "asc" },
    select: {
      orderId: true,
      sequence: true,
      track: true,
      subject: true,
      status: true,
      error: true,
      sentAt: true,
    },
  });

  const historyByOrder = new Map<string, typeof history>();
  for (const row of history) {
    const list = historyByOrder.get(row.orderId) ?? [];
    list.push(row);
    historyByOrder.set(row.orderId, list);
  }

  const byTrack = new Map<FollowUpTrack, { count: number; value: number }>();
  for (const d of queue.drafts) {
    const cur = byTrack.get(d.track) ?? { count: 0, value: 0 };
    byTrack.set(d.track, { count: cur.count + 1, value: cur.value + d.total });
  }

  const withWarnings = queue.drafts.filter((d) => d.warnings.length > 0).length;
  const pendingCount = pendingAll._count._all;
  const pendingValue = Number(pendingAll._sum.total ?? 0);

  return (
    <>
      <div className="mb-8">
        <p className="text-bourbon-gold text-xs tracking-[0.3em] uppercase mb-2">
          Cellar Operations
        </p>
        <h1 className="font-[family-name:var(--font-playfair)] text-3xl sm:text-4xl font-bold text-bourbon-deep">
          Follow-ups
        </h1>
        <p className="text-bourbon-stone text-sm mt-2 max-w-2xl">
          {pendingCount} order{pendingCount === 1 ? "" : "s"} are still unpaid,
          worth {money(pendingValue)}. {queue.drafts.length} can be written to
          now. Each draft is built from that order&rsquo;s own facts — nothing
          sends until you press send.
        </p>
      </div>

      {!mailer.ready && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-300">
          <p className="text-rose-900 text-sm font-semibold">
            Brevo is not configured, so nothing can be sent.
          </p>
          <p className="text-rose-800 text-xs mt-1">
            Missing: {mailer.missing.join(", ")}. These follow-ups go out
            through the same relay as campaigns, kept apart from the mailbox
            that carries invoices. Drafts below are still safe to read and edit.
          </p>
        </div>
      )}

      {/* The shape of the queue. The point of this row is that most of these
          orders are not waiting on the buyer at all. */}
      {queue.drafts.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          {TRACKS.filter((t) => byTrack.has(t)).map((track) => {
            const stat = byTrack.get(track)!;
            return (
              <div key={track} className="bg-white border border-bourbon-deep/10 p-4">
                <span
                  className={`inline-block px-2 py-1 text-[10px] font-bold tracking-widest uppercase ${TRACK_BADGE[track]}`}
                >
                  {TRACK_LABEL[track]}
                </span>
                <p className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-bourbon-deep mt-2 leading-none">
                  {stat.count}
                  <span className="text-bourbon-stone text-sm font-normal">
                    {" "}
                    · {money(stat.value)}
                  </span>
                </p>
                <p className="text-bourbon-stone text-xs mt-2 leading-relaxed">
                  {TRACK_SUMMARY[track]}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {withWarnings > 0 && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-300">
          <p className="text-amber-900 text-sm font-semibold">
            {withWarnings} draft{withWarnings === 1 ? " has a warning" : "s have warnings"} on
            it.
          </p>
          <p className="text-amber-800 text-xs mt-1">
            A warning means the message would promise something we cannot yet
            do — most often payment details for a rail that has none
            configured. Those are left out of &ldquo;select all&rdquo;. Fix them
            under{" "}
            <Link href="/admin/payment-methods" className="underline">
              Payment methods
            </Link>{" "}
            and they clear.
          </p>
        </div>
      )}

      <FollowUpQueue
        drafts={queue.drafts.map((d) => ({
          ...d,
          history: (historyByOrder.get(d.orderId) ?? []).map((h) => ({
            sequence: h.sequence,
            track: h.track,
            subject: h.subject,
            status: h.status,
            error: h.error,
            sentAt: h.sentAt.toISOString(),
          })),
        }))}
        canSend={mailer.ready}
      />

      {queue.held.length > 0 && (
        <section className="mt-8">
          <h2 className="font-[family-name:var(--font-playfair)] text-xl font-bold text-bourbon-deep mb-1">
            Held back
          </h2>
          <p className="text-bourbon-stone text-xs mb-3 max-w-2xl">
            Unpaid orders deliberately not in the queue. Listed rather than
            hidden, because &ldquo;why is that one not here&rdquo; is the first
            thing you will want to know. The rules are: at most{" "}
            {MAX_FOLLOW_UPS} follow-ups per order, at least {MIN_GAP_DAYS} days
            apart, and nothing at all once muted.
          </p>
          <ul className="bg-white border border-bourbon-deep/10 divide-y divide-bourbon-deep/5">
            {queue.held.map((h) => (
              <li
                key={h.orderNumber}
                className="px-4 py-3 flex flex-wrap items-baseline gap-x-3 gap-y-1"
              >
                <span className="font-[family-name:var(--font-playfair)] font-bold text-bourbon-deep">
                  {h.orderNumber}
                </span>
                <span className="text-bourbon-stone text-xs">{h.reason}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <p className="text-bourbon-stone/80 text-xs mt-8 max-w-2xl leading-relaxed">
        How a track is chosen: a receipt we have not verified always wins, since
        that buyer has already done their part. Anything older than{" "}
        {STALE_DAYS} days asks whether they still want it rather than asking for
        money. Otherwise it comes down to whether we ever issued payment
        details. Only the <strong>{TRACK_LABEL.PAYMENT_DUE}</strong> track
        chases payment.
      </p>
    </>
  );
}
