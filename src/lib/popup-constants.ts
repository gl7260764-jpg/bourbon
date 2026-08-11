// Pure constants shared by client (EmailCapturePopup), the admin form and the
// API routes. Must stay free of server-only imports (prisma, etc.) so it's
// safe in the browser bundle.

export const POPUP_ENABLED_KEY = "email_popup_enabled";
export const POPUP_DELAY_KEY = "email_popup_delay_seconds";
export const POPUP_NAG_KEY = "email_popup_nag_until_subscribed";
export const POPUP_REPROMPT_DAYS_KEY = "email_popup_reprompt_days";

export interface PopupSettings {
  enabled: boolean;
  /** Seconds before the first prompt, and the gap after each dismissal. */
  delaySeconds: number;
  /** Keep re-asking every delaySeconds until they subscribe. */
  nagUntilSubscribed: boolean;
  /** Only used when nagUntilSubscribed is false. */
  repromptAfterDays: number;
}

export const DEFAULT_POPUP_SETTINGS: PopupSettings = {
  enabled: true,
  delaySeconds: 60,
  nagUntilSubscribed: true,
  repromptAfterDays: 3,
};

// A 0-second delay combined with nag-until-subscribed would reopen the modal
// the instant it's dismissed, leaving the visitor no way out. The floor is a
// guard against locking the storefront by typo.
export const MIN_DELAY_SECONDS = 3;
export const MAX_DELAY_SECONDS = 3600; // 1 hour
export const MAX_REPROMPT_DAYS = 365;

export function clampDelaySeconds(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_POPUP_SETTINGS.delaySeconds;
  return Math.min(MAX_DELAY_SECONDS, Math.max(MIN_DELAY_SECONDS, Math.round(value)));
}

export function clampRepromptDays(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_POPUP_SETTINGS.repromptAfterDays;
  return Math.min(MAX_REPROMPT_DAYS, Math.max(0, Math.round(value)));
}

// Settings come back from the API as JSON of unknown shape (and from the
// key-value store as strings), so normalise in one place.
export function normalizePopupSettings(raw: unknown): PopupSettings {
  const o = (raw ?? {}) as Record<string, unknown>;
  return {
    enabled:
      typeof o.enabled === "boolean"
        ? o.enabled
        : DEFAULT_POPUP_SETTINGS.enabled,
    delaySeconds: clampDelaySeconds(Number(o.delaySeconds)),
    nagUntilSubscribed:
      typeof o.nagUntilSubscribed === "boolean"
        ? o.nagUntilSubscribed
        : DEFAULT_POPUP_SETTINGS.nagUntilSubscribed,
    repromptAfterDays: clampRepromptDays(Number(o.repromptAfterDays)),
  };
}
