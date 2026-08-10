import type { MetadataRoute } from "next";

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
  "https://bourbonoaklover.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          // Private surfaces. Prefix matching means "/admin" also covers
          // "/admin/..." — no trailing-slash twin needed.
          "/admin",
          "/api",
          "/checkout",

          // /search itself stays crawlable so bots can read its
          // `noindex, follow` tag and keep following links out of it;
          // only the generated result URLs are held back.
          "/search?",

          // Sorted/filtered duplicates of /shop. The bare /shop and the
          // self-canonical /shop?category=<slug> views stay crawlable.
          "/*?sort=",
          "/*?q=",
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
