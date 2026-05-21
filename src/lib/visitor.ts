import type { NextRequest } from "next/server";
import type { NextResponse } from "next/server";

export const VISITOR_COOKIE = "bol_vid";
const VISITOR_COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

function generateVisitorId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  // Fallback — only used if Web Crypto is unavailable.
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 14)}`;
}

export function getOrSetVisitorId(req: NextRequest, res: NextResponse): { id: string; isNew: boolean } {
  const existing = req.cookies.get(VISITOR_COOKIE)?.value;
  if (existing) {
    return { id: existing, isNew: false };
  }
  const id = generateVisitorId();
  res.cookies.set(VISITOR_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: VISITOR_COOKIE_MAX_AGE,
  });
  return { id, isNew: true };
}

// Normalize "now" to UTC midnight so each visitor gets one VisitDay row per
// day no matter how often they ping us.
export function todayUtcMidnight(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}
