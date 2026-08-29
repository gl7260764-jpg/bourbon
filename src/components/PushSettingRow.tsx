"use client";

import { usePushEnable } from "@/lib/use-push-enable";

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

  // Nothing useful to offer on a browser with no Push support.
  if (state === "unsupported") return null;

  return (
    <div className="bg-white border border-bourbon-deep/10 p-5 mb-10 flex flex-wrap items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-bourbon-deep font-semibold text-sm">
          Payment detail alerts
        </p>
        <p className="text-bourbon-stone text-[13px] mt-0.5">
          {state === "granted"
            ? "On for this device — we'll notify you the moment details are ready."
            : state === "denied"
              ? "Blocked in your browser settings. You'll still get an email."
              : "Get notified on this device the moment your payment details are ready."}
        </p>
      </div>

      {state === "granted" ? (
        <span className="shrink-0 text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 bg-emerald-100 text-emerald-800">
          ✓ On
        </span>
      ) : state === "denied" ? (
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
