import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { geoFromRequest } from "@/lib/geo";
import { getOrSetVisitorId, todayUtcMidnight } from "@/lib/visitor";

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
  } catch (err) {
    console.error("[track-visit] failed:", err);
    // Still return ok so the client doesn't retry-spam us.
  }

  return res;
}

function isLikelyBot(ua: string): boolean {
  if (!ua) return true;
  const lower = ua.toLowerCase();
  return /bot|crawler|spider|crawling|preview|lighthouse|pingdom|uptimerobot|headlesschrome|prerender/i.test(
    lower,
  );
}
