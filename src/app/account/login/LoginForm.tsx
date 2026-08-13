"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);

    try {
      const res = await fetch("/api/account/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };

      if (!res.ok) {
        setError(data.error ?? "Could not sign you in.");
        setBusy(false);
        return;
      }

      // Server components read the session cookie, so refresh before pushing.
      router.refresh();
      router.push("/account");
    } catch {
      setError("Network error. Please try again.");
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="email"
          className="block text-bourbon-stone text-[10px] tracking-widest uppercase mb-1.5"
        >
          Email address
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={busy}
          placeholder="you@example.com"
          className="w-full bg-white border border-bourbon-deep/15 px-4 py-3 text-bourbon-deep text-sm focus:outline-none focus:border-bourbon-gold transition-colors disabled:opacity-60"
        />
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={busy}
        className="w-full px-6 py-4 bg-bourbon-gold text-bourbon-deep font-semibold tracking-widest uppercase text-xs hover:bg-bourbon-amber transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {busy ? "Signing in…" : "Continue"}
      </button>

      <p className="text-bourbon-stone text-xs text-center">
        Use the email you ordered with. No password needed.
      </p>
    </form>
  );
}
