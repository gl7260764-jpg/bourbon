"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
  type BeforeInstallPromptEvent,
  INSTALLED_EVENT,
  OPEN_INSTALL_EVENT,
  READY_EVENT,
  type Platform,
  alreadyInstalled,
  canOfferInstall,
  detectPlatform,
  isStandalone,
  markDismissed,
  markInstalled,
  wasRecentlyDismissed,
} from "@/lib/pwa";

const DELAY_MS = 10_000;

export default function InstallPrompt() {
  /* Mounted from the root layout, which is outside SiteChrome's admin branch,
     so without this the operator was shown a "save 5% on every order" install
     card over their own tools — and on the chat page it sat on top of the
     composer. */
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [platform, setPlatform] = useState<Platform>("desktop-bookmark");
  const [deferredEvent, setDeferredEvent] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    /* The head script may have captured the event well before this mounted, so
       it is read when the timer fires rather than subscribed to from here;
       anything arriving later comes through `bip-ready`. */
    const handleReady = () => {
      if (window.__bipDeferred) setDeferredEvent(window.__bipDeferred);
    };

    const handleInstalled = () => {
      markInstalled();
      setVisible(false);
    };

    /* Opened from the navbar button. That is an explicit request, so it
       ignores the cooldown, and when there is no native prompt to fire it goes
       straight to the manual steps rather than making the user click twice. */
    const handleOpen = () => {
      if (isStandalone() || alreadyInstalled()) return;
      const evt = window.__bipDeferred ?? null;
      setDeferredEvent(evt);
      setPlatform(detectPlatform());
      setExpanded(!evt);
      setVisible(true);
    };

    window.addEventListener(READY_EVENT, handleReady);
    window.addEventListener(INSTALLED_EVENT, handleInstalled);
    window.addEventListener("appinstalled", handleInstalled);
    window.addEventListener(OPEN_INSTALL_EVENT, handleOpen);

    const timer = window.setTimeout(() => {
      if (!isStandalone() && !alreadyInstalled() && !wasRecentlyDismissed()) {
        setDeferredEvent(window.__bipDeferred ?? null);
        setPlatform(detectPlatform());
        setVisible(true);
      }
    }, DELAY_MS);

    return () => {
      window.removeEventListener(READY_EVENT, handleReady);
      window.removeEventListener(INSTALLED_EVENT, handleInstalled);
      window.removeEventListener("appinstalled", handleInstalled);
      window.removeEventListener(OPEN_INSTALL_EVENT, handleOpen);
      window.clearTimeout(timer);
    };
  }, []);

  const dismiss = () => {
    markDismissed();
    setVisible(false);
  };

  const handleInstall = async () => {
    /* Prefer the browser's own install flow whenever it is available; the
       written steps are a fallback for platforms that genuinely have no
       install API (iOS Safari) or where the event never arrived. */
    const evt = deferredEvent ?? window.__bipDeferred ?? null;
    if (evt) {
      try {
        await evt.prompt();
        const choice = await evt.userChoice;
        if (choice.outcome === "accepted") {
          markInstalled();
        } else {
          markDismissed();
        }
        setVisible(false);
      } catch {
        setExpanded(true);
      }
      /* A prompt event is single-use once shown. */
      window.__bipDeferred = null;
      setDeferredEvent(null);
      return;
    }

    setExpanded(true);
  };

  if (!visible || pathname?.startsWith("/admin")) return null;

  const isMac = typeof navigator !== "undefined" && /Mac/i.test(navigator.platform);
  const bookmarkKey = isMac ? "⌘ + D" : "Ctrl + D";

  const headline =
    platform === "ios-safari"
      ? "Add to Home Screen"
      : platform === "desktop-bookmark"
        ? "Save Bourbon Oak Lover"
        : "Install the App";

  const subhead =
    platform === "ios-safari"
      ? "Get instant access from your home screen — no app store needed."
      : platform === "desktop-bookmark"
        ? "Bookmark us so you never miss a new release."
        : "Add Bourbon Oak Lover to your home screen for instant access.";

  /* Label from what the button will actually do, not from the platform guess:
     if a real install prompt is in hand it says Install and installs. */
  const canInstallNow = deferredEvent !== null;
  const primaryLabel = canInstallNow
    ? "Install"
    : platform === "ios-safari"
      ? "Show me how"
      : platform === "desktop-bookmark"
        ? "How to bookmark"
        : "Install";

  /* Only where an install can genuinely happen — never for a bookmark. */
  const showOffer = canOfferInstall(platform);

  return (
    /* Non-modal on purpose. This is an invitation, not a decision the visitor
       has to make before continuing: no backdrop, no scroll lock, no focus
       trap, and the page stays fully interactive behind it. It is an <aside>
       rather than role="dialog" because a dialog that neither traps focus nor
       blocks the page misdescribes itself to a screen reader. */
    <aside
      aria-labelledby="install-popup-title"
      className="animate-fade-up fixed inset-x-0 bottom-0 z-[60] p-3 sm:p-4 pointer-events-none flex justify-center"
    >
      <div
        className="pointer-events-auto relative w-full sm:max-w-md bg-white shadow-2xl shadow-black/30 border border-bourbon-deep/10 overflow-hidden
                   pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:pb-0 sm:mb-2"
      >
        <div className="h-px bg-gradient-to-r from-transparent via-bourbon-gold to-transparent" />

        <button
          onClick={dismiss}
          aria-label="Dismiss"
          className="absolute top-2.5 right-2.5 z-10 p-1 text-bourbon-stone/50 hover:text-bourbon-deep transition-colors cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Compact horizontal layout — a bottom card has to stay short enough
            that it never covers the content the visitor is reading. */}
        <div className="flex items-start gap-3.5 p-4 pr-9">
          <span className="shrink-0 w-11 h-11 bg-bourbon-gold flex items-center justify-center">
            <svg className="w-5 h-5 text-bourbon-deep" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.75}
                d="M12 3v11m0 0l-3.5-3.5M12 14l3.5-3.5M4 16v3a2 2 0 002 2h12a2 2 0 002-2v-3"
              />
            </svg>
          </span>

          <div className="min-w-0 flex-1">
            <h3
              id="install-popup-title"
              className="font-[family-name:var(--font-playfair)] text-bourbon-deep text-base font-bold leading-snug"
            >
              {headline}
              {/* Marketing copy only — nothing is issued or redeemable here,
                  matching how the newsletter popup states its 10%. */}
              {showOffer && (
                <span className="text-bourbon-gold"> — save 5% on every order</span>
              )}
            </h3>
            <p className="text-bourbon-stone text-[13px] leading-snug mt-1">
              {subhead}
            </p>

            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={handleInstall}
                className="px-4 py-2 bg-bourbon-gold text-bourbon-deep text-[11px] font-semibold tracking-wider uppercase hover:bg-bourbon-amber transition-colors cursor-pointer"
              >
                {primaryLabel}
              </button>
              <button
                onClick={dismiss}
                className="px-3 py-2 text-bourbon-stone text-[11px] font-semibold tracking-wider uppercase hover:text-bourbon-deep transition-colors cursor-pointer"
              >
                Not now
              </button>
            </div>
          </div>
        </div>

        {expanded && (
          <div className="animate-fade-in border-t border-bourbon-deep/10 bg-bourbon-cream/60 px-4 py-3.5">
            {platform === "ios-safari" ? (
              <ol className="text-bourbon-stone text-[13px] space-y-1.5 list-decimal list-inside leading-relaxed">
                <li>
                  Tap the <span className="text-bourbon-deep font-semibold">Share</span> icon at the bottom of Safari.
                </li>
                <li>
                  Scroll and tap{" "}
                  <span className="text-bourbon-deep font-semibold">Add to Home Screen</span>.
                </li>
                <li>
                  Tap <span className="text-bourbon-deep font-semibold">Add</span> in the top-right.
                </li>
              </ol>
            ) : platform === "android-chrome" ? (
              <ol className="text-bourbon-stone text-[13px] space-y-1.5 list-decimal list-inside leading-relaxed">
                <li>Open the browser <span className="text-bourbon-deep font-semibold">menu</span> (three dots).</li>
                <li>
                  Tap <span className="text-bourbon-deep font-semibold">Install app</span> or{" "}
                  <span className="text-bourbon-deep font-semibold">Add to Home Screen</span>.
                </li>
                <li>Confirm <span className="text-bourbon-deep font-semibold">Install</span>.</li>
              </ol>
            ) : (
              <div className="text-bourbon-stone text-[13px] leading-relaxed">
                Press{" "}
                <kbd className="px-1.5 py-0.5 bg-white border border-bourbon-deep/15 text-bourbon-deep font-mono text-[11px]">
                  {bookmarkKey}
                </kbd>{" "}
                to bookmark this page. In Chrome or Edge you can also click the install icon in the address bar.
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
