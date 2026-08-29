"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePushEnable, pushSupported } from "@/lib/use-push-enable";
import {
  alreadyInstalled,
  detectPlatform,
  isStandalone,
  type BeforeInstallPromptEvent,
} from "@/lib/pwa";
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
 *
 * Two paths, because one of them is the only option on iPhone:
 *
 *   "enable"  — push works in this browser now, so it is a single tap.
 *   "install" — iOS Safari in an ordinary tab. Since 16.4 Safari delivers web
 *               push ONLY to a site added to the Home Screen, so Notification
 *               and PushManager do not even exist here. Offering an Enable
 *               button would be a button that cannot work; the honest ask is
 *               to install first, after which the app itself shows the enable
 *               step. Without this branch iPhone buyers saw nothing at all.
 */

const DISMISS_KEY = "bourbon:push-prompt-dismissed";

type Mode = "enable" | "install" | "none";

/** What this device can actually be offered, right now. */
function detectMode(): Mode {
  if (typeof window === "undefined") return "none";
  // Push available here: only worth asking if they have not already decided.
  if (pushSupported()) {
    return Notification.permission === "default" ? "enable" : "none";
  }
  // No Push API. On iOS that is expected until the app is installed.
  const onIos = detectPlatform() === "ios-safari";
  if (onIos && !isStandalone() && !alreadyInstalled()) return "install";
  return "none";
}

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
  const [mode, setMode] = useState<Mode>("none");
  /* Android/desktop can install in one tap via the captured event. iOS has no
     such API, which is why that path is written instructions instead. */
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [installing, setInstalling] = useState(false);

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
    const m = detectMode();
    if (m === "none") return;

    let cancelled = false;
    let timer = 0;

    const arm = (s: PushPromptSettings) => {
      if (cancelled || !s.enabled) return;
      timer = window.setTimeout(() => {
        // Re-checked at fire time: the persistent row may have been used to
        // enable notifications while the timer was running.
        if (cancelled) return;
        // Re-read at fire time: the row may have been used in the meantime,
        // or the app installed in another tab.
        const now = detectMode();
        if (now === "none") return;
        if (recentlyDismissed(s.repromptAfterDays)) return;
        setInstallEvent(window.__bipDeferred ?? null);
        setMode(now);
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

  /* One tap where the browser gives us its own prompt. Installing is optional
     here — push already works in this browser — so it sits under the primary
     action rather than in front of it. */
  async function install() {
    const evt = installEvent ?? window.__bipDeferred ?? null;
    if (!evt) return;
    setInstalling(true);
    try {
      await evt.prompt();
      await evt.userChoice;
    } catch {
      // A rejected prompt is not an error worth surfacing here.
    } finally {
      // The event is single-use once shown.
      window.__bipDeferred = null;
      setInstallEvent(null);
      setInstalling(false);
    }
  }

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
            {mode === "install"
              ? "Add the app to get order alerts"
              : "Get notified about your order"}
          </h2>
          <p id="push-dialog-body" className="text-bourbon-stone text-sm leading-relaxed mb-6">
            {waitingCount === 1
              ? "Your order is waiting on payment details."
              : `${waitingCount} of your orders are waiting on payment details.`}{" "}
            {mode === "install"
              ? "iPhone only sends alerts to apps on your Home Screen. Add ours — it takes about ten seconds."
              : "Turn on notifications and we'll ping this device when they're ready — and whenever we reply to your messages."}
          </p>

          {mode === "install" ? (
            <div className="text-left">
              <ol className="text-bourbon-stone text-[13px] leading-relaxed space-y-2.5 mb-1">
                <li className="flex gap-2.5">
                  <span className="shrink-0 w-5 h-5 bg-bourbon-deep text-bourbon-cream text-[11px] font-bold flex items-center justify-center">1</span>
                  <span>
                    Tap the{" "}
                    <span className="text-bourbon-deep font-semibold">Share</span>{" "}
                    button
                    <svg className="inline-block w-3.5 h-3.5 mx-1 -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 16V4m0 0L8 8m4-4l4 4M4 16v3a2 2 0 002 2h12a2 2 0 002-2v-3" />
                    </svg>
                    at the bottom of Safari.
                  </span>
                </li>
                <li className="flex gap-2.5">
                  <span className="shrink-0 w-5 h-5 bg-bourbon-deep text-bourbon-cream text-[11px] font-bold flex items-center justify-center">2</span>
                  <span>
                    Scroll and tap{" "}
                    <span className="text-bourbon-deep font-semibold">Add to Home Screen</span>.
                  </span>
                </li>
                <li className="flex gap-2.5">
                  <span className="shrink-0 w-5 h-5 bg-bourbon-deep text-bourbon-cream text-[11px] font-bold flex items-center justify-center">3</span>
                  <span>
                    Open Bourbon &amp; Oak from your Home Screen, then tap{" "}
                    <span className="text-bourbon-deep font-semibold">Enable notifications</span>.
                  </span>
                </li>
              </ol>
            </div>
          ) : state === "granted" ? (
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

          {/* Optional extra on Android/desktop: push already works, but an
              installed app makes the alerts land like any other app's. */}
          {mode === "enable" && state !== "granted" && installEvent && (
            <button
              type="button"
              onClick={install}
              disabled={installing}
              className="mt-3 w-full px-6 py-2.5 border border-bourbon-deep/20 text-bourbon-deep text-[11px] font-semibold tracking-[0.15em] uppercase hover:border-bourbon-gold hover:text-bourbon-gold transition-colors cursor-pointer disabled:opacity-60"
            >
              {installing ? "Opening…" : "Also install the app"}
            </button>
          )}

          {/* Hidden once granted — the dialog closes itself from there. */}
          {state !== "granted" && (
            <button
              type="button"
              onClick={close}
              className="mt-3 text-bourbon-stone text-[11px] tracking-wider uppercase hover:text-bourbon-deep transition-colors cursor-pointer"
            >
              {mode === "install" ? "Maybe later" : "Not now"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
