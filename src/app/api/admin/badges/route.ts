import { NextResponse } from "next/server";
import { getAdminBadgeCounts } from "@/lib/admin-badges";
import { touchAdminPresence } from "@/lib/chat-presence";

export const dynamic = "force-dynamic";

/**
 * Live unread counts for the admin sidebar. Polled from every page in the
 * panel, which makes it the natural place to stamp operator presence too:
 * "online" now means the dashboard is open anywhere, not just that one thread
 * happens to be on screen. Auth is handled by middleware (/api/admin/*).
 */
export async function GET() {
  await touchAdminPresence().catch(() => {});
  return NextResponse.json(await getAdminBadgeCounts());
}
