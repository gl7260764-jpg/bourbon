import { NextResponse, type NextRequest } from "next/server";
import { getSetting, setSetting } from "@/lib/settings";
import {
  CHAT_GREETING_KEY,
  DEFAULT_CHAT_GREETING,
  MAX_GREETING_LEN,
} from "@/lib/chat-constants";

// Behind /api/admin → middleware guarantees an authenticated admin.

export async function GET() {
  const greeting = await getSetting(CHAT_GREETING_KEY, DEFAULT_CHAT_GREETING);
  return NextResponse.json({ greeting });
}

interface SaveBody {
  greeting?: string;
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

  await setSetting(CHAT_GREETING_KEY, greeting);
  return NextResponse.json({ greeting });
}
