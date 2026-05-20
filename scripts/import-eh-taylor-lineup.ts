// Imports the Colonel E.H. Taylor, Jr. lineup defined in product.json into Postgres.
//
// What this script does:
//   1. Reads the minimal entries from product.json filtered by category "eh-taylor"
//      (these are bottle-only — no case price / bottles-per-case).
//   2. Ensures the "eh-taylor" Category exists (creates it if missing).
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
// Run with:  npx tsx scripts/import-eh-taylor-lineup.ts

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

const CATEGORY_SLUG = "eh-taylor";
const CATEGORY_DEFAULTS = {
  name: "Colonel E.H. Taylor, Jr.",
  description:
    "Buffalo Trace's tribute line to Colonel Edmund Haynes Taylor, Jr. — the 19th-century bourbon pioneer behind the Bottled-in-Bond Act and the modern shape of Kentucky whiskey. Each release is bottle-only, distillery-direct.",
  sortOrder: 2,
};

// ─── Minimal entry shape (product.json) ────────────────────────────────────
// Note: this lineup is bottle-only. The case fields ("price case" and
// "case number of bottles") are intentionally absent from product.json.
type MinimalProduct = {
  name: string;
  category: string;
  image_url: string;
  "price bottle": number;
  "price case"?: number;
  "case number of bottles"?: number;
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

// All three Taylor bottles in product.json. matchName is compared
// case-insensitively to the product.json `name` field.
const ENRICHED: EnrichedRecord[] = [
  // ─────────────────────────────────────────────────────────────────────────
  // E.H. Taylor Barrel Proof
  // ─────────────────────────────────────────────────────────────────────────
  {
    matchName: "e.h taylor barrel proof",
    slug: "eh-taylor-barrel-proof",
    displayName: "Colonel E.H. Taylor, Jr. Barrel Proof",
    subtitle:
      "Uncut · Unfiltered · Barrel-Proof Kentucky Straight Bourbon · ~131 Proof",
    badge: "Cask Strength",
    sku: "EHT-BP-750",
    description:
      "Colonel E.H. Taylor Barrel Proof is Buffalo Trace's uncut, unfiltered, single-barrel-strength tribute to the man who modernised Kentucky bourbon. Distilled from Mash Bill #1 — a low-rye recipe with no wheat — and bottled straight from select barrels without water or chill filtration, every release runs hot, dense and unapologetically full. Recent batches land around 131 proof (≈65.5% ABV), pouring deep amber and packing layers of dark caramel, toasted oak, baking spice, dried fruit, leather and a long, oak-driven finish. A bourbon for drinkers who want the whiskey exactly as it left the barrel.",
    story:
      "Colonel Edmund Haynes Taylor, Jr. (1830-1923) is the man modern bourbon owes more to than almost anyone — credited with rebuilding the O.F.C. (Old Fashioned Copper) Distillery (today's Buffalo Trace), championing the Bottled-in-Bond Act of 1897, and lobbying for the federal definitions of straight bourbon that still apply today. The Barrel Proof expression honours that legacy in the most uncompromising form possible: hand-selected barrels of mature Kentucky straight bourbon, bottled at full cask strength with nothing added and nothing removed. Each release is hand-numbered and falls slightly differently in proof and character — that's the point.",
    ageYears: null,
    isNAS: true,
    proof: 131,
    abv: 65.5,
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
    productionStyle: "BARREL_PROOF",
    isChillFiltered: false,
    isLimitedEdition: true,
    isAllocated: true,
    nose:
      "Dark caramel, toasted oak, brown sugar, dried fig, leather and a soft hint of clove. Big but never harsh.",
    palate:
      "Rich toffee, espresso, baked cherry, candied pecan, cracked black pepper and cinnamon — full-bodied and viscous, the kind of texture only barrel proof gives you.",
    finish:
      "Long, hot and oak-forward. Dried fruit, dark chocolate, tobacco and lingering vanilla cream that holds for minutes.",
    flavorTags: [
      "barrel proof",
      "uncut",
      "unfiltered",
      "cask strength",
      "dark caramel",
      "toasted oak",
      "leather",
      "dark chocolate",
      "dried fig",
      "espresso",
      "baking spice",
      "Kentucky straight bourbon",
      "Buffalo Trace",
      "single barrel character",
      "allocated bourbon",
    ],
    servingSuggestion:
      "Pour 1.5 oz neat into a Glencairn at room temperature. A few drops of spring water lift the nose without dulling the depth. This is a sipping pour — too much character to mix.",
    foodPairings:
      "Dark-chocolate truffles, espresso, smoked brisket, aged sharp cheddar, pecan pie and grilled ribeye.",
    stockBottles: 24,
    stockCases: 0,
    availability: "ALLOCATED",
    rating: 4.8,
    reviewCount: 132,
    isFeatured: true,
    awards: [
      {
        name: "Double Gold",
        organization: "San Francisco World Spirits Competition",
        year: 2013,
        medal: "Double Gold",
      },
      {
        name: "World's Best Bourbon",
        organization: "World Whiskies Awards",
        year: 2015,
        medal: null,
      },
    ],
    seo: {
      metaTitle:
        "E.H. Taylor Barrel Proof Bourbon — Uncut Cask-Strength Kentucky Straight | ~131 Proof",
      metaDescription:
        "Buy Colonel E.H. Taylor Barrel Proof bourbon — uncut, unfiltered, barrel-strength Kentucky bourbon from Buffalo Trace. ~131 proof, bottle-only allocation.",
      focusKeyword: "eh taylor barrel proof",
      primaryKeywords: [
        "eh taylor barrel proof",
        "e.h. taylor barrel proof",
        "colonel eh taylor barrel proof",
        "buy eh taylor barrel proof",
        "eh taylor barrel proof for sale",
        "eh taylor barrel proof price",
        "eh taylor cask strength",
      ],
      secondaryKeywords: [
        "buffalo trace barrel proof bourbon",
        "uncut unfiltered bourbon",
        "barrel proof kentucky bourbon",
        "cask strength bourbon",
        "eh taylor lineup",
        "bottled in bond bourbon",
        "allocated bourbon",
        "high proof bourbon",
      ],
      longTailKeywords: [
        "where to buy eh taylor barrel proof online",
        "eh taylor barrel proof vs george t stagg",
        "eh taylor barrel proof vs stagg jr",
        "eh taylor barrel proof tasting notes",
        "eh taylor barrel proof batch list",
        "eh taylor barrel proof msrp vs secondary",
        "eh taylor barrel proof review",
        "is eh taylor barrel proof allocated",
      ],
      wordClusters: [
        {
          cluster: "Brand & Heritage",
          terms: [
            "Colonel E.H. Taylor",
            "Edmund Haynes Taylor Jr",
            "Buffalo Trace",
            "O.F.C. Distillery",
            "Old Fashioned Copper",
            "Bottled-in-Bond Act 1897",
            "father of the modern bourbon industry",
            "Sazerac",
          ],
        },
        {
          cluster: "Style & Specs",
          terms: [
            "barrel proof bourbon",
            "uncut unfiltered bourbon",
            "cask strength bourbon",
            "131 proof",
            "65.5% ABV",
            "low-rye mash bill",
            "Mash Bill #1",
            "Kentucky straight bourbon",
            "750ml",
            "char level 4",
            "non-chill filtered",
          ],
        },
        {
          cluster: "Tasting Notes",
          terms: [
            "dark caramel",
            "toasted oak",
            "leather",
            "dried fig",
            "espresso",
            "dark chocolate",
            "candied pecan",
            "cracked pepper",
            "cinnamon",
            "tobacco",
            "vanilla cream",
          ],
        },
        {
          cluster: "Scarcity & Collectibility",
          terms: [
            "allocated bourbon",
            "limited release",
            "hand-numbered batch",
            "rare bourbon",
            "secondary market",
            "lottery bourbon",
            "MSRP vs resale",
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
          ],
        },
        {
          cluster: "Comparisons",
          terms: [
            "vs george t stagg",
            "vs stagg jr",
            "vs elijah craig barrel proof",
            "vs eh taylor single barrel",
            "vs eh taylor small batch",
            "vs william larue weller",
            "vs booker's",
          ],
        },
        {
          cluster: "Serving & Pairing",
          terms: [
            "neat",
            "Glencairn",
            "few drops of water",
            "sipping bourbon",
            "dark chocolate",
            "smoked brisket",
            "ribeye",
            "espresso",
            "aged cheddar",
          ],
        },
      ],
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // E.H. Taylor Small Batch
  // ─────────────────────────────────────────────────────────────────────────
  {
    matchName: "e.h taylor small batch",
    slug: "eh-taylor-small-batch",
    displayName: "Colonel E.H. Taylor, Jr. Small Batch",
    subtitle:
      "Bottled-in-Bond · Small Batch · Kentucky Straight Bourbon · 100 Proof",
    badge: "Bottled in Bond",
    sku: "EHT-SB-750",
    description:
      "Colonel E.H. Taylor Small Batch is Bottled-in-Bond Kentucky bourbon the way Colonel Taylor himself helped legislate it — the product of one distillery, one distillation season, aged at least four years in a federally bonded warehouse and bottled at exactly 100 proof. Distilled at Buffalo Trace from the historic Mash Bill #1 and matured in select brick rickhouses, this small-batch expression is a textbook example of classic, refined Kentucky bourbon: vanilla, caramel, soft baking spice, polished oak and a clean, dry finish. Approachable enough to convert a newcomer, deep enough to satisfy a collector.",
    story:
      "When Colonel Edmund Haynes Taylor, Jr. lobbied Congress to pass the Bottled-in-Bond Act of 1897, his goal was simple: a federally guaranteed mark of authenticity for American whiskey, in a time when the market was flooded with adulterated spirit. More than a century later, Buffalo Trace honours that legacy by producing the Small Batch in strict accordance with those original rules — one distillery, one season, four years minimum in a bonded warehouse, bottled at 100 proof. It is, in spirit and in law, exactly what Taylor wanted American bourbon to taste like.",
    ageYears: 7,
    isNAS: false,
    proof: 100,
    abv: 50,
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
    productionStyle: "BOTTLED_IN_BOND",
    isChillFiltered: true,
    isLimitedEdition: false,
    isAllocated: true,
    nose:
      "Soft vanilla, butter caramel, baked apple, toasted oak and a whisper of mint — clean, polished and unmistakably classic.",
    palate:
      "Honey, light caramel, baked pear, brown sugar, a hint of black pepper and gentle oak tannin. Medium-bodied with the structure that 100 proof gives you.",
    finish:
      "Medium, dry and elegant. Vanilla cream, toasted oak, soft spice and a clean, oak-led fade.",
    flavorTags: [
      "bottled in bond",
      "small batch",
      "100 proof",
      "vanilla",
      "caramel",
      "baked apple",
      "honey",
      "brown sugar",
      "black pepper",
      "toasted oak",
      "Kentucky straight bourbon",
      "Buffalo Trace",
      "classic bourbon",
      "allocated bourbon",
    ],
    servingSuggestion:
      "Outstanding neat in a Glencairn, beautifully balanced over a single large ice cube, and a near-perfect base for a classic old-fashioned or Manhattan thanks to that 100-proof structure.",
    foodPairings:
      "Roast pork, smoked salmon, apple pie, aged Gouda, dark chocolate and pecan-crusted dishes.",
    stockBottles: 60,
    stockCases: 0,
    availability: "ALLOCATED",
    rating: 4.7,
    reviewCount: 218,
    isFeatured: true,
    awards: [
      {
        name: "Gold Medal",
        organization: "San Francisco World Spirits Competition",
        year: 2014,
        medal: "Gold",
      },
      {
        name: "Best Bourbon",
        organization: "World Whiskies Awards",
        year: 2013,
        medal: null,
      },
    ],
    seo: {
      metaTitle:
        "E.H. Taylor Small Batch Bourbon — Bottled-in-Bond Kentucky Straight | 100 Proof",
      metaDescription:
        "Buy Colonel E.H. Taylor Small Batch — Bottled-in-Bond Kentucky straight bourbon from Buffalo Trace, the way Colonel Taylor legislated it. 100 proof, bottle-only.",
      focusKeyword: "eh taylor small batch",
      primaryKeywords: [
        "eh taylor small batch",
        "e.h. taylor small batch",
        "colonel eh taylor small batch",
        "buy eh taylor small batch",
        "eh taylor small batch for sale",
        "eh taylor small batch price",
        "eh taylor bottled in bond",
      ],
      secondaryKeywords: [
        "buffalo trace small batch bourbon",
        "bottled in bond bourbon",
        "100 proof kentucky bourbon",
        "small batch bourbon",
        "eh taylor lineup",
        "classic kentucky bourbon",
        "allocated bourbon",
        "old fashioned bourbon",
      ],
      longTailKeywords: [
        "where to buy eh taylor small batch online",
        "eh taylor small batch vs single barrel",
        "eh taylor small batch vs barrel proof",
        "eh taylor small batch tasting notes",
        "eh taylor small batch review",
        "is eh taylor small batch good for old fashioned",
        "eh taylor small batch age",
        "eh taylor small batch msrp",
      ],
      wordClusters: [
        {
          cluster: "Brand & Heritage",
          terms: [
            "Colonel E.H. Taylor",
            "Edmund Haynes Taylor Jr",
            "Buffalo Trace",
            "Bottled-in-Bond Act 1897",
            "O.F.C. Distillery",
            "father of the modern bourbon industry",
            "Sazerac",
          ],
        },
        {
          cluster: "Style & Specs",
          terms: [
            "small batch bourbon",
            "bottled in bond",
            "100 proof",
            "50% ABV",
            "Kentucky straight bourbon",
            "low-rye mash bill",
            "Mash Bill #1",
            "char level 4",
            "750ml",
            "minimum four years in bonded warehouse",
          ],
        },
        {
          cluster: "Tasting Notes",
          terms: [
            "vanilla",
            "caramel",
            "baked apple",
            "honey",
            "brown sugar",
            "black pepper",
            "toasted oak",
            "mint",
            "baked pear",
            "vanilla cream",
          ],
        },
        {
          cluster: "Scarcity & Collectibility",
          terms: [
            "allocated bourbon",
            "limited shelf availability",
            "secondary market",
            "MSRP vs resale",
            "annual release",
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
            "where to buy",
          ],
        },
        {
          cluster: "Comparisons",
          terms: [
            "vs eh taylor single barrel",
            "vs eh taylor barrel proof",
            "vs henry mckenna 10 bib",
            "vs old grand-dad bonded",
            "vs four roses small batch",
            "vs buffalo trace",
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
            "apple pie",
            "aged Gouda",
            "smoked salmon",
            "dark chocolate",
          ],
        },
        {
          cluster: "Cocktail Culture",
          terms: [
            "best bourbon for old fashioned",
            "bonded bourbon cocktails",
            "100 proof cocktail base",
            "bartender bourbon",
            "classic Manhattan whiskey",
          ],
        },
      ],
    },
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Colonel E.H. Taylor Jr. Single Barrel
  // ─────────────────────────────────────────────────────────────────────────
  {
    matchName: "colonel e.h taylor jr",
    slug: "eh-taylor-single-barrel",
    displayName: "Colonel E.H. Taylor, Jr. Single Barrel",
    subtitle:
      "Bottled-in-Bond · Single Barrel · Kentucky Straight Bourbon · 100 Proof",
    badge: "Single Barrel · Bottled in Bond",
    sku: "EHT-SiB-750",
    description:
      "Colonel E.H. Taylor Single Barrel is the most personal expression in the Taylor lineup — Bottled-in-Bond Kentucky straight bourbon from a single, hand-selected barrel matured in the historic Warehouse C built by Colonel Taylor himself in 1881. Distilled at Buffalo Trace from Mash Bill #1, aged at least four years in a federally bonded warehouse (in practice usually 9-10+ years), and bottled at exactly 100 proof. Because every release comes from one barrel rather than a blend, no two bottles taste exactly alike — but the signature is unmistakable: caramel, vanilla, baked spice, polished oak and a long, refined finish that holds for minutes.",
    story:
      "Warehouse C was finished by Colonel E.H. Taylor, Jr. in 1881 and immediately recognised as a marvel of brick-and-iron design — so much so that Taylor lobbied for it to be the first warehouse certified as a federally bonded facility under the Bottled-in-Bond Act he later championed. More than 140 years on, Buffalo Trace still pulls the Single Barrel exclusively from that very warehouse. Each barrel is hand-tasted, hand-selected and bottled individually at the legal Bottled-in-Bond standard — 100 proof, one distillery, one distillation season, at least four years in a bonded warehouse. The result is a one-barrel-at-a-time American whiskey that wears its history on every label.",
    ageYears: 10,
    isNAS: false,
    proof: 100,
    abv: 50,
    bottleSizeMl: 750,
    cornPercent: 75,
    ryePercent: 10,
    wheatPercent: null,
    maltedBarleyPct: 15,
    distillery: "Buffalo Trace Distillery",
    region: "Kentucky",
    state: "KY",
    masterDistiller: "Harlen Wheatley",
    caskType: "New Charred American White Oak — aged in Warehouse C (built 1881)",
    charLevel: 4,
    barrelNumber: "Single barrel, hand-selected from Warehouse C",
    releaseYear: null,
    productionStyle: "SINGLE_BARREL",
    isChillFiltered: true,
    isLimitedEdition: true,
    isAllocated: true,
    nose:
      "Caramel, vanilla bean, toasted oak, baked cherry, soft leather and a hint of orange peel — refined and unmistakably mature.",
    palate:
      "Honeyed caramel, vanilla cream, baked cherry, cinnamon, brown sugar and a polished oak spine. Silky on entry, structured through the mid-palate.",
    finish:
      "Long, warm and elegant. Toasted oak, dried fruit, baking spice and a clean vanilla fade.",
    flavorTags: [
      "single barrel",
      "bottled in bond",
      "100 proof",
      "vanilla bean",
      "caramel",
      "baked cherry",
      "leather",
      "orange peel",
      "cinnamon",
      "brown sugar",
      "toasted oak",
      "Kentucky straight bourbon",
      "Buffalo Trace",
      "Warehouse C",
      "allocated bourbon",
    ],
    servingSuggestion:
      "Serve 1.5 oz neat in a Glencairn at room temperature, or over a single large ice cube. The 100-proof BiB structure also makes for an exceptional, fully-loaded old-fashioned — but the single-barrel character truly sings neat.",
    foodPairings:
      "Aged cheddar, dark-chocolate truffles, pecan pie, smoked brisket, cherry cobbler and grilled lamb.",
    stockBottles: 18,
    stockCases: 0,
    availability: "ALLOCATED",
    rating: 4.8,
    reviewCount: 174,
    isFeatured: true,
    awards: [
      {
        name: "Double Gold",
        organization: "San Francisco World Spirits Competition",
        year: 2018,
        medal: "Double Gold",
      },
      {
        name: "World's Best Bourbon",
        organization: "World Whiskies Awards",
        year: 2017,
        medal: null,
      },
    ],
    seo: {
      metaTitle:
        "E.H. Taylor Single Barrel Bourbon — Bottled-in-Bond Single Barrel from Warehouse C | 100 Proof",
      metaDescription:
        "Buy Colonel E.H. Taylor Single Barrel — Bottled-in-Bond bourbon hand-selected from Warehouse C, the brick rickhouse Colonel Taylor built in 1881. 100 proof, bottle-only.",
      focusKeyword: "eh taylor single barrel",
      primaryKeywords: [
        "eh taylor single barrel",
        "e.h. taylor single barrel",
        "colonel eh taylor single barrel",
        "colonel eh taylor jr",
        "buy eh taylor single barrel",
        "eh taylor single barrel for sale",
        "eh taylor single barrel price",
      ],
      secondaryKeywords: [
        "buffalo trace single barrel bourbon",
        "bottled in bond single barrel",
        "warehouse c bourbon",
        "100 proof single barrel bourbon",
        "eh taylor lineup",
        "hand-selected bourbon",
        "allocated bourbon",
        "kentucky straight bourbon",
      ],
      longTailKeywords: [
        "where to buy eh taylor single barrel online",
        "eh taylor single barrel vs small batch",
        "eh taylor single barrel vs barrel proof",
        "eh taylor single barrel tasting notes",
        "what is warehouse c bourbon",
        "eh taylor single barrel age",
        "eh taylor single barrel msrp vs secondary",
        "eh taylor single barrel review",
      ],
      wordClusters: [
        {
          cluster: "Brand & Heritage",
          terms: [
            "Colonel E.H. Taylor",
            "Edmund Haynes Taylor Jr",
            "Buffalo Trace",
            "Warehouse C",
            "built 1881",
            "Bottled-in-Bond Act 1897",
            "O.F.C. Distillery",
            "father of the modern bourbon industry",
            "Sazerac",
          ],
        },
        {
          cluster: "Style & Specs",
          terms: [
            "single barrel bourbon",
            "bottled in bond",
            "100 proof",
            "50% ABV",
            "Kentucky straight bourbon",
            "low-rye mash bill",
            "Mash Bill #1",
            "char level 4",
            "750ml",
            "hand-selected barrel",
            "Warehouse C aged",
          ],
        },
        {
          cluster: "Tasting Notes",
          terms: [
            "caramel",
            "vanilla bean",
            "baked cherry",
            "soft leather",
            "orange peel",
            "cinnamon",
            "brown sugar",
            "toasted oak",
            "vanilla cream",
            "dried fruit",
          ],
        },
        {
          cluster: "Scarcity & Collectibility",
          terms: [
            "allocated bourbon",
            "single barrel release",
            "hand-selected",
            "Warehouse C exclusive",
            "rare bourbon",
            "secondary market",
            "MSRP vs resale",
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
            "where to buy",
            "allocation",
          ],
        },
        {
          cluster: "Comparisons",
          terms: [
            "vs eh taylor small batch",
            "vs eh taylor barrel proof",
            "vs blanton's",
            "vs eagle rare",
            "vs four roses single barrel",
            "vs henry mckenna 10 bib",
            "vs old forester 1897 bib",
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
            "aged cheddar",
            "dark chocolate",
            "smoked brisket",
            "cherry cobbler",
            "grilled lamb",
          ],
        },
        {
          cluster: "Architectural & Distillery Lore",
          terms: [
            "Warehouse C",
            "brick rickhouse",
            "1881 construction",
            "Frankfort Kentucky",
            "National Historic Landmark",
            "oldest continuously operating distillery",
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
      `No enriched record found for product.json entry "${name}". Add one in ENRICHED[] of import-eh-taylor-lineup.ts.`
    );
  }
  return match;
}

function resolveImagePath(rawPath: string): string {
  // product.json stores either an absolute path or a path relative to the repo
  // root (e.g. "public/tolyer1.jpeg"). Both should resolve correctly here.
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
  console.log(`Found ${minimal.length} E.H. Taylor entries in product.json\n`);

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

    await prisma.product.create({
      data: {
        slug: e.slug,
        name: e.displayName,
        subtitle: e.subtitle,
        description: e.description,
        story: e.story,
        badge: e.badge,
        sku: e.sku,

        // Bottle-only allocation: deliberately leave case fields null.
        bottlePrice: m["price bottle"],
        casePrice: null,
        bottlesPerCase: null,

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
