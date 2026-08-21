import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { getCurrentCustomer } from "@/lib/customer-auth";
import { findOrderForCustomer } from "@/lib/order-chat";
import { authorizeChannel, orderChannel } from "@/lib/realtime";
import { ADMIN_COOKIE, expectedTokenForCurrentPassword } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

/**
 * Pusher private-channel authorisation.
 *
 * Without this, channel names are guessable strings and anyone could subscribe
 * to `private-order-BO-1043` and read another customer's thread in real time.
 * A subscription is signed only for the order's owner, or for a signed-in
 * admin.
 */
export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: "Invalid request." }, { status: 400 });

  const socketId = String(form.get("socket_id") ?? "");
  const channel = String(form.get("channel_name") ?? "");
  if (!socketId || !channel.startsWith("private-order-")) {
    return NextResponse.json({ error: "Unknown channel." }, { status: 400 });
  }
  const orderNumber = channel.slice("private-order-".length);
  if (!orderNumber) {
    return NextResponse.json({ error: "Unknown channel." }, { status: 400 });
  }

  // --- admin devices ------------------------------------------------------
  const jar = await cookies();
  const adminToken = jar.get(ADMIN_COOKIE)?.value;
  if (adminToken) {
    const expected = await expectedTokenForCurrentPassword();
    if (expected && adminToken === expected) {
      const auth = authorizeChannel(socketId, orderChannel(orderNumber));
      if (!auth) return NextResponse.json({ error: "Realtime unavailable." }, { status: 503 });
      return NextResponse.json(auth);
    }
  }

  // --- the order's own customer ------------------------------------------
  const customer = await getCurrentCustomer();
  if (!customer) return NextResponse.json({ error: "Not authorised." }, { status: 401 });

  const order = await findOrderForCustomer(orderNumber, customer);
  if (!order) return NextResponse.json({ error: "Not authorised." }, { status: 403 });

  const auth = authorizeChannel(socketId, orderChannel(orderNumber));
  if (!auth) return NextResponse.json({ error: "Realtime unavailable." }, { status: 503 });
  return NextResponse.json(auth);
}
