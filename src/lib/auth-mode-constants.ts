// Client-safe: imported by the login form and the admin settings form, so it
// must stay free of prisma and node builtins. Same shape as the other
// admin-editable settings (see popup-constants.ts).

export const AUTH_MODE_KEY = "customer_auth_mode";

export type AuthMode =
  /** Email a 6-digit code, then verify it. */
  | "CODE"
  /** Email a single-use sign-in link. No code to type. */
  | "LINK"
  /** Entering an address signs you in. No verification of any kind. */
  | "EMAIL_ONLY";

export const AUTH_MODES: AuthMode[] = ["CODE", "LINK", "EMAIL_ONLY"];

export const DEFAULT_AUTH_MODE: AuthMode = "CODE";

export function normalizeAuthMode(raw: unknown): AuthMode {
  const v = typeof raw === "string" ? raw.toUpperCase() : "";
  return (AUTH_MODES as string[]).includes(v) ? (v as AuthMode) : DEFAULT_AUTH_MODE;
}

export const AUTH_MODE_LABEL: Record<AuthMode, string> = {
  CODE: "6-digit code",
  LINK: "One-click email link",
  EMAIL_ONLY: "Email only — no verification",
};

export const AUTH_MODE_DETAIL: Record<AuthMode, string> = {
  CODE: "We email a 6-digit code and the buyer types it in. Slowest, and the strongest.",
  LINK: "We email a link that signs them in on tap. Nothing to type, and holding the mailbox is still the proof.",
  EMAIL_ONLY:
    "Entering an address signs you straight in. Anyone who knows a customer's email can open their account.",
};

/** True for modes that prove the person controls the mailbox. */
export function verifiesMailbox(mode: AuthMode): boolean {
  return mode !== "EMAIL_ONLY";
}
