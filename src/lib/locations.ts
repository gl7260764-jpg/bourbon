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
];

export function getLocationBySlug(slug: string): Location | undefined {
  return LOCATIONS.find((l) => l.slug === slug);
}
