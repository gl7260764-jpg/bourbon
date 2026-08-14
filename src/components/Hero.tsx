"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";

const VIDEO_SRC = "/3D_render_interior_design_scene_202608140820.mp4";

/* A 1280x720 render: a pan along a backlit shelf wall that resolves into a
   pour. Being natively 16:9 it only upscales ~1.5x on a 1920 hero and loses
   ~17% of frame height to `object-cover`, so we play the whole 8s rather than
   hunting for a usable window. A phone viewport is the tight case — it keeps
   only the centre ~26% of the width — which is where the composition was
   checked. Both bottles in this render carry real third-party marks (Pappy Van
   Winkle at 0-2s, Weller at 5-8s); no sub-window avoids them, so the window is
   the full clip and the labels are a content decision, not a framing one. */
const LOOP_START = 0;
const LOOP_END = 7.9;
/* The clip's last frame and first frame are different compositions, so the
   wrap is a hard cut. Dipping through dark across the seek turns it into a
   dissolve — longer and deeper than a matched-frame seam would need. */
const SEAM_LEAD = 0.35;
const SEAM_MS = 560;
const SEAM_OPACITY = 0.25;

const bottles = [
  { name: "Single Barrel", line: "Reserve", age: "12 Years", price: "$89.99", image: "/image1.webp" },
  { name: "Small Batch", line: "Collection", age: "8 Years", price: "$64.99", image: "/image2.webp" },
  { name: "Barrel Proof", line: "Uncut & Unfiltered", age: "10 Years", price: "$119.99", image: "/image3.webp" },
  { name: "Heritage", line: "1876 Edition", age: "15 Years", price: "$149.99", image: "/image4.webp" },
];

export default function Hero() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const rafRef = useRef<number | null>(null);
  const [videoOn, setVideoOn] = useState(false);
  const [atSeam, setAtSeam] = useState(false);

  /* Drive the wrap ourselves instead of the element's own `loop`, so the seam
     dip can be timed against it. rAF handles the normal case; it is throttled
     to a standstill in a hidden tab while the video keeps rolling, so
     `timeupdate` and `visibilitychange` re-clamp as a backstop. */
  const clamp = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.currentTime >= LOOP_END - SEAM_LEAD) setAtSeam(true);
    if (v.currentTime >= LOOP_END || v.currentTime < LOOP_START - 0.1) {
      v.currentTime = LOOP_START;
      window.setTimeout(() => setAtSeam(false), SEAM_MS / 2);
    }
  }, []);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    /* Attach the source only once we know we will play it. Reduced-motion and
       Data Saver hold at the poster — itself a still pulled from LOOP_START, so
       the framing matches — without fetching 2.2MB they will never watch. */
    if (reduced || conn?.saveData) return;
    v.src = VIDEO_SRC;

    const tick = () => {
      clamp();
      rafRef.current = requestAnimationFrame(tick);
    };

    const start = () => {
      v.currentTime = LOOP_START;
      v.play()
        .then(() => {
          setVideoOn(true);
          rafRef.current = requestAnimationFrame(tick);
        })
        .catch(() => setVideoOn(false));
    };

    if (v.readyState >= 2) start();
    else v.addEventListener("loadeddata", start, { once: true });

    v.addEventListener("timeupdate", clamp);
    document.addEventListener("visibilitychange", clamp);

    return () => {
      v.removeEventListener("loadeddata", start);
      v.removeEventListener("timeupdate", clamp);
      document.removeEventListener("visibilitychange", clamp);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [clamp]);

  return (
    <section className="relative min-h-[100svh] bg-bourbon-deep overflow-hidden">
      {/* ---- Media bed ---- */}
      <div className="absolute inset-0">
        <Image
          src="/hero-poster.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <video
          ref={videoRef}
          muted
          loop={false}
          playsInline
          preload="auto"
          aria-hidden="true"
          tabIndex={-1}
          className="absolute inset-0 h-full w-full object-cover transition-opacity ease-out"
          style={{
            opacity: videoOn ? (atSeam ? SEAM_OPACITY : 1) : 0,
            transitionDuration: videoOn ? `${SEAM_MS}ms` : "1200ms",
          }}
        />

        {/* Scrims. With the copy centred it now sits over the busiest part of
            the frame, so the darkness is concentrated where the text is and
            released toward the edges rather than raked across from one side.
            Net effect is a lighter picture that still carries the type: the
            shelf wall and the pour stay legible out at the margins. */}
        <div className="absolute inset-0 bg-bourbon-deep/30 lg:bg-bourbon-deep/18" />
        {/* Stop values set by measured contrast over this clip's brightest
            frames, not by eye — gold on amber is the binding case. */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_92%_60%_at_50%_48%,rgba(12,10,9,0.82)_0%,rgba(12,10,9,0.68)_38%,rgba(12,10,9,0.34)_68%,rgba(12,10,9,0.08)_100%)] lg:bg-[radial-gradient(ellipse_72%_58%_at_50%_46%,rgba(12,10,9,0.76)_0%,rgba(12,10,9,0.6)_40%,rgba(12,10,9,0.24)_72%,transparent_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_top,#0C0A09_0%,rgba(12,10,9,0.55)_10%,transparent_32%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(12,10,9,0.85)_0%,rgba(12,10,9,0.3)_12%,transparent_26%)]" />
        {/* Grain — light tooth to warm the render, not to hide softness. */}
        <div className="hero-grain absolute inset-0 pointer-events-none" />
      </div>

      {/* ---- Copy ---- */}
      {/* pb clears the bottle ledger on lg and the fixed chat launcher below it. */}
      <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-7xl flex-col items-center justify-center px-4 pt-28 pb-24 text-center sm:px-6 lg:px-8 lg:pb-28">
        <div className="max-w-2xl lg:max-w-4xl">
          {/* The page's only h1. It was an <h2> under a hidden, keyword-stuffed
              h1 in page.tsx — search engines weight the visible primary
              heading, so the real headline carries the term instead. "Kentucky"
              also replaces the geography the removed eyebrow used to supply. */}
          <h1 className="font-[family-name:var(--font-playfair)] font-bold leading-[0.92] tracking-[-0.03em] text-bourbon-cream text-[clamp(2.75rem,8.5vw,5.5rem)]">
            <span className="animate-hero-rise block text-balance" style={{ animationDelay: "120ms" }}>
              Kentucky bourbon.
            </span>
            {/* Balanced so the narrow breakpoints split this as
                "One barrel / at a time." instead of orphaning "time." */}
            <span
              className="animate-hero-rise block text-balance font-light italic text-bourbon-gold"
              style={{ animationDelay: "240ms" }}
            >
              One barrel at a time.
            </span>
          </h1>

          {/* Carries the terms the removed eyebrow used to hold — Bardstown,
              single barrel, small batch, 1876 — as real sentence copy. */}
          <p
            className="animate-hero-rise mx-auto mt-6 max-w-[52ch] text-balance text-sm leading-relaxed text-bourbon-cream/75 sm:mt-8 sm:text-lg"
            style={{ animationDelay: "380ms" }}
          >
            Six generations of hand-selected single barrels and small-batch
            whiskey, aged in the same Bardstown, Kentucky rickhouse since 1876.
          </p>

          <div
            className="animate-hero-rise mt-9 flex justify-center sm:mt-11"
            style={{ animationDelay: "500ms" }}
          >
            <Link
              href="/shop"
              className="group flex w-full items-center justify-center gap-3 bg-bourbon-gold px-9 py-4 text-sm font-semibold uppercase tracking-wider text-bourbon-deep transition-colors duration-300 hover:bg-bourbon-amber focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-bourbon-gold sm:w-auto"
            >
              Shop the collection
              <svg className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </div>

      {/* ---- Bottle ledger ---- */}
      <div className="absolute inset-x-0 bottom-0 z-10 hidden border-t border-bourbon-cream/10 bg-bourbon-deep/40 backdrop-blur-sm lg:block">
        <div className="mx-auto grid max-w-7xl grid-cols-4 px-8">
          {bottles.map((b, i) => (
            <Link
              key={b.name}
              href="/shop"
              className="group animate-hero-rise flex items-center gap-3.5 py-5 pr-8 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-bourbon-gold"
              style={{ animationDelay: `${640 + i * 90}ms` }}
            >
              <div className="relative h-14 w-11 shrink-0 overflow-hidden">
                <Image
                  src={b.image}
                  alt=""
                  fill
                  sizes="44px"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-[family-name:var(--font-playfair)] text-[15px] font-semibold text-bourbon-cream transition-colors duration-300 group-hover:text-bourbon-gold">
                  {b.name}
                </p>
                <p className="truncate text-[11px] leading-snug text-bourbon-cream/45">
                  {b.line}
                </p>
              </div>
              <span className="shrink-0 text-right leading-tight">
                <span className="block text-[10px] uppercase tracking-wider text-bourbon-cream/40">
                  {b.age}
                </span>
                <span className="block text-sm font-semibold text-bourbon-gold/85 transition-colors duration-300 group-hover:text-bourbon-gold">
                  {b.price}
                </span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
