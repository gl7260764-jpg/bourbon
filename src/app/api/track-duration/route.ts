import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  VISITOR_COOKIE,
  MAX_PAGE_VIEW_MS,
  MAX_SESSION_MS,
  clampDurationMs,
  isLikelyBot,
  isValidClientToken,
} from "@/lib/visitor";

export const dynamic = "force-dynamic";

// Receives the dwell-time beacons sent by <Analytics />. Every call carries a
// *running total* (not a delta) for one page view and for the whole visit, so
// heartbeats, the visibilitychange flush and the final pagehide beacon are all
// idempotent and safe to arrive out of order or twice.
export async function POST(req: NextRequest) {
  // Same bot filter as /api/track-visit — a crawler must not be able to move
  // the engagement averages either.
  const ua = req.headers.get("user-agent") ?? "";
  if (isLikelyBot(ua)) {
    return NextResponse.json({ ok: true, ignored: "bot" });
  }

  // This endpoint only ever UPDATEs rows a page view already created, so
  // unlike /api/track-visit it never mints a visitor cookie: a beacon without
  // one has nothing to attach to. Every write is additionally scoped to this
  // visitor, so a stolen viewId from another device is a no-op.
  const visitorId = req.cookies.get(VISITOR_COOKIE)?.value;
  if (!isValidClientToken(visitorId)) {
    return NextResponse.json({ ok: true, ignored: "no-visitor" });
  }

  const body = await readBody(req);
  if (!body) {
    return NextResponse.json({ ok: true, ignored: "bad-body" });
  }

  // Never trust a client-reported duration: coerce, floor at zero, and clamp
  // to the same ceilings the client uses. A null here means "unusable", and
  // we skip the write rather than storing a zero that would drag averages
  // down (NULL durationMs deliberately reads as "unknown", not "0 seconds").
  const activeMs = clampDurationMs(body.activeMs, MAX_PAGE_VIEW_MS);
  const sessionMs = clampDurationMs(body.sessionMs, MAX_SESSION_MS);

  try {
    if (body.viewId && activeMs !== null) {
      // GREATEST makes the write monotonic, so a late beacon carrying a
      // smaller total can never walk the number backwards.
      await prisma.$executeRaw`
        UPDATE "PageView"
        SET "durationMs" = GREATEST(COALESCE("durationMs", 0), ${activeMs}::int)
        WHERE "viewId" = ${body.viewId}
          AND "visitorId" = ${visitorId}
      `;
    }

    if (body.sessionKey && sessionMs !== null) {
      await prisma.$executeRaw`
        UPDATE "VisitSession"
        SET "activeMs" = GREATEST("activeMs", ${sessionMs}::int),
            "lastActiveAt" = NOW()
        WHERE "sessionKey" = ${body.sessionKey}
          AND "visitorId" = ${visitorId}
      `;
    }
  } catch (err) {
    console.error("[track-duration] failed:", err);
    // Swallow it. Analytics must never throw into the visitor's request path.
  }

  return NextResponse.json({ ok: true });
}

async function readBody(req: NextRequest): Promise<{
  viewId: string | null;
  sessionKey: string | null;
  activeMs: unknown;
  sessionMs: unknown;
} | null> {
  try {
    // sendBeacon posts a Blob; Request.json() parses it regardless of the
    // content-type the browser attached.
    const raw = (await req.json()) as {
      viewId?: unknown;
      sessionKey?: unknown;
      activeMs?: unknown;
      sessionMs?: unknown;
    } | null;
    if (!raw || typeof raw !== "object") return null;

    return {
      viewId: isValidClientToken(raw.viewId) ? raw.viewId : null,
      sessionKey: isValidClientToken(raw.sessionKey) ? raw.sessionKey : null,
      activeMs: raw.activeMs,
      sessionMs: raw.sessionMs,
    };
  } catch {
    return null;
  }
}
