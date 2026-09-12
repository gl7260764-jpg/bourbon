import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { findVisitorConversationId } from "@/lib/chat";
import {
  TYPING_WINDOW_MS,
  isAdminOnline,
  isFresh,
} from "@/lib/chat-presence";

export const dynamic = "force-dynamic";

/**
 * Visitor widget polls this every few seconds. Returns messages newer than the
 * `after` id (or the whole thread when omitted), plus whether we are typing or
 * at the desk — the widget header says so rather than showing a fixed "we
 * reply in a few minutes" that is true at 3am. No conversation yet → empty.
 */
export async function GET(req: NextRequest) {
  const conversationId = await findVisitorConversationId(req);
  if (!conversationId) {
    // Presence still answers: the header is worth being honest about before
    // the visitor has said anything.
    return NextResponse.json({
      conversationId: null,
      messages: [],
      adminTyping: false,
      adminOnline: await isAdminOnline(),
    });
  }

  const after = req.nextUrl.searchParams.get("after");
  let afterDate: Date | undefined;
  if (after) {
    const found = await prisma.chatMessage.findUnique({
      where: { id: after },
      select: { createdAt: true },
    });
    afterDate = found?.createdAt;
  }

  const [messages, convo, adminOnline] = await Promise.all([
    prisma.chatMessage.findMany({
      where: {
        conversationId,
        ...(afterDate ? { createdAt: { gt: afterDate } } : {}),
      },
      orderBy: { createdAt: "asc" },
      select: { id: true, body: true, sender: true, createdAt: true },
    }),
    prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { adminTypingAt: true },
    }),
    isAdminOnline(),
  ]);

  return NextResponse.json({
    conversationId,
    messages,
    adminTyping: isFresh(convo?.adminTypingAt, TYPING_WINDOW_MS),
    adminOnline,
  });
}
