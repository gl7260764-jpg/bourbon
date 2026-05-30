import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendToAdmins } from "@/lib/push";
import { sendEmail } from "@/lib/mailer";
import {
  getOrCreateConversation,
  MAX_CHAT_MESSAGE_LEN,
} from "@/lib/chat";

export const dynamic = "force-dynamic";

// Don't re-email about the same thread more than once per this window — push
// stays instant per message, email is just the "in case you missed it" backup.
const EMAIL_THROTTLE_MS = 5 * 60 * 1000;

interface SendBody {
  message?: string;
}

export async function POST(req: NextRequest) {
  let body: SendBody;
  try {
    body = (await req.json()) as SendBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const message = body.message?.trim();
  if (!message) {
    return NextResponse.json({ error: "Message is required." }, { status: 400 });
  }
  if (message.length > MAX_CHAT_MESSAGE_LEN) {
    return NextResponse.json(
      { error: `Message too long (max ${MAX_CHAT_MESSAGE_LEN} characters).` },
      { status: 400 },
    );
  }

  // The conversation cookie is set on `res`, so build it up front and attach
  // the JSON body to it at the end.
  const res = NextResponse.next();
  const { conversationId, lastNotifiedAt } = await getOrCreateConversation(req, res);

  const created = await prisma.chatMessage.create({
    data: { conversationId, sender: "VISITOR", body: message },
    select: { id: true, body: true, sender: true, createdAt: true },
  });

  // Email at most once per throttle window per conversation.
  const shouldEmail =
    !lastNotifiedAt ||
    created.createdAt.getTime() - lastNotifiedAt.getTime() > EMAIL_THROTTLE_MS;

  await prisma.conversation.update({
    where: { id: conversationId },
    data: {
      lastMessageAt: created.createdAt,
      lastMessageFrom: "VISITOR",
      adminUnread: { increment: 1 },
      status: "OPEN",
      ...(shouldEmail ? { lastNotifiedAt: created.createdAt } : {}),
    },
  });

  // Fire-and-forget the push so a slow notification never blocks the reply.
  // Sends ONLY to admin devices (isAdmin = true) — never to storefront subscribers.
  const preview = message.length > 120 ? `${message.slice(0, 117)}…` : message;
  void sendToAdmins({
    title: "New live-chat message",
    body: preview,
    url: `/admin/chat?c=${conversationId}`,
    tag: `chat-${conversationId}`,
  }).catch((err) => console.error("[chat] admin push failed:", err));

  // Email fallback — throttled, fire-and-forget.
  if (shouldEmail) {
    void notifyAdminByEmail(conversationId, message).catch((err) =>
      console.error("[chat] admin email failed:", err),
    );
  }

  const out = NextResponse.json({ message: created, conversationId });
  // Carry over the visitor cookie that getOrCreateConversation may have set.
  for (const cookie of res.cookies.getAll()) {
    out.cookies.set(cookie);
  }
  return out;
}

async function notifyAdminByEmail(conversationId: string, message: string) {
  const to = process.env.SALES_EMAIL || process.env.SMTP_USER;
  if (!to) return;

  const siteUrl = (
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.bourbonoaklover.com"
  ).replace(/\/$/, "");
  const link = `${siteUrl}/admin/chat?c=${conversationId}`;
  const safe = message
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  await sendEmail({
    to,
    subject: "New live-chat message — Bourbon & Oak",
    text: `A visitor sent a new chat message:\n\n"${message}"\n\nReply here: ${link}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto">
        <h2 style="color:#1C1917;margin-bottom:4px">New live-chat message</h2>
        <p style="color:#57534E;margin-top:0">A visitor just messaged you on the site.</p>
        <blockquote style="margin:16px 0;padding:12px 16px;background:#F5F5F4;border-left:3px solid #B45309;color:#1C1917">
          ${safe}
        </blockquote>
        <a href="${link}" style="display:inline-block;background:#B45309;color:#fff;text-decoration:none;padding:10px 20px;border-radius:6px;font-weight:600">
          Open the conversation
        </a>
      </div>
    `,
  });
}
