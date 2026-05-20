import Image from "next/image";
import Link from "next/link";
import { formatPostDate, getRecentPosts } from "@/lib/blog";

export default function RecentNews() {
  const posts = getRecentPosts(3);

  return (
    <section className="py-14 sm:py-20 bg-bourbon-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-10 sm:mb-14">
          <span className="text-bourbon-gold text-[10px] sm:text-xs tracking-[0.3em] uppercase">
            Stories
          </span>
          <h2 className="font-[family-name:var(--font-playfair)] text-3xl sm:text-4xl md:text-5xl font-bold text-bourbon-deep mt-3 mb-4">
            From the Distillery
          </h2>
          <div className="w-16 sm:w-20 h-0.5 bg-bourbon-gold mx-auto mb-4" />
          <p className="text-bourbon-stone text-sm sm:text-base max-w-2xl mx-auto">
            Stories, recipes, and news from our distillery in the heart of Kentucky.
          </p>
        </div>

        {/* Articles grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group bg-white overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-500 flex flex-col"
            >
              <div className="relative h-48 sm:h-56 overflow-hidden">
                <Image
                  src={post.heroImage}
                  alt={post.heroAlt}
                  fill
                  sizes="(min-width: 768px) 33vw, 100vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute top-3 left-3 sm:top-4 sm:left-4">
                  <span className="px-3 py-1 bg-bourbon-gold text-bourbon-deep text-[10px] sm:text-xs font-semibold tracking-widest uppercase">
                    {post.category}
                  </span>
                </div>
              </div>
              <div className="p-5 sm:p-6 flex-1 flex flex-col">
                <div className="flex items-center gap-3 text-[10px] sm:text-xs text-bourbon-stone mb-3 tracking-widest uppercase">
                  <span>{formatPostDate(post.publishedAt)}</span>
                  <span className="w-1 h-1 rounded-full bg-bourbon-stone/40" />
                  <span>{post.readTimeMinutes} min read</span>
                </div>
                <h3 className="font-[family-name:var(--font-playfair)] text-lg sm:text-xl font-semibold text-bourbon-deep mb-3 group-hover:text-bourbon-gold transition-colors leading-tight">
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

        {/* Browse all */}
        <div className="text-center mt-10 sm:mt-14">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 border-2 border-bourbon-deep text-bourbon-deep font-semibold tracking-widest uppercase text-xs hover:bg-bourbon-deep hover:text-bourbon-cream transition-all duration-300"
          >
            Browse All Stories
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
