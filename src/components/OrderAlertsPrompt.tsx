"use client";

import { OPEN_INSTALL_EVENT } from "@/lib/pwa";
import { usePushEnable } from "@/lib/use-push-enable";

/* Offered on the confirmation page, where the buyer has just been told their
   payment details are coming. Note they are usually NOT signed in here, so the
   subscription is stored without a customerId and cannot be pushed to until
   they subscribe again while signed in — which is what the dashboard dialog is
   for. Both actions are optional: details still appear on the dashboard and an
   email still goes out.

   The opt-in itself lives in usePushEnable so this and the dashboard dialog
   cannot drift apart. */

export default function OrderAlertsPrompt() {
  const { state, enable } = usePushEnable();

  if (state === "unsupported") return null;

  return (
    <div className="mt-4 pt-4 border-t border-bourbon-gold/25">
      {state === "granted" ? (
        <p className="text-bourbon-deep text-[13px] flex items-center gap-2">
          <span className="text-bourbon-gold" aria-hidden="true">✓</span>
          Notifications on — we&apos;ll ping you when the details land.
        </p>
      ) : (
        <>
          {/* One line, two buttons. The longer explanation this used to carry
              repeated what the block above already says. */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={enable}
              disabled={state === "working" || state === "denied"}
              className="px-4 py-2.5 bg-bourbon-deep text-bourbon-cream text-xs font-semibold tracking-wider uppercase hover:bg-bourbon-dark transition-colors cursor-pointer disabled:opacity-60"
            >
              {state === "working" ? "Enabling…" : "Notify me"}
            </button>
            <button
              type="button"
              onClick={() => window.dispatchEvent(new Event(OPEN_INSTALL_EVENT))}
              className="px-4 py-2.5 border border-bourbon-deep/20 text-bourbon-deep text-xs font-semibold tracking-wider uppercase hover:border-bourbon-gold hover:text-bourbon-gold transition-colors cursor-pointer"
            >
              Install app
            </button>
          </div>
          {state === "denied" && (
            <p className="text-bourbon-stone text-[11px] mt-2">
              Notifications are blocked in your browser settings.
            </p>
          )}
          {state === "error" && (
            <p className="text-red-600 text-[11px] mt-2">
              Couldn&apos;t turn notifications on.
            </p>
          )}
        </>
      )}
    </div>
  );
}
