import { NextResponse, type NextRequest } from "next/server";
import { getPopupSettings, savePopupSettings } from "@/lib/settings";
import {
  MAX_DELAY_SECONDS,
  MIN_DELAY_SECONDS,
  normalizePopupSettings,
} from "@/lib/popup-constants";

// Behind /api/admin → middleware guarantees an authenticated admin.

export async function GET() {
  return NextResponse.json(await getPopupSettings());
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const raw = (body ?? {}) as Record<string, unknown>;

  // Reject an out-of-range delay loudly instead of silently clamping it —
  // an admin who types 1 should be told why they got 3.
  const delay = Number(raw.delaySeconds);
  if (!Number.isFinite(delay) || delay < MIN_DELAY_SECONDS || delay > MAX_DELAY_SECONDS) {
    return NextResponse.json(
      {
        error: `Delay must be between ${MIN_DELAY_SECONDS} and ${MAX_DELAY_SECONDS} seconds.`,
      },
      { status: 400 },
    );
  }

  const settings = normalizePopupSettings(raw);
  await savePopupSettings(settings);
  return NextResponse.json(settings);
}
