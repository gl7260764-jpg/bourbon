import { NextResponse, type NextRequest } from "next/server";
import {
  ALLOWED_MIME_TYPES,
  MAX_UPLOAD_BYTES,
  uploadImageBuffer,
  type UploadFolder,
} from "@/lib/cloudinary";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FOLDERS = new Set<UploadFolder>(["products", "categories"]);

function isUploadFolder(value: string): value is UploadFolder {
  return (FOLDERS as Set<string>).has(value);
}

function badRequest(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(req: NextRequest) {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return badRequest("Expected multipart/form-data.");
  }

  const file = form.get("file");
  const folderRaw = String(form.get("folder") ?? "products").trim();

  if (!(file instanceof File)) {
    return badRequest("No file uploaded. Attach a file under the 'file' field.");
  }

  if (!isUploadFolder(folderRaw)) {
    return badRequest(
      `Invalid folder. Allowed: ${Array.from(FOLDERS).join(", ")}.`
    );
  }

  if (file.size === 0) {
    return badRequest("Uploaded file is empty.");
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    const limitMb = (MAX_UPLOAD_BYTES / (1024 * 1024)).toFixed(0);
    return badRequest(
      `File is too large. Maximum size is ${limitMb} MB.`,
      413
    );
  }

  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return badRequest(
      `Unsupported image type "${file.type || "unknown"}". Use JPG, PNG, WebP, GIF or AVIF.`,
      415
    );
  }

  let buffer: Buffer;
  try {
    buffer = Buffer.from(await file.arrayBuffer());
  } catch {
    return badRequest("Failed to read the uploaded file.", 500);
  }

  try {
    const result = await uploadImageBuffer(buffer, folderRaw);
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Image upload failed.";
    console.error("[upload] Cloudinary error:", err);
    return NextResponse.json(
      { error: `Cloudinary upload failed: ${message}` },
      { status: 502 }
    );
  }
}
