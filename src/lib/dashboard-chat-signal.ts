/**
 * Whether the dashboard is currently showing its own chat panel.
 *
 * The storefront widget hides while it is. An event alone was not enough:
 * AccountClient sits above ChatWidget in the tree, so its effect fires first
 * and the widget missed the message it was never listening for yet. The flag
 * is the state, the event is the change notification, and the widget reads
 * both.
 */

declare global {
  interface Window {
    __bolDashboardChatOpen?: boolean;
  }
}

export const DASHBOARD_CHAT_EVENT = "bol-dashboard-chat";

export function setDashboardChatOpen(open: boolean): void {
  if (typeof window === "undefined") return;
  window.__bolDashboardChatOpen = open;
  window.dispatchEvent(new CustomEvent(DASHBOARD_CHAT_EVENT, { detail: open }));
}

export function isDashboardChatOpen(): boolean {
  return typeof window !== "undefined" && window.__bolDashboardChatOpen === true;
}
