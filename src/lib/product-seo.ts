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

/**
 * Builds the standard four-cluster shape every bottle shares — price/MSRP,
 * spec, tasting, scarcity — from the handful of values that actually differ.
 *
 * The Pappy entries below are written out longhand because they carry real
 * keyword-tool volumes. The rest use this: the term lists are researched, but
 * the surrounding structure is identical for every bottle and there is no
 * reason to repeat it twenty-two times.
 */
function bottleSeo(input: {
  metaTitle: string;
  metaDescription: string;
  focusKeyword: string;
  alternateName?: string;
  /** Head terms, in rough demand order. Volumes unknown — see the note above. */
  primary: string[];
  longTail: string[];
  /** e.g. "107 proof", "53.5% ABV", "wheated bourbon", "bottled in bond" */
  spec: string[];
  tasting: string[];
  /** Anything bottle-specific: a collection, a vintage, a former name. */
  extraClusters?: WordCluster[];
}): ProductSeo {
  const buyTerms = [
    `${input.focusKeyword} price`,
    `${input.focusKeyword} for sale`,
    `buy ${input.focusKeyword} online`,
    `${input.focusKeyword} msrp`,
    "where to buy allocated bourbon",
    "allocated bourbon",
  ];

  return {
    metaTitle: input.metaTitle,
    metaDescription: input.metaDescription,
    focusKeyword: input.focusKeyword,
    ...(input.alternateName ? { alternateName: input.alternateName } : {}),
    primaryKeywords: input.primary.map((term) => ({ term })),
    longTailKeywords: input.longTail,
    wordClusters: [
      { cluster: "Price & Availability", terms: buyTerms },
      { cluster: "Spec & Production", terms: input.spec },
      { cluster: "Tasting Profile", terms: input.tasting },
      ...(input.extraClusters ?? []),
    ],
  };
}

// Shared cluster for the four Buffalo Trace Antique Collection bottles in the
// catalogue. "BTAC" is its own annual search event every autumn.
const BTAC_CLUSTER: WordCluster = {
  cluster: "Buffalo Trace Antique Collection",
  terms: [
    "BTAC",
    "Buffalo Trace Antique Collection",
    "BTAC 2025",
    "BTAC lineup",
    "antique collection bourbon",
    "Buffalo Trace allocated",
  ],
};

export const PRODUCT_SEO: Record<string, ProductSeo> = {
  // --- Eagle Rare ---------------------------------------------------------
  // Names match search language closely here, so the work is intent modifiers
  // (price / buy / msrp) rather than fixing a naming mismatch.
  "eagle-rare-10-year": bottleSeo({
    metaTitle: "Eagle Rare 10 Year Price & MSRP | 90 Proof Bourbon",
    metaDescription:
      "Eagle Rare 10 Year Kentucky straight bourbon, 90 proof. Current price, MSRP and availability. Toffee, orange peel, oak and a long dry finish.",
    focusKeyword: "eagle rare 10 year",
    primary: ["eagle rare 10 year", "eagle rare", "eagle rare bourbon", "eagle rare 10", "eagle rare 10 year price", "eagle rare msrp", "eagle rare single barrel", "eagle rare 10 year bourbon"],
    longTail: ["where to buy eagle rare 10 year", "how much is eagle rare 10 year", "eagle rare 10 year msrp", "is eagle rare hard to find", "eagle rare vs buffalo trace", "eagle rare 10 year review", "what does eagle rare taste like", "eagle rare 10 year for sale"],
    spec: ["90 proof", "45% ABV", "10 year bourbon", "Kentucky straight bourbon", "single barrel", "Buffalo Trace", "750ml"],
    tasting: ["toffee", "candied almond", "orange peel", "oak", "leather", "dry finish", "smooth sipping bourbon"],
  }),

  "eagle-rare-12-year": bottleSeo({
    metaTitle: "Eagle Rare 12 Year Price | 101 Proof Kentucky Bourbon",
    metaDescription:
      "Eagle Rare 12 Year, 101-proof Kentucky straight bourbon. Current price and availability. Deeper oak and spice than the 10 Year — an allocated release.",
    focusKeyword: "eagle rare 12 year",
    primary: ["eagle rare 12 year", "eagle rare 12", "eagle rare 12 year price", "eagle rare 101 proof", "eagle rare 12 year bourbon", "new eagle rare 12"],
    longTail: ["eagle rare 12 year vs 10 year", "where to buy eagle rare 12 year", "eagle rare 12 year msrp", "is eagle rare 12 worth it", "eagle rare 12 year release date", "eagle rare 12 year review"],
    spec: ["101 proof", "50.5% ABV", "12 year bourbon", "Kentucky straight bourbon", "Buffalo Trace", "750ml"],
    tasting: ["dark caramel", "toasted oak", "baking spice", "dried fruit", "long finish"],
  }),

  "eagle-rare-17-year": bottleSeo({
    metaTitle: "Eagle Rare 17 Year (BTAC) Price | 101 Proof Bourbon",
    metaDescription:
      "Eagle Rare 17 Year — Buffalo Trace Antique Collection, 101 proof. Current price and allocation status. Deep oak, leather, tobacco and dark caramel.",
    focusKeyword: "eagle rare 17 year",
    alternateName: "Eagle Rare 17",
    primary: ["eagle rare 17 year", "eagle rare 17", "eagle rare 17 year price", "eagle rare 17 btac", "eagle rare antique collection", "eagle rare 17 year 2025"],
    longTail: ["where to buy eagle rare 17 year", "eagle rare 17 year msrp", "how much is eagle rare 17", "eagle rare 17 vs george t stagg", "btac 2025 lineup", "eagle rare 17 year review", "is eagle rare 17 worth the price"],
    spec: ["101 proof", "50.5% ABV", "17 year bourbon", "Kentucky straight bourbon", "Buffalo Trace Antique Collection", "750ml"],
    tasting: ["deep oak", "leather", "tobacco", "dark caramel", "dried cherry", "long dry finish"],
    extraClusters: [BTAC_CLUSTER],
  }),

  "double-eagle-very-rare": bottleSeo({
    metaTitle: "Double Eagle Very Rare 20 Year Price | 90 Proof Bourbon",
    metaDescription:
      "Double Eagle Very Rare 20 Year in its crystal decanter, 90 proof. Current price and allocation. One of the rarest bottles Buffalo Trace releases.",
    focusKeyword: "double eagle very rare",
    alternateName: "Double Eagle Very Rare 20 Year",
    primary: ["double eagle very rare", "double eagle very rare 20 year", "double eagle very rare price", "devr bourbon", "double eagle very rare 2025", "eagle rare 20 year"],
    longTail: ["how much is double eagle very rare", "where to buy double eagle very rare", "double eagle very rare msrp", "double eagle very rare decanter", "is double eagle very rare worth it", "double eagle very rare review"],
    spec: ["90 proof", "45% ABV", "20 year bourbon", "crystal decanter", "Kentucky straight bourbon", "Buffalo Trace", "750ml"],
    tasting: ["deep oak", "dark caramel", "leather", "tobacco", "dried fig", "espresso"],
    extraClusters: [
      { cluster: "Collectibility", terms: ["collectible bourbon", "rarest bourbon", "bourbon auction", "crystal decanter bourbon", "secondary market bourbon"] },
    ],
  }),

  // --- Weller -------------------------------------------------------------
  // "Weller" alone carries most of the demand; the W.L. prefix is optional in
  // how people type it, so both forms appear in the term lists.
  "weller-12-year": bottleSeo({
    metaTitle: "Weller 12 Year Price & MSRP | 90 Proof Wheated Bourbon",
    metaDescription:
      "W.L. Weller 12 Year wheated Kentucky bourbon, 90 proof. Current price, MSRP and availability. Honey, vanilla, soft oak — the wheated benchmark.",
    focusKeyword: "weller 12 year",
    alternateName: "W.L. Weller 12 Year",
    primary: ["weller 12 year", "weller 12", "w.l. weller 12 year", "weller 12 year price", "weller 12 msrp", "weller 12 year bourbon", "wl weller 12"],
    longTail: ["where to buy weller 12 year", "how much is weller 12", "weller 12 year msrp", "weller 12 vs pappy 12", "is weller 12 hard to find", "weller 12 year review", "weller 12 year for sale"],
    spec: ["90 proof", "45% ABV", "12 year bourbon", "wheated bourbon", "wheated mash bill", "Kentucky straight bourbon", "Buffalo Trace", "750ml"],
    tasting: ["honey", "vanilla", "caramel", "soft oak", "baking spice", "smooth wheated bourbon"],
    extraClusters: [
      { cluster: "Weller Lineup", terms: ["Weller Special Reserve", "Weller Antique 107", "Weller Full Proof", "Weller Single Barrel", "Weller CYPB", "William Larue Weller", "poor man's pappy"] },
    ],
  }),

  "weller-full-proof": bottleSeo({
    metaTitle: "Weller Full Proof Price | 114 Proof Wheated Bourbon",
    metaDescription:
      "W.L. Weller Full Proof, 114-proof non-chill-filtered wheated bourbon at original barrel-entry proof. Current price and availability.",
    focusKeyword: "weller full proof",
    alternateName: "W.L. Weller Full Proof",
    primary: ["weller full proof", "w.l. weller full proof", "weller full proof price", "weller 114 proof", "weller full proof bourbon", "wl weller full proof"],
    longTail: ["where to buy weller full proof", "weller full proof msrp", "weller full proof vs antique 107", "is weller full proof worth it", "weller full proof review", "weller full proof for sale"],
    spec: ["114 proof", "57% ABV", "barrel entry proof", "non-chill filtered", "wheated bourbon", "Kentucky straight bourbon", "Buffalo Trace", "750ml"],
    tasting: ["caramel", "vanilla", "cherry", "toasted oak", "brown sugar", "bold wheated bourbon"],
  }),

  "weller-single-barrel": bottleSeo({
    metaTitle: "Weller Single Barrel Price | 97 Proof Wheated Bourbon",
    metaDescription:
      "W.L. Weller Single Barrel wheated Kentucky bourbon, 97 proof. Current price and allocation status. Single-barrel character from the Weller mash bill.",
    focusKeyword: "weller single barrel",
    alternateName: "W.L. Weller Single Barrel",
    primary: ["weller single barrel", "w.l. weller single barrel", "weller single barrel price", "weller single barrel bourbon", "weller 97 proof", "wl weller single barrel"],
    longTail: ["where to buy weller single barrel", "weller single barrel msrp", "weller single barrel vs weller 12", "is weller single barrel worth it", "weller single barrel review"],
    spec: ["97 proof", "48.5% ABV", "single barrel", "wheated bourbon", "Kentucky straight bourbon", "Buffalo Trace", "750ml"],
    tasting: ["honey", "vanilla", "caramel", "oak", "soft spice"],
  }),

  "weller-cypb": bottleSeo({
    metaTitle: "Weller CYPB Price | Craft Your Perfect Bourbon 95 Proof",
    metaDescription:
      "Weller CYPB — Craft Your Perfect Bourbon, 95 proof, 8 years, wheated. Current price and allocation status. The spec the public voted for.",
    focusKeyword: "weller cypb",
    alternateName: "Weller Craft Your Perfect Bourbon",
    primary: ["weller cypb", "weller craft your perfect bourbon", "cypb bourbon", "weller cypb price", "w.l. weller cypb", "weller cypb 2025"],
    longTail: ["what does cypb stand for", "where to buy weller cypb", "weller cypb msrp", "weller cypb vs weller 12", "is weller cypb worth it", "weller cypb review"],
    spec: ["95 proof", "47.5% ABV", "8 year bourbon", "wheated bourbon", "non-chill filtered", "Kentucky straight bourbon", "750ml"],
    tasting: ["vanilla", "caramel", "citrus", "light oak", "gentle spice"],
  }),

  "william-larue-weller": bottleSeo({
    metaTitle: "William Larue Weller Price | BTAC Barrel Proof Wheated",
    metaDescription:
      "William Larue Weller — Buffalo Trace Antique Collection, uncut barrel-proof wheated bourbon at 133.6 proof. Current price and allocation status.",
    focusKeyword: "william larue weller",
    alternateName: "WLW",
    primary: ["william larue weller", "wlw bourbon", "william larue weller price", "william larue weller 2025", "wlw btac", "william larue weller barrel proof"],
    longTail: ["where to buy william larue weller", "william larue weller msrp", "how much is william larue weller", "william larue weller vs pappy 15", "btac 2025 lineup", "william larue weller review"],
    spec: ["133.6 proof", "66.8% ABV", "barrel proof", "uncut", "unfiltered", "wheated bourbon", "Buffalo Trace Antique Collection", "750ml"],
    tasting: ["dark caramel", "cherry", "leather", "dark chocolate", "toasted oak", "long hot finish"],
    extraClusters: [BTAC_CLUSTER],
  }),

  // --- E.H. Taylor --------------------------------------------------------
  // Same phrase-splitting problem as Pappy 15: the label says "Colonel E.H.
  // Taylor, Jr. Small Batch", but retailers that rank title it "Colonel E.H.
  // Taylor Small Batch" and searchers type "eh taylor" without the periods.
  // Both punctuation forms are covered.
  "eh-taylor-small-batch": bottleSeo({
    metaTitle: "E.H. Taylor Small Batch Price | Bottled in Bond 100 Proof",
    metaDescription:
      "Colonel E.H. Taylor Small Batch, bottled-in-bond Kentucky bourbon at 100 proof. Current price, MSRP and availability. Caramel, butterscotch, dried fruit.",
    focusKeyword: "eh taylor small batch",
    alternateName: "E.H. Taylor Small Batch",
    primary: ["eh taylor small batch", "e.h. taylor small batch", "colonel eh taylor small batch", "eh taylor small batch price", "eh taylor bourbon", "colonel e.h. taylor", "eh taylor bottled in bond"],
    longTail: ["where to buy eh taylor small batch", "eh taylor small batch msrp", "how much is eh taylor small batch", "eh taylor small batch vs single barrel", "what does bottled in bond mean", "eh taylor small batch review", "is eh taylor small batch worth it"],
    spec: ["100 proof", "50% ABV", "bottled in bond", "small batch", "Kentucky straight bourbon", "Buffalo Trace", "750ml"],
    tasting: ["caramel", "butterscotch", "dried fruit", "salted caramel", "orange", "oak"],
    extraClusters: [
      { cluster: "E.H. Taylor Lineup", terms: ["E.H. Taylor Single Barrel", "E.H. Taylor Barrel Proof", "E.H. Taylor Small Batch", "Colonel E.H. Taylor Jr", "bottled in bond bourbon"] },
    ],
  }),

  "eh-taylor-single-barrel": bottleSeo({
    metaTitle: "E.H. Taylor Single Barrel Price | Bottled in Bond 100 Proof",
    metaDescription:
      "Colonel E.H. Taylor Single Barrel, bottled-in-bond Kentucky bourbon at 100 proof. Current price and allocation status. Single-barrel depth and oak spice.",
    focusKeyword: "eh taylor single barrel",
    alternateName: "E.H. Taylor Single Barrel",
    primary: ["eh taylor single barrel", "e.h. taylor single barrel", "colonel eh taylor single barrel", "eh taylor single barrel price", "eh taylor single barrel bourbon"],
    longTail: ["where to buy eh taylor single barrel", "eh taylor single barrel msrp", "eh taylor single barrel vs small batch", "is eh taylor single barrel worth it", "eh taylor single barrel review"],
    spec: ["100 proof", "50% ABV", "bottled in bond", "single barrel", "10 year bourbon", "Kentucky straight bourbon", "Buffalo Trace", "750ml"],
    tasting: ["caramel", "vanilla", "oak spice", "dark fruit", "tobacco", "long finish"],
    extraClusters: [
      { cluster: "E.H. Taylor Lineup", terms: ["E.H. Taylor Small Batch", "E.H. Taylor Barrel Proof", "Colonel E.H. Taylor Jr", "bottled in bond bourbon"] },
    ],
  }),

  "eh-taylor-barrel-proof": bottleSeo({
    metaTitle: "E.H. Taylor Barrel Proof Price | Uncut 131 Proof Bourbon",
    metaDescription:
      "Colonel E.H. Taylor Barrel Proof — uncut, unfiltered Kentucky bourbon at ~131 proof. Current price and allocation status. Intense caramel, oak and spice.",
    focusKeyword: "eh taylor barrel proof",
    alternateName: "E.H. Taylor Barrel Proof",
    primary: ["eh taylor barrel proof", "e.h. taylor barrel proof", "colonel eh taylor barrel proof", "eh taylor barrel proof price", "eh taylor uncut unfiltered"],
    longTail: ["where to buy eh taylor barrel proof", "eh taylor barrel proof msrp", "eh taylor barrel proof vs stagg", "what proof is eh taylor barrel proof", "eh taylor barrel proof review"],
    spec: ["131 proof", "65.5% ABV", "barrel proof", "uncut", "unfiltered", "Kentucky straight bourbon", "Buffalo Trace", "750ml"],
    tasting: ["intense caramel", "oak", "baking spice", "dark cherry", "leather", "hot finish"],
    extraClusters: [
      { cluster: "E.H. Taylor Lineup", terms: ["E.H. Taylor Small Batch", "E.H. Taylor Single Barrel", "Colonel E.H. Taylor Jr", "barrel proof bourbon"] },
    ],
  }),

  // --- Blanton's ----------------------------------------------------------
  // The apostrophe is the whole story: people type "blantons" far more often
  // than "blanton's", so both spellings are targeted.
  "blantons-original-single-barrel": bottleSeo({
    metaTitle: "Blanton's Original Single Barrel Price | 93 Proof Bourbon",
    metaDescription:
      "Blanton's Original Single Barrel — the original single barrel bourbon, 93 proof, with the collectible horse stopper. Current price and availability.",
    focusKeyword: "blantons original single barrel",
    alternateName: "Blanton's Single Barrel Bourbon",
    primary: ["blantons original single barrel", "blanton's single barrel", "blantons bourbon", "blantons original", "blantons price", "blanton's original single barrel", "blantons single barrel bourbon"],
    longTail: ["where to buy blantons bourbon", "how much is blantons", "blantons msrp", "blantons horse stopper letters", "why is blantons so hard to find", "blantons vs eagle rare", "blantons bourbon review", "blantons for sale"],
    spec: ["93 proof", "46.5% ABV", "single barrel", "8 year bourbon", "Kentucky straight bourbon", "Buffalo Trace", "750ml"],
    tasting: ["caramel", "vanilla", "citrus", "honey", "light oak", "creamy finish"],
    extraClusters: [
      { cluster: "Collectibility", terms: ["horse stopper", "Blanton's stopper letters", "complete the word Blantons", "collectible bourbon", "Blanton's Gold", "Blanton's Straight From The Barrel"] },
    ],
  }),

  "blantons-gold-edition": bottleSeo({
    metaTitle: "Blanton's Gold Edition Price | 103 Proof Single Barrel",
    metaDescription:
      "Blanton's Gold Edition single barrel bourbon at 103 proof — richer and higher proof than the Original. Current price and allocation status.",
    focusKeyword: "blantons gold",
    alternateName: "Blanton's Gold Edition",
    primary: ["blantons gold", "blanton's gold edition", "blantons gold edition", "blantons gold price", "blantons gold bourbon", "blanton's gold"],
    longTail: ["where to buy blantons gold", "blantons gold msrp", "blantons gold vs original", "how much is blantons gold", "is blantons gold worth it", "blantons gold edition review"],
    spec: ["103 proof", "51.5% ABV", "single barrel", "8 year bourbon", "Kentucky straight bourbon", "Buffalo Trace", "750ml"],
    tasting: ["caramel", "vanilla", "orange", "toasted oak", "baking spice", "long warm finish"],
    extraClusters: [
      { cluster: "Blanton's Lineup", terms: ["Blanton's Original", "Blanton's Gold", "Blanton's Straight From The Barrel", "horse stopper", "collectible bourbon"] },
    ],
  }),

  // --- Stagg --------------------------------------------------------------
  // Buffalo Trace dropped the "Jr." at Batch 18, but the search demand did
  // not follow: "stagg jr" is still how most people look for this bottle, so
  // the title carries the former name explicitly.
  "stagg-bourbon": bottleSeo({
    metaTitle: "Stagg (Stagg Jr) Price | Barrel Proof 130 Proof Bourbon",
    metaDescription:
      "Stagg — formerly Stagg Jr — barrel-proof Kentucky bourbon at ~130 proof. Current price, batch and availability. Dark chocolate, cherry, brown sugar.",
    focusKeyword: "stagg jr",
    alternateName: "Stagg Jr",
    primary: ["stagg jr", "stagg bourbon", "stagg jr bourbon", "stagg jr price", "stagg batch", "buffalo trace stagg", "stagg jr for sale"],
    longTail: ["why did stagg jr change its name", "stagg jr vs george t stagg", "where to buy stagg jr", "stagg jr msrp", "what batch is stagg jr", "stagg jr review", "is stagg jr worth it", "stagg batch list"],
    spec: ["130 proof", "65% ABV", "barrel proof", "unfiltered", "9 year bourbon", "Kentucky straight bourbon", "Buffalo Trace", "750ml"],
    tasting: ["dark chocolate", "cherry", "brown sugar", "toasted oak", "baking spice", "big hot finish"],
    extraClusters: [
      { cluster: "Naming & Batches", terms: ["Stagg Jr", "formerly Stagg Jr", "Stagg Batch 18", "Stagg batch list", "George T. Stagg", "Stagg Sr"] },
    ],
  }),

  "george-t-stagg": bottleSeo({
    metaTitle: "George T. Stagg Price | BTAC Uncut 136.1 Proof Bourbon",
    metaDescription:
      "George T. Stagg — Buffalo Trace Antique Collection, uncut and unfiltered at 136.1 proof. Current price and allocation status. The benchmark barrel proof.",
    focusKeyword: "george t stagg",
    alternateName: "GTS",
    primary: ["george t stagg", "gts bourbon", "george t stagg price", "george t stagg 2025", "george t stagg btac", "stagg sr", "george t stagg barrel proof"],
    longTail: ["where to buy george t stagg", "george t stagg msrp", "george t stagg vs stagg jr", "how much is george t stagg", "btac 2025 lineup", "george t stagg review", "what proof is george t stagg"],
    spec: ["136.1 proof", "68% ABV", "barrel proof", "uncut", "unfiltered", "15 year bourbon", "Buffalo Trace Antique Collection", "750ml"],
    tasting: ["dark chocolate", "espresso", "leather", "dark cherry", "toasted oak", "enormous finish"],
    extraClusters: [BTAC_CLUSTER, { cluster: "Naming", terms: ["GTS", "Stagg Sr", "Papa Stagg", "Stagg Jr", "Stagg"] }],
  }),

  // --- Other allocated Buffalo Trace + limited releases --------------------
  "elmer-t-lee-single-barrel": bottleSeo({
    metaTitle: "Elmer T. Lee Single Barrel Price | 90 Proof Bourbon",
    metaDescription:
      "Elmer T. Lee Single Barrel Kentucky bourbon, 90 proof, named for the master distiller who created Blanton's. Current price and allocation status.",
    focusKeyword: "elmer t lee",
    alternateName: "Elmer T. Lee Single Barrel",
    primary: ["elmer t lee", "elmer t lee single barrel", "elmer t lee bourbon", "elmer t lee price", "elmer t lee msrp", "elmer t. lee"],
    longTail: ["where to buy elmer t lee", "how much is elmer t lee", "elmer t lee msrp", "elmer t lee vs blantons", "why is elmer t lee hard to find", "elmer t lee review", "elmer t lee commemorative"],
    spec: ["90 proof", "45% ABV", "single barrel", "9 year bourbon", "Kentucky straight bourbon", "Buffalo Trace", "750ml"],
    tasting: ["honey", "vanilla", "caramel", "soft spice", "light oak", "smooth finish"],
  }),

  "rock-hill-farms-single-barrel": bottleSeo({
    metaTitle: "Rock Hill Farms Price | Single Barrel 100 Proof Bourbon",
    metaDescription:
      "Rock Hill Farms Single Barrel Kentucky bourbon at 100 proof. Current price and allocation status. Rich caramel, oak and baking spice from the same mash bill as Blanton's.",
    focusKeyword: "rock hill farms",
    alternateName: "Rock Hill Farms Single Barrel",
    primary: ["rock hill farms", "rock hill farms bourbon", "rock hill farms single barrel", "rock hill farms price", "rock hill farms msrp"],
    longTail: ["where to buy rock hill farms", "how much is rock hill farms", "rock hill farms vs blantons", "is rock hill farms worth it", "rock hill farms review", "rock hill farms decanter"],
    spec: ["100 proof", "50% ABV", "single barrel", "8 year bourbon", "Kentucky straight bourbon", "Buffalo Trace", "750ml"],
    tasting: ["rich caramel", "oak", "baking spice", "dark fruit", "vanilla", "long finish"],
  }),

  "russells-reserve-13-year": bottleSeo({
    metaTitle: "Russell's Reserve 13 Year Price | 114.8 Proof Bourbon",
    metaDescription:
      "Russell's Reserve 13 Year, non-chill-filtered Kentucky bourbon at 114.8 proof from Wild Turkey. Current price and allocation status.",
    focusKeyword: "russells reserve 13",
    alternateName: "Russell's Reserve 13 Year",
    primary: ["russells reserve 13", "russell's reserve 13 year", "russells reserve 13 year", "russells reserve 13 price", "russell's reserve 13", "wild turkey russells reserve 13"],
    longTail: ["where to buy russells reserve 13", "russells reserve 13 msrp", "how much is russells reserve 13", "russells reserve 13 vs 15", "is russells reserve 13 worth it", "russells reserve 13 review"],
    spec: ["114.8 proof", "57.4% ABV", "13 year bourbon", "non-chill filtered", "Kentucky straight bourbon", "Wild Turkey", "750ml"],
    tasting: ["caramel", "vanilla", "toasted oak", "dark fruit", "baking spice", "rich finish"],
  }),

  "king-of-kentucky": bottleSeo({
    metaTitle: "King of Kentucky Price | 14 Year Barrel Proof Bourbon",
    metaDescription:
      "King of Kentucky single barrel, barrel-proof Kentucky bourbon — 14 years, 127.8 proof. Current price and allocation status. One of the hardest releases to find.",
    focusKeyword: "king of kentucky",
    alternateName: "King of Kentucky Bourbon",
    primary: ["king of kentucky", "king of kentucky bourbon", "king of kentucky price", "king of kentucky 2025", "king of kentucky release"],
    longTail: ["where to buy king of kentucky", "king of kentucky msrp", "how much is king of kentucky", "king of kentucky release date", "is king of kentucky worth it", "king of kentucky review"],
    spec: ["127.8 proof", "63.9% ABV", "14 year bourbon", "single barrel", "barrel proof", "Kentucky straight bourbon", "Brown-Forman", "750ml"],
    tasting: ["dark caramel", "leather", "dark chocolate", "dried fruit", "toasted oak", "long powerful finish"],
    extraClusters: [
      { cluster: "Scarcity", terms: ["annual release", "limited release bourbon", "collectible bourbon", "allocated bourbon", "bourbon lottery"] },
    ],
  }),

  "blood-oath": bottleSeo({
    metaTitle: "Blood Oath Bourbon Price | Annual Limited Release Pact",
    metaDescription:
      "Blood Oath — the annual limited-release pact of three Kentucky bourbons, 98.6 proof. Current price and allocation status for the latest Pact.",
    focusKeyword: "blood oath bourbon",
    alternateName: "Blood Oath Pact",
    primary: ["blood oath bourbon", "blood oath", "blood oath pact", "blood oath price", "blood oath bourbon price", "blood oath pact 11"],
    longTail: ["where to buy blood oath bourbon", "blood oath msrp", "which blood oath pact is best", "how much is blood oath", "blood oath pact list", "blood oath bourbon review"],
    spec: ["98.6 proof", "49.3% ABV", "12 year bourbon", "small batch", "Kentucky straight bourbon", "Lux Row", "750ml"],
    tasting: ["caramel", "vanilla", "dark fruit", "toasted oak", "baking spice", "smooth finish"],
    extraClusters: [
      { cluster: "Pact Releases", terms: ["Blood Oath Pact", "annual release", "pact of three bourbons", "limited release bourbon", "collectible bourbon"] },
    ],
  }),

  "thomas-h-handy-sazerac": bottleSeo({
    metaTitle: "Thomas H. Handy Sazerac Price | BTAC 130.9 Proof Rye",
    metaDescription:
      "Thomas H. Handy Sazerac — Buffalo Trace Antique Collection straight rye, uncut and unfiltered at 130.9 proof. Current price and allocation status.",
    focusKeyword: "thomas h handy",
    alternateName: "Thomas H. Handy Sazerac Rye",
    primary: ["thomas h handy", "thomas h handy sazerac", "thomas handy rye", "thomas h handy price", "thomas h handy 2025", "handy rye btac"],
    longTail: ["where to buy thomas h handy", "thomas h handy msrp", "thomas h handy vs sazerac 18", "how much is thomas h handy", "btac 2025 lineup", "thomas h handy review"],
    spec: ["130.9 proof", "65.45% ABV", "barrel proof", "uncut", "unfiltered", "straight rye whiskey", "6 year rye", "Buffalo Trace Antique Collection", "750ml"],
    tasting: ["rye spice", "mint", "dark caramel", "cracked pepper", "toasted oak", "hot lingering finish"],
    extraClusters: [BTAC_CLUSTER, { cluster: "Rye Whiskey", terms: ["straight rye whiskey", "barrel proof rye", "best rye whiskey", "Sazerac 18", "rye for cocktails"] }],
  }),

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
