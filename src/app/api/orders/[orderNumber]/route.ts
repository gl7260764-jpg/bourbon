import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toOrderSnapshot } from "@/lib/order-snapshot";

// Still used by the confirmation page's client fallback (when the order number
// is only in sessionStorage, not the URL). The normal path is server-rendered
// in checkout/confirmation/page.tsx and never calls this.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  const { orderNumber } = await params;

  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: { items: true },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  return NextResponse.json(toOrderSnapshot(order));
}
