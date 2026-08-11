"use client";

import { FormEvent, useState } from "react";
import {
  MAX_DELAY_SECONDS,
  MAX_REPROMPT_DAYS,
  MIN_DELAY_SECONDS,
  type PopupSettings,
} from "@/lib/popup-constants";

type Status = "idle" | "saving" | "saved" | "error";

export default function PopupSettingsForm({
  initial,
}: {
  initial: PopupSettings;
}) {
  const [enabled, setEnabled] = useState(initial.enabled);
  const [delaySeconds, setDelaySeconds] = useState(String(initial.delaySeconds));
  const [nag, setNag] = useState(initial.nagUntilSubscribed);
  const [repromptDays, setRepromptDays] = useState(
    String(initial.repromptAfterDays),
  );
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "saving") return;

    setStatus("saving");
    setMessage("");

    try {
      const res = await fetch("/api/admin/popup-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enabled,
          delaySeconds: Number(delaySeconds),
          nagUntilSubscribed: nag,
          repromptAfterDays: Number(repromptDays),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
      } & Partial<PopupSettings>;

      if (!res.ok) {
        setStatus("error");
        setMessage(data.error ?? "Could not save. Please try again.");
        return;
      }

      // Echo back what the server actually stored, so a clamped value is
      // visible rather than silently diverging from what's on screen.
      if (typeof data.delaySeconds === "number") {
        setDelaySeconds(String(data.delaySeconds));
      }
      setStatus("saved");
      setMessage("Saved. Live on the storefront immediately.");
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border border-bourbon-deep/10 p-5 sm:p-6 max-w-2xl"
    >
      <div className="flex items-baseline justify-between mb-5 pb-4 border-b border-bourbon-deep/10">
        <h2 className="font-[family-name:var(--font-playfair)] text-xl font-bold text-bourbon-deep">
          Email capture popup
        </h2>
        <span className="text-bourbon-stone text-[10px] tracking-widest uppercase">
          Storefront
        </span>
      </div>

      <label className="flex items-start gap-3 mb-6 cursor-pointer">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
          className="mt-1 w-4 h-4 accent-bourbon-gold cursor-pointer"
        />
        <span>
          <span className="block text-bourbon-deep text-sm font-semibold">
            Show the popup
          </span>
          <span className="block text-bourbon-stone text-xs mt-0.5">
            Turn off to stop it appearing anywhere on the storefront.
          </span>
        </span>
      </label>

      <div className="mb-6">
        <label
          htmlFor="delaySeconds"
          className="block text-bourbon-deep text-sm font-semibold mb-1"
        >
          Delay (seconds)
        </label>
        <p className="text-bourbon-stone text-xs mb-2">
          How long before it first appears, and the gap before it returns after
          a visitor dismisses it. Between {MIN_DELAY_SECONDS} and{" "}
          {MAX_DELAY_SECONDS}.
        </p>
        <input
          id="delaySeconds"
          type="number"
          min={MIN_DELAY_SECONDS}
          max={MAX_DELAY_SECONDS}
          required
          value={delaySeconds}
          onChange={(e) => setDelaySeconds(e.target.value)}
          className="w-40 px-3 py-2 border border-bourbon-deep/20 text-bourbon-deep text-sm focus:outline-none focus:border-bourbon-gold transition-colors"
        />
      </div>

      <label className="flex items-start gap-3 mb-6 cursor-pointer">
        <input
          type="checkbox"
          checked={nag}
          onChange={(e) => setNag(e.target.checked)}
          className="mt-1 w-4 h-4 accent-bourbon-gold cursor-pointer"
        />
        <span>
          <span className="block text-bourbon-deep text-sm font-semibold">
            Keep asking until they subscribe
          </span>
          <span className="block text-bourbon-stone text-xs mt-0.5">
            On: dismissing only buys the visitor one delay period of quiet.
            Off: they get asked once, then left alone for the number of days
            below.
          </span>
        </span>
      </label>

      {!nag && (
        <div className="mb-6">
          <label
            htmlFor="repromptDays"
            className="block text-bourbon-deep text-sm font-semibold mb-1"
          >
            Ask again after (days)
          </label>
          <p className="text-bourbon-stone text-xs mb-2">
            0 means ask again on the next page load. Max {MAX_REPROMPT_DAYS}.
          </p>
          <input
            id="repromptDays"
            type="number"
            min={0}
            max={MAX_REPROMPT_DAYS}
            required
            value={repromptDays}
            onChange={(e) => setRepromptDays(e.target.value)}
            className="w-40 px-3 py-2 border border-bourbon-deep/20 text-bourbon-deep text-sm focus:outline-none focus:border-bourbon-gold transition-colors"
          />
        </div>
      )}

      <div className="flex items-center gap-4 pt-4 border-t border-bourbon-deep/10">
        <button
          type="submit"
          disabled={status === "saving"}
          className="px-6 py-2.5 bg-bourbon-deep text-bourbon-cream font-semibold tracking-wider uppercase text-xs hover:bg-bourbon-gold hover:text-bourbon-deep transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
        >
          {status === "saving" ? "Saving..." : "Save settings"}
        </button>
        {message && (
          <p
            className={`text-sm ${
              status === "error" ? "text-red-600" : "text-emerald-700"
            }`}
          >
            {message}
          </p>
        )}
      </div>
    </form>
  );
}
