import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  ALLOWED_MIME_TYPES,
  MAX_UPLOAD_BYTES,
  deletePaymentProof,
  uploadPaymentProof,
} from "@/lib/cloudinary";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function badRequest(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * Public — the buyer uploads their payment screenshot from the confirmation
 * page. There is no customer login in this system, so possession of the order
 * number is the credential; the endpoint therefore stays deliberately narrow:
 *
 *  - only orders still awaiting payment accept an upload
 *  - images only, size-capped
 *  - one proof per order; re-uploading replaces (and deletes) the previous one
 *  - nothing about the order is returned in the response
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orderNumber: string }> },
) {
  const { orderNumber } = await params;

  const order = await prisma.order.findUnique({
    where: { orderNumber },
    select: {
      id: true,
      status: true,
      paymentProofPublicId: true,
    },
  });
  if (!order) {
    return badRequest("Order not found.", 404);
  }
  if (order.status !== "PENDING") {
    return badRequest(
      "This order is no longer awaiting payment, so a receipt can't be added.",
      409,
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return badRequest("Expected multipart/form-data.");
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return badRequest("No file uploaded. Attach it under the 'file' field.");
  }
  if (file.size === 0) {
    return badRequest("That file is empty.");
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    const limitMb = (MAX_UPLOAD_BYTES / (1024 * 1024)).toFixed(0);
    return badRequest(`That image is too large. Maximum size is ${limitMb} MB.`, 413);
  }
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return badRequest(
      `Unsupported image type "${file.type || "unknown"}". Use JPG, PNG, WebP, GIF or AVIF.`,
      415,
    );
  }

  let buffer: Buffer;
  try {
    buffer = Buffer.from(await file.arrayBuffer());
  } catch {
    return badRequest("Could not read that file.", 500);
  }

  let publicId: string;
  try {
    const uploaded = await uploadPaymentProof(buffer);
    publicId = uploaded.publicId;
  } catch (err) {
    console.error("[proof] Cloudinary upload failed:", err);
    return NextResponse.json(
      { error: "Upload failed. Please try again, or reply to your confirmation email with the screenshot." },
      { status: 502 },
    );
  }

  const previous = order.paymentProofPublicId;

  await prisma.order.update({
    where: { id: order.id },
    data: {
      paymentProofPublicId: publicId,
      paymentProofUploadedAt: new Date(),
      // Uploading proof is the buyer saying "I've paid" — put the order in the
      // operator's verification queue.
      settlementState: "PROOF_SUBMITTED",
    },
  });

  // Best-effort cleanup of the replaced image. A failure here must not fail
  // the request: the new proof is already recorded.
  if (previous && previous !== publicId) {
    try {
      await deletePaymentProof(previous);
    } catch (err) {
      console.error("[proof] failed to delete replaced image:", err);
    }
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
