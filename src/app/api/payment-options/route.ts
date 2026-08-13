import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Public — the checkout form renders the available rails from here.
//
// NOTE: `instructions` is deliberately NOT selected. Those are the account
// details (Chime handle, wallet address) and they are only released once an
// order exists, via the confirmation page and the order email. Returning them
// here would publish them to anyone who opens /checkout, or who simply calls
// this endpoint.
export async function GET() {
  try {
    const options = await prisma.paymentOption.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
      select: {
        key: true,
        label: true,
        detail: true,
        discountRate: true,
      },
    });

    return NextResponse.json(
      options.map((o) => ({
        key: o.key,
        label: o.label,
        detail: o.detail,
        instructions: null,
        discountRate: Number(o.discountRate),
      })),
    );
  } catch (err) {
    console.error("[GET /api/payment-options] failed:", err);
    return NextResponse.json([], { status: 200 });
  }
}
