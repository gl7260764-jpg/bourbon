import { prisma } from "@/lib/prisma";
import { getSetting } from "@/lib/settings";
import {
  CHAT_AUTO_REPLY_KEY,
  DEFAULT_CHAT_AUTO_REPLY,
} from "@/lib/chat-constants";
import { appendMessage } from "@/lib/order-chat";

/**
 * Acknowledge someone's first message, once per conversation.
 *
 * Guarded on "has this thread ever had a message from us", not on a flag, so
 * it cannot fire twice and cannot fire at all once a human has replied — the
 * worst outcome would be a robot talking over a real answer.
 *
 * Never allowed to fail the customer's send: their message is already
 * written, and an acknowledgement that did not appear is far better than a
 * message that did not.
 */
export async function maybeAutoReply(conversationId: string): Promise<boolean> {
  try {
    const alreadyReplied = await prisma.chatMessage.findFirst({
      where: { conversationId, sender: "ADMIN" },
      select: { id: true },
    });
    if (alreadyReplied) return false;

    const body = (
      await getSetting(CHAT_AUTO_REPLY_KEY, DEFAULT_CHAT_AUTO_REPLY)
    ).trim();
    if (!body) return false;

    await appendMessage({
      conversationId,
      sender: "ADMIN",
      kind: "TEXT",
      body,
    });
    return true;
  } catch (err) {
    console.error("[chat auto-reply] skipped:", err);
    return false;
  }
}
