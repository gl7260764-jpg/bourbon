"use client";

import { useEffect, useState } from "react";
import { OPEN_INSTALL_EVENT } from "@/lib/pwa";

/* Offered on the confirmation page, where the buyer has just been told their
   payment details are coming and has a concrete reason to want an alert. Both
   actions are optional: if they decline, the details still appear on the
   dashboard and an email still goes out. Nothing in the flow depends on this. */

/* Backed by an explicit ArrayBuffer: `applicationServerKey` requires a
   BufferSource over ArrayBuffer, and a bare Uint8Array widens to
   ArrayBufferLike. Same shape PushManager already uses. */
function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const buffer = new ArrayBuffer(raw.length);
  const out = new Uint8Array(buffer);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

type State = "idle" | "working" | "granted" | "denied" | "unsupported" | "error";

export default function OrderAlertsPrompt() {
  const [state, setState] = useState<State>("idle");

  useEffect(() => {
    // Deferred so this isn't a synchronous setState in the effect body.
    const t = window.setTimeout(() => {
      if (typeof window === "undefined") return;
      if (!("Notification" in window) || !("serviceWorker" in navigator)) {
        setState("unsupported");
      } else if (Notification.permission === "granted") {
        setState("granted");
      } else if (Notification.permission === "denied") {
        setState("denied");
      }
    }, 0);
    return () => window.clearTimeout(t);
  }, []);

  async function enable() {
    const vapid = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapid) {
      setState("error");
      return;
    }
    setState("working");
    try {
      /* Must stay inside the click handler: iOS only grants permission from a
         user gesture, and awaiting anything first can break that chain. */
      const reg =
        (await navigator.serviceWorker.getRegistration()) ??
        (await navigator.serviceWorker.register("/sw.js", { scope: "/" }));
      await navigator.serviceWorker.ready;

      let permission = Notification.permission;
      if (permission === "default") permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState(permission === "denied" ? "denied" : "idle");
        return;
      }

      const sub =
        (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapid),
        }));

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
      setState(res.ok ? "granted" : "error");
    } catch {
      setState("error");
    }
  }

  if (state === "unsupported") return null;

  return (
    <div className="mt-4 pt-4 border-t border-bourbon-gold/25">
      {state === "granted" ? (
        <p className="text-bourbon-deep text-[13px] flex items-center gap-2">
          <span className="text-bourbon-gold" aria-hidden="true">✓</span>
          Notifications on — we&apos;ll ping you when the details land.
        </p>
      ) : (
        <>
          {/* One line, two buttons. The longer explanation this used to carry
              repeated what the block above already says. */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={enable}
              disabled={state === "working" || state === "denied"}
              className="px-4 py-2.5 bg-bourbon-deep text-bourbon-cream text-xs font-semibold tracking-wider uppercase hover:bg-bourbon-dark transition-colors cursor-pointer disabled:opacity-60"
            >
              {state === "working" ? "Enabling…" : "Notify me"}
            </button>
            <button
              type="button"
              onClick={() => window.dispatchEvent(new Event(OPEN_INSTALL_EVENT))}
              className="px-4 py-2.5 border border-bourbon-deep/20 text-bourbon-deep text-xs font-semibold tracking-wider uppercase hover:border-bourbon-gold hover:text-bourbon-gold transition-colors cursor-pointer"
            >
              Install app
            </button>
          </div>
          {state === "denied" && (
            <p className="text-bourbon-stone text-[11px] mt-2">
              Notifications are blocked in your browser settings.
            </p>
          )}
          {state === "error" && (
            <p className="text-red-600 text-[11px] mt-2">
              Couldn&apos;t turn notifications on.
            </p>
          )}
        </>
      )}
    </div>
  );
}
