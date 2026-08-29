// Pure constants shared by client (ChatWidget) and server (settings/API).
// Must stay free of server-only imports (prisma, etc.) so it's safe in the
// browser bundle.

export const CHAT_GREETING_KEY = "chat_greeting";

export const DEFAULT_CHAT_GREETING =
  "Hi there! 👋 Welcome to Bourbon & Oak. Have a question about a bottle, an order, or a tour? Send us a message — a real person will reply.";

// Cap on the greeting an admin can save.
export const MAX_GREETING_LEN = 500;

export const CHAT_AUTO_REPLY_KEY = "chat_auto_reply";

/** Posted once per thread, right after someone's first message. */
export const DEFAULT_CHAT_AUTO_REPLY =
  "Thanks for your message — it's landed with us. A real person reads every one, and we'll get back to you shortly.";

export const MAX_AUTO_REPLY_LEN = 500;
