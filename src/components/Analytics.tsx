"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Fires once per real navigation so the admin's visitor / per-day-uniques
// metrics stay accurate. The endpoint dedupes via the visitor cookie + a
// composite (visitorId, date) unique constraint, so spamming it is safe.
export default function Analytics() {
  const pathname = usePathname();

  useEffect(() => {
    // Don't track admin's own browsing — keeps the analytics honest.
    if (pathname?.startsWith("/admin")) return;

    const controller = new AbortController();
    fetch("/api/track-visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: pathname ?? "/" }),
      signal: controller.signal,
      // keepalive lets the request finish even if the user navigates away.
      keepalive: true,
    }).catch(() => {
      // ignore network errors — we don't want to break the UI for analytics
    });

    return () => controller.abort();
  }, [pathname]);

  return null;
}
