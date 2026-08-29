import { NextResponse, type NextRequest } from "next/server";
import {
  getPushPromptSettings,
  savePushPromptSettings,
} from "@/lib/settings";
import {
  MAX_PUSH_DELAY_SECONDS,
  MAX_PUSH_REPROMPT_DAYS,
  MIN_PUSH_DELAY_SECONDS,
  normalizePushPromptSettings,
} from "@/lib/push-prompt-constants";

// Behind /api/admin → middleware guarantees an authenticated admin.

export async function GET() {
  return NextResponse.json(await getPushPromptSettings());
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const raw = (body ?? {}) as Record<string, unknown>;

  // Reject out-of-range values loudly rather than silently clamping, so an
  // admin who types 5000 is told why they got something else.
  const delay = Number(raw.delaySeconds);
  if (
    !Number.isFinite(delay) ||
    delay < MIN_PUSH_DELAY_SECONDS ||
    delay > MAX_PUSH_DELAY_SECONDS
  ) {
    return NextResponse.json(
      {
        error: `Delay must be between ${MIN_PUSH_DELAY_SECONDS} and ${MAX_PUSH_DELAY_SECONDS} seconds.`,
      },
      { status: 400 },
    );
  }

  const days = Number(raw.repromptAfterDays);
  if (!Number.isFinite(days) || days < 0 || days > MAX_PUSH_REPROMPT_DAYS) {
    return NextResponse.json(
      { error: `Ask again must be between 0 and ${MAX_PUSH_REPROMPT_DAYS} days.` },
      { status: 400 },
    );
  }

  const settings = normalizePushPromptSettings(raw);
  await savePushPromptSettings(settings);
  return NextResponse.json(settings);
}
