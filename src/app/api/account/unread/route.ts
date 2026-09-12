import { NextResponse } from "next/server";
import { getCurrentCustomer } from "@/lib/customer-auth";
import { customerUnreadCount } from "@/lib/customer-chat";
import { touchCustomerPresence } from "@/lib/chat-presence";

export const dynamic = "force-dynamic";

/**
 * Unread replies waiting for the signed-in customer. Drives the badge on the
 * navbar account icon and the dashboard tab. Returns 0 rather than 401 when
 * signed out, so the navbar can poll unconditionally without branching on auth.
 *
 * Doubles as the customer's presence heartbeat: callers only poll this while
 * their tab is visible, so a hit here means someone is actually at the screen.
 * That is what the operator reads as "Customer online" — which is why the
 * stamp lives on the poll everyone already makes rather than on a second
 * endpoint nobody would remember to call.
 */
export async function GET() {
  const customer = await getCurrentCustomer().catch(() => null);
  if (!customer) return NextResponse.json({ unread: 0 });
  await touchCustomerPresence(customer.id);
  return NextResponse.json({ unread: await customerUnreadCount(customer.id) });
}
