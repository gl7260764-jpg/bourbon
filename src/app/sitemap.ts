import type { MetadataRoute } from "next";
import { Availability } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { BLOG_POSTS } from "@/lib/blog";
import { LOCATIONS } from "@/lib/locations";

// Regenerate hourly so newly published products/categories get picked up
// without a redeploy, and so a cold DB at build time can't freeze the file.
export const revalidate = 3600;

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
  "https://bourbonoaklover.com";

// Static marketing/legal pages only change when we ship copy, so they carry a
// fixed stamp. Using `new Date()` here would make every page look edited on
// every crawl, which teaches crawlers to ignore <lastmod> entirely.
// Bump this when the static page copy is meaningfully revised.
const STATIC_CONTENT_UPDATED = new Date("2026-08-10T00:00:00.000Z");

type StaticEntry = {
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
};

// Excluded on purpose: /checkout + /checkout/confirmation and /search are
// noindex, and everything under /admin and /api is private.
const STATIC_PAGES: StaticEntry[] = [
  { path: "/", changeFrequency: "weekly", priority: 1.0 },
  { path: "/collection", changeFrequency: "weekly", priority: 0.8 },
  { path: "/tours", changeFrequency: "monthly", priority: 0.8 },
  { path: "/about", changeFrequency: "monthly", priority: 0.7 },
  { path: "/faq", changeFrequency: "monthly", priority: 0.7 },
  { path: "/shipping", changeFrequency: "monthly", priority: 0.6 },
  { path: "/contact", changeFrequency: "monthly", priority: 0.5 },
  { path: "/returns", changeFrequency: "monthly", priority: 0.5 },
  { path: "/press", changeFrequency: "monthly", priority: 0.5 },
  { path: "/careers", changeFrequency: "monthly", priority: 0.5 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.3 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.3 },
];

// Archived bottles are retired from the catalogue — don't ask Google to index
// inventory we no longer sell.
const LISTABLE: Availability[] = [
  Availability.IN_STOCK,
  Availability.LOW_STOCK,
  Availability.ALLOCATED,
  Availability.PRE_ORDER,
  Availability.SOLD_OUT,
];

function newest(dates: Date[], fallback: Date): Date {
  return dates.length
    ? dates.reduce((a, b) => (a > b ? a : b))
    : fallback;
}

// Next interpolates these values into the XML raw — its serializer
// (next/dist/build/webpack/loaders/metadata/resolve-route-data.js) escapes
// nothing. A single unescaped "&" — e.g. an Unsplash URL ending in
// "?w=1600&q=85" — makes the whole document malformed, and crawlers abort at
// the first one and discover zero pages. Escape every URL we emit.
// Hero images are a mix of remote (https://images.unsplash.com/…) and local
// (/blog-age.webp). The sitemap image extension requires an absolute <image:loc>,
// so a relative path is silently invalid and the image is never discovered —
// prefix anything that is not already absolute.
function absoluteUrl(url: string): string {
  return /^https?:\/\//.test(url) ? url : `${BASE_URL}${url}`;
}

function xmlSafe(url: string): string {
  return url
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = [...BLOG_POSTS].sort((a, b) =>
    a.publishedAt < b.publishedAt ? 1 : -1,
  );
  const blogUpdated = newest(
    posts.map((p) => new Date(p.publishedAt)),
    STATIC_CONTENT_UPDATED,
  );

  // The /visit index ages with the newest location page it lists, for the same
  // reason /blog ages with the newest post — an index whose <lastmod> never
  // moves stops being a useful discovery signal.
  const locationsUpdated = newest(
    LOCATIONS.map((loc) => new Date(loc.updatedAt)),
    STATIC_CONTENT_UPDATED,
  );

  let products: { slug: string; updatedAt: Date; images: { url: string }[] }[] =
    [];
  let categories: { slug: string; updatedAt: Date }[] = [];

  try {
    [products, categories] = await Promise.all([
      prisma.product.findMany({
        where: { availability: { in: LISTABLE } },
        select: {
          slug: true,
          updatedAt: true,
          images: {
            select: { url: true },
            orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
            take: 1,
          },
        },
        orderBy: { updatedAt: "desc" },
      }),
      // Skip empty categories — a filtered /shop view with no bottles is a
      // thin/soft-404 page from a crawler's point of view.
      prisma.category.findMany({
        where: { products: { some: { availability: { in: LISTABLE } } } },
        select: { slug: true, updatedAt: true },
        orderBy: { sortOrder: "asc" },
      }),
    ]);
  } catch (error) {
    // A DB outage must not take the whole sitemap down — ship the static and
    // blog URLs rather than returning a 500 that Search Console flags.
    console.error("[sitemap] failed to load catalogue from database", error);
  }

  const catalogueUpdated = newest(
    products.map((p) => p.updatedAt),
    STATIC_CONTENT_UPDATED,
  );

  const staticUrls: MetadataRoute.Sitemap = STATIC_PAGES.map((page) => ({
    url: `${BASE_URL}${page.path}`,
    lastModified: page.path === "/" ? catalogueUpdated : STATIC_CONTENT_UPDATED,
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));

  // Index pages age with the content they list.
  const indexUrls: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/shop`,
      lastModified: catalogueUpdated,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/blog`,
      lastModified: blogUpdated,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/visit`,
      lastModified: locationsUpdated,
      changeFrequency: "monthly",
      priority: 0.8,
    },
  ];

  // /shop?category=<slug> is self-canonical (see shop/page.tsx generateMetadata),
  // so these are legitimate index targets rather than parameter duplicates.
  const categoryUrls: MetadataRoute.Sitemap = categories.map((c) => ({
    url: xmlSafe(`${BASE_URL}/shop?category=${encodeURIComponent(c.slug)}`),
    lastModified: c.updatedAt,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const productUrls: MetadataRoute.Sitemap = products.map((p) => ({
    url: xmlSafe(`${BASE_URL}/products/${encodeURIComponent(p.slug)}`),
    lastModified: p.updatedAt,
    changeFrequency: "weekly",
    priority: 0.9,
    images: p.images[0]?.url ? [xmlSafe(p.images[0].url)] : undefined,
  }));

  // Visitor / location landing pages. High local-search value, so they carry a
  // priority just under the commercial index pages.
  const locationUrls: MetadataRoute.Sitemap = LOCATIONS.map((loc) => ({
    url: `${BASE_URL}/visit/${loc.slug}`,
    lastModified: new Date(loc.updatedAt),
    changeFrequency: "monthly",
    priority: 0.8,
    images: [xmlSafe(absoluteUrl(loc.heroImage))],
  }));

  const blogUrls: MetadataRoute.Sitemap = posts.map((post) => ({
    url: xmlSafe(`${BASE_URL}/blog/${encodeURIComponent(post.slug)}`),
    lastModified: new Date(post.publishedAt),
    changeFrequency: "monthly",
    priority: 0.7,
    images: post.heroImage
      ? [xmlSafe(absoluteUrl(post.heroImage))]
      : undefined,
  }));

  return [
    ...staticUrls,
    ...indexUrls,
    ...locationUrls,
    ...categoryUrls,
    ...productUrls,
    ...blogUrls,
  ];
}
