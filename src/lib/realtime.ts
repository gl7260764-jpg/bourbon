import Pusher from "pusher";

/**
 * Realtime chat delivery.
 *
 * Raw WebSockets are not an option here: Next route handlers are
 * request/response and a serverless deploy has no long-lived process to hold a
 * socket open. Pusher gives us the same push-to-client behaviour over a
 * connection it maintains, with no server to run.
 *
 * Delivery is best-effort by design. Every trigger site writes to the database
 * first and publishes afterwards, and the client still fetches the thread on
 * open — so a dropped event costs latency, never a message.
 */

let client: Pusher | null = null;

function pusher(): Pusher | null {
  if (client) return client;
  const { PUSHER_APP_ID, PUSHER_KEY, PUSHER_SECRET, PUSHER_CLUSTER } = process.env;
  if (!PUSHER_APP_ID || !PUSHER_KEY || !PUSHER_SECRET || !PUSHER_CLUSTER) {
    console.warn("[realtime] Pusher env vars missing — realtime disabled, chat falls back to polling.");
    return null;
  }
  client = new Pusher({
    appId: PUSHER_APP_ID,
    key: PUSHER_KEY,
    secret: PUSHER_SECRET,
    cluster: PUSHER_CLUSTER,
    useTLS: true,
  });
  return client;
}

/* Private channels require auth, which is what stops one customer subscribing
   to another's order thread. The channel name carries the order number and the
   auth endpoint checks ownership before signing. */
export function orderChannel(orderNumber: string): string {
  return `private-order-${orderNumber}`;
}

export const CHAT_EVENT = "chat:message";

export async function publishChatMessage(
  orderNumber: string,
  message: unknown,
): Promise<void> {
  const p = pusher();
  if (!p) return;
  try {
    await p.trigger(orderChannel(orderNumber), CHAT_EVENT, message);
  } catch (err) {
    // Never let a realtime failure surface to the sender — the message is
    // already written and the next fetch will show it.
    console.error("[realtime] publish failed:", err);
  }
}

/** Signs a private-channel subscription. Callers must authorise first. */
export function authorizeChannel(socketId: string, channel: string) {
  const p = pusher();
  if (!p) return null;
  return p.authorizeChannel(socketId, channel);
}
