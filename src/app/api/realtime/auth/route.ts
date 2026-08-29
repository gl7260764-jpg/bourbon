import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { getCurrentCustomer } from "@/lib/customer-auth";
import { findOrderForCustomer } from "@/lib/order-chat";
import { authorizeChannel, customerChannel, orderChannel } from "@/lib/realtime";
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
  if (!socketId) {
    return NextResponse.json({ error: "Unknown channel." }, { status: 400 });
  }

  /* Customer threads. The channel embeds the customer id, so the only holder
     ever signed for it is that customer — or an admin, who can already read
     every thread from the inbox. Checked before the order branch because the
     two prefixes are disjoint. */
  if (channel.startsWith("private-customer-")) {
    const customerId = channel.slice("private-customer-".length);
    if (!customerId) {
      return NextResponse.json({ error: "Unknown channel." }, { status: 400 });
    }

    const jarC = await cookies();
    const adminTokenC = jarC.get(ADMIN_COOKIE)?.value;
    if (adminTokenC) {
      const expected = await expectedTokenForCurrentPassword();
      if (expected && adminTokenC === expected) {
        const auth = authorizeChannel(socketId, customerChannel(customerId));
        if (!auth) {
          return NextResponse.json({ error: "Realtime unavailable." }, { status: 503 });
        }
        return NextResponse.json(auth);
      }
    }

    const me = await getCurrentCustomer();
    if (!me) return NextResponse.json({ error: "Not authorised." }, { status: 401 });
    if (me.id !== customerId) {
      return NextResponse.json({ error: "Not authorised." }, { status: 403 });
    }
    const auth = authorizeChannel(socketId, customerChannel(customerId));
    if (!auth) {
      return NextResponse.json({ error: "Realtime unavailable." }, { status: 503 });
    }
    return NextResponse.json(auth);
  }

  if (!channel.startsWith("private-order-")) {
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
