"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import {
  DEFAULT_POPUP_SETTINGS,
  normalizePopupSettings,
  type PopupSettings,
} from "@/lib/popup-constants";

// Timing lives in the DB and is edited at /admin/settings — these are only the
// fallbacks used before the fetch lands or if it fails. Never interrupt the
// suppressed routes: the age gate owns the first moment, and interrupting a
// checkout to ask for an email costs an order.
const SUPPRESSED_PREFIXES = ["/checkout"];

const CAPTURED_KEY = "bourbon-email-captured";
const DISMISSED_KEY = "bourbon-email-dismissed-at";
const AGE_VERIFIED_KEY = "bourbon-age-verified";

type Status = "idle" | "submitting" | "success" | "error";

function shouldAsk(settings: PopupSettings): boolean {
  try {
    // Subscribing is the only thing that stops the prompt for good.
    if (localStorage.getItem(CAPTURED_KEY)) return false;
    if (settings.nagUntilSubscribed) return true;

    const dismissedAt = localStorage.getItem(DISMISSED_KEY);
    if (!dismissedAt) return true;
    if (settings.repromptAfterDays <= 0) return true;
    const elapsed = Date.now() - Number(dismissedAt);
    return elapsed > settings.repromptAfterDays * 24 * 60 * 60 * 1000;
  } catch {
    // Private mode / storage disabled — ask rather than never.
    return true;
  }
}

export default function EmailCapturePopup() {
  const pathname = usePathname();
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  // Bumped on every dismissal. Re-running the scheduling effect is what
  // arms the next countdown, so the prompt returns DELAY_MS after each close.
  const [attempt, setAttempt] = useState(0);
  // Null until the admin's config arrives — we don't want to start a countdown
  // on the fallback timing and then have the real value contradict it.
  const [settings, setSettings] = useState<PopupSettings | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  const suppressed = SUPPRESSED_PREFIXES.some((p) => pathname?.startsWith(p));

  // Pull the admin-configured timing once per mount.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/popup-settings")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!cancelled) {
          setSettings(data ? normalizePopupSettings(data) : DEFAULT_POPUP_SETTINGS);
        }
      })
      .catch(() => {
        if (!cancelled) setSettings(DEFAULT_POPUP_SETTINGS);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!settings || !settings.enabled) return;
    if (suppressed || !shouldAsk(settings)) return;

    let timer: ReturnType<typeof setTimeout> | undefined;

    // The age gate blocks the whole page and is itself a modal; stacking a
    // second one on top of it would be unusable. Wait for it to clear, then
    // start the countdown from that moment.
    const startWhenVerified = () => {
      if (localStorage.getItem(AGE_VERIFIED_KEY)) {
        timer = setTimeout(() => setShow(true), settings.delaySeconds * 1000);
        return true;
      }
      return false;
    };

    if (startWhenVerified()) {
      return () => clearTimeout(timer);
    }

    const poll = setInterval(() => {
      if (startWhenVerified()) clearInterval(poll);
    }, 1000);

    return () => {
      clearInterval(poll);
      clearTimeout(timer);
    };
    // `attempt` is the re-arm trigger: each dismissal re-runs this effect and
    // starts a fresh countdown.
  }, [suppressed, attempt, settings]);

  const dismiss = useCallback(() => {
    if (settings && !settings.nagUntilSubscribed) {
      try {
        localStorage.setItem(DISMISSED_KEY, String(Date.now()));
      } catch {
        // Nothing to do — worst case we ask again next visit.
      }
    }
    setShow(false);
    // Clear any stale validation error so the next prompt opens fresh rather
    // than reappearing with a red message from the previous attempt.
    setStatus("idle");
    setMessage("");
    // Re-arm. shouldAsk() still gates this, so a visitor who has already
    // subscribed never comes back around.
    setAttempt((n) => n + 1);
  }, [settings]);

  // Escape to close, and focus the field on open so it's usable by keyboard.
  useEffect(() => {
    if (!show) return;
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [show, dismiss]);

  // Freeze the page behind the popup. The backdrop already swallows wheel and
  // touch, but not space/arrow-key scrolling — this covers both. Restore the
  // previous value rather than hardcoding "" so we can't stomp the age gate's
  // own lock if the two ever overlap.
  useEffect(() => {
    if (!show) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [show]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "submitting") return;

    setStatus("submitting");
    setMessage("");

    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "popup" }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };

      if (!res.ok) {
        setStatus("error");
        setMessage(data.error ?? "Could not subscribe. Please try again.");
        return;
      }

      setStatus("success");
      setMessage("You're on the list. Welcome to the Inner Circle.");
      try {
        localStorage.setItem(CAPTURED_KEY, "1");
      } catch {
        // Non-fatal: the address is already saved server-side.
      }
      setTimeout(() => setShow(false), 2200);
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  }

  if (!show) return null;

  return (
    // Full-screen backdrop: it dims the page and, being interactive, swallows
    // wheel and touch so nothing behind it scrolls. The body scroll lock above
    // covers the rest (keyboard scrolling, and iOS Safari's touch handling).
    <div
      className="animate-fade-in fixed inset-0 z-[90] flex items-center justify-center p-4 bg-bourbon-deep/85 backdrop-blur-sm"
      onMouseDown={(e) => {
        // Backdrop click closes; clicks inside the card must not.
        if (!dialogRef.current?.contains(e.target as Node)) dismiss();
      }}
    >
      {/* Light card rather than the old dark one. Against a dimmed page a white
          panel reads as a distinct object rather than more of the same
          background, which is most of why the offer lands. Corners stay square
          — the rest of the site has no rounded surfaces. */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="email-capture-title"
        className="animate-pop-in relative w-full max-w-3xl bg-white shadow-2xl shadow-black/40 overflow-hidden grid grid-cols-1 md:grid-cols-2"
      >
        <button
          type="button"
          onClick={dismiss}
          aria-label="Close"
          /* White at every width. It always sits over the photo — which is the
             right-hand column on md+, and the top of the card below that — so
             the old dark-on-mobile variant put a near-black glyph on a dark
             image. The drop-shadow keeps it readable if the photo is ever
             swapped for a lighter one. */
          className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center text-white/80 hover:text-white transition-colors cursor-pointer text-2xl leading-none [text-shadow:0_1px_3px_rgba(0,0,0,0.6)]"
        >
          ×
        </button>

        {/* ---- Copy + form ---- */}
        <div className="p-7 sm:p-9 flex flex-col justify-center text-center md:text-left order-2 md:order-1">
          <span className="text-bourbon-gold text-[10px] tracking-[0.3em] uppercase font-semibold">
            The Inner Circle
          </span>

          <h2
            id="email-capture-title"
            className="font-[family-name:var(--font-playfair)] text-[1.75rem] sm:text-4xl font-bold text-bourbon-deep leading-[1.1] mt-2.5"
          >
            Claim <span className="text-bourbon-gold">10% off</span> your first
            bottle
          </h2>

          <p className="text-bourbon-stone text-sm sm:text-[15px] leading-relaxed mt-3">
            Allocated releases, barrel picks and distillery events reach the
            list first — usually before anything is listed publicly.
          </p>

          {status === "success" ? (
            <p className="text-bourbon-deep text-sm bg-bourbon-gold/15 border border-bourbon-gold/40 px-4 py-4 mt-6">
              {message}
            </p>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3 mt-6">
              <input
                ref={inputRef}
                type="email"
                name="email"
                /* Lets the browser offer a saved address in one tap, which is
                   most of the "continue with your email" convenience without
                   any third-party script. The browser still requires the user
                   to pick it — no API exposes a saved address silently. */
                autoComplete="email"
                inputMode="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={status === "submitting"}
                placeholder="Enter your email address"
                aria-label="Email address"
                className="w-full px-4 py-3.5 bg-white border border-bourbon-deep/20 text-bourbon-deep placeholder:text-bourbon-stone/50 focus:outline-none focus:border-bourbon-gold focus:ring-1 focus:ring-bourbon-gold transition-colors text-sm disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={status === "submitting"}
                className="w-full px-6 py-3.5 bg-bourbon-gold text-bourbon-deep font-semibold tracking-wider uppercase text-sm hover:bg-bourbon-amber transition-colors duration-300 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {status === "submitting" ? "Subscribing..." : "Claim 10% off →"}
              </button>
              {status === "error" && (
                <p className="text-red-600 text-sm" role="alert">
                  {message}
                </p>
              )}
              <button
                type="button"
                onClick={dismiss}
                className="text-bourbon-stone hover:text-bourbon-deep text-xs font-semibold mt-1 transition-colors cursor-pointer"
              >
                No thanks, I&apos;ll pay full price.
              </button>
            </form>
          )}

          <p className="text-bourbon-stone/60 text-[10px] leading-relaxed mt-5">
            By subscribing you confirm you are 21+ and agree to our privacy
            policy.
          </p>
        </div>

        {/* ---- Image ---- */}
        {/* Fixed aspect on small screens so the card cannot grow taller than the
            viewport; a filled column on md+. */}
        <div className="relative order-1 md:order-2 h-40 sm:h-52 md:h-auto md:min-h-[27rem]">
          <Image
            src="/blog-btac.webp"
            alt="A bottle of Kentucky bourbon poured over ice at the Bourbon & Oak bar"
            fill
            sizes="(max-width: 768px) 100vw, 384px"
            className="object-cover"
          />
          {/* Keeps the close control legible over a light patch of the photo. */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-transparent md:from-black/25" />
        </div>
      </div>
    </div>
  );
}
