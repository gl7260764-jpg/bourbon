import { NextResponse } from "next/server";
import { getCurrentCustomer } from "@/lib/customer-auth";
import { customerUnreadCount } from "@/lib/customer-chat";

export const dynamic = "force-dynamic";

/**
 * Unread replies waiting for the signed-in customer. Drives the badge on the
 * navbar account icon. Returns 0 rather than 401 when signed out, so the
 * navbar can poll unconditionally without branching on auth.
 */
export async function GET() {
  const customer = await getCurrentCustomer().catch(() => null);
  if (!customer) return NextResponse.json({ unread: 0 });
  return NextResponse.json({ unread: await customerUnreadCount(customer.id) });
}
