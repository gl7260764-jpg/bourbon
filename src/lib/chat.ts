import type { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getOrSetVisitorId, VISITOR_COOKIE } from "@/lib/visitor";

// The automatic first message a visitor sees when they open the chat. It is NOT
// stored in the DB — it's rendered client-side — so changing it here only
// affects new sessions and never pings the admin.
export const CHAT_GREETING =
  "Hi there! 👋 Welcome to Bourbon & Oak. Have a question about a bottle, an order, or a tour? Send us a message and a real person will reply.";

// Cap on a single message so nobody can paste a novel into the DB / a push body.
export const MAX_CHAT_MESSAGE_LEN = 2000;

/**
 * Resolve the visitor's OPEN conversation, creating one on first message.
 * The visitor id comes from the httpOnly `bol_vid` cookie, set here if missing
 * so the chat works even before /api/track-visit has run.
 */
export async function getOrCreateConversation(
  req: NextRequest,
  res: NextResponse,
): Promise<{
  conversationId: string;
  visitorId: string;
  isNew: boolean;
  lastNotifiedAt: Date | null;
}> {
  const { id: visitorId } = getOrSetVisitorId(req, res);

  const existing = await prisma.conversation.findFirst({
    where: { visitorId, status: "OPEN" },
    orderBy: { lastMessageAt: "desc" },
    select: { id: true, lastNotifiedAt: true },
  });
  if (existing) {
    return {
      conversationId: existing.id,
      visitorId,
      isNew: false,
      lastNotifiedAt: existing.lastNotifiedAt,
    };
  }

  const created = await prisma.conversation.create({
    data: { visitorId },
    select: { id: true },
  });
  return { conversationId: created.id, visitorId, isNew: true, lastNotifiedAt: null };
}

/** The visitor's current OPEN conversation id, or null if they've never messaged. */
export async function findVisitorConversationId(
  req: NextRequest,
): Promise<string | null> {
  const visitorId = req.cookies.get(VISITOR_COOKIE)?.value;
  if (!visitorId) return null;
  const convo = await prisma.conversation.findFirst({
    where: { visitorId, status: "OPEN" },
    orderBy: { lastMessageAt: "desc" },
    select: { id: true },
  });
  return convo?.id ?? null;
}
