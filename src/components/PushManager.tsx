"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const SUBSCRIBED_KEY = "bol_push_subscribed";
const DISMISSED_AT_KEY = "bol_push_banner_dismissed_at";
const DISMISS_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const buffer = new ArrayBuffer(raw.length);
  const out = new Uint8Array(buffer);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  if (window.matchMedia?.("(display-mode: standalone)").matches) return true;
  const navAny = window.navigator as Navigator & { standalone?: boolean };
  return navAny.standalone === true;
}

function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

function isIOS(): boolean {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  return /iPad|iPhone|iPod/i.test(ua) && !("MSStream" in window);
}

function wasRecentlyDismissed(): boolean {
  try {
    const raw = localStorage.getItem(DISMISSED_AT_KEY);
    if (!raw) return false;
    const ts = Number(raw);
    if (!Number.isFinite(ts)) return false;
    return Date.now() - ts < DISMISS_COOLDOWN_MS;
  } catch {
    return false;
  }
}

async function ensureServiceWorker(): Promise<ServiceWorkerRegistration> {
  const existing = await navigator.serviceWorker.getRegistration("/");
  if (existing) {
    await navigator.serviceWorker.ready;
    return existing;
  }
  const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  await navigator.serviceWorker.ready;
  return reg;
}

async function subscribeAndPersist(vapidPublicKey: string): Promise<"granted" | "denied" | "default" | "error"> {
  // iOS requires this to run inside a user-gesture handler. Do not call from useEffect.
  const reg = await ensureServiceWorker();

  let permission = Notification.permission;
  if (permission === "default") {
    permission = await Notification.requestPermission();
  }
  if (permission !== "granted") return permission;

  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });
  }

  const json = sub.toJSON();
  const res = await fetch("/api/push/subscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      endpoint: json.endpoint,
      keys: json.keys,
      userAgent: navigator.userAgent,
    }),
  });

  if (!res.ok) return "error";

  try {
    localStorage.setItem(SUBSCRIBED_KEY, "1");
  } catch {
    // ignore storage errors
  }
  return "granted";
}

export default function PushManager() {
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [vapidKey, setVapidKey] = useState<string | null>(null);

  useEffect(() => {
    if (!isPushSupported()) return;
    if (!isStandalone()) return;

    const vapid = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapid) {
      console.warn("[PushManager] NEXT_PUBLIC_VAPID_PUBLIC_KEY not set.");
      return;
    }
    setVapidKey(vapid);

    if (Notification.permission === "denied") return;
    if (Notification.permission === "granted") {
      // Already granted on this device — silently re-sync the subscription on
      // each launch (endpoints can rotate) without showing the banner.
      void subscribeAndPersist(vapid).catch((err) => {
        console.error("[PushManager] silent re-sync failed:", err);
      });
      return;
    }
    if (wasRecentlyDismissed()) return;

    // Permission is "default" — show the tap-to-enable banner.
    setShow(true);
  }, []);

  const handleEnable = async () => {
    if (!vapidKey || busy) return;
    setBusy(true);
    setErrorMsg(null);
    try {
      const outcome = await subscribeAndPersist(vapidKey);
      if (outcome === "granted") {
        setShow(false);
      } else if (outcome === "denied") {
        setErrorMsg(
          "Notifications were blocked. Open iOS Settings → Notifications → Bourbon Oak Lover to re-enable.",
        );
      } else if (outcome === "error") {
        setErrorMsg("Couldn't save your subscription. Please try again.");
      } else {
        setErrorMsg("Permission request was dismissed.");
      }
    } catch (err) {
      console.error("[PushManager] enable failed:", err);
      setErrorMsg((err as Error)?.message ?? "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  const handleDismiss = () => {
    try {
      localStorage.setItem(DISMISSED_AT_KEY, String(Date.now()));
    } catch {
      // ignore storage errors
    }
    setShow(false);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="push-banner"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 320, damping: 30 }}
          className="fixed bottom-4 inset-x-4 sm:inset-x-auto sm:right-4 sm:bottom-4 sm:max-w-sm z-[60]"
          role="dialog"
          aria-label="Enable notifications"
        >
          <div className="bg-bourbon-deep text-bourbon-cream shadow-2xl border border-bourbon-gold/30">
            <div className="px-5 pt-5 pb-4">
              <div className="flex items-start gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-bourbon-gold/15 shrink-0">
                  <svg
                    className="w-5 h-5 text-bourbon-gold"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.8}
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-bourbon-gold text-[10px] tracking-[0.3em] uppercase mb-1">
                    Drop alerts
                  </p>
                  <h3 className="font-[family-name:var(--font-playfair)] text-lg font-bold leading-tight">
                    Get notified when a new bottle lands
                  </h3>
                  <p className="text-bourbon-cream/70 text-xs mt-1 leading-relaxed">
                    {isIOS()
                      ? "Tap Enable, then approve in the iOS prompt that appears."
                      : "Tap Enable, then approve in the browser prompt that appears."}
                  </p>
                </div>
              </div>

              {errorMsg && (
                <div className="mt-3 px-3 py-2 bg-red-500/15 border border-red-400/40 text-red-200 text-xs">
                  {errorMsg}
                </div>
              )}
            </div>

            <div className="flex border-t border-bourbon-cream/10">
              <button
                type="button"
                onClick={handleDismiss}
                disabled={busy}
                className="flex-1 px-4 py-3 text-bourbon-cream/70 hover:text-bourbon-cream text-xs tracking-widest uppercase font-semibold disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer transition-colors"
              >
                Not now
              </button>
              <button
                type="button"
                onClick={handleEnable}
                disabled={busy}
                className="flex-1 px-4 py-3 bg-bourbon-gold text-bourbon-deep text-xs tracking-widest uppercase font-bold hover:bg-bourbon-amber disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer transition-colors"
              >
                {busy ? "Enabling…" : "Enable"}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
