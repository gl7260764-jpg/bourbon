"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  name: string;
  folder: "products" | "categories";
  defaultValue?: string | null;
  label?: string;
  helperText?: string;
};

const ACCEPT = "image/jpeg,image/png,image/webp,image/gif,image/avif";
const MAX_BYTES = 8 * 1024 * 1024;

type UploadState =
  | { status: "idle" }
  | { status: "uploading"; progress: number }
  | { status: "error"; message: string };

export default function ImageUploadField({
  name,
  folder,
  defaultValue,
  helperText,
}: Props) {
  const [url, setUrl] = useState<string>(defaultValue ?? "");
  const [state, setState] = useState<UploadState>({ status: "idle" });
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);

  useEffect(() => {
    return () => {
      xhrRef.current?.abort();
    };
  }, []);

  function pickFile() {
    if (state.status === "uploading") return;
    fileInputRef.current?.click();
  }

  function clearImage() {
    if (state.status === "uploading") {
      xhrRef.current?.abort();
    }
    setUrl("");
    setState({ status: "idle" });
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleFileSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setState({
        status: "error",
        message: "Please select an image file (JPG, PNG, WebP, GIF or AVIF).",
      });
      event.target.value = "";
      return;
    }

    if (file.size > MAX_BYTES) {
      setState({
        status: "error",
        message: `File is too large. Maximum size is ${(MAX_BYTES / (1024 * 1024)).toFixed(0)} MB.`,
      });
      event.target.value = "";
      return;
    }

    uploadFile(file);
    // Reset so re-selecting the same file fires onChange again.
    event.target.value = "";
  }

  function uploadFile(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);

    const xhr = new XMLHttpRequest();
    xhrRef.current = xhr;

    xhr.open("POST", "/api/admin/upload");

    xhr.upload.onprogress = (e) => {
      if (!e.lengthComputable) return;
      const progress = Math.round((e.loaded / e.total) * 100);
      setState({ status: "uploading", progress });
    };

    xhr.onload = () => {
      xhrRef.current = null;
      let payload: unknown = null;
      try {
        payload = JSON.parse(xhr.responseText);
      } catch {
        // ignore — handled below
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        const result = payload as { url?: string } | null;
        if (result?.url) {
          setUrl(result.url);
          setState({ status: "idle" });
          return;
        }
        setState({
          status: "error",
          message: "Upload succeeded but no URL was returned.",
        });
        return;
      }

      const errorMessage =
        (payload as { error?: string } | null)?.error ??
        `Upload failed (HTTP ${xhr.status}).`;
      setState({ status: "error", message: errorMessage });
    };

    xhr.onerror = () => {
      xhrRef.current = null;
      setState({
        status: "error",
        message: "Network error while uploading. Check your connection and retry.",
      });
    };

    xhr.onabort = () => {
      xhrRef.current = null;
      setState({ status: "idle" });
    };

    setState({ status: "uploading", progress: 0 });
    xhr.send(formData);
  }

  const isUploading = state.status === "uploading";
  const showPreview = url.length > 0;

  return (
    <div className="space-y-2">
      <input type="hidden" name={name} value={url} />
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPT}
        onChange={handleFileSelected}
        className="hidden"
      />

      <div className="flex items-start gap-3">
        <div className="relative w-24 h-24 shrink-0 border border-bourbon-deep/15 bg-bourbon-warm/40 overflow-hidden">
          {showPreview ? (
            // Use a plain img to avoid next/image domain config friction in admin
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={url}
              alt="Preview"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-bourbon-stone text-[10px] tracking-widest uppercase">
              No image
            </div>
          )}
          {isUploading && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <span className="text-white text-[10px] font-mono">
                {state.progress}%
              </span>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={pickFile}
              disabled={isUploading}
              className="px-3 py-1.5 text-[10px] tracking-widest uppercase text-bourbon-deep border border-bourbon-deep/20 hover:border-bourbon-gold hover:text-bourbon-gold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-wait"
            >
              {isUploading
                ? "Uploading…"
                : showPreview
                ? "Replace image"
                : "Upload image"}
            </button>
            {showPreview && !isUploading && (
              <button
                type="button"
                onClick={clearImage}
                className="px-3 py-1.5 text-[10px] tracking-widest uppercase text-red-700 border border-red-700/30 hover:bg-red-700 hover:text-white transition-colors cursor-pointer"
              >
                Remove
              </button>
            )}
            {isUploading && (
              <button
                type="button"
                onClick={() => xhrRef.current?.abort()}
                className="px-3 py-1.5 text-[10px] tracking-widest uppercase text-bourbon-stone border border-bourbon-deep/20 hover:text-bourbon-deep cursor-pointer"
              >
                Cancel
              </button>
            )}
          </div>

          {isUploading && (
            <div className="h-1 w-full bg-bourbon-deep/10 overflow-hidden">
              <div
                className="h-full bg-bourbon-gold transition-all"
                style={{ width: `${state.progress}%` }}
              />
            </div>
          )}

          {state.status === "error" && (
            <p className="text-red-700 text-xs">{state.message}</p>
          )}

          {url && state.status !== "error" && (
            <p
              className="text-bourbon-stone text-[10px] font-mono truncate"
              title={url}
            >
              {url}
            </p>
          )}

          {helperText && state.status !== "error" && !url && (
            <p className="text-bourbon-stone text-xs">{helperText}</p>
          )}
        </div>
      </div>
    </div>
  );
}
