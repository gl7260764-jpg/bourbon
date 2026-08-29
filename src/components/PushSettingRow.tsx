"use client";

import { useEffect, useState } from "react";
import { usePushEnable } from "@/lib/use-push-enable";
import { OPEN_INSTALL_EVENT, alreadyInstalled, detectPlatform, isStandalone } from "@/lib/pwa";

/**
 * Always-available notification control on the dashboard.
 *
 * The modal is the attention-getter, but it can be dismissed and then stays
 * away for a fortnight. Without this row a buyer who dismissed it once would
 * have no way to turn alerts on at all, which is the opposite of "the user
 * should be able to enable notifications from the dashboard".
 */
export default function PushSettingRow() {
  const { state, enable } = usePushEnable();
  /* iOS Safari has no Push API until the site is on the Home Screen, so
     "unsupported" there is a solvable state, not a dead end. Detected after
     mount because it reads navigator/localStorage. */
  const [iosNeedsInstall, setIosNeedsInstall] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setIosNeedsInstall(
        detectPlatform() === "ios-safari" &&
          !isStandalone() &&
          !alreadyInstalled(),
      );
    }, 0);
    return () => window.clearTimeout(t);
  }, []);

  if (state === "unsupported" && iosNeedsInstall) {
    return (
      <div className="bg-white border border-bourbon-deep/10 p-5 mb-10 flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-bourbon-deep font-semibold text-sm">
            Order notifications
          </p>
          <p className="text-bourbon-stone text-[13px] mt-0.5">
            iPhone sends alerts only to apps on your Home Screen. Add ours and
            you can switch them on from there.
          </p>
        </div>
        <button
          type="button"
          onClick={() => window.dispatchEvent(new Event(OPEN_INSTALL_EVENT))}
          className="shrink-0 px-5 py-2.5 bg-bourbon-deep text-bourbon-cream text-xs font-semibold tracking-wider uppercase hover:bg-bourbon-dark transition-colors cursor-pointer"
        >
          How to add
        </button>
      </div>
    );
  }

  // Nothing useful to offer on a browser with no Push support.
  if (state === "unsupported") return null;
  /* Once alerts are on there is nothing left to do here, so the row goes
     rather than sitting on the dashboard as a permanent "✓ On" badge. */
  if (state === "granted") return null;

  return (
    <div className="bg-white border border-bourbon-deep/10 p-5 mb-10 flex flex-wrap items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-bourbon-deep font-semibold text-sm">
          Order notifications
        </p>
        <p className="text-bourbon-stone text-[13px] mt-0.5">
          {state === "denied"
            ? "Blocked in your browser settings. You'll still get an email."
            : "Get alerts on this device when your payment details are ready and when we reply to your messages."}
        </p>
      </div>

      {state === "denied" ? (
        <span className="shrink-0 text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 bg-bourbon-deep/5 text-bourbon-stone">
          Blocked
        </span>
      ) : (
        <button
          type="button"
          onClick={enable}
          disabled={state === "working"}
          className="shrink-0 px-5 py-2.5 bg-bourbon-deep text-bourbon-cream text-xs font-semibold tracking-wider uppercase hover:bg-bourbon-dark transition-colors cursor-pointer disabled:opacity-60"
        >
          {state === "working" ? "Enabling…" : "Enable"}
        </button>
      )}

      {state === "error" && (
        <p className="w-full text-red-600 text-[12px]">
          Couldn&apos;t turn notifications on. You&apos;ll still get an email.
        </p>
      )}
    </div>
  );
}
