// Pure constants and field normalisation shared by the campaign composer
// (client) and the campaign API (server). Must stay free of server-only
// imports so it is safe in the browser bundle — see chat-constants.ts.

export const CAMPAIGN_LIMITS = {
  subject: 150,
  preheader: 150,
  eyebrow: 60,
  heading: 150,
  body: 10_000,
  ctaLabel: 40,
  ctaUrl: 2_000,
  urgency: 150,
  price: 30,
  selectedEmails: 5_000,
} as const;

/** Above this many recipients the operator types the count to confirm a send. */
export const TYPED_CONFIRM_THRESHOLD = 50;

/** Sentinel token in preview and test emails. Its unsubscribe page does nothing. */
export const PREVIEW_UNSUBSCRIBE_TOKEN = "preview";

export type CampaignStatus = "DRAFT" | "SENDING" | "SENT";
export type CampaignAudience = "ALL" | "SELECTED";

/** What the operator edits. Stored on Campaign as-is. */
export interface CampaignFields {
  subject: string;
  preheader: string;
  eyebrow: string;
  heading: string;
  body: string;
  ctaLabel: string;
  ctaUrl: string;
  urgency: string;
  productId: string | null;
  priceOverride: string;
  compareAtOverride: string;
  audience: CampaignAudience;
  selectedEmails: string[];
}

export const EMPTY_CAMPAIGN_FIELDS: CampaignFields = {
  subject: "",
  preheader: "",
  eyebrow: "",
  heading: "",
  body: "",
  ctaLabel: "",
  ctaUrl: "",
  urgency: "",
  productId: null,
  priceOverride: "",
  compareAtOverride: "",
  audience: "ALL",
  selectedEmails: [],
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isEmail(value: string): boolean {
  return EMAIL_RE.test(value);
}

function text(raw: unknown, max: number): string {
  return typeof raw === "string" ? raw.trim().slice(0, max) : "";
}

/**
 * A link a campaign may point at: absolute http(s), or a path on this site.
 * Anything else — `javascript:`, `data:`, a bare word — is refused rather than
 * shipped to every subscriber's inbox.
 */
export function isAllowedUrl(value: string): boolean {
  if (value.startsWith("/") && !value.startsWith("//")) return true;
  try {
    const u = new URL(value);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

/**
 * Clamp and clean whatever the composer sent. Never throws: a bad field comes
 * back blank with a reason in `errors`, so a half-typed URL degrades the
 * preview instead of breaking it.
 */
export function normalizeCampaignFields(raw: unknown): {
  fields: CampaignFields;
  errors: string[];
} {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const errors: string[] = [];

  let ctaUrl = text(r.ctaUrl, CAMPAIGN_LIMITS.ctaUrl);
  if (ctaUrl && !isAllowedUrl(ctaUrl)) {
    errors.push("The button link must start with https:// or /.");
    ctaUrl = "";
  }

  const productId =
    typeof r.productId === "string" && r.productId.trim() ? r.productId.trim() : null;

  const selected = Array.isArray(r.selectedEmails) ? r.selectedEmails : [];
  const selectedEmails = [
    ...new Set(
      selected
        .filter((e): e is string => typeof e === "string")
        .map((e) => e.trim().toLowerCase())
        .filter(isEmail),
    ),
  ].slice(0, CAMPAIGN_LIMITS.selectedEmails);

  return {
    fields: {
      subject: text(r.subject, CAMPAIGN_LIMITS.subject),
      preheader: text(r.preheader, CAMPAIGN_LIMITS.preheader),
      eyebrow: text(r.eyebrow, CAMPAIGN_LIMITS.eyebrow),
      heading: text(r.heading, CAMPAIGN_LIMITS.heading),
      body: typeof r.body === "string" ? r.body.replace(/\r\n/g, "\n").trim().slice(0, CAMPAIGN_LIMITS.body) : "",
      ctaLabel: text(r.ctaLabel, CAMPAIGN_LIMITS.ctaLabel),
      ctaUrl,
      urgency: text(r.urgency, CAMPAIGN_LIMITS.urgency),
      productId,
      priceOverride: text(r.priceOverride, CAMPAIGN_LIMITS.price),
      compareAtOverride: text(r.compareAtOverride, CAMPAIGN_LIMITS.price),
      audience: r.audience === "SELECTED" ? "SELECTED" : "ALL",
      selectedEmails,
    },
    errors,
  };
}

export const CAMPAIGN_STATUS_LABEL: Record<CampaignStatus, string> = {
  DRAFT: "Draft",
  SENDING: "Sending",
  SENT: "Sent",
};

/** Semantic colours from the admin design system: zinc draft, sky in progress, emerald done. */
export const CAMPAIGN_STATUS_PILL: Record<CampaignStatus, string> = {
  DRAFT: "bg-zinc-100 text-zinc-700 border-zinc-200",
  SENDING: "bg-sky-50 text-sky-700 border-sky-200",
  SENT: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

export function asCampaignStatus(value: string): CampaignStatus {
  return value === "SENDING" || value === "SENT" ? value : "DRAFT";
}
