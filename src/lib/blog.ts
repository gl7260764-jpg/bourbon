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
