// Imports the rare/allocated bourbon + rye lineup defined in product.json
// into Postgres. Unlike the older `import-*-lineup.ts` scripts (which kept the
// research data inside a const ENRICHED[]), this one reads the *enriched*
// product.json directly — every product entry already contains its full spec,
// tasting notes and SEO record.
//
// Products covered (all bottle-only — no case format):
//   George T. Stagg, Thomas H. Handy Sazerac, Russell's Reserve 13 Year,
//   Stagg, Elmer T. Lee, Rock Hill Farms, Blanton's Original,
//   Blanton's Gold Edition, Blood Oath, King of Kentucky.
//
// What the script does:
//   1. Loads product.json (the enriched format).
//   2. Filters to the slugs listed in TARGET_SLUGS (the lineup this script owns).
//   3. Ensures every Category referenced (bourbon, rye, limited-edition) exists.
//   4. Uploads the local image_url to Cloudinary under bourbon/products/.
//   5. Creates Product + primary ProductImage in one transaction.
//   6. Idempotent: skips any product whose slug already exists.
//
// SEO note: The Product model has no dedicated SEO columns — the seo block in
// product.json is logged at import time so it can be wired into page metadata
// later without re-running this script.
//
// Run with:  npx tsx scripts/import-rare-bourbon-lineup.ts

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

(function loadDotenv() {
  const envPath = path.resolve(".env");
  if (!existsSync(envPath)) return;
  const text = readFileSync(envPath, "utf8");
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
})();

import { v2 as cloudinary } from "cloudinary";
import { Availability, ProductionStyle } from "@prisma/client";
import { prisma } from "../src/lib/prisma";

function configureCloudinary() {
  const url = process.env.CLOUDINARY_URL;
  if (!url) throw new Error("CLOUDINARY_URL is not set in the environment.");
  const m = url.match(/^cloudinary:\/\/([^:]+):([^@]+)@(.+)$/);
  if (!m) {
    throw new Error(
      "Malformed CLOUDINARY_URL — expected cloudinary://key:secret@cloud_name"
    );
  }
  const [, api_key, api_secret, cloud_name] = m;
  cloudinary.config({ cloud_name, api_key, api_secret, secure: true });
}

// ─── Slugs this script owns ────────────────────────────────────────────────
const TARGET_SLUGS = new Set<string>([
  "george-t-stagg",
  "thomas-h-handy-sazerac",
  "russells-reserve-13-year",
  "stagg-bourbon",
  "elmer-t-lee-single-barrel",
  "rock-hill-farms-single-barrel",
  "blantons-original-single-barrel",
  "blantons-gold-edition",
  "blood-oath",
  "king-of-kentucky",
]);

// ─── Category defaults (created on first run if missing) ───────────────────
const CATEGORY_DEFAULTS: Record<
  string,
  { name: string; description: string; sortOrder: number }
> = {
  bourbon: {
    name: "Bourbon",
    description:
      "Kentucky straight bourbon — at least 51% corn, aged in new charred American oak.",
    sortOrder: 1,
  },
  rye: {
    name: "Rye Whiskey",
    description: "Spicy, bold whiskeys made from at least 51% rye grain.",
    sortOrder: 2,
  },
  "limited-edition": {
    name: "Limited Edition",
    description:
      "Rare, allocated bottlings hand-selected by our Master Distiller — including the Buffalo Trace Antique Collection and other once-a-year releases.",
    sortOrder: 4,
  },
};

// ─── product.json (enriched) shape ─────────────────────────────────────────
type WordClusters = Record<string, string[]>;
type SeoBlock = {
  metaTitle: string;
  metaDescription: string;
  primaryKeyword: string;
  longTailKeywords: string[];
  keywordClusters: WordClusters;
};

type EnrichedProduct = {
  // Original product.json fields
  name: string;
  "price bottle": number;
  category: string;
  image_url: string;

  // Enriched fields
  slug: string;
  subtitle?: string;
  description?: string;
  story?: string;

  ageYears?: number;
  isNAS?: boolean;
  proof?: number;
  abv?: number;
  bottleSizeMl?: number;

  cornPercent?: number;
  ryePercent?: number;
  wheatPercent?: number;
  maltedBarleyPct?: number;

  distillery?: string;
  region?: string;
  state?: string;
  masterDistiller?: string;
  caskType?: string;
  charLevel?: number;
  finishCask?: string;
  totalBottlesProduced?: number;

  productionStyle?: keyof typeof ProductionStyle;
  isChillFiltered?: boolean;
  isLimitedEdition?: boolean;
  isAllocated?: boolean;

  nose?: string;
  palate?: string;
  finish?: string;
  flavorTags?: string[];
  servingSuggestion?: string;
  badge?: string;

  seo?: SeoBlock;
};

// ─── SKU derivation ────────────────────────────────────────────────────────
// product.json doesn't carry SKUs. Generate one stable per slug from a short
// brand code + age + bottle size. Map-driven so no surprises across runs.
const SKU_PREFIX: Record<string, string> = {
  "george-t-stagg": "GTS",
  "thomas-h-handy-sazerac": "THH",
  "russells-reserve-13-year": "RR13",
  "stagg-bourbon": "STAGG",
  "elmer-t-lee-single-barrel": "ETL",
  "rock-hill-farms-single-barrel": "RHF",
  "blantons-original-single-barrel": "BLT",
  "blantons-gold-edition": "BLTG",
  "blood-oath": "BO",
  "king-of-kentucky": "KOK",
};

function buildSku(p: EnrichedProduct): string {
  const prefix = SKU_PREFIX[p.slug];
  if (!prefix) {
    throw new Error(`No SKU prefix mapped for slug "${p.slug}". Add it to SKU_PREFIX.`);
  }
  const age = p.ageYears ?? 0;
  const ml = p.bottleSizeMl ?? 750;
  return `${prefix}-${String(age).padStart(2, "0")}-${ml}`;
}

// ─── Default merchandising values for newly imported products ──────────────
// product.json deliberately doesn't track ephemeral commerce state (stock,
// availability, ratings). Give every new row a reasonable default; admin can
// edit afterwards.
function defaultsForAllocated(p: EnrichedProduct) {
  // Annual allocated releases — light stock, mark as ALLOCATED.
  const isUltraRare =
    p.slug === "king-of-kentucky" ||
    p.slug === "george-t-stagg" ||
    p.slug === "thomas-h-handy-sazerac";
  return {
    stockBottles: isUltraRare ? 6 : 24,
    stockCases: 0,
    availability: (p.isAllocated ? "ALLOCATED" : "LOW_STOCK") as keyof typeof Availability,
    rating: 4.8,
    reviewCount: 0,
    isFeatured: p.isLimitedEdition === true,
  };
}

// ─── Utilities ─────────────────────────────────────────────────────────────
function resolveImagePath(rawPath: string): string {
  // product.json stores either an absolute path or a path relative to the repo
  // root (e.g. "public/geo.png"). Both should resolve correctly here.
  return path.isAbsolute(rawPath) ? rawPath : path.resolve(rawPath);
}

async function uploadToCloudinary(localPath: string): Promise<string> {
  const abs = resolveImagePath(localPath);
  if (!existsSync(abs)) throw new Error(`Image file not found: ${abs}`);
  const result = await cloudinary.uploader.upload(abs, {
    folder: "bourbon/products",
    resource_type: "image",
    transformation: [{ width: 2400, height: 2400, crop: "limit" }],
    fetch_format: "auto",
    quality: "auto:good",
  });
  return result.secure_url;
}

async function ensureCategory(slug: string) {
  const existing = await prisma.category.findUnique({ where: { slug } });
  if (existing) return existing;
  const defaults = CATEGORY_DEFAULTS[slug];
  if (!defaults) {
    throw new Error(
      `No CATEGORY_DEFAULTS for category slug "${slug}". Add it to CATEGORY_DEFAULTS.`
    );
  }
  return prisma.category.create({ data: { slug, ...defaults } });
}

function loadEnrichedProducts(): EnrichedProduct[] {
  const file = path.resolve("product.json");
  if (!existsSync(file)) throw new Error(`product.json not found at ${file}`);
  const data = JSON.parse(readFileSync(file, "utf8")) as EnrichedProduct[];
  if (!Array.isArray(data)) throw new Error("product.json must be an array.");
  return data.filter((p) => TARGET_SLUGS.has(p.slug));
}

function logSeo(displayName: string, seo: SeoBlock | undefined) {
  if (!seo) return;
  const clusters = Object.keys(seo.keywordClusters);
  console.log(`    SEO · focus: "${seo.primaryKeyword}"`);
  console.log(`         long-tail: ${seo.longTailKeywords.length} keywords`);
  console.log(`         clusters:  ${clusters.join(", ")}`);
}

async function main() {
  if (!process.env.CLOUDINARY_URL) throw new Error("CLOUDINARY_URL is not set.");
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set.");

  configureCloudinary();

  const products = loadEnrichedProducts();
  console.log(`Found ${products.length} target entries in product.json\n`);

  // Pre-create any categories referenced by the lineup.
  const categorySlugs = new Set(products.map((p) => p.category));
  const categoryMap = new Map<string, string>();
  for (const slug of categorySlugs) {
    const cat = await ensureCategory(slug);
    categoryMap.set(slug, cat.id);
    console.log(`Using category: ${cat.name} (id=${cat.id})`);
  }
  console.log("");

  let created = 0;
  let skipped = 0;

  for (const p of products) {
    const existing = await prisma.product.findUnique({ where: { slug: p.slug } });
    if (existing) {
      console.log(`• Skipping "${p.name}" — slug "${p.slug}" already exists.`);
      skipped++;
      continue;
    }

    const categoryId = categoryMap.get(p.category);
    if (!categoryId) {
      throw new Error(`Missing category id for "${p.category}" on product "${p.name}".`);
    }

    console.log(`• Uploading image for "${p.name}"…`);
    const imageUrl = await uploadToCloudinary(p.image_url);
    console.log(`  ↳ ${imageUrl}`);
    logSeo(p.name, p.seo);

    const sku = buildSku(p);
    const merch = defaultsForAllocated(p);

    await prisma.product.create({
      data: {
        slug: p.slug,
        name: p.name,
        subtitle: p.subtitle,
        description: p.description ?? "",
        story: p.story,
        badge: p.badge,
        sku,

        // Bottle-only lineup — no case pricing.
        bottlePrice: p["price bottle"],
        casePrice: null,
        bottlesPerCase: null,

        ageYears: p.ageYears,
        isNAS: p.isNAS ?? false,
        proof: p.proof ?? 0,
        abv: p.abv ?? 0,
        bottleSizeMl: p.bottleSizeMl ?? 750,

        cornPercent: p.cornPercent,
        ryePercent: p.ryePercent,
        wheatPercent: p.wheatPercent,
        maltedBarleyPct: p.maltedBarleyPct,

        distillery: p.distillery ?? "Unknown",
        region: p.region ?? "Kentucky",
        state: p.state,
        masterDistiller: p.masterDistiller,
        caskType: p.caskType,
        charLevel: p.charLevel,
        finishCask: p.finishCask,
        totalBottlesProduced: p.totalBottlesProduced,

        productionStyle:
          p.productionStyle ? ProductionStyle[p.productionStyle] : ProductionStyle.STANDARD,
        isChillFiltered: p.isChillFiltered ?? true,
        isLimitedEdition: p.isLimitedEdition ?? false,
        isAllocated: p.isAllocated ?? false,

        nose: p.nose,
        palate: p.palate,
        finish: p.finish,
        flavorTags: p.flavorTags ?? [],
        servingSuggestion: p.servingSuggestion,

        stockBottles: merch.stockBottles,
        stockCases: merch.stockCases,
        availability: Availability[merch.availability],
        rating: merch.rating,
        reviewCount: merch.reviewCount,
        isFeatured: merch.isFeatured,

        categoryId,

        images: {
          create: {
            url: imageUrl,
            alt: p.name,
            sortOrder: 0,
            isPrimary: true,
          },
        },
      },
    });

    console.log(`  ✓ Created (sku=${sku}).\n`);
    created++;
  }

  console.log(
    `\nDone — created ${created}, skipped ${skipped}, total ${products.length}.`
  );
}

main()
  .catch((err) => {
    console.error("\nImport failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
