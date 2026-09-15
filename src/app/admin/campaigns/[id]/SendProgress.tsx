"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { SendSummary } from "@/lib/campaigns";

/**
 * Drives a send to completion from the browser.
 *
 * The server sends one batch per request (there is no job queue here), so this
 * keeps asking for the next batch until the campaign reports done. Closing the
 * tab just pauses it: the campaign stays SENDING, and opening it again offers
 * Resume, which continues from the first unclaimed recipient.
 */
export function useSendLoop(campaignId: string, initial: SendSummary | null) {
  const router = useRouter();
  const [summary, setSummary] = useState<SendSummary | null>(initial);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cancelled = useRef(false);

  useEffect(() => {
    cancelled.current = false;
    return () => {
      cancelled.current = true;
    };
  }, []);

  const call = useCallback(
    async (payload: Record<string, unknown>): Promise<SendSummary | null> => {
      const res = await fetch(`/api/admin/campaigns/${campaignId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await res.json().catch(() => ({}))) as SendSummary & { error?: string };
      if (!res.ok) {
        setError(data.error ?? `The server answered ${res.status}. Nothing further was sent.`);
        return null;
      }
      setSummary(data);
      return data;
    },
    [campaignId],
  );

  /** Send batches until done. `first` carries the confirmation on the opening call. */
  const run = useCallback(
    async (first: Record<string, unknown> = {}) => {
      setRunning(true);
      setError(null);
      let payload: Record<string, unknown> = { action: "send", ...first };
      let lastProgress = -1;
      let stalls = 0;
      try {
        while (!cancelled.current) {
          const s = await call(payload);
          if (!s || s.done) break;
          payload = { action: "send" };
          /* A batch that moved nothing twice in a row means another tab is
             sending this campaign, or the rest are stuck unconfirmed. Stop
             rather than spin. */
          const progress = s.sent + s.failed + s.unconfirmed;
          stalls = progress === lastProgress ? stalls + 1 : 0;
          lastProgress = progress;
          if (stalls >= 2) {
            setError("Sending stopped making progress. Refresh to see the latest state, then resume.");
            break;
          }
        }
      } catch {
        setError("Network error. Nothing is lost — resume to carry on from where it stopped.");
      } finally {
        setRunning(false);
        router.refresh();
      }
    },
    [call, router],
  );

  const retryFailed = useCallback(async () => {
    setError(null);
    const s = await call({ action: "retry-failed" });
    if (s) await run();
  }, [call, run]);

  return { summary, running, error, run, retryFailed };
}

export default function SendProgress({
  loop,
}: {
  loop: ReturnType<typeof useSendLoop>;
}) {
  const { summary, running, error, run, retryFailed } = loop;
  if (!summary) return null;

  const handled = summary.sent + summary.failed + summary.unconfirmed;
  const pct = summary.total ? Math.round((handled / summary.total) * 100) : 100;
  const paused = summary.status === "SENDING" && !running;

  return (
    <section className="bg-white border border-bourbon-deep/10 p-5 sm:p-6">
      <div className="flex items-baseline justify-between gap-3 flex-wrap">
        <h2 className="font-[family-name:var(--font-playfair)] text-xl font-bold text-bourbon-deep">
          {running ? "Sending…" : summary.done ? "Sent" : paused ? "Paused" : "Ready"}
        </h2>
        <p className="text-sm tabular-nums text-bourbon-stone">
          {handled} of {summary.total}
        </p>
      </div>

      <div
        className="mt-3 h-2 bg-bourbon-deep/10 overflow-hidden"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className="h-full bg-bourbon-gold transition-[width] duration-500" style={{ width: `${pct}%` }} />
      </div>

      <dl className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
        <Stat label="Delivered" value={summary.sent} tone="text-emerald-700" />
        <Stat label="Failed" value={summary.failed} tone={summary.failed ? "text-rose-700" : "text-bourbon-deep"} />
        <Stat label="Not sent yet" value={summary.remaining} tone="text-bourbon-deep" />
        <Stat label="Unconfirmed" value={summary.unconfirmed} tone={summary.unconfirmed ? "text-amber-700" : "text-bourbon-deep"} />
      </dl>

      {summary.unconfirmed > 0 && !running && (
        <p className="mt-4 text-xs text-amber-800 bg-amber-50 border border-amber-200 px-3 py-2">
          {summary.unconfirmed} {summary.unconfirmed === 1 ? "message was" : "messages were"} handed to Brevo but
          the send stopped before it confirmed. They may have been delivered, so they are not retried automatically.
        </p>
      )}

      {error && <p className="mt-4 text-sm text-rose-700" role="alert">{error}</p>}

      <div className="mt-5 flex flex-wrap gap-2">
        {paused && (
          <button
            type="button"
            onClick={() => run()}
            className="min-h-11 px-5 bg-bourbon-deep text-bourbon-cream text-xs tracking-widest uppercase font-semibold hover:bg-bourbon-gold hover:text-bourbon-deep transition-colors cursor-pointer"
          >
            Resume sending
          </button>
        )}
        {summary.failed > 0 && !running && (
          <button
            type="button"
            onClick={retryFailed}
            className="min-h-11 px-5 border border-bourbon-deep/20 text-bourbon-deep text-xs tracking-widest uppercase font-semibold hover:border-bourbon-gold hover:text-bourbon-gold transition-colors cursor-pointer"
          >
            Retry {summary.failed} failed
          </button>
        )}
      </div>

      {summary.failures.length > 0 && (
        <details className="mt-5 group">
          <summary className="cursor-pointer text-sm font-semibold text-bourbon-deep select-none">
            Failed addresses ({summary.failures.length})
          </summary>
          <ul className="mt-3 divide-y divide-bourbon-deep/5 border border-bourbon-deep/10">
            {summary.failures.map((f) => (
              <li key={f.email} className="px-3 py-2 text-sm">
                <p className="font-medium text-bourbon-deep break-all">{f.email}</p>
                <p className="text-xs text-bourbon-stone mt-0.5 break-words">{f.error}</p>
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="border border-bourbon-deep/10 px-3 py-2.5">
      <dt className="text-[10px] tracking-widest uppercase text-bourbon-stone">{label}</dt>
      <dd className={`mt-1 text-xl font-semibold tabular-nums ${tone}`}>{value}</dd>
    </div>
  );
}
