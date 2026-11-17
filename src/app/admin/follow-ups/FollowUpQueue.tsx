"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  FOLLOW_UP_BATCH_SIZE,
  MIN_DETAILS_LEN,
  TRACK_BADGE,
  TRACK_LABEL,
  type FollowUpDraft,
  type RailDetailsRow,
} from "@/lib/follow-up-constants";

interface HistoryRow {
  sequence: number;
  track: string;
  subject: string;
  status: string;
  error: string | null;
  sentAt: string;
}

type Row = FollowUpDraft & { history: HistoryRow[] };

interface Edit {
  subject: string;
  /** Paragraphs as one textarea's worth of text, split on blank lines. */
  body: string;
}

const money = (v: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(v);

const ordinal = (n: number) =>
  n === 1 ? "1st" : n === 2 ? "2nd" : n === 3 ? "3rd" : `${n}th`;

/** Blank-line-separated text back into paragraphs. */
const toParagraphs = (body: string) =>
  body
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s*\n\s*/g, " ").trim())
    .filter(Boolean);

export default function FollowUpQueue({
  drafts,
  rails,
  canSend,
}: {
  drafts: Row[];
  rails: RailDetailsRow[];
  canSend: boolean;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [edits, setEdits] = useState<Record<string, Edit>>({});
  /* Payment details being typed, per order and per rail. Both start from
     whatever the server rendered, so an untouched field submits what is
     already there rather than an empty string. */
  const [details, setDetails] = useState<Record<string, string>>({});
  const [railDrafts, setRailDrafts] = useState<Record<string, string>>({});
  const [reuseRail, setReuseRail] = useState<Set<string>>(new Set());
  const [openId, setOpenId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ kind: "ok" | "bad"; lines: string[] } | null>(null);
  const [preview, setPreview] = useState<{ orderId: string; subject: string; html: string } | null>(
    null,
  );
  /* Orders dealt with in this session. The server component re-renders on
     router.refresh() and they drop out of the queue, but the refresh is not
     instant and a row that still looks sendable invites a second send. */
  const [done, setDone] = useState<Set<string>>(new Set());

  const safeIds = useMemo(
    () => drafts.filter((d) => d.warnings.length === 0).map((d) => d.orderId),
    [drafts],
  );

  const live = drafts.filter((d) => !done.has(d.orderId));
  const selectedLive = live.filter((d) => selected.has(d.orderId));

  const editOf = (d: Row): Edit =>
    edits[d.orderId] ?? { subject: d.subject, body: d.paragraphs.join("\n\n") };

  const isEdited = (d: Row) => {
    const e = edits[d.orderId];
    if (!e) return false;
    return e.subject !== d.subject || e.body !== d.paragraphs.join("\n\n");
  };

  function setEdit(orderId: string, patch: Partial<Edit>, base: Edit) {
    setEdits((prev) => ({ ...prev, [orderId]: { ...base, ...patch } }));
  }

  const detailsOf = (d: Row) => details[d.orderId] ?? d.detailsDraft;
  const railDraftOf = (r: RailDetailsRow) => railDrafts[r.key] ?? r.template;

  /** Write the details against this order, without mailing anyone. */
  async function saveDetails(d: Row) {
    const typed = detailsOf(d).trim();
    setBusy(true);
    setNote(null);
    try {
      await post({
        action: "stage-details",
        orderId: d.orderId,
        details: typed,
        railKey: d.railKey,
        alsoSaveTemplate: d.railKey ? reuseRail.has(d.orderId) : false,
      });
      setDetails((prev) => {
        const next = { ...prev };
        delete next[d.orderId];
        return next;
      });
      setNote({
        kind: "ok",
        lines: [
          `Saved against ${d.orderNumber}. The buyer sees nothing until you send.`,
          "The draft has been rewritten to point at them.",
        ],
      });
      router.refresh();
    } catch (err) {
      setNote({ kind: "bad", lines: [(err as Error).message] });
    } finally {
      setBusy(false);
    }
  }

  /** Save a rail's starting point, so the next order on it is prefilled. */
  async function saveRail(r: RailDetailsRow) {
    setBusy(true);
    setNote(null);
    try {
      await post({
        action: "save-template",
        railKey: r.key,
        details: railDraftOf(r),
      });
      setRailDrafts((prev) => {
        const next = { ...prev };
        delete next[r.key];
        return next;
      });
      setNote({
        kind: "ok",
        lines: [
          `${r.label} details saved. They now prefill every ${r.label} order in the queue.`,
          "Nothing has been sent, and no buyer can see them yet.",
        ],
      });
      router.refresh();
    } catch (err) {
      setNote({ kind: "bad", lines: [(err as Error).message] });
    } finally {
      setBusy(false);
    }
  }

  function toggle(orderId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) next.delete(orderId);
      else next.add(orderId);
      return next;
    });
  }

  async function post(payload: Record<string, unknown>) {
    const res = await fetch("/api/admin/follow-ups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) throw new Error((data.error as string) ?? "The request failed.");
    return data;
  }

  async function sendOne(d: Row) {
    const e = edits[d.orderId];
    const body: Record<string, unknown> = { action: "send", orderId: d.orderId };
    if (e) {
      body.subject = e.subject;
      body.paragraphs = toParagraphs(e.body);
    }
    /* One press does both: stage the details against the order, then send the
       email that points at them. */
    if (d.needsDetails) {
      const typed = detailsOf(d).trim();
      if (typed.length >= MIN_DETAILS_LEN) body.details = typed;
    }
    setBusy(true);
    setNote(null);
    try {
      await post(body);
      setDone((prev) => new Set(prev).add(d.orderId));
      setOpenId(null);
      setNote({
        kind: "ok",
        lines: [
          `Sent to ${d.email} — ${d.orderNumber}.`,
          d.needsDetails && detailsOf(d).trim().length >= MIN_DETAILS_LEN
            ? "The payment details went live on their order page at the same moment."
            : "",
        ].filter(Boolean),
      });
      router.refresh();
    } catch (err) {
      setNote({ kind: "bad", lines: [(err as Error).message] });
    } finally {
      setBusy(false);
    }
  }

  /**
   * Send the selection in chunks the route will accept.
   *
   * Sequential rather than parallel: each chunk holds an SMTP connection, and
   * the point of a cap is to keep one request's work inside one request. A
   * chunk that fails stops the run — whatever it was, the next chunk will most
   * likely hit it too, and half a queue mailed is easier to reason about than
   * a scattered one.
   */
  async function sendSelected() {
    const ids = selectedLive.map((d) => d.orderId);
    if (ids.length === 0) return;
    const warned = selectedLive.filter((d) => d.warnings.length > 0).length;
    const message =
      `Send ${ids.length} follow-up${ids.length === 1 ? "" : "s"} now?` +
      (warned > 0
        ? `\n\n${warned} of them has a warning on it — the message may promise something we cannot yet do.`
        : "");
    if (!window.confirm(message)) return;

    setBusy(true);
    setNote(null);
    const lines: string[] = [];
    let sent = 0;
    let failed = 0;

    try {
      for (let i = 0; i < ids.length; i += FOLLOW_UP_BATCH_SIZE) {
        const chunk = ids.slice(i, i + FOLLOW_UP_BATCH_SIZE);
        const data = (await post({ action: "send-batch", orderIds: chunk })) as {
          sent: number;
          failed: number;
          outcomes: {
            orderId: string;
            orderNumber: string;
            ok: boolean;
            error?: string;
          }[];
        };
        sent += data.sent;
        failed += data.failed;
        for (const o of data.outcomes) {
          if (o.ok) setDone((prev) => new Set(prev).add(o.orderId));
          else lines.push(`${o.orderNumber}: ${o.error}`);
        }
      }
      setSelected(new Set());
      setNote({
        kind: failed > 0 ? "bad" : "ok",
        lines: [
          `${sent} sent${failed > 0 ? `, ${failed} not sent` : ""}.`,
          ...lines.slice(0, 8),
        ],
      });
    } catch (err) {
      setNote({
        kind: "bad",
        lines: [
          (err as Error).message,
          sent > 0 ? `${sent} had already gone out before this stopped.` : "Nothing was sent.",
        ],
      });
    } finally {
      setBusy(false);
      router.refresh();
    }
  }

  async function showPreview(d: Row) {
    const e = edits[d.orderId];
    setBusy(true);
    setNote(null);
    try {
      const data = (await post({
        action: "preview",
        orderId: d.orderId,
        ...(e ? { subject: e.subject, paragraphs: toParagraphs(e.body) } : {}),
      })) as { subject: string; html: string };
      setPreview({ orderId: d.orderId, subject: data.subject, html: data.html });
    } catch (err) {
      setNote({ kind: "bad", lines: [(err as Error).message] });
    } finally {
      setBusy(false);
    }
  }

  async function mute(d: Row) {
    if (
      !window.confirm(
        `Stop chasing ${d.orderNumber} for good?\n\nThe order itself is untouched — only the follow-ups stop.`,
      )
    )
      return;
    setBusy(true);
    try {
      await post({ action: "mute", orderId: d.orderId });
      setDone((prev) => new Set(prev).add(d.orderId));
      setNote({ kind: "ok", lines: [`${d.orderNumber} muted.`] });
      router.refresh();
    } catch (err) {
      setNote({ kind: "bad", lines: [(err as Error).message] });
    } finally {
      setBusy(false);
    }
  }

  if (drafts.length === 0) {
    return (
      <p className="bg-white border border-bourbon-deep/10 px-5 py-12 text-bourbon-stone text-sm text-center">
        Nothing to follow up. Every unpaid order has either been chased
        recently, hit the cap, or been muted.
      </p>
    );
  }

  const railsNeeding = rails.filter((r) => r.needing > 0);

  return (
    <>
      {/* Payment details, by method.
          This panel is here rather than on the Payment methods page on
          purpose: rails carry no account details by design, and the details
          themselves belong to one order. What is saved here is only a
          starting point that prefills the per-order editor below, which is
          what spares typing the same Chime account four times. */}
      {rails.length > 0 && (
        <section className="mb-6 bg-white border border-bourbon-deep/10">
          <div className="p-4 border-b border-bourbon-deep/10">
            <h2 className="font-[family-name:var(--font-playfair)] text-xl font-bold text-bourbon-deep">
              Payment details, by method
            </h2>
            <p className="text-bourbon-stone text-xs mt-1 max-w-2xl leading-relaxed">
              {railsNeeding.length > 0 ? (
                <>
                  <strong className="text-rose-800">
                    {railsNeeding.reduce((n, r) => n + r.needing, 0)} buyers have
                    nowhere to pay.
                  </strong>{" "}
                  Fill in a method here and every order on it is prefilled
                  below, ready to go out with its follow-up.
                </>
              ) : (
                <>
                  Saved as a starting point for each method. Nothing here is
                  ever emailed, and nothing reaches a buyer until it is saved
                  against their own order below.
                </>
              )}
            </p>
          </div>
          <ul className="divide-y divide-bourbon-deep/5">
            {rails.map((r) => {
              const draft = railDraftOf(r);
              const dirty = draft !== r.template;
              /* An empty save is how a starting point is cleared, so it is
                 allowed; a three-character one is a slip, so it is not. */
              const trimmed = draft.trim();
              const canSaveRail =
                dirty && (trimmed === "" || trimmed.length >= MIN_DETAILS_LEN);
              return (
                <li key={r.key} className="p-4">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-2">
                    <span className="text-bourbon-deep text-sm font-semibold">
                      {r.label}
                    </span>
                    <span className="text-bourbon-stone text-xs">
                      {r.orders} order{r.orders === 1 ? "" : "s"} in the queue
                    </span>
                    {r.needing > 0 && (
                      <span className="px-2 py-0.5 text-[10px] font-bold tracking-widest uppercase bg-rose-100 text-rose-800">
                        {r.needing} with nowhere to pay
                      </span>
                    )}
                    {r.template && r.needing === 0 && (
                      <span className="px-2 py-0.5 text-[10px] font-bold tracking-widest uppercase bg-emerald-100 text-emerald-800">
                        Ready
                      </span>
                    )}
                  </div>
                  <textarea
                    value={draft}
                    onChange={(e) =>
                      setRailDrafts((prev) => ({ ...prev, [r.key]: e.target.value }))
                    }
                    rows={draft ? 6 : 4}
                    placeholder={`Where a ${r.label} payment should go.\nAccount name: …\nAccount / handle: …\nReference: quote your order number`}
                    className="w-full px-3 py-2.5 bg-white border border-bourbon-deep/15 text-bourbon-deep text-sm leading-relaxed focus:outline-none focus:border-bourbon-gold transition-colors"
                  />
                  <div className="flex flex-wrap items-center gap-3 mt-2">
                    <button
                      type="button"
                      disabled={busy || !canSaveRail}
                      onClick={() => saveRail(r)}
                      className="px-4 py-2 bg-bourbon-gold text-bourbon-deep text-xs font-semibold tracking-widest uppercase hover:bg-bourbon-amber transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {!dirty && r.template
                        ? "Saved"
                        : trimmed === "" && dirty
                          ? `Clear ${r.label} details`
                          : `Save ${r.label} details`}
                    </button>
                    <p className="text-bourbon-stone text-xs flex-1 min-w-[14rem]">
                      Add the order number as the reference per order below —
                      that is the only way to tell two payments apart.
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Toolbar */}
      <div className="sticky top-0 z-10 bg-bourbon-cream/95 backdrop-blur-sm py-3 mb-4 flex flex-wrap items-center gap-2 border-b border-bourbon-deep/10">
        <button
          type="button"
          onClick={() => setSelected(new Set(safeIds.filter((id) => !done.has(id))))}
          className="px-3 py-2 border border-bourbon-deep/20 text-bourbon-deep text-xs font-semibold tracking-widest uppercase hover:border-bourbon-gold transition-colors cursor-pointer"
        >
          Select all without warnings
        </button>
        {selected.size > 0 && (
          <button
            type="button"
            onClick={() => setSelected(new Set())}
            className="px-3 py-2 border border-bourbon-deep/20 text-bourbon-stone text-xs tracking-widest uppercase hover:border-bourbon-gold transition-colors cursor-pointer"
          >
            Clear
          </button>
        )}
        <span className="flex-1" />
        <button
          type="button"
          disabled={busy || !canSend || selectedLive.length === 0}
          onClick={sendSelected}
          className="px-5 py-2.5 bg-bourbon-deep text-bourbon-cream text-xs font-semibold tracking-widest uppercase hover:bg-bourbon-gold hover:text-bourbon-deep transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {busy
            ? "Sending\u2026"
            : selectedLive.length > 0
              ? `Send ${selectedLive.length} selected`
              : "Send selected"}
        </button>
      </div>

      {note && (
        <div
          className={`mb-4 p-4 border text-sm ${
            note.kind === "ok"
              ? "bg-emerald-50 border-emerald-300 text-emerald-900"
              : "bg-rose-50 border-rose-300 text-rose-900"
          }`}
        >
          {note.lines.map((line, i) => (
            <p key={i} className={i === 0 ? "font-semibold" : "text-xs mt-1"}>
              {line}
            </p>
          ))}
        </div>
      )}

      <ul className="space-y-3">
        {drafts.map((d) => {
          const edit = editOf(d);
          const isDone = done.has(d.orderId);
          const open = openId === d.orderId;
          return (
            <li
              key={d.orderId}
              className={`bg-white border transition-colors ${
                isDone
                  ? "border-emerald-300 opacity-60"
                  : selected.has(d.orderId)
                    ? "border-bourbon-gold"
                    : "border-bourbon-deep/10"
              }`}
            >
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selected.has(d.orderId)}
                    disabled={isDone}
                    onChange={() => toggle(d.orderId)}
                    aria-label={`Select ${d.orderNumber}`}
                    className="mt-1 h-4 w-4 accent-bourbon-gold cursor-pointer disabled:cursor-not-allowed"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <Link
                        href={`/admin/orders/${d.orderId}`}
                        className="font-[family-name:var(--font-playfair)] font-bold text-bourbon-deep hover:text-bourbon-gold transition-colors"
                      >
                        {d.orderNumber}
                      </Link>
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold tracking-widest uppercase ${TRACK_BADGE[d.track]}`}
                      >
                        {TRACK_LABEL[d.track]}
                      </span>
                      <span className="text-bourbon-stone text-xs">
                        {ordinal(d.sequence)} follow-up · {d.ageDays} days old
                      </span>
                      {isDone && (
                        <span className="px-2 py-0.5 text-[10px] font-bold tracking-widest uppercase bg-emerald-100 text-emerald-800">
                          Done
                        </span>
                      )}
                      <span className="ml-auto font-[family-name:var(--font-playfair)] font-bold text-bourbon-deep">
                        {money(d.total)}
                      </span>
                    </div>
                    <p className="text-bourbon-deep text-sm font-semibold mt-1.5">
                      {d.fullName}{" "}
                      <span className="font-normal text-bourbon-stone break-words">
                        {d.email}
                      </span>
                    </p>
                    <p className="text-bourbon-stone text-xs mt-0.5">
                      {d.bottles} · {d.rail} · placed {d.placedOn}
                    </p>
                    <p className="text-bourbon-stone/80 text-xs mt-2 leading-relaxed">
                      {d.reason}
                    </p>

                    {d.warnings.map((w) => (
                      <p
                        key={w}
                        className="mt-2 px-3 py-2 bg-amber-50 border border-amber-300 text-amber-900 text-xs leading-relaxed"
                      >
                        {w}
                      </p>
                    ))}

                    {/* The fix for the warning above, in place. A staged
                        body is invisible to the buyer until a send issues it,
                        so there is nothing to undo if it is typed wrong. */}
                    {d.needsDetails && !isDone && (
                      <div className="mt-3 p-3 bg-bourbon-deep/[0.03] border border-bourbon-deep/10">
                        <p className="text-[10px] tracking-widest uppercase text-bourbon-stone mb-1.5">
                          {d.willIssueDetails
                            ? `${d.rail} details — go live when you send`
                            : `${d.rail} details for this order`}
                        </p>
                        <textarea
                          value={detailsOf(d)}
                          onChange={(e) =>
                            setDetails((prev) => ({
                              ...prev,
                              [d.orderId]: e.target.value,
                            }))
                          }
                          rows={6}
                          placeholder={`Account name: …\nAccount / handle: …\nReference: ${d.orderNumber}`}
                          className="w-full px-3 py-2 bg-white border border-bourbon-deep/15 text-bourbon-deep text-sm leading-relaxed focus:outline-none focus:border-bourbon-gold transition-colors"
                        />
                        <div className="flex flex-wrap items-center gap-3 mt-2">
                          <button
                            type="button"
                            disabled={
                              busy || detailsOf(d).trim().length < MIN_DETAILS_LEN
                            }
                            onClick={() => saveDetails(d)}
                            className="px-3 py-1.5 border border-bourbon-gold text-bourbon-deep text-xs font-semibold tracking-widest uppercase hover:bg-bourbon-gold transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            Save without sending
                          </button>
                          {d.railKey && (
                            <label className="flex items-center gap-2 text-bourbon-stone text-xs cursor-pointer">
                              <input
                                type="checkbox"
                                checked={reuseRail.has(d.orderId)}
                                onChange={() =>
                                  setReuseRail((prev) => {
                                    const next = new Set(prev);
                                    if (next.has(d.orderId)) next.delete(d.orderId);
                                    else next.add(d.orderId);
                                    return next;
                                  })
                                }
                                className="h-3.5 w-3.5 accent-bourbon-gold cursor-pointer"
                              />
                              Also keep as the {d.rail} starting point
                            </label>
                          )}
                        </div>
                        <p className="text-bourbon-stone text-xs mt-2 leading-relaxed">
                          {d.willIssueDetails
                            ? "Saved. Sending puts these on their order page and the email now says so. The buyer sees nothing before that."
                            : "Shown on their order page only — never in the email. Pressing send saves and issues these in one go."}
                        </p>
                      </div>
                    )}

                    {d.history.length > 0 && (
                      <ul className="mt-2 text-xs text-bourbon-stone space-y-0.5">
                        {d.history.map((h) => (
                          <li key={h.sequence}>
                            {ordinal(h.sequence)} ·{" "}
                            {new Date(h.sentAt).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                            })}{" "}
                            · {h.subject}
                            {h.status !== "SENT" && (
                              <span className="text-rose-700">
                                {" "}
                                — {h.status.toLowerCase()}
                                {h.error ? `: ${h.error}` : ""}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-3 pl-7">
                  <button
                    type="button"
                    onClick={() => setOpenId(open ? null : d.orderId)}
                    className="px-3 py-1.5 border border-bourbon-deep/20 text-bourbon-deep text-xs font-semibold tracking-widest uppercase hover:border-bourbon-gold transition-colors cursor-pointer"
                  >
                    {open ? "Hide draft" : "Read draft"}
                    {isEdited(d) && <span className="text-bourbon-gold"> · edited</span>}
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => showPreview(d)}
                    className="px-3 py-1.5 border border-bourbon-deep/20 text-bourbon-deep text-xs tracking-widest uppercase hover:border-bourbon-gold transition-colors cursor-pointer disabled:opacity-40"
                  >
                    Preview email
                  </button>
                  <button
                    type="button"
                    disabled={busy || !canSend || isDone}
                    onClick={() => sendOne(d)}
                    className="px-3 py-1.5 bg-bourbon-deep text-bourbon-cream text-xs font-semibold tracking-widest uppercase hover:bg-bourbon-gold hover:text-bourbon-deep transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Send this one
                  </button>
                  <button
                    type="button"
                    disabled={busy || isDone}
                    onClick={() => mute(d)}
                    className="px-3 py-1.5 border border-bourbon-deep/15 text-bourbon-stone text-xs tracking-widest uppercase hover:border-rose-400 hover:text-rose-700 transition-colors cursor-pointer disabled:opacity-40"
                  >
                    Never chase
                  </button>
                </div>
              </div>

              {open && (
                <div className="border-t border-bourbon-deep/10 p-4 bg-bourbon-deep/[0.02]">
                  <label className="block">
                    <span className="block text-[10px] tracking-widest uppercase text-bourbon-stone mb-1">
                      Subject
                    </span>
                    <input
                      value={edit.subject}
                      onChange={(e) =>
                        setEdit(d.orderId, { subject: e.target.value }, edit)
                      }
                      maxLength={200}
                      className="w-full px-3 py-2 bg-white border border-bourbon-deep/15 text-bourbon-deep text-sm focus:outline-none focus:border-bourbon-gold"
                    />
                  </label>
                  <label className="block mt-3">
                    <span className="block text-[10px] tracking-widest uppercase text-bourbon-stone mb-1">
                      Message · blank line between paragraphs
                    </span>
                    <textarea
                      value={edit.body}
                      onChange={(e) => setEdit(d.orderId, { body: e.target.value }, edit)}
                      rows={10}
                      className="w-full px-3 py-2 bg-white border border-bourbon-deep/15 text-bourbon-deep text-sm leading-relaxed focus:outline-none focus:border-bourbon-gold"
                    />
                  </label>
                  <div className="flex flex-wrap items-center gap-3 mt-2">
                    <p className="text-bourbon-stone text-xs flex-1 min-w-[16rem]">
                      The &ldquo;{d.ctaLabel}&rdquo; button and the one-click
                      sign-in link are added when it sends, so they cannot be
                      edited away. No payment details ever go in the email
                      itself.
                    </p>
                    {isEdited(d) && (
                      <button
                        type="button"
                        onClick={() =>
                          setEdits((prev) => {
                            const next = { ...prev };
                            delete next[d.orderId];
                            return next;
                          })
                        }
                        className="px-3 py-1.5 border border-bourbon-deep/20 text-bourbon-stone text-xs tracking-widest uppercase hover:border-bourbon-gold transition-colors cursor-pointer"
                      >
                        Reset to draft
                      </button>
                    )}
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {/* Preview, rendered in an iframe so the email's own styles apply and
          cannot reach the admin panel around it. */}
      {preview && (
        <div
          className="fixed inset-0 z-50 bg-bourbon-deep/60 flex items-center justify-center p-4"
          onClick={() => setPreview(null)}
          role="presentation"
        >
          <div
            className="bg-white w-full max-w-xl max-h-[88vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3 p-4 border-b border-bourbon-deep/10">
              <div className="flex-1 min-w-0">
                <p className="text-[10px] tracking-widest uppercase text-bourbon-stone">
                  Subject
                </p>
                <p className="text-bourbon-deep text-sm font-semibold break-words">
                  {preview.subject}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreview(null)}
                className="px-3 py-1.5 border border-bourbon-deep/20 text-bourbon-deep text-xs tracking-widest uppercase hover:border-bourbon-gold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
            <iframe
              title="Email preview"
              srcDoc={preview.html}
              sandbox=""
              className="flex-1 w-full min-h-[50vh] bg-white"
            />
            <p className="px-4 py-3 text-bourbon-stone text-xs border-t border-bourbon-deep/10">
              The button links to the plain account page here. A real send mints
              a one-click sign-in link for this buyer instead — previewing does
              not use one up.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
