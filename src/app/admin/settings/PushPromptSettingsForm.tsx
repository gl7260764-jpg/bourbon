"use client";

import { FormEvent, useState } from "react";
import {
  MAX_PUSH_DELAY_SECONDS,
  MAX_PUSH_REPROMPT_DAYS,
  MIN_PUSH_DELAY_SECONDS,
  type PushPromptSettings,
} from "@/lib/push-prompt-constants";

type Status = "idle" | "saving" | "saved" | "error";

/** Deliberately mirrors PopupSettingsForm — same store, same save/echo flow. */
export default function PushPromptSettingsForm({
  initial,
}: {
  initial: PushPromptSettings;
}) {
  const [enabled, setEnabled] = useState(initial.enabled);
  const [delaySeconds, setDelaySeconds] = useState(String(initial.delaySeconds));
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
      const res = await fetch("/api/admin/push-prompt-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          enabled,
          delaySeconds: Number(delaySeconds),
          repromptAfterDays: Number(repromptDays),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
      } & Partial<PushPromptSettings>;

      if (!res.ok) {
        setStatus("error");
        setMessage(data.error ?? "Could not save. Please try again.");
        return;
      }

      // Echo back what the server stored, so a clamped value is visible
      // rather than silently diverging from what's on screen.
      if (typeof data.delaySeconds === "number") {
        setDelaySeconds(String(data.delaySeconds));
      }
      if (typeof data.repromptAfterDays === "number") {
        setRepromptDays(String(data.repromptAfterDays));
      }
      setStatus("saved");
      setMessage("Saved. Live on the dashboard immediately.");
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border border-bourbon-deep/10 p-5 sm:p-6 max-w-2xl mt-8"
    >
      <div className="flex items-baseline justify-between mb-5 pb-4 border-b border-bourbon-deep/10">
        <h2 className="font-[family-name:var(--font-playfair)] text-xl font-bold text-bourbon-deep">
          Notification prompt
        </h2>
        <span className="text-bourbon-stone text-[10px] tracking-widest uppercase">
          Customer dashboard
        </span>
      </div>

      <p className="text-bourbon-stone text-xs mb-6 -mt-1">
        Asks a signed-in buyer to turn on alerts, so their phone tells them
        when you send payment details and when you reply in the order chat. It
        only appears when they have an order still waiting on details, and
        never if they have already allowed or blocked notifications in their
        browser.
      </p>

      <label className="flex items-start gap-3 mb-6 cursor-pointer">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => setEnabled(e.target.checked)}
          className="mt-1 w-4 h-4 accent-bourbon-gold cursor-pointer"
        />
        <span>
          <span className="block text-bourbon-deep text-sm font-semibold">
            Show the prompt
          </span>
          <span className="block text-bourbon-stone text-xs mt-0.5">
            Turn off to stop it appearing. Buyers can still switch alerts on
            themselves from the control on their dashboard.
          </span>
        </span>
      </label>

      <div className="mb-6">
        <label
          htmlFor="pushDelaySeconds"
          className="block text-bourbon-deep text-sm font-semibold mb-1"
        >
          Delay (seconds)
        </label>
        <p className="text-bourbon-stone text-xs mb-2">
          How long after the dashboard loads before it appears. 0 shows it
          straight away. Max {MAX_PUSH_DELAY_SECONDS}.
        </p>
        <input
          id="pushDelaySeconds"
          type="number"
          min={MIN_PUSH_DELAY_SECONDS}
          max={MAX_PUSH_DELAY_SECONDS}
          required
          value={delaySeconds}
          onChange={(e) => setDelaySeconds(e.target.value)}
          className="w-40 px-3 py-2 border border-bourbon-deep/20 text-bourbon-deep text-sm focus:outline-none focus:border-bourbon-gold transition-colors"
        />
      </div>

      <div className="mb-6">
        <label
          htmlFor="pushRepromptDays"
          className="block text-bourbon-deep text-sm font-semibold mb-1"
        >
          Ask again after (days)
        </label>
        <p className="text-bourbon-stone text-xs mb-2">
          How long a dismissal lasts. 0 means ask again on their next visit.
          Max {MAX_PUSH_REPROMPT_DAYS}.
        </p>
        <input
          id="pushRepromptDays"
          type="number"
          min={0}
          max={MAX_PUSH_REPROMPT_DAYS}
          required
          value={repromptDays}
          onChange={(e) => setRepromptDays(e.target.value)}
          className="w-40 px-3 py-2 border border-bourbon-deep/20 text-bourbon-deep text-sm focus:outline-none focus:border-bourbon-gold transition-colors"
        />
      </div>

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
