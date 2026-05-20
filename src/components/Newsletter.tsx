"use client";

import { motion } from "framer-motion";

export default function Newsletter() {
  return (
    <section className="relative py-12 sm:py-20 bg-bourbon-deep overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-bourbon-deep via-bourbon-dark to-bourbon-deep" />

      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-bourbon-gold/30 to-transparent" />

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7 }}
        className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
      >
        <span className="text-bourbon-gold text-[10px] sm:text-xs tracking-[0.25em] sm:tracking-[0.3em] uppercase">
          Stay Connected
        </span>
        <h2 className="font-[family-name:var(--font-playfair)] text-3xl sm:text-4xl md:text-5xl font-bold text-bourbon-cream mt-3 mb-4">
          Join the Inner Circle
        </h2>
        <div className="w-16 sm:w-20 h-0.5 bg-bourbon-gold mx-auto mb-6" />
        <p className="text-bourbon-cream/60 text-sm sm:text-lg mb-8 sm:mb-10">
          Be the first to know about new releases, limited editions, exclusive
          tastings, and distillery events. Members receive 10% off their first order.
        </p>

        <form
          onSubmit={(e) => e.preventDefault()}
          className="flex flex-col sm:flex-row gap-3 sm:gap-4 max-w-lg mx-auto"
        >
          <input
            type="email"
            placeholder="Enter your email"
            className="flex-1 px-4 sm:px-6 py-3 sm:py-4 bg-bourbon-cream/5 border border-bourbon-cream/20 text-bourbon-cream placeholder:text-bourbon-cream/30 focus:outline-none focus:border-bourbon-gold transition-colors text-sm tracking-wide"
          />
          <button
            type="submit"
            className="px-6 sm:px-8 py-3 sm:py-4 bg-bourbon-gold text-bourbon-deep font-semibold tracking-wider uppercase text-sm hover:bg-bourbon-amber transition-colors duration-300 whitespace-nowrap"
          >
            Subscribe
          </button>
        </form>

        <p className="text-bourbon-cream/30 text-[10px] sm:text-xs mt-4 sm:mt-6">
          By subscribing, you confirm you are 21+ and agree to our privacy policy.
        </p>
      </motion.div>

      {/* Background text */}
      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 font-[family-name:var(--font-playfair)] text-[10rem] md:text-[16rem] font-bold text-bourbon-cream/[0.015] uppercase leading-none pointer-events-none whitespace-nowrap">
        B&O
      </span>
    </section>
  );
}
