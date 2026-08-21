import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";

// The Cloudinary SDK auto-reads CLOUDINARY_URL from the environment, but call
// config() explicitly so misconfiguration fails loudly at boot rather than at
// the first upload attempt.
if (!process.env.CLOUDINARY_URL) {
  console.warn(
    "[cloudinary] CLOUDINARY_URL is not set — image uploads will fail."
  );
}
cloudinary.config({ secure: true });

export type UploadResult = {
  url: string;
  publicId: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
};

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024; // 8 MB

export const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
]);

export type UploadFolder = "products" | "categories";

/**
 * Payment screenshots are uploaded as `authenticated` assets, not public ones.
 * A buyer's proof of payment routinely shows a bank balance, an account
 * number, or a wallet address — storing it on a permanent public URL, however
 * unguessable, is the wrong default. Authenticated assets can only be fetched
 * through a signed URL, which the admin generates at view time.
 */
export async function uploadPaymentProof(
  buffer: Buffer,
): Promise<UploadResult> {
  if (!process.env.CLOUDINARY_URL) {
    throw new Error("Cloudinary is not configured (missing CLOUDINARY_URL).");
  }

  const result = await new Promise<UploadApiResponse>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "bourbon/payment-proofs",
        resource_type: "image",
        type: "authenticated",
        transformation: [{ width: 2400, height: 2400, crop: "limit" }],
        quality: "auto:good",
      },
      (error, uploaded) => {
        if (error) return reject(error);
        if (!uploaded) {
          return reject(new Error("Cloudinary returned an empty response."));
        }
        resolve(uploaded);
      },
    );
    stream.end(buffer);
  });

  return {
    url: result.secure_url,
    publicId: result.public_id,
    width: result.width,
    height: result.height,
    format: result.format,
    bytes: result.bytes,
  };
}

/**
 * Short-lived signed URL for an authenticated asset. Generated server-side
 * per view so the link in the admin page can't be forwarded indefinitely.
 */
export function signedProofUrl(publicId: string, ttlSeconds = 900): string {
  return cloudinary.url(publicId, {
    type: "authenticated",
    sign_url: true,
    secure: true,
    expires_at: Math.floor(Date.now() / 1000) + ttlSeconds,
  });
}

export async function deletePaymentProof(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId, { type: "authenticated" });
}

export async function uploadImageBuffer(
  buffer: Buffer,
  folder: UploadFolder
): Promise<UploadResult> {
  if (!process.env.CLOUDINARY_URL) {
    throw new Error("Cloudinary is not configured (missing CLOUDINARY_URL).");
  }

  const result = await new Promise<UploadApiResponse>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `bourbon/${folder}`,
        resource_type: "image",
        // Keep the original dimensions but cap absurdly large uploads.
        transformation: [{ width: 2400, height: 2400, crop: "limit" }],
        // Cloudinary's automatic format/quality optimisation.
        fetch_format: "auto",
        quality: "auto:good",
      },
      (error, uploaded) => {
        if (error) return reject(error);
        if (!uploaded) {
          return reject(new Error("Cloudinary returned an empty response."));
        }
        resolve(uploaded);
      }
    );
    stream.end(buffer);
  });

  return {
    url: result.secure_url,
    publicId: result.public_id,
    width: result.width,
    height: result.height,
    format: result.format,
    bytes: result.bytes,
  };
}

/* ---- Chat attachments ---------------------------------------------------

   Chat carries payment screenshots and spoken payment references, so the same
   rule as payment proofs applies: `authenticated` assets with no permanent
   public URL, signed at view time.

   Voice notes go up as resource_type "video" — that is Cloudinary's bucket for
   anything with a time axis, audio included. Using "raw" would store the bytes
   but give no duration or transcoding. */

export const CHAT_IMAGE_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
  "image/heic",
]);

/* MediaRecorder emits webm/opus on Chrome and Firefox and mp4/aac on Safari,
   and both tack a codecs= parameter onto the type, so the check strips
   parameters before comparing. */
export const CHAT_AUDIO_MIME_TYPES = new Set([
  "audio/webm",
  "audio/ogg",
  "audio/mp4",
  "audio/mpeg",
  "audio/aac",
  "audio/wav",
]);

export const MAX_CHAT_IMAGE_BYTES = 8 * 1024 * 1024; // 8 MB
/* A voice note is a message, not a podcast. Two minutes of opus is well under
   this; the cap is here so a stuck recorder cannot post a 200MB blob. */
export const MAX_CHAT_AUDIO_BYTES = 6 * 1024 * 1024; // 6 MB
export const MAX_VOICE_NOTE_MS = 3 * 60 * 1000; // 3 minutes

export function baseMimeType(raw: string): string {
  return raw.split(";")[0]!.trim().toLowerCase();
}

export async function uploadChatImage(buffer: Buffer): Promise<UploadResult> {
  if (!process.env.CLOUDINARY_URL) {
    throw new Error("Cloudinary is not configured (missing CLOUDINARY_URL).");
  }
  const result = await new Promise<UploadApiResponse>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "bourbon/chat",
        resource_type: "image",
        type: "authenticated",
        transformation: [{ width: 2000, height: 2000, crop: "limit" }],
        quality: "auto:good",
      },
      (error, uploaded) => {
        if (error) return reject(error);
        if (!uploaded) return reject(new Error("Cloudinary returned an empty response."));
        resolve(uploaded);
      },
    );
    stream.end(buffer);
  });
  return {
    url: result.secure_url,
    publicId: result.public_id,
    width: result.width,
    height: result.height,
    format: result.format,
    bytes: result.bytes,
  };
}

export type AudioUploadResult = {
  publicId: string;
  bytes: number;
  /** Cloudinary reports duration in seconds; callers store milliseconds. */
  durationMs: number | null;
};

export async function uploadChatAudio(
  buffer: Buffer,
): Promise<AudioUploadResult> {
  if (!process.env.CLOUDINARY_URL) {
    throw new Error("Cloudinary is not configured (missing CLOUDINARY_URL).");
  }
  const result = await new Promise<UploadApiResponse>((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: "bourbon/chat-voice",
        resource_type: "video",
        type: "authenticated",
      },
      (error, uploaded) => {
        if (error) return reject(error);
        if (!uploaded) return reject(new Error("Cloudinary returned an empty response."));
        resolve(uploaded);
      },
    );
    stream.end(buffer);
  });
  const seconds = (result as UploadApiResponse & { duration?: number }).duration;
  return {
    publicId: result.public_id,
    bytes: result.bytes,
    durationMs: typeof seconds === "number" ? Math.round(seconds * 1000) : null,
  };
}

/** Signed URL for a chat attachment. `video` covers audio, as above. */
export function signedChatMediaUrl(
  publicId: string,
  kind: "image" | "audio",
  ttlSeconds = 900,
): string {
  return cloudinary.url(publicId, {
    resource_type: kind === "audio" ? "video" : "image",
    type: "authenticated",
    sign_url: true,
    secure: true,
    expires_at: Math.floor(Date.now() / 1000) + ttlSeconds,
  });
}
