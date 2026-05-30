"use client";

import { useState, useEffect } from "react";

export default function AgeVerification() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("verified") === "true") {
      localStorage.setItem("bourbon-age-verified", "true");
    }
    const verified = localStorage.getItem("bourbon-age-verified");
    if (!verified) {
      setShow(true);
      document.body.style.overflow = "hidden";
    }
  }, []);

  const handleVerify = () => {
    localStorage.setItem("bourbon-age-verified", "true");
    setShow(false);
    document.body.style.overflow = "";
  };

  const handleDeny = () => {
    window.location.href = "https://www.responsibility.org/";
  };

  if (!show) return null;

  return (
    <div className="animate-fade-in fixed inset-0 z-[100] flex items-center justify-center bg-bourbon-deep/95 backdrop-blur-md">
      <div className="animate-pop-in relative max-w-md w-full mx-4 p-10 bg-bourbon-dark border border-bourbon-gold/30 text-center">
        {/* Decorative corners */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-bourbon-gold" />
        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-bourbon-gold" />
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-bourbon-gold" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-bourbon-gold" />

        <div className="mb-6">
          <h2 className="font-[family-name:var(--font-playfair)] text-3xl font-bold text-bourbon-cream mb-1">
            Bourbon & Oak
          </h2>
          <div className="w-16 h-0.5 bg-bourbon-gold mx-auto" />
        </div>

        <p className="text-bourbon-cream/80 text-lg mb-2">
          Welcome to our distillery
        </p>
        <p className="text-bourbon-cream/60 text-sm mb-8">
          You must be of legal drinking age to enter this site.
          <br />
          Are you 21 years of age or older?
        </p>

        <div className="flex gap-4 justify-center">
          <button
            onClick={handleVerify}
            className="px-8 py-3 bg-bourbon-gold text-bourbon-deep font-semibold tracking-wider uppercase text-sm hover:bg-bourbon-amber transition-colors duration-300 cursor-pointer"
          >
            Yes, I Am 21+
          </button>
          <button
            onClick={handleDeny}
            className="px-8 py-3 border border-bourbon-cream/30 text-bourbon-cream/70 font-semibold tracking-wider uppercase text-sm hover:border-bourbon-cream/60 transition-colors duration-300 cursor-pointer"
          >
            No, I&apos;m Not
          </button>
        </div>

        <p className="text-bourbon-cream/40 text-xs mt-8">
          Please drink responsibly. Don&apos;t drink and drive.
        </p>
      </div>
    </div>
  );
}
