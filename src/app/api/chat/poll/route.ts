import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { findVisitorConversationId } from "@/lib/chat";

export const dynamic = "force-dynamic";

/**
 * Visitor widget polls this every few seconds. Returns messages newer than the
 * `after` id (or the whole thread when omitted). No conversation yet → empty.
 */
export async function GET(req: NextRequest) {
  const conversationId = await findVisitorConversationId(req);
  if (!conversationId) {
    return NextResponse.json({ conversationId: null, messages: [] });
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

  const messages = await prisma.chatMessage.findMany({
    where: {
      conversationId,
      ...(afterDate ? { createdAt: { gt: afterDate } } : {}),
    },
    orderBy: { createdAt: "asc" },
    select: { id: true, body: true, sender: true, createdAt: true },
  });

  return NextResponse.json({ conversationId, messages });
}
