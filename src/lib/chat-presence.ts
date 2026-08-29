import { prisma } from "@/lib/prisma";
import { getSetting, setSetting } from "@/lib/settings";

/**
 * Typing indicators, online status and read receipts — all polled.
 *
 * Pusher is returning 401, so none of this can ride a socket. Each signal is a
 * timestamp the other side reads on its next poll, which is why the windows
 * below are generous: a 3s poll against a 6s window never flickers, where a
 * 3s window would blink off between ticks.
 */

/** A typing stamp counts as "still typing" for this long after it was set. */
export const TYPING_WINDOW_MS = 6_000;
/** Don't re-stamp more often than this — one write per keystroke is absurd. */
export const TYPING_PING_THROTTLE_MS = 2_500;

const ADMIN_SEEN_KEY = "admin_last_seen_at";
/** How long after their last heartbeat the operator still reads as online. */
export const ADMIN_ONLINE_WINDOW_MS = 90_000;

export function isFresh(at: Date | null | undefined, windowMs: number): boolean {
  return Boolean(at && Date.now() - at.getTime() < windowMs);
}

/** Called from the admin inbox while it is open. */
export async function touchAdminPresence(): Promise<void> {
  await setSetting(ADMIN_SEEN_KEY, String(Date.now()));
}

export async function isAdminOnline(): Promise<boolean> {
  const raw = await getSetting(ADMIN_SEEN_KEY, "0");
  const ts = Number(raw);
  return Number.isFinite(ts) && Date.now() - ts < ADMIN_ONLINE_WINDOW_MS;
}

export async function setTyping(
  conversationId: string,
  who: "customer" | "admin",
): Promise<void> {
  await prisma.conversation.update({
    where: { id: conversationId },
    data:
      who === "admin"
        ? { adminTypingAt: new Date() }
        : { visitorTypingAt: new Date() },
  });
}

/** Clear our own stamp the moment a message actually lands. */
export async function clearTyping(
  conversationId: string,
  who: "customer" | "admin",
): Promise<void> {
  await prisma.conversation
    .update({
      where: { id: conversationId },
      data:
        who === "admin"
          ? { adminTypingAt: null }
          : { visitorTypingAt: null },
    })
    .catch(() => {
      /* presence is cosmetic — never fail a send over it */
    });
}

/** The customer opened the thread. Only the operator is ever shown this. */
export async function markCustomerRead(conversationId: string): Promise<void> {
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { customerLastReadAt: new Date(), customerUnread: 0 },
  });
}
