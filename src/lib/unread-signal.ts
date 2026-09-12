/**
 * The customer's unread count, shared between the navbar and the dashboard.
 *
 * Both surfaces show the same number and both are mounted at once on
 * /account, so polling it twice would double the queries to say the same
 * thing. The navbar owns the poll — it is on every page — and publishes here;
 * the dashboard listens.
 *
 * Same shape as dashboard-chat-signal: a window flag for the current value
 * plus an event for the change. The flag matters because mount order is not
 * guaranteed — a listener that attaches after the last broadcast would
 * otherwise sit on a stale server-rendered number until the next poll.
 */

declare global {
  interface Window {
    __bolUnreadCount?: number;
  }
}

export const UNREAD_EVENT = "bol-unread";

export function publishUnreadCount(n: number): void {
  if (typeof window === "undefined") return;
  window.__bolUnreadCount = n;
  window.dispatchEvent(new CustomEvent(UNREAD_EVENT, { detail: n }));
}

/** Last known count, or null when nothing has polled yet. */
export function peekUnreadCount(): number | null {
  if (typeof window === "undefined") return null;
  return typeof window.__bolUnreadCount === "number"
    ? window.__bolUnreadCount
    : null;
}
