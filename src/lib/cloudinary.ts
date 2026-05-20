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
