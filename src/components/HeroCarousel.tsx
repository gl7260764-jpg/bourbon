"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";

const slides = [
  {
    id: 1,
    title: "Single Barrel",
    subtitle: "Reserve",
    description: "Hand-selected from the finest barrels in our rickhouse. Each bottle is a unique expression of Kentucky craftsmanship.",
    price: "$89.99",
    age: "12 Years",
    image: "/image1.webp",
    badge: "Best Seller",
  },
  {
    id: 2,
    title: "Small Batch",
    subtitle: "Collection",
    description: "A marriage of select barrels creating a rich, complex flavor profile with notes of vanilla, caramel, and toasted oak.",
    price: "$64.99",
    age: "8 Years",
    image: "/image2.webp",
    badge: "New Arrival",
  },
  {
    id: 3,
    title: "Barrel Proof",
    subtitle: "Uncut & Unfiltered",
    description: "Bottled straight from the barrel at full strength. Bold, intense, and unapologetically authentic.",
    price: "$119.99",
    age: "10 Years",
    image: "/image3.webp",
    badge: "Limited Edition",
  },
  {
    id: 4,
    title: "Heritage",
    subtitle: "1876 Edition",
    description: "Our flagship bourbon, crafted using the original recipe passed down through six generations of master distillers.",
    price: "$149.99",
    age: "15 Years",
    image: "/image4.webp",
    badge: "Premium",
  },
];

export default function HeroCarousel() {
  const [current, setCurrent] = useState(0);

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % slides.length);
  }, []);

  useEffect(() => {
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next]);

  const slide = slides[current];

  return (
    <section className="relative min-h-screen bg-bourbon-deep overflow-hidden pt-20">
      {/* Background image — render all four, fade based on `current`. Keeps the
          cross-fade compositor-only (no JS) and avoids layout thrash. */}
      <div className="absolute inset-0">
        {slides.map((s, i) => (
          <div
            key={s.id}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
              i === current ? "opacity-100" : "opacity-0"
            }`}
          >
            <Image
              src={s.image}
              alt={s.title}
              fill
              className="object-cover"
              priority={i === 0}
            />
          </div>
        ))}
        <div className="absolute inset-0 bg-gradient-to-r from-bourbon-deep via-bourbon-deep/50 to-bourbon-deep/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-bourbon-deep via-transparent to-bourbon-deep/50" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row items-center min-h-screen pt-10 pb-20">
        {/* Left content — keyed wrapper re-mounts on slide change so the
            fade-in animation re-runs. */}
        <div className="flex-1 flex flex-col justify-center lg:pr-16">
          <div key={slide.id} className="animate-fade-in">
            <span className="inline-block px-3 py-1 sm:px-4 sm:py-1.5 bg-bourbon-gold/20 border border-bourbon-gold/40 text-bourbon-gold text-[10px] sm:text-xs tracking-[0.25em] sm:tracking-[0.3em] uppercase mb-4 sm:mb-6">
              {slide.badge}
            </span>

            <h2 className="font-[family-name:var(--font-playfair)] text-4xl xs:text-5xl sm:text-6xl lg:text-8xl font-bold text-bourbon-cream leading-none mb-2">
              {slide.title}
            </h2>
            <p className="font-[family-name:var(--font-playfair)] text-2xl sm:text-4xl lg:text-5xl font-light text-bourbon-gold italic mb-4 sm:mb-6">
              {slide.subtitle}
            </p>

            <p className="text-bourbon-cream/60 text-sm sm:text-lg max-w-lg mb-4 leading-relaxed">
              {slide.description}
            </p>

            <div className="flex flex-wrap items-center gap-3 sm:gap-6 mb-6 sm:mb-8">
              <div className="flex items-center gap-2">
                <span className="text-bourbon-gold text-xs sm:text-sm tracking-wider uppercase">Age:</span>
                <span className="text-bourbon-cream font-semibold text-sm sm:text-base">{slide.age}</span>
              </div>
              <div className="w-px h-6 bg-bourbon-gold/30 hidden sm:block" />
              <div className="flex items-center gap-2">
                <span className="text-bourbon-gold text-xs sm:text-sm tracking-wider uppercase">Proof:</span>
                <span className="text-bourbon-cream font-semibold text-sm sm:text-base">90</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
              <span className="font-[family-name:var(--font-playfair)] text-3xl sm:text-4xl font-bold text-bourbon-gold">
                {slide.price}
              </span>
              <Link
                href="/shop"
                className="group w-full sm:w-auto justify-center px-6 sm:px-8 py-3 sm:py-4 bg-bourbon-gold text-bourbon-deep font-semibold tracking-wider uppercase text-sm hover:bg-bourbon-amber transition-all duration-300 flex items-center gap-3 cursor-pointer"
              >
                Shop Now
                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          </div>
        </div>

        {/* Right side — product card list */}
        <div className="hidden lg:flex flex-col gap-3 mt-10 lg:mt-0">
          {slides.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setCurrent(i)}
              className={`flex items-center gap-4 p-3 pr-6 text-left transition-all duration-300 cursor-pointer hover:-translate-x-2 ${
                i === current
                  ? "bg-bourbon-gold/15 border border-bourbon-gold/40"
                  : "bg-bourbon-cream/5 border border-transparent hover:bg-bourbon-cream/10"
              }`}
            >
              <div className="relative w-16 h-16 overflow-hidden shrink-0">
                <Image src={s.image} alt={s.title} fill className="object-cover" />
              </div>
              <div>
                <p
                  className={`font-[family-name:var(--font-playfair)] font-semibold text-sm ${
                    i === current ? "text-bourbon-gold" : "text-bourbon-cream/80"
                  }`}
                >
                  {s.title} {s.subtitle}
                </p>
                <p className="text-bourbon-cream/50 text-xs">{s.age} &middot; {s.price}</p>
              </div>
              {i === current && <div className="w-1 h-8 bg-bourbon-gold ml-auto" />}
            </button>
          ))}
        </div>
      </div>

      {/* Bottom slide indicators */}
      <div className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 z-10 flex gap-3">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            aria-label={`Show slide ${i + 1}`}
            className="group cursor-pointer"
          >
            <div
              className={`h-0.5 transition-all duration-500 ${
                i === current
                  ? "w-12 bg-bourbon-gold"
                  : "w-6 bg-bourbon-cream/30 group-hover:bg-bourbon-cream/50"
              }`}
            />
          </button>
        ))}
      </div>

      {/* Large background text */}
      <div className="absolute bottom-20 right-0 z-0 overflow-hidden pointer-events-none hidden lg:block">
        <span
          key={slide.id}
          className="animate-fade-up font-[family-name:var(--font-playfair)] text-[12rem] font-bold text-bourbon-cream/[0.03] uppercase leading-none whitespace-nowrap"
        >
          BOURBON
        </span>
      </div>
    </section>
  );
}
