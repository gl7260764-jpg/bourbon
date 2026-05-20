"use client";

import { useRef, useState, useTransition } from "react";
import {
  addProductImage,
  removeProductImage,
  setPrimaryProductImage,
} from "./actions";

type GalleryImage = {
  id: string;
  url: string;
  alt: string | null;
  sortOrder: number;
  isPrimary: boolean;
};

type Props = {
  productId: string;
  images: GalleryImage[];
};

const ACCEPT = "image/jpeg,image/png,image/webp,image/gif,image/avif";
const MAX_BYTES = 8 * 1024 * 1024;

export default function ProductGalleryManager({ productId, images }: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyImageId, setBusyImageId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function pickFile() {
    if (progress !== null) return;
    setError(null);
    fileInputRef.current?.click();
  }

  function handleFileSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file (JPG, PNG, WebP, GIF or AVIF).");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError(
        `File is too large. Maximum size is ${(MAX_BYTES / (1024 * 1024)).toFixed(0)} MB.`
      );
      return;
    }

    uploadAndAttach(file);
  }

  function uploadAndAttach(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "products");

    const xhr = new XMLHttpRequest();
    xhrRef.current = xhr;
    xhr.open("POST", "/api/admin/upload");

    xhr.upload.onprogress = (e) => {
      if (!e.lengthComputable) return;
      setProgress(Math.round((e.loaded / e.total) * 100));
    };

    xhr.onload = () => {
      xhrRef.current = null;
      let payload: { url?: string; error?: string } | null = null;
      try {
        payload = JSON.parse(xhr.responseText);
      } catch {
        /* handled below */
      }

      if (xhr.status >= 200 && xhr.status < 300 && payload?.url) {
        const url = payload.url;
        startTransition(async () => {
          try {
            await addProductImage(productId, url);
            setProgress(null);
          } catch (err) {
            setError(
              err instanceof Error
                ? err.message
                : "Failed to attach image to product."
            );
            setProgress(null);
          }
        });
        return;
      }

      setError(
        payload?.error ?? `Upload failed (HTTP ${xhr.status}).`
      );
      setProgress(null);
    };

    xhr.onerror = () => {
      xhrRef.current = null;
      setError("Network error while uploading. Check your connection and retry.");
      setProgress(null);
    };

    xhr.onabort = () => {
      xhrRef.current = null;
      setProgress(null);
    };

    setProgress(0);
    xhr.send(formData);
  }

  function handleRemove(image: GalleryImage) {
    if (!confirm("Remove this image from the gallery?")) return;
    setBusyImageId(image.id);
    setError(null);
    startTransition(async () => {
      try {
        await removeProductImage(productId, image.id);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to remove image.");
      } finally {
        setBusyImageId(null);
      }
    });
  }

  function handleSetPrimary(image: GalleryImage) {
    if (image.isPrimary) return;
    setBusyImageId(image.id);
    setError(null);
    startTransition(async () => {
      try {
        await setPrimaryProductImage(productId, image.id);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to set primary image."
        );
      } finally {
        setBusyImageId(null);
      }
    });
  }

  const uploading = progress !== null;

  return (
    <section className="bg-white border border-bourbon-deep/10 mt-8">
      <div className="px-5 py-3 border-b border-bourbon-deep/10 flex items-center justify-between gap-3">
        <div>
          <h2 className="font-[family-name:var(--font-playfair)] text-base font-bold text-bourbon-deep">
            Gallery images
          </h2>
          <p className="text-bourbon-stone text-xs mt-0.5">
            {images.length} image{images.length === 1 ? "" : "s"} · the primary
            image is shown first on the storefront.
          </p>
        </div>
        <button
          type="button"
          onClick={pickFile}
          disabled={uploading || isPending}
          className="px-4 py-2 text-[10px] tracking-widest uppercase bg-bourbon-gold text-white hover:bg-bourbon-amber transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-wait"
        >
          {uploading ? `Uploading ${progress}%` : "+ Add image"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPT}
          onChange={handleFileSelected}
          className="hidden"
        />
      </div>

      {uploading && (
        <div className="h-1 w-full bg-bourbon-deep/10 overflow-hidden">
          <div
            className="h-full bg-bourbon-gold transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {error && (
        <p className="px-5 py-2 text-red-700 text-xs bg-red-50 border-b border-red-200">
          {error}
        </p>
      )}

      <div className="p-5">
        {images.length === 0 ? (
          <p className="text-bourbon-stone text-sm">
            No images yet. Click <span className="font-semibold">+ Add image</span>{" "}
            to upload one — the first image you add will be set as the primary.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {images.map((img) => {
              const busy = busyImageId === img.id && isPending;
              return (
                <div
                  key={img.id}
                  className={`relative group border ${
                    img.isPrimary
                      ? "border-bourbon-gold ring-2 ring-bourbon-gold/30"
                      : "border-bourbon-deep/15"
                  } bg-bourbon-warm/30`}
                >
                  <div className="aspect-square overflow-hidden bg-bourbon-deep/5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.url}
                      alt={img.alt ?? "Product image"}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {img.isPrimary && (
                    <span className="absolute top-2 left-2 px-2 py-0.5 bg-bourbon-gold text-white text-[9px] tracking-widest uppercase font-bold">
                      Primary
                    </span>
                  )}

                  {busy && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <span className="text-white text-[10px] tracking-widest uppercase">
                        Working…
                      </span>
                    </div>
                  )}

                  <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1">
                    {!img.isPrimary && (
                      <button
                        type="button"
                        onClick={() => handleSetPrimary(img)}
                        disabled={isPending}
                        className="px-2 py-1 text-[9px] tracking-widest uppercase bg-white text-bourbon-deep hover:bg-bourbon-gold hover:text-white transition-colors cursor-pointer disabled:opacity-50"
                      >
                        Make primary
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemove(img)}
                      disabled={isPending}
                      className="px-2 py-1 text-[9px] tracking-widest uppercase bg-red-700 text-white hover:bg-red-800 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
