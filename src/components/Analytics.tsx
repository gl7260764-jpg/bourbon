"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

// Ceilings, mirrored from MAX_PAGE_VIEW_MS / MAX_SESSION_MS in
// src/lib/visitor.ts. They are duplicated rather than imported so this client
// bundle doesn't drag in the server-side visitor module; the server re-clamps
// everything it receives, so the worst a drift here can do is make the client
// more conservative than the server, never less.
//
// Why cap at all: visibility tracking excludes a *backgrounded* tab, but not a
// tab left visible on a second monitor overnight. Uncapped, one of those
// contributes hours and single-handedly ruins every average.
const MAX_PAGE_VIEW_MS = 30 * 60 * 1000; // 30 minutes on one page
const MAX_SESSION_MS = 4 * 60 * 60 * 1000; // 4 hours across a whole visit

// Periodic top-up. Browsers — iOS Safari especially — can discard a tab
// without ever firing pagehide, so relying purely on unload loses the tail of
// long visits. Sends are monotonic totals and no-op when nothing new was
// banked, so a hidden or idle tab costs nothing.
const HEARTBEAT_MS = 60 * 1000;

// sessionStorage, not localStorage: a visit should die with the tab and must
// never be shared between two tabs browsing at once.
const SESSION_KEY_STORAGE = "bol_sk";
const SESSION_MS_STORAGE = "bol_sms";

function randomToken(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 14)}`;
}

// Reads (or mints) the visit token plus the milliseconds already banked
// against it. Restoring the running total is what lets a hard reload
// mid-visit continue the clock instead of restarting it — the server keeps
// GREATEST(old, new), so a total that reset to zero would silently freeze.
function loadSession(): { key: string; accumulatedMs: number } {
  try {
    const existing = window.sessionStorage.getItem(SESSION_KEY_STORAGE);
    if (existing) {
      const raw = Number(window.sessionStorage.getItem(SESSION_MS_STORAGE));
      const accumulatedMs =
        Number.isFinite(raw) && raw > 0 ? Math.min(raw, MAX_SESSION_MS) : 0;
      return { key: existing, accumulatedMs };
    }
    const key = randomToken();
    window.sessionStorage.setItem(SESSION_KEY_STORAGE, key);
    window.sessionStorage.setItem(SESSION_MS_STORAGE, "0");
    return { key, accumulatedMs: 0 };
  } catch {
    // Storage can throw (Safari private mode, blocked cookies). Fall back to
    // an in-memory token: the visit still gets measured, it just won't
    // survive a reload.
    return { key: randomToken(), accumulatedMs: 0 };
  }
}

function persistSessionMs(ms: number): void {
  try {
    window.sessionStorage.setItem(SESSION_MS_STORAGE, String(ms));
  } catch {
    // Non-fatal — see loadSession.
  }
}

// Fires once per real navigation so the admin's visitor / per-day-uniques
// metrics stay accurate, and measures how long the visitor actually spent
// looking at each page. The endpoints dedupe via the visitor cookie, a
// composite (visitorId, date) unique constraint, and a per-view id, so
// spamming them is safe.
export default function Analytics() {
  const pathname = usePathname();

  // The visit outlives individual pages, so its token and running total live
  // in refs rather than being re-derived on every navigation.
  const sessionKeyRef = useRef<string | null>(null);
  const sessionMsRef = useRef(0);

  useEffect(() => {
    // Don't track admin's own browsing — keeps the analytics honest.
    if (pathname?.startsWith("/admin")) return;

    if (!sessionKeyRef.current) {
      const restored = loadSession();
      sessionKeyRef.current = restored.key;
      sessionMsRef.current = restored.accumulatedMs;
    }
    const sessionKey = sessionKeyRef.current;

    // One id per page *view*, not per path: the dwell beacon lands after the
    // row already exists, and (visitorId, path) can't tell two visits to the
    // same page apart.
    const viewId = randomToken();
    const path = pathname ?? "/";

    // Register the page view. No AbortController here on purpose — cancelling
    // this on a fast SPA navigation would drop the very row the duration
    // beacon needs to attach to. `keepalive` is what makes it survive.
    fetch("/api/track-visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path, viewId, sessionKey }),
      keepalive: true,
    }).catch(() => {
      // ignore network errors — we don't want to break the UI for analytics
    });

    // --- dwell accounting ---------------------------------------------------
    // `pageMs` only ever grows while the document is actually visible, so a
    // backgrounded tab accrues nothing. `lastResumeAt === null` means "the
    // clock is stopped".
    let pageMs = 0;
    let lastResumeAt =
      document.visibilityState === "visible" ? Date.now() : null;
    let sentPageMs = 0;
    let sentSessionMs = sessionMsRef.current;

    const bank = () => {
      if (lastResumeAt === null) return;
      const now = Date.now();
      const delta = Math.max(0, now - lastResumeAt);
      lastResumeAt = now;
      // The visit total only grows by what this page was allowed to bank, so
      // the per-page ceiling bounds the session total too.
      const usable = Math.min(delta, MAX_PAGE_VIEW_MS - pageMs);
      if (usable <= 0) return;
      pageMs += usable;
      sessionMsRef.current = Math.min(
        sessionMsRef.current + usable,
        MAX_SESSION_MS,
      );
      persistSessionMs(sessionMsRef.current);
    };

    const flush = () => {
      bank();
      // Totals are monotonic, so "nothing new" is always a safe no-op and a
      // duplicated beacon can never double-count server-side.
      if (pageMs <= sentPageMs && sessionMsRef.current <= sentSessionMs) return;
      sentPageMs = pageMs;
      sentSessionMs = sessionMsRef.current;

      const body = JSON.stringify({
        viewId,
        sessionKey,
        activeMs: pageMs,
        sessionMs: sessionMsRef.current,
      });

      // sendBeacon is the only transport the browser guarantees to deliver
      // across an unload — a fetch() kicked off in pagehide is routinely
      // cancelled mid-flight. fetch+keepalive is the fallback for the rare
      // browser without it, or when the beacon queue is full.
      if (typeof navigator.sendBeacon === "function") {
        const queued = navigator.sendBeacon(
          "/api/track-duration",
          new Blob([body], { type: "application/json" }),
        );
        if (queued) return;
      }
      fetch("/api/track-duration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
      }).catch(() => {
        // analytics must never surface an error to the visitor
      });
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        bank();
        lastResumeAt = null; // stop the clock: hidden time is not engagement
        // Backgrounding is often the last event a mobile tab ever gets, so
        // treat it as a real flush point rather than waiting for pagehide.
        flush();
      } else {
        lastResumeAt = Date.now();
      }
    };

    const onPageHide = () => {
      bank();
      lastResumeAt = null;
      flush();
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pagehide", onPageHide);
    const heartbeat = window.setInterval(flush, HEARTBEAT_MS);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pagehide", onPageHide);
      window.clearInterval(heartbeat);
      // SPA route change: this cleanup runs as the visitor leaves page A for
      // page B, so A's dwell has to land here — there is no unload event to
      // catch it.
      bank();
      lastResumeAt = null;
      flush();
    };
  }, [pathname]);

  return null;
}
