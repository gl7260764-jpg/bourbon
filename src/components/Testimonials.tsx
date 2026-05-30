"use client";

import { useState } from "react";
import Image from "next/image";

const testimonials = [
  {
    id: 1,
    name: "James Mitchell",
    title: "Whiskey Connoisseur",
    quote: "The Heritage 1876 is unlike anything I've tasted. Rich, complex, with a finish that lingers like a Kentucky sunset. This is bourbon at its absolute finest.",
    rating: 5,
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80",
  },
  {
    id: 2,
    name: "Sarah Coleman",
    title: "Bar Owner, The Oak Room",
    quote: "We've made Bourbon & Oak our house pour. Our guests consistently praise the smooth character and the depth of flavor. It elevates every cocktail we create.",
    rating: 5,
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80",
  },
  {
    id: 3,
    name: "Robert Walker",
    title: "Master Sommelier",
    quote: "The Single Barrel Reserve delivers exceptional notes of vanilla, toasted oak, and dark cherry. A masterclass in Kentucky bourbon craftsmanship.",
    rating: 5,
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&q=80",
  },
];

export default function Testimonials() {
  const [current, setCurrent] = useState(0);
  const t = testimonials[current];

  return (
    <section className="py-24 bg-bourbon-warm/50 relative overflow-hidden">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="text-bourbon-gold text-xs tracking-[0.3em] uppercase">
            Testimonials
          </span>
          <h2 className="font-[family-name:var(--font-playfair)] text-4xl md:text-5xl font-bold text-bourbon-deep mt-3 mb-4">
            What They Say
          </h2>
          <div className="w-20 h-0.5 bg-bourbon-gold mx-auto" />
        </div>

        <div key={t.id} className="animate-fade-up text-center">
            {/* Quote icon */}
            <svg className="w-12 h-12 text-bourbon-gold/30 mx-auto mb-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10H14.017zM0 21v-7.391c0-5.704 3.731-9.57 8.983-10.609L9.978 5.151c-2.432.917-3.995 3.638-3.995 5.849h4v10H0z" />
            </svg>

            <blockquote className="font-[family-name:var(--font-playfair)] text-2xl md:text-3xl text-bourbon-deep/80 italic leading-relaxed max-w-3xl mx-auto mb-8">
              &ldquo;{t.quote}&rdquo;
            </blockquote>

            {/* Stars */}
            <div className="flex justify-center gap-1 mb-6">
              {[...Array(t.rating)].map((_, i) => (
                <svg key={i} className="w-5 h-5 text-bourbon-gold" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>

            {/* Author */}
            <div className="flex items-center justify-center gap-4">
              <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-bourbon-gold/30">
                <Image src={t.image} alt={t.name} fill className="object-cover" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-bourbon-deep">{t.name}</p>
                <p className="text-bourbon-stone text-sm">{t.title}</p>
              </div>
            </div>
        </div>

        {/* Navigation dots */}
        <div className="flex justify-center gap-3 mt-10">
          {testimonials.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`w-3 h-3 rounded-full transition-all duration-300 cursor-pointer ${
                i === current
                  ? "bg-bourbon-gold scale-110"
                  : "bg-bourbon-stone/30 hover:bg-bourbon-stone/50"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Background decoration */}
      <div className="absolute top-10 right-10 pointer-events-none opacity-5">
        <span className="font-[family-name:var(--font-playfair)] text-[15rem] font-bold text-bourbon-deep">
          &ldquo;
        </span>
      </div>
    </section>
  );
}
