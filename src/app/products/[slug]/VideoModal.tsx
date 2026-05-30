"use client";

import { useEffect } from "react";

interface VideoModalProps {
  open: boolean;
  onClose: () => void;
  videoUrl: string;
  title?: string;
}

function withAutoplay(url: string) {
  try {
    const u = new URL(url);
    u.searchParams.set("autoplay", "1");
    return u.toString();
  } catch {
    return url + (url.includes("?") ? "&" : "?") + "autoplay=1";
  }
}

export default function VideoModal({ open, onClose, videoUrl, title }: VideoModalProps) {
  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-bourbon-deep/80 backdrop-blur-sm p-4"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="animate-pop-in relative w-full max-w-4xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close video"
          className="absolute -top-12 right-0 text-bourbon-cream hover:text-bourbon-gold transition-colors cursor-pointer flex items-center gap-2 text-xs tracking-widest uppercase"
        >
          Close
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="relative w-full aspect-video bg-black overflow-hidden shadow-2xl ring-1 ring-bourbon-gold/30">
          <iframe
            src={withAutoplay(videoUrl)}
            title={title ?? "Product video"}
            className="absolute inset-0 w-full h-full"
            frameBorder={0}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  );
}
