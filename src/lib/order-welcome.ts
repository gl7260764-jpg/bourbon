import { getSetting, setSetting } from "@/lib/settings";

/**
 * The messages that open a buyer's chat the moment they place an order.
 *
 * Editable from Admin → Settings rather than hardcoded, because the promise
 * they carry is a promise about people: "within 5 minutes" is true at 2pm on a
 * Tuesday and false at 2am, and changing it should not need a deploy.
 */

const KEYS = {
  greeting: "order_chat_greeting",
  promise: "order_chat_promise",
  suggestInstall: "order_chat_suggest_install",
} as const;

export const DEFAULTS = {
  greeting: "Hi {firstName}, thank you for your order.",
  promise:
    "We have {orderNumber} and someone will be with you right here within 5 minutes. No need to do anything — your order summary is above.",
  suggestInstall:
    "Keep this page open, or install the app so a reply reaches you even when the site is closed.",
} as const;

export interface OrderWelcomeSettings {
  greeting: string;
  promise: string;
  suggestInstall: boolean;
  installLine: string;
}

export async function getOrderWelcome(): Promise<OrderWelcomeSettings> {
  const [greeting, promise, suggest] = await Promise.all([
    getSetting(KEYS.greeting, DEFAULTS.greeting),
    getSetting(KEYS.promise, DEFAULTS.promise),
    getSetting(KEYS.suggestInstall, "true"),
  ]);
  return {
    greeting,
    promise,
    suggestInstall: suggest !== "false",
    installLine: DEFAULTS.suggestInstall,
  };
}

export async function saveOrderWelcome(input: {
  greeting: string;
  promise: string;
  suggestInstall: boolean;
}): Promise<void> {
  await Promise.all([
    setSetting(KEYS.greeting, input.greeting.trim() || DEFAULTS.greeting),
    setSetting(KEYS.promise, input.promise.trim() || DEFAULTS.promise),
    setSetting(KEYS.suggestInstall, input.suggestInstall ? "true" : "false"),
  ]);
}

/**
 * Fill the placeholders.
 *
 * An unknown name must never render as "Hi ," or "Hi {firstName}," so a missing
 * first name collapses the whole greeting to a generic one rather than leaving
 * a hole where a person's name should be.
 */
export function fillWelcome(
  template: string,
  vars: { firstName: string; orderNumber: string },
): string {
  const name = vars.firstName.trim();
  return template
    .replace(/\{firstName\}\s*/g, name ? `${name} ` : "")
    .replace(/\{orderNumber\}/g, vars.orderNumber)
    // "Hi , thank you" when the name was empty — tidy the comma it left behind.
    .replace(/\s+,/g, ",")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/** First name only, for the greeting. Falls back to an empty string. */
export function firstNameOf(fullName: string | null | undefined): string {
  if (!fullName) return "";
  const first = fullName.trim().split(/\s+/)[0] ?? "";
  // "JOHN SMITH" shouted back at someone reads worse than no name at all.
  if (first.length > 1 && first === first.toUpperCase()) {
    return first[0] + first.slice(1).toLowerCase();
  }
  return first;
}
