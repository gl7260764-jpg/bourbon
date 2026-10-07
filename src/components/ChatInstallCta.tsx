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
} from "@/lib/pwa";

/**
 * "Install the app" inside the chat thread.
 *
 * Deliberately a live element rather than a message. The welcome message is
 * stored text, frozen at the moment it was sent — if the install ask lived
 * there, a customer who installed the app would still be reading "install the
 * app" in their history a year later, and nothing could take it back. Rendered
 * here, it is simply gone the moment it stops being true.
 *
 * It appears at the point of highest intent: the buyer has just ordered and is
 * waiting for a person to reply, which is exactly the reply they would miss
 * with the site closed.
 */
export default function ChatInstallCta() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isStandalone() || alreadyInstalled()) return;

    /* Deferred a tick so the first evaluation is not a synchronous setState in
       the effect body, and because the beforeinstallprompt event may still be
       in flight when this mounts. */
    const evaluate = () => setShow(canOfferInstall(detectPlatform()));
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

  return (
    <div className="flex justify-start">
      {/* Shaped like an operator bubble so it reads as part of the
          conversation rather than an advert dropped into it. */}
      <div className="max-w-[80%] rounded-lg rounded-bl-none border border-bourbon-gold/40 bg-white px-3.5 py-3 shadow-[0_1px_1px_rgba(12,10,9,0.12)]">
        <div className="flex items-start gap-2.5">
          <span
            className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center border border-bourbon-gold/50 text-bourbon-gold"
            aria-hidden="true"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3v11m0 0-3.5-3.5M12 14l3.5-3.5M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
            </svg>
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold leading-snug text-bourbon-deep">
              Don&apos;t miss our reply
            </p>
            <p className="mt-0.5 text-xs leading-relaxed text-bourbon-stone">
              Install the app and we can reach you even with the site closed.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => window.dispatchEvent(new Event(OPEN_INSTALL_EVENT))}
          className="mt-2.5 w-full bg-bourbon-gold px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-bourbon-deep transition-colors hover:bg-bourbon-amber cursor-pointer"
        >
          Install the app
        </button>
      </div>
    </div>
  );
}
