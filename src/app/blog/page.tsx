import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { formatPostDate, getAllPosts } from "@/lib/blog";

export const metadata: Metadata = {
  title: "From the Distillery — Bourbon Stories, Recipes & News | Bourbon & Oak",
  description:
    "Long-form bourbon writing from our master distiller and head bartender. Single barrel selection, cocktail recipes, rickhouse architecture and Kentucky bourbon stories.",
  keywords: [
    "bourbon blog",
    "Kentucky bourbon stories",
    "bourbon cocktail recipes",
    "single barrel bourbon",
    "rickhouse",
    "master distiller",
    "barrel selection",
    "mint julep recipe",
  ],
  openGraph: {
    title: "From the Distillery — Bourbon Stories, Recipes & News",
    description:
      "Long-form bourbon writing from our master distiller and head bartender — single barrel picks, cocktail recipes, rickhouse architecture and Kentucky bourbon stories.",
    type: "website",
  },
};

export default function BlogIndexPage() {
  const posts = getAllPosts();
  const [hero, ...rest] = posts;

  return (
    <main className="bg-bourbon-cream min-h-screen pt-24 sm:pt-32 pb-16 sm:pb-20">
      {/* Header */}
      <header className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10 sm:mb-14">
        <p className="text-bourbon-gold text-[10px] sm:text-xs tracking-[0.3em] uppercase mb-3">
          Stories
        </p>
        <h1 className="font-[family-name:var(--font-playfair)] text-4xl sm:text-5xl md:text-6xl font-bold text-bourbon-deep leading-tight mb-3">
          From the Distillery
        </h1>
        <div className="w-16 sm:w-20 h-0.5 bg-bourbon-gold mb-5" />
        <p className="text-bourbon-stone max-w-2xl text-sm sm:text-lg leading-relaxed">
          Long-form writing from our master distiller and head bartender —
          single barrel picks, tested cocktail recipes, rickhouse architecture,
          and the patient art of Kentucky bourbon.
        </p>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Featured / latest */}
        {hero && (
          <Link
            href={`/blog/${hero.slug}`}
            className="group block bg-white overflow-hidden border border-bourbon-deep/5 shadow-sm hover:shadow-xl hover:shadow-bourbon-gold/10 transition-all duration-500 mb-10 sm:mb-14"
          >
            <div className="grid grid-cols-1 lg:grid-cols-2">
              <div className="relative h-56 sm:h-72 lg:h-auto lg:min-h-[420px] overflow-hidden bg-bourbon-deep/5">
                <Image
                  src={hero.heroImage}
                  alt={hero.heroAlt}
                  fill
                  priority
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <span className="absolute top-3 left-3 sm:top-4 sm:left-4 px-3 py-1 bg-bourbon-gold text-bourbon-deep text-[10px] sm:text-xs font-semibold tracking-wider uppercase">
                  {hero.category}
                </span>
              </div>
              <div className="p-6 sm:p-10 flex flex-col justify-center">
                <div className="flex items-center gap-3 text-[10px] sm:text-xs text-bourbon-stone mb-3 tracking-widest uppercase">
                  <span>{formatPostDate(hero.publishedAt)}</span>
                  <span className="w-1 h-1 rounded-full bg-bourbon-stone/40" />
                  <span>{hero.readTimeMinutes} min read</span>
                </div>
                <h2 className="font-[family-name:var(--font-playfair)] text-2xl sm:text-3xl md:text-4xl font-bold text-bourbon-deep leading-tight mb-3 sm:mb-4 group-hover:text-bourbon-gold transition-colors">
                  {hero.title}
                </h2>
                <p className="text-bourbon-stone text-sm sm:text-base leading-relaxed mb-4 sm:mb-6">
                  {hero.excerpt}
                </p>
                <div className="flex items-center justify-between gap-4 mt-2 pt-4 sm:pt-6 border-t border-bourbon-deep/10">
                  <div>
                    <p className="text-bourbon-deep text-sm font-semibold">{hero.author}</p>
                    <p className="text-bourbon-stone text-[10px] sm:text-xs">{hero.authorTitle}</p>
                  </div>
                  <span className="text-bourbon-gold text-xs tracking-widest uppercase font-semibold inline-flex items-center gap-2 group-hover:gap-3 transition-all">
                    Read
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </span>
                </div>
              </div>
            </div>
          </Link>
        )}

        {/* Remaining posts */}
        {rest.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {rest.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group bg-white overflow-hidden border border-bourbon-deep/5 shadow-sm hover:shadow-lg hover:shadow-bourbon-gold/5 hover:-translate-y-1 transition-all duration-500 flex flex-col"
              >
                <div className="relative h-48 sm:h-56 overflow-hidden bg-bourbon-deep/5">
                  <Image
                    src={post.heroImage}
                    alt={post.heroAlt}
                    fill
                    sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <span className="absolute top-3 left-3 px-3 py-1 bg-bourbon-gold text-bourbon-deep text-[10px] font-semibold tracking-widest uppercase">
                    {post.category}
                  </span>
                </div>
                <div className="p-5 sm:p-6 flex flex-col flex-1">
                  <div className="flex items-center gap-3 text-[10px] text-bourbon-stone mb-3 tracking-widest uppercase">
                    <span>{formatPostDate(post.publishedAt)}</span>
                    <span className="w-1 h-1 rounded-full bg-bourbon-stone/40" />
                    <span>{post.readTimeMinutes} min read</span>
                  </div>
                  <h3 className="font-[family-name:var(--font-playfair)] text-lg sm:text-xl font-bold text-bourbon-deep leading-tight mb-3 group-hover:text-bourbon-gold transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-bourbon-stone text-sm leading-relaxed mb-4 line-clamp-3 flex-1">
                    {post.excerpt}
                  </p>
                  <span className="text-bourbon-gold text-xs tracking-widest uppercase font-semibold inline-flex items-center gap-2 group-hover:gap-3 transition-all">
                    Read More
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
