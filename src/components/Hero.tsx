"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";

type Clip = {
  src: string;
  /** Playback rate. Both clips are cut faster than a background bed wants —
      slowing them makes the hero read as atmosphere rather than an advert. */
  rate: number;
  /** Media-time seconds at which to hand over to the next clip. */
  end: number;
};

/* Two clips alternating, not one looping. The distillery film opens the reel
   (aerial, cooperage, a barrel charred in open flame, a bonded rickhouse) and
   the interior render follows it (a pan along the backlit shelf wall into a
   pour), then it wraps back. Sequencing them removes the jarring same-clip
   wrap entirely: every hand-over is now a cut between two different scenes,
   which is what a cross-dissolve is actually for.

   Clip 1 is 1920x1080, so it never upscales on a desktop hero. Clip 2 is
   1280x720 and upscales ~1.5x, which is why it plays second and slower — the
   slower pan hides the softness. Neither carries third-party branding. */
const CLIPS: Clip[] = [
  { src: "/VIDEO-HP-DESKTOP-1.mp4", rate: 0.6, end: 9.85 },
  { src: "/3D_render_interior_design_scene_202608140820.mp4", rate: 0.7, end: 7.9 },
];

/* Wall-clock length of the cross-dissolve. Converted to media seconds per clip
   (`FADE_MS/1000 * rate`) when deciding when to start it — at rate 0.6 a 900ms
   fade only consumes 0.54s of the clip's own timeline. */
const FADE_MS = 900;

const bottles = [
  { name: "Single Barrel", line: "Reserve", age: "12 Years", price: "$89.99", image: "/image1.webp" },
  { name: "Small Batch", line: "Collection", age: "8 Years", price: "$64.99", image: "/image2.webp" },
  { name: "Barrel Proof", line: "Uncut & Unfiltered", age: "10 Years", price: "$119.99", image: "/image3.webp" },
  { name: "Heritage", line: "1876 Edition", age: "15 Years", price: "$149.99", image: "/image4.webp" },
];

export default function Hero() {
  const vaRef = useRef<HTMLVideoElement>(null);
  const vbRef = useRef<HTMLVideoElement>(null);
  const rafRef = useRef<number | null>(null);
  /* activeRef mirrors `active` so the rAF loop can read it without being
     re-created every render; `switching` guards against a second hand-over
     firing while the first is still dissolving. */
  const activeRef = useRef(0);
  const switchingRef = useRef(false);
  const [active, setActive] = useState(0);
  const [videoOn, setVideoOn] = useState(false);

  const advance = useCallback(() => {
    if (switchingRef.current) return;
    const from = activeRef.current;
    const to = from === 0 ? 1 : 0;
    const next = to === 0 ? vaRef.current : vbRef.current;
    const prev = from === 0 ? vaRef.current : vbRef.current;
    if (!next || !next.src) return;
    switchingRef.current = true;

    /* Raise the incoming clip's opacity only once it is genuinely rendering —
       `play()` resolving is that signal. Flipping earlier cross-fades to a
       blank element and shows a black flash. */
    const reveal = () => {
      activeRef.current = to;
      setActive(to);
      window.setTimeout(() => {
        // Pause the outgoing clip only after it has finished fading out,
        // otherwise its last frame freezes mid-dissolve.
        if (prev) {
          prev.pause();
          prev.currentTime = 0;
        }
        switchingRef.current = false;
      }, FADE_MS);
    };

    next.currentTime = 0;
    next.playbackRate = CLIPS[to].rate;
    next.play().then(reveal).catch(reveal);
  }, []);

  /* rAF drives the hand-over; it is throttled to a standstill in a hidden tab
     while the video keeps rolling, so `timeupdate`, `ended` and
     `visibilitychange` all re-check as backstops. */
  const check = useCallback(() => {
    if (switchingRef.current) return;
    const i = activeRef.current;
    const v = i === 0 ? vaRef.current : vbRef.current;
    if (!v) return;
    const clip = CLIPS[i];
    const leadMedia = (FADE_MS / 1000) * clip.rate;
    if (v.currentTime >= clip.end - leadMedia) advance();
  }, [advance]);

  useEffect(() => {
    const a = vaRef.current;
    const b = vbRef.current;
    if (!a || !b) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    /* Attach sources only once we know we will play them. Reduced-motion and
       Data Saver hold at the poster — itself a still from clip 1 frame 0, so
       the framing matches — without fetching ~6MB they will never watch. */
    if (reduced || conn?.saveData) return;

    a.src = CLIPS[0].src;
    a.playbackRate = CLIPS[0].rate;

    const tick = () => {
      check();
      rafRef.current = requestAnimationFrame(tick);
    };

    // Some browsers reset playbackRate when a source loads.
    const rateA = () => { a.playbackRate = CLIPS[0].rate; };
    const rateB = () => { b.playbackRate = CLIPS[1].rate; };

    const start = () => {
      a.playbackRate = CLIPS[0].rate;
      a.play()
        .then(() => {
          setVideoOn(true);
          rafRef.current = requestAnimationFrame(tick);
          /* Fetch clip 2 only once clip 1 is actually running, so first paint
             costs one video rather than both. At 0.6x there is ~16s of clip 1
             to buffer it in. */
          if (!b.src) {
            b.src = CLIPS[1].src;
            b.playbackRate = CLIPS[1].rate;
          }
        })
        .catch(() => setVideoOn(false));
    };

    if (a.readyState >= 2) start();
    else a.addEventListener("loadeddata", start, { once: true });

    a.addEventListener("loadedmetadata", rateA);
    b.addEventListener("loadedmetadata", rateB);
    a.addEventListener("timeupdate", check);
    b.addEventListener("timeupdate", check);
    a.addEventListener("ended", advance);
    b.addEventListener("ended", advance);
    document.addEventListener("visibilitychange", check);

    return () => {
      a.removeEventListener("loadeddata", start);
      a.removeEventListener("loadedmetadata", rateA);
      b.removeEventListener("loadedmetadata", rateB);
      a.removeEventListener("timeupdate", check);
      b.removeEventListener("timeupdate", check);
      a.removeEventListener("ended", advance);
      b.removeEventListener("ended", advance);
      document.removeEventListener("visibilitychange", check);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [check, advance]);

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
        {/* Two stacked elements so one clip can dissolve into the next.
            A single element cannot cross-fade with itself — swapping `src`
            blanks the frame — which is why the previous single-clip version
            had to dip through black at the wrap instead. */}
        <video
          ref={vaRef}
          muted
          loop={false}
          playsInline
          preload="auto"
          aria-hidden="true"
          tabIndex={-1}
          className="absolute inset-0 h-full w-full object-cover transition-opacity ease-out"
          style={{
            opacity: videoOn && active === 0 ? 1 : 0,
            transitionDuration: videoOn ? `${FADE_MS}ms` : "1200ms",
          }}
        />
        <video
          ref={vbRef}
          muted
          loop={false}
          playsInline
          preload="none"
          aria-hidden="true"
          tabIndex={-1}
          className="absolute inset-0 h-full w-full object-cover transition-opacity ease-out"
          style={{
            opacity: videoOn && active === 1 ? 1 : 0,
            transitionDuration: `${FADE_MS}ms`,
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
