"use client";

import { useEffect, useState } from "react";
import {
  INSTALLED_EVENT,
  OPEN_INSTALL_EVENT,
  READY_EVENT,
  alreadyInstalled,
  canOfferInstall,
  detectPlatform,
  isStandalone,
  markDismissed,
  markInstalled,
} from "@/lib/pwa";

/* Persistent install entry point in the navbar. The timed popup is a single
   dismissible shot on a two-day cooldown, which left no way to install in
   between; this is always available while an install is actually possible.
   Renders nothing otherwise, so it never advertises something it cannot do. */
export default function InstallButton() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isStandalone() || alreadyInstalled()) return;

    const evaluate = () => setShow(canOfferInstall(detectPlatform()));
    /* Deferred a tick so the first evaluation is not a synchronous setState in
       the effect body; the event may also still be in flight at mount. */
    const timer = window.setTimeout(evaluate, 0);
    const hide = () => setShow(false);

    window.addEventListener(READY_EVENT, evaluate);
    window.addEventListener(INSTALLED_EVENT, hide);
    window.addEventListener("appinstalled", hide);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener(READY_EVENT, evaluate);
      window.removeEventListener(INSTALLED_EVENT, hide);
      window.removeEventListener("appinstalled", hide);
    };
  }, []);

  if (!show) return null;

  const handleClick = async () => {
    const evt = window.__bipDeferred;
    if (evt) {
      try {
        await evt.prompt();
        const choice = await evt.userChoice;
        if (choice.outcome === "accepted") {
          markInstalled();
          setShow(false);
        } else {
          /* A prompt event is single-use. Keep the button, but from here it
             opens the popup, which explains how to install manually. */
          markDismissed();
        }
      } catch {
        window.dispatchEvent(new Event(OPEN_INSTALL_EVENT));
      }
      window.__bipDeferred = null;
      return;
    }

    window.dispatchEvent(new Event(OPEN_INSTALL_EVENT));
  };

  return (
    <button
      onClick={handleClick}
      aria-label="Install app"
      title="Install app"
      /* `group` drives the pulse-pausing rules in globals.css, which stop the
         animation on hover and focus so the hover colour can take over. */
      className="group relative text-bourbon-cream/70 hover:text-bourbon-gold focus-visible:text-bourbon-gold transition-colors cursor-pointer"
    >
      <svg
        className="w-5 h-5 animate-attention-icon"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M12 3v11m0 0l-3.5-3.5M12 14l3.5-3.5M4 16v3a2 2 0 002 2h12a2 2 0 002-2v-3"
        />
      </svg>

      {/* Attention dot, sized and placed to match the cart's count badge.
          Decorative — the button is already labelled "Install app". */}
      <span aria-hidden="true" className="pointer-events-none absolute -top-1 -right-1 flex h-2.5 w-2.5">
        <span className="animate-attention-ring absolute inline-flex h-full w-full rounded-full bg-bourbon-gold" />
        <span className="animate-attention-dot relative inline-flex h-2.5 w-2.5 rounded-full bg-bourbon-gold ring-2 ring-bourbon-deep/70" />
      </span>
    </button>
  );
}
