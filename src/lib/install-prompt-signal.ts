/**
 * Whether the install banner is currently on screen.
 *
 * The chat teaser stands down while it is. Both are unprompted nudges pinned to
 * the bottom of the viewport, and on a phone they do not merely compete — the
 * teaser lands on top of the banner and clips its copy. The banner is the ask
 * with no other entry point anywhere on the page, so it wins; the teaser's
 * timer restarts once the banner goes.
 *
 * Same shape as dashboard-chat-signal, for the same reason: mount order decides
 * who is listening when, so the flag carries the state and the event carries
 * the change, and a reader checks both.
 */

declare global {
  interface Window {
    __bolInstallPromptOpen?: boolean;
  }
}

export const INSTALL_PROMPT_EVENT = "bol-install-prompt";

/** How long the banner waits before it appears. Exported because the chat
 *  teaser is timed against it: anything that shows sooner gets replaced by the
 *  banner a moment later, which reads as a glitch rather than as two asks. */
export const INSTALL_PROMPT_DELAY_MS = 10_000;

export function setInstallPromptOpen(open: boolean): void {
  if (typeof window === "undefined") return;
  window.__bolInstallPromptOpen = open;
  window.dispatchEvent(new CustomEvent(INSTALL_PROMPT_EVENT, { detail: open }));
}

export function isInstallPromptOpen(): boolean {
  return (
    typeof window !== "undefined" && window.__bolInstallPromptOpen === true
  );
}
