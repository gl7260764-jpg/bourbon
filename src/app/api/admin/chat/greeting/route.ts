import { NextResponse, type NextRequest } from "next/server";
import { getSetting, setSetting } from "@/lib/settings";
import {
  CHAT_GREETING_KEY,
  DEFAULT_CHAT_GREETING,
  MAX_GREETING_LEN,
  CHAT_AUTO_REPLY_KEY,
  DEFAULT_CHAT_AUTO_REPLY,
  MAX_AUTO_REPLY_LEN,
} from "@/lib/chat-constants";

// Behind /api/admin → middleware guarantees an authenticated admin.

export async function GET() {
  const [greeting, autoReply] = await Promise.all([
    getSetting(CHAT_GREETING_KEY, DEFAULT_CHAT_GREETING),
    getSetting(CHAT_AUTO_REPLY_KEY, DEFAULT_CHAT_AUTO_REPLY),
  ]);
  return NextResponse.json({ greeting, autoReply });
}

interface SaveBody {
  greeting?: string;
  autoReply?: string;
}

export async function POST(req: NextRequest) {
  let body: SaveBody;
  try {
    body = (await req.json()) as SaveBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const greeting = body.greeting?.trim();
  if (!greeting) {
    return NextResponse.json({ error: "Greeting is required." }, { status: 400 });
  }
  if (greeting.length > MAX_GREETING_LEN) {
    return NextResponse.json(
      { error: `Greeting too long (max ${MAX_GREETING_LEN} characters).` },
      { status: 400 },
    );
  }

  /* Optional: an empty string is a deliberate "send no acknowledgement",
     which is why it is only written when the field is present at all. */
  let autoReply: string | undefined;
  if (typeof body.autoReply === "string") {
    autoReply = body.autoReply.trim();
    if (autoReply.length > MAX_AUTO_REPLY_LEN) {
      return NextResponse.json(
        { error: `Auto-reply too long (max ${MAX_AUTO_REPLY_LEN} characters).` },
        { status: 400 },
      );
    }
    await setSetting(CHAT_AUTO_REPLY_KEY, autoReply);
  }

  await setSetting(CHAT_GREETING_KEY, greeting);
  return NextResponse.json({ greeting, autoReply });
}
