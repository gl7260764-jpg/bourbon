import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { geoFromRequest } from "@/lib/geo";
import {
  getOrSetVisitorId,
  isLikelyBot,
  isValidClientToken,
  todayUtcMidnight,
} from "@/lib/visitor";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  // Skip bots — they're loud, they don't matter for "unique humans", and they
  // would otherwise inflate every metric on the analytics page.
  const ua = req.headers.get("user-agent") ?? "";
  if (isLikelyBot(ua)) {
    return NextResponse.json({ ok: true, ignored: "bot" });
  }

  const res = NextResponse.json({ ok: true });
  const { id: visitorId, isNew } = getOrSetVisitorId(req, res);
  const { path, viewId, sessionKey } = await readBody(req);

  try {
    if (isNew) {
      // First visit ever from this device — resolve geo, then create.
      const geo = await geoFromRequest(req.headers);
      await prisma.visitor.create({
        data: {
          id: visitorId,
          country: geo.country,
          countryCode: geo.countryCode,
          region: geo.region,
          city: geo.city,
          userAgent: ua.slice(0, 500) || null,
        },
      });
    } else {
      // Returning visitor — just bump lastSeenAt. If they don't exist yet
      // (cookie predates the table), backfill with geo lookup.
      const existing = await prisma.visitor.findUnique({
        where: { id: visitorId },
        select: { id: true },
      });
      if (existing) {
        await prisma.visitor.update({
          where: { id: visitorId },
          data: {},
        });
      } else {
        const geo = await geoFromRequest(req.headers);
        await prisma.visitor.create({
          data: {
            id: visitorId,
            country: geo.country,
            countryCode: geo.countryCode,
            region: geo.region,
            city: geo.city,
            userAgent: ua.slice(0, 500) || null,
          },
        });
      }
    }

    // Record today's session — composite unique on (visitorId, date) means
    // we get at most one row per visitor per day automatically.
    const today = todayUtcMidnight();
    await prisma.visitDay.upsert({
      where: { visitorId_date: { visitorId, date: today } },
      update: {},
      create: { visitorId, date: today },
    });

    // The visit row is created here rather than by the duration beacon so a
    // bounce that never flushes still shows up as a session, and so the
    // beacon endpoint only ever has to UPDATE (it can't be used to create
    // unbounded rows).
    const sessionId = sessionKey
      ? await ensureSession(visitorId, sessionKey)
      : null;

    // One row per navigation — this is what reconstructs the visitor's path
    // through the site, so it is intentionally not deduped. `viewId` is what
    // the dwell-time beacon uses later to find this exact row again.
    if (path) {
      await prisma.pageView.create({
        data: { visitorId, path, viewId, sessionId },
      });
    }
  } catch (err) {
    console.error("[track-visit] failed:", err);
    // Still return ok so the client doesn't retry-spam us.
  }

  return res;
}

// Creates the visit on its first page, or refreshes it on every later page.
// Returns null (rather than throwing) on any problem: analytics must never
// cost us the page view, let alone the visitor's request.
async function ensureSession(
  visitorId: string,
  sessionKey: string,
): Promise<string | null> {
  try {
    const existing = await prisma.visitSession.findUnique({
      where: { sessionKey },
      select: { id: true, visitorId: true },
    });
    if (existing) {
      // A key belongs to exactly one visitor. If the cookie changed mid-visit
      // (cleared storage, shared device) don't graft one visitor's pages onto
      // another's session.
      if (existing.visitorId !== visitorId) return null;
      await prisma.visitSession.update({
        where: { id: existing.id },
        data: { lastActiveAt: new Date() },
      });
      return existing.id;
    }
    const created = await prisma.visitSession.create({
      data: { visitorId, sessionKey },
      select: { id: true },
    });
    return created.id;
  } catch {
    // Two tabs racing the same key, or a transient DB blip.
    return null;
  }
}

// The client posts { path, viewId, sessionKey }. Treat all of it as untrusted:
// it is attacker-controlled and lands in the admin UI, so only accept a
// same-site pathname, drop any query/hash, cap the length, and require the
// opaque ids to look like the tokens we mint.
async function readBody(req: NextRequest): Promise<{
  path: string | null;
  viewId: string | null;
  sessionKey: string | null;
}> {
  const empty = { path: null, viewId: null, sessionKey: null };
  try {
    const body = (await req.json()) as {
      path?: unknown;
      viewId?: unknown;
      sessionKey?: unknown;
    };

    return {
      path: normalizePath(body.path),
      viewId: isValidClientToken(body.viewId) ? body.viewId : null,
      sessionKey: isValidClientToken(body.sessionKey) ? body.sessionKey : null,
    };
  } catch {
    return empty;
  }
}

function normalizePath(value: unknown): string | null {
  if (typeof value !== "string") return null;

  // Reject protocol-relative ("//evil.com") and absolute URLs outright.
  const raw = value.trim();
  if (!raw.startsWith("/") || raw.startsWith("//")) return null;

  const path = raw.split(/[?#]/)[0];
  if (path.length > 512) return null;

  // Admin browsing is filtered client-side too; enforce it here so a stray
  // caller can't pollute the numbers.
  if (path.startsWith("/admin")) return null;

  return path;
}
