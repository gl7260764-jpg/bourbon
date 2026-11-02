// Guard: every public, indexable route must appear in the sitemap, and every
// sitemap URL must point at a route that exists. The sitemap is generated from
// blog.ts / locations.ts / the product table, so content enrols itself — what
// this catches is a NEW route or content source nobody wired in, a URL left
// behind by deleted content, and the XML-level faults crawlers abort on.
//
//   npx tsx scripts/check-sitemap.ts          exits 1 on any problem
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { Availability, PrismaClient } from "@prisma/client";
import sitemap from "@/app/sitemap";
import { BLOG_POSTS } from "@/lib/blog";
import { LOCATIONS } from "@/lib/locations";

const APP = join(process.cwd(), "src/app");

// Mirrors sitemap.ts — archived bottles are retired, and their pages are
// noindex, so they are absent from both sides by design.
const LISTABLE: Availability[] = [
  Availability.IN_STOCK,
  Availability.LOW_STOCK,
  Availability.ALLOCATED,
  Availability.PRE_ORDER,
  Availability.SOLD_OUT,
];

function pageFiles(dir: string, found: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) pageFiles(full, found);
    else if (entry === "page.tsx") found.push(full);
  }
  return found;
}

// src/app/visit/[city]/page.tsx -> /visit/[city]; route groups don't appear in URLs.
function routeOf(file: string): string {
  const segments = relative(APP, file)
    .split("/")
    .slice(0, -1)
    .filter((s) => !(s.startsWith("(") && s.endsWith(")")));
  return `/${segments.join("/")}`.replace(/\/$/, "") || "/";
}

(async () => {
  const p = new PrismaClient();
  const products = await p.product.findMany({
    where: { availability: { in: LISTABLE } },
    select: { slug: true },
  });
  const archived = await p.product.count({
    where: { availability: { notIn: LISTABLE } },
  });
  await p.$disconnect();

  // What the routes say should be indexable.
  const expected = new Set<string>();
  const skipped: string[] = [];

  for (const file of pageFiles(APP)) {
    const route = routeOf(file);

    if (route === "/admin" || route.startsWith("/admin/") || route.startsWith("/api")) continue;

    // A page whose static `export const metadata` declares `index: false` is
    // deliberately out of the sitemap. Only that block counts: products/[slug]
    // also returns `index: false`, but from the not-found branch of
    // generateMetadata, and the page itself is very much indexable.
    const staticMetadata = /export const metadata[^=]*=\s*{([\s\S]*?)\n};/.exec(
      readFileSync(file, "utf8"),
    );
    if (staticMetadata && /index:\s*false/.test(staticMetadata[1])) {
      skipped.push(`${route} (noindex)`);
      continue;
    }

    const expand: Record<string, string[]> = {
      "/blog/[slug]": BLOG_POSTS.map((b) => `/blog/${b.slug}`),
      "/visit/[city]": LOCATIONS.map((l) => `/visit/${l.slug}`),
      "/products/[slug]": products.map((pr) => `/products/${pr.slug}`),
    };

    if (route.includes("[")) {
      const urls = expand[route];
      if (!urls) {
        console.log(`  ! ${route} is dynamic and indexable but this check cannot expand it`);
        console.log(`    Add its content source to the expand map above.`);
        process.exitCode = 1;
        continue;
      }
      for (const u of urls) expected.add(u);
    } else {
      expected.add(route);
    }
  }

  // What the sitemap actually emits.
  const entries = await sitemap();
  const locs = entries.map((e) => String(e.url));
  const base = new URL(locs[0]).origin;
  const paths = locs.map((l) => l.replace(base, ""));
  // /shop?category=rye is the /shop route under a self-canonical query.
  const actual = new Set(paths.map((pth) => pth.split("?")[0] || "/"));

  const missing = [...expected].filter((r) => !actual.has(r)).sort();
  const orphaned = [...actual].filter((r) => !expected.has(r)).sort();

  const dupes = paths.filter((pth, i) => paths.indexOf(pth) !== i);
  const noLastmod = entries.filter((e) => !e.lastModified).map((e) => String(e.url));
  const relImages = entries
    .flatMap((e) => (e.images ?? []).map(String))
    .filter((img) => !/^https?:\/\//.test(img));

  console.log(`sitemap entries     : ${entries.length}`);
  console.log(`indexable routes    : ${expected.size}`);
  console.log(`archived (excluded) : ${archived} product(s)`);
  console.log(`\nout of the sitemap on purpose (${skipped.length}):`);
  for (const s of skipped.sort()) console.log(`  ${s}`);

  const problems: [string, string[]][] = [
    ["indexable but NOT in the sitemap", missing],
    ["in the sitemap but no such route", orphaned],
    ["duplicate <loc>", [...new Set(dupes)]],
    ["missing lastModified", noLastmod],
    ["relative image URL (silently invalid)", relImages],
  ];

  let failed = false;
  for (const [label, items] of problems) {
    if (!items.length) continue;
    failed = true;
    console.log(`\n${label} (${items.length}):`);
    for (const i of items) console.log(`  ${i}`);
  }

  if (failed || process.exitCode === 1) {
    console.log(`\nFAIL — sitemap is out of date.`);
    process.exitCode = 1;
  } else {
    console.log(`\nOK — sitemap covers every indexable route.`);
  }
})();
