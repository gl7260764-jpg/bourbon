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

// A raw UUID is unreadable and unmemorable, which makes it useless for
// actually recognising someone across sessions in the admin. These lists turn
// the id into a stable codename — same visitor, same name, forever — without
// storing anything extra or making the id guessable in reverse.
const CODE_ADJECTIVES = [
  "Amber", "Charred", "Copper", "Oaken", "Smoked", "Rye", "Bonded", "Cask",
  "Barrel", "Golden", "Sour", "Sweet", "Toasted", "Aged", "Wheated", "Straight",
];
const CODE_NOUNS = [
  "Falcon", "Stag", "Fox", "Heron", "Otter", "Badger", "Crane", "Marten",
  "Raven", "Bison", "Elk", "Hawk", "Lynx", "Mule", "Owl", "Wolf",
];

// FNV-1a — small, dependency-free, and stable across processes (unlike
// anything seeded at runtime).
function hash32(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

// e.g. "Amber Falcon 4F2A" — readable, stable, and still unique enough to
// tell two visitors apart at a glance.
export function visitorLabel(id: string): string {
  const h = hash32(id);
  const adjective = CODE_ADJECTIVES[h % CODE_ADJECTIVES.length];
  const noun = CODE_NOUNS[(h >>> 8) % CODE_NOUNS.length];
  const suffix = id.replace(/-/g, "").slice(0, 4).toUpperCase();
  return `${adjective} ${noun} ${suffix}`;
}

// Coarse device/browser read from the UA. Deliberately rough — it exists to
// give the admin context next to a journey, not to fingerprint anyone.
export function deviceLabel(userAgent: string | null | undefined): string {
  if (!userAgent) return "Unknown device";
  const ua = userAgent.toLowerCase();
  const platform = /ipad|tablet/.test(ua)
    ? "Tablet"
    : /mobi|iphone|android/.test(ua)
      ? "Mobile"
      : "Desktop";
  const browser = /edg\//.test(ua)
    ? "Edge"
    : /opr\/|opera/.test(ua)
      ? "Opera"
      : /chrome|crios/.test(ua)
        ? "Chrome"
        : /firefox|fxios/.test(ua)
          ? "Firefox"
          : /safari/.test(ua)
            ? "Safari"
            : "Browser";
  return `${platform} · ${browser}`;
}

// Normalize "now" to UTC midnight so each visitor gets one VisitDay row per
// day no matter how often they ping us.
export function todayUtcMidnight(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}
