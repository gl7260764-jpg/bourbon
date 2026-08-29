// Pure constants shared by the client (EnablePushDialog), the admin form and
// the API routes. Must stay free of server-only imports (prisma, etc.) so it's
// safe in the browser bundle — same contract as popup-constants.ts.

export const PUSH_PROMPT_ENABLED_KEY = "push_prompt_enabled";
export const PUSH_PROMPT_DELAY_KEY = "push_prompt_delay_seconds";
export const PUSH_PROMPT_REPROMPT_DAYS_KEY = "push_prompt_reprompt_days";

export interface PushPromptSettings {
  enabled: boolean;
  /** Seconds on the dashboard before the prompt appears. */
  delaySeconds: number;
  /** How long a dismissal lasts before the buyer is asked again. */
  repromptAfterDays: number;
}

export const DEFAULT_PUSH_PROMPT_SETTINGS: PushPromptSettings = {
  enabled: true,
  delaySeconds: 5,
  repromptAfterDays: 14,
};

/* 0 is allowed and means "as soon as the dashboard renders". Unlike the email
   popup there is no nag-until-subscribed loop here, so a zero delay cannot
   trap anyone. */
export const MIN_PUSH_DELAY_SECONDS = 0;
export const MAX_PUSH_DELAY_SECONDS = 3600; // 1 hour
export const MAX_PUSH_REPROMPT_DAYS = 365;

export function clampPushDelaySeconds(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_PUSH_PROMPT_SETTINGS.delaySeconds;
  return Math.min(
    MAX_PUSH_DELAY_SECONDS,
    Math.max(MIN_PUSH_DELAY_SECONDS, Math.round(value)),
  );
}

export function clampPushRepromptDays(value: number): number {
  if (!Number.isFinite(value)) {
    return DEFAULT_PUSH_PROMPT_SETTINGS.repromptAfterDays;
  }
  return Math.min(MAX_PUSH_REPROMPT_DAYS, Math.max(0, Math.round(value)));
}

/** Settings arrive as JSON of unknown shape (and as strings from the
    key-value store), so normalise in one place. */
export function normalizePushPromptSettings(raw: unknown): PushPromptSettings {
  const o = (raw ?? {}) as Record<string, unknown>;
  return {
    enabled:
      typeof o.enabled === "boolean"
        ? o.enabled
        : DEFAULT_PUSH_PROMPT_SETTINGS.enabled,
    delaySeconds: clampPushDelaySeconds(Number(o.delaySeconds)),
    repromptAfterDays: clampPushRepromptDays(Number(o.repromptAfterDays)),
  };
}
