"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NewCampaignButton({ label = "New campaign" }: { label?: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create() {
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/campaigns", { method: "POST" });
      const data = (await res.json().catch(() => ({}))) as { id?: string; error?: string };
      if (!res.ok || !data.id) {
        setError(data.error ?? "Could not start a campaign. Try again.");
        setPending(false);
        return;
      }
      router.push(`/admin/campaigns/${data.id}`);
    } catch {
      setError("Network error. Try again.");
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={create}
        disabled={pending}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-bourbon-deep text-bourbon-cream text-xs tracking-widest uppercase font-semibold hover:bg-bourbon-gold hover:text-bourbon-deep transition-colors disabled:opacity-60 cursor-pointer"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 5v14M5 12h14" />
        </svg>
        {pending ? "Creating…" : label}
      </button>
      {error && <p className="text-xs text-rose-700">{error}</p>}
    </div>
  );
}
