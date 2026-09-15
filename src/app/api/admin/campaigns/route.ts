import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/* Authorisation is the middleware's job: src/middleware.ts guards
   /api/admin/:path* the same way it guards /admin/:path*. */

/** Start a new, empty draft and hand back its id for the composer to open. */
export async function POST() {
  const campaign = await prisma.campaign.create({ data: {}, select: { id: true } });
  return NextResponse.json({ id: campaign.id }, { status: 201 });
}
