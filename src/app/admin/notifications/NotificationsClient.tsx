"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

interface ProductPreview {
  id: string;
  slug: string;
  name: string;
  title: string;
  body: string;
  image: string | null;
  alt: string;
  bottlePrice: number;
}

interface FanoutResult {
  attempted: number;
  sent: number;
  removed: number;
  failed: number;
}

export default function NotificationsClient({
  products,
  subscriberCount,
}: {
  products: ProductPreview[];
  subscriberCount: number;
}) {
  const [active, setActive] = useState<ProductPreview | null>(null);
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<FanoutResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const closeModal = () => {
    if (sending) return;
    setActive(null);
    setResult(null);
    setError(null);
  };

  const handleSend = async () => {
    if (!active || sending) return;
    setSending(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/admin/notifications/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId: active.id }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data?.error ?? "Send failed. Check server logs.");
      } else {
        const data = (await res.json()) as FanoutResult;
        setResult(data);
      }
    } catch (err) {
      setError((err as Error)?.message ?? "Network error.");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {products.length === 0 ? (
        <div className="bg-white border border-bourbon-deep/10 p-10 text-center text-bourbon-stone">
          No products yet. Add one from the Products page first.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                setActive(p);
                setResult(null);
                setError(null);
              }}
              className="group text-left bg-white border border-bourbon-deep/10 overflow-hidden hover:border-bourbon-gold transition-colors cursor-pointer"
            >
              <div className="relative w-full aspect-square bg-bourbon-deep/5">
                {p.image ? (
                  <Image
                    src={p.image}
                    alt={p.alt}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-bourbon-stone text-xs uppercase tracking-widest">
                    No image
                  </div>
                )}
              </div>
              <div className="p-3">
                <p className="text-bourbon-deep font-semibold text-sm truncate">{p.name}</p>
                <p className="text-bourbon-stone text-xs mt-0.5">
                  ${p.bottlePrice.toFixed(2)}
                </p>
                <p className="mt-2 text-bourbon-gold text-[10px] tracking-widest uppercase font-semibold">
                  Click to announce →
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      <AnimatePresence>
        {active && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeModal}
            className="fixed inset-0 z-50 bg-bourbon-deep/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
          >
            <motion.div
              key="panel"
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="relative bg-bourbon-cream w-full max-w-md border border-bourbon-gold/30 shadow-2xl"
            >
              <div className="px-6 pt-6 pb-4 border-b border-bourbon-deep/10 flex items-start justify-between gap-3">
                <div>
                  <p className="text-bourbon-gold text-[10px] tracking-[0.3em] uppercase mb-1">
                    Preview
                  </p>
                  <h2 className="font-[family-name:var(--font-playfair)] text-xl font-bold text-bourbon-deep">
                    How it will look
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={sending}
                  className="text-bourbon-stone hover:text-bourbon-deep cursor-pointer disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Close"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Mock notification card */}
              <div className="px-6 py-5">
                <div className="bg-white border border-bourbon-deep/15 rounded-lg overflow-hidden shadow-sm">
                  {active.image && (
                    <div className="relative w-full aspect-[2/1] bg-bourbon-deep/5">
                      <Image
                        src={active.image}
                        alt={active.alt}
                        fill
                        className="object-cover"
                        sizes="400px"
                      />
                    </div>
                  )}
                  <div className="p-3 flex gap-3">
                    <div className="relative w-10 h-10 shrink-0 rounded-full overflow-hidden bg-bourbon-deep">
                      <Image
                        src="/icons/icon-192.png"
                        alt="Bourbon Oak Lover"
                        fill
                        className="object-cover"
                        sizes="40px"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-bourbon-deep text-xs font-semibold tracking-widest uppercase">
                          Bourbon Oak Lover
                        </p>
                        <span className="text-bourbon-stone/70 text-[10px]">now</span>
                      </div>
                      <p className="text-bourbon-deep text-sm font-semibold mt-0.5 leading-snug">
                        {active.title}
                      </p>
                      <p className="text-bourbon-stone text-xs mt-1 leading-snug">
                        {active.body}
                      </p>
                    </div>
                  </div>
                </div>

                <p className="mt-4 text-bourbon-stone text-xs">
                  Tapping the notification opens{" "}
                  <code className="bg-bourbon-deep/5 px-1.5 py-0.5 text-bourbon-deep">
                    /products/{active.slug}
                  </code>
                  .
                </p>

                {error && (
                  <div className="mt-4 px-3 py-2 border border-red-300 bg-red-50 text-red-700 text-xs">
                    {error}
                  </div>
                )}

                {result && (
                  <div className="mt-4 px-3 py-2.5 border border-emerald-300 bg-emerald-50 text-emerald-800 text-xs">
                    <p className="font-semibold">Sent.</p>
                    <p className="mt-0.5">
                      Delivered to {result.sent} device{result.sent === 1 ? "" : "s"}
                      {result.removed > 0 && ` · removed ${result.removed} stale subscription${result.removed === 1 ? "" : "s"}`}
                      {result.failed > 0 && ` · ${result.failed} failed`}
                      .
                    </p>
                  </div>
                )}
              </div>

              <div className="px-6 pb-6 flex items-center gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={sending}
                  className="flex-1 px-4 py-3 border border-bourbon-deep/20 text-bourbon-deep text-xs tracking-widest uppercase font-semibold hover:bg-bourbon-deep/5 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={sending || subscriberCount === 0}
                  className="flex-1 px-4 py-3 bg-bourbon-gold text-bourbon-deep text-xs tracking-widest uppercase font-bold hover:bg-bourbon-amber disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer transition-colors"
                >
                  {sending
                    ? "Sending…"
                    : subscriberCount === 0
                      ? "No subscribers yet"
                      : `Send to ${subscriberCount}`}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
