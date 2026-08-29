import { NextResponse } from "next/server";
import { getPushPromptSettings } from "@/lib/settings";
import { DEFAULT_PUSH_PROMPT_SETTINGS } from "@/lib/push-prompt-constants";

export const dynamic = "force-dynamic";

// Public — the dashboard prompt fetches its timing here so the admin can
// retune it without a redeploy.
export async function GET() {
  try {
    return NextResponse.json(await getPushPromptSettings());
  } catch (err) {
    // A settings-table blip must not break the dashboard; fall back to the
    // built-in defaults rather than 500ing.
    console.error("[GET /api/push-prompt-settings] failed:", err);
    return NextResponse.json(DEFAULT_PUSH_PROMPT_SETTINGS);
  }
}
