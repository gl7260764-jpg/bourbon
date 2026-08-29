import { NextResponse, type NextRequest } from "next/server";
import { getAuthMode, saveAuthMode } from "@/lib/settings";
import { AUTH_MODES, normalizeAuthMode } from "@/lib/auth-mode-constants";

// Behind /api/admin → middleware guarantees an authenticated admin.

export async function GET() {
  return NextResponse.json({ mode: await getAuthMode() });
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }
  const raw = (body ?? {}) as Record<string, unknown>;

  // Rejected rather than silently defaulted: an unrecognised mode almost
  // certainly means the caller thinks it set something it did not.
  if (typeof raw.mode !== "string" || !AUTH_MODES.includes(normalizeAuthMode(raw.mode)) ||
      normalizeAuthMode(raw.mode) !== raw.mode.toUpperCase()) {
    return NextResponse.json(
      { error: `mode must be one of ${AUTH_MODES.join(", ")}.` },
      { status: 400 },
    );
  }

  const mode = normalizeAuthMode(raw.mode);
  await saveAuthMode(mode);
  return NextResponse.json({ mode });
}
