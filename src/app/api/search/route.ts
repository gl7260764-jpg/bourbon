import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const MAX_RESULTS = 20;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();
  const limit = Math.min(
    Math.max(Number(searchParams.get("limit") ?? MAX_RESULTS), 1),
    50
  );

  if (q.length < 2) {
    return NextResponse.json({ q, results: [], count: 0 });
  }

  const tokens = q.split(/\s+/).filter(Boolean);
  const tokenFilters: Prisma.ProductWhereInput[] = tokens.map((t) => ({
    OR: [
      { name: { contains: t, mode: "insensitive" } },
      { subtitle: { contains: t, mode: "insensitive" } },
      { distillery: { contains: t, mode: "insensitive" } },
      { masterDistiller: { contains: t, mode: "insensitive" } },
      { description: { contains: t, mode: "insensitive" } },
      { flavorTags: { has: t.toLowerCase() } },
      { category: { name: { contains: t, mode: "insensitive" } } },
    ],
  }));

  const products = await prisma.product.findMany({
    where: { AND: tokenFilters },
    orderBy: [{ isFeatured: "desc" }, { rating: "desc" }],
    take: limit,
    include: {
      category: { select: { name: true, slug: true } },
      images: { orderBy: { sortOrder: "asc" }, take: 1 },
    },
  });

  const results = products.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    subtitle: p.subtitle,
    ageLabel: p.ageYears ? `${p.ageYears} Year` : "NAS",
    price: p.bottlePrice.toNumber(),
    image: p.images[0]?.url ?? "",
    categoryName: p.category.name,
    categorySlug: p.category.slug,
  }));

  return NextResponse.json({ q, results, count: results.length });
}
