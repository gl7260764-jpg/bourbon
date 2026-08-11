import { NextResponse } from "next/server";
import { getPopupSettings } from "@/lib/settings";
import { DEFAULT_POPUP_SETTINGS } from "@/lib/popup-constants";

export const dynamic = "force-dynamic";

// Public — the storefront popup fetches its timing here so the admin can
// retune it without a redeploy.
export async function GET() {
  try {
    return NextResponse.json(await getPopupSettings());
  } catch (err) {
    // A settings-table blip must not break the storefront; fall back to the
    // built-in defaults rather than 500ing.
    console.error("[GET /api/popup-settings] failed:", err);
    return NextResponse.json(DEFAULT_POPUP_SETTINGS);
  }
}
