"use client";

import { useEffect, useState } from "react";
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

  if (!visible) return null;

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
    <div
      className="animate-fade-in fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-sm"
      onClick={dismiss}
      role="dialog"
      aria-modal="true"
      aria-labelledby="install-popup-title"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="animate-pop-in relative w-full max-w-md bg-bourbon-deep border border-bourbon-gold/30 shadow-2xl shadow-black/60 overflow-hidden"
      >
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-bourbon-gold/70 to-transparent" />

          <button
            onClick={dismiss}
            aria-label="Close"
            className="absolute top-3 right-3 z-10 text-bourbon-cream/50 hover:text-bourbon-cream cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="px-6 sm:px-8 pt-8 sm:pt-10 pb-6 sm:pb-8 text-center">
            <div className="mx-auto w-20 h-20 sm:w-24 sm:h-24 bg-bourbon-dark border border-bourbon-gold/40 flex flex-col items-center justify-center mb-5">
              <span className="text-[8px] sm:text-[9px] tracking-[0.3em] text-bourbon-gold/70 uppercase">
                Est. 1876
              </span>
              <span className="font-[family-name:var(--font-playfair)] text-bourbon-gold text-2xl sm:text-3xl font-bold leading-none mt-1">
                B&amp;O
              </span>
              <div className="w-6 h-px bg-bourbon-gold/60 mt-1.5" />
            </div>

            <p className="text-bourbon-gold text-[10px] sm:text-[11px] tracking-[0.3em] uppercase font-semibold">
              Join the Inner Circle
            </p>
            <h3
              id="install-popup-title"
              className="font-[family-name:var(--font-playfair)] text-bourbon-cream text-2xl sm:text-3xl font-bold mt-2 leading-tight"
            >
              {headline}
            </h3>
            <p className="text-bourbon-cream/65 text-sm sm:text-base mt-3 leading-relaxed max-w-sm mx-auto">
              {subhead}
            </p>

            {/* Marketing copy only — nothing is issued or redeemable here,
                matching how the newsletter popup states its 10%. */}
            {showOffer && (
              <p className="mt-5 inline-flex items-center gap-2.5 border border-bourbon-gold/35 bg-bourbon-gold/10 px-4 py-2.5">
                <span className="font-[family-name:var(--font-playfair)] text-bourbon-gold text-lg font-bold leading-none">
                  5%
                </span>
                <span className="text-bourbon-cream/80 text-xs sm:text-sm leading-snug">
                  off your next bottle when you install
                </span>
              </p>
            )}

            <div className="mt-7 flex flex-col gap-3">
              <button
                onClick={handleInstall}
                className="w-full px-6 py-3 bg-bourbon-gold text-bourbon-deep text-xs sm:text-sm font-semibold tracking-wider uppercase hover:bg-bourbon-amber transition-colors cursor-pointer"
              >
                {primaryLabel}
              </button>
              <button
                onClick={dismiss}
                className="text-bourbon-cream/50 text-xs tracking-wider uppercase hover:text-bourbon-cream transition-colors cursor-pointer"
              >
                Maybe later
              </button>
            </div>
          </div>

          {expanded && (
            <div className="animate-fade-in border-t border-bourbon-gold/15 bg-bourbon-dark/60 px-6 sm:px-8 py-5">
              {platform === "ios-safari" ? (
                <ol className="text-bourbon-cream/80 text-sm space-y-2 list-decimal list-inside leading-relaxed">
                  <li>
                    Tap the <span className="text-bourbon-gold font-semibold">Share</span> icon at the bottom of Safari.
                  </li>
                  <li>
                    Scroll and tap{" "}
                    <span className="text-bourbon-gold font-semibold">Add to Home Screen</span>.
                  </li>
                  <li>
                    Tap <span className="text-bourbon-gold font-semibold">Add</span> in the top-right.
                  </li>
                </ol>
              ) : platform === "android-chrome" ? (
                <ol className="text-bourbon-cream/80 text-sm space-y-2 list-decimal list-inside leading-relaxed">
                  <li>Open the browser <span className="text-bourbon-gold font-semibold">menu</span> (three dots).</li>
                  <li>
                    Tap{" "}
                    <span className="text-bourbon-gold font-semibold">Install app</span> or{" "}
                    <span className="text-bourbon-gold font-semibold">Add to Home Screen</span>.
                  </li>
                  <li>Confirm <span className="text-bourbon-gold font-semibold">Install</span>.</li>
                </ol>
              ) : (
                <div className="text-bourbon-cream/80 text-sm leading-relaxed text-center">
                  Press{" "}
                  <kbd className="px-2 py-0.5 bg-bourbon-cream/10 border border-bourbon-cream/20 text-bourbon-gold font-mono text-xs">
                    {bookmarkKey}
                  </kbd>{" "}
                  to bookmark this page. In Chrome or Edge, you can also click the install icon in the address bar.
                </div>
              )}
            </div>
          )}

          <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 font-[family-name:var(--font-playfair)] text-[6rem] font-bold text-bourbon-cream/[0.03] uppercase leading-none pointer-events-none whitespace-nowrap">
            BOURBON
          </span>
      </div>
    </div>
  );
}
