import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  BLOG_POSTS,
  formatPostDate,
  getPostBySlug,
  type ContentBlock,
} from "@/lib/blog";
import { prisma } from "@/lib/prisma";

// Parse [[product:slug|anchor text]] markers in a prose string and return a
// node array with internal Next.js Links interleaved with the surrounding
// text. This is the SEO-load-bearing part of the renderer: real anchor text
// inside the article body sends link equity to product pages.
function renderInline(text: string): React.ReactNode[] {
  const re = /\[\[product:([a-z0-9-]+)\|([^\]]+)\]\]/g;
  const nodes: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = re.exec(text)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index));
    }
    const [, slug, anchor] = match;
    nodes.push(
      <Link
        key={`pl-${key++}`}
        href={`/products/${slug}`}
        className="text-bourbon-gold underline decoration-bourbon-gold/30 underline-offset-4 hover:decoration-bourbon-gold transition-colors"
      >
        {anchor}
      </Link>
    );
    lastIndex = re.lastIndex;
  }
  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return BLOG_POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) {
    return { title: "Post not found | Bourbon & Oak" };
  }

  // Flatten every keyword cluster + primary + long-tail into the meta keywords
  // array, so search engines see the full semantic context for the post.
  const allClusterTerms = post.seo.wordClusters.flatMap((c) => c.terms);
  const keywords = Array.from(
    new Set([
      post.seo.focusKeyword,
      ...post.seo.primaryKeywords,
      ...post.seo.longTailKeywords,
      ...allClusterTerms,
    ])
  );

  return {
    title: post.seo.metaTitle,
    description: post.seo.metaDescription,
    keywords,
    authors: [{ name: post.author }],
    openGraph: {
      title: post.seo.metaTitle,
      description: post.seo.metaDescription,
      type: "article",
      publishedTime: post.publishedAt,
      authors: [post.author],
      tags: post.tags,
      images: [{ url: post.heroImage, alt: post.heroAlt }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.seo.metaTitle,
      description: post.seo.metaDescription,
      images: [post.heroImage],
    },
    alternates: {
      canonical: `/blog/${post.slug}`,
    },
  };
}

function ContentRenderer({ block }: { block: ContentBlock }) {
  switch (block.type) {
    case "heading":
      if (block.level === 2) {
        return (
          <h2 className="font-[family-name:var(--font-playfair)] text-2xl sm:text-3xl font-bold text-bourbon-deep mt-10 sm:mt-14 mb-4 sm:mb-5 leading-tight">
            {block.text}
          </h2>
        );
      }
      return (
        <h3 className="font-[family-name:var(--font-playfair)] text-xl sm:text-2xl font-bold text-bourbon-deep mt-8 sm:mt-10 mb-3 leading-tight">
          {block.text}
        </h3>
      );

    case "paragraph":
      return (
        <p className="text-bourbon-stone text-base sm:text-lg leading-relaxed mb-5 sm:mb-6">
          {renderInline(block.text)}
        </p>
      );

    case "list": {
      const Tag = block.ordered ? "ol" : "ul";
      return (
        <Tag
          className={`mb-6 sm:mb-7 space-y-2 sm:space-y-3 text-bourbon-stone text-base sm:text-lg leading-relaxed pl-5 ${
            block.ordered ? "list-decimal" : "list-disc"
          } marker:text-bourbon-gold`}
        >
          {block.items.map((item, i) => (
            <li key={i} className="pl-1">
              {renderInline(item)}
            </li>
          ))}
        </Tag>
      );
    }

    case "callout":
      return (
        <aside className="my-6 sm:my-8 border-l-4 border-bourbon-gold bg-bourbon-gold/5 p-4 sm:p-5">
          {block.title && (
            <p className="text-bourbon-gold text-[10px] sm:text-xs tracking-[0.25em] uppercase font-semibold mb-1.5 sm:mb-2">
              {block.title}
            </p>
          )}
          <p className="text-bourbon-deep text-sm sm:text-base leading-relaxed">
            {renderInline(block.text)}
          </p>
        </aside>
      );

    case "recipe":
      return (
        <article className="my-8 sm:my-10 bg-white border border-bourbon-deep/10 p-5 sm:p-7">
          <p className="text-bourbon-gold text-[10px] sm:text-xs tracking-[0.3em] uppercase font-semibold mb-1.5 sm:mb-2">
            Recipe
          </p>
          <h3 className="font-[family-name:var(--font-playfair)] text-xl sm:text-2xl font-bold text-bourbon-deep mb-2 leading-tight">
            {block.name}
          </h3>
          <p className="text-bourbon-stone text-xs sm:text-sm italic mb-4 sm:mb-5">
            Serve in: {block.glass}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-[1fr_2fr] gap-5 sm:gap-7">
            <div>
              <p className="text-bourbon-stone text-[10px] tracking-widest uppercase font-semibold mb-2">
                Ingredients
              </p>
              <ul className="text-bourbon-deep text-sm space-y-1.5 list-disc pl-5 marker:text-bourbon-gold">
                {block.ingredients.map((ing, i) => (
                  <li key={i}>{ing}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-bourbon-stone text-[10px] tracking-widest uppercase font-semibold mb-2">
                Method
              </p>
              <ol className="text-bourbon-deep text-sm space-y-2 list-decimal pl-5 marker:text-bourbon-gold leading-relaxed">
                {block.steps.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            </div>
          </div>

          {block.garnish && (
            <p className="mt-5 sm:mt-6 pt-4 border-t border-bourbon-deep/10 text-bourbon-stone text-sm">
              <span className="text-bourbon-gold text-[10px] tracking-widest uppercase font-semibold mr-2">
                Garnish
              </span>
              {block.garnish}
            </p>
          )}
          {block.notes && (
            <p className="mt-3 text-bourbon-stone text-xs sm:text-sm italic leading-relaxed">
              {block.notes}
            </p>
          )}
        </article>
      );
  }
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  // Related posts: everything except this post, take up to 2 most-recent.
  const related = BLOG_POSTS.filter((p) => p.slug !== post.slug).slice(0, 2);

  // "Bottles in this Story" — pull live product data so cards stay in sync
  // with stock, price and primary image. If a referenced slug no longer
  // exists, the Prisma query silently skips it.
  const featuredProducts =
    post.relatedProducts.length > 0
      ? await prisma.product.findMany({
          where: { slug: { in: post.relatedProducts } },
          include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
        })
      : [];
  // Re-order results to match the curated order in BLOG_POSTS.
  const orderedFeatured = post.relatedProducts
    .map((s) => featuredProducts.find((p) => p.slug === s))
    .filter((p): p is (typeof featuredProducts)[number] => p !== undefined);

  // JSON-LD for the post — gives Google explicit article + author + keyword
  // context beyond what the <meta> tags carry. Keep on the page itself so the
  // crawler finds it in the initial HTML.
  const allKeywords = Array.from(
    new Set([
      post.seo.focusKeyword,
      ...post.seo.primaryKeywords,
      ...post.seo.longTailKeywords,
    ])
  );
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.seo.metaDescription,
    image: post.heroImage,
    datePublished: post.publishedAt,
    author: {
      "@type": "Person",
      name: post.author,
      jobTitle: post.authorTitle,
    },
    publisher: {
      "@type": "Organization",
      name: "Bourbon & Oak",
    },
    articleSection: post.category,
    keywords: allKeywords.join(", "),
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `/blog/${post.slug}`,
    },
    // Surface the linked products to crawlers as "mentions" — gives Google
    // explicit context for the internal links inside the article body.
    mentions: orderedFeatured.map((p) => ({
      "@type": "Product",
      name: p.name,
      url: `/products/${p.slug}`,
      image: p.images[0]?.url,
      offers: {
        "@type": "Offer",
        priceCurrency: "USD",
        price: p.bottlePrice.toString(),
      },
    })),
  };

  return (
    <main className="bg-bourbon-cream min-h-screen pt-24 sm:pt-32 pb-16 sm:pb-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-6 sm:mb-8 text-[10px] sm:text-xs tracking-widest uppercase text-bourbon-stone/70 flex items-center gap-1.5 sm:gap-2 overflow-x-auto whitespace-nowrap pb-1">
          <Link href="/" className="hover:text-bourbon-gold transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link href="/blog" className="hover:text-bourbon-gold transition-colors">
            Blog
          </Link>
          <span>/</span>
          <span className="text-bourbon-deep truncate">{post.title}</span>
        </nav>

        {/* Title block */}
        <header className="mb-8 sm:mb-10">
          <p className="text-bourbon-gold text-[10px] sm:text-xs tracking-[0.3em] uppercase mb-3">
            {post.category}
          </p>
          <h1 className="font-[family-name:var(--font-playfair)] text-3xl sm:text-4xl md:text-5xl font-bold text-bourbon-deep leading-tight mb-3 sm:mb-4">
            {post.title}
          </h1>
          <p className="text-bourbon-stone text-base sm:text-xl leading-relaxed">
            {post.subtitle}
          </p>

          <div className="mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-bourbon-deep/10 flex flex-wrap items-center gap-4 sm:gap-6">
            <div className="flex-1 min-w-0">
              <p className="text-bourbon-deep text-sm font-semibold">{post.author}</p>
              <p className="text-bourbon-stone text-[11px] sm:text-xs">{post.authorTitle}</p>
            </div>
            <div className="flex items-center gap-3 text-[11px] sm:text-xs text-bourbon-stone tracking-widest uppercase">
              <span>{formatPostDate(post.publishedAt)}</span>
              <span className="w-1 h-1 rounded-full bg-bourbon-stone/40" />
              <span>{post.readTimeMinutes} min read</span>
            </div>
          </div>
        </header>

        {/* Hero image */}
        <div className="relative aspect-[16/9] mb-8 sm:mb-12 overflow-hidden bg-bourbon-deep/5">
          <Image
            src={post.heroImage}
            alt={post.heroAlt}
            fill
            priority
            sizes="(min-width: 1024px) 896px, 100vw"
            className="object-cover"
          />
        </div>

        {/* Body */}
        <div className="prose-bourbon">
          {post.content.map((block, i) => (
            <ContentRenderer key={i} block={block} />
          ))}
        </div>

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="mt-10 sm:mt-14 pt-6 sm:pt-8 border-t border-bourbon-deep/10">
            <p className="text-bourbon-stone text-[10px] sm:text-xs tracking-widest uppercase mb-3 sm:mb-4">
              Tagged
            </p>
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1.5 bg-bourbon-deep/5 text-bourbon-deep text-xs sm:text-sm capitalize"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </article>

      {/* Bottles in This Story — product backlinks for SEO + reader discovery */}
      {orderedFeatured.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-14 sm:mt-20">
          <div className="flex items-end justify-between mb-6 sm:mb-8">
            <div>
              <p className="text-bourbon-gold text-[10px] sm:text-xs tracking-[0.3em] uppercase mb-2">
                Featured in this story
              </p>
              <h2 className="font-[family-name:var(--font-playfair)] text-2xl sm:text-3xl font-bold text-bourbon-deep">
                Bottles in this Story
              </h2>
            </div>
            <Link
              href="/shop"
              className="text-bourbon-gold text-xs tracking-widest uppercase font-semibold hover:text-bourbon-amber transition-colors hidden sm:inline-flex"
            >
              Shop All →
            </Link>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {orderedFeatured.map((p) => {
              const img = p.images[0]?.url;
              const ageLabel = p.ageYears ? `${p.ageYears} Year` : "NAS";
              return (
                <Link
                  key={p.id}
                  href={`/products/${p.slug}`}
                  className="group bg-white border border-bourbon-deep/5 overflow-hidden shadow-sm hover:shadow-lg hover:shadow-bourbon-gold/5 hover:-translate-y-1 transition-all duration-500 flex flex-col"
                >
                  <div className="relative h-40 sm:h-56 bg-bourbon-deep/5 overflow-hidden">
                    {img && (
                      <Image
                        src={img}
                        alt={p.name}
                        fill
                        sizes="(min-width: 1024px) 25vw, 50vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                    )}
                    {p.badge && (
                      <span className="absolute top-2 left-2 sm:top-3 sm:left-3 px-2 sm:px-3 py-0.5 sm:py-1 bg-bourbon-gold text-bourbon-deep text-[9px] sm:text-xs font-semibold tracking-wider uppercase">
                        {p.badge}
                      </span>
                    )}
                  </div>
                  <div className="p-3 sm:p-5 flex-1 flex flex-col">
                    <p className="text-bourbon-gold text-[10px] sm:text-xs tracking-widest uppercase mb-1">
                      {ageLabel} Aged
                    </p>
                    <h3 className="font-[family-name:var(--font-playfair)] text-sm sm:text-lg font-semibold text-bourbon-deep mb-2 group-hover:text-bourbon-gold transition-colors line-clamp-2">
                      {p.name}
                    </h3>
                    <div className="mt-auto flex items-end justify-between gap-2">
                      <span className="font-[family-name:var(--font-playfair)] text-base sm:text-xl font-bold text-bourbon-deep">
                        ${p.bottlePrice.toNumber().toFixed(2)}
                      </span>
                      <span className="text-bourbon-gold text-[10px] sm:text-xs tracking-widest uppercase font-semibold inline-flex items-center gap-1 group-hover:gap-2 transition-all">
                        View
                        <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Related */}
      {related.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-14 sm:mt-20">
          <div className="flex items-end justify-between mb-6 sm:mb-8">
            <h2 className="font-[family-name:var(--font-playfair)] text-2xl sm:text-3xl font-bold text-bourbon-deep">
              Keep Reading
            </h2>
            <Link
              href="/blog"
              className="text-bourbon-gold text-xs tracking-widest uppercase font-semibold hover:text-bourbon-amber transition-colors"
            >
              All Stories →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
            {related.map((rel) => (
              <Link
                key={rel.slug}
                href={`/blog/${rel.slug}`}
                className="group bg-white border border-bourbon-deep/5 overflow-hidden shadow-sm hover:shadow-lg hover:shadow-bourbon-gold/5 hover:-translate-y-1 transition-all duration-500 flex flex-col"
              >
                <div className="relative h-48 sm:h-56 overflow-hidden bg-bourbon-deep/5">
                  <Image
                    src={rel.heroImage}
                    alt={rel.heroAlt}
                    fill
                    sizes="(min-width: 640px) 50vw, 100vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <span className="absolute top-3 left-3 px-3 py-1 bg-bourbon-gold text-bourbon-deep text-[10px] font-semibold tracking-widest uppercase">
                    {rel.category}
                  </span>
                </div>
                <div className="p-5 sm:p-6">
                  <div className="flex items-center gap-3 text-[10px] text-bourbon-stone mb-2 tracking-widest uppercase">
                    <span>{formatPostDate(rel.publishedAt)}</span>
                    <span className="w-1 h-1 rounded-full bg-bourbon-stone/40" />
                    <span>{rel.readTimeMinutes} min</span>
                  </div>
                  <h3 className="font-[family-name:var(--font-playfair)] text-lg sm:text-xl font-bold text-bourbon-deep leading-tight mb-2 group-hover:text-bourbon-gold transition-colors">
                    {rel.title}
                  </h3>
                  <p className="text-bourbon-stone text-sm leading-relaxed line-clamp-2">
                    {rel.excerpt}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
