/**
 * Storefront commerce rules — the single source of truth for the order
 * minimum and the shipping threshold.
 *
 * These numbers appear in the announcement bar, the shop header, the cart
 * drawer, checkout, the shipping page and the server that actually charges
 * money. They live here so those can never disagree: the shipping page
 * previously advertised "free shipping over $250" while the server charged
 * nothing at any value, which is exactly the drift this prevents.
 */

/** Below this subtotal, checkout is refused. */
export const MIN_ORDER_TOTAL = 100;

/** At or above this subtotal, shipping is free. */
export const FREE_SHIPPING_THRESHOLD = 500;

/** Flat rate charged below the threshold. */
export const FLAT_SHIPPING_COST = 9.99;

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Shipping for a given subtotal.
 *
 * Deliberately keyed on subtotal, not on the discounted total: a payment-rail
 * discount is a courtesy on the goods, and letting it drag someone back under
 * the threshold would take away free shipping they had already earned.
 */
export function shippingFor(subtotal: number): number {
  if (!Number.isFinite(subtotal) || subtotal <= 0) return 0;
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : FLAT_SHIPPING_COST;
}

export function meetsMinimum(subtotal: number): boolean {
  return Number.isFinite(subtotal) && subtotal >= MIN_ORDER_TOTAL;
}

/** How much more is needed to reach the minimum. 0 once met. */
export function amountToMinimum(subtotal: number): number {
  return Math.max(0, round2(MIN_ORDER_TOTAL - subtotal));
}

/** How much more is needed for free shipping. 0 once earned. */
export function amountToFreeShipping(subtotal: number): number {
  return Math.max(0, round2(FREE_SHIPPING_THRESHOLD - subtotal));
}

/** One line for banners and headers. */
export const SHIPPING_TERMS_SHORT = `$${MIN_ORDER_TOTAL} minimum order · Free shipping over $${FREE_SHIPPING_THRESHOLD}`;
