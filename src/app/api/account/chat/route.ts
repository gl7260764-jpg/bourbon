import { NextResponse, type NextRequest } from "next/server";
import { getCurrentCustomer } from "@/lib/customer-auth";
import {
  appendMessage,
  listMessages,
  markRead,
  MAX_BODY_CHARS,
} from "@/lib/order-chat";
import {
  getOrCreateCustomerThread,
  mergeIntoPrimaryThread,
} from "@/lib/customer-chat";
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
import { customerChannel, publishChatMessage } from "@/lib/realtime";
import {
  TYPING_WINDOW_MS,
  clearTyping,
  isAdminOnline,
  isFresh,
  markCustomerRead,
  setTyping,
} from "@/lib/chat-presence";

export const dynamic = "force-dynamic";

/**
 * The customer's one ongoing conversation.
 *
 * Replaces the per-order routes as the customer-facing surface: a buyer now
 * has a single thread and names the order in the message when it matters,
 * rather than hunting for the right inbox. Same media rules as before —
 * images and voice notes only, stored as Cloudinary `authenticated` assets.
 */
async function resolve() {
  const customer = await getCurrentCustomer();
  if (!customer) {
    return { error: "Sign in to view your messages.", status: 401 } as const;
  }
  // Folds any leftover per-order threads in on first touch, so history is
  // never stranded behind a surface the customer can no longer reach.
  await mergeIntoPrimaryThread(customer.id);
  const thread = await getOrCreateCustomerThread(customer.id);
  return { customer, thread } as const;
}

export async function GET() {
  const r = await resolve();
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });

  const messages = await listMessages(r.thread.id);
  await markCustomerRead(r.thread.id);

  /* No read state comes back here on purpose. The customer is never told
     whether we have opened their message — see chat-presence. */
  return NextResponse.json({
    messages,
    peerTyping: isFresh(r.thread.adminTypingAt, TYPING_WINDOW_MS),
    peerOnline: await isAdminOnline(),
  });
}

/** Typing ping. Cheap on purpose — one row, one column, no body. */
export async function PATCH() {
  const r = await resolve();
  if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });
  await setTyping(r.thread.id, "customer");
  return NextResponse.json({ ok: true });
}

export async function POST(req: NextRequest) {
  const r = await resolve();
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

  /* Optional: which order this message is about. Only ever a label — it never
     grants access to anything, so an unrecognised value is harmless. */
  const rawContext = String(form.get("contextOrderNumber") ?? "").trim();
  const contextOrderNumber = rawContext ? rawContext.slice(0, 40) : null;
  const channel = customerChannel(r.customer.id);
  await clearTyping(r.thread.id, "customer");

  if (!hasFile) {
    const message = await appendMessage({
      conversationId: r.thread.id,
      sender: "VISITOR",
      kind: "TEXT",
      body,
      contextOrderNumber,
    });
    await publishChatMessage(channel, message);
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
      const durationMs =
        up.durationMs ??
        (Number.isFinite(clientMs) && clientMs > 0
          ? Math.min(Math.round(clientMs), MAX_VOICE_NOTE_MS)
          : null);
      const message = await appendMessage({
        conversationId: r.thread.id,
        sender: "VISITOR",
        kind: "VOICE",
        body,
        contextOrderNumber,
        mediaPublicId: up.publicId,
        mediaMimeType: mime,
        mediaDurationMs: durationMs,
        mediaBytes: up.bytes,
      });
      await publishChatMessage(channel, message);
      return NextResponse.json({ message });
    }

    const up = await uploadChatImage(buffer);
    const message = await appendMessage({
      conversationId: r.thread.id,
      sender: "VISITOR",
      kind: "IMAGE",
      body,
      contextOrderNumber,
      mediaPublicId: up.publicId,
      mediaMimeType: mime,
      mediaBytes: up.bytes,
    });
    await publishChatMessage(channel, message);
    return NextResponse.json({ message });
  } catch (err) {
    console.error("[account-chat] attachment failed:", err);
    return NextResponse.json(
      { error: "Could not upload that attachment. Please try again." },
      { status: 502 },
    );
  }
}
