import { NextResponse, type NextRequest } from "next/server";
import { getCurrentCustomer } from "@/lib/customer-auth";
import {
  appendMessage,
  findOrderForCustomer,
  getOrCreateOrderThread,
  listMessages,
  markRead,
  MAX_BODY_CHARS,
} from "@/lib/order-chat";
import {
  baseMimeType,
  CHAT_AUDIO_MIME_TYPES,
  CHAT_IMAGE_MIME_TYPES,
  MAX_CHAT_AUDIO_BYTES,
  MAX_CHAT_IMAGE_BYTES,
  MAX_VOICE_NOTE_MS,
  uploadChatAudio,
  uploadChatImage,
} from "@/lib/cloudinary";
import { prisma } from "@/lib/prisma";
import { publishChatMessage } from "@/lib/realtime";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ orderNumber: string }> };

/** Both verbs need the same three checks, so they share one gate. */
async function resolve(orderNumber: string) {
  const customer = await getCurrentCustomer();
  if (!customer) return { error: "Sign in to view this conversation.", status: 401 } as const;

  const order = await findOrderForCustomer(orderNumber, customer);
  // 404 for "not found" and "not yours" alike, so order numbers stay
  // non-enumerable.
  if (!order) return { error: "Order not found.", status: 404 } as const;

  return { customer, order } as const;
}

export async function GET(_req: NextRequest, ctx: Ctx) {
  const { orderNumber } = await ctx.params;
  const r = await resolve(orderNumber);
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });

  const thread = await prisma.conversation.findUnique({
    where: { orderId: r.order.id },
    select: { id: true },
  });
  if (!thread) return NextResponse.json({ messages: [] });

  const messages = await listMessages(thread.id);
  await markRead(thread.id, "customer");
  return NextResponse.json({ messages });
}

export async function POST(req: NextRequest, ctx: Ctx) {
  const { orderNumber } = await ctx.params;
  const r = await resolve(orderNumber);
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });

  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  const body = String(form.get("body") ?? "").trim();
  const file = form.get("file");
  const hasFile = file instanceof File && file.size > 0;

  if (!hasFile && !body) {
    return NextResponse.json({ error: "Nothing to send." }, { status: 400 });
  }
  if (body.length > MAX_BODY_CHARS) {
    return NextResponse.json(
      { error: `Message is too long (${MAX_BODY_CHARS} characters max).` },
      { status: 400 },
    );
  }

  const thread = await getOrCreateOrderThread({
    orderId: r.order.id,
    customerId: r.customer.id,
  });

  if (!hasFile) {
    const message = await appendMessage({
      conversationId: thread.id, sender: "VISITOR", kind: "TEXT", body,
    });
    await publishChatMessage(orderNumber, message);
    return NextResponse.json({ message });
  }

  const mime = baseMimeType(file.type);
  const isImage = CHAT_IMAGE_MIME_TYPES.has(mime);
  const isAudio = CHAT_AUDIO_MIME_TYPES.has(mime);
  if (!isImage && !isAudio) {
    return NextResponse.json(
      { error: "Only images and voice notes can be attached." },
      { status: 415 },
    );
  }

  const cap = isAudio ? MAX_CHAT_AUDIO_BYTES : MAX_CHAT_IMAGE_BYTES;
  if (file.size > cap) {
    return NextResponse.json(
      { error: `That file is too large (max ${Math.round(cap / 1024 / 1024)}MB).` },
      { status: 413 },
    );
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());

    if (isAudio) {
      const up = await uploadChatAudio(buffer);
      // The client's stated duration is a hint; Cloudinary's is authoritative.
      const clientMs = Number(form.get("durationMs"));
      const durationMs = up.durationMs
        ?? (Number.isFinite(clientMs) && clientMs > 0
          ? Math.min(Math.round(clientMs), MAX_VOICE_NOTE_MS)
          : null);
      const message = await appendMessage({
        conversationId: thread.id, sender: "VISITOR", kind: "VOICE", body,
        mediaPublicId: up.publicId, mediaMimeType: mime,
        mediaDurationMs: durationMs, mediaBytes: up.bytes,
      });
      await publishChatMessage(orderNumber, message);
    return NextResponse.json({ message });
    }

    const up = await uploadChatImage(buffer);
    const message = await appendMessage({
      conversationId: thread.id, sender: "VISITOR", kind: "IMAGE", body,
      mediaPublicId: up.publicId, mediaMimeType: mime, mediaBytes: up.bytes,
    });
    await publishChatMessage(orderNumber, message);
    return NextResponse.json({ message });
  } catch (err) {
    console.error("[order-chat] attachment failed:", err);
    return NextResponse.json(
      { error: "Could not upload that attachment. Please try again." },
      { status: 502 },
    );
  }
}
