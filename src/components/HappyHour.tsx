import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";

const HOME_LIMIT = 4;

export default async function HappyHour() {
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    take: HOME_LIMIT,
    include: {
      _count: { select: { products: true } },
      products: {
        take: 1,
        orderBy: { isFeatured: "desc" },
        include: {
          images: {
            orderBy: { sortOrder: "asc" },
            take: 1,
          },
        },
      },
    },
  });

  const cards = categories.map((cat) => ({
    id: cat.id,
    slug: cat.slug,
    name: cat.name,
    description: cat.description ?? "",
    image: cat.imageUrl ?? cat.products[0]?.images[0]?.url ?? "",
    count: cat._count.products,
  }));

  const totalCategories = await prisma.category.count();

  return (
    <section id="collection" className="py-12 sm:py-20 bg-bourbon-cream relative overflow-hidden">
      {/* Top banner */}
      <div className="relative bg-gradient-to-r from-bourbon-deep via-bourbon-dark to-bourbon-deep py-12 sm:py-16 mb-10 sm:mb-16">
        <div className="absolute inset-0 opacity-15">
          <Image
            src="https://images.unsplash.com/photo-1619451334792-150fd785ee74?w=1200&q=60"
            alt=""
            fill
            className="object-cover"
          />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 lg:gap-8">
          <div>
            <p className="text-bourbon-gold text-[10px] sm:text-xs tracking-[0.3em] sm:tracking-[0.4em] uppercase mb-3">
              Shop By Collection
            </p>
            <h2 className="font-[family-name:var(--font-playfair)] text-4xl sm:text-5xl md:text-7xl font-bold text-bourbon-cream leading-none">
              Our
            </h2>
            <h2 className="font-[family-name:var(--font-playfair)] text-4xl sm:text-5xl md:text-7xl font-bold text-bourbon-gold leading-none">
              Collections
            </h2>
          </div>
          <div className="text-left lg:text-right">
            <p className="text-bourbon-cream/70 text-sm sm:text-lg max-w-md">
              From everyday Kentucky straight bourbon to the most allocated bottles in American whiskey — every collection has its own story.
            </p>
            <Link
              href="/collection"
              className="inline-flex items-center gap-2 text-bourbon-gold text-sm tracking-[0.2em] uppercase mt-4 hover:text-bourbon-amber transition-colors"
            >
              Browse All {totalCategories} Collections
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>

        <span className="absolute bottom-0 left-1/2 -translate-x-1/2 font-[family-name:var(--font-playfair)] text-[8rem] md:text-[12rem] font-bold text-white/[0.03] uppercase leading-none pointer-events-none whitespace-nowrap">
          COLLECTIONS
        </span>
      </div>

      {/* Category cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
          {cards.map((cat) => (
            <Link
              key={cat.id}
              href={`/shop?category=${cat.slug}`}
              className="group bg-white border border-bourbon-deep/5 overflow-hidden shadow-sm hover:shadow-xl hover:shadow-bourbon-gold/10 hover:-translate-y-1 transition-all duration-500 flex flex-col"
            >
              <div className="relative h-40 sm:h-56 lg:h-64 overflow-hidden bg-bourbon-deep/5">
                {cat.image && (
                  <Image
                    src={cat.image}
                    alt={cat.name}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-700"
                    sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                  />
                )}
                <span className="absolute top-3 left-3 px-3 py-1 bg-bourbon-cream/95 text-bourbon-deep text-[10px] tracking-widest uppercase font-semibold backdrop-blur-sm">
                  {cat.count} {cat.count === 1 ? "bottle" : "bottles"}
                </span>
              </div>
              <div className="p-3 sm:p-5 flex-1 flex flex-col">
                <h3 className="font-[family-name:var(--font-playfair)] text-base sm:text-xl md:text-2xl font-bold text-bourbon-deep leading-tight mb-2 group-hover:text-bourbon-gold transition-colors">
                  {cat.name}
                </h3>
                <p className="text-bourbon-stone text-xs sm:text-sm line-clamp-2 mb-3 sm:mb-4 flex-1">
                  {cat.description}
                </p>
                <span className="inline-flex items-center gap-2 text-bourbon-gold text-[10px] sm:text-xs tracking-widest uppercase font-semibold">
                  Shop Collection
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
