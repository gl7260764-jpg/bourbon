"use client";

import { FormEvent, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Status = "idle" | "submitting" | "success" | "error";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string>("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "submitting") return;

    setStatus("submitting");
    setMessage("");

    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "homepage" }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        ok?: boolean;
      };

      if (!res.ok) {
        setStatus("error");
        setMessage(data.error ?? "Could not subscribe. Please try again.");
        return;
      }

      setStatus("success");
      setMessage("You're on the list. Welcome to the Inner Circle.");
      setEmail("");
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  }

  return (
    <section className="relative py-12 sm:py-20 bg-bourbon-deep overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-bourbon-deep via-bourbon-dark to-bourbon-deep" />

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
          onSubmit={handleSubmit}
          className="flex flex-col sm:flex-row gap-3 sm:gap-4 max-w-lg mx-auto"
        >
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={status === "submitting"}
            placeholder="Enter your email"
            className="flex-1 px-4 sm:px-6 py-3 sm:py-4 bg-bourbon-cream/5 border border-bourbon-cream/20 text-bourbon-cream placeholder:text-bourbon-cream/30 focus:outline-none focus:border-bourbon-gold transition-colors text-sm tracking-wide disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={status === "submitting"}
            className="px-6 sm:px-8 py-3 sm:py-4 bg-bourbon-gold text-bourbon-deep font-semibold tracking-wider uppercase text-sm hover:bg-bourbon-amber transition-colors duration-300 whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
          >
            {status === "submitting" ? "Subscribing..." : "Subscribe"}
          </button>
        </form>

        <AnimatePresence mode="wait">
          {message && (
            <motion.p
              key={message}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`mt-4 text-sm tracking-wide ${
                status === "success" ? "text-bourbon-gold" : "text-red-400"
              }`}
            >
              {message}
            </motion.p>
          )}
        </AnimatePresence>

        <p className="text-bourbon-cream/30 text-[10px] sm:text-xs mt-4 sm:mt-6">
          By subscribing, you confirm you are 21+ and agree to our privacy policy.
        </p>
      </motion.div>

      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 font-[family-name:var(--font-playfair)] text-[10rem] md:text-[16rem] font-bold text-bourbon-cream/[0.015] uppercase leading-none pointer-events-none whitespace-nowrap">
        B&O
      </span>
    </section>
  );
}
