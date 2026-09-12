import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { orderChannel, publishChatMessage } from "@/lib/realtime";
import { sendToCustomer } from "@/lib/push";
import {
  appendMessage,
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

import {
  TYPING_WINDOW_MS,
  clearTyping,
  isCustomerOnline,
  isFresh,
  setTyping,
  touchAdminPresence,
} from "@/lib/chat-presence";

export const dynamic = "force-dynamic";

/* Authorisation is the middleware's job: src/middleware.ts guards
   /api/admin/:path* the same way it guards /admin/:path*. */

type Ctx = { params: Promise<{ orderNumber: string }> };

async function findOrder(orderNumber: string) {
  return prisma.order.findUnique({
    where: { orderNumber },
    select: { id: true, customerId: true, orderNumber: true },
  });
}

export async function GET(_req: NextRequest, ctx: Ctx) {
  const { orderNumber } = await ctx.params;
  const order = await findOrder(orderNumber);
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });

  // Reading an order's thread is the operator at work, so it counts as
  // presence the same way the storefront inbox does.
  await touchAdminPresence().catch(() => {});

  const thread = await prisma.conversation.findUnique({
    where: { orderId: order.id },
    select: { id: true, visitorTypingAt: true, customerLastReadAt: true },
  });
  if (!thread) return NextResponse.json({ messages: [] });

  const messages = await listMessages(thread.id);
  await markRead(thread.id, "admin");
  return NextResponse.json({
    messages,
    peerTyping: isFresh(thread.visitorTypingAt, TYPING_WINDOW_MS),
    peerOnline: order.customerId ? await isCustomerOnline(order.customerId) : false,
    customerLastReadAt: thread.customerLastReadAt?.toISOString() ?? null,
  });
}

/**
 * Typing ping from the operator, plus a presence stamp.
 *
 * OrderChat PATCHes whatever endpoint it is given as the operator types; this
 * route had no PATCH, so on the clients-chat surface the three dots never
 * reached the customer and every ping 405'd. Creating the thread here would be
 * wrong — a stray keystroke should not open a conversation — so a thread that
 * does not exist yet is a silent no-op.
 */
export async function PATCH(_req: NextRequest, ctx: Ctx) {
  const { orderNumber } = await ctx.params;
  const order = await findOrder(orderNumber);
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });

  const thread = await prisma.conversation.findUnique({
    where: { orderId: order.id },
    select: { id: true },
  });
  await Promise.all([
    thread ? setTyping(thread.id, "admin") : Promise.resolve(),
    touchAdminPresence(),
  ]);
  return NextResponse.json({ ok: true });
}

export async function POST(req: NextRequest, ctx: Ctx) {
  const { orderNumber } = await ctx.params;
  const order = await findOrder(orderNumber);
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });

  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  const body = String(form.get("body") ?? "").trim();
  const file = form.get("file");
  const hasFile = file instanceof File && file.size > 0;

  if (!hasFile && !body) return NextResponse.json({ error: "Nothing to send." }, { status: 400 });
  if (body.length > MAX_BODY_CHARS) {
    return NextResponse.json(
      { error: `Message is too long (${MAX_BODY_CHARS} characters max).` },
      { status: 400 },
    );
  }

  const thread = await getOrCreateOrderThread({
    orderId: order.id,
    customerId: order.customerId,
  });

  // The message landing is the end of typing — drop our own stamp so the
  // customer's dots go out with the reply instead of lingering for the window.
  await clearTyping(thread.id, "admin");

  /* Ping the buyer that we replied. Never blocks the send: a failed push must
     not cost the operator their message. */
  async function pingCustomer(preview: string) {
    if (!order?.customerId) return;
    try {
      await sendToCustomer(order.customerId, {
        title: `Reply about ${order.orderNumber}`,
        body: preview,
        url: "/account",
        tag: `order-${order.orderNumber}-chat`,
      });
    } catch (err) {
      console.error("[admin order-chat] push failed:", err);
    }
  }

  if (!hasFile) {
    const message = await appendMessage({
      conversationId: thread.id, sender: "ADMIN", kind: "TEXT", body,
    });
    await pingCustomer(body.length > 90 ? `${body.slice(0, 90)}…` : body);
    await publishChatMessage(orderChannel(orderNumber), message);
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
      const clientMs = Number(form.get("durationMs"));
      const durationMs = up.durationMs
        ?? (Number.isFinite(clientMs) && clientMs > 0
          ? Math.min(Math.round(clientMs), MAX_VOICE_NOTE_MS)
          : null);
      const message = await appendMessage({
        conversationId: thread.id, sender: "ADMIN", kind: "VOICE", body,
        mediaPublicId: up.publicId, mediaMimeType: mime,
        mediaDurationMs: durationMs, mediaBytes: up.bytes,
      });
      await pingCustomer("Sent you a voice note.");
      await publishChatMessage(orderChannel(orderNumber), message);
    return NextResponse.json({ message });
    }
    const up = await uploadChatImage(buffer);
    const message = await appendMessage({
      conversationId: thread.id, sender: "ADMIN", kind: "IMAGE", body,
      mediaPublicId: up.publicId, mediaMimeType: mime, mediaBytes: up.bytes,
    });
    await pingCustomer("Sent you a photo.");
    await publishChatMessage(orderChannel(orderNumber), message);
    return NextResponse.json({ message });
  } catch (err) {
    console.error("[admin order-chat] attachment failed:", err);
    return NextResponse.json(
      { error: "Could not upload that attachment. Please try again." },
      { status: 502 },
    );
  }
}
