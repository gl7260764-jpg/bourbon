// Per-product keyword research, mirroring the `seo` block on BLOG_POSTS.
//
// Products live in the database, but this research does not: it's editorial
// work that changes when the SERP changes, not when stock does. Keeping it in
// code means it's reviewable in a diff and can't be clobbered by a routine
// product edit in the admin.
//
// To add a bottle: run the keyword research, add an entry keyed by product
// slug, and the product page picks it up automatically. Products without an
// entry fall back to a formula built from their own fields (see
// buildProductMeta), so nothing breaks while the catalogue is worked through.
//
// Pure data + pure functions only — no prisma, no server imports.

export interface KeywordMetric {
  term: string;
  /** Monthly search volume, US. Null when we only have the term, not data. */
  volume?: number;
  /** Keyword difficulty %, as reported by the keyword tool. */
  kd?: number;
}

export interface WordCluster {
  cluster: string;
  terms: string[];
}

export interface ProductSeo {
  metaTitle: string;
  metaDescription: string;
  focusKeyword: string;
  /**
   * Where the bottle is widely searched under a different name than the one on
   * the label. Fed to schema.org `alternateName` so the mismatch is declared
   * rather than implied.
   */
  alternateName?: string;
  primaryKeywords: KeywordMetric[];
  longTailKeywords: string[];
  wordClusters: WordCluster[];
}

export const PRODUCT_SEO: Record<string, ProductSeo> = {
  // Old Rip Van Winkle 10 Year.
  //
  // The whole strategy here rests on one finding: essentially all the search
  // demand uses "Pappy Van Winkle 10 Year" (2,900/mo) rather than the name on
  // the label, "Old Rip Van Winkle" (every variant under 110/mo). So the title
  // leads with Pappy and keeps Old Rip for accuracy. Average KD across the set
  // is 12% — soft enough to win on on-page work alone.
  "pappy-10": {
    metaTitle: "Pappy Van Winkle 10 Year Price | Old Rip 107 Proof Bourbon",
    metaDescription:
      "Pappy Van Winkle 10 Year (Old Rip Van Winkle) — 107-proof wheated Kentucky bourbon. See current price and availability. Caramel, vanilla, toasted oak.",
    focusKeyword: "pappy van winkle 10 year",
    alternateName: "Pappy Van Winkle 10 Year",
    primaryKeywords: [
      { term: "pappy van winkle 10 year", volume: 2900, kd: 16 },
      { term: "pappy 10 year", volume: 1300, kd: 17 },
      { term: "pappy van winkle 10 year price", volume: 1000, kd: 18 },
      { term: "10 year pappy van winkle", volume: 480, kd: 15 },
      { term: "pappy 10 year price", volume: 390, kd: 15 },
      { term: "pappy van winkle 10 year bourbon", volume: 210, kd: 9 },
      { term: "pappy van winkle bourbon 10 year", volume: 210, kd: 13 },
      { term: "price of pappy van winkle 10 year", volume: 210, kd: 0 },
      { term: "old pappy van winkle 10 year", volume: 140, kd: 11 },
      { term: "10 year old pappy van winkle", volume: 110, kd: 9 },
    ],
    longTailKeywords: [
      "where to buy pappy van winkle 10 year",
      "how much is pappy van winkle 10 year",
      "is old rip van winkle the same as pappy van winkle",
      "old rip van winkle 10 year vs lot b 12 year",
      "what proof is pappy van winkle 10 year",
      "what does pappy van winkle 10 year taste like",
      "pappy van winkle 10 year review",
      "pappy van winkle 10 year for sale",
      "is pappy van winkle 10 year worth it",
      "how to get a bottle of pappy van winkle",
    ],
    wordClusters: [
      {
        cluster: "Price & Availability",
        terms: [
          "pappy van winkle 10 year price",
          "price of pappy van winkle 10 year",
          "pappy 10 year price",
          "pappy van winkle 10 year for sale",
          "buy pappy van winkle online",
          "pappy van winkle msrp",
          "allocated bourbon",
        ],
      },
      {
        cluster: "Spec & Production",
        terms: [
          "107 proof",
          "53.5% ABV",
          "wheated bourbon",
          "wheated mash bill",
          "Kentucky straight bourbon",
          "10 year bourbon",
          "non-chill filtered",
          "hand-bottled",
          "750ml",
        ],
      },
      {
        cluster: "Tasting Profile",
        terms: [
          "caramel",
          "vanilla",
          "honey",
          "brown sugar",
          "toasted oak",
          "baking spice",
          "dried fruit",
          "smooth high proof bourbon",
          "best neat bourbon",
        ],
      },
      {
        cluster: "Van Winkle Family",
        terms: [
          "Old Rip Van Winkle",
          "Van Winkle Special Reserve Lot B",
          "Pappy Van Winkle Family Reserve",
          "Julian Van Winkle",
          "Buffalo Trace",
          "Stitzel-Weller",
        ],
      },
    ],
  },

  // Van Winkle Special Reserve Lot 'B' 12 Year.
  //
  // Same brand-split as pappy-10 but more extreme: the label says "Van Winkle
  // Special Reserve Lot B" and the product h1 contains no "Pappy" at all,
  // while "pappy 12 year" alone is 1,300/mo. "lot b" is still real search
  // language (450 across the set), so the title carries both.
  //
  // Average KD 7% — the softest of the three Pappy sets. "pappy van 12 year"
  // sits at KD 4 with 170/mo, which is close to free traffic.
  "van-winkle-lot-b-12-year": {
    metaTitle: "Pappy Van Winkle 12 Year Lot B Price | 90.4 Proof Bourbon",
    metaDescription:
      "Pappy Van Winkle 12 Year — Van Winkle Special Reserve Lot 'B', 90.4-proof wheated bourbon. Current price, MSRP and availability. Vanilla, caramel, cherry.",
    focusKeyword: "pappy 12 year",
    alternateName: "Pappy Van Winkle 12 Year",
    primaryKeywords: [
      { term: "pappy 12 year", volume: 1300, kd: 10 },
      { term: "pappy 12", volume: 590, kd: 11 },
      { term: "pappy 12 year lot b", volume: 210, kd: 7 },
      { term: "pappy 12 yr", volume: 170, kd: 8 },
      { term: "pappy van 12 year", volume: 170, kd: 4 },
      { term: "pappy 12 year msrp", volume: 140, kd: 15 },
      { term: "pappy 12 year price", volume: 140, kd: 6 },
      { term: "12 yr pappy", volume: 110, kd: 7 },
      { term: "pappy lot b 12 year", volume: 90, kd: 8 },
      { term: "pappy vanwinkle 12 year", volume: 90 },
    ],
    longTailKeywords: [
      "where to buy pappy van winkle 12 year",
      "pappy van winkle lot b msrp",
      "how much is pappy 12 year",
      "van winkle special reserve lot b 12 year price",
      "pappy 12 year vs 15 year",
      "old rip van winkle 10 year vs lot b 12 year",
      "what does lot b mean pappy",
      "is lot b the same as pappy van winkle",
      "pappy van winkle 12 year review",
      "pappy 12 year for sale",
    ],
    wordClusters: [
      {
        cluster: "Price & MSRP",
        terms: [
          "pappy 12 year price",
          "pappy 12 year msrp",
          "van winkle lot b msrp",
          "pappy 12 year for sale",
          "allocated bourbon",
          "buy pappy van winkle online",
        ],
      },
      {
        cluster: "Lot B Naming",
        terms: [
          "lot b",
          "lot 'b'",
          "van winkle special reserve",
          "special reserve lot b",
          "pappy lot b",
          "van winkle 12",
        ],
      },
      {
        cluster: "Spec & Production",
        terms: [
          "90.4 proof",
          "45.2% ABV",
          "wheated bourbon",
          "12 year bourbon",
          "Kentucky straight bourbon",
          "non-chill filtered",
          "750ml",
        ],
      },
      {
        cluster: "Tasting Profile",
        terms: [
          "vanilla",
          "caramel",
          "honey",
          "butterscotch",
          "dark cherry",
          "baking spice",
          "toasted oak",
          "smooth wheated bourbon",
        ],
      },
    ],
  },

  // Pappy Van Winkle Family Reserve 15 Year.
  //
  // Here the brand name is right, but the demand is for the SHORT form:
  // "pappy 15" and "pappy 15 year" are 1,600/mo each, while the product name
  // splits the phrase with "Family Reserve" so the exact string never appears.
  // MSRP is unusually strong for this bottle (320 across the set, on top of
  // 720 for price), so both words go in the title.
  "pappy-van-winkle-15-year": {
    metaTitle: "Pappy Van Winkle 15 Year Price & MSRP | 107 Proof Bourbon",
    metaDescription:
      "Pappy Van Winkle 15 Year Family Reserve — 107-proof wheated Kentucky bourbon. Current price, MSRP and availability. Vanilla, caramel, dark fruit, toasted oak.",
    focusKeyword: "pappy 15 year",
    alternateName: "Pappy Van Winkle 15 Year",
    primaryKeywords: [
      { term: "pappy 15", volume: 1600, kd: 16 },
      { term: "pappy 15 year", volume: 1600, kd: 17 },
      { term: "pappy 15 year price", volume: 590, kd: 11 },
      { term: "pappy van 15 year", volume: 590, kd: 23 },
      { term: "pappy 15 yr", volume: 260, kd: 21 },
      { term: "pappy van 15", volume: 260, kd: 15 },
      { term: "pappy 15 msrp", volume: 140, kd: 19 },
      { term: "15 year pappy", volume: 90, kd: 14 },
      { term: "pappy 15 year msrp", volume: 90, kd: 15 },
      { term: "pappy 15 bourbon", volume: 50, kd: 20 },
    ],
    longTailKeywords: [
      "where to buy pappy van winkle 15 year",
      "how much is pappy 15 year",
      "pappy van winkle 15 year msrp",
      "pappy 15 year vs 20 year",
      "pappy 15 year vs 12 year",
      "what does pappy 15 taste like",
      "pappy van winkle 15 year review",
      "pappy 15 year for sale",
      "is pappy 15 worth the price",
      "pappy van winkle family reserve 15 year 2023",
    ],
    wordClusters: [
      {
        cluster: "Price & MSRP",
        terms: [
          "pappy 15 year price",
          "pappy 15 msrp",
          "pappy 15 year msrp",
          "pappy 15 year for sale",
          "pappy van winkle retail price",
          "allocated bourbon",
        ],
      },
      {
        cluster: "Family Reserve & Vintage",
        terms: [
          "Family Reserve",
          "Pappy Van Winkle Family Reserve",
          "2023 release",
          "2022 release",
          "vintage bourbon release",
          "Julian Van Winkle",
        ],
      },
      {
        cluster: "Spec & Production",
        terms: [
          "107 proof",
          "53.5% ABV",
          "wheated bourbon",
          "15 year bourbon",
          "Kentucky straight bourbon",
          "non-chill filtered",
          "750ml",
        ],
      },
      {
        cluster: "Tasting Profile",
        terms: [
          "vanilla",
          "caramel",
          "butterscotch",
          "brown sugar",
          "dark fruit",
          "leather",
          "dark chocolate",
          "toasted oak",
          "baking spice",
        ],
      },
    ],
  },

  // Pappy Van Winkle Family Reserve 20 Year.
  //
  // NOTE ON DATA: no keyword-tool export for this bottle yet, so `volume` and
  // `kd` are deliberately absent rather than guessed. The term list itself is
  // not a guess — the 10/12/15 exports show an identical morphology every
  // time ("pappy N", "pappy N year", "pappy N year price", "pappy van N
  // year", "pappy N msrp", "N year pappy", "pappy N yr"), so the shape
  // transfers with confidence even though the numbers don't. Fill in volumes
  // when the export lands.
  //
  // Same phrase-splitting problem as the 15: "Family Reserve" sits between
  // "Pappy Van Winkle" and "20 Year", so the searched string never appears.
  "pappy-van-winkle-20-year": {
    metaTitle: "Pappy Van Winkle 20 Year Price & MSRP | 90.4 Proof Bourbon",
    metaDescription:
      "Pappy Van Winkle 20 Year Family Reserve — 90.4-proof wheated bourbon. Current price, MSRP and allocation status. Dark caramel, fig, leather, espresso.",
    focusKeyword: "pappy 20 year",
    alternateName: "Pappy Van Winkle 20 Year",
    primaryKeywords: [
      { term: "pappy 20 year" },
      { term: "pappy 20" },
      { term: "pappy 20 year price" },
      { term: "pappy van 20 year" },
      { term: "pappy 20 yr" },
      { term: "pappy van 20" },
      { term: "pappy 20 msrp" },
      { term: "pappy 20 year msrp" },
      { term: "20 year pappy" },
      { term: "pappy 20 year bourbon" },
    ],
    longTailKeywords: [
      "where to buy pappy van winkle 20 year",
      "pappy van winkle 20 year msrp",
      "how much is pappy 20 year",
      "pappy 20 year vs 23 year",
      "pappy 20 year vs 15 year",
      "what does pappy 20 taste like",
      "pappy van winkle 20 year review",
      "pappy 20 year for sale",
      "is pappy 20 year worth it",
      "pappy van winkle 20 year allocation",
    ],
    wordClusters: [
      {
        cluster: "Price & MSRP",
        terms: [
          "pappy 20 year price",
          "pappy 20 msrp",
          "pappy van winkle 20 year retail price",
          "pappy 20 year for sale",
          "allocated bourbon",
          "bourbon lottery",
        ],
      },
      {
        cluster: "Spec & Production",
        terms: [
          "90.4 proof",
          "45.2% ABV",
          "wheated bourbon",
          "20 year bourbon",
          "Kentucky straight bourbon",
          "non-chill filtered",
          "750ml",
        ],
      },
      {
        cluster: "Tasting Profile",
        terms: [
          "deep oak",
          "dark caramel",
          "leather",
          "dried fruit",
          "fig",
          "prune",
          "dark chocolate",
          "espresso",
          "baking spice",
        ],
      },
      {
        cluster: "Scarcity & Allocation",
        terms: [
          "allocated bourbon",
          "annual fall release",
          "limited release",
          "bourbon lottery",
          "collectible bourbon",
          "hard to find bourbon",
        ],
      },
    ],
  },

  // Pappy Van Winkle Family Reserve 23 Year.
  //
  // Volumes pending an export — same note as the 20 Year above.
  //
  // Deliberately NOT targeting the "23 year decanter" / "Family Selection"
  // terms. That's a different bottle we don't stock, and pulling in searches
  // for it would buy bounces, not orders. Worth a separate page if it's ever
  // carried — the decanter has its own real demand.
  "pappy-van-winkle-23-year": {
    metaTitle: "Pappy Van Winkle 23 Year Price & MSRP | 95.6 Proof Bourbon",
    metaDescription:
      "Pappy Van Winkle 23 Year Family Reserve — 95.6-proof wheated bourbon, the oldest in the range. Current price, MSRP and allocation. Fig, tobacco, espresso.",
    focusKeyword: "pappy 23 year",
    alternateName: "Pappy Van Winkle 23 Year",
    primaryKeywords: [
      { term: "pappy 23 year" },
      { term: "pappy 23" },
      { term: "pappy 23 year price" },
      { term: "pappy van 23 year" },
      { term: "pappy 23 yr" },
      { term: "pappy van 23" },
      { term: "pappy 23 msrp" },
      { term: "pappy 23 year msrp" },
      { term: "23 year pappy" },
      { term: "pappy 23 year bourbon" },
    ],
    longTailKeywords: [
      "where to buy pappy van winkle 23 year",
      "pappy van winkle 23 year msrp",
      "how much is pappy 23 year",
      "pappy 23 year vs 20 year",
      "what does pappy 23 taste like",
      "pappy van winkle 23 year review",
      "pappy 23 year for sale",
      "why is pappy 23 so expensive",
      "oldest pappy van winkle bourbon",
      "pappy van winkle 23 year allocation",
    ],
    wordClusters: [
      {
        cluster: "Price & MSRP",
        terms: [
          "pappy 23 year price",
          "pappy 23 msrp",
          "pappy van winkle 23 year retail price",
          "pappy 23 year for sale",
          "allocated bourbon",
          "bourbon lottery",
        ],
      },
      {
        cluster: "Spec & Production",
        terms: [
          "95.6 proof",
          "47.8% ABV",
          "wheated bourbon",
          "23 year bourbon",
          "oldest Pappy",
          "Kentucky straight bourbon",
          "non-chill filtered",
          "750ml",
        ],
      },
      {
        cluster: "Tasting Profile",
        terms: [
          "deep oak",
          "dark caramel",
          "fig",
          "dried plums",
          "leather",
          "tobacco",
          "dark chocolate",
          "espresso",
          "fruitcake",
        ],
      },
      {
        cluster: "Scarcity & Collectibility",
        terms: [
          "allocated bourbon",
          "collectible bourbon",
          "bourbon lottery",
          "rarest bourbon",
          "secondary market bourbon",
          "auction bourbon",
        ],
      },
    ],
  },
};

export function getProductSeo(slug: string): ProductSeo | undefined {
  return PRODUCT_SEO[slug];
}

/** Trim at a word boundary so meta text never cuts mid-word. */
function trimAtWord(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > 0 ? cut.slice(0, lastSpace) : cut).trim() + "…";
}

export interface ProductMetaInput {
  slug: string;
  name: string;
  subtitle: string | null;
  proof: string;
  ageYears: number | null;
  category: string;
}

export interface ProductMeta {
  title: string;
  description: string;
  keywords?: string[];
  alternateName?: string;
}

/**
 * Researched copy when we have it, otherwise a formula built from the
 * product's own fields. The fallback deliberately copies the title pattern
 * used by the retailers that outrank us — name, proof, then buying intent —
 * so untouched products still beat a bare "<name> | Bourbon & Oak".
 */
export function buildProductMeta(p: ProductMetaInput): ProductMeta {
  const seo = getProductSeo(p.slug);

  if (seo) {
    return {
      title: seo.metaTitle,
      description: seo.metaDescription,
      // Note: Google has ignored meta keywords since 2009. Emitted because
      // some internal tooling and non-Google engines still read it — the
      // ranking work is done by the title, description and JSON-LD.
      // Deduped — the focus keyword is normally also the top primary term,
      // and a repeated keyword is the oldest spam signal there is.
      keywords: [
        ...new Set([
          seo.focusKeyword,
          ...seo.primaryKeywords.map((k) => k.term),
          ...seo.longTailKeywords,
        ]),
      ],
      alternateName: seo.alternateName,
    };
  }

  const age = p.ageYears ? `${p.ageYears} Year ` : "";
  const title = trimAtWord(
    `${p.name} | ${p.proof} Proof | Buy Online`,
    64,
  );
  const description = trimAtWord(
    p.subtitle?.trim()
      ? `${p.subtitle.trim()} Buy ${p.name} online — see current price and availability. Ships from our Bardstown cellar.`
      : `Buy ${p.name} online — ${age}Kentucky bourbon at ${p.proof} proof. See current price, tasting notes and availability. Ships from our Bardstown cellar.`,
    158,
  );

  return { title, description };
}
