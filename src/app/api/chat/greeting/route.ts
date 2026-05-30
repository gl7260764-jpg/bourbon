import { NextResponse } from "next/server";
import { getSetting } from "@/lib/settings";
import { CHAT_GREETING_KEY, DEFAULT_CHAT_GREETING } from "@/lib/chat-constants";

export const dynamic = "force-dynamic";

// Public — the storefront chat widget fetches the current greeting here.
export async function GET() {
  const greeting = await getSetting(CHAT_GREETING_KEY, DEFAULT_CHAT_GREETING);
  return NextResponse.json({ greeting });
}
