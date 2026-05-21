"use client";

import { useEffect } from "react";

const SUBSCRIBED_KEY = "bol_push_subscribed";
const PROMPTED_KEY = "bol_push_prompted_at";

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

async function registerSwAndSubscribe(vapidPublicKey: string) {
  const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
  await navigator.serviceWorker.ready;

  let permission = Notification.permission;
  if (permission === "default") {
    permission = await Notification.requestPermission();
    try {
      localStorage.setItem(PROMPTED_KEY, String(Date.now()));
    } catch {
      // ignore storage errors
    }
  }
  if (permission !== "granted") return;

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

  if (res.ok) {
    try {
      localStorage.setItem(SUBSCRIBED_KEY, "1");
    } catch {
      // ignore storage errors
    }
  }
}

export default function PushManager() {
  useEffect(() => {
    if (!isPushSupported()) return;
    if (!isStandalone()) return;

    const vapid = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapid) {
      console.warn("[PushManager] NEXT_PUBLIC_VAPID_PUBLIC_KEY not set.");
      return;
    }

    if (Notification.permission === "denied") return;

    let alreadyPrompted = false;
    try {
      alreadyPrompted = !!localStorage.getItem(PROMPTED_KEY);
    } catch {
      // ignore storage errors
    }

    // If permission is already granted, always re-sync the subscription on
    // launch (endpoints can rotate). Otherwise only prompt once per device.
    if (Notification.permission !== "granted" && alreadyPrompted) return;

    registerSwAndSubscribe(vapid).catch((err) => {
      console.error("[PushManager] subscribe failed:", err);
    });
  }, []);

  return null;
}
