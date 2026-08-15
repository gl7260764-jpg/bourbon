// Blog data module.
//
// Each post carries its own SEO block (focus keyword, primary/long-tail
// keywords, semantic keyword clusters) and a structured content[] array so the
// renderer can lay out paragraphs, headings, lists, callouts and recipes
// without pulling in a markdown dependency.
//
// To add a new post: append to BLOG_POSTS, give it a unique slug, fill out the
// SEO block, and ship. The /blog and /blog/[slug] routes pick it up
// automatically (generateStaticParams reads from this file).

export type WordCluster = {
  cluster: string;
  terms: string[];
};

export type BlogSeo = {
  metaTitle: string;
  metaDescription: string;
  focusKeyword: string;
  primaryKeywords: string[];
  longTailKeywords: string[];
  wordClusters: WordCluster[];
};

export type ContentBlock =
  | { type: "heading"; level: 2 | 3; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[]; ordered?: boolean }
  | { type: "callout"; title?: string; text: string }
  | {
      type: "recipe";
      name: string;
      glass: string;
      ingredients: string[];
      steps: string[];
      garnish?: string;
      notes?: string;
    };

/* Optional Q&A block. Rendered at the foot of the post and emitted as
   FAQPage structured data, which is what makes the questions eligible for
   the expandable FAQ rich result in search. Posts without it are unaffected. */
export type FaqItem = {
  question: string;
  answer: string;
};

export type BlogPost = {
  slug: string;
  title: string;
  subtitle: string;
  excerpt: string;
  category: string;
  author: string;
  authorTitle: string;
  publishedAt: string; // ISO date — used as the post date
  readTimeMinutes: number;
  heroImage: string;
  heroAlt: string;
  tags: string[];
  content: ContentBlock[];
  seo: BlogSeo;
  // Internal-link SEO: product slugs that should appear in the
  // "Bottles in this Story" section at the end of the post. The detail
  // page hydrates these from Prisma so the cards stay in sync with stock,
  // price and primary image. Inline anchor links go directly into the
  // content via the [[product:slug|anchor text]] marker.
  relatedProducts: string[];
  faq?: FaqItem[];
};

export const BLOG_POSTS: BlogPost[] = [
  // ─────────────────────────────────────────────────────────────────────────
  // 1. Barrel Selection — Craftsmanship
  // ─────────────────────────────────────────────────────────────────────────
  {
    slug: "master-distiller-barrel-selection-guide",
    title: "The Art of Barrel Selection: A Master Distiller's Guide",
    subtitle:
      "Inside the rickhouse walk, the honey barrel, and how one cask becomes a single barrel release.",
    excerpt:
      "Behind every great single barrel bottling is a quiet, slow walk through a Kentucky rickhouse — and a master distiller who knows exactly which barrel to tap. Here's how that decision actually gets made.",
    category: "Craftsmanship",
    author: "Eleanor Hayes",
    authorTitle: "Master Distiller, Bourbon & Oak",
    publishedAt: "2026-05-10",
    readTimeMinutes: 8,
    heroImage:
      "https://images.unsplash.com/photo-1609951651556-5334e2706168?w=1600&q=85",
    heroAlt:
      "Master distiller drawing a sample from a charred American oak bourbon barrel with a copper whiskey thief",
    tags: [
      "single barrel",
      "barrel selection",
      "honey barrel",
      "rickhouse",
      "charred oak",
      "master distiller",
    ],
    content: [
      {
        type: "paragraph",
        text: "There is no shortcut to a great single barrel bourbon. There is no algorithm, no spectrometer reading, no software that picks the right cask for you. There is a quiet walk through a Kentucky rickhouse with a whiskey thief in your hand, a tasting glass in the other, and a memory built over decades of pulling samples in rooms that smell of toasted vanilla and damp oak. That walk — what we simply call a barrel pick — is where the bourbon you eventually drink is decided.",
      },
      {
        type: "paragraph",
        text: "Most bourbon, including most very good bourbon, is married together from many barrels to produce a consistent house style. A [[product:elmer-t-lee-single-barrel|single barrel release]] is the opposite philosophy: it isolates one cask that the master distiller believes is unusually good and bottles it on its own, in vanishingly small quantities, with the barrel's number, warehouse, and rick position often printed right on the label. Done well, single barrel is the most personal expression in American whiskey. Done lazily, it's just one barrel of average bourbon with a higher price tag. The difference comes down to the pick itself.",
      },
      {
        type: "heading",
        level: 2,
        text: "What a Master Distiller Actually Looks For",
      },
      {
        type: "paragraph",
        text: "Before tasting a single drop, the pick begins with the barrel itself. American Standard Barrels are built from new charred Quercus alba — American white oak — and the depth and duration of that interior char is graded one through four. A char level 4 barrel, sometimes called an alligator char because the carbonized surface cracks into a scaled pattern, exposes the spirit to more caramelized wood sugars and produces a darker, sweeter, more aggressively oak-forward bourbon. Lower char levels give finer, more delicate spirits with more fruit and floral character. Neither is better. Both are tools.",
      },
      {
        type: "paragraph",
        text: "The barrel's life in the warehouse matters even more than how it was built. A bourbon barrel resting on the top floor of a Kentucky rickhouse, where summer temperatures routinely climb past 100 degrees, will push and pull through the wood much more aggressively than a barrel on the cool, damp first floor. The whiskey from up top — think of an uncut, unfiltered release like [[product:george-t-stagg|George T. Stagg]] — tends to be darker, more concentrated, more oak-driven; the whiskey from the bottom is paler, lighter on the palate, often more delicate. The same mash bill, distilled on the same day, can become two genuinely different bourbons depending only on where its barrel sat for ten years.",
      },
      {
        type: "callout",
        title: "Honey Barrel",
        text: "Distillery slang for a barrel that has aged exceptionally well — usually one that sat in a sweet spot of the rickhouse where temperature swings produced layered, balanced flavor without over-extracting the oak. There is no honey added; the name is for the flavor and color.",
      },
      {
        type: "heading",
        level: 2,
        text: "The Walk: What Happens on a Barrel Pick",
      },
      {
        type: "paragraph",
        text: "A typical pick at our distillery starts before dawn. We meet the warehouse manager at the loading dock with a clipboard, a copper whiskey thief, and a stack of Glencairn tasting glasses. The manager has already pulled six to ten candidate barrels — usually from the third, fourth and fifth floors, sometimes higher — based on a combination of mash bill, age, and the master distiller's standing notes from previous walks. The candidates are lined up along the rick and numbered.",
      },
      {
        type: "paragraph",
        text: "We pull a small sample from each, neat, at full proof. We nose first — eyes closed, nothing else in the room competing — and then taste, often without water, looking for the architecture of the spirit. Is there a strong oak spine? Does the corn come through as bright caramel or muddy fudge? Does the mid-palate have layers, or does it open and close in the same beat? Is the finish long and oily, or is it short and hot? We are rarely looking for the highest-proof barrel or the most aggressive barrel. We are looking for the one whose elements are in balance, whose flavor structure is most distinct from a house-style small batch.",
      },
      {
        type: "list",
        ordered: false,
        items: [
          "Nose at full proof first, then with a single drop of cool water to lift volatiles.",
          "Taste neat, then again with water — the right barrel improves both ways.",
          "Hold each sample 8 to 12 seconds. Long finishes are the single best signal of a great cask.",
          "Reject anything that reads as out of balance: thin mid-palate, harsh char, dominant single note.",
          "When two candidates are close, prefer the one with more distinct character over the one with cleaner balance — a single barrel exists to be different.",
        ],
      },
      {
        type: "heading",
        level: 2,
        text: "Why Char Level and Mash Bill Matter Before You Even Smell It",
      },
      {
        type: "paragraph",
        text: "The legal definition of bourbon requires a mash bill of at least 51% corn, aged in new charred American oak. Inside that frame, distilleries express their identity through grain ratios. A high-corn mash like the one we use for our flagship 12 Year Reserve will produce a sweeter, vanilla-and-caramel-driven spirit. A higher-rye mash will give you more pepper, baking spice and dryness on the finish. A wheated mash, which substitutes wheat for rye, will run softer and more honeyed. None of this changes during aging, but the wood interacts with each style differently — a high-rye spirit on top floors can become harsh; a wheated spirit on the same floors often deepens beautifully into honeyed leather.",
      },
      {
        type: "paragraph",
        text: "Char level interacts with all of this. The deeper the char, the more the whiskey penetrates into the toasted layer just below the carbonized surface, where caramelized wood sugars live. That layer is the source of the classic bourbon sweetness. With a low-rye, high-corn mash, a level 4 char can push a barrel into syrupy territory. With a high-rye mash, that same char often produces the most balanced, beautifully integrated bourbon in the warehouse. The pick is a constant negotiation between mash, char, and time.",
      },
      {
        type: "heading",
        level: 2,
        text: "Rick Position: The Single Most Underrated Variable",
      },
      {
        type: "paragraph",
        text: "A nine-story Kentucky rickhouse is, in effect, nine different climates stacked on top of each other. In the summer, top-floor temperatures regularly hit 110 to 115 degrees Fahrenheit; bottom floors stay in the mid-70s. Across a ten-year aging cycle, that delta produces an enormous difference in how a barrel evolves. Top-floor barrels lose more volume to evaporation — what the industry charmingly calls the angel's share — and the bourbon left behind is darker, denser and more oak-forward. Bottom-floor barrels evaporate less, age slower, and produce paler, more delicate whiskey with more grain character.",
      },
      {
        type: "paragraph",
        text: "Most distilleries don't print the rick position on the label, but they know exactly where every single barrel they bottle was aged. Some single barrel programs publish the floor and rick. [[product:blantons-original-single-barrel|Blanton's]], the very first single barrel bourbon, lives entirely in Warehouse H — a rare metal-clad rickhouse at Buffalo Trace that ages bourbon faster and more evenly than its brick siblings. Stablemates like [[product:elmer-t-lee-single-barrel|Elmer T. Lee]] and [[product:rock-hill-farms-single-barrel|Rock Hill Farms]] come from the same Mash Bill #2 program. The choice of warehouse is as much a part of the recipe as the mash bill.",
      },
      {
        type: "callout",
        title: "Why floor matters for buyers",
        text: "If a single barrel release is unusually oak-driven and tannic, it likely came from a high floor. If it's unusually delicate and bright, it likely came from a low floor. Neither is a fault — it's a clue to what you're drinking.",
      },
      {
        type: "heading",
        level: 2,
        text: "The Numbers Behind the Pick",
      },
      {
        type: "paragraph",
        text: "Across the Kentucky industry, the math of single barrel is brutal. A typical bourbon barrel holds about 53 gallons going into the rickhouse. After ten Kentucky summers, evaporation losses cut that to roughly 40 gallons, which yields about 200 bottles at 90 proof. A modern rickhouse can hold somewhere between 20,000 and 50,000 barrels. Of those tens of thousands, perhaps two or three percent will be picked out for single barrel programs in a given year. The rest go to small batch, standard, or — for whatever didn't develop well — bulk programs.",
      },
      {
        type: "paragraph",
        text: "That two percent is what serious bourbon drinkers are chasing. It is the population from which the honey barrels emerge. And the only way to find one is to walk the warehouse, pull samples, taste in silence, and trust the years of palate memory that tell you when a barrel is ready and when it isn't.",
      },
      {
        type: "heading",
        level: 2,
        text: "What This Means for Your Next Bottle",
      },
      {
        type: "paragraph",
        text: "If you buy a single barrel bottling like [[product:eh-taylor-single-barrel|E.H. Taylor Single Barrel]] or any serious Kentucky single barrel, you are buying the result of a deliberate human decision made by someone who walked a warehouse before sunrise, who pulled samples in the cold, who tasted twelve candidates to bottle one. The number on the label corresponds to a real barrel, in a real warehouse, on a real floor. The flavors in your glass are not abstractions. They are the particular interaction between one mash, one char, one floor, and one stretch of Kentucky weather.",
      },
      {
        type: "paragraph",
        text: "That is the part of bourbon I love most. Not the marketing, not the bottle, not the score. The fact that somewhere up in a metal-roofed rickhouse, a single oak cylinder full of slowly evolving spirit became, after ten quiet years, the bourbon you're about to pour. Drink it slowly. Try it neat first, then with a drop of water. Notice the long finish — the cleanest signal a great pick leaves behind — and remember that nobody, including the master distiller, knew exactly what they had until the cask was tapped.",
      },
    ],
    seo: {
      metaTitle:
        "How Distillers Pick a Single Barrel Bourbon (Honey Barrel)",
      metaDescription:
        "Inside the barrel pick — how master distillers walk a Kentucky rickhouse, what they taste for, and why char and rick position make a honey barrel.",
      focusKeyword: "single barrel bourbon",
      primaryKeywords: [
        "single barrel bourbon",
        "barrel selection",
        "honey barrel",
        "bourbon barrel pick",
        "master distiller barrel pick",
        "char level 4 bourbon",
        "Kentucky rickhouse",
        "rick position bourbon",
        "how bourbon is selected",
      ],
      longTailKeywords: [
        "how does a master distiller pick a barrel",
        "what is a honey barrel in bourbon",
        "how to choose a single barrel bourbon",
        "what does char level 4 mean in bourbon",
        "why does rick position affect bourbon flavor",
        "single barrel vs small batch bourbon",
        "how long does bourbon age in a rickhouse",
        "what makes a single barrel bourbon worth it",
        "angel's share bourbon explained",
        "alligator char American oak",
      ],
      wordClusters: [
        {
          cluster: "Cask & Wood Science",
          terms: [
            "American white oak",
            "Quercus alba",
            "char level 1",
            "char level 2",
            "char level 3",
            "char level 4",
            "alligator char",
            "toasted layer",
            "caramelized wood sugars",
            "American Standard Barrel",
            "53 gallon barrel",
          ],
        },
        {
          cluster: "Aging Science",
          terms: [
            "angel's share",
            "rickhouse",
            "rick position",
            "top floor aging",
            "bottom floor aging",
            "Kentucky summer aging",
            "metal-clad warehouse",
            "brick rickhouse",
            "Warehouse H",
            "temperature stratification",
            "evaporation loss",
          ],
        },
        {
          cluster: "Selection Process",
          terms: [
            "barrel pick",
            "warehouse walk",
            "whiskey thief",
            "tasting at full proof",
            "neat tasting",
            "Glencairn glass",
            "honey barrel",
            "single barrel program",
            "barrel number",
            "rick number",
          ],
        },
        {
          cluster: "Mash & Style",
          terms: [
            "high corn mash",
            "high rye mash",
            "wheated bourbon",
            "Mash Bill #1",
            "Mash Bill #2",
            "rye recipe",
            "wheat recipe",
            "low rye bourbon",
            "Kentucky straight bourbon",
          ],
        },
        {
          cluster: "Industry Terms",
          terms: [
            "single barrel",
            "small batch",
            "bottled in bond",
            "barrel proof",
            "non-chill filtered",
            "uncut unfiltered",
            "barrel strength",
          ],
        },
        {
          cluster: "Tasting Vocabulary",
          terms: [
            "long finish",
            "oily mid-palate",
            "balanced architecture",
            "oak spine",
            "caramel",
            "vanilla",
            "leather",
            "tobacco",
            "dried fruit",
            "baking spice",
            "honey",
            "dark cherry",
          ],
        },
        {
          cluster: "Buyer Intent",
          terms: [
            "buy single barrel bourbon",
            "best single barrel bourbon",
            "Blanton's single barrel",
            "Elmer T. Lee",
            "Rock Hill Farms",
            "Eagle Rare single barrel",
            "single barrel for sale",
          ],
        },
      ],
    },
    relatedProducts: [
      "elmer-t-lee-single-barrel",
      "blantons-original-single-barrel",
      "rock-hill-farms-single-barrel",
      "eh-taylor-single-barrel",
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 2. Summer Cocktails — Recipes
  // ─────────────────────────────────────────────────────────────────────────
  {
    slug: "summer-bourbon-cocktail-recipes",
    title: "Summer Cocktails: 5 Bourbon Recipes to Beat the Heat",
    subtitle:
      "From the original 1862 Mint Julep to a modern Paper Plane — five tested bourbon cocktails for warm Kentucky evenings.",
    excerpt:
      "Five bourbon cocktails we actually serve at the distillery in July — the classic Mint Julep, the Smash, a perfect Whiskey Sour, the modern Paper Plane, and a Bourbon Lemonade that ends every garden tour.",
    category: "Recipes",
    author: "Wyatt Brennan",
    authorTitle: "Head Bartender, The Cellar at Bourbon & Oak",
    publishedAt: "2026-05-05",
    readTimeMinutes: 6,
    heroImage:
      "https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=1600&q=85",
    heroAlt:
      "Frosted silver julep cup filled with crushed ice, bourbon and fresh mint on a sunlit bar top",
    tags: [
      "bourbon cocktails",
      "summer cocktails",
      "mint julep",
      "whiskey sour",
      "bourbon smash",
      "paper plane",
    ],
    content: [
      {
        type: "paragraph",
        text: "Most cocktails are about masking a spirit. The five recipes below are about lifting one. Bourbon in July is one of the more rewarding spirits to mix with: the sweetness of the corn handles citrus beautifully, the oak gives weight to drinks that would otherwise feel thin, and the proof is high enough that ice and dilution become part of the recipe rather than a problem to solve. Below are five summer bourbon cocktails — three classics, one modern classic, and one house pour — that we serve all summer at The Cellar.",
      },
      {
        type: "paragraph",
        text: "A few rules before you start. Use a bourbon you'd actually drink neat — a high-proof small batch like [[product:eh-taylor-small-batch|E.H. Taylor Small Batch]] or a wheated single barrel like [[product:weller-single-barrel|Weller Single Barrel]] works beautifully in every recipe below. Skip the bottom-shelf stuff; the cocktail will only ever be as good as the spirit going in. Crushed ice means actually crushed: cubes wrapped in a clean tea towel and worked over with a mallet until the chips are about the size of peas. And always measure. The difference between a great Mint Julep and an over-sweet mess is half an ounce.",
      },
      {
        type: "callout",
        title: "Choosing your bourbon",
        text: "For julep and smash: a balanced 100 proof Bottled-in-Bond like [[product:eh-taylor-small-batch|E.H. Taylor Small Batch]] or a soft wheated bourbon like [[product:weller-12-year|Weller 12 Year]]. For sours and the Paper Plane: a higher-rye spirit like [[product:russells-reserve-13-year|Russell's Reserve 13]] for backbone. For lemonade: anything you love neat — the lemonade should support the bourbon, not the other way around.",
      },
      {
        type: "recipe",
        name: "The Mint Julep",
        glass: "Pewter or silver julep cup, frosted in the freezer for 30 minutes",
        ingredients: [
          "2.5 oz Kentucky bourbon (90 to 100 proof)",
          "0.5 oz rich simple syrup (2 parts sugar to 1 part water)",
          "8 to 10 fresh mint leaves, plus a generous mint bouquet to garnish",
          "Crushed ice",
        ],
        steps: [
          "Place 6 mint leaves and the simple syrup in the chilled julep cup. Gently press the mint with a muddler — bruise, do not pulverize — for 5 seconds.",
          "Fill the cup three-quarters with crushed ice. Pour the bourbon over the ice.",
          "Stir with a bar spoon, working the ice up and down until the outside of the cup is fully frosted.",
          "Mound additional crushed ice into a dome above the rim.",
          "Slap the mint bouquet between your palms to release the oils, then insert it into the ice dome. Add a short straw cut to just below the mint, so the drinker's nose is pressed into the herb on every sip.",
        ],
        garnish: "Mint bouquet and a thin lemon wheel",
        notes:
          "Recipe approximates the 1862 specification published by Jerry Thomas in How to Mix Drinks, with modern proof. Skip the lemon wheel for the strict Kentucky Derby version.",
      },
      {
        type: "recipe",
        name: "Bourbon Smash",
        glass: "Double old-fashioned, well chilled",
        ingredients: [
          "2 oz bourbon (small batch, 90 to 100 proof)",
          "0.75 oz fresh lemon juice",
          "0.5 oz rich simple syrup",
          "4 fresh mint leaves",
          "3 to 4 ripe blackberries or raspberries (or a half lemon wheel for the classic)",
          "Crushed ice",
        ],
        steps: [
          "In a shaker tin, muddle the berries with the simple syrup and mint leaves until the fruit is broken down but the mint isn't shredded.",
          "Add the bourbon and lemon juice. Fill with ice and shake hard for 8 to 10 seconds.",
          "Double-strain into a double old-fashioned filled with crushed ice.",
          "Top with a small mound of crushed ice and a fresh mint sprig.",
        ],
        garnish: "Mint sprig, two berries on a pick",
        notes:
          "The Bourbon Smash is a 19th-century cousin of the Julep and the Sour. The smash element is in the name — fruit is muddled, not just garnished.",
      },
      {
        type: "recipe",
        name: "The Whiskey Sour",
        glass: "Coupe or rocks, your choice",
        ingredients: [
          "2 oz bourbon (higher-rye bourbon shines here)",
          "0.75 oz fresh lemon juice",
          "0.75 oz rich simple syrup",
          "1 fresh egg white (optional but recommended)",
          "2 to 3 dashes Angostura bitters (float on top after pouring)",
        ],
        steps: [
          "Add bourbon, lemon juice, simple syrup and the egg white to a shaker tin without ice. Dry shake hard for 15 seconds to emulsify the egg white.",
          "Add ice and shake again for 10 to 12 seconds until well chilled.",
          "Double-strain into a chilled coupe (or over a single large cube in a rocks glass).",
          "Float 2 to 3 drops of Angostura bitters on the foam and draw a pattern through them with a toothpick if you're feeling fancy.",
        ],
        garnish: "Brandied cherry on the rim",
        notes:
          "Skipping the egg white is fine but you lose the silky texture and the foam canvas for the bitters. The egg white version (a Boston Sour) is the original — it predates the dry version by half a century.",
      },
      {
        type: "recipe",
        name: "Paper Plane",
        glass: "Coupe, chilled",
        ingredients: [
          "0.75 oz bourbon",
          "0.75 oz Aperol",
          "0.75 oz Amaro Nonino Quintessentia",
          "0.75 oz fresh lemon juice",
        ],
        steps: [
          "Combine all four ingredients in a shaker tin filled with ice.",
          "Shake hard for 10 to 12 seconds until well chilled.",
          "Double-strain into a chilled coupe.",
          "No garnish — the perfect equal-parts geometry of the drink is the point.",
        ],
        notes:
          "Created by Sam Ross at Milk & Honey in New York in 2008. The Paper Plane is one of the only modern cocktails to enter the canon in the last 20 years, and arguably the cleanest answer to what to mix with bourbon when you want something elegant.",
      },
      {
        type: "recipe",
        name: "Distillery Bourbon Lemonade",
        glass: "Highball or mason jar",
        ingredients: [
          "2 oz bourbon",
          "4 oz fresh lemonade (fresh-squeezed lemon, water, and rich simple syrup to taste)",
          "1 sprig fresh thyme or rosemary",
          "Ice cubes (not crushed)",
        ],
        steps: [
          "In your serving glass, clap the herb sprig between your hands to release oils and drop it in.",
          "Fill the glass with ice cubes.",
          "Pour bourbon over the ice, then top with lemonade.",
          "Stir twice. Float a fresh sprig on top.",
        ],
        garnish: "Lemon wheel and a fresh herb sprig",
        notes:
          "Use real, fresh-squeezed lemonade. Bottled mixers will dull a good bourbon. We end every garden tour with this in July — it's the most-asked-after recipe at the distillery shop.",
      },
      {
        type: "heading",
        level: 2,
        text: "A Note on Ice, Glassware, and Garnish",
      },
      {
        type: "paragraph",
        text: "Three details separate a competent home cocktail from a great one. First, ice: a single large clear cube melts about 40% slower than cracked ice from your freezer's automatic dispenser, which keeps your drink cold longer without watering it down — buy a single-cube silicon mold and pre-freeze with filtered or boiled-and-cooled water for clarity. Second, glassware: chilled glasses keep the first sip at the temperature the recipe was tuned for. Stash your coupes and julep cups in the freezer 30 minutes before you start mixing. Third, garnish: garnishes are aromatic, not decorative. A mint bouquet on a Julep is what the drinker's nose presses into between sips. Skip the bottled cherries — buy or make brandied cherries with actual fruit.",
      },
      {
        type: "heading",
        level: 2,
        text: "What to Pour the Cocktails From",
      },
      {
        type: "paragraph",
        text: "For everyday cocktail use, you want a balanced 90-to-100 proof small batch bourbon — high enough proof to survive ice and dilution, expressive enough to actually show through citrus and mint. [[product:eh-taylor-small-batch|E.H. Taylor Small Batch]] is built exactly for this job. For sours and the Paper Plane, a higher-rye bourbon like [[product:russells-reserve-13-year|Russell's Reserve 13]] adds drying spice that lifts the lemon. For a Julep on Derby Day, give yourself permission to use something a little nicer — a [[product:weller-single-barrel|wheated single barrel]] rewards the simplicity of the recipe. Skip barrel-proof bourbons unless you're scaling the bourbon back; over 110 proof, you start needing more dilution than the recipe is tuned for.",
      },
      {
        type: "paragraph",
        text: "All five recipes above scale cleanly. For a small dinner party, the Bourbon Lemonade or the Smash can be batched in a pitcher (multiply ingredients by your headcount, hold the ice and garnish until service). The Sour and Paper Plane don't batch well — they need to be shaken to order to get the texture right. The Julep is a one-at-a-time drink by tradition, and frankly by design: the joy is in building it slowly, in a chilled cup, with someone you're glad is on your porch.",
      },
    ],
    seo: {
      metaTitle:
        "5 Easy Summer Bourbon Cocktails (Julep, Smash, Sour)",
      metaDescription:
        "Five tested summer bourbon cocktails — Kentucky Mint Julep, Bourbon Smash, Whiskey Sour, Paper Plane and our distillery's bourbon lemonade recipe.",
      focusKeyword: "summer bourbon cocktails",
      primaryKeywords: [
        "summer bourbon cocktails",
        "bourbon cocktail recipes",
        "mint julep recipe",
        "bourbon smash recipe",
        "whiskey sour recipe",
        "paper plane cocktail",
        "bourbon lemonade",
        "Kentucky cocktails",
        "easy bourbon cocktails",
        "Derby Day cocktails",
      ],
      longTailKeywords: [
        "best summer bourbon cocktails",
        "how to make a Kentucky mint julep",
        "classic bourbon smash recipe with berries",
        "whiskey sour with egg white recipe",
        "paper plane cocktail equal parts recipe",
        "bourbon lemonade for a crowd",
        "what bourbon to use in cocktails",
        "best bourbon for old fashioned and julep",
        "how to crush ice for cocktails",
        "what to mix with bourbon in summer",
      ],
      wordClusters: [
        {
          cluster: "Cocktail Recipes",
          terms: [
            "mint julep",
            "bourbon smash",
            "whiskey sour",
            "Boston sour",
            "paper plane",
            "bourbon lemonade",
            "old fashioned",
            "Manhattan",
            "bourbon highball",
            "Derby cocktail",
          ],
        },
        {
          cluster: "Technique",
          terms: [
            "dry shake",
            "double strain",
            "muddle",
            "build in glass",
            "crushed ice technique",
            "frosted julep cup",
            "egg white emulsion",
            "stir vs shake",
            "rich simple syrup",
            "fresh lemon juice",
          ],
        },
        {
          cluster: "Glassware & Tools",
          terms: [
            "julep cup",
            "coupe glass",
            "rocks glass",
            "double old fashioned",
            "shaker tin",
            "hawthorne strainer",
            "fine mesh strainer",
            "bar spoon",
            "single large ice cube",
            "crushed ice mallet",
          ],
        },
        {
          cluster: "Bourbon Selection",
          terms: [
            "small batch bourbon for cocktails",
            "90 proof bourbon",
            "100 proof bourbon",
            "high rye bourbon",
            "single barrel bourbon",
            "wheated bourbon",
            "bottled in bond",
            "best mixing bourbon",
          ],
        },
        {
          cluster: "Garnish & Bitters",
          terms: [
            "fresh mint bouquet",
            "brandied cherries",
            "Angostura bitters",
            "Peychaud's bitters",
            "lemon wheel",
            "fresh thyme",
            "rosemary sprig",
            "expressed citrus peel",
          ],
        },
        {
          cluster: "Modifiers",
          terms: [
            "Aperol",
            "Amaro Nonino",
            "amaro",
            "simple syrup",
            "rich syrup",
            "demerara syrup",
            "lemonade",
            "soda water",
            "ginger beer",
          ],
        },
        {
          cluster: "Occasion & Intent",
          terms: [
            "Derby Day",
            "Kentucky Derby cocktail",
            "garden party bourbon",
            "summer porch drink",
            "batch cocktails for a crowd",
            "Father's Day bourbon",
            "BBQ pairing cocktails",
          ],
        },
      ],
    },
    relatedProducts: [
      "eh-taylor-small-batch",
      "weller-single-barrel",
      "russells-reserve-13-year",
      "weller-12-year",
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 3. Rickhouse No. 7 — Distillery News
  // ─────────────────────────────────────────────────────────────────────────
  {
    slug: "rickhouse-no-7-opening",
    title: "New Rickhouse Opening: Expanding Our Aging Capacity",
    subtitle:
      "Rickhouse No. 7 adds 20,000 barrels of capacity, a custom temperature-monitored top deck, and the first metal-clad warehouse on our grounds.",
    excerpt:
      "Rickhouse No. 7 is now standing on the south edge of the campus, adds 20,000 barrels of capacity, and is the first metal-clad warehouse we've ever built. Here's why that matters for what's in your glass.",
    category: "Distillery News",
    author: "Eleanor Hayes",
    authorTitle: "Master Distiller, Bourbon & Oak",
    publishedAt: "2026-04-28",
    readTimeMinutes: 5,
    heroImage:
      "https://images.unsplash.com/photo-1619451334792-150fd785ee74?w=1600&q=85",
    heroAlt:
      "Interior of a Kentucky rickhouse showing rows of stacked bourbon barrels aging in a wooden warehouse",
    tags: [
      "rickhouse",
      "distillery news",
      "aging warehouse",
      "barrel capacity",
      "Kentucky bourbon",
    ],
    content: [
      {
        type: "paragraph",
        text: "Rickhouse No. 7 — our seventh purpose-built aging warehouse on the Bardstown campus — opened for stocking this April. It is the largest warehouse we have ever raised, the first we have built in nearly thirty years, and the first that uses a metal-clad exterior rather than the painted brick of our six older buildings. The structure adds capacity for roughly 20,000 standard 53-gallon barrels and, more importantly, gives us the ability to age in a thermal envelope we have never had on our property before. Here is what the new warehouse looks like, what it means for the bourbon we will release out of it in the early 2030s, and why we made every choice we made.",
      },
      {
        type: "heading",
        level: 2,
        text: "The Scale and the Numbers",
      },
      {
        type: "paragraph",
        text: "Rickhouse No. 7 is seven stories tall, with 35 rick rows per floor and 81 barrels per rick — a total stocked capacity of roughly 20,000 American Standard Barrels. Across the seven floors, the temperature delta between the cool first floor and the sun-baked top floor will reach 35 to 40 degrees Fahrenheit during peak Kentucky summer, which is the engine of the kind of aging behavior we want: aggressive thermal cycling that pulls spirit deep into the toasted layer of the oak and pushes it back out again, week after week, summer after summer, year after year.",
      },
      {
        type: "list",
        ordered: false,
        items: [
          "Total capacity: 20,000 American Standard Barrels (53 gallons each)",
          "Footprint: 7 floors × 35 ricks × 81 barrels per rick",
          "Estimated angel's share over a 10-year cycle: 25 to 35 percent of original volume",
          "Construction time: 22 months from groundbreaking to first stocked barrel",
          "First barrels stocked: April 2026 — earliest release window from this warehouse is 2030",
        ],
      },
      {
        type: "heading",
        level: 2,
        text: "Why Metal Cladding, Not Brick",
      },
      {
        type: "paragraph",
        text: "Most of our existing rickhouses are brick-clad — the classic Kentucky warehouse silhouette. Brick has well-known advantages: it buffers temperature gradually, it ages slowly, it looks unmistakably like Kentucky bourbon country. But brick also limits the speed and intensity of the temperature swing inside a warehouse, which means barrels age more slowly and more uniformly across floors. That is a feature, not a bug, for most of what we bottle. For one specific category, though, it isn't quite right.",
      },
      {
        type: "paragraph",
        text: "Metal-clad warehouses heat faster, cool faster, and produce more aggressive seasonal cycling than brick. The most famous example in American bourbon is Warehouse H at Buffalo Trace, where [[product:blantons-original-single-barrel|Blanton's]] has been aged for decades. Metal-clad warehouses age bourbon with a more concentrated, more oak-forward character, and they reach drinkable maturity meaningfully sooner than brick — by some measures, two to three years sooner for the same target flavor profile. We built No. 7 in metal specifically because our planned barrel-proof releases like [[product:eh-taylor-barrel-proof|E.H. Taylor Barrel Proof]] and limited editions like [[product:william-larue-weller|William Larue Weller]] will benefit from this faster, more concentrated style of aging.",
      },
      {
        type: "callout",
        title: "Brick vs metal — the short version",
        text: "Brick: slow, even, classic. Use for long-aged 12- to 20-year programs and softer wheated bourbons. Metal: fast, aggressive, oak-forward. Use for barrel-proof, single barrel, and shorter-aged premium programs.",
      },
      {
        type: "heading",
        level: 2,
        text: "Floor-by-Floor Temperature Monitoring",
      },
      {
        type: "paragraph",
        text: "Every floor of Rickhouse No. 7 is wired with calibrated temperature and humidity sensors at three rick positions per floor — front, middle and back. The data writes to our warehouse management system in 15-minute intervals and is queryable, by barrel, for the entire life of every cask we age in the building. When we walk the floors for a single barrel pick in 2031, we will not only know the floor and rick number — we will know the heat history of every individual barrel in the candidate set. That is a level of provenance we have never had on our older campuses.",
      },
      {
        type: "paragraph",
        text: "The point is not to chase numbers. Bourbon does not become great because it spent a particular number of degree-days above 95 degrees Fahrenheit. Bourbon becomes great because of the combined judgment of distillers walking the warehouse and tasting in silence. But the data lets us understand, after the fact, why a barrel turned out the way it did — and that long feedback loop is how a distillery's program improves across decades.",
      },
      {
        type: "heading",
        level: 2,
        text: "What This Means for the Bottles You'll Drink",
      },
      {
        type: "paragraph",
        text: "The bourbon stocked into Rickhouse No. 7 in spring 2026 will not be ready to bottle until at least 2030 — four years for entry-level age statements, ten years and beyond for our reserve and limited edition programs like [[product:weller-12-year|Weller 12 Year]] and [[product:pappy-van-winkle-20-year|Pappy Van Winkle 20 Year]]. The releases you'll see from this warehouse will lean toward our barrel-proof and [[product:weller-single-barrel|single barrel]] programs first, with the deeper-aged products following a few years behind. We expect the in-glass character to be a touch more oak-forward, slightly drier on the finish, and a bit more concentrated than the equivalent age-statement bottle from our existing brick warehouses.",
      },
      {
        type: "paragraph",
        text: "When the first bottles emerge, they will carry a small additional notation on the back label — the rickhouse number — so you can taste the same expression aged in metal cladding and compare it against the brick-aged version side by side. That kind of transparency is something we've wanted to give our customers for years. Rickhouse No. 7 is the first project we've built where the architecture itself was designed to make that comparison possible.",
      },
      {
        type: "heading",
        level: 2,
        text: "A Note on Sustainability",
      },
      {
        type: "paragraph",
        text: "Two practical environmental choices on this build worth noting. First, the roof and south-facing cladding carry solar arrays sized to offset more than the entire electrical load of the warehouse's monitoring, lighting and forklift fleet — the building, in operational terms, is net negative on grid electricity from day one. Second, the construction lumber inside the rick framing is locally milled white oak from a managed Kentucky forest, the same forest from which our future barrel cooperage will increasingly source. Both choices added cost. Both choices were the right ones for a building that will, with luck and good maintenance, still be in service when the great-grandchildren of our current cellar team are doing the picks.",
      },
      {
        type: "paragraph",
        text: "If you're ever passing through Bardstown, we are happy to show you the new warehouse on our regular distillery tour — the tour now ends in Rickhouse No. 7 with a tasting of three side-by-side bourbons aged in our different warehouse types. Booking opens 30 days ahead at the distillery shop. We'll keep you posted as the first barrels from No. 7 work their way toward release.",
      },
    ],
    seo: {
      metaTitle:
        "Inside Rickhouse No. 7 — Our 20,000-Barrel Warehouse",
      metaDescription:
        "Our seventh aging warehouse is now stocking barrels. Rickhouse No. 7 adds 20,000 barrels of metal-clad, temperature-monitored bourbon capacity.",
      focusKeyword: "rickhouse",
      primaryKeywords: [
        "rickhouse",
        "bourbon rickhouse",
        "Kentucky rickhouse",
        "bourbon aging warehouse",
        "metal-clad rickhouse",
        "Rickhouse No. 7",
        "new distillery warehouse",
        "bourbon barrel capacity",
        "bourbon barrel aging",
      ],
      longTailKeywords: [
        "what is a rickhouse",
        "how a bourbon rickhouse works",
        "metal-clad vs brick rickhouse",
        "how many barrels in a rickhouse",
        "how long does bourbon age in a rickhouse",
        "what is the angel's share",
        "how does temperature affect bourbon aging",
        "Warehouse H Buffalo Trace metal-clad",
        "bourbon aging warehouse capacity",
        "new bourbon rickhouse opening 2026",
      ],
      wordClusters: [
        {
          cluster: "Warehouse Architecture",
          terms: [
            "rickhouse",
            "aging warehouse",
            "metal-clad warehouse",
            "brick rickhouse",
            "rick row",
            "rick position",
            "stacking ricks",
            "seven story warehouse",
            "warehouse floor",
            "rickhouse capacity",
          ],
        },
        {
          cluster: "Aging Science",
          terms: [
            "thermal cycling",
            "angel's share",
            "evaporation loss",
            "temperature stratification",
            "barrel breathing",
            "toasted layer extraction",
            "Kentucky summer aging",
            "humidity in rickhouse",
            "degree days",
          ],
        },
        {
          cluster: "Barrel & Cooperage",
          terms: [
            "American Standard Barrel",
            "53 gallon barrel",
            "new charred American oak",
            "Quercus alba",
            "char level 4",
            "alligator char",
            "cooperage",
            "white oak forestry",
            "Kentucky white oak",
          ],
        },
        {
          cluster: "Operations & Provenance",
          terms: [
            "warehouse management system",
            "temperature monitoring",
            "humidity monitoring",
            "barrel tracking",
            "rick position recording",
            "barrel pick provenance",
            "single barrel data",
          ],
        },
        {
          cluster: "Industry Comparisons",
          terms: [
            "Warehouse H",
            "Buffalo Trace",
            "Blanton's metal-clad",
            "Maker's Mark warehouse",
            "Heaven Hill rickhouse",
            "Wild Turkey rickhouse",
            "Kentucky Bourbon Trail warehouse",
          ],
        },
        {
          cluster: "Sustainability",
          terms: [
            "solar-powered distillery",
            "managed Kentucky forest",
            "locally milled white oak",
            "net-negative warehouse",
            "sustainable bourbon production",
            "carbon-aware aging",
          ],
        },
        {
          cluster: "Visitor & Tour",
          terms: [
            "Bardstown distillery tour",
            "Kentucky distillery visit",
            "rickhouse tour",
            "bourbon tasting room",
            "side-by-side warehouse tasting",
            "distillery experience",
          ],
        },
      ],
    },
    relatedProducts: [
      "william-larue-weller",
      "eh-taylor-barrel-proof",
      "stagg-bourbon",
      "blantons-original-single-barrel",
    ],
  },
  // ─────────────────────────────────────────────────────────────────────────
  // 4. Best Bourbon Bottles — Buying Guide
  // ─────────────────────────────────────────────────────────────────────────
  {
    slug: "best-bourbon-bottles-ranked",
    title: "The 10 Best Bourbon Bottles - And How to Actually Buy Them",
    subtitle:
      "Ranked on what is in the glass, with the proof, age and allocation reality every other list leaves out.",
    excerpt:
      "Most best-bourbon lists rank bottles you have no realistic way of buying, then stop at the tasting notes. This one gives you the full spec on all ten, explains how allocation actually works, and tells you exactly what to pour instead when the bottle you want is gone.",
    category: "Buying Guide",
    author: "Eleanor Hayes",
    authorTitle: "Master Distiller, Bourbon & Oak",
    publishedAt: "2026-08-14",
    readTimeMinutes: 14,
    heroImage: "/hero-poster.webp",
    heroAlt:
      "Backlit shelves of allocated Kentucky bourbon bottles including Pappy Van Winkle, Weller and Eagle Rare",
    tags: [
      "best bourbon",
      "allocated bourbon",
      "Pappy Van Winkle",
      "Buffalo Trace Antique Collection",
      "wheated bourbon",
      "barrel proof",
      "buying guide",
    ],
    content: [
      {
        type: "paragraph",
        text: "Every year the same list gets published. Ten bottles, ten sets of tasting notes, ten photographs of glassware on a walnut table. And every year it leaves out the two things a buyer actually needs: what is physically in the bottle, and how on earth you are supposed to get one. We read the major 2026 rankings before writing this. Not one of them printed proof and age for every entry. Not one explained what allocation means. Not one told you what to buy when the bottle they just spent 250 words praising has been unavailable at retail since 2019.",
      },
      {
        type: "paragraph",
        text: "So this list does those things. Every entry carries its age, its proof, its price and its current status in our inventory. After the ranking there are three sections you will not find on the other lists: how allocation genuinely works from the distillery to your glass, a substitution ladder that tells you precisely what to drink instead when a bottle is gone, and a checklist for spotting a counterfeit before you hand over money.",
      },
      {
        type: "callout",
        title: "How we ranked these",
        text: "Purely on the whiskey. Not on secondary market value, not on how hard a bottle is to find, and not on what we would most like to sell you. Scarcity is a fact about a supply chain, not a quality of a spirit. Where two bottles drink close to equal, the cheaper and more available one ranks higher, because a bourbon you can actually pour beats one you are saving for a birthday that never quite arrives.",
      },
      {
        type: "callout",
        title: "In the interest of transparency",
        text: "We sell all ten of these. That is precisely why we can print real stock status instead of a vague note about narrow distribution - and why we will tell you plainly, below, which of these we think are not worth their current asking price.",
      },
      { type: "heading", level: 2, text: "The 10 Best Bourbon Bottles, Ranked" },

      { type: "heading", level: 3, text: "1. Pappy Van Winkle Family Reserve 15 Year" },
      {
        type: "paragraph",
        text: "There is a reasonable argument that [[product:pappy-van-winkle-15-year|Pappy Van Winkle 15 Year]] is over-discussed, and no serious argument that it is overrated. Fifteen years in a wheated mash bill is the sweet spot of the entire Van Winkle range: old enough that the oak has turned to leather, dark caramel and pipe tobacco, young enough that the wheat still carries a soft bakery sweetness underneath. The 20 and 23 year expressions are more impressive; this one is more drinkable, and drinkability is what we are ranking.",
      },
      {
        type: "paragraph",
        text: "At 107 proof it arrives hot and then broadens rather than sharpening. A few drops of water opens brown sugar and cherry. If you only ever drink one bottle from this list, the honest recommendation is that it should be this one rather than the older Pappys, which trade a great deal of money for a little more wood.",
      },
      {
        type: "list",
        items: [
          "Age: 15 years - Proof: 107 (53.5% ABV) - Mash bill: wheated",
          "Our price: $500 - Rating: 4.9 from 145 reviews",
          "Status: in stock at the time of writing",
        ],
      },

      { type: "heading", level: 3, text: "2. William Larue Weller" },
      {
        type: "paragraph",
        text: "The barrel proof wheater from the Buffalo Trace Antique Collection, and the bottle that most often beats Pappy in a blind tasting. [[product:william-larue-weller|William Larue Weller]] is uncut and unfiltered, which at 133.6 proof means a whiskey that genuinely needs water and rewards it enormously. Undiluted it is dense - dark fruit, creme brulee, a long finish of oak and cocoa. Add a teaspoon of water and it unfolds into one of the most complete American whiskeys made.",
      },
      {
        type: "paragraph",
        text: "It is released once a year in autumn as part of the BTAC set. Proof varies release to release, which is part of the appeal for collectors and part of the frustration for everyone else.",
      },
      {
        type: "list",
        items: [
          "Age: 12 years - Proof: 133.6 (66.8% ABV) - Mash bill: wheated, barrel proof",
          "Our price: $250 - Rating: 4.9 from 146 reviews",
          "Status: allocated - annual autumn release",
        ],
      },

      { type: "heading", level: 3, text: "3. George T. Stagg" },
      {
        type: "paragraph",
        text: "The hazmat bottle. [[product:george-t-stagg|George T. Stagg]] regularly exceeds 130 proof - this release lands at 136.1, high enough that it cannot legally be carried on a commercial aircraft. It is not a novelty. Fifteen years in Kentucky oak on a high-rye recipe produces something extraordinarily concentrated: dark chocolate, char, leather, black cherry, and a finish that outlasts anything else in this ranking by a comfortable margin.",
      },
      {
        type: "paragraph",
        text: "This is the least beginner-friendly bottle on the list and the one experienced drinkers reach for first. Treat it like cask strength scotch: small pour, patient water, no ice.",
      },
      {
        type: "list",
        items: [
          "Age: 15 years - Proof: 136.1 (68.05% ABV) - Mash bill: high rye, barrel proof",
          "Our price: $250 - Rating: 4.8",
          "Status: allocated - annual autumn release",
        ],
      },

      { type: "heading", level: 3, text: "4. Eagle Rare 17 Year" },
      {
        type: "paragraph",
        text: "Where Stagg is force, [[product:eagle-rare-17-year|Eagle Rare 17 Year]] is restraint. Seventeen years is long enough to destroy most bourbon; the barrels chosen for this release carry it with unusual grace at a modest 101 proof. Expect polished oak, dried orange peel, honey and old leather, with a delicacy that no barrel proof bottling can reach.",
      },
      {
        type: "paragraph",
        text: "The candid caveat: at current market prices this is a collector bottle more than a drinker bottle. If you want the Eagle Rare profile to actually pour on a Thursday, the 10 and 12 year expressions deliver a large fraction of the character for a small fraction of the money.",
      },
      {
        type: "list",
        items: [
          "Age: 17 years - Proof: 101 (50.5% ABV) - Mash bill: low rye",
          "Our price: $250 - Rating: 4.9 from 198 reviews",
          "Status: allocated - BTAC annual release",
        ],
      },

      { type: "heading", level: 3, text: "5. Weller 12 Year" },
      {
        type: "paragraph",
        text: "The value champion of American whiskey, and the reason the phrase poor man's Pappy exists. [[product:weller-12-year|Weller 12 Year]] shares the wheated recipe and the Buffalo Trace warehouses with the Van Winkle line, carries a genuine 12 year age statement, and costs a fifth of what Pappy 15 does. At 90 proof it is soft, honeyed and gentle - vanilla, baked apple, a little cinnamon.",
      },
      {
        type: "paragraph",
        text: "It is not as deep or as long as the Van Winkles and anyone claiming otherwise is being romantic. It is, however, the single best ratio of quality to price on this entire list, and it is one of the few here we can usually keep in stock.",
      },
      {
        type: "list",
        items: [
          "Age: 12 years - Proof: 90 (45% ABV) - Mash bill: wheated",
          "Our price: $100 - Rating: 4.8 from 214 reviews",
          "Status: in stock at the time of writing",
        ],
      },

      { type: "heading", level: 3, text: "6. Blanton's Original Single Barrel" },
      {
        type: "paragraph",
        text: "The bottle that invented the category. [[product:blantons-original-single-barrel|Blanton's Original Single Barrel]] was the first commercially marketed single barrel bourbon in the world, and the horse and jockey stopper - eight of them spelling B-L-A-N-T-O-N-S across a collection - has done more for bourbon merchandising than any advertising campaign. Fortunately the whiskey earns it: creamy vanilla, citrus, a light nutmeg spice, and remarkable consistency for something drawn from a single cask.",
      },
      {
        type: "paragraph",
        text: "Because every bottle comes from one barrel, the dump date and warehouse are printed on the label and no two are quite identical. That is the point of buying it.",
      },
      {
        type: "list",
        items: [
          "Age: 8 years - Proof: 93 (46.5% ABV) - Mash bill: high rye, single barrel",
          "Our price: $150 - Rating: 4.8",
          "Status: allocated",
        ],
      },

      { type: "heading", level: 3, text: "7. Colonel E.H. Taylor, Jr. Barrel Proof" },
      {
        type: "paragraph",
        text: "The E.H. Taylor range is built on the Bottled-in-Bond Act of 1897, a piece of consumer protection legislation that predates the FDA and still guarantees a single distillery, a single season, at least four years in a federally supervised warehouse, and exactly 100 proof. [[product:eh-taylor-barrel-proof|E.H. Taylor Barrel Proof]] breaks the 100 proof rule deliberately, arriving uncut at 131 proof.",
      },
      {
        type: "paragraph",
        text: "The result is the most structured whiskey in the Taylor line - toasted grain, dark honey, pepper and a dry oak finish. At $100 it is meaningfully cheaper than the BTAC barrel proof bottles while delivering a similar intensity, which makes it the smart substitution when Stagg is nowhere to be found.",
      },
      {
        type: "list",
        items: [
          "Age: no age statement - Proof: 131 (65.5% ABV) - Bottled in bond lineage, barrel proof",
          "Our price: $100 - Rating: 4.8 from 132 reviews",
          "Status: allocated",
        ],
      },

      { type: "heading", level: 3, text: "8. Russell's Reserve 13 Year" },
      {
        type: "paragraph",
        text: "The best bottle on this list that has nothing to do with Buffalo Trace. [[product:russells-reserve-13-year|Russell's Reserve 13 Year]] comes from Wild Turkey and the Russell family, and it is the bottle that convinced a lot of collectors to look beyond the allocated Frankfort names. Thirteen years at 114.8 proof, non-chill filtered, with the deep caramelised sweetness and baking spice that is the Wild Turkey signature.",
      },
      {
        type: "paragraph",
        text: "Including it matters for a practical reason: a bourbon shelf composed entirely of one distillery is a narrower shelf. This is the most straightforward way to broaden yours without dropping any quality.",
      },
      {
        type: "list",
        items: [
          "Age: 13 years - Proof: 114.8 (57.4% ABV) - Non-chill filtered",
          "Our price: $200 - Rating: 4.8",
          "Status: allocated - limited annual release",
        ],
      },

      { type: "heading", level: 3, text: "9. Old Rip Van Winkle 10 Year" },
      {
        type: "paragraph",
        text: "The way into the Van Winkle family without a $500 decision. [[product:pappy-10|Old Rip Van Winkle 10 Year]] is bottled at 107 proof, the same strength as Pappy 15, but with ten years of wood instead of fifteen. What you lose in depth you gain in brightness - this is the fruitiest and most immediately charming whiskey in the range, all cherry, caramel and soft wheat.",
      },
      {
        type: "paragraph",
        text: "For anyone who wants to understand what the fuss over wheated bourbon is about, start here rather than at the top of the range. It teaches you the profile at a price where the lesson is affordable.",
      },
      {
        type: "list",
        items: [
          "Age: 10 years - Proof: 107 (53.5% ABV) - Mash bill: wheated",
          "Our price: $250 - Rating: 4.9 from 84 reviews",
          "Status: in stock at the time of writing",
        ],
      },

      { type: "heading", level: 3, text: "10. Elmer T. Lee Single Barrel" },
      {
        type: "paragraph",
        text: "Named for the master distiller who created Blanton's and effectively invented the single barrel category, [[product:elmer-t-lee-single-barrel|Elmer T. Lee Single Barrel]] is a tribute bottling drawn from barrels Elmer himself would have selected. Nine years, 90 proof, and a gentle, elegant profile - honey, light oak, orange oil, a clean finish.",
      },
      {
        type: "paragraph",
        text: "At $80 it closes this list where it should close: with the reminder that the best bourbon bottle is very often not the most expensive one on the shelf.",
      },
      {
        type: "list",
        items: [
          "Age: 9 years - Proof: 90 (45% ABV) - Single barrel",
          "Our price: $80 - Rating: 4.8",
          "Status: allocated",
        ],
      },

      { type: "heading", level: 2, text: "What Allocated Actually Means" },
      {
        type: "paragraph",
        text: "Every list calls these bottles allocated and none of them explain it, so here is the mechanism in plain terms. The volume of a 15 year old bourbon available in 2026 was fixed in 2011, when someone filled a finite number of barrels and had to guess at demand a decade and a half ahead. Nothing can increase that number now. Distilleries therefore assign fixed quantities to each state distributor, and distributors assign fixed quantities to individual retailers.",
      },
      {
        type: "paragraph",
        text: "The consequence is the part people find hardest to accept: a retailer cannot order more. When we receive six bottles of a BTAC release for the entire year, no amount of ordering produces a seventh. Retailers then distribute their allocation by lottery, by waitlist, by loyalty history, or by bundling - and every one of those methods leaves most customers disappointed, because the arithmetic guarantees it.",
      },
      {
        type: "callout",
        title: "The practical upshot",
        text: "Chasing one specific bottle is the most expensive and least satisfying way to build a bourbon shelf. Learning which profile you like - wheated or high rye, 90 proof or barrel strength - and then buying the best available bottle in that profile will get you a better shelf, faster, for less money. That is what the next section is for.",
      },

      { type: "heading", level: 2, text: "If You Cannot Find It, Drink This Instead" },
      {
        type: "paragraph",
        text: "This is the section every other guide omits, and it is the most useful thing on this page. Each line below pairs a bottle from the ranking with the closest thing we can realistically supply, chosen on flavour profile rather than on prestige.",
      },
      {
        type: "list",
        items: [
          "Instead of Pappy 15, try [[product:van-winkle-lot-b-12-year|Van Winkle Special Reserve Lot B 12 Year]] at $300 - the same wheated house style at 90.4 proof, and usually obtainable.",
          "Instead of William Larue Weller, try [[product:weller-full-proof|W.L. Weller Full Proof]] at $150 - 114 proof, uncut, the closest barrel strength wheater we can keep on a shelf.",
          "Instead of George T. Stagg, try [[product:stagg-bourbon|Stagg]] at $150 or [[product:eh-taylor-barrel-proof|E.H. Taylor Barrel Proof]] at $100 - both above 130 proof with the same concentrated character.",
          "Instead of Eagle Rare 17 Year, try [[product:eagle-rare-12-year|Eagle Rare 12 Year]] at $70 or [[product:eagle-rare-10-year|Eagle Rare 10 Year]] at $40 - the same restrained, oak-led profile for a fraction of the outlay.",
          "Instead of Blanton's Original, try [[product:blantons-gold-edition|Blanton's Gold Edition]] at $100 or [[product:rock-hill-farms-single-barrel|Rock Hill Farms Single Barrel]] at $100 - both higher proof, both from the same mash bill.",
          "Instead of Elmer T. Lee, try [[product:eh-taylor-small-batch|E.H. Taylor Small Batch]] at $80 - bottled in bond at 100 proof, similarly elegant and similarly priced.",
          "Instead of Weller 12 Year, try [[product:weller-cypb|Weller CYPB]] at $200 - the fan-designed wheater, if you want to trade value for something more unusual.",
        ],
      },
      {
        type: "paragraph",
        text: "If you want the whole range in front of you rather than a curated ten, the full [[product:weller-single-barrel|hand-selected single barrel]] and antique collection bottlings sit alongside these in our catalogue.",
      },

      { type: "heading", level: 2, text: "How to Spot a Fake Before You Pay" },
      {
        type: "paragraph",
        text: "Once a bottle trades for several times its retail price, counterfeiting becomes profitable, and Van Winkle bottles in particular are refilled and resold constantly. Buffalo Trace has published guidance on this and the checks are ones you can perform in a few seconds with the bottle in your hand.",
      },
      {
        type: "list",
        ordered: true,
        items: [
          "Check the capsule colour against the expression. Each Van Winkle age has a specific capsule and label pairing; a mismatch between the face label and the colour of the top is the single most common tell.",
          "Inspect the tax and security strip across the cap. It should be intact, aligned and unbroken, and on many bottles it carries a serial number. Resealed, reprinted or misaligned strips mean the bottle has been opened.",
          "Look at the cap itself. A wrinkled, crooked or slightly melted foil is the signature of a bottle refilled and resealed with a heat gun.",
          "Read the fill level. A genuine 750ml bottle fills to between the shoulder and the neck, typically within 5 to 8mm of the base of the neck. A low fill on a supposedly unopened bottle is a refill.",
          "Measure the label placement by eye. Authentic labels are applied to tight tolerances; variation of even 2 to 3mm from known-good photographs is a warning sign.",
          "Match the bottle number and release year against published records. Every Van Winkle bottle is numbered and tied to a specific year.",
        ],
      },
      {
        type: "callout",
        title: "The simplest protection",
        text: "Buy from a retailer who accepts returns and can tell you which distributor the case came from. A private sale at a car park with cash and no recourse is where almost every counterfeit story begins.",
      },

      { type: "heading", level: 2, text: "What These Bottles Should Actually Cost" },
      {
        type: "paragraph",
        text: "Two things have moved at once over the past few years. Retail prices on allocated bourbon have risen, and secondary market prices have softened from their peak. The gap between what a bottle is meant to cost and what it trades for is narrower than it was in 2021, which is good news for drinkers and irritating news for anyone who bought purely as an investment.",
      },
      {
        type: "paragraph",
        text: "At genuine retail, almost every bottle on this list is worth buying. At two or three times retail, only a few are - and Eagle Rare 17 Year is the clearest example of a bottle whose current price reflects collector demand rather than what is in the glass. A final piece of received wisdom worth repeating: do not buy a brand new release on the secondary market in its first two to four weeks. Early prices are set by scarcity panic and almost always fall.",
      },

      { type: "heading", level: 2, text: "Where to Start" },
      {
        type: "paragraph",
        text: "If you are buying your first serious bottle, buy [[product:weller-12-year|Weller 12 Year]]. If you already know you like wheated bourbon and want to understand the ceiling, buy [[product:pappy-van-winkle-15-year|Pappy Van Winkle 15 Year]]. If you like your whiskey loud, buy [[product:eh-taylor-barrel-proof|E.H. Taylor Barrel Proof]] and add water slowly. Everything else on this list is a variation on those three decisions.",
      },
    ],
    seo: {
      metaTitle: "The 10 Best Bourbon Bottles (2026) - Ranked Buying Guide",
      metaDescription:
        "The 10 best bourbon bottles ranked on taste, with full proof and age specs, how allocation really works, what to buy when they are sold out, and how to spot a fake.",
      focusKeyword: "best bourbon bottles",
      primaryKeywords: [
        "best bourbon bottles",
        "best bourbon",
        "allocated bourbon",
        "best bourbon to buy",
        "top bourbon brands",
        "Pappy Van Winkle",
        "Buffalo Trace Antique Collection",
        "wheated bourbon",
        "barrel proof bourbon",
        "best bourbon under 100",
      ],
      longTailKeywords: [
        "what are the best bourbon bottles to buy",
        "best bourbon bottles ranked 2026",
        "what does allocated bourbon mean",
        "why is Pappy Van Winkle so hard to find",
        "what to buy instead of Pappy Van Winkle",
        "is Weller 12 year worth it",
        "how to spot a fake Pappy Van Winkle bottle",
        "difference between wheated and high rye bourbon",
        "is Eagle Rare 17 worth the price",
        "best barrel proof bourbon to buy",
        "poor mans pappy weller 12",
        "how does bourbon allocation work",
      ],
      wordClusters: [
        {
          cluster: "Allocated & Rare Bourbon",
          terms: [
            "allocated bourbon",
            "BTAC",
            "Buffalo Trace Antique Collection",
            "limited release",
            "bourbon lottery",
            "secondary market",
            "MSRP",
            "bottle allocation",
          ],
        },
        {
          cluster: "Mash Bill & Style",
          terms: [
            "wheated bourbon",
            "high rye bourbon",
            "single barrel",
            "small batch",
            "barrel proof",
            "cask strength",
            "bottled in bond",
            "non-chill filtered",
          ],
        },
        {
          cluster: "Tasting & Proof",
          terms: [
            "proof",
            "ABV",
            "age statement",
            "tasting notes",
            "adding water to bourbon",
            "hazmat proof",
            "finish",
          ],
        },
        {
          cluster: "Authenticity & Buying",
          terms: [
            "counterfeit bourbon",
            "fake Pappy Van Winkle",
            "tax strip",
            "capsule colour",
            "fill level",
            "bottle number",
            "buying allocated bourbon",
          ],
        },
      ],
    },
    relatedProducts: [
      "pappy-van-winkle-15-year",
      "william-larue-weller",
      "george-t-stagg",
      "eagle-rare-17-year",
      "weller-12-year",
      "blantons-original-single-barrel",
      "eh-taylor-barrel-proof",
      "russells-reserve-13-year",
      "pappy-10",
      "elmer-t-lee-single-barrel",
    ],
    faq: [
      {
        question: "What is the best bourbon bottle you can buy right now?",
        answer:
          "On flavour alone, Pappy Van Winkle Family Reserve 15 Year. On value, Weller 12 Year at $100 delivers the same wheated house style from the same distillery for a fifth of the price, and is far easier to obtain.",
      },
      {
        question: "What does allocated bourbon mean?",
        answer:
          "It means the quantity available was fixed years ago when the barrels were filled, so distilleries assign fixed amounts to distributors and distributors assign fixed amounts to retailers. A shop cannot order more, which is why allocated bottles are sold by lottery, waitlist or loyalty rather than simply stocked.",
      },
      {
        question: "What should I buy instead of Pappy Van Winkle?",
        answer:
          "Van Winkle Special Reserve Lot B 12 Year is the same wheated house style at 90.4 proof. For a barrel strength version of that profile, W.L. Weller Full Proof at 114 proof is the closest substitute we can keep in stock. Weller 12 Year is the value option.",
      },
      {
        question: "Is Weller 12 Year really poor mans Pappy?",
        answer:
          "It shares the wheated mash bill and the same Buffalo Trace warehouses as the Van Winkle line, and carries a genuine 12 year age statement at 90 proof. It is not as deep or as long as Pappy 15, but it is the best quality-to-price ratio in allocated bourbon.",
      },
      {
        question: "How can I tell if a Pappy Van Winkle bottle is fake?",
        answer:
          "Check that the capsule colour matches the expression, that the tax strip across the cap is intact and aligned, that the foil is not wrinkled or crooked, and that the fill sits within 5 to 8mm of the base of the neck. Then match the bottle number against the published release year.",
      },
      {
        question: "Is Eagle Rare 17 Year worth the price?",
        answer:
          "As whiskey, it is superb - seventeen years carried at only 101 proof with unusual elegance. As a purchase, its current price reflects collector demand more than drinking value. Eagle Rare 12 Year at $70 gives you much of the same character for far less.",
      },
    ],
  },
  // ─────────────────────────────────────────────────────────────────────────
  // 5. Bourbon vs Whiskey — Fundamentals
  // ─────────────────────────────────────────────────────────────────────────
  {
    slug: "bourbon-vs-whiskey-explained",
    title: "Bourbon vs Whiskey: What Actually Makes a Bourbon",
    subtitle:
      "All bourbon is whiskey. Almost none of what people believe about the difference is written into the law.",
    excerpt:
      "It does not have to come from Kentucky. It does not have to be aged a minimum number of years. Here is what the federal standard actually requires, what it forbids, and why those six rules produce the flavour you recognise.",
    category: "Fundamentals",
    author: "Eleanor Hayes",
    authorTitle: "Master Distiller, Bourbon & Oak",
    publishedAt: "2026-08-14",
    readTimeMinutes: 9,
    heroImage: "/image1.webp",
    heroAlt:
      "Charred American white oak barrel head stamped with a bourbon mash bill and fill date",
    tags: [
      "bourbon vs whiskey",
      "what is bourbon",
      "straight bourbon",
      "bottled in bond",
      "mash bill",
      "charred oak",
    ],
    content: [
      {
        type: "paragraph",
        text: "The most common question we get asked across the counter is what separates bourbon from whiskey, and the honest answer surprises people: nothing separates them, because bourbon is whiskey. It is a subcategory, in the same way that a Cabernet is a wine. The useful question is narrower - what does a whiskey have to do to earn the word bourbon on its label - and unlike most drinks marketing, that has a precise legal answer.",
      },
      {
        type: "paragraph",
        text: "In the United States, the Standards of Identity for Distilled Spirits set out exactly six requirements. Meet all six and you may call it bourbon. Miss any one and you may not, however good the whiskey is.",
      },
      { type: "heading", level: 2, text: "The Six Rules" },
      {
        type: "list",
        ordered: true,
        items: [
          "Made in the United States. Not Kentucky - anywhere in the US. Kentucky makes roughly 95 percent of it by long tradition and good limestone water, but a bourbon distilled in Texas or New York is no less a bourbon.",
          "Mash bill of at least 51 percent corn. The remaining 49 percent is the distiller's signature, and it is where wheated and high-rye styles diverge.",
          "Distilled to no more than 160 proof. Distil higher and you strip out the congeners that carry flavour, which is the difference between whiskey and vodka.",
          "Entered into the barrel at no more than 125 proof. Lower entry proof means more water in the barrel and a different extraction of sugars from the wood.",
          "Aged in new, charred oak containers. New is the expensive word here. Scotch may reuse barrels for decades; every drop of bourbon requires a fresh charred cask, which is why the used barrels end up filled with scotch, rum and tequila.",
          "Bottled at 80 proof or higher, with nothing added but water. No colouring, no flavouring, no sweetening. The colour in your glass came out of the wood.",
        ],
      },
      {
        type: "callout",
        title: "Note what is not on that list",
        text: "There is no minimum age. A bourbon aged for one day in a new charred barrel is legally bourbon. The age requirements people assume exist belong to the tighter categories below - which is exactly why those categories are worth knowing.",
      },
      { type: "heading", level: 2, text: "Straight, Bonded, and the Categories That Actually Mean Something" },
      {
        type: "paragraph",
        text: "Straight bourbon adds a minimum of two years in the barrel, and forbids added colouring or flavouring outright. If a straight bourbon is under four years old, the label must state its age. That single rule is why so many bottles carry no age statement at all: once past four years, the producer may stay silent.",
      },
      {
        type: "paragraph",
        text: "Bottled in Bond goes further, and it is the most demanding label in American whiskey. It comes from the Bottled-in-Bond Act of 1897, passed as consumer protection legislation decades before the Food and Drug Administration existed, at a time when adulterated whiskey was a genuine public health problem. A bonded bourbon must be the product of one distillation season, from one distillery, aged at least four years in a federally supervised warehouse, and bottled at exactly 100 proof. The [[product:eh-taylor-small-batch|Colonel E.H. Taylor, Jr. Small Batch]] is built on precisely that standard, and the whole Taylor range is named for the man who campaigned for the Act.",
      },
      { type: "heading", level: 2, text: "Bourbon, Rye, Tennessee, Scotch" },
      {
        type: "paragraph",
        text: "Rye whiskey flips the grain requirement: at least 51 percent rye instead of corn. Everything else - new charred oak, the proof ceilings - stays the same. The result is drier, peppery and more herbal where bourbon is sweet and round. Pour a [[product:thomas-h-handy-sazerac|Thomas H. Handy Sazerac]] next to any bourbon on your shelf and the difference is immediate and instructive; it is the single fastest way to learn what corn is contributing.",
      },
      {
        type: "paragraph",
        text: "Tennessee whiskey meets every bourbon requirement and then adds one: the Lincoln County Process, filtering the new spirit through sugar maple charcoal before barrelling. Scotch is a different animal entirely - malted barley rather than corn, aged at least three years, and typically in used casks, which is why it tastes of the wood far less aggressively than bourbon does.",
      },
      { type: "heading", level: 2, text: "Why the Rules Produce the Flavour" },
      {
        type: "paragraph",
        text: "Two of the six rules do most of the sensory work. The corn minimum supplies sweetness and body. The new charred oak supplies everything else. Charring the inside of a fresh cask caramelises the wood sugars into a layer that gives up vanillin, lactones and tannins to the spirit over years of Kentucky temperature swings - vanilla, caramel, baking spice, toasted nut. A used barrel has already surrendered most of that. A new one has all of it to give, which is why bourbon develops so much character in a decade while scotch often needs longer.",
      },
      {
        type: "paragraph",
        text: "That is also why bourbon rewards patience rather than requiring it. Something like [[product:eagle-rare-10-year|Eagle Rare 10 Year]] shows what a decade in new oak does at an accessible price, while the older expressions in the [[link:/collection|allocated collection]] show where the same process ends up after fifteen or twenty years.",
      },
      { type: "heading", level: 2, text: "Where to Take This Next" },
      {
        type: "paragraph",
        text: "Once the definitions are clear, the interesting question becomes what that other 49 percent of the mash bill is doing - which is the difference between a soft, honeyed wheated bourbon and a spicy high-rye one. We cover that in [[link:/blog/wheated-vs-high-rye-bourbon|the mash bill guide]]. If you would rather start with a glass in your hand, our [[link:/blog/how-to-taste-bourbon|tasting guide]] is the practical companion, and the full range sits in the [[link:/shop|shop]].",
      },
    ],
    seo: {
      metaTitle: "Bourbon vs Whiskey: What Actually Makes a Bourbon",
      metaDescription:
        "All bourbon is whiskey, but only whiskey meeting six federal rules is bourbon. The corn minimum, new charred oak, straight vs bottled in bond, and how bourbon differs from rye and scotch.",
      focusKeyword: "bourbon vs whiskey",
      primaryKeywords: [
        "bourbon vs whiskey",
        "what is bourbon",
        "difference between bourbon and whiskey",
        "straight bourbon",
        "bottled in bond",
        "bourbon rules",
        "bourbon mash bill",
        "rye vs bourbon",
      ],
      longTailKeywords: [
        "what makes a bourbon a bourbon",
        "does bourbon have to be made in Kentucky",
        "what is the difference between bourbon and rye whiskey",
        "what does straight bourbon mean",
        "what does bottled in bond mean",
        "how much corn does bourbon need",
        "why is bourbon aged in new charred oak",
        "is Tennessee whiskey bourbon",
        "does bourbon have a minimum age",
        "bourbon vs scotch difference",
      ],
      wordClusters: [
        {
          cluster: "Legal Definition",
          terms: [
            "Standards of Identity",
            "51 percent corn",
            "160 proof distillation",
            "125 proof barrel entry",
            "new charred oak",
            "no additives",
            "Bottled-in-Bond Act 1897",
          ],
        },
        {
          cluster: "Whiskey Categories",
          terms: [
            "straight bourbon",
            "rye whiskey",
            "Tennessee whiskey",
            "Lincoln County Process",
            "single malt scotch",
            "American whiskey",
          ],
        },
        {
          cluster: "Flavour Chemistry",
          terms: [
            "congeners",
            "vanillin",
            "oak lactones",
            "tannins",
            "caramelised wood sugars",
            "char level",
          ],
        },
      ],
    },
    relatedProducts: [
      "eh-taylor-small-batch",
      "thomas-h-handy-sazerac",
      "eagle-rare-10-year",
      "weller-12-year",
    ],
    faq: [
      {
        question: "Is bourbon a whiskey?",
        answer:
          "Yes. Bourbon is a category of whiskey, the way Cabernet is a category of wine. All bourbon is whiskey; only whiskey meeting six specific federal requirements may be called bourbon.",
      },
      {
        question: "Does bourbon have to be made in Kentucky?",
        answer:
          "No. It must be made in the United States. Kentucky produces the overwhelming majority by tradition and because of its limestone water, but bourbon distilled anywhere in the US is legally bourbon.",
      },
      {
        question: "What is the difference between bourbon and rye whiskey?",
        answer:
          "The grain. Bourbon must be at least 51 percent corn, rye must be at least 51 percent rye. Both use new charred oak. Bourbon is sweeter and rounder; rye is drier, peppery and more herbal.",
      },
      {
        question: "What does bottled in bond mean?",
        answer:
          "One distillery, one distillation season, at least four years in a federally supervised warehouse, and bottled at exactly 100 proof. It comes from the Bottled-in-Bond Act of 1897 and is the strictest label in American whiskey.",
      },
      {
        question: "Does bourbon have a minimum age?",
        answer:
          "Plain bourbon has none. Straight bourbon requires two years, and must state its age if under four. Bottled in bond requires four.",
      },
    ],
  },
  // ─────────────────────────────────────────────────────────────────────────
  // 6. Wheated vs High-Rye — Mash Bill
  // ─────────────────────────────────────────────────────────────────────────
  {
    slug: "wheated-vs-high-rye-bourbon",
    title: "Wheated vs High-Rye Bourbon: How the Mash Bill Changes the Glass",
    subtitle:
      "Corn is the law. The second grain is the decision - and it is the one that determines whether you will actually like the bottle.",
    excerpt:
      "Every bourbon is at least 51 percent corn. What fills the rest decides almost everything you taste. Here is what wheat and rye each do, how to tell which you prefer, and which bottle to buy once you know.",
    category: "Fundamentals",
    author: "Eleanor Hayes",
    authorTitle: "Master Distiller, Bourbon & Oak",
    publishedAt: "2026-08-14",
    readTimeMinutes: 8,
    heroImage: "/image2.webp",
    heroAlt:
      "Grain samples of corn, winter wheat and rye laid out beside a glass of bourbon",
    tags: [
      "wheated bourbon",
      "high rye bourbon",
      "mash bill",
      "Weller",
      "Pappy Van Winkle",
      "flavour profile",
    ],
    content: [
      {
        type: "paragraph",
        text: "If you remember one thing about buying bourbon, make it this: find out whether you prefer wheat or rye as the second grain, and you will stop wasting money. Price, age and rarity tell you very little about whether a bottle suits your palate. The mash bill tells you almost everything.",
      },
      {
        type: "paragraph",
        text: "The law fixes only the corn: at least 51 percent, which supplies sweetness and body. Distillers then choose what fills the remainder, alongside a small amount of malted barley that provides the enzymes for fermentation. Two schools have emerged, and the gap between them is far wider than the gap between a good bourbon and a great one.",
      },
      { type: "heading", level: 2, text: "Wheated Bourbon: Soft, Round, Bakery" },
      {
        type: "paragraph",
        text: "Replace the rye with winter wheat and you remove the spice rather than adding a flavour. Wheat is a quiet grain. It contributes very little of its own character, which lets the corn sweetness and the oak come forward unopposed. The result is a bourbon that reads as soft, honeyed and gently bready - vanilla, caramel, baked apple, sometimes a note like warm shortbread.",
      },
      {
        type: "paragraph",
        text: "Wheated bourbon also tends to reward long ageing unusually well. Without rye spice to balance it, a young wheater can taste thin; give it twelve to fifteen years and the oak fills that space with leather, dark caramel and dried fruit. That is the entire logic of the Van Winkle range, and why [[product:pappy-van-winkle-15-year|Pappy Van Winkle 15 Year]] is built the way it is.",
      },
      {
        type: "paragraph",
        text: "If you want to learn the profile without the allocated price, [[product:weller-12-year|Weller 12 Year]] shares the mash bill and the warehouses at 90 proof. Move up to [[product:weller-full-proof|W.L. Weller Full Proof]] at 114 proof to see what the same recipe does undiluted, and [[product:william-larue-weller|William Larue Weller]] is where the style reaches its ceiling.",
      },
      { type: "heading", level: 2, text: "High-Rye Bourbon: Spice, Structure, Bite" },
      {
        type: "paragraph",
        text: "Rye is the opposite of a quiet grain. Even at fifteen or twenty percent of the mash it asserts itself - black pepper, mint, clove, a dry herbal edge that cuts across the corn sweetness. Where a wheater is a round shape in the mouth, a high-rye bourbon has corners.",
      },
      {
        type: "paragraph",
        text: "That structure is why high-rye bourbons make better cocktails. In an Old Fashioned or a Manhattan, the spice survives dilution and sugar where a delicate wheater simply disappears. [[product:blantons-original-single-barrel|Blanton's Original Single Barrel]] is the classic reference point, and at barrel strength [[product:george-t-stagg|George T. Stagg]] shows what the style becomes when nothing is held back. Outside the Buffalo Trace orbit, [[product:russells-reserve-13-year|Russell's Reserve 13 Year]] is the clearest expression of the Wild Turkey take on spice.",
      },
      {
        type: "callout",
        title: "The traditional middle",
        text: "Most bourbon is neither. A traditional mash bill runs roughly 70 to 75 percent corn with 10 to 15 percent rye - enough spice to give shape, not enough to lead. The Eagle Rare and E.H. Taylor lines sit in this territory, which is why they are such reliable first bottles: they show you what bourbon tastes like before you start choosing sides.",
      },
      { type: "heading", level: 2, text: "How to Find Out Which You Prefer" },
      {
        type: "paragraph",
        text: "Do not read about it. Buy two bottles at similar proof and taste them side by side on the same evening, in the same glass shape, with water available. Proof matters enormously here - comparing a 90 proof wheater against a 130 proof high-rye tells you about alcohol, not about grain.",
      },
      {
        type: "list",
        items: [
          "A fair wheated-versus-rye pairing at similar strength: [[product:weller-12-year|Weller 12 Year]] at 90 proof against [[product:blantons-original-single-barrel|Blanton's Original]] at 93 proof.",
          "The same comparison at full strength: [[product:weller-full-proof|Weller Full Proof]] at 114 proof against [[product:eh-taylor-barrel-proof|E.H. Taylor Barrel Proof]] at 131 proof, both with water to hand.",
          "A middle-of-the-road control to calibrate against: [[product:eagle-rare-10-year|Eagle Rare 10 Year]] at 90 proof.",
        ],
      },
      {
        type: "paragraph",
        text: "Whichever way you land, it will change what you buy for years. If the answer is wheat, the [[link:/collection|allocated collection]] is where the deep end of that style lives. If it is rye, the barrel proof bottles are where it gets interesting. Either way, [[link:/blog/how-to-taste-bourbon|our tasting guide]] explains how to run the comparison properly, and the [[link:/blog/best-bourbon-bottles-ranked|ranked buying guide]] tells you what each profile costs.",
      },
    ],
    seo: {
      metaTitle: "Wheated vs High-Rye Bourbon: Mash Bill Guide",
      metaDescription:
        "What wheat and rye each do to bourbon, why wheaters age so well, which style suits cocktails, and how to run a fair side-by-side to find out which you prefer.",
      focusKeyword: "wheated bourbon",
      primaryKeywords: [
        "wheated bourbon",
        "high rye bourbon",
        "bourbon mash bill",
        "wheated vs rye bourbon",
        "best wheated bourbon",
        "Weller mash bill",
        "bourbon flavour profile",
      ],
      longTailKeywords: [
        "what is a wheated bourbon",
        "wheated vs high rye bourbon difference",
        "why does Pappy Van Winkle use wheat",
        "which bourbon is best for old fashioned",
        "what does rye add to bourbon",
        "is Weller the same mash bill as Pappy",
        "best bourbon mash bill for beginners",
        "how to choose bourbon by flavour",
      ],
      wordClusters: [
        {
          cluster: "Grain & Recipe",
          terms: [
            "mash bill",
            "winter wheat",
            "rye grain",
            "malted barley",
            "corn percentage",
            "secondary grain",
            "traditional mash bill",
          ],
        },
        {
          cluster: "Flavour Vocabulary",
          terms: [
            "honeyed",
            "black pepper",
            "clove",
            "baked apple",
            "caramel",
            "herbal",
            "dry finish",
            "mouthfeel",
          ],
        },
        {
          cluster: "Style Comparison",
          terms: [
            "wheated bourbon brands",
            "high rye bourbon brands",
            "barrel proof",
            "cocktail bourbon",
            "sipping bourbon",
            "side by side tasting",
          ],
        },
      ],
    },
    relatedProducts: [
      "weller-12-year",
      "weller-full-proof",
      "blantons-original-single-barrel",
      "george-t-stagg",
      "russells-reserve-13-year",
      "eagle-rare-10-year",
    ],
    faq: [
      {
        question: "What is a wheated bourbon?",
        answer:
          "A bourbon whose secondary grain is winter wheat rather than rye. Wheat contributes little flavour of its own, which lets corn sweetness and oak come forward - producing a softer, honeyed, bready profile. Weller and Van Winkle are the best known examples.",
      },
      {
        question: "Is Weller the same mash bill as Pappy Van Winkle?",
        answer:
          "Both are wheated bourbons produced at Buffalo Trace from the same wheated recipe and aged in the same warehouses. The differences come down to age, barrel selection and proof, which is why Weller 12 Year is often called poor mans Pappy.",
      },
      {
        question: "Which bourbon is better for an Old Fashioned?",
        answer:
          "A high-rye bourbon. Rye spice survives dilution and sugar, so the drink keeps its structure. A delicate wheated bourbon tends to disappear behind the bitters and sugar.",
      },
      {
        question: "Why do wheated bourbons age so well?",
        answer:
          "Without rye spice occupying the mid-palate, a young wheater can taste thin. Extended time in new charred oak fills that space with leather, dark caramel and dried fruit, which is why the wheated style dominates the very old age statements.",
      },
    ],
  },
  // ─────────────────────────────────────────────────────────────────────────
  // 7. How to Taste Bourbon — Practical
  // ─────────────────────────────────────────────────────────────────────────
  {
    slug: "how-to-taste-bourbon",
    title: "How to Taste Bourbon Properly",
    subtitle:
      "Glass, water, temperature and the Kentucky chew - the practical mechanics that get more out of a bottle you already own.",
    excerpt:
      "Most people taste bourbon in a way that guarantees they miss most of it. Nosing technique, the right glass, how much water to add and when, and how to build a flight that does not exhaust your palate by the third pour.",
    category: "Fundamentals",
    author: "Wyatt Brennan",
    authorTitle: "Head Bartender, The Cellar at Bourbon & Oak",
    publishedAt: "2026-08-14",
    readTimeMinutes: 8,
    heroImage: "/image3.webp",
    heroAlt:
      "Glencairn nosing glass of bourbon on a bar top beside a small pitcher of water",
    tags: [
      "how to taste bourbon",
      "bourbon tasting",
      "Glencairn",
      "adding water to bourbon",
      "Kentucky chew",
      "tasting notes",
    ],
    content: [
      {
        type: "paragraph",
        text: "There is a version of whiskey tasting that is entirely theatre, and it puts sensible people off the whole business. This is not that. Everything below changes what you actually perceive in the glass, and most of it costs nothing.",
      },
      { type: "heading", level: 2, text: "1. The Glass Matters More Than the Bottle" },
      {
        type: "paragraph",
        text: "A rocks tumbler has a wide mouth, which lets aromatics escape before they reach you. A tulip-shaped nosing glass - a Glencairn or a small copita - narrows toward the rim and concentrates them. Swapping glassware is the single largest improvement most drinkers can make, and it is more consequential than moving up a price tier in bottles. Serve the same whiskey in both, side by side, and the difference is not subtle.",
      },
      { type: "heading", level: 2, text: "2. Nose With Your Mouth Open" },
      {
        type: "paragraph",
        text: "Bourbon at 90 to 130 proof carries enough ethanol to numb the olfactory receptors if you inhale sharply through the nose. Instead, hold the glass a little below your chin, part your lips, and breathe in gently through both nose and mouth at once. The alcohol vapour vents through the mouth while the aromatic compounds reach the nose. Take short breaks - your nose fatigues within seconds on high-proof spirits.",
      },
      { type: "heading", level: 2, text: "3. The Kentucky Chew" },
      {
        type: "paragraph",
        text: "Named for Booker Noe, who tasted this way for decades. Take a small sip, then work it around the whole mouth as though chewing, coating the tongue, gums and palate before swallowing. It sounds affected and it is enormously effective, because it defeats the alcohol burn that otherwise dominates the first sip and lets the actual flavours register. Expect the first pour of any session to be mostly heat - that is normal. The second tells the truth.",
      },
      { type: "heading", level: 2, text: "4. Water Is Not Cheating" },
      {
        type: "paragraph",
        text: "Adding a few drops of water lowers the alcohol concentration and breaks the surface tension, releasing aromatic compounds that were previously bound up. On a barrel proof bourbon this is not optional - it is how the whiskey was designed to be assessed. Add water a drop at a time, taste after each, and stop the moment the whiskey opens rather than thinning.",
      },
      {
        type: "paragraph",
        text: "The demonstration worth doing at home: pour [[product:eh-taylor-barrel-proof|E.H. Taylor Barrel Proof]] at 131 proof, taste it neat, then add three drops and taste again. Very little else teaches the lesson so quickly. Ice is a different matter - it dilutes as it melts, so you never taste the same drink twice, and the cold suppresses aromatics. Excellent on a hot afternoon, useless for evaluation.",
      },
      { type: "heading", level: 2, text: "5. Build the Flight in the Right Order" },
      {
        type: "paragraph",
        text: "Palate fatigue is real and it arrives faster than people expect. Three whiskeys is a good session; five is the practical maximum. Always run from lowest proof to highest - a 130 proof barrel strength bourbon will flatten your palate for anything gentler that follows.",
      },
      {
        type: "list",
        ordered: true,
        items: [
          "Start gentle: [[product:eagle-rare-10-year|Eagle Rare 10 Year]] at 90 proof, to set a baseline.",
          "Change the grain, hold the strength: [[product:weller-12-year|Weller 12 Year]] at 90 proof, wheated, so the only variable is the mash bill.",
          "Step up the proof: [[product:blantons-original-single-barrel|Blanton's Original]] at 93 proof, then finish with something at barrel strength.",
        ],
      },
      {
        type: "callout",
        title: "Two practical rules",
        text: "Plain water between pours, not sparkling - carbonation irritates the palate. And write one honest line per whiskey before you discuss it with anyone else. Tasting notes are extraordinarily suggestible; once somebody says cherry, everyone tastes cherry.",
      },
      { type: "heading", level: 2, text: "6. Vocabulary Is a Tool, Not a Test" },
      {
        type: "paragraph",
        text: "Nobody is scoring you. The purpose of naming what you taste is to make the memory retrievable, so that next time you can buy deliberately rather than hopefully. Four questions are enough: is it sweet or dry, is it spicy or soft, is the finish short or long, and would you buy it again. Anyone able to answer those consistently is tasting better than most people who can recite a wheel of descriptors.",
      },
      {
        type: "paragraph",
        text: "If you would like to do this with someone talking you through it, our [[link:/tours|distillery tour and tasting]] runs a guided flight in the rickhouse. To understand what you are comparing before you pour, start with [[link:/blog/wheated-vs-high-rye-bourbon|the mash bill guide]], and [[link:/blog/best-bourbon-bottles-ranked|the ranked buying guide]] covers what to stock once you know your preference. The full range is in the [[link:/shop|shop]].",
      },
    ],
    seo: {
      metaTitle: "How to Taste Bourbon Properly: Glass, Water and Technique",
      metaDescription:
        "Nosing with your mouth open, the Kentucky chew, how much water to add to barrel proof bourbon, the right glass, and how to order a tasting flight without palate fatigue.",
      focusKeyword: "how to taste bourbon",
      primaryKeywords: [
        "how to taste bourbon",
        "how to drink bourbon",
        "bourbon tasting guide",
        "adding water to bourbon",
        "Glencairn glass",
        "Kentucky chew",
        "bourbon tasting flight",
      ],
      longTailKeywords: [
        "how do you properly taste bourbon",
        "should you add water to bourbon",
        "how much water to add to barrel proof bourbon",
        "what glass is best for bourbon",
        "what is the Kentucky chew",
        "how to drink bourbon neat",
        "is it bad to put ice in bourbon",
        "how many whiskeys in a tasting flight",
        "how to write bourbon tasting notes",
      ],
      wordClusters: [
        {
          cluster: "Technique",
          terms: [
            "nosing",
            "Kentucky chew",
            "retro-nasal",
            "palate fatigue",
            "neat pour",
            "dilution",
            "surface tension",
          ],
        },
        {
          cluster: "Glassware & Service",
          terms: [
            "Glencairn",
            "copita",
            "rocks glass",
            "tulip glass",
            "serving temperature",
            "large ice cube",
          ],
        },
        {
          cluster: "Assessment",
          terms: [
            "nose",
            "palate",
            "finish",
            "mouthfeel",
            "tasting notes",
            "flight order",
            "blind tasting",
          ],
        },
      ],
    },
    relatedProducts: [
      "eagle-rare-10-year",
      "weller-12-year",
      "blantons-original-single-barrel",
      "eh-taylor-barrel-proof",
    ],
    faq: [
      {
        question: "Should you add water to bourbon?",
        answer:
          "Yes, particularly above about 100 proof. A few drops lower the alcohol concentration and break surface tension, releasing aromatic compounds. Add one drop at a time and stop when the whiskey opens rather than thins.",
      },
      {
        question: "What is the best glass for tasting bourbon?",
        answer:
          "A tulip-shaped nosing glass such as a Glencairn or copita. The narrowing rim concentrates aromatics, where a wide rocks tumbler lets them escape. It is a bigger improvement than spending more on the bottle.",
      },
      {
        question: "What is the Kentucky chew?",
        answer:
          "A technique associated with Booker Noe: take a small sip and work it around the entire mouth as though chewing before swallowing. It coats the palate and defeats the initial alcohol burn so the flavours register.",
      },
      {
        question: "Is it wrong to drink bourbon with ice?",
        answer:
          "Not at all, but it is poor for evaluation. Ice dilutes continuously so the drink never stays the same, and cold suppresses aromatics. Taste neat or with a few drops of water first, then add ice if you prefer it.",
      },
      {
        question: "How many bourbons should be in a tasting flight?",
        answer:
          "Three is ideal and five is the practical maximum before palate fatigue. Always work from the lowest proof upward, with plain still water between pours.",
      },
    ],
  },
  // ─────────────────────────────────────────────────────────────────────────
  // 8. Storage & Collecting — Practical
  // ─────────────────────────────────────────────────────────────────────────
  {
    slug: "how-to-store-bourbon",
    title: "How to Store Bourbon (And Whether It Actually Goes Bad)",
    subtitle:
      "Upright, out of the light, and away from the radiator. What genuinely damages a bottle, and what is superstition.",
    excerpt:
      "An unopened bottle of bourbon will not improve in the glass and does not age like wine - but it can absolutely be ruined. Cork failure, light, heat cycling and the half-empty bottle problem, explained.",
    category: "Collecting",
    author: "Eleanor Hayes",
    authorTitle: "Master Distiller, Bourbon & Oak",
    publishedAt: "2026-08-14",
    readTimeMinutes: 7,
    heroImage: "/image4.webp",
    heroAlt:
      "Bourbon bottles stored upright on a dark wooden shelf away from direct sunlight",
    tags: [
      "how to store bourbon",
      "does bourbon go bad",
      "bourbon collecting",
      "cork failure",
      "oxidation",
    ],
    content: [
      {
        type: "paragraph",
        text: "Bourbon stops ageing the moment it leaves the barrel. A twelve year old bourbon bought today will still be a twelve year old bourbon in 2046 - the glass contributes nothing, unlike the wood. That is the good news. The less good news is that while a bottle cannot improve, it can certainly deteriorate, and the three things that damage it are all avoidable.",
      },
      { type: "heading", level: 2, text: "Store It Upright. Always." },
      {
        type: "paragraph",
        text: "This is the one rule that people carry over from wine and get exactly backwards. Wine is stored on its side to keep the cork wet, because wine is only about 13 percent alcohol. Bourbon is 40 to 70 percent, and sustained contact at that strength degrades cork - it softens, crumbles, and eventually taints the whiskey or fails entirely when you try to open it. A ruined cork on an allocated bottle is a genuinely expensive mistake.",
      },
      {
        type: "paragraph",
        text: "Store every bottle standing up. If you want to keep the cork from drying out completely over many years, tip the bottle briefly once or twice a year to wet it, then stand it back up. That is the whole technique.",
      },
      { type: "heading", level: 2, text: "Light and Heat Do the Real Damage" },
      {
        type: "paragraph",
        text: "Ultraviolet light breaks down the compounds that give bourbon its colour and much of its aroma. A bottle left in direct sun will visibly fade over months, and the whiskey flattens along with the colour. A display shelf by a window is the worst place in most homes.",
      },
      {
        type: "paragraph",
        text: "Heat cycling is the quieter problem. Repeated warming and cooling expands and contracts the liquid and the air above it, pushing vapour past the closure and drawing air back in. Over years this evaporates volume and dulls the spirit. A cupboard on an interior wall, somewhere between 15 and 21 degrees Celsius and reasonably stable, beats any decorative bar cart in a conservatory.",
      },
      {
        type: "callout",
        title: "On decanters",
        text: "A cut crystal decanter looks wonderful and is a poor storage vessel. Ground glass stoppers rarely seal well, so the contents oxidise faster, and antique lead crystal can leach lead into a spirit over long contact. Decant for the evening if you like the ritual; keep the whiskey in its bottle.",
      },
      { type: "heading", level: 2, text: "The Half-Empty Bottle Problem" },
      {
        type: "paragraph",
        text: "Once opened, the enemy is oxygen, and what matters is not how long the bottle has been open but how much air is in it. A bottle with an inch of whiskey left has an enormous headspace of air relative to liquid, and will noticeably flatten within a few months. The same bottle three-quarters full is stable for years.",
      },
      {
        type: "list",
        items: [
          "Above about two thirds full: essentially stable, drink at your leisure.",
          "Between a third and two thirds: still good, but aim to finish within a year or so.",
          "Below a third: oxidation accelerates sharply. Finish it, or decant into a smaller bottle so the liquid fills it.",
          "For a bottle you want to preserve, wrap the closure with parafilm to slow vapour loss, and keep it upright and dark like the rest.",
        ],
      },
      {
        type: "paragraph",
        text: "Decanting the last third into a clean 200ml bottle is the single most effective trick here, and it costs nothing. It is worth the trouble on anything from the [[link:/collection|allocated collection]] - watching the last of a [[product:pappy-van-winkle-15-year|Pappy Van Winkle 15 Year]] go dull in a nearly empty bottle is a needless loss.",
      },
      { type: "heading", level: 2, text: "Does Unopened Bourbon Go Bad?" },
      {
        type: "paragraph",
        text: "Practically, no. Stored upright, dark and cool, a sealed bottle of bourbon will be indistinguishable in thirty years. There is no expiry date and no drink-by window. What can fail is the closure, not the whiskey - which is why an old bottle with a low fill level should be treated with suspicion, whether it has simply lost volume through a tired cork or been tampered with.",
      },
      {
        type: "paragraph",
        text: "That last point matters if you are buying rare bottles rather than only drinking them. Fill level is one of the standard authenticity checks, and we cover the rest of them in [[link:/blog/best-bourbon-bottles-ranked|the ranked buying guide]]. If you are building a collection deliberately, the bottles most worth storing properly are the ones in the [[link:/collection|limited and allocated range]] - things like [[product:double-eagle-very-rare|Double Eagle Very Rare 20 Year]] or [[product:george-t-stagg|George T. Stagg]], where a failed cork costs real money.",
      },
      { type: "heading", level: 2, text: "The Short Version" },
      {
        type: "list",
        items: [
          "Upright, never on its side.",
          "Out of direct light - a closed cupboard beats a display shelf.",
          "Stable temperature, ideally 15 to 21 degrees Celsius, away from radiators, ovens and windows.",
          "Keep it in its own bottle, not a decanter.",
          "Once a bottle drops below a third, finish it or move it into something smaller.",
        ],
      },
      {
        type: "paragraph",
        text: "Get those five right and every bottle you own will taste the way the distiller intended for as long as you care to keep it. Browse what is worth keeping in the [[link:/shop|shop]], or read [[link:/blog/how-to-taste-bourbon|how to taste it]] once it is open.",
      },
    ],
    seo: {
      metaTitle: "How to Store Bourbon (And Does Bourbon Go Bad?)",
      metaDescription:
        "Why bourbon must be stored upright, what light and heat cycling do to it, how fast an opened bottle oxidises, and whether unopened bourbon ever goes bad.",
      focusKeyword: "how to store bourbon",
      primaryKeywords: [
        "how to store bourbon",
        "does bourbon go bad",
        "storing whiskey upright",
        "bourbon shelf life",
        "opened bourbon oxidation",
        "bourbon collecting storage",
      ],
      longTailKeywords: [
        "should bourbon be stored upright or on its side",
        "does unopened bourbon go bad",
        "how long does an open bottle of bourbon last",
        "what temperature should bourbon be stored at",
        "does sunlight ruin bourbon",
        "is it bad to keep bourbon in a decanter",
        "how to stop bourbon oxidising",
        "does bourbon age in the bottle",
      ],
      wordClusters: [
        {
          cluster: "Storage Conditions",
          terms: [
            "upright storage",
            "UV light",
            "heat cycling",
            "stable temperature",
            "humidity",
            "dark cupboard",
          ],
        },
        {
          cluster: "Bottle Chemistry",
          terms: [
            "oxidation",
            "headspace",
            "evaporation",
            "cork degradation",
            "parafilm",
            "fill level",
          ],
        },
        {
          cluster: "Collecting",
          terms: [
            "allocated bourbon",
            "bottle preservation",
            "decanting",
            "collection storage",
            "authenticity",
            "secondary market",
          ],
        },
      ],
    },
    relatedProducts: [
      "pappy-van-winkle-15-year",
      "double-eagle-very-rare",
      "george-t-stagg",
      "weller-12-year",
    ],
    faq: [
      {
        question: "Should bourbon be stored upright or on its side?",
        answer:
          "Always upright. Bourbon is 40 to 70 percent alcohol, and sustained contact at that strength degrades cork, eventually tainting the whiskey or causing the cork to fail. Storing on the side is a wine convention that does not transfer.",
      },
      {
        question: "Does unopened bourbon go bad?",
        answer:
          "No. Bourbon stops ageing when it leaves the barrel, so a sealed bottle kept upright, dark and cool will be effectively unchanged decades later. There is no expiry date. What can fail over time is the cork, not the whiskey.",
      },
      {
        question: "How long does an opened bottle of bourbon last?",
        answer:
          "It depends on how full it is rather than how long it has been open. Above two thirds full it is stable for years. Below a third, oxidation accelerates noticeably within months - finish it or decant into a smaller bottle.",
      },
      {
        question: "Is it bad to keep bourbon in a decanter?",
        answer:
          "For long-term storage, yes. Ground glass stoppers seldom seal well so the contents oxidise faster, and antique lead crystal can leach lead over prolonged contact. Decant for an evening if you enjoy it, but store the whiskey in its original bottle.",
      },
      {
        question: "Does bourbon age in the bottle?",
        answer:
          "No. All maturation happens in the charred oak barrel. Once bottled, a twelve year old bourbon remains a twelve year old bourbon no matter how long you keep it.",
      },
    ],
  },
  // ─────────────────────────────────────────────────────────────────────────
  // 9. How Bourbon Is Made — Fundamentals
  // ─────────────────────────────────────────────────────────────────────────
  {
    slug: "how-bourbon-is-made",
    title: "How Bourbon Is Made, Step by Step",
    subtitle:
      "From a truckload of corn to a bottle on your shelf - the seven stages, and the two that decide almost everything you taste.",
    excerpt:
      "Grain to glass, explained properly: mashing, the sour mash trick, fermentation, double distillation, the charred barrel, and the years in a rickhouse where Kentucky weather does the actual work.",
    category: "Fundamentals",
    author: "Eleanor Hayes",
    authorTitle: "Master Distiller, Bourbon & Oak",
    publishedAt: "2026-08-15",
    readTimeMinutes: 11,
    heroImage: "/blog-process.webp",
    heroAlt:
      "Backlit shelves of finished Kentucky bourbon in a distillery tasting room",
    tags: [
      "how bourbon is made",
      "bourbon production",
      "sour mash",
      "column still",
      "rickhouse",
      "angels share",
      "charred oak",
    ],
    content: [
      {
        type: "paragraph",
        text: "Bourbon is made from three ingredients - grain, water and yeast - and one enormously expensive piece of equipment that most people never think about: a brand new charred oak barrel that can only be used once. Everything below happens in service of getting spirit into that barrel in the right condition, and then leaving it alone for long enough.",
      },
      {
        type: "paragraph",
        text: "There are seven stages. Two of them account for the overwhelming majority of what you eventually taste, and they are not the ones people expect.",
      },
      { type: "heading", level: 2, text: "1. The Mash Bill" },
      {
        type: "paragraph",
        text: "The recipe. Federal law requires at least 51 percent corn; the rest is the distiller's decision. Corn brings sweetness and body. The secondary grain - winter wheat or rye - sets the character, and a small proportion of malted barley, usually around 5 percent, supplies the enzymes that will convert starch into fermentable sugar.",
      },
      {
        type: "paragraph",
        text: "This single choice separates a soft, honeyed wheated bourbon from a peppery high-rye one, and it matters more to whether you will enjoy a bottle than age or price does. We go deeper on that in [[link:/blog/wheated-vs-high-rye-bourbon|the mash bill guide]].",
      },
      { type: "heading", level: 2, text: "2. Milling and Cooking" },
      {
        type: "paragraph",
        text: "The grain is milled to a coarse flour and cooked with water in stages, because the three grains gelatinise at different temperatures. Corn goes in hottest, at around 100 degrees Celsius, to burst the starch granules. The mash is cooled, rye or wheat is added in the middle range, and the malted barley goes in last and coolest - above roughly 65 degrees the barley enzymes denature and the whole batch is ruined.",
      },
      {
        type: "paragraph",
        text: "The water matters here, and it is the reason Kentucky became the centre of the industry. The state sits on a limestone shelf that filters out iron - which would turn whiskey black and taste metallic - while leaving calcium and magnesium behind, both of which yeast are happy to work in.",
      },
      { type: "heading", level: 2, text: "3. Fermentation, and the Sour Mash Trick" },
      {
        type: "paragraph",
        text: "The cooled mash goes into a fermenter, yeast is pitched, and over three to five days it converts the sugar into alcohol and a great deal of flavour. What comes out is called distiller's beer, sitting somewhere around 8 to 10 percent alcohol - and it genuinely does taste like a sour, grainy beer.",
      },
      {
        type: "paragraph",
        text: "Almost every Kentucky distillery uses the sour mash process, which is far less exotic than it sounds. A portion of the acidic spent mash from the previous distillation, known as setback or backset, is added to the new batch. Lowering the pH does two things: it suppresses bacteria that would otherwise spoil the ferment, and it keeps conditions consistent batch after batch. Sour mash is a consistency technique, not a flavour claim - which is why it appears on so many labels and tells you almost nothing.",
      },
      {
        type: "callout",
        title: "The yeast is the secret",
        text: "Distilleries guard their proprietary yeast strains obsessively, and several have kept the same family strain alive for generations. Yeast produces the esters behind fruit notes - banana, cherry, apple - which is why two distilleries using an identical mash bill and identical barrels still produce recognisably different whiskey.",
      },
      { type: "heading", level: 2, text: "4. Distillation, Twice" },
      {
        type: "paragraph",
        text: "The beer runs into a tall column still, where steam strips the alcohol upward through a series of plates. What emerges is low wine, typically around 125 proof. It then passes through a doubler or a thumper - a second, smaller pot-style still that cleans it up and concentrates it further.",
      },
      {
        type: "paragraph",
        text: "Bourbon may not be distilled above 160 proof, and that ceiling is deliberate. The higher you distil, the more congeners you strip out, and congeners are flavour. Distil to 190 and you have neutral spirit; vodka is defined by its absence of character. The finished clear spirit is called white dog or new make, and tasting it neat is worth doing once - it is sweet, hot and unmistakably corn, with none of the colour, vanilla or spice you associate with the finished product. All of that is still to come from the wood.",
      },
      { type: "heading", level: 2, text: "5. The Barrel - Where Most of the Flavour Comes From" },
      {
        type: "paragraph",
        text: "This is the first of the two stages that really matter. The white dog is cut with water to no more than 125 proof and filled into a new barrel of charred American white oak. New is the costly word: scotch, rum and tequila producers may reuse casks for decades, but every drop of bourbon requires a fresh one. Those used bourbon barrels are then sold on, which is why so much of the world's whisky ages in ex-bourbon wood.",
      },
      {
        type: "paragraph",
        text: "Before filling, the barrel interior is toasted and then charred with open flame, graded from level one to level four. A level four - alligator char, so named because the carbonised surface cracks into a scaled pattern - caramelises the wood sugars most aggressively and pushes the whiskey darker and sweeter. Lower char levels leave more delicate, fruit-forward spirit. Neither is better; both are choices.",
      },
      {
        type: "paragraph",
        text: "The char layer is what supplies vanillin, oak lactones and tannins - vanilla, caramel, coconut, baking spice, toasted nut - and it also acts as a filter, stripping sulphur compounds out of the young spirit over time.",
      },
      { type: "heading", level: 2, text: "6. The Rickhouse - Where Time Does the Work" },
      {
        type: "paragraph",
        text: "The second stage that decides everything. Barrels are stacked on wooden ricks in warehouses that are deliberately not climate controlled, because the whole process depends on Kentucky's violent temperature swings. When the weather warms, the liquid expands into the char layer and extracts colour and flavour. When it cools, the wood contracts and pushes it back out. Bourbon breathes in and out of the wood, thousands of times, for years.",
      },
      {
        type: "paragraph",
        text: "Position in the rickhouse therefore matters as much as duration. Upper floors run hot and cycle hard, producing bolder, more oak-driven whiskey faster. Lower floors are cooler and steadier, giving gentler, more delicate spirit over a longer stretch. Two barrels filled on the same day from the same batch, one on the top floor and one on the ground, will taste like different whiskeys after a decade - which is the entire premise behind [[link:/blog/master-distiller-barrel-selection-guide|single barrel selection]].",
      },
      {
        type: "paragraph",
        text: "Some of it simply leaves. Evaporation through the porous oak claims roughly 2 to 4 percent of each barrel per year - the angels share. Over fifteen years that can be half the barrel gone, and it is the honest reason very old bourbon costs what it does. There is a great deal less of it than there was.",
      },
      { type: "heading", level: 2, text: "7. Dumping, Proofing and Bottling" },
      {
        type: "paragraph",
        text: "When the whiskey is ready, barrels are emptied - dumped - and either bottled individually as a single barrel, like [[product:blantons-original-single-barrel|Blanton's Original]], or married together in a small batch to hit a consistent house profile, as with [[product:eh-taylor-small-batch|E.H. Taylor Small Batch]]. It is then usually cut with water to bottling strength, unless it is going out at full barrel proof as [[product:eh-taylor-barrel-proof|E.H. Taylor Barrel Proof]] does.",
      },
      {
        type: "paragraph",
        text: "Most bourbon is chill filtered, chilled to near freezing so fatty acids precipitate out and are strained away, which stops the whiskey turning cloudy over ice. It also removes a little texture and flavour, which is why bottles like [[product:russells-reserve-13-year|Russell's Reserve 13 Year]] make a point of being non-chill filtered.",
      },
      {
        type: "callout",
        title: "What you can add",
        text: "Water. That is the entire list. No colouring, no flavouring, no sweetening - the rules that make bourbon bourbon forbid all of it. Every shade of amber in your glass came out of a charred barrel, which is not true of every brown spirit on the shelf.",
      },
      { type: "heading", level: 2, text: "Seeing It For Yourself" },
      {
        type: "paragraph",
        text: "Reading about temperature cycling is one thing; standing on the fifth floor of a rickhouse in August, where the air is thick with evaporating whiskey and the barrels are audibly working, explains it in about four seconds. Our [[link:/tours|distillery tour]] walks the mash floor, the still house and Rickhouse No. 7, and finishes with a tasting of the same spirit at different ages.",
      },
      {
        type: "paragraph",
        text: "If you would rather start with the legal definitions, [[link:/blog/bourbon-vs-whiskey-explained|what actually makes a bourbon]] covers the six rules. To put the process to work in a glass, read [[link:/blog/how-to-taste-bourbon|how to taste bourbon]], or start with something like [[product:eagle-rare-10-year|Eagle Rare 10 Year]] from the [[link:/shop|shop]] and taste a decade of rickhouse weather for yourself.",
      },
    ],
    seo: {
      metaTitle: "How Bourbon Is Made, Step by Step",
      metaDescription:
        "The seven stages of bourbon production - mash bill, cooking, sour mash fermentation, double distillation, the charred new oak barrel, rickhouse maturation and bottling - explained clearly.",
      focusKeyword: "how is bourbon made",
      primaryKeywords: [
        "how is bourbon made",
        "bourbon production process",
        "how bourbon is distilled",
        "sour mash process",
        "bourbon fermentation",
        "charred oak barrel",
        "rickhouse aging",
        "angels share",
      ],
      longTailKeywords: [
        "how is bourbon made step by step",
        "what is the sour mash process",
        "why is bourbon aged in new charred oak barrels",
        "what is white dog whiskey",
        "how long is bourbon fermented",
        "what is the angels share in bourbon",
        "why is Kentucky water good for bourbon",
        "what does chill filtered mean",
        "difference between single barrel and small batch",
        "what is a doubler in distilling",
      ],
      wordClusters: [
        {
          cluster: "Production Stages",
          terms: [
            "mash bill",
            "milling",
            "cooking",
            "fermentation",
            "distillers beer",
            "column still",
            "doubler",
            "thumper",
            "white dog",
          ],
        },
        {
          cluster: "Barrel & Warehouse",
          terms: [
            "American white oak",
            "char level",
            "alligator char",
            "rickhouse",
            "temperature cycling",
            "angels share",
            "rick position",
            "barrel entry proof",
          ],
        },
        {
          cluster: "Finishing",
          terms: [
            "dumping",
            "single barrel",
            "small batch",
            "chill filtration",
            "non-chill filtered",
            "proofing",
            "bottling strength",
          ],
        },
      ],
    },
    relatedProducts: [
      "eagle-rare-10-year",
      "blantons-original-single-barrel",
      "eh-taylor-small-batch",
      "eh-taylor-barrel-proof",
      "russells-reserve-13-year",
    ],
    faq: [
      {
        question: "How is bourbon made?",
        answer:
          "Grain is milled and cooked to convert starch to sugar, fermented with yeast for three to five days, distilled twice to no more than 160 proof, filled into a new charred oak barrel at no more than 125 proof, matured for years in an uncontrolled warehouse, then dumped, proofed with water and bottled.",
      },
      {
        question: "What is the sour mash process?",
        answer:
          "Adding a portion of acidic spent mash from the previous distillation into the new batch. Lowering the pH suppresses spoilage bacteria and keeps fermentation consistent. It is a consistency technique rather than a flavour claim.",
      },
      {
        question: "Why must bourbon use new charred oak barrels?",
        answer:
          "It is written into the legal definition. The char layer supplies vanillin, oak lactones and tannins, and filters sulphur compounds from the young spirit. A used barrel has already given up most of that, which is why bourbon develops so much character in a decade.",
      },
      {
        question: "What is the angels share?",
        answer:
          "The whiskey lost to evaporation through the porous oak, roughly 2 to 4 percent of each barrel per year. Over fifteen years it can claim close to half the barrel, which is the real reason very old bourbon is expensive.",
      },
      {
        question: "What is white dog?",
        answer:
          "The clear, unaged spirit as it comes off the still, also called new make. It is sweet, hot and distinctly corn-forward. All of bourbon's colour, vanilla and spice comes later, from the barrel.",
      },
    ],
  },
  // ─────────────────────────────────────────────────────────────────────────
  // 10. Age Statements — Buying Guide
  // ─────────────────────────────────────────────────────────────────────────
  {
    slug: "does-older-bourbon-mean-better",
    title: "Does Older Bourbon Mean Better? What Age Statements Really Tell You",
    subtitle:
      "A number on the label is the least reliable predictor of quality in American whiskey. Here is what it does and does not promise.",
    excerpt:
      "Bourbon ages faster than scotch, peaks earlier than people assume, and can be ruined by too long in the wood. What an age statement legally means, why no age statement is not a warning, and when paying for years is genuinely worth it.",
    category: "Buying Guide",
    author: "Eleanor Hayes",
    authorTitle: "Master Distiller, Bourbon & Oak",
    publishedAt: "2026-08-15",
    readTimeMinutes: 10,
    heroImage: "/blog-age.webp",
    heroAlt:
      "Rows of aged bourbon bottles on backlit shelves at different ages and proofs",
    tags: [
      "bourbon age statement",
      "does older bourbon taste better",
      "NAS whiskey",
      "over-oaked",
      "rickhouse position",
      "buying guide",
    ],
    content: [
      {
        type: "paragraph",
        text: "Ask a room of drinkers whether a 17 year old bourbon is better than a 10 year old and most will say yes without hesitating. It is the most persistent assumption in whiskey, it drives an enormous amount of spending, and it is wrong often enough to be worth taking apart properly.",
      },
      { type: "heading", level: 2, text: "What the Number Legally Means" },
      {
        type: "paragraph",
        text: "An age statement refers to the youngest whiskey in the bottle, not the average. If a small batch marries barrels of eight, eleven and fourteen years, the label must say eight. This is a consumer protection rule and it works in your favour - the number is a floor, never an optimistic estimate.",
      },
      {
        type: "paragraph",
        text: "Plain bourbon has no minimum age at all. Straight bourbon requires two years, and must state its age if it is under four. Past four years a producer may say nothing, which is why so many excellent bottles carry no number. We cover the full set of definitions in [[link:/blog/bourbon-vs-whiskey-explained|bourbon vs whiskey]].",
      },
      { type: "heading", level: 2, text: "Bourbon Ages Faster Than You Think" },
      {
        type: "paragraph",
        text: "Comparing bourbon years to scotch years is the root of most confusion. An 18 year old scotch is a mature but unremarkable age statement; an 18 year old bourbon is close to the outer limit of what the category can carry. Two things account for the difference.",
      },
      {
        type: "list",
        items: [
          "New charred oak. Scotch generally matures in used casks that have already surrendered most of their extractable compounds. Bourbon must use a fresh, heavily charred barrel, so extraction is far more aggressive from the first year.",
          "Kentucky weather. Rickhouses are deliberately uncontrolled, and summers above 35 degrees Celsius followed by freezing winters drive the whiskey in and out of the wood constantly. Scotland's mild, stable climate does the same work far more slowly.",
        ],
      },
      {
        type: "paragraph",
        text: "The practical consequence is that most bourbon reaches its best somewhere between eight and fifteen years. Below that it can taste hot and grain-forward; well beyond it, the wood starts winning.",
      },
      { type: "heading", level: 2, text: "What Over-Oaked Actually Tastes Like" },
      {
        type: "paragraph",
        text: "Too long in the barrel is a real and unpleasant outcome, not a theoretical one. Tannins accumulate until the whiskey turns drying and astringent, like over-steeped tea. Sweetness and fruit disappear behind bitter wood, sawdust and a sharp pencil-shavings note. The finish shortens rather than lengthens, because there is nothing left underneath the oak to carry it.",
      },
      {
        type: "paragraph",
        text: "This is why distilleries dump barrels that are ready rather than barrels that have hit a round number, and why a genuinely great 20 or 23 year old bourbon is rare enough to command what it does. Reaching that age intact is the exception. Most barrels do not.",
      },
      { type: "heading", level: 2, text: "Position Beats Duration" },
      {
        type: "paragraph",
        text: "Here is the fact that undoes the simple age-equals-quality model. Two barrels filled on the same day from the same batch will taste like different whiskeys after a decade, depending on where they sat. Upper floors of a rickhouse run hot and cycle hard, ageing spirit faster and bolder. Lower floors stay cool and steady, producing gentler whiskey more slowly.",
      },
      {
        type: "paragraph",
        text: "A well-placed eight year old barrel can outclass a poorly placed fifteen. That is the entire logic of a barrel pick, which we walk through in [[link:/blog/master-distiller-barrel-selection-guide|the barrel selection guide]] - and it is why single barrel bottlings print the warehouse and rick position on the label.",
      },
      {
        type: "callout",
        title: "Proof interacts with age",
        text: "A 90 proof ten year old and a 130 proof ten year old are not the same experience. Barrel entry proof, evaporation and dilution all shift the balance. Comparing ages across very different strengths tells you about alcohol, not about time - which is why a fair tasting holds proof roughly constant.",
      },
      { type: "heading", level: 2, text: "No Age Statement Is Not a Red Flag" },
      {
        type: "paragraph",
        text: "NAS has a poor reputation, largely earned during the whiskey shortage years when producers quietly dropped age statements while raising prices. But the absence of a number is not evidence of young whiskey. Barrel proof releases are frequently NAS because they are assembled from a spread of barrels selected on taste rather than to protect a number on the label.",
      },
      {
        type: "paragraph",
        text: "[[product:eh-taylor-barrel-proof|E.H. Taylor Barrel Proof]] carries no age statement and is one of the most structured bourbons at its price. Judge it in the glass, not on the label.",
      },
      { type: "heading", level: 2, text: "What Extra Years Actually Cost You" },
      {
        type: "paragraph",
        text: "Set against real bottles on our shelves, the curve is easy to see:",
      },
      {
        type: "list",
        items: [
          "[[product:eagle-rare-10-year|Eagle Rare 10 Year]] at $40 - a decade of Kentucky weather, and for most drinkers the point at which bourbon is simply good.",
          "[[product:elmer-t-lee-single-barrel|Elmer T. Lee Single Barrel]] at $80, nine years - one year younger than the above, and better, because the barrels were selected rather than merely aged.",
          "[[product:weller-12-year|Weller 12 Year]] at $100 - two more years and a wheated recipe that uses them well.",
          "[[product:russells-reserve-13-year|Russell's Reserve 13 Year]] at $200 - thirteen years at 114.8 proof, non-chill filtered, where age and strength genuinely compound.",
          "[[product:eagle-rare-17-year|Eagle Rare 17 Year]] at $250 - superb, and priced on scarcity as much as on the extra seven years over the 10 year.",
        ],
      },
      {
        type: "paragraph",
        text: "The step from 10 to 12 years is worth paying for. The step from 13 to 17 buys elegance, rarity and diminishing returns. Anyone telling you the 17 is roughly twice as good as the 12 is selling something.",
      },
      { type: "heading", level: 2, text: "When Old Genuinely Is Better" },
      {
        type: "paragraph",
        text: "There is one clear exception, and it is a matter of recipe. Wheated bourbons carry extended ageing unusually well. Without rye spice occupying the mid-palate, a young wheater can taste thin - but give it fifteen years and the oak fills that space with leather, dark caramel and dried fruit rather than bitterness.",
      },
      {
        type: "paragraph",
        text: "That is the whole design of the Van Winkle range, and why [[product:pappy-van-winkle-15-year|Pappy Van Winkle 15 Year]] works at an age that would flatten many high-rye bourbons. Even there, most people find fifteen the sweet spot rather than [[product:pappy-van-winkle-23-year|the 23 year]], which trades a great deal of money for a little more wood.",
      },
      { type: "heading", level: 2, text: "How to Buy Without Chasing Numbers" },
      {
        type: "list",
        ordered: true,
        items: [
          "Decide your grain preference first - wheated or high-rye matters more than any age statement.",
          "Buy in the eight to thirteen year band, where the ratio of quality to price is best.",
          "Treat NAS barrel proof releases as opportunities, not compromises.",
          "Taste before you upgrade. A side-by-side at similar proof teaches more than any label.",
        ],
      },
      {
        type: "paragraph",
        text: "If you want to run that comparison properly, [[link:/blog/how-to-taste-bourbon|the tasting guide]] explains how, and [[link:/blog/best-bourbon-bottles-ranked|the ranked buying guide]] shows what each tier costs. The older releases live in the [[link:/collection|allocated collection]]; everything else is in the [[link:/shop|shop]].",
      },
    ],
    seo: {
      metaTitle: "Does Older Bourbon Mean Better? Age Statements Explained",
      metaDescription:
        "What a bourbon age statement legally means, why bourbon ages faster than scotch, what over-oaked tastes like, why rickhouse position beats years, and when paying for age is worth it.",
      focusKeyword: "bourbon age statement",
      primaryKeywords: [
        "bourbon age statement",
        "does older bourbon taste better",
        "NAS bourbon",
        "over-oaked bourbon",
        "best age for bourbon",
        "bourbon aging",
        "how long is bourbon aged",
      ],
      longTailKeywords: [
        "does older bourbon mean better quality",
        "what does an age statement on bourbon mean",
        "why does bourbon age faster than scotch",
        "what does over-oaked bourbon taste like",
        "is no age statement bourbon bad",
        "what is the best age for bourbon",
        "is 17 year bourbon worth the money",
        "why do wheated bourbons age well",
        "does rickhouse position affect bourbon",
      ],
      wordClusters: [
        {
          cluster: "Age & Regulation",
          terms: [
            "age statement",
            "youngest whiskey in the bottle",
            "straight bourbon two years",
            "no age statement",
            "NAS",
            "bottled in bond four years",
          ],
        },
        {
          cluster: "Maturation Science",
          terms: [
            "tannins",
            "extraction",
            "temperature cycling",
            "new charred oak",
            "used cask",
            "angels share",
            "rick position",
          ],
        },
        {
          cluster: "Value Judgement",
          terms: [
            "diminishing returns",
            "price per year",
            "scarcity pricing",
            "barrel selection",
            "quality to price ratio",
          ],
        },
      ],
    },
    relatedProducts: [
      "eagle-rare-10-year",
      "elmer-t-lee-single-barrel",
      "weller-12-year",
      "russells-reserve-13-year",
      "eagle-rare-17-year",
      "pappy-van-winkle-15-year",
    ],
    faq: [
      {
        question: "Does older bourbon always taste better?",
        answer:
          "No. Most bourbon peaks between eight and fifteen years. Beyond that the wood can dominate, producing drying, astringent, bitter whiskey. A well-placed eight year old barrel can easily beat a poorly placed fifteen.",
      },
      {
        question: "What does an age statement on bourbon mean?",
        answer:
          "It refers to the youngest whiskey in the bottle, not the average. If barrels of eight, eleven and fourteen years are married together, the label must state eight.",
      },
      {
        question: "Why does bourbon age faster than scotch?",
        answer:
          "Bourbon must use new heavily charred oak, so extraction is aggressive from the start, and Kentucky rickhouses are uncontrolled, driving the whiskey in and out of the wood through large temperature swings. Scotland's mild climate and used casks work far more slowly.",
      },
      {
        question: "Is a bourbon with no age statement worse?",
        answer:
          "Not necessarily. Barrel proof releases are often NAS because barrels are chosen on taste rather than to protect a number. E.H. Taylor Barrel Proof carries no age statement and is among the most structured bourbons at its price.",
      },
      {
        question: "What does over-oaked bourbon taste like?",
        answer:
          "Drying and astringent, like over-steeped tea, with bitter wood, sawdust and pencil-shaving notes replacing sweetness and fruit. The finish gets shorter rather than longer.",
      },
    ],
  },
  // ─────────────────────────────────────────────────────────────────────────
  // 11. Buffalo Trace Antique Collection — Collecting
  // ─────────────────────────────────────────────────────────────────────────
  {
    slug: "buffalo-trace-antique-collection-explained",
    title: "The Buffalo Trace Antique Collection, Explained",
    subtitle:
      "Five bottles, one release each autumn, and specifications that change every single year. What BTAC is and how to approach it.",
    excerpt:
      "The most chased annual release in American whiskey. What each of the five bottles is, why the proof and age change from year to year, how allocation works, and which one to start with.",
    category: "Collecting",
    author: "Eleanor Hayes",
    authorTitle: "Master Distiller, Bourbon & Oak",
    publishedAt: "2026-08-15",
    readTimeMinutes: 11,
    heroImage: "/blog-btac.webp",
    heroAlt:
      "Bourbon bottle and cut crystal glass on a bar with backlit whiskey shelves behind",
    tags: [
      "Buffalo Trace Antique Collection",
      "BTAC",
      "George T. Stagg",
      "William Larue Weller",
      "Eagle Rare 17",
      "allocated bourbon",
    ],
    content: [
      {
        type: "paragraph",
        text: "Once a year, usually in autumn, Buffalo Trace releases a set of five whiskeys known collectively as the Antique Collection. It is the most anticipated annual event in American whiskey, and the reason is straightforward: these are barrels the distillery has held back and selected specifically, bottled with minimal intervention, in quantities that come nowhere close to demand.",
      },
      {
        type: "paragraph",
        text: "In 2025, for the collection's 25th anniversary, the line-up expanded to six with the first ever E.H. Taylor Bottled-in-Bond in the set. The core five, however, have been constant for years, and they are what most people mean by BTAC.",
      },
      { type: "heading", level: 2, text: "The Five Bottles" },
      { type: "heading", level: 3, text: "George T. Stagg" },
      {
        type: "paragraph",
        text: "The uncut, unfiltered high-rye bourbon, and the most famous of the set. [[product:george-t-stagg|George T. Stagg]] regularly clears 130 proof and has crossed 140 in some years - above that threshold it is classed as hazardous material and cannot legally travel as commercial air cargo, which is where the hazmat nickname comes from.",
      },
      {
        type: "paragraph",
        text: "Our current release is fifteen years old at 136.1 proof: dark chocolate, char, leather and black cherry, with a finish that outlasts anything else in the collection. It is the least forgiving bottle here and the one experienced drinkers reach for first. Water is not optional.",
      },
      { type: "heading", level: 3, text: "William Larue Weller" },
      {
        type: "paragraph",
        text: "The barrel proof wheated bourbon, and the bottle that most often beats Pappy Van Winkle in a blind tasting. [[product:william-larue-weller|William Larue Weller]] takes the same wheated recipe that underpins the Van Winkle line and bottles it uncut - ours at 133.6 proof, twelve years old.",
      },
      {
        type: "paragraph",
        text: "Undiluted it is dense and almost syrupy: dark fruit, creme brulee, cocoa. A teaspoon of water opens it into one of the most complete American whiskeys made. If you only chase one bottle from the collection, most people should chase this one.",
      },
      { type: "heading", level: 3, text: "Eagle Rare 17 Year" },
      {
        type: "paragraph",
        text: "The elegant one. Where Stagg is force, [[product:eagle-rare-17-year|Eagle Rare 17 Year]] is restraint - seventeen years carried at a modest 101 proof, with polished oak, dried orange peel, honey and old leather. Seventeen years destroys most bourbon; the barrels chosen for this survive it with unusual grace.",
      },
      {
        type: "paragraph",
        text: "It is also the bottle whose price most reflects collector demand rather than drinking value, which is worth saying plainly. If you want the profile rather than the label, [[product:eagle-rare-12-year|Eagle Rare 12 Year]] at $70 delivers a great deal of it.",
      },
      { type: "heading", level: 3, text: "Thomas H. Handy Sazerac" },
      {
        type: "paragraph",
        text: "The rye, and the one people overlook. [[product:thomas-h-handy-sazerac|Thomas H. Handy Sazerac]] is uncut straight rye whiskey, typically six years old and around 130 proof. Younger than everything else in the set, and none the worse for it - rye carries high proof and youth better than bourbon does, arriving peppery, herbal and intensely aromatic.",
      },
      {
        type: "paragraph",
        text: "If your shelf is entirely bourbon, this is the most educational bottle in the collection. Pour it beside any of the others and the difference between corn and rye becomes obvious in one sip.",
      },
      { type: "heading", level: 3, text: "Sazerac 18 Year Rye" },
      {
        type: "paragraph",
        text: "The fifth member, and the one we do not currently stock. Eighteen year old straight rye at 90 proof - the opposite approach to the Handy, trading intensity for depth and a soft, dry, herbal complexity that only long-aged rye achieves. Worth knowing about so you can recognise a complete set, and worth trying if you ever get the chance at a bar.",
      },
      { type: "heading", level: 2, text: "Why the Specifications Change Every Year" },
      {
        type: "paragraph",
        text: "This is the part that catches people out, and it is the single most useful thing to understand about BTAC. There is no fixed recipe for a given bottle. Each year the distillery selects barrels on merit, and whatever those barrels give is what goes in - so age and proof shift, sometimes dramatically, from release to release.",
      },
      {
        type: "paragraph",
        text: "George T. Stagg has been bottled anywhere from the low 120s to above 142 proof. William Larue Weller has ranged across several years of age and more than ten points of proof. This means a review of a 2019 bottle tells you very little about a 2024 one, and that the year on the label matters as much as the name.",
      },
      {
        type: "callout",
        title: "Always check the specific release",
        text: "Before buying at secondary prices, confirm the age and proof of that exact year rather than relying on the reputation of the name. Two bottles of the same expression from different years can be meaningfully different whiskeys - and priced as though they are identical.",
      },
      { type: "heading", level: 2, text: "How Allocation Works" },
      {
        type: "paragraph",
        text: "BTAC quantities were fixed years ago when the barrels were filled. Buffalo Trace assigns fixed amounts to state distributors, distributors assign fixed amounts to individual retailers, and no one anywhere in that chain can order more. When a shop receives six bottles for the entire year, there is no mechanism that produces a seventh.",
      },
      {
        type: "paragraph",
        text: "Retailers therefore distribute by lottery, waitlist, loyalty history or bundling, and every method leaves most customers disappointed because the arithmetic guarantees it. Anyone offering you guaranteed BTAC at retail, in quantity, on demand, is worth a second look - and the authenticity checks in [[link:/blog/best-bourbon-bottles-ranked|the ranked buying guide]] are worth running before money changes hands.",
      },
      { type: "heading", level: 2, text: "Where to Start, and What to Drink Meanwhile" },
      {
        type: "paragraph",
        text: "If you are new to the collection, start with William Larue Weller if you like sweetness and body, or Thomas H. Handy if you want something that will teach you the most. Leave Eagle Rare 17 until you specifically want elegance rather than intensity, and treat Stagg as a bottle to grow into.",
      },
      {
        type: "paragraph",
        text: "For the eleven months of the year when BTAC is not available, these are the closest things we can reliably keep on a shelf:",
      },
      {
        type: "list",
        items: [
          "Instead of George T. Stagg: [[product:stagg-bourbon|Stagg]] at $150, or [[product:eh-taylor-barrel-proof|E.H. Taylor Barrel Proof]] at $100 - both above 130 proof with the same concentrated character.",
          "Instead of William Larue Weller: [[product:weller-full-proof|W.L. Weller Full Proof]] at $150, the closest barrel strength wheater we can stock, or [[product:weller-12-year|Weller 12 Year]] at $100 for the profile at gentler strength.",
          "Instead of Eagle Rare 17: [[product:eagle-rare-12-year|Eagle Rare 12 Year]] at $70, the same restrained oak-led style.",
          "Instead of the ryes: there is no true substitute, which is a large part of why the Handy is worth chasing.",
        ],
      },
      {
        type: "paragraph",
        text: "Everything currently allocated sits in the [[link:/collection|limited and allocated collection]]. If you do land a bottle, [[link:/blog/how-to-store-bourbon|store it properly]] - upright, dark and stable - because a failed cork on a bottle you waited a year for is a genuinely expensive mistake.",
      },
    ],
    seo: {
      metaTitle: "The Buffalo Trace Antique Collection (BTAC), Explained",
      metaDescription:
        "What the five BTAC bottles are, why George T. Stagg and William Larue Weller change proof and age every year, how allocation works, and what to drink when they are gone.",
      focusKeyword: "Buffalo Trace Antique Collection",
      primaryKeywords: [
        "Buffalo Trace Antique Collection",
        "BTAC",
        "George T. Stagg",
        "William Larue Weller",
        "Eagle Rare 17 Year",
        "Thomas H. Handy Sazerac",
        "Sazerac 18 Year",
        "allocated bourbon",
      ],
      longTailKeywords: [
        "what is the Buffalo Trace Antique Collection",
        "what bottles are in BTAC",
        "why does George T. Stagg proof change every year",
        "when is BTAC released each year",
        "how do you get a BTAC bottle",
        "is William Larue Weller better than Pappy",
        "what is hazmat proof whiskey",
        "what to buy instead of George T. Stagg",
        "BTAC 2025 six bottles",
      ],
      wordClusters: [
        {
          cluster: "The Collection",
          terms: [
            "BTAC",
            "annual release",
            "autumn release",
            "25th anniversary",
            "barrel selection",
            "uncut unfiltered",
          ],
        },
        {
          cluster: "The Bottles",
          terms: [
            "George T. Stagg",
            "William Larue Weller",
            "Eagle Rare 17",
            "Thomas H. Handy",
            "Sazerac 18",
            "E.H. Taylor bottled in bond",
          ],
        },
        {
          cluster: "Acquisition",
          terms: [
            "allocation",
            "lottery",
            "waitlist",
            "distributor quota",
            "secondary market",
            "MSRP",
            "authenticity",
          ],
        },
      ],
    },
    relatedProducts: [
      "george-t-stagg",
      "william-larue-weller",
      "eagle-rare-17-year",
      "thomas-h-handy-sazerac",
      "weller-full-proof",
      "stagg-bourbon",
    ],
    faq: [
      {
        question: "What is the Buffalo Trace Antique Collection?",
        answer:
          "An annual autumn release of five specially selected, minimally processed whiskeys from Buffalo Trace: George T. Stagg, William Larue Weller, Eagle Rare 17 Year, Thomas H. Handy Sazerac and Sazerac 18 Year Rye. In 2025 it expanded to six for its 25th anniversary with an E.H. Taylor Bottled-in-Bond.",
      },
      {
        question: "Why does George T. Stagg change proof every year?",
        answer:
          "There is no fixed recipe. Barrels are chosen on merit each year and bottled uncut, so whatever those barrels give is what goes in. Stagg has ranged from the low 120s to above 142 proof, which is why the release year matters as much as the name.",
      },
      {
        question: "What does hazmat proof mean?",
        answer:
          "Any spirit above 140 proof is classed as hazardous material and cannot be carried as commercial air cargo. George T. Stagg has crossed that line in several years, which is where the hazmat nickname comes from.",
      },
      {
        question: "Is William Larue Weller better than Pappy Van Winkle?",
        answer:
          "It frequently wins blind tastings against it. Both are wheated bourbons from the same distillery, but William Larue Weller is bottled uncut at barrel proof while the Van Winkle range is proofed down, which gives it more concentration and depth.",
      },
      {
        question: "How do you actually get a BTAC bottle?",
        answer:
          "Quantities were fixed when the barrels were filled, so retailers receive a small allocation they cannot increase. Most distribute by lottery, waitlist or loyalty history. Anyone offering guaranteed BTAC in quantity at retail deserves scrutiny.",
      },
    ],
  },
];

// ─── Helpers ────────────────────────────────────────────────────────────────

export function getAllPosts(): BlogPost[] {
  return [...BLOG_POSTS].sort((a, b) =>
    a.publishedAt < b.publishedAt ? 1 : -1
  );
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}

export function getRecentPosts(limit = 3): BlogPost[] {
  return getAllPosts().slice(0, limit);
}

export function formatPostDate(iso: string): string {
  const d = new Date(iso + "T00:00:00Z");
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}
