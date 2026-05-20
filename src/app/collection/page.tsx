import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Collections | Bourbon & Oak",
  description:
    "Browse every collection in our cellar — bourbon, rye, Pappy Van Winkle, limited editions, and more.",
};

export default async function CollectionPage() {
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      _count: { select: { products: true } },
      products: {
        take: 1,
        orderBy: { isFeatured: "desc" },
        include: {
          images: { orderBy: { sortOrder: "asc" }, take: 1 },
        },
      },
    },
  });

  const totalProducts = await prisma.product.count();

  return (
    <main className="bg-bourbon-cream min-h-screen pt-24 sm:pt-32 pb-16 sm:pb-20">
      {/* Hero */}
      <header className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10 sm:mb-14">
        <p className="text-bourbon-gold text-xs tracking-[0.3em] uppercase mb-3">
          Browse The Cellar
        </p>
        <h1 className="font-[family-name:var(--font-playfair)] text-4xl sm:text-5xl md:text-6xl font-bold text-bourbon-deep leading-tight mb-3">
          Our Collections
        </h1>
        <div className="w-20 h-0.5 bg-bourbon-gold mb-5" />
        <p className="text-bourbon-stone max-w-2xl text-base sm:text-lg leading-relaxed">
          {categories.length} collections · {totalProducts} bottles. From everyday Kentucky straight bourbon to the most allocated bottle in American whiskey, every collection here has its own story.
        </p>
      </header>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((cat) => {
          const heroImage = cat.imageUrl ?? cat.products[0]?.images[0]?.url ?? "";
          return (
            <Link
              key={cat.id}
              href={`/shop?category=${cat.slug}`}
              className="group bg-white border border-bourbon-deep/5 overflow-hidden shadow-sm hover:shadow-xl hover:shadow-bourbon-gold/10 hover:-translate-y-1 transition-all duration-500 flex flex-col"
            >
              <div className="relative h-64 sm:h-72 overflow-hidden bg-bourbon-deep/5">
                {heroImage && (
                  <Image
                    src={heroImage}
                    alt={cat.name}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-700"
                    sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  />
                )}
                <span className="absolute top-4 left-4 px-3 py-1 bg-bourbon-cream/95 text-bourbon-deep text-[10px] tracking-widest uppercase font-semibold backdrop-blur-sm">
                  {cat._count.products} {cat._count.products === 1 ? "bottle" : "bottles"}
                </span>
              </div>
              <div className="p-6 sm:p-7 flex-1 flex flex-col">
                <h2 className="font-[family-name:var(--font-playfair)] text-2xl sm:text-3xl font-bold text-bourbon-deep leading-tight mb-3 group-hover:text-bourbon-gold transition-colors">
                  {cat.name}
                </h2>
                {cat.description && (
                  <p className="text-bourbon-stone text-sm sm:text-base mb-5 line-clamp-3 flex-1">
                    {cat.description}
                  </p>
                )}
                <span className="inline-flex items-center gap-2 text-bourbon-gold text-xs tracking-widest uppercase font-semibold">
                  Shop {cat.name}
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Bottom CTA */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 sm:mt-16 text-center">
        <p className="text-bourbon-stone mb-4">
          Looking for something specific?
        </p>
        <Link
          href="/shop"
          className="inline-flex items-center gap-2 px-8 py-4 border-2 border-bourbon-deep text-bourbon-deep font-semibold tracking-widest uppercase text-xs hover:bg-bourbon-deep hover:text-bourbon-cream transition-all"
        >
          Browse Every Bottle
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </Link>
      </div>
    </main>
  );
}
