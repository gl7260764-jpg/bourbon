"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
  prompt(): Promise<void>;
}

const DISMISS_KEY = "bol_install_dismissed_at";
const COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const DELAY_MS = 10_000;

type Platform = "android-chrome" | "ios-safari" | "desktop-chromium" | "desktop-bookmark";

function detectPlatform(): Platform {
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

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  if (window.matchMedia("(display-mode: standalone)").matches) return true;
  const navAny = window.navigator as Navigator & { standalone?: boolean };
  return navAny.standalone === true;
}

function wasRecentlyDismissed(): boolean {
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

function markDismissed() {
  try {
    window.localStorage.setItem(DISMISS_KEY, String(Date.now()));
  } catch {
    /* ignore */
  }
}

export default function InstallPrompt() {
  const [visible, setVisible] = useState(false);
  const [platform, setPlatform] = useState<Platform>("desktop-bookmark");
  const [deferredEvent, setDeferredEvent] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isStandalone()) return;
    if (wasRecentlyDismissed()) return;

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredEvent(e as BeforeInstallPromptEvent);
    };

    const handleInstalled = () => {
      setVisible(false);
      markDismissed();
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleInstalled);

    const timer = window.setTimeout(() => {
      if (!isStandalone() && !wasRecentlyDismissed()) {
        setPlatform(detectPlatform());
        setVisible(true);
      }
    }, DELAY_MS);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleInstalled);
      window.clearTimeout(timer);
    };
  }, []);

  const dismiss = () => {
    markDismissed();
    setVisible(false);
  };

  const handleInstall = async () => {
    if (deferredEvent) {
      try {
        await deferredEvent.prompt();
        const choice = await deferredEvent.userChoice;
        if (choice.outcome === "accepted") {
          setVisible(false);
        } else {
          markDismissed();
          setVisible(false);
        }
      } catch {
        setExpanded(true);
      }
      setDeferredEvent(null);
      return;
    }

    // No native prompt — show instructions
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

  const primaryLabel =
    platform === "ios-safari"
      ? "Show me how"
      : platform === "desktop-bookmark"
        ? "How to bookmark"
        : "Install";

  return (
    <AnimatePresence>
      <motion.div
        key="install-popup"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-sm"
        onClick={dismiss}
        role="dialog"
        aria-modal="true"
        aria-labelledby="install-popup-title"
      >
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: "spring", stiffness: 280, damping: 26 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-md bg-bourbon-deep border border-bourbon-gold/30 shadow-2xl shadow-black/60 overflow-hidden"
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
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-bourbon-gold/15 bg-bourbon-dark/60 px-6 sm:px-8 py-5"
            >
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
            </motion.div>
          )}

          <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 font-[family-name:var(--font-playfair)] text-[6rem] font-bold text-bourbon-cream/[0.03] uppercase leading-none pointer-events-none whitespace-nowrap">
            BOURBON
          </span>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
