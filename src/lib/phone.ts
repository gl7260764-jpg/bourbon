/**
 * US (NANP) phone parsing, validation and formatting.
 *
 * Shared deliberately: the checkout form and POST /api/orders both import
 * from here, so what the customer is told is valid and what the server will
 * accept cannot drift apart. A client-side check alone is decoration — the
 * API is a public endpoint and is where the rule has to be enforced.
 */

/** Everything that isn't a digit. Users paste "+1 (502) 555-0199 ext" etc. */
export function digitsOnly(raw: string): string {
  return (raw ?? "").replace(/\D+/g, "");
}

/**
 * Reduce any accepted spelling to the bare 10-digit national number, or null
 * if it cannot be one. Accepts an optional country code: "1XXXXXXXXXX" and
 * "+1 XXX-XXX-XXXX" both normalise to the same 10 digits.
 */
export function normalizeUsPhone(raw: string): string | null {
  let d = digitsOnly(raw);
  if (d.length === 11 && d.startsWith("1")) d = d.slice(1);
  return d.length === 10 ? d : null;
}

/**
 * NANP structural rules, which rule out most typos and every made-up number
 * that merely has ten digits:
 *   - area code (NPA) starts 2-9, and its last two digits are not "11"
 *     (N11 is reserved for services like 411 and 911)
 *   - exchange code (NXX) starts 2-9, same N11 restriction
 */
export function isValidUsPhone(raw: string): boolean {
  const d = normalizeUsPhone(raw);
  if (!d) return false;
  const npa = d.slice(0, 3);
  const nxx = d.slice(3, 6);
  if (npa[0] < "2" || npa[0] > "9") return false;
  if (npa.slice(1) === "11") return false;
  if (nxx[0] < "2" || nxx[0] > "9") return false;
  if (nxx.slice(1) === "11") return false;
  return true;
}

/**
 * Progressive display format for an input the user is still typing into.
 * Only ever formats what has been entered, so the caret does not fight the
 * mask and a partial number stays editable.
 */
export function formatUsPhone(raw: string): string {
  let d = digitsOnly(raw);
  if (d.length === 11 && d.startsWith("1")) d = d.slice(1);
  d = d.slice(0, 10);
  if (d.length === 0) return "";
  if (d.length <= 3) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

/** Canonical storage form, e.g. "+15025550199". Null when not valid. */
export function toE164Us(raw: string): string | null {
  const d = normalizeUsPhone(raw);
  return d && isValidUsPhone(d) ? `+1${d}` : null;
}

/** The single message shown for a bad number, in the form and from the API. */
export const US_PHONE_ERROR =
  "Enter a valid 10-digit US phone number, e.g. (502) 555-0199.";
