"use client";

import { motion } from "framer-motion";

const awards = [
  { name: "San Francisco World Spirits", year: "Double Gold 2024" },
  { name: "Kentucky Bourbon Trail", year: "Certified" },
  { name: "Whisky Advocate", year: "Top 20 2024" },
  { name: "American Distilling Institute", year: "Gold Medal" },
  { name: "International Wine & Spirit", year: "Outstanding" },
  { name: "Jim Murray's Whisky Bible", year: "95 Points" },
];

export default function BrandStrip() {
  return (
    <section className="bg-bourbon-dark border-y border-bourbon-gold/10 py-8 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center text-bourbon-cream/40 text-[10px] sm:text-xs tracking-[0.25em] sm:tracking-[0.3em] uppercase mb-6"
        >
          Award-Winning Bourbon Since 1876
        </motion.p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:flex lg:flex-wrap items-center justify-center gap-x-4 gap-y-6 sm:gap-x-8 md:gap-12">
          {awards.map((award, i) => (
            <motion.div
              key={award.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="flex flex-col items-center text-center group"
            >
              <span className="text-bourbon-cream/50 text-xs sm:text-sm font-medium tracking-wide group-hover:text-bourbon-gold transition-colors duration-300">
                {award.name}
              </span>
              <span className="text-bourbon-gold/60 text-[10px] sm:text-xs tracking-wider mt-1">
                {award.year}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
