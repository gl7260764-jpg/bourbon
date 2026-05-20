"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

interface SearchHit {
  id: string;
  slug: string;
  name: string;
  subtitle: string | null;
  ageLabel: string;
  price: number;
  image: string;
  categoryName: string;
  categorySlug: string;
}

interface SearchOverlayProps {
  open: boolean;
  onClose: () => void;
}

const TOP_RESULTS_LIMIT = 6;

export default function SearchOverlay({ open, onClose }: SearchOverlayProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [loading, setLoading] = useState(false);

  // Lock body scroll, focus input, listen for Escape
  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Focus shortly after mount so the input animation completes
    const t = setTimeout(() => inputRef.current?.focus(), 80);

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      clearTimeout(t);
    };
  }, [open, onClose]);

  // Reset state when overlay closes
  useEffect(() => {
    if (!open) {
      setQ("");
      setHits([]);
      setLoading(false);
    }
  }, [open]);

  // Debounced fetch on query change
  useEffect(() => {
    if (!open) return;
    const trimmed = q.trim();
    if (trimmed.length < 2) {
      setHits([]);
      setLoading(false);
      return;
    }

    const ctrl = new AbortController();
    setLoading(true);
    const t = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/search?q=${encodeURIComponent(trimmed)}&limit=${TOP_RESULTS_LIMIT}`,
          { signal: ctrl.signal }
        );
        const data = (await res.json()) as { results: SearchHit[] };
        setHits(data.results ?? []);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setHits([]);
        }
      } finally {
        setLoading(false);
      }
    }, 220);

    return () => {
      ctrl.abort();
      clearTimeout(t);
    };
  }, [q, open]);

  const submit = () => {
    const trimmed = q.trim();
    if (!trimmed) return;
    onClose();
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[80] bg-bourbon-deep/80 backdrop-blur-sm flex items-start justify-center pt-20 sm:pt-28 px-4"
          onClick={onClose}
          aria-modal="true"
          role="dialog"
        >
          <motion.div
            initial={{ y: -16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -8, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="relative w-full max-w-2xl bg-bourbon-cream shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Input row */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                submit();
              }}
              className="flex items-center gap-3 px-5 py-4 border-b border-bourbon-deep/10"
            >
              <svg className="w-5 h-5 text-bourbon-stone shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref={inputRef}
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search bottles, distilleries, flavors..."
                className="flex-1 bg-transparent text-bourbon-deep text-lg placeholder:text-bourbon-stone/60 focus:outline-none"
                autoComplete="off"
              />
              <button
                type="button"
                onClick={onClose}
                className="text-bourbon-stone/70 hover:text-bourbon-deep transition-colors text-xs tracking-widest uppercase cursor-pointer flex items-center gap-1"
              >
                <kbd className="px-1.5 py-0.5 border border-bourbon-deep/20 text-[10px] font-semibold">Esc</kbd>
              </button>
            </form>

            {/* Body */}
            <div className="max-h-[60vh] overflow-y-auto">
              {q.trim().length < 2 ? (
                <div className="px-5 py-6">
                  <p className="text-bourbon-stone text-xs tracking-widest uppercase mb-3">
                    Try searching
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {["pappy", "rye", "bottled in bond", "leather", "Eleanor Hayes"].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setQ(s)}
                        className="px-3 py-1.5 bg-bourbon-deep/5 hover:bg-bourbon-gold/15 text-bourbon-deep text-sm transition-colors cursor-pointer"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ) : loading && hits.length === 0 ? (
                <div className="px-5 py-8 text-center text-bourbon-stone text-sm">
                  Searching…
                </div>
              ) : hits.length === 0 ? (
                <div className="px-5 py-8 text-center">
                  <p className="text-bourbon-stone">
                    Nothing matched <span className="text-bourbon-deep font-semibold">&quot;{q}&quot;</span>.
                  </p>
                  <p className="text-bourbon-stone/70 text-xs mt-2">
                    Try a different keyword, or press Enter to search the full catalog.
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-bourbon-deep/5">
                  {hits.map((hit) => (
                    <li key={hit.id}>
                      <Link
                        href={`/products/${hit.slug}`}
                        onClick={onClose}
                        className="flex items-center gap-4 px-5 py-3 hover:bg-bourbon-gold/5 transition-colors group"
                      >
                        <div className="relative w-14 h-14 shrink-0 bg-bourbon-deep/5 overflow-hidden">
                          {hit.image && (
                            <Image src={hit.image} alt={hit.name} fill className="object-cover" sizes="56px" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-bourbon-gold text-[10px] tracking-widest uppercase">
                            {hit.categoryName} · {hit.ageLabel}
                          </p>
                          <p className="text-bourbon-deep font-semibold leading-tight truncate group-hover:text-bourbon-gold transition-colors">
                            {hit.name}
                          </p>
                          {hit.subtitle && (
                            <p className="text-bourbon-stone text-xs truncate">{hit.subtitle}</p>
                          )}
                        </div>
                        <span className="font-[family-name:var(--font-playfair)] text-bourbon-deep font-bold whitespace-nowrap">
                          ${hit.price.toFixed(2)}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Footer */}
            {q.trim().length >= 2 && hits.length > 0 && (
              <button
                type="button"
                onClick={submit}
                className="block w-full px-5 py-3 border-t border-bourbon-deep/10 text-bourbon-gold hover:bg-bourbon-gold/5 text-xs tracking-widest uppercase font-semibold transition-colors cursor-pointer"
              >
                View all results for &quot;{q.trim()}&quot; →
              </button>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
