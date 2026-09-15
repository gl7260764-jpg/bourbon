import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/* Authorisation is the middleware's job: src/middleware.ts guards
   /api/admin/:path* the same way it guards /admin/:path*. */

const money = (v: unknown) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(v));

/**
 * Bottle search for the composer's featured-bottle picker. Archived bottles
 * are left out — featuring something that cannot be bought sends the whole
 * list to a dead page.
 */
export async function GET(req: NextRequest) {
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim().slice(0, 80);

  const products = await prisma.product.findMany({
    where: {
      availability: { not: "ARCHIVED" },
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { distillery: { contains: q, mode: "insensitive" } },
              { sku: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: [{ isFeatured: "desc" }, { name: "asc" }],
    take: 20,
    select: {
      id: true,
      name: true,
      distillery: true,
      bottlePrice: true,
      availability: true,
      images: {
        orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
        take: 1,
        select: { url: true },
      },
    },
  });

  return NextResponse.json({
    products: products.map((p) => ({
      id: p.id,
      name: p.name,
      distillery: p.distillery,
      price: money(p.bottlePrice),
      availability: p.availability,
      imageUrl: p.images[0]?.url ?? null,
    })),
  });
}
