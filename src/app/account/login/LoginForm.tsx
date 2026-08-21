"use client";

import { FormEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";

/* "confirm" is the step a buyer lands on straight from checkout: we already
   know the address they ordered with, so there is nothing to type — just a
   button that sends the code. They can still switch to a different email. */
type Stage = "confirm" | "email" | "code";

export default function LoginForm({ initialEmail = "" }: { initialEmail?: string }) {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>(initialEmail ? "confirm" : "email");
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const codeRef = useRef<HTMLInputElement>(null);

  async function post(payload: Record<string, string>) {
    const res = await fetch("/api/account/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await res.json().catch(() => ({}))) as {
      error?: string;
      stage?: string;
    };
    return { ok: res.ok, data };
  }

  async function requestCode(e?: FormEvent) {
    e?.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    setNote(null);
    try {
      const { ok, data } = await post({ email });
      if (!ok) {
        setError(data.error ?? "Could not send a code.");
        return;
      }
      setStage("code");
      setNote(`We emailed a 6-digit code to ${email}.`);
      // Focus lands after the input exists.
      window.setTimeout(() => codeRef.current?.focus(), 40);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function submitCode(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const { ok, data } = await post({ email, code });
      if (!ok) {
        setError(data.error ?? "Could not sign you in.");
        return;
      }
      // Server components read the session cookie, so refresh before pushing.
      router.refresh();
      router.push("/account");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const label =
    "block text-bourbon-stone text-[10px] tracking-widest uppercase mb-1.5";
  const field =
    "w-full bg-white border border-bourbon-deep/15 px-3 py-3 text-bourbon-deep text-sm focus:outline-none focus:border-bourbon-gold transition-colors disabled:opacity-60";

  if (stage === "confirm") {
    return (
      <div className="space-y-4">
        <div>
          <p className={label}>Signing in as</p>
          <p className="text-bourbon-deep text-sm font-semibold break-all bg-bourbon-cream border border-bourbon-deep/10 px-3 py-3">
            {email}
          </p>
        </div>

        {error && (
          <p className="text-red-600 text-sm" role="alert">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={() => requestCode()}
          disabled={busy}
          className="w-full py-3 bg-bourbon-gold text-bourbon-deep font-semibold tracking-widest uppercase text-xs hover:bg-bourbon-amber transition-colors cursor-pointer disabled:opacity-60"
        >
          {busy ? "Sending..." : "Send code"}
        </button>

        <button
          type="button"
          onClick={() => {
            setStage("email");
            setError(null);
          }}
          className="w-full text-bourbon-stone hover:text-bourbon-deep text-xs transition-colors cursor-pointer"
        >
          Use a different email
        </button>
      </div>
    );
  }

  if (stage === "code") {
    return (
      <form onSubmit={submitCode} className="space-y-4">
        {note && (
          <p className="text-bourbon-stone text-sm bg-bourbon-gold/10 border border-bourbon-gold/30 px-3 py-2.5">
            {note}
          </p>
        )}

        <div>
          <label htmlFor="code" className={label}>
            6-digit code
          </label>
          <input
            ref={codeRef}
            id="code"
            name="code"
            /* one-time-code lets iOS and Android offer the code straight from
               the notification, which is most of the friction gone. */
            autoComplete="one-time-code"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            required
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            disabled={busy}
            className={`${field} tracking-[0.4em] text-center text-lg`}
          />
        </div>

        {error && (
          <p className="text-red-600 text-sm" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy || code.length < 6}
          className="w-full py-3 bg-bourbon-gold text-bourbon-deep font-semibold tracking-widest uppercase text-xs hover:bg-bourbon-amber transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {busy ? "Checking..." : "Sign in"}
        </button>

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              setStage(initialEmail ? "confirm" : "email");
              setCode("");
              setError(null);
              setNote(null);
            }}
            className="text-bourbon-stone hover:text-bourbon-deep text-xs transition-colors cursor-pointer"
          >
            ← Back
          </button>
          <button
            type="button"
            onClick={() => requestCode()}
            disabled={busy}
            className="text-bourbon-gold hover:text-bourbon-amber text-xs font-semibold transition-colors cursor-pointer disabled:opacity-60"
          >
            Resend code
          </button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={requestCode} className="space-y-4">
      <div>
        <label htmlFor="email" className={label}>
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={busy}
          className={field}
        />
      </div>

      {error && (
        <p className="text-red-600 text-sm" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy}
        className="w-full py-3 bg-bourbon-gold text-bourbon-deep font-semibold tracking-widest uppercase text-xs hover:bg-bourbon-amber transition-colors cursor-pointer disabled:opacity-60"
      >
        {busy ? "Sending..." : "Email me a code"}
      </button>
    </form>
  );
}
