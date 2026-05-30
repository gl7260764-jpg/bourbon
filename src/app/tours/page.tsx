import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kentucky Bourbon Distillery Tours in Bardstown | Bourbon & Oak",
  description:
    "Book a Kentucky bourbon distillery tour in Bardstown — guided tastings, warehouse walks, and private barrel-pick experiences on the Kentucky Bourbon Trail.",
  alternates: { canonical: "/tours" },
  openGraph: {
    title: "Kentucky Bourbon Distillery Tours in Bardstown",
    description:
      "Book a Kentucky bourbon distillery tour in Bardstown — guided tastings, warehouse walks, and private barrel-pick experiences.",
    type: "website",
    url: "/tours",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kentucky Bourbon Distillery Tours in Bardstown",
    description:
      "Book a Kentucky bourbon distillery tour in Bardstown — guided tastings, warehouse walks, and private barrel-pick experiences.",
  },
  keywords: [
    "Kentucky bourbon distillery tours",
    "Bardstown bourbon trail",
    "Kentucky bourbon trail tours",
    "bourbon tasting tour Kentucky",
    "bourbon distillery tour Bardstown",
    "private barrel pick experience",
    "bourbon rickhouse tour",
    "things to do in Bardstown Kentucky",
    "bourbon trail near Louisville",
  ],
};

const tours = [
  {
    name: "The Heritage Tour",
    duration: "75 minutes",
    price: "$25 per guest",
    summary:
      "Our signature guided walk — from the mash tuns and copper pot stills to the rickhouse, ending with a four-pour flight of our core Kentucky bourbon lineup.",
    includes: [
      "Distillery walk with a guide",
      "Rickhouse visit (active aging warehouse)",
      "Four-pour tasting flight of Bourbon & Oak core bourbons",
      "Souvenir Glencairn glass to keep",
    ],
  },
  {
    name: "Single Barrel Tasting",
    duration: "90 minutes",
    price: "$60 per guest",
    summary:
      "A deeper tasting experience for serious bourbon drinkers. Compare two single-barrel bourbons against the same small-batch base, with our master distiller walking through char level, mash bill and rick position.",
    includes: [
      "Side-by-side tasting of three Kentucky bourbons",
      "Single barrel education with the master distiller",
      "Custom barrel-stave coaster",
      "10% off any bottle purchased on-site",
    ],
  },
  {
    name: "Private Barrel Pick Experience",
    duration: "Half day · 4 hours",
    price: "From $1,200 per group of 6",
    summary:
      "The full master-distiller experience. Walk the rickhouse, thief samples from six candidate single barrels, and select the cask you want bottled under your name — either for a private collection or a retailer pick.",
    includes: [
      "Six candidate single-barrel samples pulled live",
      "Tasting led by the master distiller",
      "Selected barrel bottled and shipped (40 bottles minimum)",
      "Custom labels with your name on every bottle",
      "Lunch at our on-site cellar",
    ],
  },
];

export default function ToursPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TouristAttraction",
    name: "Bourbon & Oak Distillery — Kentucky Bourbon Tours",
    description:
      "Family-owned Kentucky bourbon distillery offering guided tasting tours, rickhouse walks, and private barrel-pick experiences on the Kentucky Bourbon Trail.",
    address: {
      "@type": "PostalAddress",
      streetAddress: "1876 Oak Barrel Lane",
      addressLocality: "Bardstown",
      addressRegion: "KY",
      postalCode: "40004",
      addressCountry: "US",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: "37.8095",
      longitude: "-85.4669",
    },
    isAccessibleForFree: false,
    publicAccess: true,
    touristType: ["Bourbon enthusiasts", "Whiskey collectors", "Kentucky Bourbon Trail visitors"],
    makesOffer: tours.map((t) => ({
      "@type": "Offer",
      name: t.name,
      description: t.summary,
      priceCurrency: "USD",
      eligibleQuantity: {
        "@type": "QuantitativeValue",
        unitText: "per guest",
      },
    })),
  };

  return (
    <main className="bg-bourbon-cream min-h-screen pt-24 sm:pt-32 pb-16 sm:pb-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <header className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10 sm:mb-14">
        <p className="text-bourbon-gold text-xs tracking-[0.3em] uppercase mb-3">
          Visit Us
        </p>
        <h1 className="font-[family-name:var(--font-playfair)] text-4xl sm:text-5xl md:text-6xl font-bold text-bourbon-deep leading-tight mb-3">
          Bourbon distillery tours in Bardstown, Kentucky
        </h1>
        <div className="w-20 h-0.5 bg-bourbon-gold mb-5" />
        <p className="text-bourbon-stone max-w-2xl text-base sm:text-lg leading-relaxed">
          Three Kentucky bourbon tour experiences at our family-owned distillery
          in Bardstown — from a 75-minute guided walk through the rickhouse to
          a half-day private barrel-pick with our master distiller. We&apos;re
          a stop on the{" "}
          <a
            href="https://kybourbontrail.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-bourbon-gold underline decoration-bourbon-gold/30 underline-offset-4 hover:decoration-bourbon-gold transition-colors"
          >
            Kentucky Bourbon Trail
          </a>
          , thirty-five minutes south of Louisville.
        </p>
      </header>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-3 gap-6 mb-14 sm:mb-20">
        {tours.map((tour) => (
          <article
            key={tour.name}
            className="bg-white border border-bourbon-deep/10 p-6 sm:p-8 flex flex-col"
          >
            <p className="text-bourbon-gold text-[10px] sm:text-xs tracking-[0.3em] uppercase mb-2">
              {tour.duration}
            </p>
            <h2 className="font-[family-name:var(--font-playfair)] text-xl sm:text-2xl font-bold text-bourbon-deep mb-3 leading-tight">
              {tour.name}
            </h2>
            <p className="font-[family-name:var(--font-playfair)] text-xl sm:text-2xl font-bold text-bourbon-gold mb-4">
              {tour.price}
            </p>
            <p className="text-bourbon-stone text-sm sm:text-base leading-relaxed mb-5">
              {tour.summary}
            </p>
            <p className="text-bourbon-stone text-[10px] tracking-widest uppercase font-semibold mb-2">
              Includes
            </p>
            <ul className="text-bourbon-deep text-sm space-y-1.5 list-disc pl-5 marker:text-bourbon-gold mb-6 flex-1">
              {tour.includes.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-bourbon-deep text-bourbon-cream text-xs tracking-widest uppercase font-semibold hover:bg-bourbon-gold hover:text-bourbon-deep transition-colors"
            >
              Reserve this tour
            </Link>
          </article>
        ))}
      </section>

      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 sm:space-y-12">
        <div>
          <h2 className="font-[family-name:var(--font-playfair)] text-2xl sm:text-3xl font-bold text-bourbon-deep mb-4">
            What to expect on a Kentucky bourbon distillery tour
          </h2>
          <p className="text-bourbon-stone text-base sm:text-lg leading-relaxed mb-4">
            Every Bourbon &amp; Oak tour starts inside the working distillery
            — not a recreated museum stop. You&apos;ll see the actual fermenters
            bubbling with sour mash, smell the new-make spirit running off the
            copper still, and walk between rows of active aging barrels in our
            nine-story rickhouse. Your guide is either a member of the
            distillery team or, on the higher-tier tours, the master distiller
            herself.
          </p>
          <p className="text-bourbon-stone text-base sm:text-lg leading-relaxed">
            Tastings are seated, paced, and led — never rushed. You&apos;ll
            learn to nose bourbon properly, why proof matters, and how the
            same mash bill produces wildly different bourbons depending on rick
            position. Read the master distiller&apos;s{" "}
            <Link
              href="/blog/master-distiller-barrel-selection-guide"
              className="text-bourbon-gold underline decoration-bourbon-gold/30 underline-offset-4 hover:decoration-bourbon-gold transition-colors"
            >
              full barrel-selection guide
            </Link>{" "}
            to preview what the Single Barrel Tasting covers.
          </p>
        </div>

        <div>
          <h2 className="font-[family-name:var(--font-playfair)] text-2xl sm:text-3xl font-bold text-bourbon-deep mb-4">
            How to book
          </h2>
          <p className="text-bourbon-stone text-base sm:text-lg leading-relaxed mb-4">
            All tours are by reservation only — we cap groups at twelve guests
            for the Heritage Tour and six for everything above. The Private
            Barrel Pick books two to three months in advance. Email{" "}
            <a
              href="mailto:support@bourbonandoak.com"
              className="text-bourbon-gold underline decoration-bourbon-gold/30 underline-offset-4 hover:decoration-bourbon-gold transition-colors"
            >
              support@bourbonandoak.com
            </a>{" "}
            or use the{" "}
            <Link
              href="/contact"
              className="text-bourbon-gold underline decoration-bourbon-gold/30 underline-offset-4 hover:decoration-bourbon-gold transition-colors"
            >
              contact form
            </Link>{" "}
            to request a tour date.
          </p>
          <ul className="text-bourbon-stone text-base sm:text-lg leading-relaxed list-disc pl-6 marker:text-bourbon-gold space-y-2">
            <li>Guests must be 21 or older. Bring photo ID; we check every guest.</li>
            <li>Closed-toe shoes required for the rickhouse portion.</li>
            <li>Free parking on-site. Designated driver guests welcome at no charge.</li>
            <li>
              Tour gift cards available — popular for corporate groups visiting
              the Kentucky Bourbon Trail.
            </li>
          </ul>
        </div>

        <div>
          <h2 className="font-[family-name:var(--font-playfair)] text-2xl sm:text-3xl font-bold text-bourbon-deep mb-4">
            Getting to the distillery
          </h2>
          <p className="text-bourbon-stone text-base sm:text-lg leading-relaxed mb-4">
            We&apos;re at <strong className="text-bourbon-deep">1876 Oak Barrel Lane, Bardstown, KY 40004</strong>{" "}
            — five minutes off the Bluegrass Parkway. Bardstown sits at the
            geographic center of the Kentucky Bourbon Trail, making us an easy
            half-day trip from Louisville (35 min), Lexington (90 min),
            Cincinnati (2.5 hours) or Nashville (3 hours).
          </p>
          <p className="text-bourbon-stone text-base sm:text-lg leading-relaxed">
            Plan a longer visit by pairing our tour with{" "}
            <a
              href="https://visitbardstown.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-bourbon-gold underline decoration-bourbon-gold/30 underline-offset-4 hover:decoration-bourbon-gold transition-colors"
            >
              Visit Bardstown&apos;s
            </a>{" "}
            curated itineraries — there are eleven other working bourbon
            distilleries within a twenty-five mile radius.
          </p>
        </div>
      </section>
    </main>
  );
}
