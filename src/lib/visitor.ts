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

// ---------------------------------------------------------------------------
// Engagement-time helpers
// ---------------------------------------------------------------------------

// Ceiling for a single page view. Real reading attention on one page tops out
// well below this; anything longer is a parked tab that stayed *visible* (a
// second monitor, a phone face-up on a desk), which the visibility tracking
// alone cannot catch. Without a cap one such tab contributes hours and single-
// handedly wrecks the average, so we bank 30 minutes and drop the rest.
export const MAX_PAGE_VIEW_MS = 30 * 60 * 1000;

// Ceiling for a whole visit. Deliberately larger than the per-page cap (a
// genuine long browse spans many pages) but still bounded, for the same
// parked-tab reason. Four hours is far beyond any honest shopping session.
export const MAX_SESSION_MS = 4 * 60 * 60 * 1000;

// Durations arrive from the client, so they are attacker-controlled: coerce to
// a finite integer and clamp into [0, max]. Anything that isn't a usable
// number becomes null so callers can skip the write entirely rather than
// storing a zero that would pollute the averages.
export function clampDurationMs(value: unknown, max: number): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  const ms = Math.round(value);
  if (ms <= 0) return null;
  return Math.min(ms, max);
}

// viewId / sessionKey are client-minted opaque tokens that end up in SQL
// predicates and in the admin UI. Accept only UUID-shaped ids so nothing
// exotic gets through.
const CLIENT_TOKEN_RE = /^[A-Za-z0-9_-]{8,64}$/;

export function isValidClientToken(value: unknown): value is string {
  return typeof value === "string" && CLIENT_TOKEN_RE.test(value);
}

/*
 * Bots are loud, they don't matter for "unique humans", and they would
 * otherwise inflate every metric on the analytics page — including engagement
 * time, where a crawler that never fires a beacon looks like a zero-second
 * visit. Shared by every tracking endpoint so they can't drift apart.
 *
 * Two things this list deliberately does NOT match, because they are real
 * people and dropping them would quietly understate real traffic:
 *
 *   - In-app browsers. "WhatsApp", "Instagram", "FBAV", "Pinterest" and the
 *     like appear in the user agent when someone taps a link inside that app.
 *     That is a customer, not a crawler. Only the specific fetcher tokens —
 *     facebookexternalhit, and anything self-identifying as a bot — are here.
 *   - Old or obscure browsers. Anything not positively identified as
 *     automation is counted; a false negative costs one inflated row, a false
 *     positive silently deletes a customer from the numbers.
 */
const BOT_UA_PATTERNS = [
  // Self-identifying crawlers. Covers the overwhelming majority by name:
  // Googlebot, Bingbot, DuckDuckBot, Applebot, GPTBot, ClaudeBot, AhrefsBot,
  // SemrushBot, Bytespider, PetalBot, YandexBot, Baiduspider…
  "bot", "crawl", "spider", "slurp", "scrape", "scraper",

  // Headless browsers and automation drivers. These execute JavaScript, so
  // unlike a plain crawler they DO reach a client-side beacon — which makes
  // them the group that actually pollutes this dataset.
  "headless", "phantomjs", "puppeteer", "playwright", "selenium",
  "webdriver", "cypress", "prerender", "chrome-lighthouse",

  // Performance, uptime and monitoring probes.
  "lighthouse", "pagespeed", "gtmetrix", "pingdom", "uptime", "statuscake",
  "site24x7", "newrelic", "datadog", "checkly", "monitoring", "zabbix",

  // Plain HTTP clients: a script hitting the endpoint directly, never a
  // browser and never a person.
  "curl/", "wget", "python-requests", "python-urllib", "aiohttp", "httpx",
  "node-fetch", "axios", "okhttp", "go-http-client", "java/", "jakarta",
  "libwww-perl", "httpclient", "postmanruntime", "insomnia", "restsharp",
  "guzzle", "urllib", "http_request",

  // Fetchers that do not carry "bot" in the name.
  "facebookexternalhit", "meta-externalagent", "google-inspectiontool",
  "googleother", "google-read-aloud", "chatgpt-user", "oai-search",
  "anthropic-ai", "perplexity", "skypeuripreview", "embedly", "preview",

  // Archivers and feed readers.
  "ia_archiver", "archive.org", "feedfetcher", "feedly", "feedburner",
];

const BOT_UA_RE = new RegExp(
  BOT_UA_PATTERNS.map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|"),
  "i",
);

export function isLikelyBot(userAgent: string): boolean {
  // A request with no user agent at all is never a browser.
  if (!userAgent) return true;
  return BOT_UA_RE.test(userAgent);
}

// Renders a duration for the admin UI: "48s", "4m 12s", "1h 06m". Returns null
// for anything unmeasured so callers render a real empty state ("—") instead
// of a "0m 0s" that reads as "nobody stayed" when it actually means "we have
// no data yet".
export function formatDuration(ms: number | null | undefined): string | null {
  if (typeof ms !== "number" || !Number.isFinite(ms) || ms <= 0) return null;
  const totalSeconds = Math.round(ms / 1000);
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes < 60) return `${minutes}m ${seconds}s`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${String(minutes % 60).padStart(2, "0")}m`;
}
