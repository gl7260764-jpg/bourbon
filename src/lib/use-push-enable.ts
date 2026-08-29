"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Shared Web Push opt-in.
 *
 * Extracted so the dashboard dialog and the confirmation-page prompt run the
 * same code. The subtleties below are easy to get wrong twice:
 *
 * - The whole flow must stay inside the click handler. iOS only grants
 *   permission from a user gesture, and awaiting something unrelated first
 *   breaks that chain — which is also why this can never be auto-triggered.
 * - POST /api/push/subscribe attaches the device to the signed-in customer.
 *   Subscribing while signed out stores customerId: null, and sendToCustomer
 *   targets by customerId, so those devices can never be reached. That is why
 *   offering this on the dashboard matters: there, the visitor is signed in.
 */

export type PushState =
  | "idle"
  | "working"
  | "granted"
  | "denied"
  | "unsupported"
  | "error";

/**
 * `applicationServerKey` wants a BufferSource backed by a real ArrayBuffer;
 * a bare Uint8Array widens to ArrayBufferLike and fails the type.
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const buffer = new ArrayBuffer(raw.length);
  const out = new Uint8Array(buffer);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export function pushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "Notification" in window &&
    "serviceWorker" in navigator &&
    "PushManager" in window
  );
}

export function usePushEnable() {
  const [state, setState] = useState<PushState>("idle");

  useEffect(() => {
    // Deferred: a synchronous setState in an effect body triggers a cascading
    // render warning, and this only needs to settle before first paint.
    const t = window.setTimeout(() => {
      if (!pushSupported()) {
        setState("unsupported");
      } else if (Notification.permission === "granted") {
        setState("granted");
      } else if (Notification.permission === "denied") {
        setState("denied");
      }
    }, 0);
    return () => window.clearTimeout(t);
  }, []);

  const enable = useCallback(async () => {
    const vapid = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapid) {
      setState("error");
      return false;
    }
    setState("working");
    try {
      const reg =
        (await navigator.serviceWorker.getRegistration()) ??
        (await navigator.serviceWorker.register("/sw.js", { scope: "/" }));
      await navigator.serviceWorker.ready;

      let permission = Notification.permission;
      if (permission === "default") {
        permission = await Notification.requestPermission();
      }
      if (permission !== "granted") {
        setState(permission === "denied" ? "denied" : "idle");
        return false;
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
      return res.ok;
    } catch {
      setState("error");
      return false;
    }
  }, []);

  return { state, enable };
}
