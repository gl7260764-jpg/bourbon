// Shared types + normalisation for operator-managed payment rails.
// Client-safe: no prisma, no server imports (the checkout form imports this).
//
// A rail deliberately carries NO account details. Canned per-method
// instructions were removed: the buyer is now given details per order by an
// operator from the order page, which is the only way to quote a reference
// unique to that payment and the only place the details are ever shown. The
// PaymentOption.instructions column is left in place for historical rows and
// is no longer read or written.

export interface PaymentOptionView {
  key: string;
  label: string;
  detail: string | null;
  /** 0.1 = 10% off. Display only — the server resolves the real rate. */
  discountRate: number;
}

export const MAX_LABEL_LEN = 60;
export const MAX_DETAIL_LEN = 160;
export const MAX_DISCOUNT_RATE = 0.5;

/** Slugify a label into a stable key: "Cash App" -> "cash-app". */
export function toKey(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export function clampDiscountRate(value: number): number {
  if (!Number.isFinite(value) || value < 0) return 0;
  return Math.min(MAX_DISCOUNT_RATE, Math.round(value * 1000) / 1000);
}

export interface PaymentOptionInput {
  key: string;
  label: string;
  detail: string | null;
  discountRate: number;
  isActive: boolean;
  sortOrder: number;
}

/**
 * Validate an admin-submitted rail. Returns either an error string or the
 * cleaned record — callers must not persist anything until this passes.
 */
export function validatePaymentOption(
  raw: unknown,
): { error: string } | { value: PaymentOptionInput } {
  const o = (raw ?? {}) as Record<string, unknown>;

  const label = typeof o.label === "string" ? o.label.trim() : "";
  if (!label) return { error: "Label is required." };
  if (label.length > MAX_LABEL_LEN) {
    return { error: `Label must be ${MAX_LABEL_LEN} characters or fewer.` };
  }

  const key = typeof o.key === "string" && o.key.trim() ? toKey(o.key) : toKey(label);
  if (!key) return { error: "Could not derive a key from that label." };

  const detail = typeof o.detail === "string" ? o.detail.trim() : "";
  if (detail.length > MAX_DETAIL_LEN) {
    return { error: `Detail must be ${MAX_DETAIL_LEN} characters or fewer.` };
  }

  const rateRaw = Number(o.discountRate ?? 0);
  if (!Number.isFinite(rateRaw) || rateRaw < 0 || rateRaw > MAX_DISCOUNT_RATE) {
    return {
      error: `Discount must be between 0 and ${MAX_DISCOUNT_RATE * 100}%.`,
    };
  }

  return {
    value: {
      key,
      label,
      detail: detail || null,
      discountRate: clampDiscountRate(rateRaw),
      isActive: o.isActive !== false,
      sortOrder: Number.isFinite(Number(o.sortOrder)) ? Number(o.sortOrder) : 0,
    },
  };
}
