"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePushEnable, pushSupported } from "@/lib/use-push-enable";
import {
  DEFAULT_PUSH_PROMPT_SETTINGS,
  normalizePushPromptSettings,
  type PushPromptSettings,
} from "@/lib/push-prompt-constants";

/**
 * Dashboard opt-in for payment-detail alerts.
 *
 * Deliberately a real modal rather than a banner: this is the one moment the
 * buyer is signed in AND waiting on something, so the subscription can be
 * attached to their customer record — a subscription made while signed out
 * stores customerId: null and can never be pushed to.
 *
 * It only appears when there is a concrete reason (an order still waiting on
 * details), it can always be dismissed, and dismissal is remembered. Nothing
 * in the flow depends on it: details still land on the dashboard and an email
 * still goes out.
 */

const DISMISS_KEY = "bourbon:push-prompt-dismissed";

/* How long a success message stays up before the dialog dismisses itself.
   Long enough to read the tick, short enough not to need a second click. */
const CLOSE_AFTER_SUCCESS_MS = 1400;

function recentlyDismissed(withinDays: number): boolean {
  // 0 days means "ask again on the next visit".
  if (withinDays <= 0) return false;
  try {
    const raw = window.localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    const ts = Number(raw);
    if (!Number.isFinite(ts)) return false;
    return Date.now() - ts < withinDays * 24 * 60 * 60 * 1000;
  } catch {
    // Private mode / blocked storage: treat as never dismissed.
    return false;
  }
}

export default function EnablePushDialog({
  waitingCount,
}: {
  /** Orders still waiting on payment details. Zero means no reason to ask. */
  waitingCount: number;
}) {
  const { state, enable } = usePushEnable();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const close = useCallback(() => {
    try {
      window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      // Nothing to do — worst case it asks again next visit.
    }
    setOpen(false);
  }, []);

  /* Timing is admin-configurable (Admin > Settings), fetched the same way the
     email popup fetches its own. A failed fetch falls back to the built-in
     defaults rather than leaving the prompt permanently silent. */
  useEffect(() => {
    if (waitingCount < 1) return;
    if (!pushSupported()) return;
    if (Notification.permission !== "default") return; // already granted or blocked

    let cancelled = false;
    let timer = 0;

    const arm = (s: PushPromptSettings) => {
      if (cancelled || !s.enabled) return;
      timer = window.setTimeout(() => {
        // Re-checked at fire time: the persistent row may have been used to
        // enable notifications while the timer was running.
        if (cancelled) return;
        if (Notification.permission !== "default") return;
        if (recentlyDismissed(s.repromptAfterDays)) return;
        setOpen(true);
      }, s.delaySeconds * 1000);
    };

    fetch("/api/push-prompt-settings")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) =>
        arm(data ? normalizePushPromptSettings(data) : DEFAULT_PUSH_PROMPT_SETTINGS),
      )
      .catch(() => arm(DEFAULT_PUSH_PROMPT_SETTINGS));

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [waitingCount]);

  /* Once permission is granted the dialog has nothing left to ask, so it
     dismisses itself after showing the confirmation. Closed directly rather
     than through close(): there is no dismissal to remember, and the
     permission check above already stops it reappearing. */
  useEffect(() => {
    if (!open || state !== "granted") return;
    const t = window.setTimeout(() => setOpen(false), CLOSE_AFTER_SUCCESS_MS);
    return () => window.clearTimeout(t);
  }, [open, state]);

  // Escape closes, and focus moves into the dialog so it is reachable by
  // keyboard rather than being an unlabelled visual layer.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    closeRef.current?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  if (!open) return null;

  const busy = state === "working";

  return (
    <div
      /* Above the chat widget and the newsletter popup (both z-90), which would
         otherwise cover a dialog that is asking for a decision — the chat opens
         itself on a timer. Still below the age gate (z-100), which has to come
         first. */
      className="fixed inset-0 z-[95] flex items-center justify-center p-4 bg-bourbon-deep/70 backdrop-blur-sm animate-fade-in"
      /* Clicking the backdrop dismisses, but only the backdrop itself — not a
         click that started inside the panel and drifted out. */
      onMouseDown={(e) => {
        if (!panelRef.current?.contains(e.target as Node)) close();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="push-dialog-title"
        aria-describedby="push-dialog-body"
        className="animate-pop-in relative w-full max-w-sm bg-white shadow-2xl shadow-black/40"
      >
        <div className="h-1 bg-gradient-to-r from-transparent via-bourbon-gold to-transparent" />

        <button
          ref={closeRef}
          type="button"
          onClick={close}
          aria-label="Not now"
          className="absolute top-2.5 right-2.5 w-8 h-8 flex items-center justify-center text-bourbon-stone/60 hover:text-bourbon-deep transition-colors cursor-pointer text-2xl leading-none"
        >
          &times;
        </button>

        <div className="p-6 pt-7 text-center">
          <span className="mx-auto mb-4 w-12 h-12 bg-bourbon-gold flex items-center justify-center">
            <svg className="w-6 h-6 text-bourbon-deep" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.75}
                d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2c0 .5-.2 1-.6 1.4L4 17h5m6 0a3 3 0 11-6 0m6 0H9"
              />
            </svg>
          </span>

          <p className="text-bourbon-gold text-[10px] tracking-[0.3em] uppercase font-semibold mb-2">
            Don&apos;t miss it
          </p>
          <h2
            id="push-dialog-title"
            className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-bourbon-deep leading-tight mb-2.5"
          >
            Get notified about your order
          </h2>
          <p id="push-dialog-body" className="text-bourbon-stone text-sm leading-relaxed mb-6">
            {waitingCount === 1
              ? "Your order is waiting on payment details."
              : `${waitingCount} of your orders are waiting on payment details.`}{" "}
            Turn on notifications and we&apos;ll ping this device when
            they&apos;re ready &mdash; and whenever we reply to your messages.
          </p>

          {state === "granted" ? (
            <p className="text-bourbon-deep text-sm flex items-center justify-center gap-2 py-2">
              <span className="text-bourbon-gold text-lg" aria-hidden="true">✓</span>
              You&apos;re all set — we&apos;ll let you know.
            </p>
          ) : state === "denied" ? (
            <p className="text-bourbon-stone text-[13px] bg-bourbon-cream border border-bourbon-deep/10 p-3">
              Notifications are blocked for this site in your browser settings.
              You&apos;ll still get an email, and everything always appears here.
            </p>
          ) : (
            <button
              type="button"
              onClick={enable}
              disabled={busy}
              className="w-full px-6 py-3.5 bg-bourbon-gold text-bourbon-deep text-xs font-bold tracking-[0.15em] uppercase hover:bg-bourbon-amber transition-colors cursor-pointer disabled:opacity-60"
            >
              {busy ? "Enabling…" : "Enable notifications"}
            </button>
          )}

          {state === "error" && (
            <p className="text-red-600 text-[12px] mt-3">
              Couldn&apos;t turn notifications on. You&apos;ll still get an email.
            </p>
          )}

          {/* Hidden once granted — the dialog closes itself from there. */}
          {state !== "granted" && (
            <button
              type="button"
              onClick={close}
              className="mt-3 text-bourbon-stone text-[11px] tracking-wider uppercase hover:text-bourbon-deep transition-colors cursor-pointer"
            >
              Not now
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
