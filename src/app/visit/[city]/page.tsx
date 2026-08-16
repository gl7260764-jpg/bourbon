import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DISTILLERY, LOCATIONS, getLocationBySlug } from "@/lib/locations";

interface PageProps {
  params: Promise<{ city: string }>;
}

export function generateStaticParams() {
  return LOCATIONS.map((l) => ({ city: l.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { city } = await params;
  const loc = getLocationBySlug(city);
  if (!loc) return { title: "Location not found | Bourbon & Oak" };

  return {
    title: loc.metaTitle,
    description: loc.metaDescription,
    keywords: loc.keywords,
    alternates: { canonical: `/visit/${loc.slug}` },
    openGraph: {
      title: loc.metaTitle,
      description: loc.metaDescription,
      type: "website",
      url: `/visit/${loc.slug}`,
      images: [{ url: loc.heroImage, alt: loc.heroAlt }],
    },
    twitter: {
      card: "summary_large_image",
      title: loc.metaTitle,
      description: loc.metaDescription,
      images: [loc.heroImage],
    },
  };
}

export default async function VisitPage({ params }: PageProps) {
  const { city } = await params;
  const loc = getLocationBySlug(city);
  if (!loc) notFound();

  const address = {
    "@type": "PostalAddress",
    streetAddress: DISTILLERY.streetAddress,
    addressLocality: DISTILLERY.addressLocality,
    addressRegion: DISTILLERY.addressRegion,
    postalCode: DISTILLERY.postalCode,
    addressCountry: DISTILLERY.addressCountry,
  };

  /* Only the page for the city we actually operate in claims to be a local
     business there. The catchment page describes the same single distillery
     and points at it, rather than asserting a branch that does not exist —
     a fake LocalBusiness node is what triggers local spam penalties.
     No openingHours: none are published, and guessing them would surface
     wrong times directly in Google's local panel. */
  const businessJsonLd = loc.isPrimarySite
    ? {
        "@context": "https://schema.org",
        "@type": "Distillery",
        "@id": `https://bourbonoaklover.com/visit/${loc.slug}#business`,
        name: DISTILLERY.name,
        description: loc.metaDescription,
        url: `https://bourbonoaklover.com/visit/${loc.slug}`,
        telephone: DISTILLERY.telephone,
        email: DISTILLERY.email,
        image: `https://bourbonoaklover.com${loc.heroImage}`,
        address,
        geo: {
          "@type": "GeoCoordinates",
          latitude: DISTILLERY.latitude,
          longitude: DISTILLERY.longitude,
        },
        foundingDate: "1876",
        areaServed: { "@type": "State", name: "Kentucky" },
      }
    : {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: loc.metaTitle,
        description: loc.metaDescription,
        url: `https://bourbonoaklover.com/visit/${loc.slug}`,
        about: {
          "@type": "Distillery",
          name: DISTILLERY.name,
          address,
          telephone: DISTILLERY.telephone,
          url: "https://bourbonoaklover.com/visit/bardstown",
        },
      };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: loc.faq.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://bourbonoaklover.com/" },
      {
        "@type": "ListItem",
        position: 2,
        name: loc.title,
        item: `https://bourbonoaklover.com/visit/${loc.slug}`,
      },
    ],
  };

  return (
    <main className="bg-bourbon-cream min-h-screen pt-24 sm:pt-32 pb-16 sm:pb-20">
      {[businessJsonLd, faqJsonLd, breadcrumbJsonLd].map((node, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(node) }}
        />
      ))}

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="mb-6 text-[10px] sm:text-xs tracking-widest uppercase text-bourbon-stone/70 flex items-center gap-2">
          <Link href="/" className="hover:text-bourbon-gold transition-colors">
            Home
          </Link>
          <span>/</span>
          <span className="text-bourbon-deep">{loc.title}</span>
        </nav>

        <p className="text-bourbon-gold text-[10px] sm:text-xs tracking-[0.3em] uppercase mb-3">
          {loc.isPrimarySite ? "Visit Us" : "Planning Your Trip"}
        </p>
        <h1 className="font-[family-name:var(--font-playfair)] text-4xl sm:text-5xl md:text-6xl font-bold text-bourbon-deep leading-tight mb-4 text-balance">
          {loc.h1}
        </h1>
        <div className="w-20 h-0.5 bg-bourbon-gold mb-5" />
        <p className="text-bourbon-stone text-base sm:text-lg leading-relaxed max-w-2xl mb-8">
          {loc.subtitle}
        </p>

        <div className="relative aspect-[16/9] w-full overflow-hidden mb-10 sm:mb-12">
          <Image
            src={loc.heroImage}
            alt={loc.heroAlt}
            fill
            priority
            sizes="(max-width: 896px) 100vw, 896px"
            className="object-cover"
          />
        </div>

        {loc.intro.map((p, i) => (
          <p
            key={i}
            className="text-bourbon-stone text-base sm:text-lg leading-relaxed mb-5 sm:mb-6"
          >
            {p}
          </p>
        ))}

        {loc.sections.map((section) => (
          <section key={section.heading}>
            <h2 className="font-[family-name:var(--font-playfair)] text-2xl sm:text-3xl font-bold text-bourbon-deep mt-10 sm:mt-14 mb-4 sm:mb-5 leading-tight">
              {section.heading}
            </h2>
            {section.paragraphs.map((p, i) => (
              <p
                key={i}
                className="text-bourbon-stone text-base sm:text-lg leading-relaxed mb-5 sm:mb-6"
              >
                {p}
              </p>
            ))}
            {section.list && (
              <ul className="mb-6 sm:mb-7 space-y-2 sm:space-y-3 text-bourbon-stone text-base sm:text-lg leading-relaxed pl-5 list-disc marker:text-bourbon-gold">
                {section.list.map((item) => (
                  <li key={item} className="pl-1">
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}

        <div className="mt-10 sm:mt-12 flex flex-col sm:flex-row gap-3 sm:gap-4">
          <Link
            href="/tours"
            className="flex items-center justify-center gap-3 bg-bourbon-gold px-8 py-4 text-sm font-semibold uppercase tracking-wider text-bourbon-deep transition-colors duration-300 hover:bg-bourbon-amber focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-bourbon-gold"
          >
            Book a tour
          </Link>
          <Link
            href="/shop"
            className="flex items-center justify-center gap-3 border border-bourbon-deep/25 px-8 py-4 text-sm font-semibold uppercase tracking-wider text-bourbon-deep transition-colors duration-300 hover:border-bourbon-gold hover:text-bourbon-gold focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-bourbon-gold"
          >
            Shop the collection
          </Link>
        </div>

        <section className="mt-12 sm:mt-16 border-t border-bourbon-stone/15 pt-8 sm:pt-10">
          <p className="text-bourbon-gold text-[10px] sm:text-xs tracking-[0.3em] uppercase mb-3">
            Common Questions
          </p>
          <h2 className="font-[family-name:var(--font-playfair)] text-2xl sm:text-3xl font-bold text-bourbon-deep mb-6 sm:mb-8 leading-tight">
            Frequently Asked
          </h2>
          <dl className="space-y-5 sm:space-y-6">
            {loc.faq.map((f) => (
              <div
                key={f.question}
                className="border-b border-bourbon-stone/10 pb-5 last:border-0 last:pb-0"
              >
                <dt className="font-[family-name:var(--font-playfair)] text-lg sm:text-xl font-bold text-bourbon-deep mb-1.5">
                  {f.question}
                </dt>
                <dd className="text-bourbon-stone text-base sm:text-lg leading-relaxed">
                  {f.answer}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="mt-12 sm:mt-16 border-t border-bourbon-stone/15 pt-8">
          <p className="text-bourbon-stone text-[10px] tracking-widest uppercase mb-4">
            Also worth reading
          </p>
          <ul className="space-y-2 text-base sm:text-lg">
            {LOCATIONS.filter((o) => o.slug !== loc.slug).map((o) => (
              <li key={o.slug}>
                <Link
                  href={`/visit/${o.slug}`}
                  className="text-bourbon-gold underline decoration-bourbon-gold/30 underline-offset-4 hover:decoration-bourbon-gold transition-colors"
                >
                  {o.title}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/blog/kentucky-bourbon-trail-guide"
                className="text-bourbon-gold underline decoration-bourbon-gold/30 underline-offset-4 hover:decoration-bourbon-gold transition-colors"
              >
                Planning the Kentucky Bourbon Trail
              </Link>
            </li>
            <li>
              <Link
                href="/blog/how-bourbon-is-made"
                className="text-bourbon-gold underline decoration-bourbon-gold/30 underline-offset-4 hover:decoration-bourbon-gold transition-colors"
              >
                How bourbon is made, step by step
              </Link>
            </li>
          </ul>
        </section>
      </div>
    </main>
  );
}
