import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { DISTILLERY, LOCATIONS } from "@/lib/locations";

const SITE_URL = "https://bourbonoaklover.com";

const TITLE = "Visit & Locations | Bourbon & Oak Distillery, Bardstown KY";
const DESCRIPTION =
  "One distillery, in Bardstown, Kentucky. Directions, drive times and trip plans from Louisville, Lexington, Cincinnati and Nashville, plus the address, phone and parking.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "visit Bourbon & Oak",
    "bourbon distillery Bardstown Kentucky",
    "Kentucky Bourbon Trail directions",
    "bourbon distillery near me",
    "distillery day trip Kentucky",
    "Bardstown distillery address",
    "Kentucky bourbon tour locations",
    "how to get to Bardstown Kentucky",
  ],
  alternates: { canonical: "/visit" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "website",
    url: "/visit",
    images: [
      {
        url: "/visit-shop.webp",
        alt: "The Bourbon & Oak tasting room in Bardstown, Kentucky",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/visit-shop.webp"],
  },
};

/* Every page in this section describes the same single distillery, so the NAP
   block below is rendered straight from DISTILLERY rather than retyped — a
   drifting address or phone number across location pages is the fastest way to
   break local search consistency. */
const PHONE_DISPLAY = DISTILLERY.telephone.replace(
  /^\+1-(\d{3})-(\d{3})-(\d{4})$/,
  "($1) $2-$3",
);

const RELATED_READING = [
  {
    href: "/blog/kentucky-bourbon-trail-guide",
    label: "Planning the Kentucky Bourbon Trail",
  },
  {
    href: "/blog/how-bourbon-is-made",
    label: "How bourbon is made, step by step",
  },
  {
    href: "/blog/how-to-taste-bourbon",
    label: "How to taste bourbon before your first flight",
  },
];

export default function VisitIndexPage() {
  const primary = LOCATIONS.filter((l) => l.isPrimarySite);
  const catchment = LOCATIONS.filter((l) => !l.isPrimarySite);

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Bourbon & Oak visitor guides",
    description: DESCRIPTION,
    url: `${SITE_URL}/visit`,
    numberOfItems: LOCATIONS.length,
    itemListElement: LOCATIONS.map((loc, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: loc.title,
      url: `${SITE_URL}/visit/${loc.slug}`,
    })),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
      {
        "@type": "ListItem",
        position: 2,
        name: "Visit & Locations",
        item: `${SITE_URL}/visit`,
      },
    ],
  };

  return (
    <main className="bg-bourbon-cream min-h-screen pt-24 sm:pt-32 pb-16 sm:pb-20">
      {[itemListJsonLd, breadcrumbJsonLd].map((node, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(node) }}
        />
      ))}

      {/* Header */}
      <header className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10 sm:mb-14">
        <nav className="mb-6 text-[10px] sm:text-xs tracking-widest uppercase text-bourbon-stone/70 flex items-center gap-2">
          <Link href="/" className="hover:text-bourbon-gold transition-colors">
            Home
          </Link>
          <span aria-hidden="true">/</span>
          <span className="text-bourbon-deep">Visit &amp; Locations</span>
        </nav>

        <p className="text-bourbon-gold text-[10px] sm:text-xs tracking-[0.3em] uppercase mb-3">
          Visit Us
        </p>
        <h1 className="font-[family-name:var(--font-playfair)] text-4xl sm:text-5xl md:text-6xl font-bold text-bourbon-deep leading-tight mb-3 text-balance">
          One Distillery, and How to Reach It
        </h1>
        <div className="w-16 sm:w-20 h-0.5 bg-bourbon-gold mb-5" />
        <div className="max-w-2xl space-y-4">
          <p className="text-bourbon-stone text-sm sm:text-lg leading-relaxed">
            Bourbon &amp; Oak has one site: the working distillery at 1876 Oak
            Barrel Lane in Bardstown, Kentucky, where the family has made and
            matured bourbon since 1876. There are no branch stores and no second
            addresses — everything with our name on it comes off that one piece
            of ground.
          </p>
          <p className="text-bourbon-stone text-sm sm:text-lg leading-relaxed">
            So the pages below are not locations. They are directions. Each one
            covers the real drive from a city people travel to us from — the
            roads, the timings, where to stay, what else is worth stopping for,
            and who is going to do the driving.
          </p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* The one real site */}
        {primary.map((loc) => (
          <section key={loc.slug} className="mb-12 sm:mb-16">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className="px-3 py-1 bg-bourbon-gold text-bourbon-deep text-[10px] sm:text-xs font-semibold tracking-widest uppercase">
                The Distillery
              </span>
              <span className="text-bourbon-stone/70 text-[10px] sm:text-xs tracking-widest uppercase">
                Our only physical site
              </span>
            </div>

            <Link
              href={`/visit/${loc.slug}`}
              className="group block bg-white overflow-hidden border border-bourbon-gold/40 shadow-sm hover:shadow-xl hover:shadow-bourbon-gold/10 transition-all duration-500"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2">
                <div className="relative h-56 sm:h-72 lg:h-auto lg:min-h-[380px] overflow-hidden bg-bourbon-deep/5">
                  <Image
                    src={loc.heroImage}
                    alt={loc.heroAlt}
                    fill
                    priority
                    sizes="(min-width: 1024px) 50vw, 100vw"
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                </div>
                <div className="p-6 sm:p-10 flex flex-col justify-center">
                  <p className="text-bourbon-gold text-[10px] sm:text-xs tracking-[0.3em] uppercase mb-3">
                    {loc.city}, Kentucky
                  </p>
                  <h2 className="font-[family-name:var(--font-playfair)] text-2xl sm:text-3xl md:text-4xl font-bold text-bourbon-deep leading-tight mb-3 sm:mb-4 group-hover:text-bourbon-gold transition-colors">
                    {loc.title}
                  </h2>
                  <p className="text-bourbon-stone text-sm sm:text-base leading-relaxed mb-5 sm:mb-6">
                    {loc.cardSummary ?? loc.metaDescription}
                  </p>
                  {loc.driveNote && (
                    <p className="text-bourbon-deep text-xs sm:text-sm font-semibold mb-5 sm:mb-6">
                      {loc.driveNote}
                    </p>
                  )}
                  <span className="text-bourbon-gold text-xs tracking-widest uppercase font-semibold inline-flex items-center gap-2 group-hover:gap-3 transition-all mt-auto pt-4 border-t border-bourbon-deep/10">
                    Plan your visit
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 8l4 4m0 0l-4 4m4-4H3"
                      />
                    </svg>
                  </span>
                </div>
              </div>
            </Link>
          </section>
        ))}

        {/* Catchment / getting-here-from guides */}
        {catchment.length > 0 && (
          <section className="mb-12 sm:mb-16">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <span className="px-3 py-1 border border-bourbon-deep/20 text-bourbon-stone text-[10px] sm:text-xs font-semibold tracking-widest uppercase">
                Getting Here From
              </span>
              <span className="text-bourbon-stone/70 text-[10px] sm:text-xs tracking-widest uppercase">
                Trip guides, not branches
              </span>
            </div>
            <h2 className="font-[family-name:var(--font-playfair)] text-2xl sm:text-3xl md:text-4xl font-bold text-bourbon-deep leading-tight mt-4 mb-3">
              Directions From Where You Are
            </h2>
            <p className="text-bourbon-stone text-sm sm:text-base leading-relaxed max-w-2xl mb-6 sm:mb-8">
              We are not in any of these cities. Each guide is written from that
              city to our gate in Bardstown — the mileage, the roads, and what
              to plan around once you get here.
            </p>

            <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 list-none p-0 m-0">
              {catchment.map((loc) => (
                <li key={loc.slug} className="flex">
                  <Link
                    href={`/visit/${loc.slug}`}
                    className="group bg-white overflow-hidden border border-bourbon-deep/5 shadow-sm hover:shadow-lg hover:shadow-bourbon-gold/5 hover:-translate-y-1 transition-all duration-500 flex flex-col w-full"
                  >
                    <div className="relative h-44 sm:h-52 overflow-hidden bg-bourbon-deep/5">
                      <Image
                        src={loc.heroImage}
                        alt={loc.heroAlt}
                        fill
                        sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                      <span className="absolute top-3 left-3 px-3 py-1 bg-bourbon-deep/85 text-bourbon-cream text-[10px] font-semibold tracking-widest uppercase">
                        From {loc.city}
                      </span>
                    </div>
                    <div className="p-5 sm:p-6 flex flex-col flex-1">
                      <h3 className="font-[family-name:var(--font-playfair)] text-lg sm:text-xl font-bold text-bourbon-deep leading-tight mb-3 group-hover:text-bourbon-gold transition-colors">
                        {loc.title}
                      </h3>
                      <p className="text-bourbon-stone text-sm leading-relaxed mb-4 flex-1">
                        {loc.cardSummary ?? loc.metaDescription}
                      </p>
                      {loc.driveNote && (
                        <p className="text-bourbon-deep text-xs sm:text-sm font-semibold mb-4 pt-4 border-t border-bourbon-deep/10">
                          {loc.driveNote}
                        </p>
                      )}
                      <span className="text-bourbon-gold text-xs tracking-widest uppercase font-semibold inline-flex items-center gap-2 group-hover:gap-3 transition-all">
                        Read the route
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 8l4 4m0 0l-4 4m4-4H3"
                          />
                        </svg>
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* The real, single NAP */}
        <section className="bg-bourbon-deep text-bourbon-cream p-6 sm:p-10 lg:p-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
            <div>
              <p className="text-bourbon-gold text-[10px] sm:text-xs tracking-[0.3em] uppercase mb-3">
                Find Us
              </p>
              <h2 className="font-[family-name:var(--font-playfair)] text-2xl sm:text-3xl font-bold leading-tight mb-5">
                {DISTILLERY.name}
              </h2>
              <address className="not-italic text-bourbon-cream/70 text-sm sm:text-base leading-relaxed space-y-1">
                <p>{DISTILLERY.streetAddress}</p>
                <p>
                  {DISTILLERY.addressLocality}, {DISTILLERY.addressRegion}{" "}
                  {DISTILLERY.postalCode}
                </p>
                <p className="pt-3">
                  <a
                    href={`tel:${DISTILLERY.telephone}`}
                    className="text-bourbon-gold hover:text-bourbon-amber transition-colors"
                  >
                    {PHONE_DISPLAY}
                  </a>
                </p>
                <p className="break-words">
                  <a
                    href={`mailto:${DISTILLERY.email}`}
                    className="text-bourbon-gold hover:text-bourbon-amber transition-colors"
                  >
                    {DISTILLERY.email}
                  </a>
                </p>
              </address>
              <p className="text-bourbon-cream/50 text-xs sm:text-sm leading-relaxed mt-5 max-w-md">
                Free on-site parking, including coach and RV spaces. No rail or
                scheduled bus service reaches Bardstown, so plan on a car or a
                booked tour coach.
              </p>
            </div>

            <div className="lg:border-l lg:border-bourbon-cream/10 lg:pl-12">
              <p className="text-bourbon-gold text-[10px] sm:text-xs tracking-[0.3em] uppercase mb-3">
                Before You Come
              </p>
              <p className="text-bourbon-cream/70 text-sm sm:text-base leading-relaxed mb-6">
                Everything on site runs by advance booking rather than walk-up —
                rickhouse walks are capped at small numbers and a private barrel
                pick takes most of a day.
              </p>
              <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4">
                <Link
                  href="/tours"
                  className="flex items-center justify-center gap-3 bg-bourbon-gold px-6 sm:px-8 py-4 text-sm font-semibold uppercase tracking-wider text-bourbon-deep transition-colors duration-300 hover:bg-bourbon-amber focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-bourbon-gold"
                >
                  Book a tour
                </Link>
                <Link
                  href="/collection"
                  className="flex items-center justify-center gap-3 border border-bourbon-cream/25 px-6 sm:px-8 py-4 text-sm font-semibold uppercase tracking-wider text-bourbon-cream transition-colors duration-300 hover:border-bourbon-gold hover:text-bourbon-gold focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-bourbon-gold"
                >
                  See the collection
                </Link>
              </div>
              <p className="text-bourbon-cream/50 text-xs sm:text-sm leading-relaxed mt-6">
                Not travelling this year? We ship, and the{" "}
                <Link
                  href="/shop"
                  className="text-bourbon-gold underline decoration-bourbon-gold/40 underline-offset-4 hover:decoration-bourbon-gold transition-colors"
                >
                  online shop
                </Link>{" "}
                lists what is genuinely in stock.
              </p>
            </div>
          </div>
        </section>

        {/* Related reading */}
        <section className="mt-12 sm:mt-16 border-t border-bourbon-stone/15 pt-8">
          <p className="text-bourbon-stone text-[10px] tracking-widest uppercase mb-4">
            Also worth reading
          </p>
          <ul className="space-y-2 text-base sm:text-lg">
            {RELATED_READING.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-bourbon-gold underline decoration-bourbon-gold/30 underline-offset-4 hover:decoration-bourbon-gold transition-colors"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
