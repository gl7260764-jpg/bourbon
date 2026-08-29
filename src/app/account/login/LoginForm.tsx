"use client";

import { FormEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { AuthMode } from "@/lib/auth-mode-constants";

/* "confirm" is the step a buyer lands on straight from checkout: we already
   know the address they ordered with, so there is nothing to type — just a
   button that sends the code. They can still switch to a different email. */
type Stage = "confirm" | "email" | "code" | "link_sent";

export default function LoginForm({
  initialEmail = "",
  mode = "CODE",
}: {
  initialEmail?: string;
  /** Set in Admin > Settings. Decides what submitting the address does. */
  mode?: AuthMode;
}) {
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
        setError(data.error ?? "Could not start sign-in.");
        return;
      }
      /* Trust the server's own account of what it did rather than the mode
         prop: the setting can change between the page render and this submit,
         and the server is the one that acted. */
      if (data.stage === "signed_in") {
        router.refresh();
        router.push("/account");
        return;
      }
      if (data.stage === "link_sent") {
        setStage("link_sent");
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

  /* Named for what the button will actually do, so the control never promises
     a code in a mode that sends a link. */
  const primaryLabel =
    mode === "EMAIL_ONLY"
      ? "Open my dashboard"
      : mode === "LINK"
        ? "Email me a sign-in link"
        : "Send code";
  const busyLabel =
    mode === "EMAIL_ONLY" ? "Signing in..." : "Sending...";

  const label =
    "block text-bourbon-stone text-[10px] tracking-widest uppercase mb-1.5";
  const field =
    "w-full bg-white border border-bourbon-deep/15 px-3 py-3 text-bourbon-deep text-sm focus:outline-none focus:border-bourbon-gold transition-colors disabled:opacity-60";

  if (stage === "link_sent") {
    return (
      <div className="text-center">
        <span className="mx-auto mb-4 w-12 h-12 bg-bourbon-gold flex items-center justify-center">
          <svg className="w-6 h-6 text-bourbon-deep" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M3 8l9 6 9-6M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </span>
        <h2 className="font-[family-name:var(--font-playfair)] text-xl font-bold text-bourbon-deep mb-2">
          Check your inbox
        </h2>
        <p className="text-bourbon-stone text-sm leading-relaxed">
          We sent a sign-in link to{" "}
          <span className="text-bourbon-deep font-semibold break-all">{email}</span>.
          Tap it and you&apos;re in — there&apos;s no code to type.
        </p>
        <button
          type="button"
          onClick={() => {
            setStage("email");
            setError(null);
          }}
          className="mt-6 text-bourbon-stone hover:text-bourbon-deep text-xs transition-colors cursor-pointer"
        >
          Use a different email
        </button>
      </div>
    );
  }

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
          {busy ? busyLabel : primaryLabel}
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
        {busy ? busyLabel : primaryLabel}
      </button>
    </form>
  );
}
