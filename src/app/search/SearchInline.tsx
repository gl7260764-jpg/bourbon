"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SearchInline({ initialQuery }: { initialQuery: string }) {
  const router = useRouter();
  const [value, setValue] = useState(initialQuery);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = value.trim();
    if (!q) {
      router.push("/search");
      return;
    }
    router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <form onSubmit={handleSubmit} className="relative max-w-xl">
      <svg
        className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-bourbon-stone pointer-events-none"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search bottles, distilleries, flavors..."
        className="w-full bg-white border border-bourbon-deep/15 pl-12 pr-4 py-4 text-bourbon-deep focus:outline-none focus:border-bourbon-gold transition-colors"
        autoComplete="off"
      />
    </form>
  );
}
