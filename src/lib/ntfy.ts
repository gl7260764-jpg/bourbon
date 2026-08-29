/**
 * ntfy push notifications for the operator.
 *
 * One POST per event to a topic you subscribe to in the ntfy app. Configured
 * entirely through env, so turning it off is a matter of removing NTFY_TOPIC
 * rather than a deploy.
 *
 *   NTFY_TOPIC          required — the topic everything goes to
 *   NTFY_SERVER         optional — defaults to https://ntfy.sh
 *   NTFY_TOKEN          optional — bearer token for a protected topic
 *   NTFY_TOPIC_ORDERS   optional — per-event overrides, each falling back to
 *   NTFY_TOPIC_SUBSCRIBER          NTFY_TOPIC. Use these only if you want to
 *   NTFY_TOPIC_MESSAGES            mute one kind without muting the rest.
 *   NTFY_TOPIC_FRONTCHAT
 *   NTFY_TOPIC_CONTACT
 *
 * Every call is best effort and never throws. A notification that failed to
 * send must never cost someone their order, their message or their signup —
 * so failures are logged and swallowed, and callers do not await the result
 * into anything user-visible.
 */

export type NtfyEvent =
  | "orders"
  | "subscriber"
  | "messages"
  | "frontchat"
  | "contact";

const ENV_BY_EVENT: Record<NtfyEvent, string> = {
  orders: "NTFY_TOPIC_ORDERS",
  subscriber: "NTFY_TOPIC_SUBSCRIBER",
  messages: "NTFY_TOPIC_MESSAGES",
  frontchat: "NTFY_TOPIC_FRONTCHAT",
  contact: "NTFY_TOPIC_CONTACT",
};

/** Shown as the notification's icon-ish tag row in the ntfy app. */
const TAGS_BY_EVENT: Record<NtfyEvent, string> = {
  orders: "moneybag",
  subscriber: "envelope",
  messages: "speech_balloon",
  frontchat: "wave",
  contact: "mailbox",
};

const SITE = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://bourbonoaklover.com"
).replace(/\/$/, "");

function topicFor(event: NtfyEvent): string | null {
  const specific = process.env[ENV_BY_EVENT[event]]?.trim();
  const base = process.env.NTFY_TOPIC?.trim();
  return specific || base || null;
}

export interface NtfyInput {
  event: NtfyEvent;
  title: string;
  message: string;
  /** Path or absolute URL opened when the notification is tapped. */
  url?: string;
  /** 1 min … 5 max. Orders default to 4; everything else to 3. */
  priority?: 1 | 2 | 3 | 4 | 5;
}

export async function notify(input: NtfyInput): Promise<boolean> {
  const topic = topicFor(input.event);
  if (!topic) return false; // Not configured — silently inert, by design.

  const server = (process.env.NTFY_SERVER ?? "https://ntfy.sh").replace(/\/$/, "");
  const token = process.env.NTFY_TOKEN?.trim();

  const click = input.url
    ? input.url.startsWith("http")
      ? input.url
      : `${SITE}${input.url}`
    : undefined;

  try {
    /* Headers rather than the JSON body: ntfy's header API is the documented
       one and keeps the body as the plain message, which is what shows in the
       notification. Header values must be latin-1, so anything outside it is
       stripped — an em dash in a customer's message should not 500 a send. */
    const res = await fetch(`${server}/${encodeURIComponent(topic)}`, {
      method: "POST",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        Title: headerSafe(input.title),
        Priority: String(input.priority ?? (input.event === "orders" ? 4 : 3)),
        Tags: TAGS_BY_EVENT[input.event],
        ...(click ? { Click: click } : {}),
      },
      body: input.message.slice(0, 3500),
      // Never let a slow notification service hold a request open.
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      console.error(`[ntfy] ${input.event} rejected: ${res.status}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error(`[ntfy] ${input.event} failed:`, err);
    return false;
  }
}

/** ntfy header values go over HTTP/1.1 headers, which are latin-1 only. */
function headerSafe(value: string): string {
  return value
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, "")
    .slice(0, 200)
    .trim();
}

/** Fire and forget. Use where the caller must not wait on, or fail for, ntfy. */
export function notifyAsync(input: NtfyInput): void {
  void notify(input);
}
