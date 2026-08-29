"use client";

import { FormEvent, useState } from "react";
import {
  AUTH_MODES,
  AUTH_MODE_DETAIL,
  AUTH_MODE_LABEL,
  type AuthMode,
} from "@/lib/auth-mode-constants";

type Status = "idle" | "saving" | "saved" | "error";

export default function AuthModeForm({ initial }: { initial: AuthMode }) {
  const [mode, setMode] = useState<AuthMode>(initial);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "saving") return;
    setStatus("saving");
    setMessage("");
    try {
      const res = await fetch("/api/admin/auth-mode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        mode?: AuthMode;
      };
      if (!res.ok) {
        setStatus("error");
        setMessage(data.error ?? "Could not save. Please try again.");
        return;
      }
      if (data.mode) setMode(data.mode);
      setStatus("saved");
      setMessage("Saved. Applies to the next sign-in.");
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
          Customer sign-in
        </h2>
        <span className="text-bourbon-stone text-[10px] tracking-widest uppercase">
          Storefront
        </span>
      </div>

      <p className="text-bourbon-stone text-xs mb-5 -mt-1">
        How a customer proves who they are. The button in your order emails
        signs them straight into the dashboard in every mode — this only
        changes what happens when someone signs in from the site itself.
      </p>

      <div className="space-y-3 mb-6">
        {AUTH_MODES.map((m) => {
          const selected = mode === m;
          const risky = m === "EMAIL_ONLY";
          return (
            <label
              key={m}
              className={`flex gap-3 p-4 border cursor-pointer transition-colors ${
                selected
                  ? risky
                    ? "border-red-400 bg-red-50"
                    : "border-bourbon-gold bg-bourbon-gold/5"
                  : "border-bourbon-deep/15 hover:border-bourbon-deep/30"
              }`}
            >
              <input
                type="radio"
                name="mode"
                value={m}
                checked={selected}
                onChange={() => setMode(m)}
                className="mt-1 w-4 h-4 accent-bourbon-gold cursor-pointer shrink-0"
              />
              <span className="min-w-0">
                <span className="block text-bourbon-deep text-sm font-semibold">
                  {AUTH_MODE_LABEL[m]}
                </span>
                <span className="block text-bourbon-stone text-xs mt-0.5">
                  {AUTH_MODE_DETAIL[m]}
                </span>
              </span>
            </label>
          );
        })}
      </div>

      {/* Shown on selection, not buried in the option text: this is the one
          choice here that can lose a customer their account. */}
      {mode === "EMAIL_ONLY" && (
        <div className="mb-6 border border-red-300 bg-red-50 p-4">
          <p className="text-red-800 text-sm font-semibold mb-1">
            This turns off verification entirely
          </p>
          <p className="text-red-700 text-xs leading-relaxed">
            Anyone who knows a customer&apos;s email address — a guessed
            address, a leaked list, someone reading over a shoulder — can sign
            in as them and see the payment details you issued, the bank
            screenshots they uploaded, their delivery address and their order
            chat. Sign-in was moved off email-only for exactly this reason once
            accounts started carrying payment information.
          </p>
        </div>
      )}

      <div className="flex items-center gap-4 pt-4 border-t border-bourbon-deep/10">
        <button
          type="submit"
          disabled={status === "saving"}
          className="px-6 py-2.5 bg-bourbon-deep text-bourbon-cream font-semibold tracking-wider uppercase text-xs hover:bg-bourbon-gold hover:text-bourbon-deep transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
        >
          {status === "saving" ? "Saving..." : "Save"}
        </button>
        {message && (
          <p
            className={`text-sm ${status === "error" ? "text-red-600" : "text-emerald-700"}`}
          >
            {message}
          </p>
        )}
      </div>
    </form>
  );
}
