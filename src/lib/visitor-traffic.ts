/**
 * Telling automated traffic apart from real people, after the fact.
 *
 * `isLikelyBot()` in ./visitor.ts runs at write time and rejects anything that
 * *names* itself — Googlebot, curl, Playwright's default agent. That check is
 * necessary and it is nearly useless on its own: measured against this
 * database it flagged 1 visitor out of 2994, because a scraper worth worrying
 * about sends a real Chrome user-agent string and the client-side
 * `navigator.webdriver` guard only catches the drivers that admit to it.
 *
 * So the automation that reaches the table looks, field by field, exactly like
 * a person. What gives it away is the shape of the traffic rather than any one
 * row: fifty-five distinct visitor cookies carrying one byte-identical desktop
 * user agent, one page view each, and not a single millisecond of measured
 * dwell time between all of them. Real traffic does not do that — 62% of
 * visitors here report dwell time, with a median of 46 seconds.
 *
 * Every rule below is therefore evidence-based and conservative, because the
 * two mistakes are not symmetric: counting a bot overstates a number, while
 * discarding a customer deletes a real person from the business's own view of
 * itself. Anything merely unproven stays counted as human, and a visitor who
 * ever handed over an email address is a person no matter what else is true.
 */
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isLikelyBot } from "@/lib/visitor";

// --- the filter itself -------------------------------------------------------

export const TRAFFIC_MODES = ["humans", "bots", "all"] as const;
export type TrafficMode = (typeof TRAFFIC_MODES)[number];

/* Real users is the default. The whole point of the filter is that the
   unfiltered numbers were never the ones worth looking at; "all" is kept so
   the classification can be audited rather than trusted. */
export const DEFAULT_TRAFFIC_MODE: TrafficMode = "humans";

export const TRAFFIC_MODE_LABELS: Record<TrafficMode, string> = {
  humans: "Real users",
  bots: "Bots",
  all: "All traffic",
};

export function parseTrafficMode(value: unknown): TrafficMode {
  return TRAFFIC_MODES.includes(value as TrafficMode)
    ? (value as TrafficMode)
    : DEFAULT_TRAFFIC_MODE;
}

// --- why a visitor was called a bot ------------------------------------------

export type BotReason =
  | "automation-ua"
  | "not-a-browser"
  | "no-page-ever"
  | "dead-cluster";

/* Ordered worst-to-weakest evidence; the UI lists them in this order. */
export const BOT_REASONS: readonly BotReason[] = [
  "automation-ua",
  "not-a-browser",
  "no-page-ever",
  "dead-cluster",
] as const;

export const BOT_REASON_LABELS: Record<BotReason, string> = {
  "automation-ua": "Named itself",
  "not-a-browser": "Not a browser",
  "no-page-ever": "Never loaded a page",
  "dead-cluster": "Identical-agent cluster",
};

// A cluster this size with no measured time anywhere in it is not a coincidence.
export const CLUSTER_MIN_VISITORS = 8;
// Rescues a real person who happens to share a stock user agent with a cluster.
export const CLUSTER_MAX_VIEWS = 2;

export const BOT_REASON_BLURBS: Record<BotReason, string> = {
  "automation-ua":
    "The user agent names a crawler, a scripted HTTP client or an automation driver.",
  "not-a-browser":
    "The user agent is not a browser at all — a headless engine such as Lightpanda, or a placeholder string.",
  "no-page-ever":
    "Posted to the tracking endpoint without ever requesting a page. The site's own script always sends one, so this is a direct call.",
  "dead-cluster":
    `Shares one byte-identical user agent with at least ${CLUSTER_MIN_VISITORS} other visitors, not one of whom recorded a single millisecond of engagement.`,
};

// --- classification ----------------------------------------------------------

export type TrafficRow = {
  id: string;
  userAgent: string | null;
  identified: boolean;
  views: number;
  engaged: boolean;
};

export type TrafficClassification = {
  /** Visitor ids judged automated. Feed to the filter helpers below. */
  botIds: string[];
  /** Why each one was judged automated, for the badge and the audit panel. */
  reasonById: Map<string, BotReason>;
  /** How many fell under each rule. */
  countByReason: Record<BotReason, number>;
  total: number;
  bots: number;
  humans: number;
  /**
   * Visitors kept as human that recorded no engagement and at most one page
   * view. Not evidence of anything on its own — a person who hits back before
   * the beacon flushes looks identical — but it is the soft edge of this
   * classification, and the panel says so rather than implying a precision
   * these rules do not have.
   */
  unproven: number;
};

/* Real browser user agents start with "Mozilla/" or at minimum name an engine.
   Anything else is a library, a headless runtime or a placeholder. */
const BROWSER_TOKENS =
  /mozilla\/|applewebkit|gecko|trident|presto|khtml|opera|chrome|safari|firefox|edge/i;

export function classifyTrafficRows(rows: TrafficRow[]): TrafficClassification {
  // Pass one: group by exact user agent so the cluster rule can see the shape.
  const byAgent = new Map<string, TrafficRow[]>();
  for (const row of rows) {
    const key = row.userAgent ?? "";
    const bucket = byAgent.get(key);
    if (bucket) bucket.push(row);
    else byAgent.set(key, [row]);
  }

  const deadAgents = new Set<string>();
  for (const [agent, group] of byAgent) {
    if (!agent) continue;
    if (group.length < CLUSTER_MIN_VISITORS) continue;
    // One engaged visitor anywhere in the group clears the whole agent: it is
    // a user-agent string real people also use.
    if (group.some((r) => r.engaged || r.identified)) continue;
    deadAgents.add(agent);
  }

  const reasonById = new Map<string, BotReason>();
  const countByReason: Record<BotReason, number> = {
    "automation-ua": 0,
    "not-a-browser": 0,
    "no-page-ever": 0,
    "dead-cluster": 0,
  };
  let unproven = 0;

  for (const row of rows) {
    const reason = reasonFor(row, deadAgents);
    if (reason) {
      reasonById.set(row.id, reason);
      countByReason[reason] += 1;
      continue;
    }
    if (!row.engaged && row.views <= 1 && !row.identified) unproven += 1;
  }

  const botIds = [...reasonById.keys()];
  return {
    botIds,
    reasonById,
    countByReason,
    total: rows.length,
    bots: botIds.length,
    humans: rows.length - botIds.length,
    unproven,
  };
}

function reasonFor(row: TrafficRow, deadAgents: Set<string>): BotReason | null {
  const ua = row.userAgent ?? "";

  /* Taken at its word, and checked first: this is the same list the tracking
     endpoints reject at the door, so a stored row carrying one of these agents
     predates that filter. It is the only rule here that trusts the string. */
  if (isLikelyBot(ua)) return "automation-ua";

  /* Everything below is inference from shape, and two findings override it.
     An email address was typed by a person into a form on this site. Measured
     dwell time means a real engine ran the page script, banked time while the
     document was *visible*, and flushed the beacon on the way out — behaviour
     a crawler has no reason to counterfeit.

     This is not hypothetical politeness: two visitors here send a user agent
     of literally "pc" and "android" and then recorded 10.8s and 7.2s of
     visible time. Stripped agents like that come from privacy browsers and
     in-app webviews. The rule below would have called them robots. */
  if (row.identified || row.engaged) return null;

  if (!BROWSER_TOKENS.test(ua)) return "not-a-browser";

  /* The tracking script sends `pathname ?? "/"` on every navigation and never
     runs on /admin, so it cannot produce a visitor with no page view. Only a
     direct POST can. */
  if (row.views === 0) return "no-page-ever";

  if (deadAgents.has(ua) && row.views <= CLUSTER_MAX_VIEWS) {
    return "dead-cluster";
  }
  return null;
}

/**
 * One query, every visitor. Deliberately not cached: this page is
 * force-dynamic, the table is small, and a stale bot list would be worse than
 * the few milliseconds it costs to be right.
 */
export async function loadTrafficClassification(): Promise<TrafficClassification> {
  const rows = await prisma.$queryRaw<
    {
      id: string;
      userAgent: string | null;
      identified: boolean;
      views: number;
      engaged: boolean;
    }[]
  >`
    SELECT v."id",
           v."userAgent",
           (v."email" IS NOT NULL)                       AS identified,
           COALESCE(pv.views, 0)::int                     AS views,
           (COALESCE(pv.timed, 0) > 0
              OR COALESCE(s.active, 0) > 0)              AS engaged
    FROM "Visitor" v
    LEFT JOIN (
      SELECT "visitorId",
             COUNT(*)::int            AS views,
             COUNT("durationMs")::int AS timed
      FROM "PageView"
      GROUP BY "visitorId"
    ) pv ON pv."visitorId" = v."id"
    LEFT JOIN (
      SELECT "visitorId", SUM("activeMs")::bigint AS active
      FROM "VisitSession"
      GROUP BY "visitorId"
    ) s ON s."visitorId" = v."id"
  `;
  return classifyTrafficRows(rows);
}

// --- applying the filter -----------------------------------------------------

/**
 * A predicate to append inside a WHERE clause of a raw query. `column` is the
 * visitor-id column of whichever table is being filtered, passed as SQL
 * because it differs per query (`v."id"`, `vd."visitorId"`, …).
 *
 * Postgres array binding rather than an id list: one parameter instead of a
 * thousand, and `= ANY('{}')` is valid SQL where `IN ()` is a syntax error, so
 * the no-bots-found case needs no special casing.
 */
export function trafficSql(
  mode: TrafficMode,
  botIds: string[],
  column: Prisma.Sql,
): Prisma.Sql {
  if (mode === "all") return Prisma.empty;
  if (mode === "bots") return Prisma.sql` AND ${column} = ANY(${botIds})`;
  return Prisma.sql` AND NOT (${column} = ANY(${botIds}))`;
}

/**
 * The same filter for Prisma's query builder. Returns undefined for "all",
 * which Prisma drops from the `where` entirely.
 */
export function trafficIdFilter(
  mode: TrafficMode,
  botIds: string[],
): { in: string[] } | { notIn: string[] } | undefined {
  if (mode === "all") return undefined;
  return mode === "bots" ? { in: botIds } : { notIn: botIds };
}
