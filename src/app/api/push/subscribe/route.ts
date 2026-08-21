import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentCustomer } from "@/lib/customer-auth";

interface SubscribeBody {
  endpoint?: string;
  keys?: { p256dh?: string; auth?: string };
  userAgent?: string;
}

export async function POST(req: NextRequest) {
  let body: SubscribeBody;
  try {
    body = (await req.json()) as SubscribeBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const endpoint = body.endpoint?.trim();
  const p256dh = body.keys?.p256dh?.trim();
  const auth = body.keys?.auth?.trim();
  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json(
      { error: "endpoint, keys.p256dh, and keys.auth are required." },
      { status: 400 },
    );
  }

  const userAgent = body.userAgent?.slice(0, 500) ?? req.headers.get("user-agent")?.slice(0, 500) ?? null;

  /* Attach the device to the signed-in customer, if any. This is what makes
     "notify this one buyer their payment details are ready" possible at all.
     Done on every upsert, not just create, so a device that subscribed while
     logged out gets linked the moment its owner signs in and re-subscribes. */
  const customer = await getCurrentCustomer().catch(() => null);
  const customerId = customer?.id ?? null;

  await prisma.pushSubscription.upsert({
    where: { endpoint },
    update: {
      p256dh,
      auth,
      userAgent: userAgent ?? undefined,
      // Never unset an existing link just because this request was anonymous.
      ...(customerId ? { customerId } : {}),
    },
    create: { endpoint, p256dh, auth, userAgent: userAgent ?? undefined, customerId },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  let body: { endpoint?: string };
  try {
    body = (await req.json()) as { endpoint?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const endpoint = body.endpoint?.trim();
  if (!endpoint) {
    return NextResponse.json({ error: "endpoint required." }, { status: 400 });
  }

  await prisma.pushSubscription.deleteMany({ where: { endpoint } });
  return NextResponse.json({ ok: true });
}
