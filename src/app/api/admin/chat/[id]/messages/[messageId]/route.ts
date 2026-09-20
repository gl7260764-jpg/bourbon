import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { MAX_BODY_CHARS, toView } from "@/lib/order-chat";

export const dynamic = "force-dynamic";

/**
 * Operator moderation of a single message.
 *
 * Admin-only by virtue of living under /api/admin, which middleware gates.
 *
 * DELETE soft-deletes: the row stays, every read path filters it, and the
 * customer's client — which full-replaces its list on each poll — simply stops
 * showing it. No tombstone, by design.
 *
 * PATCH edits the body of an ADMIN message. Customer messages are not editable:
 * deleting removes something that was said, but editing someone else's message
 * puts words in their mouth, and this thread carries payment claims and invoice
 * discussions that a dispute may later turn on.
 */

const SELECT = {
  id: true,
  sender: true,
  kind: true,
  body: true,
  createdAt: true,
  mediaPublicId: true,
  mediaDurationMs: true,
  contextOrderNumber: true,
  invoice: {
    select: { invoiceNumber: true, total: true, voidedAt: true, snapshot: true },
  },
} as const;

/** Both handlers need the same "exists, in this thread, not already gone" check. */
async function load(conversationId: string, messageId: string) {
  const message = await prisma.chatMessage.findUnique({
    where: { id: messageId },
    select: { id: true, conversationId: true, sender: true, body: true, deletedAt: true, originalBody: true },
  });
  if (!message || message.conversationId !== conversationId) return null;
  return message;
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; messageId: string }> },
) {
  const { id, messageId } = await params;

  const message = await load(id, messageId);
  if (!message) {
    return NextResponse.json({ error: "Message not found." }, { status: 404 });
  }
  if (message.deletedAt) {
    return NextResponse.json({ ok: true, alreadyDeleted: true });
  }

  /* Unread counters are denormalised on the conversation, so removing a
     message that was still unread has to move the counter too — otherwise the
     badge keeps promising something the thread no longer contains. Clamped at
     zero because the counters are also reset by "mark read" and could already
     be lower than the number of unread rows. */
  const isFromCustomer = message.sender === "VISITOR";
  const convo = await prisma.conversation.findUnique({
    where: { id },
    select: { adminUnread: true, customerUnread: true },
  });

  await prisma.$transaction([
    prisma.chatMessage.update({
      where: { id: messageId },
      data: { deletedAt: new Date(), deletedBy: "admin" },
    }),
    prisma.conversation.update({
      where: { id },
      data: isFromCustomer
        ? { adminUnread: Math.max(0, (convo?.adminUnread ?? 0) - 1) }
        : { customerUnread: Math.max(0, (convo?.customerUnread ?? 0) - 1) },
    }),
  ]);

  /* lastMessageAt drives the inbox ordering and preview. If the message just
     removed was the newest one, fall back to the newest that remains so the
     thread does not advertise a message nobody can open. */
  const newest = await prisma.chatMessage.findFirst({
    where: { conversationId: id, deletedAt: null },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true, sender: true },
  });
  /* Only rewritten when something remains: both columns are non-nullable, and
     a thread emptied of every message has no ordering left to be wrong about. */
  if (newest) {
    await prisma.conversation.update({
      where: { id },
      data: { lastMessageAt: newest.createdAt, lastMessageFrom: newest.sender },
    });
  }

  return NextResponse.json({ ok: true, id: messageId });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; messageId: string }> },
) {
  const { id, messageId } = await params;

  let payload: { body?: string };
  try {
    payload = (await req.json()) as { body?: string };
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const body = (payload.body ?? "").trim();
  if (!body) {
    return NextResponse.json(
      { error: "A message cannot be empty. Delete it instead." },
      { status: 400 },
    );
  }
  if (body.length > MAX_BODY_CHARS) {
    return NextResponse.json(
      { error: `Message is too long (${MAX_BODY_CHARS} characters max).` },
      { status: 400 },
    );
  }

  const message = await load(id, messageId);
  if (!message || message.deletedAt) {
    return NextResponse.json({ error: "Message not found." }, { status: 404 });
  }
  if (message.sender !== "ADMIN") {
    return NextResponse.json(
      { error: "Only your own messages can be edited." },
      { status: 403 },
    );
  }

  const updated = await prisma.chatMessage.update({
    where: { id: messageId },
    data: {
      body,
      editedAt: new Date(),
      // Keep the wording as it FIRST stood. A second edit must not overwrite
      // the original with the text of the first edit.
      originalBody: message.originalBody ?? message.body,
    },
    select: SELECT,
  });

  return NextResponse.json({ message: toView(updated) });
}
