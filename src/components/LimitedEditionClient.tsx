"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

export interface LimitedEditionCard {
  id: string;
  name: string;
  ageLabel: string;
  price: number;
  compareAtPrice: number | null;
  proof: number;
  image: string;
  totalBottles: number | null;
  rating: number;
  description: string;
  categoryName: string;
  categorySlug: string;
}

export default function LimitedEditionClient({
  product,
}: {
  product: LimitedEditionCard;
}) {
  const ratingDisplay = Math.round(product.rating * 20);
  const shopHref = `/shop?category=${product.categorySlug}`;

  return (
    <section className="relative overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-2 lg:min-h-[600px]">
        <div className="relative bg-bourbon-deep flex items-center justify-center p-6 sm:p-10 lg:p-20 overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <Image
              src="https://images.unsplash.com/photo-1558642452-9d2a7deb7f62?w=800&q=60"
              alt=""
              fill
              className="object-cover"
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-br from-bourbon-deep via-bourbon-deep/95 to-bourbon-dark" />

          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative z-10 w-full max-w-xl"
          >
            <motion.span
              initial={{ width: 0 }}
              whileInView={{ width: "3rem" }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="block h-0.5 bg-bourbon-gold mb-6"
            />
            <p className="text-bourbon-gold text-xs tracking-[0.4em] uppercase mb-4">
              {product.totalBottles
                ? `Only ${product.totalBottles.toLocaleString()} Bottles a Year`
                : "Heavily Allocated"}
            </p>
            <h2 className="font-[family-name:var(--font-playfair)] text-4xl sm:text-5xl md:text-7xl font-bold text-bourbon-cream leading-none mb-2">
              Pappy
            </h2>
            <h2 className="font-[family-name:var(--font-playfair)] text-4xl sm:text-5xl md:text-7xl font-bold text-bourbon-gold leading-none mb-6">
              Van Winkle
            </h2>
            <p className="text-bourbon-cream/60 text-base sm:text-lg max-w-md mb-8 leading-relaxed">
              {product.description}
            </p>

            <div className="flex flex-wrap items-center gap-4 sm:gap-6 mb-8">
              <div>
                <span className="block text-bourbon-gold text-3xl font-[family-name:var(--font-playfair)] font-bold">
                  ${product.price.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
                {product.compareAtPrice && (
                  <span className="text-bourbon-cream/40 text-sm line-through">
                    ${product.compareAtPrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                )}
              </div>
              <div className="w-px h-12 bg-bourbon-gold/30 hidden sm:block" />
              <div>
                <span className="block text-bourbon-cream text-sm font-semibold">
                  {product.ageLabel} Aged
                </span>
                <span className="text-bourbon-cream/50 text-xs">
                  {product.proof.toFixed(1)} Proof · Wheated
                </span>
              </div>
            </div>

            <Link
              href={shopHref}
              aria-label={`Shop the ${product.categoryName} collection`}
              className="group inline-flex w-full sm:w-auto justify-center items-center gap-3 px-6 sm:px-10 py-4 bg-bourbon-gold text-bourbon-deep font-semibold tracking-wider uppercase text-sm hover:bg-bourbon-amber transition-all duration-300 cursor-pointer"
            >
              Shop the Pappy Collection
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </motion.div>

          <span className="absolute -bottom-6 -left-4 font-[family-name:var(--font-playfair)] text-[10rem] font-bold text-bourbon-cream/[0.02] uppercase leading-none pointer-events-none">
            PAPPY
          </span>
        </div>

        <Link
          href={shopHref}
          aria-label={`Shop the ${product.categoryName} collection`}
          className="relative min-h-[300px] sm:min-h-[400px] lg:min-h-full block group"
        >
          <motion.div
            initial={{ opacity: 0, scale: 1.1 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0"
          >
            <Image
              src={product.image}
              alt={product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-l from-transparent to-bourbon-deep/20 group-hover:to-bourbon-deep/30 transition-colors" />

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
              className="absolute bottom-4 right-4 sm:bottom-8 sm:right-8 bg-bourbon-deep/90 backdrop-blur-sm p-4 sm:p-6 border border-bourbon-gold/30"
            >
              <div className="text-center">
                <span className="text-bourbon-gold text-[10px] sm:text-xs tracking-[0.2em] uppercase block mb-1">
                  Rated
                </span>
                <span className="font-[family-name:var(--font-playfair)] text-3xl sm:text-4xl font-bold text-bourbon-cream">
                  {ratingDisplay}
                </span>
                <span className="text-bourbon-cream/60 text-xs sm:text-sm block">Points</span>
              </div>
            </motion.div>
          </motion.div>
        </Link>
      </div>
    </section>
  );
}
