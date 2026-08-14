/* Shared PWA-install state. Both entry points — the timed popup and the
   navbar button — read the same signals, which the inline script in layout.tsx
   publishes on `window` before React hydrates. */

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
  prompt(): Promise<void>;
}

declare global {
  interface Window {
    __bipDeferred?: BeforeInstallPromptEvent | null;
  }
}

export const DISMISS_KEY = "bol_install_dismissed_at";
export const INSTALLED_KEY = "bol_app_installed";
export const COOLDOWN_MS = 2 * 24 * 60 * 60 * 1000; // 2 days

/* Dispatched by the navbar button to open the popup on demand. A user who
   clicks Install has asked for it, so that path ignores the cooldown. */
export const OPEN_INSTALL_EVENT = "bol-open-install";
/* Published by the layout script. */
export const READY_EVENT = "bip-ready";
export const INSTALLED_EVENT = "bip-installed";

export type Platform =
  | "android-chrome"
  | "ios-safari"
  | "desktop-chromium"
  | "desktop-bookmark";

export function detectPlatform(): Platform {
  if (typeof window === "undefined") return "desktop-bookmark";
  const ua = window.navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/i.test(ua) && !("MSStream" in window);
  const isAndroid = /android/i.test(ua);
  const isMobile = isIOS || isAndroid || /Mobi/i.test(ua);
  const isChromium = /Chrome|Chromium|Edg|CriOS/i.test(ua) && !/Firefox|FxiOS/i.test(ua);

  if (isIOS) return "ios-safari";
  if (isAndroid && isChromium) return "android-chrome";
  if (!isMobile && isChromium) return "desktop-chromium";
  return "desktop-bookmark";
}

/* True only while the page is *running* as the installed app. */
export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  if (window.matchMedia("(display-mode: standalone)").matches) return true;
  const navAny = window.navigator as Navigator & { standalone?: boolean };
  return navAny.standalone === true;
}

/* Someone who installed the app and later opens the site in an ordinary
   browser tab is not standalone, so the install is recorded separately and
   suppresses both entry points for good. */
export function alreadyInstalled(): boolean {
  try {
    return window.localStorage.getItem(INSTALLED_KEY) === "1";
  } catch {
    return false;
  }
}

export function markInstalled() {
  try {
    window.localStorage.setItem(INSTALLED_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function markDismissed() {
  try {
    window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
  } catch {
    /* ignore */
  }
}

export function wasRecentlyDismissed(): boolean {
  try {
    const raw = window.localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    const ts = Number(raw);
    if (!Number.isFinite(ts)) return false;
    return Date.now() - ts < COOLDOWN_MS;
  } catch {
    return false;
  }
}

/* Bookmarking is not installing, so the desktop-bookmark fallback never counts
   as an install opportunity — it earns no button and no discount offer. */
export function canOfferInstall(platform: Platform): boolean {
  return Boolean(
    (typeof window !== "undefined" && window.__bipDeferred) ||
      platform === "ios-safari",
  );
}
