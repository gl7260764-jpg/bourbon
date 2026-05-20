"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { useCart } from "@/components/CartContext";
import { useToast } from "@/components/CartToast";
import VideoModal from "./VideoModal";

export interface ProductDetailData {
  id: string;
  name: string;
  subtitle: string | null;
  description: string;
  story: string | null;
  badge: string | null;

  bottlePrice: number;
  casePrice: number | null;
  bottlesPerCase: number | null;
  compareAtPrice: number | null;

  ageLabel: string;
  proof: number;
  abv: number;
  bottleSizeMl: number;

  cornPercent: number | null;
  ryePercent: number | null;
  wheatPercent: number | null;
  maltedBarleyPct: number | null;

  distillery: string;
  region: string;
  state: string | null;
  masterDistiller: string | null;
  caskType: string | null;
  charLevel: number | null;
  finishCask: string | null;
  batchNumber: string | null;
  barrelNumber: string | null;
  releaseYear: number | null;

  productionStyleLabel: string;
  isChillFiltered: boolean;
  isLimitedEdition: boolean;
  isAllocated: boolean;
  totalBottlesProduced: number | null;

  nose: string | null;
  palate: string | null;
  finish: string | null;
  flavorTags: string[];
  servingSuggestion: string | null;
  foodPairings: string | null;

  rating: number;
  reviewCount: number;
  availabilityLabel: string | null;

  videoUrl: string | null;

  category: { name: string; slug: string };
  images: { url: string; alt: string | null }[];
  awards: {
    id: string;
    name: string;
    organization: string | null;
    year: number | null;
    medal: string | null;
  }[];
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[...Array(5)].map((_, i) => (
        <svg
          key={i}
          className={`w-4 h-4 ${i < Math.floor(rating) ? "text-bourbon-gold" : "text-bourbon-stone/30"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

function Spec({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="border-b border-bourbon-deep/10 py-3 flex items-baseline justify-between gap-4">
      <span className="text-bourbon-stone text-xs tracking-widest uppercase">{label}</span>
      <span className="text-bourbon-deep text-sm font-medium text-right">{value}</span>
    </div>
  );
}

const TABS = ["Tasting", "Specs", "Provenance"] as const;
type Tab = (typeof TABS)[number];

export default function ProductDetailClient({ product }: { product: ProductDetailData }) {
  const { addItem, openCart } = useCart();
  const { showToast } = useToast();

  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [qty, setQty] = useState(1);

  // Bottle-only allocation: no case offered. Default selection to "bottle"
  // up front so the buyer never has to make a meaningless choice.
  const isBottleOnly =
    product.casePrice === null || product.bottlesPerCase === null;
  const [purchaseUnit, setPurchaseUnit] = useState<"bottle" | "case" | null>(
    isBottleOnly ? "bottle" : null
  );
  const [tab, setTab] = useState<Tab>("Tasting");
  const [videoOpen, setVideoOpen] = useState(false);

  const activeImage = product.images[activeImageIdx] ?? product.images[0];
  const videoPosterUrl = product.images[0]?.url;

  const hasSelection = purchaseUnit !== null;
  const unitPrice =
    purchaseUnit === "case" && product.casePrice !== null
      ? product.casePrice
      : product.bottlePrice;
  const unitLabel =
    purchaseUnit === "case" && product.bottlesPerCase !== null
      ? `Case (${product.bottlesPerCase})`
      : "Bottle";

  const perBottleInCase =
    product.casePrice !== null && product.bottlesPerCase
      ? product.casePrice / product.bottlesPerCase
      : null;
  const caseSavings =
    product.casePrice !== null && product.bottlesPerCase
      ? Math.max(
          0,
          product.bottlePrice * product.bottlesPerCase - product.casePrice
        )
      : 0;

  const handleAdd = () => {
    if (!hasSelection || !activeImage) return;
    addItem(
      {
        id:
          purchaseUnit === "case"
            ? `${product.id}::case`
            : product.id,
        name:
          purchaseUnit === "case" && product.bottlesPerCase
            ? `${product.name} — Case of ${product.bottlesPerCase}`
            : product.name,
        price: unitPrice,
        image: activeImage.url,
        age: product.ageLabel,
      },
      qty
    );
    showToast(
      purchaseUnit === "case" ? `${product.name} (Case)` : product.name,
      activeImage.url,
      unitPrice
    );
  };

  const mashBill = [
    { label: "Corn", value: product.cornPercent },
    { label: "Rye", value: product.ryePercent },
    { label: "Wheat", value: product.wheatPercent },
    { label: "Malted Barley", value: product.maltedBarleyPct },
  ].filter((m): m is { label: string; value: number } => m.value !== null);

  return (
    <main className="bg-bourbon-cream min-h-screen pt-24 sm:pt-32 pb-12 sm:pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-6 sm:mb-8 text-[10px] sm:text-xs tracking-widest uppercase text-bourbon-stone/70 flex items-center gap-1.5 sm:gap-2 overflow-x-auto whitespace-nowrap pb-1">
          <a href="/" className="hover:text-bourbon-gold transition-colors">Home</a>
          <span>/</span>
          <a href="/shop" className="hover:text-bourbon-gold transition-colors">Shop</a>
          <span>/</span>
          <a
            href={`/shop?category=${product.category.slug}`}
            className="hover:text-bourbon-gold transition-colors"
          >
            {product.category.name}
          </a>
          <span>/</span>
          <span className="text-bourbon-deep truncate">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
          {/* Gallery */}
          <div>
            <motion.div
              key={activeImageIdx}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="relative aspect-square bg-bourbon-deep/5 overflow-hidden"
            >
              {activeImage && (
                <Image
                  src={activeImage.url}
                  alt={activeImage.alt ?? product.name}
                  fill
                  priority
                  className="object-contain p-6 sm:p-8"
                  sizes="(min-width: 1024px) 50vw, 100vw"
                />
              )}
              {product.badge && (
                <span className="absolute top-4 left-4 px-3 py-1 bg-bourbon-gold text-bourbon-deep text-xs font-semibold tracking-wider uppercase">
                  {product.badge}
                </span>
              )}
              {product.availabilityLabel && (
                <span className="absolute top-4 right-4 px-3 py-1 bg-bourbon-deep/90 text-bourbon-cream text-[10px] font-semibold tracking-wider uppercase">
                  {product.availabilityLabel}
                </span>
              )}
            </motion.div>

            {(product.images.length > 1 || product.videoUrl) && (
              <div className="mt-3 sm:mt-4 grid grid-cols-5 gap-2 sm:gap-3">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImageIdx(i)}
                    className={`relative aspect-square overflow-hidden bg-bourbon-deep/5 border-2 transition-all cursor-pointer ${
                      i === activeImageIdx
                        ? "border-bourbon-gold"
                        : "border-transparent hover:border-bourbon-gold/40"
                    }`}
                  >
                    <Image src={img.url} alt={img.alt ?? ""} fill className="object-contain p-1.5" sizes="120px" />
                  </button>
                ))}
                {product.videoUrl && videoPosterUrl && (
                  <button
                    onClick={() => setVideoOpen(true)}
                    aria-label="Play product video"
                    className="relative aspect-square overflow-hidden bg-bourbon-deep border-2 border-transparent hover:border-bourbon-gold/40 transition-all cursor-pointer group"
                  >
                    <Image
                      src={videoPosterUrl}
                      alt="Watch product video"
                      fill
                      className="object-cover opacity-50 group-hover:opacity-70 transition-opacity"
                      sizes="120px"
                    />
                    <span className="absolute inset-0 flex items-center justify-center">
                      <span className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-bourbon-gold text-bourbon-deep shadow-lg group-hover:scale-110 transition-transform">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M6.3 2.841A1 1 0 004.8 3.7v12.6a1 1 0 001.5.859l11-6.3a1 1 0 000-1.718l-11-6.3z" />
                        </svg>
                      </span>
                    </span>
                    <span className="absolute bottom-1 left-1 right-1 text-[9px] tracking-widest uppercase text-bourbon-cream font-semibold text-center pointer-events-none">
                      Video
                    </span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex flex-col">
            <p className="text-bourbon-gold text-[10px] sm:text-xs tracking-[0.3em] uppercase mb-2 sm:mb-3">
              {product.productionStyleLabel}
            </p>
            <h1 className="font-[family-name:var(--font-playfair)] text-3xl sm:text-4xl md:text-5xl font-bold text-bourbon-deep leading-tight mb-2">
              {product.name}
            </h1>
            {product.subtitle && (
              <p className="text-bourbon-stone text-base sm:text-lg mb-4">{product.subtitle}</p>
            )}

            {product.reviewCount > 0 && (
              <div className="flex items-center gap-2 mb-5 sm:mb-6">
                <StarRating rating={product.rating} />
                <span className="text-bourbon-stone text-sm">
                  {product.rating.toFixed(1)} ({product.reviewCount} reviews)
                </span>
              </div>
            )}

            {/* Quick stats */}
            <div className="grid grid-cols-3 gap-3 sm:gap-4 py-4 sm:py-5 border-y border-bourbon-deep/10 mb-5 sm:mb-6">
              <div>
                <p className="text-bourbon-stone text-[10px] tracking-widest uppercase">Age</p>
                <p className="font-[family-name:var(--font-playfair)] text-bourbon-deep text-xl sm:text-2xl font-bold">
                  {product.ageLabel}
                </p>
              </div>
              <div>
                <p className="text-bourbon-stone text-[10px] tracking-widest uppercase">Proof</p>
                <p className="font-[family-name:var(--font-playfair)] text-bourbon-deep text-xl sm:text-2xl font-bold">
                  {product.proof.toFixed(1)}
                </p>
              </div>
              <div>
                <p className="text-bourbon-stone text-[10px] tracking-widest uppercase">ABV</p>
                <p className="font-[family-name:var(--font-playfair)] text-bourbon-deep text-xl sm:text-2xl font-bold">
                  {product.abv.toFixed(1)}%
                </p>
              </div>
            </div>

            <p className="text-bourbon-stone leading-relaxed mb-5 sm:mb-6 text-sm sm:text-base">
              {product.description}
            </p>

            {/* Price + buy */}
            <div className="bg-white border border-bourbon-deep/10 p-4 sm:p-6 mb-6">
              {isBottleOnly ? (
                /* Bottle-only allocation — premium, no chooser */
                <>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="h-px flex-1 bg-bourbon-gold/40" />
                    <span className="text-bourbon-gold text-[10px] tracking-[0.3em] uppercase font-semibold">
                      Bottle-Only Allocation
                    </span>
                    <span className="h-px flex-1 bg-bourbon-gold/40" />
                  </div>
                  <p className="text-bourbon-deep text-sm sm:text-base leading-relaxed mb-5 text-center">
                    Released by the bottle, never by the case. Pour for pour, hand-poured into your glass — not a pallet.
                  </p>

                  <div className="relative bg-gradient-to-br from-bourbon-deep to-bourbon-deep/90 text-bourbon-cream p-5 sm:p-7 mb-5 overflow-hidden">
                    <div
                      className="absolute inset-0 opacity-10"
                      style={{
                        backgroundImage:
                          "radial-gradient(circle at 30% 20%, rgba(212,175,55,0.6), transparent 60%)",
                      }}
                      aria-hidden
                    />
                    <p className="relative text-bourbon-gold text-[10px] tracking-[0.3em] uppercase mb-2">
                      Single Bottle · {product.bottleSizeMl}ml
                    </p>
                    <div className="relative flex items-baseline gap-3">
                      <p className="font-[family-name:var(--font-playfair)] text-4xl sm:text-5xl font-bold leading-none">
                        ${product.bottlePrice.toFixed(2)}
                      </p>
                      {product.compareAtPrice && (
                        <p className="text-bourbon-cream/50 text-sm sm:text-base line-through">
                          ${product.compareAtPrice.toFixed(2)}
                        </p>
                      )}
                    </div>
                    <p className="relative text-bourbon-cream/70 text-xs sm:text-sm mt-3">
                      {product.proof.toFixed(1)} proof · {product.ageLabel} · shipped in a single signature carton
                    </p>
                  </div>
                </>
              ) : (
                /* Bottle + case flow */
                <>
                  <p className="text-bourbon-deep text-sm sm:text-base leading-relaxed mb-4 sm:mb-5">
                    <span className="font-semibold">
                      {product.bottlesPerCase} bottles in a case of {product.name}
                    </span>{" "}
                    — <span className="text-bourbon-gold font-bold">${product.bottlePrice.toFixed(0)}</span>{" "}
                    for a bottle,{" "}
                    <span className="text-bourbon-gold font-bold">${product.casePrice!.toFixed(0)}</span>{" "}
                    if you take the case.
                  </p>

                  {/* Selection prompt */}
                  <div className="mb-3 flex items-center gap-2">
                    <span
                      className={`flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold transition-colors ${
                        hasSelection
                          ? "bg-bourbon-gold text-bourbon-deep"
                          : "bg-bourbon-deep text-bourbon-cream"
                      }`}
                      aria-hidden
                    >
                      {hasSelection ? "✓" : "1"}
                    </span>
                    <p
                      className={`text-xs tracking-widest uppercase font-semibold ${
                        hasSelection ? "text-bourbon-stone" : "text-bourbon-deep"
                      }`}
                    >
                      {hasSelection ? "Option selected" : "Choose bottle or case"}
                    </p>
                  </div>

                  {/* Two big selectable price cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                    <button
                      onClick={() => setPurchaseUnit("bottle")}
                      aria-pressed={purchaseUnit === "bottle"}
                      className={`relative p-3 sm:p-5 border-2 text-left transition-all cursor-pointer ${
                        purchaseUnit === "bottle"
                          ? "border-bourbon-gold bg-bourbon-gold/5"
                          : "border-bourbon-deep/10 hover:border-bourbon-deep/30"
                      }`}
                    >
                      <p className="text-[10px] tracking-widest uppercase text-bourbon-stone mb-1.5 sm:mb-2">
                        Single Bottle
                      </p>
                      <p className="font-[family-name:var(--font-playfair)] text-2xl sm:text-3xl font-bold text-bourbon-deep leading-none">
                        ${product.bottlePrice.toFixed(2)}
                      </p>
                      {product.compareAtPrice && (
                        <p className="text-bourbon-stone/60 text-xs sm:text-sm line-through mt-1">
                          ${product.compareAtPrice.toFixed(2)}
                        </p>
                      )}
                      <p className="text-bourbon-stone text-[11px] sm:text-xs mt-1.5 sm:mt-2">
                        {product.bottleSizeMl}ml bottle
                      </p>
                    </button>

                    <button
                      onClick={() => setPurchaseUnit("case")}
                      aria-pressed={purchaseUnit === "case"}
                      className={`relative p-3 sm:p-5 border-2 text-left transition-all cursor-pointer ${
                        purchaseUnit === "case"
                          ? "border-bourbon-gold bg-bourbon-gold/5"
                          : "border-bourbon-deep/10 hover:border-bourbon-deep/30"
                      }`}
                    >
                      {caseSavings > 0 && (
                        <span className="absolute -top-2 -right-2 px-2 py-0.5 sm:py-1 bg-bourbon-gold text-bourbon-deep text-[9px] sm:text-[10px] font-bold tracking-widest uppercase">
                          Save ${caseSavings.toFixed(0)}
                        </span>
                      )}
                      <p className="text-[10px] tracking-widest uppercase text-bourbon-stone mb-1.5 sm:mb-2">
                        Case of {product.bottlesPerCase}
                      </p>
                      <p className="font-[family-name:var(--font-playfair)] text-2xl sm:text-3xl font-bold text-bourbon-deep leading-none">
                        ${product.casePrice!.toFixed(2)}
                      </p>
                      <p className="text-bourbon-stone text-[11px] sm:text-xs mt-1.5 sm:mt-2">
                        ${perBottleInCase!.toFixed(2)} per bottle
                      </p>
                    </button>
                  </div>
                </>
              )}

              {/* Qty + Add */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex items-center border border-bourbon-deep/15 self-start sm:self-auto">
                  <button
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="w-11 h-12 text-bourbon-deep hover:bg-bourbon-deep/5 transition-colors cursor-pointer"
                    aria-label="Decrease quantity"
                  >
                    −
                  </button>
                  <span className="w-10 text-center text-bourbon-deep font-semibold">{qty}</span>
                  <button
                    onClick={() => setQty((q) => q + 1)}
                    className="w-11 h-12 text-bourbon-deep hover:bg-bourbon-deep/5 transition-colors cursor-pointer"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
                <button
                  onClick={handleAdd}
                  disabled={!hasSelection}
                  className={`flex-1 px-3 py-3 sm:py-0 font-semibold tracking-widest uppercase text-xs transition-colors ${
                    hasSelection
                      ? "bg-bourbon-gold text-bourbon-deep hover:bg-bourbon-amber cursor-pointer"
                      : "bg-bourbon-deep/10 text-bourbon-deep/50 cursor-not-allowed"
                  }`}
                >
                  {hasSelection
                    ? `Add ${qty} ${unitLabel}${qty > 1 ? "s" : ""} — $${(unitPrice * qty).toFixed(2)}`
                    : "Select Bottle or Case"}
                </button>
              </div>

              <button
                onClick={() => {
                  if (!hasSelection) return;
                  handleAdd();
                  openCart();
                }}
                disabled={!hasSelection}
                className={`w-full mt-3 py-3 border font-semibold tracking-widest uppercase text-xs transition-all ${
                  hasSelection
                    ? "border-bourbon-deep text-bourbon-deep hover:bg-bourbon-deep hover:text-bourbon-cream cursor-pointer"
                    : "border-bourbon-deep/20 text-bourbon-deep/40 cursor-not-allowed"
                }`}
              >
                {hasSelection ? "Buy Now" : "Select an option above"}
              </button>
            </div>

            {/* Trust strip */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
              {[
                { icon: "M12 8v4l3 3", title: "21+", sub: "Age Verified" },
                { icon: "M3 10h18M5 10v10h14V10", title: "Discreet", sub: "Packaging" },
                { icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z", title: "Authentic", sub: "Distillery Direct" },
              ].map((item) => (
                <div key={item.title} className="text-bourbon-stone px-1">
                  <svg className="w-6 h-6 sm:w-5 sm:h-5 mx-auto mb-1 text-bourbon-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
                  </svg>
                  <p className="text-bourbon-deep text-xs font-semibold">{item.title}</p>
                  <p className="text-[9px] sm:text-[10px] tracking-wider sm:tracking-widest uppercase leading-tight">{item.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-12 sm:mt-20">
          <div className="border-b border-bourbon-deep/10 flex gap-6 sm:gap-8 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`pb-3 sm:pb-4 text-xs sm:text-sm tracking-widest uppercase font-semibold transition-all cursor-pointer relative whitespace-nowrap ${
                  tab === t ? "text-bourbon-deep" : "text-bourbon-stone hover:text-bourbon-deep"
                }`}
              >
                {t}
                {tab === t && (
                  <motion.span
                    layoutId="pdp-tab-underline"
                    className="absolute -bottom-px left-0 right-0 h-0.5 bg-bourbon-gold"
                  />
                )}
              </button>
            ))}
          </div>

          <div className="py-8 sm:py-10 grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            {tab === "Tasting" && (
              <>
                {[
                  { label: "Nose", value: product.nose },
                  { label: "Palate", value: product.palate },
                  { label: "Finish", value: product.finish },
                ].map((note) =>
                  note.value ? (
                    <div key={note.label} className="bg-white border border-bourbon-deep/5 p-6">
                      <p className="text-bourbon-gold text-[10px] tracking-[0.3em] uppercase mb-3">
                        {note.label}
                      </p>
                      <p className="text-bourbon-deep leading-relaxed">{note.value}</p>
                    </div>
                  ) : null
                )}
                {product.flavorTags.length > 0 && (
                  <div className="lg:col-span-3">
                    <p className="text-bourbon-stone text-xs tracking-widest uppercase mb-3">Flavor</p>
                    <div className="flex flex-wrap gap-2">
                      {product.flavorTags.map((tag) => (
                        <span
                          key={tag}
                          className="px-4 py-2 bg-bourbon-deep/5 text-bourbon-deep text-sm capitalize"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {(product.servingSuggestion || product.foodPairings) && (
                  <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {product.servingSuggestion && (
                      <div>
                        <p className="text-bourbon-stone text-xs tracking-widest uppercase mb-2">
                          Serving Suggestion
                        </p>
                        <p className="text-bourbon-deep">{product.servingSuggestion}</p>
                      </div>
                    )}
                    {product.foodPairings && (
                      <div>
                        <p className="text-bourbon-stone text-xs tracking-widest uppercase mb-2">
                          Food Pairings
                        </p>
                        <p className="text-bourbon-deep">{product.foodPairings}</p>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {tab === "Specs" && (
              <>
                <div>
                  <p className="font-[family-name:var(--font-playfair)] text-bourbon-deep text-xl font-semibold mb-4">
                    Bottle
                  </p>
                  <Spec label="Age" value={product.ageLabel} />
                  <Spec label="Proof" value={product.proof.toFixed(1)} />
                  <Spec label="ABV" value={`${product.abv.toFixed(1)}%`} />
                  <Spec label="Bottle Size" value={`${product.bottleSizeMl}ml`} />
                  <Spec
                    label="Chill Filtered"
                    value={product.isChillFiltered ? "Yes" : "No"}
                  />
                  {product.totalBottlesProduced && (
                    <Spec
                      label="Bottles Produced"
                      value={product.totalBottlesProduced.toLocaleString()}
                    />
                  )}
                </div>
                {mashBill.length > 0 && (
                  <div>
                    <p className="font-[family-name:var(--font-playfair)] text-bourbon-deep text-xl font-semibold mb-4">
                      Mash Bill
                    </p>
                    <div className="space-y-3">
                      {mashBill.map((m) => (
                        <div key={m.label}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-bourbon-deep">{m.label}</span>
                            <span className="text-bourbon-stone">{m.value}%</span>
                          </div>
                          <div className="h-1.5 bg-bourbon-deep/5 overflow-hidden">
                            <div
                              className="h-full bg-bourbon-gold"
                              style={{ width: `${m.value}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <p className="font-[family-name:var(--font-playfair)] text-bourbon-deep text-xl font-semibold mb-4">
                    Cask
                  </p>
                  <Spec label="Cask Type" value={product.caskType} />
                  <Spec label="Char Level" value={product.charLevel} />
                  <Spec label="Finish Cask" value={product.finishCask} />
                  <Spec label="Batch" value={product.batchNumber} />
                  <Spec label="Barrel" value={product.barrelNumber} />
                </div>
              </>
            )}

            {tab === "Provenance" && (
              <>
                <div className="lg:col-span-2">
                  <p className="font-[family-name:var(--font-playfair)] text-bourbon-deep text-xl font-semibold mb-4">
                    The Story
                  </p>
                  <p className="text-bourbon-stone leading-relaxed mb-6">
                    {product.story ?? product.description}
                  </p>
                  {product.awards.length > 0 && (
                    <>
                      <p className="text-bourbon-stone text-xs tracking-widest uppercase mb-3 mt-8">
                        Awards
                      </p>
                      <ul className="space-y-3">
                        {product.awards.map((a) => (
                          <li
                            key={a.id}
                            className="flex items-start gap-3 bg-white border border-bourbon-deep/5 p-4"
                          >
                            <svg
                              className="w-6 h-6 text-bourbon-gold flex-shrink-0"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            <div>
                              <p className="text-bourbon-deep font-semibold">{a.medal ? `${a.medal} — ` : ""}{a.name}</p>
                              {(a.organization || a.year) && (
                                <p className="text-bourbon-stone text-sm">
                                  {a.organization}
                                  {a.organization && a.year ? " · " : ""}
                                  {a.year}
                                </p>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
                <div>
                  <p className="font-[family-name:var(--font-playfair)] text-bourbon-deep text-xl font-semibold mb-4">
                    Distillery
                  </p>
                  <Spec label="Distillery" value={product.distillery} />
                  <Spec label="Region" value={product.region} />
                  <Spec label="State" value={product.state} />
                  <Spec label="Master Distiller" value={product.masterDistiller} />
                  <Spec label="Release Year" value={product.releaseYear} />
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {product.videoUrl && (
        <VideoModal
          open={videoOpen}
          onClose={() => setVideoOpen(false)}
          videoUrl={product.videoUrl}
          title={product.name}
        />
      )}
    </main>
  );
}
