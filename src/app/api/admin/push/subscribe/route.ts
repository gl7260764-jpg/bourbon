import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

// This route lives under /api/admin, so the middleware guarantees the caller is
// an authenticated admin. Registering here flags the device with isAdmin = true
// so it receives live-chat pings (storefront subscribers never do).

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

  const userAgent =
    body.userAgent?.slice(0, 500) ??
    req.headers.get("user-agent")?.slice(0, 500) ??
    null;

  await prisma.pushSubscription.upsert({
    where: { endpoint },
    update: { p256dh, auth, isAdmin: true, userAgent: userAgent ?? undefined },
    create: { endpoint, p256dh, auth, isAdmin: true, userAgent: userAgent ?? undefined },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
