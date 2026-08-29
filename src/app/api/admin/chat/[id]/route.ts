import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { MAX_CHAT_MESSAGE_LEN } from "@/lib/chat";
import { appendMessage, toView } from "@/lib/order-chat";
import { visitorLabel } from "@/lib/visitor";
import { customerChannel, publishChatMessage } from "@/lib/realtime";
import { sendToCustomer } from "@/lib/push";
import {
  baseMimeType,
  CHAT_AUDIO_MIME_TYPES,
  CHAT_IMAGE_MIME_TYPES,
  MAX_CHAT_AUDIO_BYTES,
  MAX_CHAT_IMAGE_BYTES,
  uploadChatAudio,
  uploadChatImage,
} from "@/lib/cloudinary";
import {
  TYPING_WINDOW_MS,
  clearTyping,
  isFresh,
  setTyping,
  touchAdminPresence,
} from "@/lib/chat-presence";

export const dynamic = "force-dynamic";

/**
 * Load a thread. Supports incremental polling via `?after=<messageId>`.
 * On a full load (no `after`) the conversation is marked read for the admin.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const after = req.nextUrl.searchParams.get("after");

  const convo = await prisma.conversation.findUnique({
    where: { id },
    select: {
      id: true,
      status: true,
      visitorTypingAt: true,
      customerLastReadAt: true,
      customer: { select: { email: true, fullName: true } },
      visitorId: true,
    },
  });
  if (!convo) {
    return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
  }

  // The inbox being open is what "online" means for the operator.
  await touchAdminPresence().catch(() => {});

  let afterDate: Date | undefined;
  if (after) {
    const found = await prisma.chatMessage.findUnique({
      where: { id: after },
      select: { createdAt: true },
    });
    afterDate = found?.createdAt;
  }

  const rows = await prisma.chatMessage.findMany({
    where: {
      conversationId: id,
      ...(afterDate ? { createdAt: { gt: afterDate } } : {}),
    },
    orderBy: { createdAt: "asc" },
    select: {
      id: true, body: true, sender: true, createdAt: true, kind: true,
      // Attachments are Cloudinary `authenticated` assets, so they are signed
      // per read rather than stored as a permanent URL.
      mediaPublicId: true, mediaDurationMs: true, contextOrderNumber: true,
    },
  });
  const messages = rows.map(toView);

  // Opening (full load) clears the unread badge.
  if (!after) {
    await prisma.conversation.update({
      where: { id },
      data: { adminUnread: 0 },
    });
  }

  return NextResponse.json({
    conversationId: id,
    status: convo.status,
    email: convo.customer?.email ?? null,
    name: convo.customer?.fullName || null,
    codename: visitorLabel(convo.visitorId),
    messages,
    // Only the operator sees these two.
    peerTyping: isFresh(convo.visitorTypingAt, TYPING_WINDOW_MS),
    customerLastReadAt: convo.customerLastReadAt?.toISOString() ?? null,
  });
}

/** Typing ping from the operator, and a presence heartbeat with it. */
export async function PATCH(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const exists = await prisma.conversation.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!exists) {
    return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
  }
  await Promise.all([setTyping(id, "admin"), touchAdminPresence()]);
  return NextResponse.json({ ok: true });
}

interface ReplyBody {
  message?: string;
}

/** Admin sends a reply into the thread. */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  /* Two shapes: JSON for a plain reply (what the inbox has always sent), and
     multipart when there is a file. Kept on one route so the reply, the
     counters, the push and the auto-reply guard all stay in one place. */
  const contentType = req.headers.get("content-type") ?? "";
  let message = "";
  let file: File | null = null;

  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData().catch(() => null);
    if (!form) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    message = String(form.get("message") ?? "").trim();
    const f = form.get("file");
    if (f instanceof File && f.size > 0) file = f;
  } else {
    let body: ReplyBody;
    try {
      body = (await req.json()) as ReplyBody;
    } catch {
      return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
    }
    message = body.message?.trim() ?? "";
  }

  if (!message && !file) {
    return NextResponse.json({ error: "Message is required." }, { status: 400 });
  }
  if (message.length > MAX_CHAT_MESSAGE_LEN) {
    return NextResponse.json(
      { error: `Message too long (max ${MAX_CHAT_MESSAGE_LEN} characters).` },
      { status: 400 },
    );
  }

  const convo = await prisma.conversation.findUnique({
    where: { id },
    select: { id: true, customerId: true },
  });
  if (!convo) {
    return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
  }

  /* appendMessage rather than a raw create: it moves lastMessageAt and BOTH
     unread counters inside one transaction. Writing the message by hand here
     bumped nothing on the customer's side, so a reply sent from this inbox
     never lit their badge. */
  let created;
  if (file) {
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
      const up = isAudio ? await uploadChatAudio(buffer) : await uploadChatImage(buffer);
      created = await appendMessage({
        conversationId: id,
        sender: "ADMIN",
        kind: isAudio ? "VOICE" : "IMAGE",
        body: message,
        mediaPublicId: up.publicId,
        mediaMimeType: mime,
        mediaDurationMs: "durationMs" in up ? up.durationMs : null,
        mediaBytes: up.bytes,
      });
    } catch (err) {
      console.error("[admin chat] attachment failed:", err);
      return NextResponse.json(
        { error: "Could not upload that attachment. Please try again." },
        { status: 502 },
      );
    }
  } else {
    created = await appendMessage({
      conversationId: id,
      sender: "ADMIN",
      kind: "TEXT",
      body: message,
    });
  }

  // The admin has clearly read the thread they just replied in.
  await prisma.conversation.update({ where: { id }, data: { adminUnread: 0 } });
  await clearTyping(id, "admin");

  /* Neither of these may fail the reply — the message is already written and
     the dashboard polls regardless. */
  if (convo.customerId) {
    const preview = message
      ? message.length > 90
        ? `${message.slice(0, 90)}…`
        : message
      : file
        ? "Sent you an attachment."
        : "";
    try {
      await publishChatMessage(customerChannel(convo.customerId), created);
    } catch (err) {
      console.error("[admin chat] realtime publish failed:", err);
    }
    try {
      await sendToCustomer(convo.customerId, {
        title: "Bourbon & Oak replied",
        body: preview,
        url: "/account?chat=1",
        tag: `customer-${convo.customerId}-chat`,
      });
    } catch (err) {
      console.error("[admin chat] push failed:", err);
    }
  }

  return NextResponse.json({ message: created });
}
