// Pure constants shared by client (ChatWidget) and server (settings/API).
// Must stay free of server-only imports (prisma, etc.) so it's safe in the
// browser bundle.

export const CHAT_GREETING_KEY = "chat_greeting";

export const DEFAULT_CHAT_GREETING =
  "Hi there! 👋 Welcome to Bourbon & Oak. Have a question about a bottle, an order, or a tour? Send us a message — a real person will reply.";

// Cap on the greeting an admin can save.
export const MAX_GREETING_LEN = 500;
