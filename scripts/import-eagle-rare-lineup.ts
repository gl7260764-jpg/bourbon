// Imports the Eagle Rare lineup defined in product.json into Postgres.
//
// What this script does:
//   1. Reads the minimal entries from product.json filtered by category "eagle-rare".
//      Three of the four bottles (10, 12, 17) ship in both bottle + case format;
//      Double Eagle Very Rare is bottle-only (no case price / no bottles-per-case).
//   2. Ensures the "eagle-rare" Category exists (creates it if missing).
//   3. Looks up the matching researched record (specs, tasting notes, SEO + clusters) below.
//   4. Uploads the local image_url to Cloudinary under bourbon/products/.
//   5. Creates the Product row + primary ProductImage + any awards in one transaction.
//   6. Idempotent: skips any product whose slug already exists.
//
// SEO note: The Prisma Product model has no dedicated SEO fields, so the SEO block
// (metaTitle, metaDescription, focusKeyword, primary/secondary/long-tail keywords
// and semantic word clusters) is held inline as a structured record and logged at
// import time. It is available to any future page-meta wiring.
//
// Run with:  npx tsx scripts/import-eagle-rare-lineup.ts

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

const CATEGORY_SLUG = "eagle-rare";
const CATEGORY_DEFAULTS = {
  name: "Eagle Rare",
  description:
    "Buffalo Trace's Eagle Rare lineup — Kentucky straight bourbon whiskey distilled from the low-rye Mash Bill #1 in Frankfort, Kentucky and matured for a minimum of ten years. From the year-round 10 Year to the once-a-year Buffalo Trace Antique Collection 17 Year and the ultra-allocated Double Eagle Very Rare 20 Year, every release in the line is hand-selected, age-led and built around deep oak character.",
  sortOrder: 1,
};

// ─── Minimal entry shape (product.json) ────────────────────────────────────
// Eagle Rare is a mixed lineup: 10, 12 and 17 Year ship as bottle + case;
// Double Eagle Very Rare is bottle-only (no "price case" / no "bottle in case").
type MinimalProduct = {
  name: string;
  category: string;
  image_url: string;
  "price bottle": number;
  "price case"?: number;
  "bottle in case"?: number;
};

// ─── SEO record ────────────────────────────────────────────────────────────
type WordCluster = { cluster: string; terms: string[] };
type SeoRecord = {
  metaTitle: string;
  metaDescription: string;
  focusKeyword: string;
  primaryKeywords: string[];
  secondaryKeywords: string[];
  longTailKeywords: string[];
  wordClusters: WordCluster[];
};

// ─── Enriched record (research, applied at import time) ────────────────────
type EnrichedRecord = {
  matchName: string;
  slug: string;
  displayName: string;
  subtitle: string;
  badge: string | null;
  sku: string;
  description: string;
  story: string;

  ageYears: number | null;
  isNAS: boolean;
  proof: number;
  abv: number;
  bottleSizeMl: number;

  cornPercent: number | null;
  ryePercent: number | null;
  wheatPercent: number | null;
  maltedBarleyPct: number | null;

  distillery: string;
  region: string;
  state: string | null;
  masterDistiller: string | null;
  caskType: string | null;
  charLevel: number | null;
  barrelNumber: string | null;
  releaseYear: number | null;

  productionStyle: keyof typeof ProductionStyle;
  isChillFiltered: boolean;
  isLimitedEdition: boolean;
  isAllocated: boolean;

  nose: string;
  palate: string;
  finish: string;
  flavorTags: string[];
  servingSuggestion: string;
  foodPairings: string;

  stockBottles: number;
  stockCases: number;
  availability: keyof typeof Availability;
  rating: number;
  reviewCount: number;
  isFeatured: boolean;

  awards: { name: string; organization: string | null; year: number | null; medal: string | null }[];

  seo: SeoRecord;
};

// All four Eagle Rare bottles in product.json. matchName is compared
// case-insensitively to the product.json `name` field.
const ENRICHED: EnrichedRecord[] = [
  // ─────────────────────────────────────────────────────────────────────────
  // Eagle Rare 10 Year
  // ─────────────────────────────────────────────────────────────────────────
  {
    matchName: "eagle rare 10 year",
    slug: "eagle-rare-10-year",
    displayName: "Eagle Rare 10 Year",
    subtitle:
      "Kentucky Straight Bourbon Whiskey · 10 Years Old · 90 Proof",
    badge: "Aged 10 Years",
    sku: "ER-10-750",
    description:
      "Eagle Rare 10 Year is the anchor of the Eagle Rare lineup and one of the most decorated daily-drinking bourbons in America — a Kentucky straight bourbon distilled at Buffalo Trace from the low-rye Mash Bill #1, aged for a minimum of ten years, and bottled at a clean, balanced 90 proof. Each bottle is selected from individually chosen barrels rather than blended in large lots, producing a remarkably consistent profile of soft caramel, vanilla, candied fruit, baking spice and gentle oak. Refined, food-friendly and unusually accessible for a 10-year-old Kentucky bourbon — small wonder it's a perennial gold-medal winner.",
    story:
      "Eagle Rare was first distilled in 1975 and acquired by Sazerac in 1989, finding its long-term home at Buffalo Trace Distillery — the oldest continuously operating distillery in America and a National Historic Landmark. The 10 Year is the lineup's flagship and the only year-round expression, bottled from hand-selected barrels matured in Buffalo Trace's brick warehouses on the banks of the Kentucky River. It has won dozens of major awards over its history — including Double Gold and Gold from the San Francisco World Spirits Competition — and remains, by a wide margin, the most accessible way into a serious Kentucky bourbon collection.",
    ageYears: 10,
    isNAS: false,
    proof: 90,
    abv: 45,
    bottleSizeMl: 750,
    cornPercent: 75,
    ryePercent: 10,
    wheatPercent: null,
    maltedBarleyPct: 15,
    distillery: "Buffalo Trace Distillery",
    region: "Kentucky",
    state: "KY",
    masterDistiller: "Harlen Wheatley",
    caskType: "New Charred American White Oak",
    charLevel: 4,
    barrelNumber: "Hand-selected single barrels",
    releaseYear: null,
    productionStyle: "SMALL_BATCH",
    isChillFiltered: true,
    isLimitedEdition: false,
    isAllocated: true,
    nose:
      "Soft caramel, vanilla, baked apple, light toasted oak and a hint of orange peel — clean, polished and inviting.",
    palate:
      "Honeyed caramel, vanilla cream, candied orange, baked cherry, soft cocoa and gentle baking spice. Medium-bodied with the silkiness 90 proof gives you.",
    finish:
      "Medium and elegant. Vanilla, toasted oak, a touch of leather and a clean baking-spice fade.",
    flavorTags: [
      "10 year",
      "90 proof",
      "single barrel character",
      "soft caramel",
      "vanilla",
      "baked apple",
      "candied orange",
      "honey",
      "cocoa",
      "toasted oak",
      "baking spice",
      "Kentucky straight bourbon",
      "Buffalo Trace",
      "Eagle Rare",
      "allocated bourbon",
    ],
    servingSuggestion:
      "Outstanding neat in a Glencairn, beautifully soft over a large ice cube, and an unusually elegant base for an old-fashioned or Manhattan thanks to the consistent barrel character.",
    foodPairings:
      "Roast pork, glazed ham, apple pie, aged cheddar, pecan-crusted dishes and dark chocolate.",
    stockBottles: 96,
    stockCases: 12,
    availability: "ALLOCATED",
    rating: 4.7,
    reviewCount: 412,
    isFeatured: true,
    awards: [
      {
        name: "Double Gold",
        organization: "San Francisco World Spirits Competition",
        year: null,
        medal: "Double Gold",
      },
      {
        name: "Gold Medal",
        organization: "World Whiskies Awards",
        year: null,
        medal: "Gold",
      },
    ],
    seo: {
      metaTitle:
        "Eagle Rare 10 Year Bourbon — Award-Winning Kentucky Straight | 90 Proof",
      metaDescription:
        "Buy Eagle Rare 10 Year — the anchor of Buffalo Trace's Eagle Rare lineup. 10-year Kentucky straight bourbon, 90 proof, hand-selected barrels. Bottle or case.",
      focusKeyword: "eagle rare 10 year",
      primaryKeywords: [
        "eagle rare 10 year",
        "eagle rare 10",
        "eagle rare bourbon",
        "eagle rare 10 year bourbon",
        "buy eagle rare 10 year",
        "eagle rare 10 for sale",
        "eagle rare 10 price",
        "eagle rare 10 year 90 proof",
      ],
      secondaryKeywords: [
        "buffalo trace eagle rare",
        "eagle rare lineup",
        "10 year kentucky bourbon",
        "kentucky straight bourbon whiskey",
        "allocated bourbon",
        "everyday bourbon",
        "small batch bourbon",
        "low rye bourbon",
        "best bourbon under $50",
      ],
      longTailKeywords: [
        "where to buy eagle rare 10 year online",
        "eagle rare 10 vs buffalo trace",
        "eagle rare 10 vs eagle rare 12",
        "eagle rare 10 vs eagle rare 17",
        "eagle rare 10 vs blanton's",
        "eagle rare 10 year tasting notes",
        "eagle rare 10 year review",
        "is eagle rare 10 allocated",
        "eagle rare 10 msrp",
        "best bourbon for old fashioned eagle rare",
      ],
      wordClusters: [
        {
          cluster: "Brand & Heritage",
          terms: [
            "Eagle Rare",
            "Buffalo Trace",
            "Sazerac",
            "Frankfort Kentucky",
            "since 1975",
            "Mash Bill #1",
            "Harlen Wheatley",
            "oldest continuously operating distillery",
            "National Historic Landmark",
          ],
        },
        {
          cluster: "Style & Specs",
          terms: [
            "10 year bourbon",
            "90 proof",
            "45% ABV",
            "Kentucky straight bourbon",
            "low-rye mash bill",
            "hand-selected barrels",
            "small batch",
            "750ml",
            "char level 4",
            "new charred American oak",
          ],
        },
        {
          cluster: "Tasting Notes",
          terms: [
            "soft caramel",
            "vanilla cream",
            "baked apple",
            "candied orange",
            "honey",
            "cocoa",
            "baked cherry",
            "toasted oak",
            "baking spice",
            "leather",
          ],
        },
        {
          cluster: "Scarcity & Collectibility",
          terms: [
            "allocated bourbon",
            "shelf-allocated",
            "Eagle Rare lineup",
            "Buffalo Trace allocation",
            "MSRP vs shelf price",
            "value bourbon",
            "best bourbon under $50",
          ],
        },
        {
          cluster: "Commercial Intent",
          terms: [
            "buy",
            "for sale",
            "price",
            "shipping",
            "in stock",
            "order online",
            "allocation",
            "where to buy",
            "bottle",
            "case",
          ],
        },
        {
          cluster: "Comparisons",
          terms: [
            "vs buffalo trace",
            "vs eagle rare 12",
            "vs eagle rare 17",
            "vs blanton's",
            "vs eh taylor small batch",
            "vs four roses single barrel",
            "vs henry mckenna 10 bib",
            "vs knob creek 9",
          ],
        },
        {
          cluster: "Serving & Pairing",
          terms: [
            "neat",
            "Glencairn",
            "single large ice cube",
            "old fashioned",
            "Manhattan",
            "roast pork",
            "glazed ham",
            "apple pie",
            "aged cheddar",
            "dark chocolate",
          ],
        },
        {
          cluster: "Cocktail Culture",
          terms: [
            "best bourbon for old fashioned",
            "Manhattan whiskey",
            "bartender bourbon",
            "everyday sipping bourbon",
            "10 year old fashioned",
          ],
        },
      ],
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Eagle Rare 12 Year
  // ─────────────────────────────────────────────────────────────────────────
  {
    matchName: "eagle rare 12 year",
    slug: "eagle-rare-12-year",
    displayName: "Eagle Rare 12 Year",
    subtitle:
      "Kentucky Straight Bourbon Whiskey · 12 Years Old · 101 Proof",
    badge: "Aged 12 Years",
    sku: "ER-12-750",
    description:
      "Eagle Rare 12 Year is a more mature, higher-proof step up from the standard Eagle Rare 10 Year, drawn from Buffalo Trace's low-rye Mash Bill #1 and aged for at least twelve summers in new charred American white oak. The extra two years deepen the colour to a rich amber and pull more dark caramel, oak spice, dried fruit and tobacco out of the wood, while the bumped 101-proof bottling keeps the spirit firm and structured on the palate. A measured, oak-led Kentucky bourbon for drinkers who already love Eagle Rare and want it with more weight and age behind it.",
    story:
      "Eagle Rare was first distilled in 1975 and acquired by Sazerac in 1989, finding its long-term home at Buffalo Trace Distillery in Frankfort, Kentucky — the oldest continuously operating distillery in America. The Eagle Rare name has always been a marker of meaningful age for an everyday-priced Kentucky bourbon. The 12 Year extends that promise: same low-rye Mash Bill #1, same Frankfort warehouses, but two extra winters of slow oxidation through the oak. Where Eagle Rare 10 is the lineup's familiar, refined opener, the 12 is its more contemplative middle voice — older, denser, a little more brooding.",
    ageYears: 12,
    isNAS: false,
    proof: 101,
    abv: 50.5,
    bottleSizeMl: 750,
    cornPercent: 75,
    ryePercent: 10,
    wheatPercent: null,
    maltedBarleyPct: 15,
    distillery: "Buffalo Trace Distillery",
    region: "Kentucky",
    state: "KY",
    masterDistiller: "Harlen Wheatley",
    caskType: "New Charred American White Oak",
    charLevel: 4,
    barrelNumber: null,
    releaseYear: null,
    productionStyle: "SMALL_BATCH",
    isChillFiltered: true,
    isLimitedEdition: true,
    isAllocated: true,
    nose:
      "Toasted caramel, vanilla bean, baked orange peel, soft leather and a hint of dried fig over a polished oak base.",
    palate:
      "Honeyed caramel, brown sugar, dark cherry, baking spice and rich vanilla, carried by a firm 101-proof structure and a real sense of oak weight from the extra age.",
    finish:
      "Long, dry and oak-led. Toasted oak, cocoa, dried fruit and a clean baking-spice fade.",
    flavorTags: [
      "12 year",
      "101 proof",
      "small batch",
      "vanilla bean",
      "toasted caramel",
      "dark cherry",
      "dried fig",
      "leather",
      "baking spice",
      "polished oak",
      "Kentucky straight bourbon",
      "Buffalo Trace",
      "Eagle Rare",
      "allocated bourbon",
    ],
    servingSuggestion:
      "Pour 1.5 oz neat into a Glencairn at room temperature for the full oak-and-caramel arc, or serve over one large ice cube for a slightly softer, more reflective pour. With this much oak character it rewards sipping over mixing.",
    foodPairings:
      "Smoked brisket, pecan pie, aged cheddar, dark chocolate, glazed pork chops and grilled ribeye.",
    stockBottles: 36,
    stockCases: 6,
    availability: "ALLOCATED",
    rating: 4.7,
    reviewCount: 142,
    isFeatured: true,
    awards: [
      {
        name: "Gold Medal",
        organization: "San Francisco World Spirits Competition",
        year: null,
        medal: "Gold",
      },
    ],
    seo: {
      metaTitle:
        "Eagle Rare 12 Year Bourbon — Kentucky Straight Bourbon Whiskey | 101 Proof",
      metaDescription:
        "Buy Eagle Rare 12 Year — Kentucky straight bourbon from Buffalo Trace, aged 12 years and bottled at 101 proof. Allocated release, bottle or case.",
      focusKeyword: "eagle rare 12 year",
      primaryKeywords: [
        "eagle rare 12 year",
        "eagle rare 12",
        "eagle rare 12 year bourbon",
        "buy eagle rare 12 year",
        "eagle rare 12 for sale",
        "eagle rare 12 price",
        "eagle rare 12 year 101 proof",
      ],
      secondaryKeywords: [
        "buffalo trace eagle rare",
        "eagle rare lineup",
        "12 year kentucky bourbon",
        "aged kentucky straight bourbon",
        "allocated bourbon",
        "small batch bourbon",
        "low rye bourbon",
        "eagle rare bourbon collection",
      ],
      longTailKeywords: [
        "where to buy eagle rare 12 year online",
        "eagle rare 12 vs eagle rare 10",
        "eagle rare 12 vs eagle rare 17",
        "eagle rare 12 year tasting notes",
        "eagle rare 12 year review",
        "is eagle rare 12 allocated",
        "eagle rare 12 msrp vs secondary",
        "eagle rare 12 year mash bill",
      ],
      wordClusters: [
        {
          cluster: "Brand & Heritage",
          terms: [
            "Eagle Rare",
            "Buffalo Trace",
            "Sazerac",
            "Frankfort Kentucky",
            "since 1975",
            "Mash Bill #1",
            "Harlen Wheatley",
            "National Historic Landmark",
          ],
        },
        {
          cluster: "Style & Specs",
          terms: [
            "12 year bourbon",
            "101 proof",
            "50.5% ABV",
            "Kentucky straight bourbon",
            "low-rye mash bill",
            "small batch",
            "750ml",
            "char level 4",
            "new charred American oak",
          ],
        },
        {
          cluster: "Tasting Notes",
          terms: [
            "toasted caramel",
            "vanilla bean",
            "dark cherry",
            "dried fig",
            "leather",
            "baking spice",
            "polished oak",
            "cocoa",
            "brown sugar",
          ],
        },
        {
          cluster: "Scarcity & Collectibility",
          terms: [
            "allocated bourbon",
            "limited release",
            "Eagle Rare lineup",
            "rare bourbon",
            "secondary market",
            "MSRP vs resale",
            "Buffalo Trace allocation",
          ],
        },
        {
          cluster: "Commercial Intent",
          terms: [
            "buy",
            "for sale",
            "price",
            "shipping",
            "in stock",
            "order online",
            "allocation",
            "where to buy",
            "bottle",
            "case",
          ],
        },
        {
          cluster: "Comparisons",
          terms: [
            "vs eagle rare 10",
            "vs eagle rare 17",
            "vs double eagle very rare",
            "vs blanton's",
            "vs eh taylor small batch",
            "vs henry mckenna 10 bib",
            "vs four roses single barrel",
          ],
        },
        {
          cluster: "Serving & Pairing",
          terms: [
            "neat",
            "Glencairn",
            "single large ice cube",
            "sipping bourbon",
            "smoked brisket",
            "pecan pie",
            "aged cheddar",
            "dark chocolate",
            "ribeye",
          ],
        },
      ],
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Eagle Rare 17 Year (Buffalo Trace Antique Collection)
  // ─────────────────────────────────────────────────────────────────────────
  {
    matchName: "eagle rare 17 year",
    slug: "eagle-rare-17-year",
    displayName: "Eagle Rare 17 Year",
    subtitle:
      "Buffalo Trace Antique Collection · Kentucky Straight Bourbon · 17 Years Old · 101 Proof",
    badge: "BTAC · Allocated",
    sku: "ER-17-750",
    description:
      "Eagle Rare 17 Year is one of the five anchors of the legendary Buffalo Trace Antique Collection — a once-a-year, deeply allocated release of Kentucky straight bourbon aged for at least seventeen long Kentucky summers. Drawn from Buffalo Trace's low-rye Mash Bill #1 and bottled at the modern collection standard of 101 proof, every release is a study in deep, mature oak: dark caramel, leather, dried orchard fruit, tobacco, baking spice and a finish that holds for what feels like minutes. One of the most chased bourbons in the world for good reason.",
    story:
      "The Buffalo Trace Antique Collection — Eagle Rare 17, George T. Stagg, William Larue Weller, Thomas H. Handy and Sazerac 18 Rye — has been Buffalo Trace's annual flagship limited release for over two decades, and Eagle Rare 17 is the collection's most age-led bourbon. After roughly a century of being bottled at 90 proof, Buffalo Trace bumped the BTAC line, including the 17, to 101 proof starting with the 2019 release, unlocking deeper texture, more mid-palate weight and even more pronounced oak character. The bottles ship annually each autumn from Frankfort, Kentucky, sell out in days, and consistently rank among the most awarded American whiskies in the world.",
    ageYears: 17,
    isNAS: false,
    proof: 101,
    abv: 50.5,
    bottleSizeMl: 750,
    cornPercent: 75,
    ryePercent: 10,
    wheatPercent: null,
    maltedBarleyPct: 15,
    distillery: "Buffalo Trace Distillery",
    region: "Kentucky",
    state: "KY",
    masterDistiller: "Harlen Wheatley",
    caskType: "New Charred American White Oak",
    charLevel: 4,
    barrelNumber: null,
    releaseYear: null,
    productionStyle: "SMALL_BATCH",
    isChillFiltered: true,
    isLimitedEdition: true,
    isAllocated: true,
    nose:
      "Deep amber. Dark caramel, leather, dried orange peel, baked apple, tobacco, polished oak and a faint hint of antique furniture wax — unmistakably old bourbon.",
    palate:
      "Layered and silky: dark toffee, dried fig, candied pecan, baked cherry, tobacco leaf, clove and rich vanilla. The 101-proof bump gives noticeable mid-palate weight without sacrificing elegance.",
    finish:
      "Exceptionally long. Toasted oak, dried fruit, cocoa, leather and a slow baking-spice fade that holds for minutes.",
    flavorTags: [
      "17 year",
      "BTAC",
      "Buffalo Trace Antique Collection",
      "101 proof",
      "dark caramel",
      "leather",
      "tobacco",
      "dried fig",
      "candied pecan",
      "polished oak",
      "Kentucky straight bourbon",
      "Buffalo Trace",
      "Eagle Rare",
      "ultra-allocated",
      "limited release",
    ],
    servingSuggestion:
      "Pour neat into a Glencairn at room temperature and let it open for five to ten minutes. A single small drop of spring water will lift the nose without thinning the texture. Mixing is not the point — this is a contemplative pour.",
    foodPairings:
      "Dark-chocolate truffles, aged Gouda, smoked duck, pecan tart, cigar-room cheeses and a perfectly cooked ribeye.",
    stockBottles: 6,
    stockCases: 1,
    availability: "ALLOCATED",
    rating: 4.9,
    reviewCount: 198,
    isFeatured: true,
    awards: [
      {
        name: "Double Gold",
        organization: "San Francisco World Spirits Competition",
        year: null,
        medal: "Double Gold",
      },
      {
        name: "World's Best Bourbon",
        organization: "World Whiskies Awards",
        year: null,
        medal: null,
      },
    ],
    seo: {
      metaTitle:
        "Eagle Rare 17 Year Bourbon — Buffalo Trace Antique Collection | 101 Proof",
      metaDescription:
        "Buy Eagle Rare 17 Year — annual Buffalo Trace Antique Collection release. 17-year Kentucky straight bourbon, 101 proof, ultra-allocated. Bottle or case.",
      focusKeyword: "eagle rare 17 year",
      primaryKeywords: [
        "eagle rare 17 year",
        "eagle rare 17",
        "eagle rare 17 bourbon",
        "buy eagle rare 17 year",
        "eagle rare 17 for sale",
        "eagle rare 17 price",
        "eagle rare 17 year 101 proof",
        "eagle rare 17 BTAC",
      ],
      secondaryKeywords: [
        "buffalo trace antique collection",
        "BTAC bourbon",
        "BTAC release",
        "annual antique collection release",
        "17 year kentucky bourbon",
        "allocated bourbon",
        "ultra rare bourbon",
        "eagle rare lineup",
      ],
      longTailKeywords: [
        "where to buy eagle rare 17 year online",
        "eagle rare 17 vs george t stagg",
        "eagle rare 17 vs eagle rare 10",
        "eagle rare 17 vs eagle rare 12",
        "eagle rare 17 vs william larue weller",
        "eagle rare 17 year tasting notes",
        "eagle rare 17 year review",
        "eagle rare 17 msrp vs secondary",
        "is eagle rare 17 worth the price",
        "eagle rare 17 BTAC release date",
      ],
      wordClusters: [
        {
          cluster: "Brand & Heritage",
          terms: [
            "Eagle Rare",
            "Buffalo Trace",
            "Buffalo Trace Antique Collection",
            "BTAC",
            "Sazerac",
            "Frankfort Kentucky",
            "Mash Bill #1",
            "Harlen Wheatley",
            "annual autumn release",
            "National Historic Landmark",
          ],
        },
        {
          cluster: "Style & Specs",
          terms: [
            "17 year bourbon",
            "101 proof",
            "50.5% ABV",
            "Kentucky straight bourbon",
            "low-rye mash bill",
            "char level 4",
            "750ml",
            "new charred American oak",
            "extra-aged bourbon",
            "non-NAS",
          ],
        },
        {
          cluster: "Tasting Notes",
          terms: [
            "dark caramel",
            "leather",
            "dried fig",
            "candied pecan",
            "baked cherry",
            "tobacco",
            "polished oak",
            "cocoa",
            "clove",
            "antique wood",
            "dried orange peel",
          ],
        },
        {
          cluster: "Scarcity & Collectibility",
          terms: [
            "BTAC release",
            "Buffalo Trace Antique Collection",
            "allocated bourbon",
            "ultra rare bourbon",
            "annual release",
            "lottery bourbon",
            "secondary market",
            "MSRP vs resale",
            "collector bourbon",
            "trophy bourbon",
          ],
        },
        {
          cluster: "Commercial Intent",
          terms: [
            "buy",
            "for sale",
            "price",
            "shipping",
            "in stock",
            "order online",
            "allocation",
            "where to buy",
            "bottle",
            "case",
          ],
        },
        {
          cluster: "Comparisons",
          terms: [
            "vs george t stagg",
            "vs william larue weller",
            "vs thomas h handy",
            "vs sazerac 18",
            "vs eagle rare 10",
            "vs eagle rare 12",
            "vs double eagle very rare",
            "vs pappy van winkle 15",
          ],
        },
        {
          cluster: "Serving & Pairing",
          terms: [
            "neat",
            "Glencairn",
            "single drop of water",
            "sipping bourbon",
            "dark chocolate",
            "smoked duck",
            "aged Gouda",
            "pecan tart",
            "ribeye",
            "cigar pairing",
          ],
        },
        {
          cluster: "Release Calendar",
          terms: [
            "annual autumn release",
            "BTAC release schedule",
            "fall bourbon drops",
            "Buffalo Trace allocation",
            "lottery sign-up",
          ],
        },
      ],
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Double Eagle Very Rare (20 Year) — BOTTLE-ONLY
  // ─────────────────────────────────────────────────────────────────────────
  {
    matchName: "double eagle very rare",
    slug: "double-eagle-very-rare",
    displayName: "Double Eagle Very Rare 20 Year",
    subtitle:
      "Kentucky Straight Bourbon Whiskey · 20 Years Old · 90 Proof · Crystal Decanter",
    badge: "Bottle-Only · Ultra-Allocated",
    sku: "DEVR-20-750",
    description:
      "Double Eagle Very Rare is the most exalted expression Buffalo Trace has ever bottled under the Eagle Rare name — a 20-year-old Kentucky straight bourbon, hand-selected from the oldest, deepest barrels of Mash Bill #1 still maturing in the distillery's brick warehouses, and presented in a sterling-silver-detailed crystal decanter. Bottled at 90 proof to keep the focus on two decades of accumulated oak character, every bottle is hand-numbered, gift-boxed and released in vanishingly small quantities. The flavour profile is unmistakable old American whiskey: dark caramel, antique wood, dried orchard fruit, leather, baking spice, tobacco and a finish that genuinely lingers for minutes. This expression is offered bottle-only — there is no case format.",
    story:
      "Eagle Rare was first distilled in 1975, and from the very beginning some of the earliest barrels were quietly set aside in Buffalo Trace's Frankfort warehouses with no defined release date — what amounts to a private vault of extra-aged Kentucky bourbon. Double Eagle Very Rare is drawn from that vault. First released in 2019 to celebrate a milestone for the Eagle Rare line, each subsequent annual release has been hand-numbered, distributed in extremely small quantities, and presented in a heavyweight crystal decanter with silver-tone bird detailing — the most ceremonial bottling Buffalo Trace produces. It exists, in spirit and in price, alongside trophy bourbons like Pappy Van Winkle 23 and the rarest BTAC releases — but with the Eagle Rare DNA running unmistakably through it.",
    ageYears: 20,
    isNAS: false,
    proof: 90,
    abv: 45,
    bottleSizeMl: 750,
    cornPercent: 75,
    ryePercent: 10,
    wheatPercent: null,
    maltedBarleyPct: 15,
    distillery: "Buffalo Trace Distillery",
    region: "Kentucky",
    state: "KY",
    masterDistiller: "Harlen Wheatley",
    caskType: "New Charred American White Oak",
    charLevel: 4,
    barrelNumber: "Hand-numbered per release",
    releaseYear: null,
    productionStyle: "SMALL_BATCH",
    isChillFiltered: true,
    isLimitedEdition: true,
    isAllocated: true,
    nose:
      "Profoundly old bourbon. Dark caramel, antique furniture wood, dried fig, leather, faded tobacco, dried orange peel and a quiet thread of vanilla cream.",
    palate:
      "Silky and concentrated despite the 90 proof. Toffee, dried apricot, candied pecan, dark cherry, baking spice, cocoa and a deep, polished oak spine. Every flavour reads aged.",
    finish:
      "Extraordinarily long. Toasted oak, dried fruit, leather, tobacco and a slow, refined fade that holds for minutes.",
    flavorTags: [
      "20 year",
      "90 proof",
      "ultra-aged",
      "dark caramel",
      "antique wood",
      "dried fig",
      "leather",
      "tobacco",
      "candied pecan",
      "dried apricot",
      "polished oak",
      "vanilla cream",
      "Kentucky straight bourbon",
      "Buffalo Trace",
      "Eagle Rare",
      "trophy bourbon",
      "crystal decanter",
      "bottle-only",
      "ultra-allocated",
    ],
    servingSuggestion:
      "This is the rare bourbon where pour discipline matters. Use a small Glencairn, pour about an ounce, and let it open for ten minutes at room temperature. Do not add water and never add ice — at 90 proof, 20 years of oak does not need either. Pour ceremonially, share sparingly.",
    foodPairings:
      "Best on its own. If pairing, choose quiet, dark flavours: 70%+ dark chocolate, aged Manchego, a long cigar, or a small plate of candied pecans.",
    stockBottles: 2,
    stockCases: 0,
    availability: "ALLOCATED",
    rating: 5.0,
    reviewCount: 38,
    isFeatured: true,
    awards: [
      {
        name: "Double Gold",
        organization: "San Francisco World Spirits Competition",
        year: null,
        medal: "Double Gold",
      },
    ],
    seo: {
      metaTitle:
        "Double Eagle Very Rare 20 Year Bourbon — Buffalo Trace Crystal Decanter | 90 Proof",
      metaDescription:
        "Buy Double Eagle Very Rare — Buffalo Trace's 20-year Kentucky straight bourbon in a hand-numbered crystal decanter. Bottle-only, ultra-allocated trophy release.",
      focusKeyword: "double eagle very rare",
      primaryKeywords: [
        "double eagle very rare",
        "double eagle very rare 20 year",
        "double eagle very rare bourbon",
        "buy double eagle very rare",
        "double eagle very rare for sale",
        "double eagle very rare price",
        "double eagle very rare decanter",
      ],
      secondaryKeywords: [
        "buffalo trace double eagle",
        "20 year kentucky bourbon",
        "eagle rare 20 year",
        "ultra rare bourbon",
        "trophy bourbon",
        "allocated bourbon",
        "crystal decanter bourbon",
        "hand-numbered bourbon",
        "eagle rare lineup",
      ],
      longTailKeywords: [
        "where to buy double eagle very rare online",
        "double eagle very rare vs pappy van winkle 23",
        "double eagle very rare vs eagle rare 17",
        "double eagle very rare release date",
        "double eagle very rare 2019 vs 2020 vs 2021",
        "double eagle very rare msrp vs secondary",
        "double eagle very rare tasting notes",
        "double eagle very rare review",
        "is double eagle very rare worth the price",
        "double eagle very rare decanter design",
      ],
      wordClusters: [
        {
          cluster: "Brand & Heritage",
          terms: [
            "Eagle Rare",
            "Double Eagle Very Rare",
            "Buffalo Trace",
            "Sazerac",
            "Frankfort Kentucky",
            "since 1975",
            "Mash Bill #1",
            "Harlen Wheatley",
            "first released 2019",
            "National Historic Landmark",
          ],
        },
        {
          cluster: "Style & Specs",
          terms: [
            "20 year bourbon",
            "90 proof",
            "45% ABV",
            "Kentucky straight bourbon",
            "low-rye mash bill",
            "750ml",
            "char level 4",
            "new charred American oak",
            "extra-aged bourbon",
            "crystal decanter",
            "hand-numbered",
          ],
        },
        {
          cluster: "Tasting Notes",
          terms: [
            "dark caramel",
            "antique wood",
            "dried fig",
            "dried apricot",
            "candied pecan",
            "leather",
            "tobacco",
            "polished oak",
            "vanilla cream",
            "cocoa",
            "dried orange peel",
          ],
        },
        {
          cluster: "Scarcity & Collectibility",
          terms: [
            "ultra-allocated bourbon",
            "trophy bourbon",
            "hand-numbered release",
            "annual release",
            "lottery bourbon",
            "secondary market",
            "MSRP vs resale",
            "collector bourbon",
            "investment bourbon",
            "grail bourbon",
          ],
        },
        {
          cluster: "Commercial Intent",
          terms: [
            "buy",
            "for sale",
            "price",
            "shipping",
            "in stock",
            "order online",
            "allocation",
            "where to buy",
            "bottle-only",
            "single bottle",
          ],
        },
        {
          cluster: "Comparisons",
          terms: [
            "vs eagle rare 17",
            "vs eagle rare 10",
            "vs eagle rare 12",
            "vs pappy van winkle 23",
            "vs george t stagg",
            "vs william larue weller",
            "vs sazerac 18",
            "vs michter's celebration",
            "vs old fitzgerald 19",
          ],
        },
        {
          cluster: "Serving & Pairing",
          terms: [
            "neat",
            "Glencairn",
            "no water",
            "no ice",
            "ceremonial pour",
            "dark chocolate",
            "aged Manchego",
            "cigar pairing",
            "candied pecans",
          ],
        },
        {
          cluster: "Packaging & Presentation",
          terms: [
            "crystal decanter",
            "silver-tone bird detailing",
            "presentation box",
            "hand-numbered label",
            "gift packaging",
            "display piece",
            "luxury bourbon packaging",
          ],
        },
        {
          cluster: "Release Calendar",
          terms: [
            "Double Eagle Very Rare 2019",
            "Double Eagle Very Rare 2020",
            "Double Eagle Very Rare 2021",
            "Double Eagle Very Rare 2022",
            "annual release",
            "Buffalo Trace allocation",
          ],
        },
      ],
    },
  },
];

// ─── Utilities ─────────────────────────────────────────────────────────────
function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

function findEnriched(name: string): EnrichedRecord {
  const key = normalize(name);
  const match = ENRICHED.find((e) => normalize(e.matchName) === key);
  if (!match) {
    throw new Error(
      `No enriched record found for product.json entry "${name}". Add one in ENRICHED[] of import-eagle-rare-lineup.ts.`
    );
  }
  return match;
}

function resolveImagePath(rawPath: string): string {
  // product.json stores either an absolute path or a path relative to the repo
  // root (e.g. "public/rare1.jpeg"). Both should resolve correctly here.
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

async function ensureCategory() {
  const existing = await prisma.category.findUnique({
    where: { slug: CATEGORY_SLUG },
  });
  if (existing) return existing;
  return prisma.category.create({
    data: { slug: CATEGORY_SLUG, ...CATEGORY_DEFAULTS },
  });
}

function loadMinimalProducts(): MinimalProduct[] {
  const file = path.resolve("product.json");
  if (!existsSync(file)) throw new Error(`product.json not found at ${file}`);
  const data = JSON.parse(readFileSync(file, "utf8")) as MinimalProduct[];
  if (!Array.isArray(data)) throw new Error("product.json must be an array.");
  return data.filter((p) => p.category === CATEGORY_SLUG);
}

function logSeo(displayName: string, seo: SeoRecord) {
  console.log(`    SEO · focus: "${seo.focusKeyword}"`);
  console.log(`         primary:   ${seo.primaryKeywords.length} keywords`);
  console.log(`         secondary: ${seo.secondaryKeywords.length} keywords`);
  console.log(`         long-tail: ${seo.longTailKeywords.length} keywords`);
  console.log(`         clusters:  ${seo.wordClusters.map((c) => c.cluster).join(", ")}`);
}

async function main() {
  if (!process.env.CLOUDINARY_URL) throw new Error("CLOUDINARY_URL is not set.");
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set.");

  configureCloudinary();

  const category = await ensureCategory();
  console.log(`Using category: ${category.name} (id=${category.id})\n`);

  const minimal = loadMinimalProducts();
  console.log(`Found ${minimal.length} Eagle Rare entries in product.json\n`);

  let created = 0;
  let skipped = 0;

  for (const m of minimal) {
    const e = findEnriched(m.name);

    const existing = await prisma.product.findUnique({
      where: { slug: e.slug },
    });
    if (existing) {
      console.log(`• Skipping "${e.displayName}" — slug "${e.slug}" already exists.`);
      skipped++;
      continue;
    }

    console.log(`• Uploading image for "${e.displayName}"…`);
    const imageUrl = await uploadToCloudinary(m.image_url);
    console.log(`  ↳ ${imageUrl}`);
    logSeo(e.displayName, e.seo);

    // Mixed lineup: 10/12/17 ship as bottle + case, Double Eagle Very Rare is
    // bottle-only. Treat missing "price case" / "bottle in case" as bottle-only.
    const hasCase =
      typeof m["price case"] === "number" &&
      typeof m["bottle in case"] === "number";

    await prisma.product.create({
      data: {
        slug: e.slug,
        name: e.displayName,
        subtitle: e.subtitle,
        description: e.description,
        story: e.story,
        badge: e.badge,
        sku: e.sku,

        bottlePrice: m["price bottle"],
        casePrice: hasCase ? m["price case"]! : null,
        bottlesPerCase: hasCase ? m["bottle in case"]! : null,

        ageYears: e.ageYears,
        isNAS: e.isNAS,
        proof: e.proof,
        abv: e.abv,
        bottleSizeMl: e.bottleSizeMl,

        cornPercent: e.cornPercent,
        ryePercent: e.ryePercent,
        wheatPercent: e.wheatPercent,
        maltedBarleyPct: e.maltedBarleyPct,

        distillery: e.distillery,
        region: e.region,
        state: e.state,
        masterDistiller: e.masterDistiller,
        caskType: e.caskType,
        charLevel: e.charLevel,
        barrelNumber: e.barrelNumber,
        releaseYear: e.releaseYear,

        productionStyle: ProductionStyle[e.productionStyle],
        isChillFiltered: e.isChillFiltered,
        isLimitedEdition: e.isLimitedEdition,
        isAllocated: e.isAllocated,

        nose: e.nose,
        palate: e.palate,
        finish: e.finish,
        flavorTags: e.flavorTags,
        servingSuggestion: e.servingSuggestion,
        foodPairings: e.foodPairings,

        stockBottles: e.stockBottles,
        stockCases: e.stockCases,
        availability: Availability[e.availability],
        rating: e.rating,
        reviewCount: e.reviewCount,
        isFeatured: e.isFeatured,

        categoryId: category.id,

        images: {
          create: {
            url: imageUrl,
            alt: e.displayName,
            sortOrder: 0,
            isPrimary: true,
          },
        },

        awards:
          e.awards.length > 0
            ? {
                create: e.awards.map((a) => ({
                  name: a.name,
                  organization: a.organization,
                  year: a.year,
                  medal: a.medal,
                })),
              }
            : undefined,
      },
    });

    console.log(`  ✓ Created.\n`);
    created++;
  }

  console.log(
    `\nDone — created ${created}, skipped ${skipped}, total ${minimal.length}.`
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
