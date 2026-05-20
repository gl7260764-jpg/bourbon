import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import ShopGrid, { type ShopProductCard } from "../shop/ShopGrid";
import SearchInline from "./SearchInline";

export const metadata = {
  title: "Search | Bourbon & Oak",
  description: "Find bourbon, rye, Pappy and more by name, distillery, or flavor.",
};

interface PageProps {
  searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: PageProps) {
  const { q: rawQ } = await searchParams;
  const q = (rawQ ?? "").trim();

  let products: Awaited<ReturnType<typeof queryProducts>> = [];
  if (q.length >= 2) {
    products = await queryProducts(q);
  }

  const cards: ShopProductCard[] = products.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    ageLabel: p.ageYears ? `${p.ageYears} Year` : "NAS",
    price: p.bottlePrice.toNumber(),
    compareAtPrice: p.compareAtPrice?.toNumber() ?? null,
    rating: p.rating ? p.rating.toNumber() : 0,
    reviews: p.reviewCount,
    image: p.images[0]?.url ?? "",
    badge: p.badge,
    availabilityLabel: null,
  }));

  return (
    <main className="bg-bourbon-cream min-h-screen pt-24 sm:pt-32 pb-16 sm:pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-bourbon-gold text-xs tracking-[0.3em] uppercase mb-3">
          Search
        </p>
        <h1 className="font-[family-name:var(--font-playfair)] text-4xl sm:text-5xl font-bold text-bourbon-deep mb-3">
          {q ? `Results for "${q}"` : "Find your bottle"}
        </h1>
        <div className="w-20 h-0.5 bg-bourbon-gold mb-6" />

        <SearchInline initialQuery={q} />

        {q.length < 2 ? (
          <div className="bg-white border border-bourbon-deep/5 p-12 mt-8 text-center">
            <p className="text-bourbon-stone">
              Search by bottle name, distillery, master distiller, flavor note, or category.
            </p>
            <p className="text-bourbon-stone/70 text-sm mt-2">
              Try <em>&quot;pappy&quot;</em>, <em>&quot;rye&quot;</em>, <em>&quot;Eleanor Hayes&quot;</em>, or <em>&quot;leather&quot;</em>.
            </p>
          </div>
        ) : cards.length === 0 ? (
          <div className="bg-white border border-bourbon-deep/5 p-12 mt-8 text-center">
            <p className="text-bourbon-stone mb-4">
              Nothing matched <span className="text-bourbon-deep font-semibold">&quot;{q}&quot;</span>.
            </p>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 text-bourbon-gold text-xs tracking-widest uppercase hover:text-bourbon-amber transition-colors"
            >
              Browse the full collection →
            </Link>
          </div>
        ) : (
          <>
            <p className="text-bourbon-stone text-sm mt-6 mb-6">
              {cards.length} {cards.length === 1 ? "result" : "results"}
            </p>
            <ShopGrid products={cards} />
          </>
        )}
      </div>
    </main>
  );
}

async function queryProducts(q: string) {
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

  return prisma.product.findMany({
    where: { AND: tokenFilters },
    orderBy: [{ isFeatured: "desc" }, { rating: "desc" }],
    include: {
      images: { orderBy: { sortOrder: "asc" }, take: 1 },
    },
  });
}
