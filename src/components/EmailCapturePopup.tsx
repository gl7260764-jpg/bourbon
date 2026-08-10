"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

// --- Tuning knobs -----------------------------------------------------------
// How long the visitor browses before we ask. Bump this if 10s feels pushy.
const DELAY_MS = 10_000;
// After a dismissal we back off rather than re-asking on the next page — a
// modal that returns every 10 seconds reads as broken and costs more traffic
// than the addresses it wins. Set to 0 to ask again on every page load.
const REPROMPT_AFTER_DAYS = 7;
// Never interrupt these — the age gate owns the first one, and interrupting a
// checkout to ask for an email costs an order.
const SUPPRESSED_PREFIXES = ["/checkout"];
// ----------------------------------------------------------------------------

const CAPTURED_KEY = "bourbon-email-captured";
const DISMISSED_KEY = "bourbon-email-dismissed-at";
const AGE_VERIFIED_KEY = "bourbon-age-verified";

type Status = "idle" | "submitting" | "success" | "error";

function shouldAsk(): boolean {
  try {
    if (localStorage.getItem(CAPTURED_KEY)) return false;
    const dismissedAt = localStorage.getItem(DISMISSED_KEY);
    if (!dismissedAt) return true;
    if (REPROMPT_AFTER_DAYS <= 0) return true;
    const elapsed = Date.now() - Number(dismissedAt);
    return elapsed > REPROMPT_AFTER_DAYS * 24 * 60 * 60 * 1000;
  } catch {
    // Private mode / storage disabled — ask once rather than never.
    return true;
  }
}

export default function EmailCapturePopup() {
  const pathname = usePathname();
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  const suppressed = SUPPRESSED_PREFIXES.some((p) => pathname?.startsWith(p));

  useEffect(() => {
    if (suppressed || !shouldAsk()) return;

    let timer: ReturnType<typeof setTimeout> | undefined;

    // The age gate blocks the whole page and is itself a modal; stacking a
    // second one on top of it would be unusable. Wait for it to clear, then
    // start the countdown from that moment.
    const startWhenVerified = () => {
      if (localStorage.getItem(AGE_VERIFIED_KEY)) {
        timer = setTimeout(() => setShow(true), DELAY_MS);
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
  }, [suppressed]);

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    } catch {
      // Nothing to do — worst case we ask again next visit.
    }
    setShow(false);
  }, []);

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
    <div
      className="animate-fade-in fixed inset-0 z-[90] flex items-center justify-center bg-bourbon-deep/90 backdrop-blur-sm px-4"
      onMouseDown={(e) => {
        // Backdrop click closes; clicks inside the card must not.
        if (!dialogRef.current?.contains(e.target as Node)) dismiss();
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="email-capture-title"
        className="animate-pop-in relative max-w-md w-full p-8 sm:p-10 bg-bourbon-dark border border-bourbon-gold/30 text-center"
      >
        {/* Decorative corners — matches the age gate's framing. */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-bourbon-gold" />
        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-bourbon-gold" />
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-bourbon-gold" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-bourbon-gold" />

        <button
          type="button"
          onClick={dismiss}
          aria-label="Close"
          className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center text-bourbon-cream/40 hover:text-bourbon-cream transition-colors cursor-pointer text-xl leading-none"
        >
          ×
        </button>

        <span className="text-bourbon-gold text-[10px] tracking-[0.3em] uppercase">
          Inner Circle
        </span>
        <h2
          id="email-capture-title"
          className="font-[family-name:var(--font-playfair)] text-2xl sm:text-3xl font-bold text-bourbon-cream mt-3 mb-3"
        >
          10% off your first bottle
        </h2>
        <div className="w-16 h-0.5 bg-bourbon-gold mx-auto mb-5" />
        <p className="text-bourbon-cream/60 text-sm mb-7">
          Join the list for allocated releases, barrel picks and distillery
          events before they go public.
        </p>

        {status === "success" ? (
          <p className="text-bourbon-gold text-sm tracking-wide py-4">
            {message}
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              ref={inputRef}
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={status === "submitting"}
              placeholder="Enter your email"
              aria-label="Email address"
              className="w-full px-4 py-3 bg-bourbon-cream/5 border border-bourbon-cream/20 text-bourbon-cream placeholder:text-bourbon-cream/30 focus:outline-none focus:border-bourbon-gold transition-colors text-sm tracking-wide disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={status === "submitting"}
              className="w-full px-6 py-3 bg-bourbon-gold text-bourbon-deep font-semibold tracking-wider uppercase text-sm hover:bg-bourbon-amber transition-colors duration-300 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {status === "submitting" ? "Subscribing..." : "Claim 10% off"}
            </button>
            {status === "error" && (
              <p className="text-red-400 text-sm tracking-wide">{message}</p>
            )}
            <button
              type="button"
              onClick={dismiss}
              className="text-bourbon-cream/40 hover:text-bourbon-cream/70 text-xs tracking-wider uppercase mt-1 transition-colors cursor-pointer"
            >
              No thanks
            </button>
          </form>
        )}

        <p className="text-bourbon-cream/30 text-[10px] mt-6">
          By subscribing, you confirm you are 21+ and agree to our privacy
          policy.
        </p>
      </div>
    </div>
  );
}
