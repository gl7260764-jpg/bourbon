"use client";

import { FormEvent, useState } from "react";
import {
  DEFAULTS,
  fillWelcome,
  type OrderWelcomeSettings,
} from "@/lib/order-welcome";

type Status = "idle" | "saving" | "saved" | "error";

/**
 * The two messages a buyer sees the instant they place an order.
 *
 * Shown with a live preview because the placeholders make the stored text and
 * the sent text different things, and a promise about response time is worth
 * reading as the customer will read it before it goes to everyone.
 */
export default function OrderWelcomeForm({
  initial,
}: {
  initial: OrderWelcomeSettings;
}) {
  const [greeting, setGreeting] = useState(initial.greeting);
  const [promise, setPromise] = useState(initial.promise);
  const [suggestInstall, setSuggestInstall] = useState(initial.suggestInstall);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  const vars = { firstName: "Marcus", orderNumber: "BO-7K2M9X4Q" };
  const preview = [fillWelcome(greeting, vars), fillWelcome(promise, vars)].filter(
    Boolean,
  );

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "saving") return;
    setStatus("saving");
    setMessage("");
    try {
      const res = await fetch("/api/admin/order-welcome", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ greeting, promise, suggestInstall }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setStatus("error");
        setMessage(data.error ?? "Could not save. Please try again.");
        return;
      }
      setStatus("saved");
      setMessage("Saved. Applies to the next order placed.");
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  }

  const field =
    "w-full bg-white border border-bourbon-deep/15 px-3 py-2.5 text-bourbon-deep text-sm outline-none focus:border-bourbon-gold transition-colors";

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border border-bourbon-deep/10 p-5 sm:p-6 max-w-2xl mt-8"
    >
      <div className="flex items-baseline justify-between mb-5 pb-4 border-b border-bourbon-deep/10">
        <h2 className="font-[family-name:var(--font-playfair)] text-xl font-bold text-bourbon-deep">
          Order chat welcome
        </h2>
        <span className="text-bourbon-stone text-[10px] tracking-widest uppercase">
          Storefront
        </span>
      </div>

      <p className="text-bourbon-stone text-xs mb-5 -mt-1">
        Placing an order now opens the customer&apos;s messages with a picture of
        what they ordered and these lines beneath it. Use{" "}
        <code className="bg-bourbon-cream px-1">{"{firstName}"}</code> and{" "}
        <code className="bg-bourbon-cream px-1">{"{orderNumber}"}</code> — both
        fill in automatically, and an unknown name drops out cleanly rather than
        leaving a gap.
      </p>

      <label className="block mb-4">
        <span className="block text-bourbon-stone text-[10px] tracking-widest uppercase mb-1.5">
          Greeting
        </span>
        <input
          value={greeting}
          onChange={(e) => setGreeting(e.target.value)}
          placeholder={DEFAULTS.greeting}
          className={field}
        />
      </label>

      <label className="block mb-4">
        <span className="block text-bourbon-stone text-[10px] tracking-widest uppercase mb-1.5">
          Response promise
        </span>
        <textarea
          value={promise}
          onChange={(e) => setPromise(e.target.value)}
          rows={3}
          placeholder={DEFAULTS.promise}
          className={`${field} resize-y`}
        />
        <span className="block text-bourbon-stone text-xs mt-1.5">
          This is a promise about people. If five minutes stops being true
          overnight or at weekends, change it here rather than leaving it.
        </span>
      </label>

      <label className="flex items-start gap-3 mb-5 cursor-pointer">
        <input
          type="checkbox"
          checked={suggestInstall}
          onChange={(e) => setSuggestInstall(e.target.checked)}
          className="mt-0.5 w-4 h-4 accent-bourbon-gold cursor-pointer shrink-0"
        />
        <span className="min-w-0">
          <span className="block text-bourbon-deep text-sm font-semibold">
            Offer the app in the chat
          </span>
          <span className="block text-bourbon-stone text-xs mt-0.5">
            Shows an install button under the conversation, so a reply still
            reaches them once they close the site. It is a live button rather
            than a line of text, so it disappears by itself once they have
            installed — and never appears on a device that cannot install.
          </span>
        </span>
      </label>

      <div className="mb-6 border border-bourbon-deep/10 bg-bourbon-cream/60 p-4">
        <p className="text-bourbon-stone text-[10px] tracking-widest uppercase mb-2.5">
          As the customer sees it
        </p>
        <div className="bg-[#FBEFC8] p-3 rounded-lg rounded-bl-none max-w-md">
          {preview.map((line, i) => (
            <p
              key={i}
              className={`text-bourbon-deep text-sm leading-relaxed ${i > 0 ? "mt-2.5" : ""}`}
            >
              {line}
            </p>
          ))}
        </div>
        {suggestInstall && (
          <div className="mt-2 max-w-xs border border-bourbon-gold/40 bg-white p-3 rounded-lg rounded-bl-none">
            <p className="text-bourbon-deep text-sm font-semibold">
              Don&apos;t miss our reply
            </p>
            <p className="text-bourbon-stone text-xs mt-0.5">
              Install the app and we can reach you even with the site closed.
            </p>
            <span className="mt-2.5 block bg-bourbon-gold py-2 text-center text-[10px] font-semibold uppercase tracking-[0.15em] text-bourbon-deep">
              Install the app
            </span>
            <p className="text-bourbon-stone/70 text-[11px] mt-2">
              Only shown while they can actually install.
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={status === "saving"}
          className="px-6 py-3 bg-bourbon-gold text-bourbon-deep text-xs font-semibold tracking-widest uppercase hover:bg-bourbon-amber transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {status === "saving" ? "Saving…" : "Save"}
        </button>
        {message && (
          <span
            className={`text-xs ${status === "error" ? "text-red-600" : "text-emerald-700"}`}
          >
            {message}
          </span>
        )}
      </div>
    </form>
  );
}
