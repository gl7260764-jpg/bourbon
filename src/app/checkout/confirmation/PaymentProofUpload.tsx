"use client";

import { useRef, useState } from "react";

type Status = "idle" | "uploading" | "done" | "error";

export default function PaymentProofUpload({
  orderNumber,
  alreadyUploaded,
}: {
  orderNumber: string;
  /** True when a receipt is already on file, so the copy invites a replacement. */
  alreadyUploaded: boolean;
}) {
  const [status, setStatus] = useState<Status>(alreadyUploaded ? "done" : "idle");
  const [message, setMessage] = useState<string>("");
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    setStatus("uploading");
    setMessage("");

    // Local preview so the buyer can see what they picked without us having to
    // serve the private image back to them.
    try {
      setPreview(URL.createObjectURL(file));
    } catch {
      // Non-fatal.
    }

    const body = new FormData();
    body.set("file", file);

    try {
      const res = await fetch(
        `/api/orders/${encodeURIComponent(orderNumber)}/proof`,
        { method: "POST", body },
      );
      const data = (await res.json().catch(() => ({}))) as { error?: string };

      if (!res.ok) {
        setStatus("error");
        setMessage(data.error ?? "Upload failed. Please try again.");
        return;
      }

      setStatus("done");
      setMessage("Receipt received — we'll confirm your payment shortly.");
    } catch {
      setStatus("error");
      setMessage(
        "Network error. Please try again, or reply to your confirmation email with the screenshot.",
      );
    }
  }

  return (
    <div className="mt-5 pt-5 border-t border-bourbon-deep/10">
      <p className="text-bourbon-gold text-[10px] tracking-[0.3em] uppercase mb-2">
        {status === "done" ? "Receipt received" : "Send your receipt"}
      </p>

      {status === "done" ? (
        <>
          <p className="text-bourbon-stone text-sm mb-3">
            {message ||
              "We have your payment screenshot on file and will confirm shortly."}
          </p>
          {preview && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={preview}
              alt="Your uploaded receipt"
              className="max-h-40 border border-bourbon-deep/10 mb-3"
            />
          )}
          <button
            type="button"
            onClick={() => {
              setStatus("idle");
              setMessage("");
            }}
            className="text-bourbon-stone hover:text-bourbon-deep text-xs tracking-widest uppercase transition-colors cursor-pointer"
          >
            Upload a different screenshot
          </button>
        </>
      ) : (
        <>
          <p className="text-bourbon-stone text-sm mb-3">
            Once you&apos;ve sent the payment, upload a screenshot of the
            confirmation here. It speeds things up — we match it to your order
            and ship as soon as it clears.
          </p>

          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) upload(file);
            }}
          />

          <button
            type="button"
            disabled={status === "uploading"}
            onClick={() => inputRef.current?.click()}
            className="px-6 py-3 bg-bourbon-gold text-bourbon-deep font-semibold tracking-wider uppercase text-xs hover:bg-bourbon-amber transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {status === "uploading" ? "Uploading…" : "Upload payment screenshot"}
          </button>

          {status === "error" && (
            <p className="text-red-600 text-sm mt-3">{message}</p>
          )}

          <p className="text-bourbon-stone text-xs mt-3">
            JPG, PNG, WebP, GIF or AVIF · up to 8 MB. Your receipt is stored
            privately and only visible to our team.
          </p>
        </>
      )}
    </div>
  );
}
