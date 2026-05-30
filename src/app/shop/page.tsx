import Link from "next/link";
import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";
import { Availability } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import ShopFilters from "./ShopFilters";
import ShopGrid, { type ShopProductCard } from "./ShopGrid";

export async function generateMetadata({
  searchParams,
}: PageProps): Promise<Metadata> {
  const { category } = await searchParams;
  if (category) {
    const cat = await prisma.category.findUnique({
      where: { slug: category },
      select: { name: true, description: true },
    });
    if (cat) {
      const description =
        cat.description ??
        `Shop ${cat.name} Kentucky bourbon online — hand-selected bottles, allocated releases, shipped from our Bardstown cellar.`;
      return {
        title: `${cat.name} Bourbon — Buy Online | Bourbon & Oak`,
        description: description.slice(0, 158),
        alternates: { canonical: `/shop?category=${category}` },
        openGraph: {
          title: `${cat.name} Bourbon — Buy Online`,
          description: description.slice(0, 158),
          url: `/shop?category=${category}`,
          type: "website",
        },
      };
    }
  }
  return {
    title: "Buy Kentucky Bourbon Online — Single Barrel & Small Batch",
    description:
      "Shop Kentucky bourbon, rye whiskey, Pappy Van Winkle and allocated releases. Hand-selected bottles shipped from our Bardstown cellar.",
    alternates: { canonical: "/shop" },
    openGraph: {
      title: "Buy Kentucky Bourbon Online — Single Barrel & Small Batch",
      description:
        "Shop Kentucky bourbon, rye whiskey, Pappy Van Winkle and allocated releases.",
      url: "/shop",
      type: "website",
    },
  };
}

const SORT_MAP: Record<string, Prisma.ProductOrderByWithRelationInput> = {
  featured: { isFeatured: "desc" },
  "price-asc": { bottlePrice: "asc" },
  "price-desc": { bottlePrice: "desc" },
  "age-desc": { ageYears: "desc" },
  "rating-desc": { rating: "desc" },
};

const AVAILABILITY_LABELS: Partial<Record<Availability, string>> = {
  LOW_STOCK: "Low Stock",
  ALLOCATED: "Allocated",
  PRE_ORDER: "Pre-order",
  SOLD_OUT: "Sold Out",
};

interface PageProps {
  searchParams: Promise<{ category?: string; sort?: string }>;
}

export default async function ShopPage({ searchParams }: PageProps) {
  const { category, sort = "featured" } = await searchParams;
  const orderBy = SORT_MAP[sort] ?? SORT_MAP.featured;

  const [allCategories, products] = await Promise.all([
    prisma.category.findMany({
      orderBy: { sortOrder: "asc" },
      include: { _count: { select: { products: true } } },
    }),
    prisma.product.findMany({
      where: category
        ? { category: { slug: category } }
        : undefined,
      orderBy,
      include: {
        images: { orderBy: { sortOrder: "asc" }, take: 1 },
      },
    }),
  ]);

  const totalCount = await prisma.product.count();

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
    availabilityLabel: AVAILABILITY_LABELS[p.availability] ?? null,
  }));

  const activeCategoryName = category
    ? allCategories.find((c) => c.slug === category)?.name
    : null;

  return (
    <main className="bg-bourbon-cream min-h-screen pt-24 sm:pt-32 pb-20">
      {/* Page header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8 sm:mb-12">
        <p className="text-bourbon-gold text-[10px] sm:text-xs tracking-[0.3em] uppercase mb-3">
          The Collection
        </p>
        <h1 className="font-[family-name:var(--font-playfair)] text-3xl sm:text-5xl md:text-6xl font-bold text-bourbon-deep mb-3">
          {activeCategoryName ?? "Shop All Bourbon"}
        </h1>
        <div className="w-16 sm:w-20 h-0.5 bg-bourbon-gold mb-4 sm:mb-5" />
        <p className="text-bourbon-stone text-sm sm:text-base max-w-2xl">
          {activeCategoryName
            ? `Browse our ${activeCategoryName.toLowerCase()} selection — each bottle hand-selected for character and craft.`
            : "From everyday bottled-in-bond to allocated single barrels, every bottle in our collection is rooted in patience and place."}
        </p>
      </div>

      {/* Mobile category chips (horizontal scroll, <lg only) */}
      <div className="lg:hidden mb-6 border-b border-bourbon-deep/10 pb-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 overflow-x-auto">
          <ul className="flex gap-2 min-w-max">
            <li>
              <Link
                href="/shop"
                className={`inline-flex items-center gap-2 whitespace-nowrap px-4 py-2 text-xs tracking-widest uppercase border transition-colors ${
                  !category
                    ? "bg-bourbon-deep text-bourbon-gold border-bourbon-deep"
                    : "bg-white text-bourbon-stone border-bourbon-deep/15 hover:border-bourbon-gold"
                }`}
              >
                <span>All</span>
                <span className="text-[10px] opacity-60">{totalCount}</span>
              </Link>
            </li>
            {allCategories.map((cat) => (
              <li key={cat.id}>
                <Link
                  href={`/shop?category=${cat.slug}`}
                  className={`inline-flex items-center gap-2 whitespace-nowrap px-4 py-2 text-xs tracking-widest uppercase border transition-colors ${
                    category === cat.slug
                      ? "bg-bourbon-deep text-bourbon-gold border-bourbon-deep"
                      : "bg-white text-bourbon-stone border-bourbon-deep/15 hover:border-bourbon-gold"
                  }`}
                >
                  <span>{cat.name}</span>
                  <span className="text-[10px] opacity-60">{cat._count.products}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 lg:grid lg:grid-cols-[240px_1fr] gap-10">
        {/* Sidebar — desktop only */}
        <aside className="hidden lg:block">
          <div className="sticky top-28">
            <h2 className="font-[family-name:var(--font-playfair)] text-bourbon-deep text-lg font-semibold mb-4 pb-3 border-b border-bourbon-deep/10">
              Categories
            </h2>
            <ul className="space-y-1">
              <li>
                <Link
                  href="/shop"
                  className={`flex items-center justify-between py-2 text-sm transition-colors ${
                    !category
                      ? "text-bourbon-gold font-semibold"
                      : "text-bourbon-stone hover:text-bourbon-deep"
                  }`}
                >
                  <span>All</span>
                  <span className="text-xs text-bourbon-stone/60">{totalCount}</span>
                </Link>
              </li>
              {allCategories.map((cat) => (
                <li key={cat.id}>
                  <Link
                    href={`/shop?category=${cat.slug}`}
                    className={`flex items-center justify-between py-2 text-sm transition-colors ${
                      category === cat.slug
                        ? "text-bourbon-gold font-semibold"
                        : "text-bourbon-stone hover:text-bourbon-deep"
                    }`}
                  >
                    <span>{cat.name}</span>
                    <span className="text-xs text-bourbon-stone/60">
                      {cat._count.products}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* Grid */}
        <section>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-bourbon-deep/10">
            <p className="text-bourbon-stone text-sm">
              {cards.length} {cards.length === 1 ? "bottle" : "bottles"}
            </p>
            <ShopFilters currentSort={sort} />
          </div>
          <ShopGrid products={cards} />
        </section>
      </div>
    </main>
  );
}
