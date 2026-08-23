// Location / visitor landing pages.
//
// Bourbon & Oak has ONE physical site — the distillery at 1876 Oak Barrel Lane,
// Bardstown KY. Everything here must stay consistent with that. A page for a
// city we do not operate in is written as a *catchment* page ("we are 40 miles
// south of you, here is how to get here"), never as a second storefront:
// inventing branch locations misleads customers and is exactly the pattern
// Google's local spam policy targets.
//
// To add a location: append to LOCATIONS. /visit/[city] and the sitemap pick it
// up automatically.

export type LocationFaq = { question: string; answer: string };

export type LocationSection = {
  heading: string;
  paragraphs: string[];
  list?: string[];
};

export type Location = {
  slug: string;
  /** ISO date this page's copy last changed. Drives <lastmod> in the sitemap —
      never let it predate publication, or crawlers deprioritise a new page. */
  updatedAt: string;
  /** City this page targets — not necessarily where we are. */
  city: string;
  /** True when the physical distillery is in this city. */
  isPrimarySite: boolean;
  /** One-line summary for the /visit index card. Falls back to metaDescription. */
  cardSummary?: string;
  /** Short distance/drive line for the /visit index card, e.g.
      "59 miles · about 1 hr 5 min". For the primary site this is the address
      instead — there is no drive. */
  driveNote?: string;
  title: string;
  h1: string;
  subtitle: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  heroImage: string;
  heroAlt: string;
  intro: string[];
  sections: LocationSection[];
  faq: LocationFaq[];
};

// The one real site. Used for NAP consistency across every location page and
// the Organization schema in layout.tsx — these must never disagree.
export const DISTILLERY = {
  name: "Bourbon & Oak Distillery",
  streetAddress: "1876 Oak Barrel Lane",
  addressLocality: "Bardstown",
  addressRegion: "KY",
  postalCode: "40004",
  addressCountry: "US",
  telephone: "+1-502-555-0199",
  email: "support@bourbonoaklover.com",
  latitude: "37.8095",
  longitude: "-85.4669",
} as const;

/* TODO (owner): no opening hours are published anywhere on the site, so none
   are emitted in schema. Publishing wrong hours is worse than publishing none —
   Google surfaces them directly in the local panel. Add real hours here and
   wire them into `openingHoursSpecification` when you have them. */

export const LOCATIONS: Location[] = [
  {
    slug: "bardstown",
    updatedAt: "2026-08-16",
    city: "Bardstown",
    isPrimarySite: true,
    cardSummary:
      "Our one and only site — the working distillery, the rickhouses and the tasting room, on the same ground since 1876.",
    driveNote: "1876 Oak Barrel Lane · free on-site parking",
    title: "Visit the Distillery in Bardstown",
    h1: "Visit Our Distillery in Bardstown, Kentucky",
    subtitle:
      "Six generations of bourbon, made and matured on the same ground since 1876 — in the town that calls itself the Bourbon Capital of the World.",
    metaTitle: "Bourbon Distillery in Bardstown, KY | Visit Bourbon & Oak",
    metaDescription:
      "Visit Bourbon & Oak in Bardstown, Kentucky — address, directions, parking, what to see on site, and how the distillery fits into the Kentucky Bourbon Trail.",
    keywords: [
      "bourbon distillery Bardstown",
      "Bardstown Kentucky bourbon",
      "distillery near me Bardstown",
      "Bourbon Capital of the World",
      "Kentucky Bourbon Trail Bardstown",
      "things to do in Bardstown Kentucky",
      "bourbon tasting Bardstown",
      "Bardstown distillery tours",
    ],
    heroImage: "/visit-shop.webp",
    heroAlt:
      "Backlit shelves of Kentucky bourbon in the Bourbon & Oak tasting room in Bardstown",
    intro: [
      "Bardstown has a fair claim to being the most concentrated square mileage of whiskey-making anywhere on earth. Within a short drive of our gate there are more working distilleries than most countries manage, and the town has been shipping bourbon since long before it was fashionable. We have been part of that since 1876, on the same ground, under the same family.",
      "This page covers the practical side of coming to see us: where we are, how to get here, what is actually on site, and what else is worth your time while you are in town.",
    ],
    sections: [
      {
        heading: "Where We Are",
        paragraphs: [
          "The distillery sits on the edge of Bardstown, a few minutes from the town square. The rickhouses are visible from the road — if you can see the black-stained warehouse roofs, you have found us.",
        ],
        list: [
          "1876 Oak Barrel Lane, Bardstown, KY 40004",
          "Phone: (502) 555-0199",
          "Email: support@bourbonoaklover.com",
          "Free on-site parking, including coach and RV spaces",
        ],
      },
      {
        heading: "Getting Here",
        paragraphs: [
          "Bardstown is roughly 40 miles south-east of Louisville — about a 45 minute drive on a clear run. From Louisville, take I-65 south and join the Bluegrass Parkway east, or follow KY-245 through the heart of the bourbon country if you would rather see the landscape than the interstate.",
          "From Lexington the drive is a little over an hour west along the Bluegrass Parkway. The nearest commercial airport is Louisville Muhammad Ali International (SDF), about 45 minutes away; there is no public transport that reaches us, so plan on a car or a booked tour coach.",
        ],
      },
      {
        heading: "What Is On Site",
        paragraphs: [
          "This is a working distillery rather than a visitor centre with a still parked outside for photographs. Depending on the day and the season you may walk past an active fermenter, a running column still, or a crew dumping barrels.",
        ],
        list: [
          "The mash floor and still house, in operation on production days",
          "Rickhouse No. 7, our newest warehouse, holding 20,000 barrels",
          "The tasting room, where flights are poured at cask strength and proofed side by side",
          "The bottling line and single-barrel selection room",
        ],
      },
      {
        heading: "Tours and Tastings",
        paragraphs: [
          "Everything on site runs by advance booking rather than walk-up, because the rickhouse walks are capped at small numbers and the barrel-pick experience takes half a day. Tour options, durations and current pricing are listed in full on the tours page.",
        ],
      },
      {
        heading: "While You Are In Bardstown",
        paragraphs: [
          "You are unlikely to have come all this way for one distillery, and we would not pretend you should. Bardstown packs an unusual amount into a small town.",
        ],
        list: [
          "My Old Kentucky Home State Park, the house behind the state song, ten minutes from us",
          "The Oscar Getz Museum of Whiskey History on the old Spalding Hall site",
          "The Bardstown town square, worth an hour on foot for the architecture alone",
          "Several other Kentucky Bourbon Trail stops within a fifteen minute drive",
        ],
      },
    ],
    faq: [
      {
        question: "Where is Bourbon & Oak located?",
        answer:
          "At 1876 Oak Barrel Lane, Bardstown, Kentucky 40004, on the edge of town a few minutes from the square. There is free on-site parking including coach and RV spaces.",
      },
      {
        question: "How far is Bardstown from Louisville?",
        answer:
          "About 40 miles south-east, or roughly a 45 minute drive. Take I-65 south to the Bluegrass Parkway east, or follow KY-245 for the scenic route through bourbon country.",
      },
      {
        question: "Do I need to book a tour in advance?",
        answer:
          "Yes. Rickhouse walks are capped at small group sizes and the private barrel-pick experience takes most of a day, so everything runs by advance booking rather than walk-up.",
      },
      {
        question: "Is Bourbon & Oak on the Kentucky Bourbon Trail?",
        answer:
          "We sit in Bardstown, the town at the centre of the Trail, with several other stops within a fifteen minute drive. Most visitors build us into a Bardstown day rather than treating us as a standalone trip.",
      },
      {
        question: "Can I buy allocated bottles at the distillery?",
        answer:
          "Allocated releases such as the Buffalo Trace Antique Collection arrive in fixed quantities that cannot be increased, so availability at the gate changes constantly. Current stock is listed in the online collection.",
      },
      {
        question: "Is the distillery accessible?",
        answer:
          "The tasting room, bottling line and parking are step-free. Rickhouse floors are reached by stairs and the surfaces are uneven working warehouse floors, so please call ahead on (502) 555-0199 and we will plan a route that works.",
      },
    ],
  },
  {
    slug: "louisville",
    updatedAt: "2026-08-16",
    city: "Louisville",
    isPrimarySite: false,
    cardSummary:
      "The shortest run into bourbon country, and the reason most Louisville visitors end up in Bardstown anyway.",
    driveNote: "40 miles · about 45 min via I-65 and the Bluegrass Parkway",
    title: "Bourbon Distillery Near Louisville",
    h1: "A Kentucky Distillery 45 Minutes From Louisville",
    subtitle:
      "We are not in Louisville — we are in Bardstown, and that drive south is the best hour you will spend on a bourbon trip.",
    metaTitle: "Bourbon Distillery Near Louisville, KY | Bourbon & Oak",
    metaDescription:
      "Looking for a bourbon distillery near Louisville? Bourbon & Oak is 40 miles south in Bardstown — directions, drive time, and how to build a day trip from the city.",
    keywords: [
      "bourbon distillery near Louisville",
      "distillery day trip from Louisville",
      "Louisville bourbon tour",
      "Kentucky Bourbon Trail from Louisville",
      "bourbon tasting near Louisville",
      "Bardstown from Louisville",
      "things to do near Louisville Kentucky",
    ],
    heroImage: "/blog-btac.webp",
    heroAlt:
      "Kentucky bourbon poured at a distillery tasting room bar within driving distance of Louisville",
    intro: [
      "Let us be straightforward about this, because plenty of pages like this one are not: Bourbon & Oak does not have a Louisville location. Our distillery is in Bardstown, about 40 miles south-east of the city.",
      "That matters less than you might think. Almost nobody making bourbon at any scale is inside Louisville city limits, and the drive south is short, genuinely scenic, and passes through the densest concentration of working distilleries in the world. This page is about making that trip worth doing.",
    ],
    sections: [
      {
        heading: "The Drive From Louisville",
        paragraphs: [
          "Roughly 40 miles, and about 45 minutes without traffic. Two sensible routes: I-65 south then the Bluegrass Parkway east, which is quickest, or KY-245 south-east, which is slower by ten minutes and considerably better looking — rolling farmland, horse fence and rickhouses on the ridgelines.",
          "If you are flying in, Louisville Muhammad Ali International (SDF) is the closest airport and the drive from the terminal is much the same. There is no train or bus that reaches Bardstown, so hire a car or book onto a tour coach.",
        ],
      },
      {
        heading: "Building a Day Trip",
        paragraphs: [
          "A Louisville-based bourbon day works best if you stop chasing distilleries and pick a cluster. Bardstown is the obvious one, because you can walk between several and still be back in the city for dinner.",
        ],
        list: [
          "Leave Louisville mid-morning — most distillery tours start on the hour and the roads are quiet after nine",
          "Book two tours, not four. Three hours of rickhouse walking is plenty, and tasting flights compound",
          "Eat in Bardstown rather than driving back hungry; the square has more than it looks like it should",
          "Nominate a driver before the first pour. Kentucky's limits are not generous and the road back is rural and dark",
        ],
      },
      {
        heading: "Why Bardstown Rather Than Whiskey Row",
        paragraphs: [
          "Louisville's Whiskey Row is genuinely good, and if you only have an afternoon it is the sensible choice. What it cannot give you is scale. The experience that changes how people think about bourbon is standing on the upper floor of a working rickhouse in August, where the heat is brutal, the air is thick with evaporating whiskey, and you can hear the barrels working.",
          "That is not something a downtown visitor centre can reproduce, and it is the reason the drive is worth making.",
        ],
      },
      {
        heading: "Shipping to Louisville and Beyond",
        paragraphs: [
          "If the trip is not happening this time, we ship. Kentucky permits direct-to-consumer alcohol shipping, so orders reach Louisville addresses without difficulty; an adult signature is required on delivery. Rules elsewhere vary considerably by state, and a handful prohibit it outright.",
        ],
      },
    ],
    faq: [
      {
        question: "Is there a bourbon distillery in Louisville?",
        answer:
          "There are several downtown visitor experiences on Whiskey Row, but most large-scale production sits outside the city. Bourbon & Oak is in Bardstown, about 40 miles south-east and a 45 minute drive.",
      },
      {
        question: "How long does it take to drive from Louisville to Bardstown?",
        answer:
          "Roughly 45 minutes on a clear run. I-65 south to the Bluegrass Parkway east is quickest; KY-245 takes about ten minutes longer and is far more scenic.",
      },
      {
        question: "Can I visit a distillery without a car from Louisville?",
        answer:
          "Not easily. No train or public bus service reaches Bardstown, so you will need a hire car, a rideshare, or a seat on an organised bourbon tour coach departing from Louisville.",
      },
      {
        question: "How many distilleries should I visit in one day?",
        answer:
          "Two. Tours run 60 to 90 minutes each and tasting flights accumulate quickly. Four stops sounds ambitious and ends up being a blur with a designated driver who has seen four gift shops.",
      },
      {
        question: "Do you ship bourbon to Louisville?",
        answer:
          "Yes. Kentucky allows direct-to-consumer shipping, so Louisville addresses are straightforward. An adult signature is required at delivery. Rules for other states vary and some prohibit it entirely.",
      },
    ],
  },
  {
    slug: "lexington",
    updatedAt: "2026-08-20",
    city: "Lexington",
    isPrimarySite: false,
    cardSummary:
      "An hour west along the Bluegrass Parkway, past more of the Kentucky Bourbon Trail than any other approach.",
    driveNote: "59 miles · about 1 hr 5 min via US-60 and the Bluegrass Parkway",
    title: "Visiting From Lexington",
    h1: "A Bourbon Distillery an Hour From Lexington",
    subtitle:
      "We are not in Lexington — we are 59 miles west in Bardstown, at the far end of the Bluegrass Parkway. It is the easiest hour's drive in Kentucky bourbon.",
    metaTitle: "Bourbon Distillery Near Lexington, KY | Bourbon & Oak",
    metaDescription:
      "Looking for a bourbon distillery near Lexington? Bourbon & Oak is 59 miles west in Bardstown — about an hour on the Bluegrass Parkway. Routes, timings, and how to plan the day.",
    keywords: [
      "bourbon distillery near Lexington",
      "Lexington to Bardstown",
      "Kentucky Bourbon Trail from Lexington",
      "distillery day trip from Lexington KY",
      "bourbon tasting near Lexington",
      "Bluegrass Parkway distilleries",
      "things to do near Lexington Kentucky",
      "Lexington bourbon tour",
      "bourbon distillery near me Lexington",
    ],
    heroImage: "/shop-shelves.webp",
    heroAlt:
      "Backlit shelves of Kentucky bourbon in the Bourbon & Oak shop, an hour west of Lexington in Bardstown",
    intro: [
      "Bourbon & Oak is not in Lexington. Our distillery is in Bardstown, 59 miles west, and there is no second site — one address, one phone number, one set of rickhouses, the same ones the family has been filling since 1876. If a listing offers you a Lexington branch of a Bardstown distillery, it is a shop, not a distillery.",
      "What Lexington does have is the best road to us. The Bluegrass Parkway begins a short drive from the city's western edge and runs straight into bourbon country on a road that is almost never busy. This page covers that drive, what is worth stopping for along it, and how to turn the trip into a proper day out rather than two hours of windscreen.",
    ],
    sections: [
      {
        heading: "The Drive From Lexington",
        paragraphs: [
          "Fifty-nine miles, and about an hour and five minutes without stops. Head west out of Lexington on US-60 through Versailles and pick up the Bluegrass Parkway at its eastern end. From there it is a straight run west — the parkway covers 71 miles between Versailles and Elizabethtown — and you leave it at Exit 21 for US-150, the Springfield Road, which drops you into Bardstown a few minutes from our gate.",
          "One thing that catches first-timers out: the Bluegrass Parkway does not connect directly to I-64. If your navigation is insisting on the interstate it is sending you a longer way round. US-60 west through Versailles is the correct approach.",
          "The scenic alternative is US-62 west through Lawrenceburg and Bloomfield. It adds roughly twenty-five minutes and takes you through horse fence, tobacco barns and a great deal of rolling limestone country. In October it is worth every extra minute.",
        ],
        list: [
          "59 miles, roughly 1 hour 5 minutes on a clear run",
          "Fastest: US-60 west to the Bluegrass Parkway, west to Exit 21 (US-150)",
          "Scenic: US-62 west via Lawrenceburg and Bloomfield, about 25 minutes longer",
          "Blue Grass Airport (LEX) serves Lexington; Louisville (SDF) is the closer airport to us",
          "No rail and no scheduled bus service reaches Bardstown — you will need a car or a tour coach",
        ],
      },
      {
        heading: "What You Pass On The Way",
        paragraphs: [
          "The Lexington approach runs through the best-stocked stretch of the Kentucky Bourbon Trail, which is both an opportunity and a trap. You can build an excellent two-day route out of it. You cannot do it all in an afternoon, and trying to is the most common mistake we see.",
        ],
        list: [
          "Woodford Reserve, just outside Versailles, barely ten minutes into the drive",
          "Four Roses and Wild Turkey, both at Lawrenceburg and a short hop off the parkway",
          "Buffalo Trace at Frankfort, a detour north on US-127 of about twenty minutes",
          "Willett, Heaven Hill and Barton 1792, all in Bardstown itself alongside us",
        ],
      },
      {
        heading: "Making It a Day or a Weekend",
        paragraphs: [
          "An hour each way makes a Lexington day trip genuinely comfortable. Leave at nine, see two distilleries properly rather than four badly, and be home for dinner.",
          "With two days, base yourself in Bardstown overnight and split the route: the Versailles and Lawrenceburg distilleries on the way out, the Bardstown cluster on the way back. That way the drive earns its keep twice. Our Kentucky Bourbon Trail guide on the blog works through how to sequence the stops without spending the whole day in the car.",
        ],
        list: [
          "Book before you leave. Rickhouse walks here are capped at small numbers and go weeks ahead in spring and autumn",
          "Two distilleries a day is the honest maximum; three is a blur and four is a gift shop tour",
          "Leave two hours between bookings — the country roads between stops are slower than the map suggests",
          "Eat in Bardstown rather than on the parkway; there is very little on the road itself",
          "A private barrel pick takes most of a day on its own. Do not pair one with anything else",
        ],
      },
      {
        heading: "Where To Stay",
        paragraphs: [
          "Lexington has far more rooms than Bardstown, and if you are already there you may as well use them. An hour is not a long enough drive to justify moving hotels for a single distillery.",
          "For a two-day trip Bardstown is the better base despite the smaller supply. Rooms in town book out badly from April through to the first frost, and during Kentucky Bourbon Festival week in September they are effectively gone by spring. Book early, or stay in Lexington and drive.",
        ],
      },
      {
        heading: "Someone Has To Drive",
        paragraphs: [
          "This is the part most bourbon trip guides skate over. A trail tasting is several pours, a good number of them at barrel strength rather than 80 proof, and Kentucky's limit is 0.08 with no useful margin in it. The parkway is a fast rural road and the last stretch into Bardstown is unlit.",
          "The options that actually work are simple: nominate a driver and mean it, book a Lexington-based bourbon coach that does the driving for you, or stay the night in Bardstown and walk. Rideshare coverage in Nelson County is thin and unreliable after dark, so do not build a plan around it.",
          "If you are the driver, say so when you book and we will plan the tasting around it rather than leaving you with a glass of water for an hour.",
        ],
      },
    ],
    faq: [
      {
        question: "How far is Bardstown from Lexington?",
        answer:
          "About 59 miles, or an hour and five minutes on a clear run. Take US-60 west through Versailles to the Bluegrass Parkway, then west to Exit 21 for US-150 into Bardstown.",
      },
      {
        question: "Is there a Bourbon & Oak distillery in Lexington?",
        answer:
          "No. We have one site only — 1876 Oak Barrel Lane, Bardstown, Kentucky 40004, about an hour west of Lexington. There are other distilleries in and around Lexington, but none of them are ours.",
      },
      {
        question: "What is the best route from Lexington to Bardstown?",
        answer:
          "US-60 west to the Bluegrass Parkway and west to Exit 21 is quickest. Note that the parkway does not connect directly to I-64, so routing via the interstate takes longer. US-62 through Lawrenceburg and Bloomfield is about twenty-five minutes slower and considerably prettier.",
      },
      {
        question: "Can I do the Kentucky Bourbon Trail as a day trip from Lexington?",
        answer:
          "Part of it, comfortably. Two distilleries in a day is realistic with an hour's drive each way. Attempting four means seeing very little of any of them, and the trail as a whole needs several days.",
      },
      {
        question: "Do I need to book a tour in advance?",
        answer:
          "Yes. Rickhouse walks are capped at small group sizes and the private barrel-pick experience takes most of a day, so everything runs by advance booking rather than walk-up.",
      },
      {
        question: "Do you ship bourbon to Lexington?",
        answer:
          "Yes. Kentucky permits direct-to-consumer shipping, so Lexington addresses are straightforward, and an adult signature is required at delivery. Availability for allocated releases changes constantly — the online collection shows what is actually in stock.",
      },
    ],
  },
  {
    slug: "cincinnati",
    updatedAt: "2026-08-20",
    city: "Cincinnati",
    isPrimarySite: false,
    cardSummary:
      "A straight run south on I-71 into Kentucky — a long day trip, and an excellent weekend.",
    driveNote: "131 miles · about 2 hr 10 min via I-71 and I-65",
    title: "Visiting From Cincinnati",
    h1: "Kentucky Bourbon Country, Two Hours South of Cincinnati",
    subtitle:
      "We have one distillery and it is in Bardstown, Kentucky — 131 miles south of Cincinnati, and the natural anchor for a bourbon weekend.",
    metaTitle: "Bourbon Distillery Near Cincinnati | Bourbon & Oak, Bardstown KY",
    metaDescription:
      "Bourbon & Oak is 131 miles south of Cincinnati in Bardstown, Kentucky — about two hours ten minutes via I-71. Routes, where to stay, and how to plan a bourbon weekend.",
    keywords: [
      "bourbon distillery near Cincinnati",
      "Cincinnati to Bardstown",
      "Kentucky Bourbon Trail from Cincinnati",
      "bourbon weekend from Cincinnati",
      "distillery road trip from Cincinnati",
      "Cincinnati to Kentucky bourbon country",
      "bourbon tasting near Cincinnati",
      "things to do south of Cincinnati Ohio",
      "CVG to Bardstown Kentucky",
    ],
    heroImage: "/bar-cabinet.webp",
    heroAlt:
      "A dark wood bar cabinet stocked with Kentucky bourbon, of the kind shipped to collectors in Cincinnati",
    intro: [
      "There is no Bourbon & Oak in Cincinnati, or anywhere in Ohio. We have a single distillery, at 1876 Oak Barrel Lane in Bardstown, Kentucky, and every bottle we make comes off that one site. This page exists because a great many people search for a bourbon distillery near Cincinnati and deserve a straight answer about where the nearest real one is and what the drive actually involves.",
      "The answer is 131 miles, most of it on a single interstate, and it lands you in the densest concentration of working distilleries anywhere in the world. It makes a long day trip and a very good weekend.",
    ],
    sections: [
      {
        heading: "The Drive From Cincinnati",
        paragraphs: [
          "About 131 miles and two hours ten minutes with clear roads. I-71 south is the spine of it — roughly a hundred miles down through northern Kentucky to Louisville, then round the city on I-265, the Gene Snyder Freeway, and onto I-65 south.",
          "Leave I-65 at Exit 112 for KY-245 and head east. That last twenty minutes is the good part: it runs through Clermont past the edge of Bernheim Forest and comes into Bardstown through open country rather than off a slip road.",
          "If you would rather approach from the east, the alternative is I-75 south to Lexington and then west on the Bluegrass Parkway. It is longer at around 140 miles, but it puts the Versailles and Lawrenceburg distilleries on your route instead of saving them for another trip.",
        ],
        list: [
          "131 miles, about 2 hours 10 minutes on a clear run",
          "Fastest: I-71 south, I-265 (Gene Snyder) west, I-65 south, Exit 112 for KY-245 east",
          "Eastern alternative: I-75 south to Lexington, then the Bluegrass Parkway west, around 140 miles",
          "Cincinnati/Northern Kentucky International (CVG) already sits on the Kentucky side of the river",
          "Louisville is the only real bottleneck — avoid crossing it between 4pm and 6pm on a weekday",
        ],
      },
      {
        heading: "Day Trip or Weekend",
        paragraphs: [
          "Four and a half hours of driving for a single tour is a lot to ask of a Saturday. It can be done — leave at seven, take a morning tour and an afternoon tour, be home by eight — but you will spend more of the day in the car than in a rickhouse.",
          "Two days is the version we would actually recommend. Drive down Friday evening or early Saturday, spend a full day on the trail, stay in or near Bardstown, and drive back Sunday with a stop in Louisville on the way.",
        ],
        list: [
          "Friday evening: drive down, eat in Bardstown, early night",
          "Saturday: two distillery tours with a proper lunch between them",
          "Saturday evening: the Bardstown square, which has more in it than a town that size should",
          "Sunday: one more stop, or Louisville's Whiskey Row on the way home",
        ],
      },
      {
        heading: "What Is Worth Stopping For",
        paragraphs: [
          "Bardstown is not a one-distillery town, and we would not pretend otherwise. Within fifteen minutes of our gate there are several more Kentucky Bourbon Trail stops, and the town itself has a genuinely old square rather than a reconstructed one.",
        ],
        list: [
          "Heaven Hill, Willett and Barton 1792, all a short drive from us",
          "Jim Beam's home site at Clermont, which you pass on KY-245 coming in",
          "Bernheim Arboretum and Research Forest, 16,000 acres next to Clermont",
          "My Old Kentucky Home State Park, ten minutes from the distillery",
          "The Oscar Getz Museum of Whiskey History, on the old Spalding Hall site in town",
        ],
      },
      {
        heading: "Where To Stay",
        paragraphs: [
          "Bardstown is a small town with a big season. Rooms are comfortable and reasonably priced between November and March, and close to impossible during Kentucky Bourbon Festival week in September.",
          "If Bardstown is full, Louisville is 45 minutes north with the room supply of a proper city and Whiskey Row within walking distance of most downtown hotels. Elizabethtown, 25 minutes south-west on I-65, is the cheaper fallback and nobody's idea of a night out.",
        ],
      },
      {
        heading: "Driving, Drinking and Crossing the River",
        paragraphs: [
          "Ohio's rules do not follow you south. Kentucky's limit is 0.08 and enforcement on the roads around Bardstown is not casual — this is a bourbon county and the police know exactly what visitors are there to do.",
          "Tastings accumulate faster than most people expect: several distilleries, three or four pours each, a good share of it above 100 proof. Nominate a driver, book a coach, or stay the night. Rideshare in Nelson County thins out badly after dark, so it is not a plan. Tell us when you book if you are driving and we will arrange your tasting around it.",
          "If the trip is not happening this year, we ship. Rules for sending spirits across state lines vary a great deal and change often, and Ohio's are not Kentucky's — the shipping page carries the current state-by-state position, and an adult signature is required at delivery wherever we can ship.",
        ],
      },
    ],
    faq: [
      {
        question: "How far is Bardstown, Kentucky from Cincinnati?",
        answer:
          "About 131 miles, or two hours ten minutes on a clear run. Take I-71 south to Louisville, I-265 round the city to I-65 south, then Exit 112 for KY-245 east into Bardstown.",
      },
      {
        question: "Is there a bourbon distillery near Cincinnati?",
        answer:
          "Not one of ours. Bourbon & Oak has a single site, in Bardstown, Kentucky, about two hours south. Bardstown is the closest place to Cincinnati where several working bourbon distilleries sit within a few minutes of each other.",
      },
      {
        question: "Can I visit the Kentucky Bourbon Trail as a day trip from Cincinnati?",
        answer:
          "You can, with an early start and no more than two tours, but it means roughly four and a half hours of driving in a day. A two-night weekend based in or near Bardstown gets you far more for the same fuel.",
      },
      {
        question: "What is the best route from Cincinnati to Bardstown?",
        answer:
          "I-71 south to Louisville and I-65 south is quickest. If you want the Versailles and Lawrenceburg distilleries on the way, take I-75 south to Lexington and the Bluegrass Parkway west instead — about ten miles longer and a far better bourbon route.",
      },
      {
        question: "Where should I stay for the Bourbon Trail from Cincinnati?",
        answer:
          "Bardstown itself if you can get a room, Louisville at 45 minutes north if you cannot, Elizabethtown at 25 minutes south-west as the budget option. Book months ahead for September, when the Kentucky Bourbon Festival fills the town.",
      },
      {
        question: "Do you ship bourbon to Ohio?",
        answer:
          "Shipping spirits across state lines is governed state by state and the rules change, so check the shipping page for the current position before ordering. Where we can ship, an adult signature is required at delivery.",
      },
    ],
  },
  {
    slug: "nashville",
    updatedAt: "2026-08-20",
    city: "Nashville",
    isPrimarySite: false,
    cardSummary:
      "I-65 north until you cross into Eastern time, then twenty minutes east into the Bourbon Capital of the World.",
    driveNote: "154 miles · about 2 hr 30 min via I-65 north",
    title: "Visiting From Nashville",
    h1: "A Kentucky Bourbon Distillery Two and a Half Hours From Nashville",
    subtitle:
      "One straight run north on I-65 separates Nashville from Bardstown — 154 miles, one time zone, and the difference between Tennessee whiskey and Kentucky bourbon.",
    metaTitle: "Bourbon Distillery Near Nashville | Bourbon & Oak, Bardstown KY",
    metaDescription:
      "Bourbon & Oak is 154 miles north of Nashville in Bardstown, Kentucky — about two and a half hours up I-65. The route, the time-zone change, where to stay, and how to plan the trip.",
    keywords: [
      "bourbon distillery near Nashville",
      "Nashville to Bardstown",
      "Kentucky Bourbon Trail from Nashville",
      "bourbon trip from Nashville",
      "Nashville to Kentucky bourbon country",
      "day trip from Nashville to Kentucky",
      "bourbon tasting near Nashville",
      "I-65 north from Nashville distilleries",
      "Tennessee whiskey versus Kentucky bourbon",
    ],
    heroImage: "/blog-btac.webp",
    heroAlt:
      "Allocated Kentucky bourbon bottles lined up at the Bourbon & Oak distillery, two and a half hours north of Nashville",
    intro: [
      "Bourbon & Oak has no Nashville location and no Tennessee location. There is one distillery, in Bardstown, Kentucky, 154 miles north of you. We say that plainly because the results for \"bourbon distillery near Nashville\" are full of pages that imply otherwise.",
      "The good news is that the drive is about as simple as American road trips get: I-65 north, until Tennessee runs out and then some. Two and a half hours later you are in the town that calls itself the Bourbon Capital of the World, with more working distilleries inside fifteen minutes than Nashville has inside two hours.",
    ],
    sections: [
      {
        heading: "The Drive From Nashville",
        paragraphs: [
          "154 miles and about two and a half hours. I-65 north the whole way, through Bowling Green and on past Elizabethtown, and there are two sensible ways to finish it.",
          "The quicker one: leave I-65 at Exit 93 in Elizabethtown for the Bluegrass Parkway east, then come off at Exit 21 for US-150 into Bardstown. The prettier one: stay on I-65 to Exit 112 and take KY-245 east through Clermont, past Bernheim Forest, and into town through open bourbon country. The second costs a handful of minutes and is worth them.",
          "Reset your watch. Somewhere between Cave City and Elizabethtown you cross from Central into Eastern time and lose an hour. Every season we have Nashville visitors arrive an hour late for a booking because of it, so build the change into your departure time rather than your arrival time.",
        ],
        list: [
          "154 miles, about 2 hours 30 minutes on a clear run",
          "Fastest: I-65 north to Exit 93, Bluegrass Parkway east, off at Exit 21 (US-150)",
          "Prettier: I-65 north to Exit 112, then KY-245 east via Clermont",
          "You lose an hour crossing into Eastern time in south-central Kentucky",
          "Louisville Muhammad Ali International (SDF) is the nearest airport to us if you would rather fly",
        ],
      },
      {
        heading: "Worth Stopping For On I-65",
        paragraphs: [
          "The middle two hours of this drive have more to them than the interstate signage suggests, and if you are making a weekend of it there is no reason to do the whole thing in one push.",
        ],
        list: [
          "Mammoth Cave National Park, the longest cave system known anywhere, signposted from Exit 53 at Cave City",
          "Bowling Green, roughly an hour in, for the National Corvette Museum",
          "Jim Beam's home site at Clermont, if you take the KY-245 finish",
          "Bernheim Arboretum and Research Forest, on the same road",
        ],
      },
      {
        heading: "Tennessee Whiskey Is Not Kentucky Bourbon",
        paragraphs: [
          "If you have already done the Tennessee Whiskey Trail you arrive with a head start, but the two spirits are genuinely different and it is worth knowing how before you taste.",
          "Both are corn-heavy and both go into new charred oak. The difference is the Lincoln County Process — the sugar-maple charcoal mellowing that Tennessee whiskey passes through before it is barrelled, and bourbon does not. It strips a particular set of sharper notes and leaves a rounder, sweeter spirit. Kentucky bourbon goes into the barrel unfiltered, which is a large part of why a high-rye Kentucky pour arrives with more edge on it.",
          "Our post on bourbon versus whiskey works through the legal definitions properly if you want the full version before your flight, and the wheated versus high-rye piece explains what to expect from either side of our line-up.",
        ],
      },
      {
        heading: "Planning the Trip",
        paragraphs: [
          "Five hours of driving makes a same-day round trip a real commitment. Plenty of people do it, but it means an early start and no more than two tours.",
          "The standard Nashville version of this trip is two nights. Drive up Friday, spend Saturday on the trail from a Bardstown base, and drive home Sunday morning before the traffic builds on I-65.",
        ],
        list: [
          "Book tours before you set off — rickhouse walks are small-group and go weeks in advance",
          "Two distilleries a day, not four. The flights compound and the drives between stops are slower than they look",
          "Bardstown rooms are scarce during Kentucky Bourbon Festival week in September; Louisville at 45 minutes and Elizabethtown at 25 are the fallbacks",
          "Kentucky's drink-drive limit is 0.08 and the roads around Bardstown are rural and unlit — nominate a driver at the start of the day, not the end of it",
          "Tell us when you book if you are the designated driver and we will plan your tasting around it",
        ],
      },
      {
        heading: "If You Cannot Make the Drive",
        paragraphs: [
          "We ship, but the rules for sending spirits across state lines are set state by state and they change, so check the shipping page for the current position before you order. An adult signature is required at delivery wherever we can send a bottle.",
          "Allocated releases are the part worth planning around. They arrive in fixed quantities that cannot be increased, they move quickly, and no page can promise them — the online collection shows what is genuinely in stock at any given moment.",
        ],
      },
    ],
    faq: [
      {
        question: "How far is Bardstown, Kentucky from Nashville?",
        answer:
          "About 154 miles, or two and a half hours on a clear run. It is I-65 north almost the entire way, leaving the interstate at Exit 93 for the Bluegrass Parkway or at Exit 112 for KY-245.",
      },
      {
        question: "Is there a bourbon distillery near Nashville?",
        answer:
          "Tennessee has a strong whiskey trail of its own, but Bourbon & Oak is not part of it. We have one site, in Bardstown, Kentucky, 154 miles north — the closest point where several working bourbon distilleries sit within minutes of each other.",
      },
      {
        question: "Is Bardstown in a different time zone from Nashville?",
        answer:
          "Yes. Nashville is on Central time and Bardstown is on Eastern, and the boundary crosses I-65 in south-central Kentucky between Cave City and Elizabethtown. Driving north you lose an hour, so set off earlier than the map suggests.",
      },
      {
        question: "Can I do the Kentucky Bourbon Trail as a day trip from Nashville?",
        answer:
          "Technically, with a very early start and two tours at most, but that is five hours of driving in a day. Two nights based in or near Bardstown is the trip most Nashville visitors are happier with.",
      },
      {
        question: "What is the difference between Tennessee whiskey and Kentucky bourbon?",
        answer:
          "Tennessee whiskey is filtered through sugar-maple charcoal before it goes into the barrel — the Lincoln County Process. Bourbon is not, which leaves more of the raw distillate character in the barrel to develop. Everything else, from the corn-dominant mash bill to the new charred oak, is broadly the same.",
      },
      {
        question: "What is the best route from Nashville to Bardstown?",
        answer:
          "I-65 north to Exit 93 in Elizabethtown, then the Bluegrass Parkway east and off at Exit 21 for US-150, is the quickest. Staying on I-65 to Exit 112 and taking KY-245 east through Clermont adds a few minutes and is much the better drive.",
      },
    ],
  },
  {
    slug: "frankfort",
    updatedAt: "2026-08-22",
    city: "Frankfort",
    isPrimarySite: false,
    cardSummary:
      "The state capital sits an hour north-east of us, close enough that Frankfort and Bardstown make one comfortable day together.",
    driveNote: "56 miles · about 1 hr via US-127 and the Bluegrass Parkway",
    title: "Visiting From Frankfort",
    h1: "A Bourbon Distillery an Hour From Frankfort, Kentucky",
    subtitle:
      "Fifty-six miles of Kentucky between the state capital and the Bourbon Capital of the World — the shortest run to us from any city on this list.",
    metaTitle: "Bourbon Distillery Near Frankfort, KY | Bourbon & Oak",
    metaDescription:
      "Bourbon & Oak is 56 miles from Frankfort, Kentucky — about an hour via US-127 and the Bluegrass Parkway. Directions, what to see on site, and how to pair it with a capital day.",
    keywords: [
      "bourbon distillery near Frankfort KY",
      "Frankfort to Bardstown",
      "Kentucky Bourbon Trail from Frankfort",
      "distillery day trip Frankfort Kentucky",
      "bourbon tasting near Frankfort",
      "things to do near Frankfort Kentucky",
      "Bluegrass Parkway distilleries",
      "Kentucky capital bourbon trip",
      "Frankfort Kentucky whiskey tour",
    ],
    heroImage: "/visit-shop.webp",
    heroAlt:
      "Backlit shelves in the Bourbon & Oak tasting room, an hour from Frankfort, Kentucky",
    intro: [
      "Bourbon & Oak has no Frankfort location. There is one distillery, in Bardstown, 56 miles south-west of the capital — a little over an hour on a clear run. We state that plainly because plenty of results for \"bourbon distillery near Frankfort\" imply a branch that does not exist.",
      "Of every city on this page, Frankfort is the easiest. It is close enough that you can see us and be back for dinner, and close enough that the two towns genuinely make one day rather than two.",
    ],
    sections: [
      {
        heading: "The Drive",
        paragraphs: [
          "Take US-127 south out of Frankfort toward Lawrenceburg, then pick up the Bluegrass Parkway west and come off at Exit 21 for US-150 into Bardstown. It is 56 miles and about an hour, almost all of it on open road.",
          "The alternative is prettier and barely longer: stay on US-127 through Lawrenceburg, then cut across on KY-55 through Bloomfield. Two-lane road through horse country, perhaps ten minutes more, and considerably better to look at than a parkway.",
        ],
        list: [
          "1876 Oak Barrel Lane, Bardstown, KY 40004",
          "56 miles · roughly 1 hour",
          "Free on-site parking, including coach and RV spaces",
          "No public transport reaches us — plan on a car or a booked tour",
        ],
      },
      {
        heading: "Making a Day of Both Towns",
        paragraphs: [
          "Frankfort has its own claim on this story, and the sensible version of this trip treats the two towns as one itinerary rather than choosing between them. Start in the capital in the morning, drive down after lunch, and take an afternoon tour with us.",
          "That ordering matters for a practical reason: tasting first and driving second is a bad plan, and an afternoon slot with us leaves the drive home for someone who has not been pouring.",
        ],
      },
      {
        heading: "What Is On Site",
        paragraphs: [
          "This is a working distillery rather than a visitor centre. Depending on the day you may walk past an active fermenter, a running column still, or a crew dumping barrels.",
        ],
        list: [
          "The mash floor and still house, in operation on production days",
          "Rickhouse No. 7, our newest warehouse, holding 20,000 barrels",
          "The tasting room, where flights are poured at cask strength and proofed side by side",
          "The bottling line and single-barrel selection room",
        ],
      },
      {
        heading: "Booking",
        paragraphs: [
          "Everything runs by advance reservation rather than walk-up, because the rickhouse walks are capped at small numbers and the private barrel pick takes most of a day. Tour options and current pricing are listed in full on the tours page.",
          "For a Frankfort visitor the afternoon Heritage Tour is usually the right choice: it leaves the morning free at home and gets you back before evening.",
        ],
      },
      {
        heading: "Designated Drivers",
        paragraphs: [
          "An hour each way is short enough that people talk themselves into driving after a tasting. Do not. A tasting flight is several pours of cask-strength whiskey, and Kentucky's limit arrives well before you feel it.",
          "Nominate a driver before you leave Frankfort, or book a car for the return. Every flight can be poured as samples to take away instead, and we would far rather send you home with them than have you rush the room.",
        ],
      },
    ],
    faq: [
      {
        question: "How far is Bardstown from Frankfort?",
        answer:
          "56 miles, about an hour by road. Take US-127 south to the Bluegrass Parkway west and exit at 21 for US-150, or stay on US-127 and cut across on KY-55 through Bloomfield for the scenic version.",
      },
      {
        question: "Is there a Bourbon & Oak in Frankfort?",
        answer:
          "No. We have one site, the distillery at 1876 Oak Barrel Lane in Bardstown. Frankfort is an hour away by car and there is no branch, shop or tasting room in the capital.",
      },
      {
        question: "Can I visit Frankfort and Bardstown in one day?",
        answer:
          "Comfortably. Spend the morning in the capital, drive down after lunch and take an afternoon tour. Doing it in that order also keeps the driving away from the tasting.",
      },
      {
        question: "Do I need to book a tour in advance?",
        answer:
          "Yes. Rickhouse walks are capped at small group sizes and the private barrel pick takes most of a day, so everything runs by advance reservation rather than walk-up.",
      },
      {
        question: "Can you ship to a Frankfort address instead?",
        answer:
          "Yes. Kentucky permits direct-to-consumer shipping, so Frankfort addresses are straightforward. An adult signature is required at delivery, and the shipping page carries the current terms.",
      },
      {
        question: "What else is worth seeing in Bardstown?",
        answer:
          "My Old Kentucky Home State Park, the Oscar Getz Museum of Whiskey History, and the town square, which is worth an hour on foot. Several other Kentucky Bourbon Trail stops sit within a fifteen minute drive.",
      },
    ],
  },
  {
    slug: "indianapolis",
    updatedAt: "2026-08-22",
    city: "Indianapolis",
    isPrimarySite: false,
    cardSummary:
      "A straight run south on I-65 — 154 miles, about two and a half hours, and one time-zone change to watch for.",
    driveNote: "154 miles · about 2 hr 30 min via I-65 south",
    title: "Visiting From Indianapolis",
    h1: "A Kentucky Bourbon Distillery Two and a Half Hours From Indianapolis",
    subtitle:
      "One interstate, one state line and one time zone separate Indianapolis from Bardstown — and Indiana's own distilling history makes the drive better company than most.",
    metaTitle: "Bourbon Distillery Near Indianapolis | Bourbon & Oak, Bardstown KY",
    metaDescription:
      "Bourbon & Oak is 154 miles south of Indianapolis in Bardstown, Kentucky — about two and a half hours down I-65. The route, the time-zone change, where to stay, and how to plan the trip.",
    keywords: [
      "bourbon distillery near Indianapolis",
      "Indianapolis to Bardstown",
      "Kentucky Bourbon Trail from Indianapolis",
      "bourbon trip from Indiana",
      "day trip Indianapolis to Kentucky bourbon",
      "I-65 south distilleries",
      "bourbon tasting near Indianapolis",
      "Indiana to Kentucky whiskey tour",
      "weekend trip from Indianapolis",
    ],
    heroImage: "/bar-cabinet.webp",
    heroAlt:
      "Warm backlit bourbon shelving at the Bourbon & Oak distillery, a drive south of Indianapolis",
    intro: [
      "Bourbon & Oak has no Indianapolis location and no Indiana location. There is one distillery, in Bardstown, Kentucky, 154 miles south of you — about two and a half hours down I-65.",
      "It is one of the simplest drives on this page: a single interstate almost the whole way, with one thing to watch that catches people out.",
    ],
    sections: [
      {
        heading: "The Drive",
        paragraphs: [
          "I-65 south out of Indianapolis, past Columbus and Seymour, across the Ohio River at Louisville, and stay on it to Exit 112 for KY-245 east through Clermont into Bardstown. 154 miles, about two and a half hours without traffic.",
          "Louisville is the pinch point. I-65 through downtown backs up badly at rush hour in both directions, so leaving Indianapolis before seven or after nine in the morning is worth the effort.",
        ],
        list: [
          "1876 Oak Barrel Lane, Bardstown, KY 40004",
          "154 miles · roughly 2 hours 30 minutes",
          "Free on-site parking, including coach and RV spaces",
          "Nearest airport to us is Louisville (SDF), about 45 minutes out",
        ],
      },
      {
        heading: "The Time Zone",
        paragraphs: [
          "Indianapolis and Bardstown are both on Eastern time, so unlike the drive up from Nashville there is no hour to lose. That surprises people who assume crossing into Kentucky means changing clocks — it does in the west of the state, but not on this route.",
          "It matters because tour slots are booked in Eastern time. If you are coming from somewhere in Indiana that observes Central, check your own clock rather than assuming.",
        ],
      },
      {
        heading: "Two Days Is Better Than One",
        paragraphs: [
          "Five hours of driving in a day, with a tasting in the middle, is a poor plan. Most people who try the round trip in one go end up rushing the part they came for.",
          "Stay a night in Bardstown or Louisville instead. Bardstown puts you inside walking distance of the town square and within fifteen minutes of several other trail stops; Louisville gives you restaurants and hotels and leaves a 45 minute run down in the morning.",
        ],
        list: [
          "Day one: drive down, afternoon tour with us, dinner and a night in Bardstown",
          "Day two: two or three more trail stops within fifteen minutes, then home",
          "Or base in Louisville and drive out each morning",
        ],
      },
      {
        heading: "What Is On Site",
        paragraphs: [
          "This is a working distillery rather than a visitor centre with a still parked outside for photographs.",
        ],
        list: [
          "The mash floor and still house, in operation on production days",
          "Rickhouse No. 7, our newest warehouse, holding 20,000 barrels",
          "The tasting room, where flights are poured at cask strength and proofed side by side",
          "The bottling line and single-barrel selection room",
        ],
      },
      {
        heading: "Designated Drivers",
        paragraphs: [
          "Two and a half hours home is a long way to drive having tasted, and Kentucky's limit arrives well before most people expect. Nominate a driver before you leave Indianapolis, or book the night.",
          "Every flight can be poured as take-away samples instead. We would much rather you carry it home than hurry through the room.",
        ],
      },
    ],
    faq: [
      {
        question: "How far is Bardstown from Indianapolis?",
        answer:
          "154 miles, about two and a half hours. Take I-65 south through Louisville to Exit 112, then KY-245 east through Clermont into Bardstown.",
      },
      {
        question: "Is there a Bourbon & Oak in Indianapolis?",
        answer:
          "No. There is one site, the distillery at 1876 Oak Barrel Lane in Bardstown, Kentucky. Nothing in Indiana — this page exists to help you get here, not to imply a branch.",
      },
      {
        question: "Do I lose an hour driving from Indianapolis to Bardstown?",
        answer:
          "No. Both are on Eastern time and this route stays in it the whole way. The Central time zone begins further west in Kentucky, not on I-65 between Louisville and Bardstown.",
      },
      {
        question: "Can I do Indianapolis to Bardstown as a day trip?",
        answer:
          "You can, but five hours of driving around a tasting makes for a rushed day. Staying a night in Bardstown or Louisville is a much better trip and lets you add other trail stops.",
      },
      {
        question: "When is the best time to leave to avoid traffic?",
        answer:
          "Before seven or after nine in the morning. I-65 through downtown Louisville is the pinch point on this route and it backs up in both directions at rush hour.",
      },
      {
        question: "Can you ship to an Indiana address instead?",
        answer:
          "Rules for shipping spirits across state lines vary by state and change often. The shipping page carries the current position, and an adult signature is required at delivery wherever we can ship.",
      },
    ],
  },
  {
    slug: "chicago",
    updatedAt: "2026-08-22",
    city: "Chicago",
    isPrimarySite: false,
    cardSummary:
      "337 miles straight down I-65, or a short flight into Louisville — the longest run on this page, and worth a weekend rather than a day.",
    driveNote: "337 miles · about 5 hr 30 min via I-65, or fly to Louisville",
    title: "Visiting From Chicago",
    h1: "Getting to Kentucky Bourbon Country From Chicago",
    subtitle:
      "Five and a half hours down a single interstate, or a ninety-minute flight and a short drive — two honest ways to reach Bardstown from Chicago.",
    metaTitle: "Kentucky Bourbon Distillery From Chicago | Bourbon & Oak",
    metaDescription:
      "Bourbon & Oak is 337 miles from Chicago in Bardstown, Kentucky — about five and a half hours on I-65, or a short flight into Louisville. Routes, timings and how to plan the weekend.",
    keywords: [
      "Kentucky bourbon distillery from Chicago",
      "Chicago to Bardstown Kentucky",
      "Kentucky Bourbon Trail from Chicago",
      "bourbon weekend from Chicago",
      "Chicago to Kentucky bourbon country",
      "fly Chicago to Louisville bourbon",
      "I-65 Chicago to Kentucky",
      "bourbon trip planning Chicago",
      "Midwest bourbon trail trip",
    ],
    heroImage: "/blog-collecting.webp",
    heroAlt:
      "A collection of Kentucky bourbon at the Bourbon & Oak distillery, a weekend trip from Chicago",
    intro: [
      "Bourbon & Oak has no Chicago location and no Illinois location. There is one distillery, in Bardstown, Kentucky, 337 miles south of the city. This page is about getting here, not about a branch that does not exist.",
      "This is the longest journey on this page, and the one where flying genuinely competes with driving. Both are reasonable; they suit different trips.",
    ],
    sections: [
      {
        heading: "Driving: One Interstate, Most of the Way",
        paragraphs: [
          "I-65 begins at Gary, Indiana and runs south through Indianapolis and Louisville. From Chicago you pick it up via I-90/I-94 east around the bottom of the lake, then stay on I-65 for roughly 300 miles, coming off at Exit 112 for KY-245 east into Bardstown.",
          "337 miles, about five and a half hours in clear conditions. Realistically it is a seven hour day with stops, and Chicago's own traffic getting out of the city is the least predictable part of the whole run.",
        ],
        list: [
          "1876 Oak Barrel Lane, Bardstown, KY 40004",
          "337 miles · about 5 hours 30 minutes driving",
          "Free on-site parking, including coach and RV spaces",
          "Chicago is on Central time and Bardstown on Eastern — you lose an hour on the way down",
        ],
      },
      {
        heading: "Flying: The Faster Option",
        paragraphs: [
          "Louisville Muhammad Ali International (SDF) is roughly a ninety minute flight from either Chicago airport, and Bardstown is about 45 minutes further by car. Door to door that is usually half the driving time even allowing for the airport.",
          "You will need a car at the other end — there is no public transport that reaches us, and no practical way to work the Bourbon Trail without one. Factor that into the comparison, because a rental for two days closes much of the cost gap with driving.",
        ],
      },
      {
        heading: "Make It a Weekend",
        paragraphs: [
          "At this distance a day trip is not a serious proposition. Three distilleries across two days is the version people describe accurately afterwards; four in a day is the version they endure.",
          "Bardstown puts you inside walking distance of the town square and within fifteen minutes of several other trail stops. Louisville has more hotels and restaurants and a 45 minute run out each morning. Either works — Bardstown suits distillery-first trips, Louisville suits people who want the evenings.",
        ],
        list: [
          "Friday: drive or fly down, evening in Bardstown or Louisville",
          "Saturday: afternoon tour with us, one or two other stops nearby",
          "Sunday: a third stop, then home",
        ],
      },
      {
        heading: "What Is On Site",
        paragraphs: [
          "This is a working distillery rather than a visitor centre. Depending on the day and season you may walk past an active fermenter, a running column still, or a crew dumping barrels.",
        ],
        list: [
          "The mash floor and still house, in operation on production days",
          "Rickhouse No. 7, our newest warehouse, holding 20,000 barrels",
          "The tasting room, where flights are poured at cask strength and proofed side by side",
          "The bottling line and single-barrel selection room",
        ],
      },
      {
        heading: "Carrying Bottles Home",
        paragraphs: [
          "If you are flying, bottles must go in checked baggage — anything above 100ml is out of the cabin, and spirits above 70 percent alcohol (140 proof) cannot fly at all. Some barrel proof releases have gone over that line, so check the proof on the bottle before you plan to carry it home.",
          "Shipping is usually the simpler answer. Rules vary by state and change often, so the shipping page carries the current position, and an adult signature is required at delivery wherever we can send.",
        ],
      },
    ],
    faq: [
      {
        question: "How far is Bardstown, Kentucky from Chicago?",
        answer:
          "337 miles, about five and a half hours by road. I-65 runs almost the whole way, from Gary, Indiana south through Indianapolis and Louisville to Exit 112.",
      },
      {
        question: "Is there a Bourbon & Oak in Chicago?",
        answer:
          "No. We have one site, the distillery in Bardstown, Kentucky. There is nothing in Chicago or anywhere in Illinois — this page is about reaching us, not a local branch.",
      },
      {
        question: "Is it better to fly or drive from Chicago?",
        answer:
          "Flying into Louisville is roughly ninety minutes plus a 45 minute drive, usually about half the door-to-door time of driving. You will still need a car at the other end, which closes much of the cost difference.",
      },
      {
        question: "Can I do this as a day trip from Chicago?",
        answer:
          "Not sensibly. Eleven hours of driving around a tasting is not a day out. Two nights makes it a genuinely good trip and lets you fit three distilleries in without rushing.",
      },
      {
        question: "Can I fly home with bottles?",
        answer:
          "In checked baggage only, and nothing above 70 percent alcohol — 140 proof — may fly at all. Some barrel proof releases have gone over that line, so check the proof first. Shipping is often simpler.",
      },
      {
        question: "Do I lose time driving from Chicago?",
        answer:
          "Yes. Chicago is on Central time and Bardstown is on Eastern, so you lose an hour heading south-east. Tour slots are booked in Eastern time, which catches people out on arrival day.",
      },
    ],
  },
];

export function getLocationBySlug(slug: string): Location | undefined {
  return LOCATIONS.find((l) => l.slug === slug);
}
