/**
 * Per-bottle questions and answers.
 *
 * Product pages carried Product, Offer and AggregateRating markup but answered
 * no questions at all, which left the twenty-seven pages a buyer is most likely
 * to arrive on with nothing for a search engine — or a person — to take away.
 *
 * Rules these entries are written to, because they are what the evidence
 * actually supports rather than what GEO vendors sell:
 *
 *   Answer first. The first sentence answers the question outright. Everything
 *   after it is support. A reader who stops reading after one line still has
 *   their answer, and an engine quoting one sentence quotes a true one.
 *
 *   Be specific. "High proof" is worth nothing; "100 proof, 50% ABV" is worth
 *   quoting. Numbers come from the product record, so the page and the answer
 *   can never disagree.
 *
 *   Only claim what we can stand behind. These are real, allocated bottles.
 *   An invented award, score or distillery anecdote is a lie printed under our
 *   own name, and would be worse than saying nothing.
 *
 *   No two bottles get the same answer with the name swapped. Duplicated
 *   boilerplate across twenty-seven pages is thin content, and is treated as
 *   such.
 */

export interface ProductFaqItem {
  question: string;
  /** Plain text. Rendered as-is and emitted into FAQPage structured data. */
  answer: string;
}

/** Keyed by product slug. A bottle with no entry simply renders no section. */
export const PRODUCT_FAQS: Record<string, ProductFaqItem[]> = {
  // Blanton's Gold Edition
  "blantons-gold-edition": [
    {
      question:
        "What is the difference between Blanton's Gold and the Original?",
      answer:
        "Proof, mainly. Gold goes into the bottle at 103 proof (51.5% ABV) against the Original's 93 proof, and both are single barrel bourbon from Buffalo Trace built on the same 81% corn, 8% rye and 11% malted barley recipe. The extra strength pushes the caramel darker and the baking spice further forward, where the Original stays lighter and creamier.",
    },
    {
      question: "Why is Gold Edition so hard to find in the US?",
      answer:
        "Gold was created for international markets and has only ever reached the United States in small quantities, which is why it sits in our allocated range rather than as standing stock. Single barrel bottling compounds it, since each release is drawn from one cask instead of a large blend. When it appears on this page, it is because we are holding bottles.",
    },
    {
      question: "Is 103 proof too strong to drink neat?",
      answer:
        "No. At 103 proof, or 51.5% ABV, it sits comfortably in neat-sipping territory. Pour it into a Glencairn at room temperature and give it a minute to open, and the honeycomb, baked apple and oak spice carry further than they do in the 93-proof Original. If the heat builds, a few drops of water soften the edge without flattening the dark caramel.",
    },
    {
      question: "What is the mash bill and how old is it?",
      answer:
        "81% corn, 8% rye and 11% malted barley, distilled at Buffalo Trace and matured eight years in new American white oak with a number 4 char. The corn-heavy base is where the honeycomb and butterscotch come from, and the heavy char accounts for the oak resin that turns up on the finish.",
    },
    {
      question: "Will my bottle taste the same as the last one?",
      answer:
        "Not exactly, because every bottle is filled from one barrel. Within that variation the house character holds: toasted caramel and baked apple on the nose, candied citrus and butterscotch through the palate, brown sugar and warming spice on a long finish. Barrel-to-barrel differences show up as more or less oak weight rather than a different whiskey.",
    },
    {
      question: "Is Gold worth the money against the standard bottling?",
      answer:
        "At $100 for a 750ml bottle you are paying for a single barrel bottled at 103 proof from an expression that was never built for the American market. Against the Original at $150 on this site, Gold is both the cheaper way into the range and the stronger pour of the two. Which suits you comes down to strength against the softer 93-proof profile.",
    },
  ],

  // Blanton's Original Single Barrel
  "blantons-original-single-barrel": [
    {
      question: "Why is Blanton's so hard to get?",
      answer:
        "Demand has run ahead of supply for years, and the format makes it worse: each bottle is filled from one barrel rather than a large batch, so the release cannot simply be scaled up. Buffalo Trace allocates it to retailers in limited quantities, which is why it appears here as an allocated bottle instead of everyday stock.",
    },
    {
      question: "Was Blanton's really the first single barrel bourbon?",
      answer:
        "Yes. It was released in 1984 as the first commercially sold single barrel bourbon, created by Buffalo Trace master distiller Elmer T. Lee and named after Colonel Albert B. Blanton. Every bottling since has worked the same way, with one barrel dumped on its own and its details written on the label.",
    },
    {
      question: "What are the horse stoppers on top of the bottle?",
      answer:
        "There are eight of them, and together they trace a horse and jockey through a race from the starting gate to the finish, each stopper lettered to spell B-L-A-N-T-O-N-S. Which one arrives on your bottle is luck of the draw, and we do not select them. Collectors work towards the full set of eight.",
    },
    {
      question: "What does Warehouse H have to do with the flavour?",
      answer:
        "Blanton's is pulled only from Warehouse H, the single metal-clad rickhouse on Buffalo Trace's grounds. Steel heats and cools faster than brick, so the barrels inside swing through sharper temperature changes and are said to mature more quickly and more evenly. In the glass that reads as the creamy, well-rounded character the brand is known for.",
    },
    {
      question: "How should I drink it?",
      answer:
        "At 93 proof, or 46.5% ABV, neat is the default: a Glencairn or a small tumbler, nothing added, and the honey, nutmeg and orange peel arrive without any work. It also takes a single large ice cube without collapsing if you prefer it cold. Mixing is not the best use of a $150 single barrel.",
    },
    {
      question: "Why does it cost more than other Buffalo Trace bottles?",
      answer:
        "Scarcity and format rather than age, since it is listed at eight years, the same as the Gold Edition. The $150 covers a single barrel release that reaches retailers in small allocations with a long queue of buyers behind it. The whiskey itself is 93 proof from an 81% corn, 8% rye and 11% malted barley mash.",
    },
  ],

  // Blood Oath
  "blood-oath": [
    {
      question: "What does “Pact” mean on a Blood Oath bottle?",
      answer:
        "A Pact is one annual release in the series, and the name comes from master distiller John Rempe's promise to keep each blend's recipe to himself. Every Pact marries three Kentucky straight bourbons, often with a cask finish, and is not made again once that year's run is gone. The bottle you buy is tied to one specific Pact.",
    },
    {
      question: "Why is it bottled at 98.6 proof?",
      answer:
        "Every release in the series goes into the bottle at 98.6 proof, which works out to 49.3% ABV, and that strength has held across the Pacts. It is high enough to carry the dark fruit and toffee without water, and the whiskey is not chill filtered, so nothing is stripped out on the way in. Expect a fuller, oilier texture because of it.",
    },
    {
      question: "What is actually in the blend?",
      answer:
        "Three Kentucky straight bourbons, married by John Rempe at Lux Row Distillers from a mash of 75% corn, 21% rye and 4% malted barley. This bottling carries a 12-year age statement. Rempe keeps the component whiskeys private, so what is published is the proof, the mash bill and the finishing cask used for that Pact.",
    },
    {
      question: "What does the finishing cask do to the taste?",
      answer:
        "It shifts with the Pact, and past releases have used casks such as Sauternes, Cognac and Calvados. The cask is where the sweeter top notes and much of the dark fruit come from; underneath it the bourbon gives toffee, dried cherry, baking spice and dark chocolate. Check which Pact is on the bottle to know which finish you are getting.",
    },
    {
      question: "Is it worth $250 when older bourbons cost less?",
      answer:
        "The price sits on the blending work and the one-off nature of each Pact rather than on age alone, though this one does carry 12 years. For $250 you get a three-bourbon marriage at 98.6 proof, unfiltered, with a cask finish that will not reappear in a later release. If age is what you are buying, other bottles here give you more of it.",
    },
    {
      question: "How should I serve it?",
      answer:
        "Neat, in a Glencairn at room temperature. The 21% rye in the mash gives a peppery lift that a cocktail would bury, and the finishing cask lives largely in the aromas, which both ice and mixers work against. If you want it to last, one large cube melts slowly enough to keep the texture intact.",
    },
  ],

  // Colonel E.H. Taylor, Jr. Barrel Proof
  "eh-taylor-barrel-proof": [
    {
      question: "How strong is it, and can I drink it neat?",
      answer:
        "Very strong: 131 proof, or 65.5% ABV, straight from the barrel with no water added, so neat is the honest starting point but not the easy one. Pour 1.5 oz into a Glencairn, let it settle for a minute, then add spring water a few drops at a time until the heat sits where you want it.",
    },
    {
      question:
        "Is the Barrel Proof bottled-in-bond like the rest of the Taylor range?",
      answer:
        "No, and it cannot be. The bottled-in-bond standard requires bottling at exactly 100 proof, while this one is filled at full barrel strength, listed here at 131 proof. The Small Batch and Single Barrel are the bonded expressions in the range. Same distillery and the same Mash Bill #1 recipe underneath, different bottling rules on top.",
    },
    {
      question: "Does the proof change from batch to batch?",
      answer:
        "Yes, slightly. Barrel proof means the bottle gets whatever strength the selected barrels give, so the figure moves between releases and each one is hand-numbered. The number on this page is 131 proof (65.5% ABV); read the label on the bottle you receive for its own. Character tracks the proof, with more oak grip as it climbs.",
    },
    {
      question:
        "What is Mash Bill #1, and how is it different from a high-rye bourbon?",
      answer:
        "Mash Bill #1 is Buffalo Trace's low-rye recipe, here 75% corn, 10% rye and 15% malted barley, with no wheat at all. Less rye means less sharp peppery bite and more room for corn sweetness and oak, which is why this drinks as toffee, espresso and baked cherry rather than dry spice. The black pepper is there, just behind the sugar.",
    },
    {
      question: "Does it have an age statement?",
      answer:
        "There is no age statement on the bottle and no year count listed on this page, because Buffalo Trace does not publish one for it. What the whiskey does show is maturity you can taste: dried fig, leather, tobacco and dark chocolate over a finish that holds for minutes, carried by the thick texture that comes with uncut, unfiltered bottling.",
    },
    {
      question: "What food goes with something this strong?",
      answer:
        "Rich, dark and fatty things stand up to it best, which is why we point people at smoked brisket, grilled ribeye, aged sharp cheddar, dark-chocolate truffles, pecan pie and espresso. At 65.5% ABV it walks straight over anything delicate, so skip light fish and mild cheese. A square of dark chocolate before the first sip also takes some heat off.",
    },
  ],

  // Colonel E.H. Taylor, Jr. Single Barrel
  "eh-taylor-single-barrel": [
    {
      question: "What does bottled-in-bond actually mean here?",
      answer:
        "It is a federal standard rather than a marketing phrase: one distillery, one distillation season, at least four years in a government-bonded warehouse, and bottling at exactly 100 proof. The Single Barrel meets all of it from one cask, and we list this release at ten years, well past that four-year minimum.",
    },
    {
      question: "Why does Warehouse C matter?",
      answer:
        "Buffalo Trace draws this bourbon only from Warehouse C, the brick-and-iron rickhouse Colonel Taylor completed in 1881 and later pushed to have certified as a federally bonded warehouse. Pulling from one building narrows the range of maturation conditions compared with barrels gathered from across the site, which is part of why the Single Barrel reads so consistently polished.",
    },
    {
      question: "How much does one bottle differ from another?",
      answer:
        "Noticeably, but inside a recognisable range. Each bottle comes from one hand-selected barrel, so the balance of caramel, baked cherry and oak moves: one barrel leans sweeter, the next drier and more tannic. Bottling at 100 proof keeps the strength identical across them, so the variation is in flavour and oak weight, not intensity.",
    },
    {
      question: "Single Barrel or Small Batch — which should I buy?",
      answer:
        "Both are bottled-in-bond at 100 proof from Mash Bill #1, so the choice is about age and variation. This one is listed at ten years from a single Warehouse C cask at $100; the Small Batch is seven years, married from several barrels, at $80, and is the steadier and lighter of the two. The extra $20 buys the older, richer, single-cask pour.",
    },
    {
      question: "Is 100 proof good for an old-fashioned?",
      answer:
        "Close to ideal, in fact, because 100 proof survives sugar, bitters and dilution without thinning out. That said, this is an allocated single barrel, so most people keep it neat or over one large cube and reach for the Small Batch when they mix. If you do build a cocktail with it, keep the recipe simple.",
    },
    {
      question: "How does it compare with the Barrel Proof version?",
      answer:
        "Far more composed. At 100 proof you get honeyed caramel, vanilla cream, baked cherry, cinnamon and a polished oak spine, silky on entry and structured through the middle. The Barrel Proof, listed at 131 proof, trades that elegance for weight, espresso and heat. The same Mash Bill #1 sits underneath both, read two very different ways.",
    },
  ],

  // Colonel E.H. Taylor, Jr. Small Batch
  "eh-taylor-small-batch": [
    {
      question: "Is this a good first bottled-in-bond bourbon?",
      answer:
        "It is one of the easier places to start. Bottling at 100 proof gives it structure without heat you have to work around, and the flavours are the classic Kentucky set: vanilla, butter caramel, baked apple, brown sugar and a dry, oak-led finish. Nothing in it is difficult, which is why it suits newcomers and still holds up for regular bourbon drinkers.",
    },
    {
      question: "What does “small batch” mean on this label?",
      answer:
        "The bottling is married from a limited number of selected barrels rather than one cask or a full production run. Where the Single Barrel comes from one barrel in Warehouse C, the Small Batch blends barrels out of the brick rickhouses, which evens out the differences between them. The practical result is predictability from one bottle to the next.",
    },
    {
      question: "How old is the whiskey in the bottle?",
      answer:
        "Seven years, comfortably beyond the four-year minimum the bottled-in-bond rules set. That age shows as oak tannin and a dry finish rather than the heavy, resinous oak of a much older bourbon. It is also part of why this bottle is $80 while the ten-year Single Barrel is $100.",
    },
    {
      question: "What is the mash bill, and does the rye show?",
      answer:
        "75% corn, 10% rye and 15% malted barley, Buffalo Trace's Mash Bill #1, with no wheat in it. Ten per cent rye is low, so it reads as a hint of black pepper late on the palate rather than dry spice running through the whole pour. The corn and the number 4 char carry everything else, from honey to baked pear.",
    },
    {
      question: "Can I mix with it, or is that a waste?",
      answer:
        "Mix with it. The 100-proof backbone is exactly what an old-fashioned or a Manhattan wants, and at $80 this is the most sensible cocktail bourbon in the Taylor range. Pour it neat in a Glencairn or over one large cube first, though, so you know what the drink you are building is made of.",
    },
    {
      question: "Why is an $80 bourbon still allocated?",
      answer:
        "Because allocation follows supply, not price. The Taylor range leaves Buffalo Trace in limited quantities and demand runs well past it, so even the most affordable expression in the line arrives in small amounts. The $80 here reflects what the bottle is, not what the secondary market asks for it.",
    },
  ],

  // Double Eagle Very Rare 20 Year
  "double-eagle-very-rare": [
    {
      question: "Why does Double Eagle Very Rare cost $700?",
      answer:
        "Twenty years in Buffalo Trace's warehouses, hand-numbered bottling and a crystal decanter, released in very small quantities. At that age most of what went into the barrel has evaporated, so the yield per barrel is small, and this is the only Eagle Rare bottling drawn from the oldest and deepest Mash Bill #1 barrels. It is a ceremonial bottle, priced like one.",
    },
    {
      question:
        "What is the difference between Double Eagle Very Rare and Eagle Rare 17 Year?",
      answer:
        "Three more years, less strength and a different purpose. Double Eagle is 20 years old at 90 proof, 45% ABV, where the 17 Year is 101 proof, so the 20 is silkier and quieter, with dried fig, antique wood and faded tobacco in place of the 17's firmer grip. It arrives as a hand-numbered crystal decanter at $700, against $250 for the 17.",
    },
    {
      question: "Why is Double Eagle Very Rare only 90 proof?",
      answer:
        "Because twenty years of oak does not need the extra strength. At 90 proof, 45% ABV, the whiskey stays silky and concentrated, and the accumulated oak, dried fruit and leather read clearly instead of being pushed through alcohol. It is the same strength as Eagle Rare 10 Year, and the comparison is instructive: identical proof, completely different weight.",
    },
    {
      question: "Does a 20-year-old bourbon taste over-oaked?",
      answer:
        "Not this one, though it is unmistakably old. Every flavour reads aged - toffee, dried apricot, candied pecan, dark cherry, cocoa - and the oak shows as polished and resinous rather than bitter or drying. If you dislike leather, tobacco and antique-wood notes in whiskey, twenty years will not win you over, and the Eagle Rare 12 Year at $70 is the better fit.",
    },
    {
      question: "How should I serve Double Eagle Very Rare?",
      answer:
        "Pour about an ounce into a small Glencairn and give it ten minutes at room temperature. Do not add water and never add ice; at 90 proof there is nothing that needs diluting. It is best on its own, and if you want something with it, keep the flavours dark and quiet, such as 70% chocolate, aged Manchego or candied pecans.",
    },
    {
      question: "What do I receive, and is there a case option?",
      answer:
        "A single hand-numbered 750 ml crystal decanter with silver-tone detailing, gift-boxed. This expression is offered bottle-only, so there is no case format, unlike Eagle Rare 17 Year, which comes in threes, or the 10 and 12 Year, which come in sixes. It is allocated, so we list it only while we hold it.",
    },
  ],

  // Eagle Rare 10 Year
  "eagle-rare-10-year": [
    {
      question: "What does Eagle Rare 10 Year taste like?",
      answer:
        "Soft and sweet rather than oaky, which is unusual for a ten-year-old Kentucky bourbon. The nose gives caramel, vanilla, baked apple and orange peel, and the palate runs honeyed caramel, vanilla cream, candied orange and baked cherry with gentle baking spice. At 90 proof, 45% ABV, the texture stays silky, and the finish is medium, with toasted oak and a touch of leather.",
    },
    {
      question:
        "What is the difference between Eagle Rare and Buffalo Trace bourbon?",
      answer:
        "Age and barrel selection. Both are made at Buffalo Trace from the same low-rye Mash Bill #1, listed here as 75% corn, 10% rye and 15% malted barley, but Eagle Rare 10 Year carries a stated ten years and is bottled from hand-selected barrels at 90 proof. The distillery's standard white-label bourbon carries no age statement and is batched in far larger volumes, so Eagle Rare tastes riper and more polished.",
    },
    {
      question: "Is Eagle Rare 10 Year a single barrel bourbon?",
      answer:
        "Not quite - it is bottled from individually chosen barrels in small lots rather than one barrel per bottle. You get the barrel-specific character buyers come to it for, with less bottle-to-bottle swing than a true single barrel such as Elmer T. Lee. Everything in it is Mash Bill #1 distillate aged a minimum of ten years in new charred American white oak.",
    },
    {
      question: "Why is Eagle Rare 10 Year so hard to find at $40?",
      answer:
        "Because the supply was fixed ten years ago. Buffalo Trace can only bottle what went into the warehouses a decade earlier, and the 10 Year is the only year-round expression in the range, so it carries most of the demand for the name. We hold it as an allocated bottle, which means we receive it in limited quantities rather than ordering it at will.",
    },
    {
      question: "How should I drink Eagle Rare 10 Year?",
      answer:
        "Neat in a Glencairn first, since at 90 proof it needs no water. One large ice cube suits it well, and it is one of the few age-stated bourbons worth putting into an old-fashioned or Manhattan, because the barrel character is consistent enough for the drink to taste the same twice. With food, try roast pork, glazed ham, aged cheddar or apple pie.",
    },
    {
      question:
        "Is a case of Eagle Rare 10 Year better value than single bottles?",
      answer:
        "Yes, on the arithmetic: a six-bottle case is $200, about $33 a bottle, against $40 bought singly, so $40 saved across the case. This is the one bottling in the Eagle Rare range priced as an everyday pour rather than an occasion, so a case makes sense if it is your weekly whiskey rather than a shelf piece.",
    },
  ],

  // Eagle Rare 12 Year
  "eagle-rare-12-year": [
    {
      question: "Is Eagle Rare 12 Year worth almost double the 10 Year?",
      answer:
        "At $70 against $40 you are paying for two things: eleven more proof points and two more years in oak. The 12 Year is bottled at 101 proof, 50.5% ABV, and the extra age reads as dried fig, dark cherry and tobacco-edged oak rather than simply more wood. If you drink bourbon neat and want weight, it earns the step up. If you mix, stay with the 10 Year.",
    },
    {
      question: "What does Eagle Rare 12 Year taste like?",
      answer:
        "Darker and drier than the 10 Year. The nose leads with toasted caramel, vanilla bean, baked orange peel, soft leather and a hint of dried fig, while the palate is honeyed caramel, brown sugar, dark cherry and baking spice held firm by the 101-proof strength. The finish is long, dry and oak-led, closing on cocoa and dried fruit.",
    },
    {
      question: "Why is Eagle Rare 12 Year 101 proof when the 10 Year is 90?",
      answer:
        "The higher strength is what carries the extra oak. At 101 proof, 50.5% ABV, the whiskey has the body to hold twelve years of wood without turning dry or dusty, which is also why the mid-palate feels firmer than the 10 Year at 45%. Expect more grip and a longer finish rather than more heat.",
    },
    {
      question: "How should I serve Eagle Rare 12 Year?",
      answer:
        "Pour 1.5 oz neat into a Glencairn at room temperature and leave it a few minutes, which is where the oak-and-caramel arc opens up. One large ice cube softens it without washing out the 101-proof structure. It rewards sipping over mixing, and smoked brisket, grilled ribeye, aged cheddar or pecan pie all sit well beside it.",
    },
    {
      question: "Is Eagle Rare 12 Year harder to find than the 10 Year?",
      answer:
        "Yes. The 10 Year is bottled year-round, while the 12 Year is a limited release allocated to us in small numbers, so it appears and disappears rather than sitting on a shelf. We will not promise stock on any given day; if you can see it listed here, that is the allocation we currently hold.",
    },
    {
      question: "Should I try the 12 Year before spending on the 17 Year?",
      answer:
        "It is the sensible middle step. The 12 Year shares the 17 Year's 101-proof strength and its oak-led direction at $70 rather than $250, so it tells you whether you enjoy Eagle Rare older and drier before you commit. What the 17 adds is five further years of dried fruit, leather and tobacco, and a much longer finish.",
    },
  ],

  // Eagle Rare 17 Year
  "eagle-rare-17-year": [
    {
      question:
        "What is the Buffalo Trace Antique Collection, and where does Eagle Rare 17 Year sit in it?",
      answer:
        "The Antique Collection is Buffalo Trace's annual limited release of five whiskies: Eagle Rare 17 Year, George T. Stagg, William Larue Weller, Thomas H. Handy and Sazerac 18 Year Rye. Eagle Rare 17 is the age-led bourbon of the set and the restrained one by strength, bottled at 101 proof rather than barrel proof, where George T. Stagg lands at 136.1 and William Larue Weller at 133.6.",
    },
    {
      question:
        "Why does Eagle Rare 17 Year cost $250 when the 10 Year is $40?",
      answer:
        "Seven more Kentucky summers, and the evaporation that comes with them. A barrel held for seventeen years gives up a large share of its contents to the warehouse, so a release yields a fraction of the bottles a ten-year barrel would, and it is filled once a year rather than continuously. The whiskey is also a different drink: deeper, drier and far longer.",
    },
    {
      question: "Is Eagle Rare 17 Year 90 proof or 101 proof?",
      answer:
        "The bottling listed here is 101 proof, 50.5% ABV. Eagle Rare 17 Year was bottled at 90 proof for most of its history and moved to 101 proof from the 2019 Antique Collection release, which gave it noticeably more mid-palate weight. If you are comparing it against an older bottle you have tasted, expect this one to feel fuller rather than hotter.",
    },
    {
      question: "What does seventeen years in oak actually taste like?",
      answer:
        "Mature rather than woody. The nose is dark caramel, leather, dried orange peel, tobacco and polished oak with a trace of furniture wax, and the palate layers dark toffee, dried fig, candied pecan, baked cherry, clove and vanilla. The finish holds for minutes on oak, cocoa and leather, and that length is the clearest mark of the age.",
    },
    {
      question: "How should I drink Eagle Rare 17 Year?",
      answer:
        "Neat in a Glencairn, about an ounce, left to open for five to ten minutes. A single drop of spring water lifts the nose without thinning the texture, and more than that flattens it. Mixing is not the point of this bottle. If you want something alongside, keep it quiet: dark-chocolate truffles, aged Gouda, smoked duck or pecan tart.",
    },
    {
      question: "Is the three-bottle case of Eagle Rare 17 Year worth it?",
      answer:
        "A three-bottle case is $500, about $167 a bottle against $250 singly, which is $250 saved across the three and the deepest per-bottle discount in the Eagle Rare range. The format suits splitting with two other buyers, or keeping one open and two sealed. There is no six-bottle case for this release, unlike the 10 and 12 Year.",
    },
  ],

  // Elmer T. Lee Single Barrel
  "elmer-t-lee-single-barrel": [
    {
      question: "Is Elmer T. Lee the same as Blanton's?",
      answer:
        "No, but they are close relatives. Both are Buffalo Trace single barrels built on the same grain recipe, listed here as 81% corn, 8% rye and 11% malted barley, and Elmer T. Lee created Blanton's, the first single barrel bourbon, before retiring in 1985. His namesake bottling is 90 proof from Warehouse C at $80, where Blanton's Original is 93 proof at $150.",
    },
    {
      question: "How old is Elmer T. Lee Single Barrel?",
      answer:
        "There is no age statement on the label, so no exact figure is published. The barrels behind it sit in the region of nine years, and because each bottle is filled from one barrel the age moves a little from bottle to bottle. At 90 proof, 45% ABV, that maturity shows as roundness rather than oak.",
    },
    {
      question: "What does Elmer T. Lee taste like?",
      answer:
        "Honeyed and soft. The nose is honey, toasted vanilla, caramel and baked pear over warm oak, and the palate is silky and balanced, with caramel apple, honeycomb and light cinnamon before a medium finish of sweet oak and honey. With only 8% rye in the recipe and a 90-proof bottling, there is very little bite to it.",
    },
    {
      question: "Why is Elmer T. Lee so hard to find?",
      answer:
        "It is bottled one barrel at a time rather than batched, so the quantity behind each selection is small, and it has been an enthusiasts' bottle for decades. We receive it as an allocation rather than ordering it freely, and there is no case format, so bottles are sold individually. When it is listed here, that is the allocation we hold.",
    },
    {
      question: "How should I drink Elmer T. Lee?",
      answer:
        "Neat, or over a single ice cube. Elmer T. Lee was known for saying that any way you enjoy it is the right way, and at 90 proof the whiskey takes a cube without falling apart. A Glencairn shows the honey and baked pear most clearly, though it also makes a soft, sweet old-fashioned if you would rather mix than sip.",
    },
    {
      question: "Does every bottle of Elmer T. Lee taste the same?",
      answer:
        "No, because it is a true single barrel: each bottle is filled from one cask, and the balance of honey, caramel and spice shifts between barrels. The house character holds because barrels are hand-selected from Warehouse C against a consistent profile, so the differences are a matter of degree rather than direction. The strength is fixed at 90 proof for every bottle.",
    },
  ],

  // George T. Stagg
  "george-t-stagg": [
    {
      question: "What proof is George T. Stagg?",
      answer:
        "This bottling is 136.1 proof, 68.05% ABV. It goes into the bottle uncut and unfiltered, so no water is added after the barrel and nothing is stripped out before sealing. Barrel strength shifts from one annual release to the next, so treat 136.1 as the figure for the bottle listed here rather than a fixed house proof.",
    },
    {
      question: "How is George T. Stagg different from Stagg?",
      answer:
        "Age, strength and release pattern. Both are drawn from Buffalo Trace's Mash Bill #1 at 75% corn, 10% rye and 15% malted barley, but George T. Stagg states fifteen years and sits at 136.1 proof as part of the autumn Antique Collection. Stagg carries no age statement at around nine years and 130 proof, and costs $150 against $250 here.",
    },
    {
      question: "Does George T. Stagg need water?",
      answer:
        "Not strictly, but a single drop earns its place. At 68.05% ABV the first sip lands thick and oily with toffee, dark chocolate and candied pecan, and one drop of cool water in a Glencairn lifts the dark caramel and dried cherry on the nose without thinning the body. Give the glass a minute before judging it.",
    },
    {
      question: "Why does George T. Stagg cost $250?",
      answer:
        "Fifteen years in the warehouse, then one release each autumn as part of the Antique Collection. A barrel left that long gives up a large share of its contents to evaporation, and bottling at full strength instead of cutting with water yields fewer bottles still. The price tracks how little exists, and it is a bottle to open rather than to hold.",
    },
    {
      question: "What do uncut and unfiltered mean on the label?",
      answer:
        "Uncut means no water was added to lower the proof; unfiltered means it skipped chill filtration before bottling. Chill filtration pulls out the fatty acids and oils that carry the leather, charred oak and espresso notes here, so leaving them in keeps the texture heavy. A cold bottle may look slightly hazy, which is those oils rather than a fault.",
    },
    {
      question: "How should I store an open bottle of George T. Stagg?",
      answer:
        "Upright, cool and dark, with the closure firmly seated. Standing it up keeps spirit at 68.05% ABV off the cork, which it will degrade over time, and a steady temperature matters more than a cold one. Once the bottle drops below a third, oxygen in the headspace begins flattening the nose, so decant the rest into a smaller sealed bottle.",
    },
  ],

  // King of Kentucky
  "king-of-kentucky": [
    {
      question: "Who makes King of Kentucky?",
      answer:
        "Brown-Forman, in Kentucky, under master distiller Chris Morris. The name dates to 1881 and was revived in 2018 as an annual, hand-selected release, and the format has held since: one barrel per bottling, bottled at the strength it reached in the warehouse, with no chill filtration and nothing blended in.",
    },
    {
      question: "What does single barrel at barrel proof actually mean here?",
      answer:
        "Every bottle in a release comes from one barrel, and that barrel is bottled at its own natural strength. Nothing is blended in to even out differences between barrels and no water is added, so proof and flavour shift from one to the next. The bottle listed here is 127.8 proof, 63.9% ABV.",
    },
    {
      question: "What do fourteen years in oak do to it?",
      answer:
        "They concentrate it. The nose runs to polished oak, dark cherry, tobacco leaf and leather rather than the vanilla and corn sweetness of a young bourbon, and the palate is oily and compact with dried fig, dark chocolate, candied pecan and oak resin. The finish carries oak and dark fruit a long way, with a trace of smoke.",
    },
    {
      question: "Why is King of Kentucky $250 a bottle?",
      answer:
        "Because each bottling is a single fourteen year old barrel, bottled at full strength. One barrel yields what it yields, with no blending to stretch it and no water to raise the count, and fourteen Kentucky summers take a good deal of what went in. One release a year on top of that sets the price.",
    },
    {
      question: "Water, ice, or neat?",
      answer:
        "Neat, with at most a single drop of cool water. At 63.9% ABV the oak is tightly wound, and one drop loosens the dark cherry and dark caramel without softening the body. Ice is the wrong move: chilling mutes the dried fig and oak resin that fourteen years paid for, and the melt keeps moving the proof underneath you.",
    },
    {
      question: "What is the mash bill?",
      answer:
        "79% corn, 11% rye and 10% malted barley, matured in new American white oak at a number 4 char. The high corn share is what holds a sweet centre under all that oak, while the modest rye keeps the spice closer to baking spice than to pepper. Being unfiltered, it can haze when cold.",
    },
  ],

  // Old Rip Van Winkle 10 Year
  "pappy-10": [
    {
      question:
        "Is Old Rip Van Winkle 10 Year the same thing as Pappy Van Winkle?",
      answer:
        "No — same family and same mash bill, different label. This one is bottled as Old Rip Van Winkle, while the Pappy Van Winkle Family Reserve name starts at 15 years. Ten years in char-level-4 oak and 107 proof make it the youngest and sweetest bottling in the line: caramel, butterscotch and baked apple, rather than the leather and tannin the older bottles carry.",
    },
    {
      question: "What makes it a wheated bourbon?",
      answer:
        "The mash bill is 70% corn, 18% wheat and 12% malted barley, with no rye at all. Wheat carries sweetness where rye carries pepper, which is why this reads soft and honeyed instead of spicy. It is the recipe the Van Winkle name is built on, and the reason the whole line stays round even at high proof.",
    },
    {
      question: "Is the 10 Year a good place to start with Van Winkle?",
      answer:
        "Yes, it is the most straightforward bottle in the line. At ten years the oak sits behind the sweetness rather than over it, so you taste toasted brown sugar, baked apple and cinnamon shortbread without having to enjoy tannin first. The 15, 20 and 23 Year all ask more of you, and cost between twice and three times as much.",
    },
    {
      question: "How should I drink it at 107 proof?",
      answer:
        "Neat, 1.5 oz, at room temperature in a Glencairn or rocks glass. At 53.5% ABV it is warm but not hot, and one large ice sphere will open the wheated sweetness without flattening it, so add water only a few drops at a time. It is an after-dinner pour: pecan pie, dark-chocolate truffles, aged Gouda.",
    },
    {
      question: "Why is a ten-year bourbon $250?",
      answer:
        "Scarcity rather than age sets the price. It is a small-batch, non-chill-filtered, hand-dipped and individually numbered release from an allocated line, and retailers receive very little of it each year. Ten-year bourbon normally costs far less, so what you are paying for here is access to the family's wheated stock. Ours is $250 a bottle, or $500 for a three-bottle case.",
    },
    {
      question: "How does the 10 Year compare with Lot B 12 Year?",
      answer:
        "The 10 Year is stronger, Lot B is older and softer. This one runs 107 proof against Lot B's 90.4, so it arrives with more heat and more obvious caramel, while Lot B's two extra years give deeper orchard fruit, dark cherry and a quieter finish at $300. Pick the 10 Year if you like proof, Lot B if you like texture.",
    },
  ],

  // Pappy Van Winkle Family Reserve 15 Year (2023)
  "pappy-van-winkle-15-year": [
    {
      question: "Why is Pappy Van Winkle 15 Year so expensive?",
      answer:
        "Because demand runs far ahead of how much fifteen-year-old wheated bourbon exists. The barrels in this bottle were filled fifteen years ago, when much less was laid down than today's market wants, and each annual release is hand-bottled, individually numbered and allocated to retailers in small quantities. Our price is $500 a bottle, or $1,000 for a three-bottle case.",
    },
    {
      question: "Is the 15 Year better than the 20 or 23 Year?",
      answer:
        "Not better — sweeter and stronger. At 107 proof the 15 is the most recognisably bourbon of the three: vanilla, caramel, brown sugar and dark chocolate, with oak present but not in charge. The 20 and 23 trade that for tannin, leather and dried fruit at lower strength. If you like your bourbon sweet and full-proof, stop here.",
    },
    {
      question: "What does the wheated mash bill do after fifteen years?",
      answer:
        "It is what keeps the bourbon soft under that much oak. With 70% corn, 18% wheat, 12% malted barley and no rye, there is no peppery grain spice to clash with char-level-4 wood, so fifteen years reads as leather, espresso and tannin layered over sweetness rather than fighting it. That balance is why this age is the line's best known.",
    },
    {
      question: "Does it matter that this is the 2023 release?",
      answer:
        "It tells you which annual batch you are getting. Pappy 15 is released once a year from barrels Julian Van Winkle III selects, so bottle numbers and small differences in oak and fruit vary between years. What defines it does not move: fifteen years, 107 proof, 53.5% ABV and the family's wheated mash bill. This listing is the 2023 release.",
    },
    {
      question: "How should I serve the 15 Year?",
      answer:
        "Neat in a Glencairn at room temperature, with a minute in the glass before the first sip. This is the one bottle in the line with enough strength for ice: a single large sphere opens the wheated sweetness without taming 107 proof. After dinner it sits well with dark chocolate, aged cheddar, crème brûlée or toasted pecans.",
    },
    {
      question: "Is it worth buying at retail price?",
      answer:
        "If you are going to open it, yes — this is the age and proof combination the line is known for, and $500 is a retail price for a fifteen-year bourbon that is hard to find at any price. We will not tell you it will appreciate, because that is not a claim a bourbon shop should make. Buy it to pour, not to shelve.",
    },
  ],

  // Pappy Van Winkle Family Reserve 20 Year
  "pappy-van-winkle-20-year": [
    {
      question: "What do five extra years over the 15 Year actually change?",
      answer:
        "They move the bourbon from sweet to deep. The 15 leads with vanilla and brown sugar at 107 proof, while the 20 leads with wood: dark caramel, dried fig, prune, leather and espresso, bottled at 90.4 proof so the oak has room without alcohol pushing behind it. Tannin becomes a structural part of the finish rather than a trace at the edge.",
    },
    {
      question: "Why is the 20 Year lower proof than the 15 Year?",
      answer:
        "Because twenty years of char-level-4 oak does not need reinforcing. At 90.4 proof, or 45.2% ABV, the fig, cocoa and leather stay legible and the texture reads oily rather than hot, where the same liquid at 107 proof would come across as astringent. It is the gentlest bottle in the line to sip, despite being the second oldest.",
    },
    {
      question: "Is the 20 Year better than the 23 Year?",
      answer:
        "It is the less extreme of the two. The 20 holds a clear line between fruit and wood — fig, prune, dark caramel, espresso — while the 23 goes three years further into tannin, tobacco and dried herbs at a slightly higher 95.6 proof. Choose the 20 if you want depth that still tastes like bourbon, the 23 if you want oak to lead.",
    },
    {
      question: "Why does it cost $700 when the 15 Year is $500?",
      answer:
        "Because barrels that survive twenty Kentucky summers are far scarcer than barrels that survive fifteen. Heat and evaporation empty a rickhouse year after year, so each additional year costs more than the one before in lost volume and in casks no longer good enough to bottle. Ours is $700 a bottle, $1,300 for a three-bottle case, and it is listed as allocated rather than in stock.",
    },
    {
      question: "How should I serve the 20 Year?",
      answer:
        "Neat, room temperature, Glencairn, no ice. Let it sit for a minute before the first sip, because two decades of oak opens slowly and cold mutes the fig and cocoa the age paid for. One to one and a half ounces is plenty. Dark-chocolate ganache, aged blue cheese, espresso desserts or fig jam on manchego all work alongside it.",
    },
    {
      question: "Who is the 20 Year for?",
      answer:
        "Drinkers who already know they like old wood. If sherried single malts, long-aged rum or well-aged bourbon are your reference points, the leather, prune and espresso here will land. If you drink bourbon mainly for caramel sweetness and proof, the 15 Year or Lot B give you more of that for less money, and neither will feel like a compromise.",
    },
  ],

  // Pappy Van Winkle Family Reserve 23 Year
  "pappy-van-winkle-23-year": [
    {
      question: "Is the 23 Year actually better than the 15 Year?",
      answer:
        "It is older and more layered, not simply better, because the two aim at different things. The 23 gives up the 15's brown sugar and 107-proof punch in exchange for baked plum, fruitcake, espresso, leather and tobacco leaf, with tannin running through a finish that holds for well over a minute. For the sweet, full-strength side of wheated bourbon, the 15 wins.",
    },
    {
      question: "What does twenty-three years in oak do to a wheated bourbon?",
      answer:
        "It takes the wood as far as the spirit can carry it. Soft red winter wheat has no rye spice to push back, so what builds instead is dried fruit, bittersweet cocoa, leather and a dry tannic grip across the palate. It is bottled at 95.6 proof, a touch above the 20 Year, which gives that oak enough backbone to avoid tasting thin.",
    },
    {
      question: "Why is it only $50 more than the 20 Year?",
      answer:
        "Because age is not the only thing in the price. The 23 lists at $750 against $700 for the 20, while the case price steps further, $1,500 against $1,300, and both are allocated rather than freely stocked. Choose between them on profile instead of price: the 23 is drier and more tannic, the 20 fruitier and softer at 90.4 proof.",
    },
    {
      question: "How should I drink the 23 Year?",
      answer:
        "Pour about 1 oz neat into a Glencairn or copita and leave it five minutes before the first sip. No ice: cold shuts down the fruitcake, espresso and tobacco that twenty-three years built, and at 95.6 proof there is little heat needing to be cut. Sip it slowly after dinner with 85% chocolate or aged Stilton, or with nothing at all.",
    },
    {
      question: "Is the 23 Year worth buying at retail?",
      answer:
        "If you plan to open it, yes — it is the oldest and most oak-driven bottling the family releases, and the only way to taste what twenty-three Kentucky years do to a wheated mash. We will not frame it as an investment or suggest it will gain value, because that is not a claim a bourbon shop should make. Treat $750 as the price of drinking it.",
    },
    {
      question: "Why can I not just buy a bottle whenever I want?",
      answer:
        "Because very few barrels are still worth bottling after twenty-three years in a Kentucky rickhouse, so the 23 is allocated rather than regularly stocked, which is what this page shows instead of a date nobody can promise. If you want the family's wheated character sooner, the Old Rip Van Winkle 10 Year and Lot B 12 Year are currently listed in stock.",
    },
  ],

  // Rock Hill Farms Single Barrel
  "rock-hill-farms-single-barrel": [
    {
      question: "Is Rock Hill Farms a wheated bourbon like Weller?",
      answer:
        "No. Rock Hill Farms is 81% corn, 8% rye and 11% malted barley, one of Buffalo Trace's rye-recipe bourbons, with no wheat in it at all. That rye is what you read as dry spice through the finish, where a wheated bourbon such as Weller fades sweet instead. Same distillery, different recipe family.",
    },
    {
      question: "How is Rock Hill Farms different from Blanton's?",
      answer:
        "They share the same Buffalo Trace rye recipe and both are bottled from single casks, so strength and selection separate them rather than recipe. Rock Hill Farms goes out at 100 proof, 50% ABV, against Blanton's Original at 93 proof, which gives it a fuller body and more pull from the oak. The presentation differs too: a heavy crystal decanter with a silver foil capsule.",
    },
    {
      question: "How does Rock Hill Farms compare with Elmer T. Lee?",
      answer:
        "Both are single barrels off the same Buffalo Trace rye recipe, and the gap is proof and price. Elmer T. Lee is 90 proof, 45% ABV, listed at nine years and $80; Rock Hill Farms is 100 proof, 50% ABV, around eight years and $100. The extra ten proof points give Rock Hill Farms more weight and oak grip for the same spicy, caramel-led profile.",
    },
    {
      question: "How old is Rock Hill Farms?",
      answer:
        "Around eight years: that is the figure our listing carries, and the bottle itself states no age. Buffalo Trace does not publish an age for it, so treat eight years as the working number rather than something printed on the label. At that maturity and 100 proof the oak is present without running the show.",
    },
    {
      question: "What does Rock Hill Farms taste like?",
      answer:
        "Rich and rounded, with a thread of rye spice sitting behind the sweetness. The nose gives caramel, vanilla custard, almond, baked apple and soft oak; the palate is toffee, brown sugar and butterscotch with a hint of cherry; the finish is long and warming on vanilla and toasted oak. The 100 proof is a set bottling strength, not cask strength, so it carries weight without burn.",
    },
    {
      question: "Why is Rock Hill Farms hard to find at retail?",
      answer:
        "Because it is filled one cask at a time and allocated through distributors, so a shop usually receives a few bottles rather than cases. Single-barrel output cannot be scaled up to meet demand the way a batched bourbon can, since there is only ever one barrel in the dump. We list it at $100 a bottle, sold singly, with no case price.",
    },
  ],

  // Russell's Reserve 13 Year
  "russells-reserve-13-year": [
    {
      question: "Is Russell's Reserve 13 Year barrel proof?",
      answer:
        "It is bottled at barrel strength rather than cut down to a set number, and it skips chill filtration as well. This release is 114.8 proof, 57.4% ABV. Because it is batched from a group of barrels, the proof printed on the label moves between releases, so take 114.8 as the figure for the bottle listed here.",
    },
    {
      question: "How is it different from standard Wild Turkey 101?",
      answer:
        "Age, strength and what stays in the bottle. Wild Turkey 101 carries no age statement and is bottled at 101 proof, while this one states thirteen years, arrives at 114.8 proof and goes in without chill filtration. Its barrels come from the warehouses the Russells rate highest on Tyrone Hill, which shows as deeper toasted oak and dried orange peel.",
    },
    {
      question: "What does non-chill filtered mean, and does it matter?",
      answer:
        "It means the whiskey was bottled without being chilled and filtered to strip out fatty acids and esters. Those compounds carry weight, which is why this drinks oily rather than clean through caramel, baked apple and cinnamon. The trade-off is cosmetic: a cold bottle or an ice cube can turn it cloudy, which is normal and changes nothing about the taste.",
    },
    {
      question: "Does it need water?",
      answer:
        "Less than the barrel-proof bottlings around it. At 114.8 proof it opens without help, and it suits a rocks glass neat or over one large cube, which stretches the brown sugar and oak resin on the finish. If you do add water, go a few drops at a time, since there is less proof here to absorb it.",
    },
    {
      question: "What is alligator char?",
      answer:
        "It is the deepest char used on bourbon barrels, a number 4 char burnt long enough that the inside of the stave cracks into a pattern resembling alligator hide. That thick layer of charred wood is what drives the toasted oak, vanilla bean and brown sugar here, and across thirteen years it gives the whiskey its weight rather than scorching it.",
    },
    {
      question: "Why does Russell's Reserve 13 Year cost $200?",
      answer:
        "Thirteen years is a long time to leave a barrel alone, and the loss to evaporation over that span is steep. Wild Turkey puts it out in limited batches drawn from specific warehouses, so the quantity is fixed well before it reaches a shelf. The price covers the age and the batch size, not a collector's premium.",
    },
  ],

  // Stagg
  "stagg-bourbon": [
    {
      question: "Is Stagg the same whiskey as Stagg Jr.?",
      answer:
        "Yes, it is the same bourbon under a shorter name. It launched as Stagg Jr. in 2013 and dropped the Jr. from Batch 18 in 2022, with no change to the barrel-proof, unfiltered format behind it. Older bottles still carry the Jr. label, so the two names describe one release at different points in its history.",
    },
    {
      question: "What proof is this Stagg bottling?",
      answer:
        "130 proof, 65% ABV, straight from the barrel with no water added and no chill filtration. Each Stagg batch is released at its own natural strength and they vary noticeably, so this figure belongs to the batch listed here rather than to the line as a whole. Expect a hot, peppery arrival that settles into molasses and espresso.",
    },
    {
      question: "How does Stagg compare with George T. Stagg?",
      answer:
        "Stagg is the younger of the two bottlings. Both come from Mash Bill #1 at barrel strength, but Stagg has no age statement and runs around nine years at 130 proof, where George T. Stagg states fifteen years at 136.1 proof. Stagg also arrives in numbered batches through the year rather than one autumn drop, at $150 against $250.",
    },
    {
      question: "Does Stagg work in cocktails?",
      answer:
        "Yes, more readily than most barrel-proof bourbons. At 130 proof the molasses, candied fruit and peppery oak survive dilution, so an Old Fashioned or a Boulevardier holds its shape where a 90 proof bourbon would vanish into the drink. Pour a shorter measure than the recipe asks for and pull the sugar back accordingly.",
    },
    {
      question:
        "Why is Stagg allocated when the standard Buffalo Trace bottlings are not?",
      answer:
        "Bottling at barrel strength is most of the answer. Nothing is added to extend it, so a barrel fills far fewer 750ml bottles at 65% ABV than it would at 90 proof, and each batch is finite the moment it is dumped. Buffalo Trace also releases it in discrete batches rather than continuously, so supply arrives in waves.",
    },
    {
      question: "Neat or over ice?",
      answer:
        "Neat first, then decide. Poured straight, the nose gives caramel, cherry cordial, vanilla and toasted oak, and a single large cube afterwards tightens the peppery oak while stretching the dark chocolate finish. Avoid small cubes: at 65% ABV they melt fast and leave the whiskey watery by the halfway point.",
    },
  ],

  // Thomas H. Handy Sazerac
  "thomas-h-handy-sazerac": [
    {
      question: "Is Thomas H. Handy a bourbon or a rye?",
      answer:
        "It is a straight rye whiskey, not a bourbon. The mash bill is 51% rye, 39% corn and 10% malted barley, clearing the 51% rye minimum the category requires, and it is the rye entry in the Buffalo Trace Antique Collection alongside that collection's bourbons. Expect pepper, clove and anise where a bourbon would give caramel.",
    },
    {
      question: "What proof is Thomas H. Handy Sazerac?",
      answer:
        "130.9 proof, 65.45% ABV, bottled uncut and unfiltered. Barrel strength changes from one annual release to the next, so this figure describes the bottle listed here. At that strength the arrival is genuinely hot: black pepper and hot cinnamon first, with baked apple and dark caramel sitting behind them.",
    },
    {
      question:
        "Why is it only six years old when other Antique Collection releases are much older?",
      answer:
        "Because the point of it is rye character rather than oak. Roughly six years in new charred American oak leaves the toasted rye bread, anise and cooling mint out in front, with oak spice supporting them; much longer and the barrel starts covering the grain. The older bottlings in the collection are bourbons, which are built around that oak.",
    },
    {
      question: "Should I drink it neat or make a Sazerac with it?",
      answer:
        "Both are fair uses of it. Neat, a few drops of water bring the heat down and open the candied citrus peel; in a Sazerac or a Vieux Carre it does the job the drink was built around, since Handy was the New Orleans bartender who moved the cocktail from cognac to rye. Pour short and taste before adding sugar.",
    },
    {
      question:
        "How is this different from the bourbons in the Antique Collection?",
      answer:
        "The grain, mainly. With 51% rye and no wheat, Handy runs dry and peppery through black pepper, cinnamon and mint, where George T. Stagg and William Larue Weller run to caramel, dark fruit and leather. It is also the youngest of the Antique Collection releases at roughly six years, and sits at $200 a bottle.",
    },
    {
      question: "Why does Thomas H. Handy cost $200?",
      answer:
        "One release a year, bottled at full strength, in a small allocation. Nothing is added to extend it, so a barrel of six year old rye at 130.9 proof fills relatively few bottles, and the Antique Collection ships once each autumn. The price follows that scarcity; it does not mean the rye you drink weekly is wrong.",
    },
  ],

  // Van Winkle Special Reserve Lot B 12 Year
  "van-winkle-lot-b-12-year": [
    {
      question: "Is Lot B the same as Pappy Van Winkle?",
      answer:
        "Not quite — it is bottled as Van Winkle Special Reserve, not Pappy Van Winkle Family Reserve, although it comes from the same family, the same wheated mash bill and the same Buffalo Trace production. The difference in the glass is age and strength: twelve years at 90.4 proof here, against fifteen years at 107 proof for the first Pappy-labelled bottle.",
    },
    {
      question: "What does 'Lot B' on the label mean?",
      answer:
        "It is a barrel-lot designation that has stayed on the bottle, and it does not signal a different recipe or a different distillery. What matters is the rest of the label: twelve years in new charred American oak at char level 4, 90.4 proof, non-chill-filtered, and the same 70% corn wheated mash bill used across the Van Winkle line.",
    },
    {
      question: "Why is Lot B bottled at 90.4 proof?",
      answer:
        "Because at twelve years it does not need more strength. At 90.4 proof, or 45.2% ABV, the honey, butterscotch and dark cherry arrive immediately rather than behind a wall of heat, which makes this the easiest bottle in the line to drink a full measure of. The 107-proof releases are more intense but less forgiving.",
    },
    {
      question: "Is Lot B worth $300?",
      answer:
        "It is the least expensive route into mature Van Winkle character, which is the argument for it. Twelve years, non-chill-filtered and hand-bottled at $300, or $600 for a three-bottle case, against $500 and up for the Pappy-labelled bottles. If what you actually want is oak and tannin, the older expressions deliver that and this one will feel light.",
    },
    {
      question: "How should I drink Lot B?",
      answer:
        "Neat in a Glencairn at room temperature, about 1.5 oz, with a few drops of water to lift the sweetness. Avoid heavy dilution: at 90.4 proof there is less to cut through than in the 107-proof bottlings, and water thins the butterscotch and cherry quickly. Aged Gouda, charcuterie, pecan pie or glazed pork belly all suit it.",
    },
    {
      question: "Should I buy Lot B or the Pappy 15 Year?",
      answer:
        "Lot B if you intend to drink it regularly, the 15 Year if you want the darker, stronger version of the same idea. Three more years and 107 proof give the 15 leather, espresso and dark chocolate that Lot B never reaches, and the price steps from $300 to $500. Lot B is the better everyday pour; the 15 is the bigger one.",
    },
  ],

  // W.L. Weller Full Proof
  "weller-full-proof": [
    {
      question: "What does 'full proof' mean on Weller Full Proof?",
      answer:
        "It means the bourbon is bottled at 114 proof, the strength at which it went into the barrel, instead of being cut with water first. That is not quite the same as barrel strength: a barrel-proof whiskey is bottled at whatever the cask reads after ageing, while full proof matches the entry figure. In the glass that comes to 57% ABV.",
    },
    {
      question: "Do I need to add water to Weller Full Proof?",
      answer:
        "You do not need to, but a few drops help. Pour an ounce neat into a Glencairn first to read the whole 114 proof, then add two or three drops of spring water: because the whiskey is never chill filtered, the oils bloom and the dark caramel and baked cherry push forward. Go slowly, as a heavy pour of water flattens 57% ABV quickly.",
    },
    {
      question:
        "Why is Weller Full Proof non-chill-filtered, and what does that change?",
      answer:
        "Chill filtration strips out the fatty acids and esters that cloud whiskey when it gets cold, and Buffalo Trace leaves them in here. You taste that as texture: a heavier, oilier body that coats the mouth, and more of the leather and cocoa in the finish. The trade-off is only cosmetic, so expect a faint haze if you chill the glass or add water.",
    },
    {
      question: "How is Weller Full Proof different from Weller 12 Year?",
      answer:
        "Proof, filtration and age statement. Full Proof is 114 proof, 57% ABV, is not chill filtered and states no age; Weller 12 Year is 90 proof, 45% ABV, chill filtered and twelve years old. Both are built on the same 70% corn, 16% wheat and 14% malted barley mash bill, so what separates them in the glass is strength and texture rather than grain.",
    },
    {
      question: "Does Weller Full Proof have an age statement?",
      answer:
        "No. The label gives you the entry proof of 114 and nothing about years in wood. Which barrels go into each batch is the distillery's call, which is why drinkers discuss batches as being a little different from one another, while the mash bill and the 114-proof bottling strength stay the same throughout.",
    },
    {
      question: "What food goes with Weller Full Proof?",
      answer:
        "Fat and char hold up to it best: smoked brisket, dry-aged ribeye, glazed pork belly, aged blue cheese and a flourless dark-chocolate cake. At 114 proof it will walk straight over anything delicate, while the dark caramel, brown sugar and cinnamon in the palate meet sweet-savoury glazes head-on. Bourbon-soaked cherries pick up the baked stone fruit.",
    },
  ],

  // W.L. Weller Single Barrel
  "weller-single-barrel": [
    {
      question: "What does single barrel mean for Weller Single Barrel?",
      answer:
        "It means each bottling comes from one cask rather than a blend of many. The usual practice is to marry barrels together so every bottle tastes alike; here one barrel is selected, dumped and bottled at 97 proof on its own. Mash bill and bottling proof are fixed, so what varies is what that particular cask did over its years in oak.",
    },
    {
      question: "Will two bottles of Weller Single Barrel taste the same?",
      answer:
        "Not exactly, and that is the point of the format. Position in the rickhouse, the wood of the barrel itself and the summers it sat through all shift the balance, so one bottle may lean towards honey and orchard fruit and the next towards dark caramel and oak. Everything measurable holds steady: 97 proof, 48.5% ABV, 70% corn, 16% wheat, 14% malted barley.",
    },
    {
      question: "Is Weller Single Barrel bottled at barrel strength?",
      answer:
        "No. It is proofed down to 97 proof, 48.5% ABV, before bottling, so the single-barrel part of the name describes how the whiskey was chosen rather than how strong it is. If you want a Weller bottled without that dilution, Full Proof is the one, at 114. At 97 proof this sits in the middle of the range.",
    },
    {
      question: "Why does Weller Single Barrel cost more than Weller 12 Year?",
      answer:
        "It is scarcity rather than extra years. Weller Single Barrel states no age and is bottled at 97 proof, where Weller 12 Year gives you twelve stated years at 90 proof for $100; we list Single Barrel at $250. Filling one cask at a time keeps supply thin against steady demand, and the price follows that rather than anything in the wood.",
    },
    {
      question: "What does Weller Single Barrel taste like?",
      answer:
        "Vanilla bean, honey and toasted almond on the nose, with orchard fruit over a layer of caramel and oak. The palate turns to dark caramel, baked apple, brown sugar and cinnamon, full-bodied without the heat 48.5% ABV implies, and the finish runs long on toasted oak, vanilla cream, baking spice and a trace of leather. Being one cask, your bottle will sit near that description rather than exactly on it.",
    },
    {
      question: "How should I serve Weller Single Barrel?",
      answer:
        "Neat, about 1.5 oz in a Glencairn at room temperature, is where it shows most. The 97 proof needs no taming, though a single large ice sphere or a few drops of water lifts the honey and apple without thinning the body. Aged cheddar, pecan pie, roasted nuts or dark-chocolate truffles all sit well beside it.",
    },
  ],

  // Weller 12 Year
  "weller-12-year": [
    {
      question: "What does wheated bourbon mean?",
      answer:
        "It means wheat takes the place of rye as the secondary grain. Weller 12 Year is 70% corn, 16% wheat and 14% malted barley, with no rye in the recipe, so the dry pepper a rye bourbon gives you simply is not there. What fills that space is honey, vanilla and baked stone fruit, and a finish that fades sweet rather than sharp.",
    },
    {
      question: "Is Weller 12 Year the same whiskey as Pappy Van Winkle?",
      answer:
        "No, although the two are closer relatives than most. Both are wheated bourbons distilled at Buffalo Trace, so the family resemblance is real, but they are aged and selected separately and the recipes are close rather than identical: Weller 12 Year is 16% wheat and 14% malted barley, Pappy 15 Year 18% wheat and 12% malted barley. Weller 12 is bottled at 90 proof against Pappy 15's 107.",
    },
    {
      question: "Which Weller should I buy first?",
      answer:
        "Weller 12 Year, if you want the range's reference point. At 90 proof and a full twelve years it is the gentlest of the four and the only one carrying an age statement that long, so it shows what wheat and time do with no heat in the way. Once you know that profile, Full Proof at 114 and the 97-proof Single Barrel make sense by comparison.",
    },
    {
      question: "Why is Weller 12 Year so hard to find at retail?",
      answer:
        "Because the volume was fixed twelve years ago. Every bottle is bourbon that went into a rickhouse more than a decade back, so present demand cannot increase what is ready to bottle now. Buffalo Trace releases it to distributors on allocation and shops ration what they receive. We list it at $100 a bottle.",
    },
    {
      question: "What does Weller 12 Year taste like?",
      answer:
        "Round and sweet, with twelve years of oak behind it. The nose is vanilla, honey, toasted caramel and baked cherry; the palate adds dark caramel and baked stone fruit over a silky body with no harsh edges; the finish is medium-long, vanilla cream and toasted oak fading clean. At 45% ABV it drinks softer than its age would suggest.",
    },
    {
      question:
        "Is a case of Weller 12 Year cheaper than buying single bottles?",
      answer:
        "Yes. One bottle is $100, while a twelve-bottle case is $1,000, which works out at roughly $83 a bottle and saves about $200 against twelve separate purchases. Weller 12 is also the only one of these Wellers sold in twelves; Full Proof, Single Barrel and CYPB cases hold six.",
    },
  ],

  // Weller CYPB
  "weller-cypb": [
    {
      question: "What does CYPB stand for?",
      answer:
        "Craft Your Perfect Bourbon. Buffalo Trace handed the specification to the bourbon community in a 2015 survey, asking what people would build if the choice were theirs, and the answers were consistent: a wheated mash bill, around eight years of age and 95 proof. The first Weller CYPB release followed in October 2018, built to that brief.",
    },
    {
      question: "Does Weller CYPB have an age statement?",
      answer:
        "Yes, eight years, and it came out of the survey rather than a blender's judgement. That makes CYPB and Weller 12 Year the two Wellers here with stated ages, while Full Proof and Single Barrel carry none. Eight years at 95 proof is a deliberately middle setting: enough oak to read as mature, not enough to cover the wheat.",
    },
    {
      question: "How is Weller CYPB different from Weller 12 Year?",
      answer:
        "Four years of ageing and five points of proof. CYPB is eight years old at 95 proof, 47.5% ABV; Weller 12 Year is twelve years old at 90 proof, 45% ABV. The younger whiskey reads brighter and more orchard-fruited, with baked apple, honeyed wheat and cinnamon, where the twelve-year leans into darker caramel and oak. Price differs too: $200 against $100.",
    },
    {
      question: "Does Weller CYPB work in cocktails?",
      answer:
        "Yes. At 95 proof it has the strength to survive the dilution an old-fashioned puts a whiskey through, and the honey and brown-sugar sweetness means you need very little added sugar in the glass. Neat in a Glencairn is still the clearest read of it, or over one large cube if you want the sweetness softened.",
    },
    {
      question: "Why is Weller CYPB hard to find?",
      answer:
        "It was built to one fixed specification rather than set up as a continuing line, so it turns up in occasional releases instead of year-round production, and what does turn up is allocated. The survey that produced it also made the bottle well known before any of it existed, which put demand ahead of supply from the start. We list it at $200 a bottle.",
    },
    {
      question: "What does Weller CYPB taste like?",
      answer:
        "Orchard fruit and honey more than dark sugar. The nose is vanilla, honey, soft caramel and a touch of fresh-baked bread; the palate brings brown sugar, baked apple, cinnamon, honeyed wheat and a hint of dark chocolate; the finish is medium, with vanilla cream, toasted oak and a faint cocoa fade. Apple pie, aged Gouda or roasted pecans suit it.",
    },
  ],

  // William Larue Weller
  "william-larue-weller": [
    {
      question: "What makes William Larue Weller a wheated bourbon?",
      answer:
        "There is no rye in the mash bill. It is 70% corn, 16% soft red winter wheat and 14% malted barley, so the secondary grain brings a honeyed softness instead of the pepper rye would add. That is why the palate reads as brown sugar, stewed dark fruit and honeyed wheat even at this strength.",
    },
    {
      question: "What proof and age is this release?",
      answer:
        "133.6 proof, 66.8% ABV, from the 2023 release, with roughly twelve years in new charred American white oak. It is bottled uncut and without chill filtration, straight from the barrel. Proof and barrel character move a little between annual releases, so these numbers describe the bottle listed here rather than every year of the bottling.",
    },
    {
      question: "How is it different from Weller 12 Year?",
      answer:
        "Strength and filtration, not recipe. Both carry twelve years and the same wheated mash bill, but Weller 12 Year is cut to 90 proof and chill filtered, while William Larue Weller goes into the bottle at 133.6 proof with nothing taken out. The result is denser and more viscous, at $250 a bottle or $1,250 for a case of six, against $100 for the 12 Year.",
    },
    {
      question: "Is this related to Pappy Van Winkle?",
      answer:
        "They share a recipe lineage. The wheated mash bill passed from Weller's company to Stitzel-Weller and into the Van Winkle family before reaching Buffalo Trace, where it is still distilled for both lines. The difference in the glass is proof: the Pappy bottlings are cut with water, while this one is bottled straight from the barrel at 133.6 proof.",
    },
    {
      question: "Do I need to add water at 133.6 proof?",
      answer:
        "A few drops of spring water help, though it is less punishing than the number suggests. The texture is viscous enough to carry 66.8% ABV without turning sharp, and water mostly opens the nose: cherry preserves, vanilla bean, leather and a little pipe tobacco. It is not built for cocktails, since the undiluted mid-palate is the whole point.",
    },
    {
      question: "What food goes with it?",
      answer:
        "Sweet and fatty things hold up best. Dark chocolate truffles, pecan pie, cherry cobbler and aged Gouda echo the baked fruit and caramel, while smoked brisket, glazed pork belly and roasted nuts give the oak and 66.8% ABV something to cut through. With delicate food, serve it after the meal rather than alongside it.",
    },
  ],
};

export function faqsForProduct(slug: string): ProductFaqItem[] {
  return PRODUCT_FAQS[slug] ?? [];
}

/** How many bottles currently carry answers. Used by the content audit. */
export function faqCoverage(): { slugs: string[]; questions: number } {
  const slugs = Object.keys(PRODUCT_FAQS);
  return {
    slugs,
    questions: slugs.reduce((n, s) => n + PRODUCT_FAQS[s].length, 0),
  };
}
