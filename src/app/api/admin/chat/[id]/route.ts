import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { MAX_CHAT_MESSAGE_LEN } from "@/lib/chat";

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
    select: { id: true, status: true },
  });
  if (!convo) {
    return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
  }

  let afterDate: Date | undefined;
  if (after) {
    const found = await prisma.chatMessage.findUnique({
      where: { id: after },
      select: { createdAt: true },
    });
    afterDate = found?.createdAt;
  }

  const messages = await prisma.chatMessage.findMany({
    where: {
      conversationId: id,
      ...(afterDate ? { createdAt: { gt: afterDate } } : {}),
    },
    orderBy: { createdAt: "asc" },
    select: { id: true, body: true, sender: true, createdAt: true },
  });

  // Opening (full load) clears the unread badge.
  if (!after) {
    await prisma.conversation.update({
      where: { id },
      data: { adminUnread: 0 },
    });
  }

  return NextResponse.json({ conversationId: id, status: convo.status, messages });
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

  let body: ReplyBody;
  try {
    body = (await req.json()) as ReplyBody;
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

  const convo = await prisma.conversation.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!convo) {
    return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
  }

  const created = await prisma.chatMessage.create({
    data: { conversationId: id, sender: "ADMIN", body: message },
    select: { id: true, body: true, sender: true, createdAt: true },
  });

  await prisma.conversation.update({
    where: { id },
    data: {
      lastMessageAt: created.createdAt,
      lastMessageFrom: "ADMIN",
      adminUnread: 0,
    },
  });

  return NextResponse.json({ message: created });
}
