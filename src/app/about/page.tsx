import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Our Story — Six Generations of Kentucky Bourbon | Bourbon & Oak",
  description:
    "Family-owned Kentucky bourbon distillery in Bardstown since 1876. Six generations of master distillers making single-barrel, small-batch and bottled-in-bond bourbon.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "Our Story — Six Generations of Kentucky Bourbon",
    description:
      "Family-owned Kentucky bourbon distillery in Bardstown since 1876.",
    type: "website",
    url: "/about",
  },
  twitter: {
    card: "summary_large_image",
    title: "Our Story — Six Generations of Kentucky Bourbon",
    description:
      "Family-owned Kentucky bourbon distillery in Bardstown since 1876.",
  },
  keywords: [
    "Kentucky bourbon distillery",
    "family-owned bourbon distillery",
    "Bardstown bourbon distillery",
    "bourbon distillery 1876",
    "small batch bourbon",
    "single barrel bourbon",
    "Kentucky straight bourbon",
    "master distiller Kentucky",
  ],
};

export default function AboutPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: "Our Story — Bourbon & Oak Kentucky Distillery",
    description:
      "Six generations of master distillers making single-barrel and small-batch Kentucky bourbon at our Bardstown distillery.",
    mainEntity: {
      "@type": "Organization",
      name: "Bourbon & Oak",
      foundingDate: "1876",
      address: {
        "@type": "PostalAddress",
        streetAddress: "1876 Oak Barrel Lane",
        addressLocality: "Bardstown",
        addressRegion: "KY",
        postalCode: "40004",
        addressCountry: "US",
      },
    },
  };

  return (
    <main className="bg-bourbon-cream min-h-screen pt-24 sm:pt-32 pb-16 sm:pb-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <header className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10 sm:mb-14">
        <p className="text-bourbon-gold text-xs tracking-[0.3em] uppercase mb-3">
          Our Story
        </p>
        <h1 className="font-[family-name:var(--font-playfair)] text-4xl sm:text-5xl md:text-6xl font-bold text-bourbon-deep leading-tight mb-3">
          Six generations. One rickhouse. Kentucky bourbon since 1876.
        </h1>
        <div className="w-20 h-0.5 bg-bourbon-gold mb-5" />
        <p className="text-bourbon-stone max-w-2xl text-base sm:text-lg leading-relaxed">
          Bourbon &amp; Oak is a family-owned Kentucky bourbon distillery in
          Bardstown, the bourbon capital of the world. We&apos;ve been making
          single-barrel and small-batch bourbon — aged in charred American oak,
          racked in our nine-story rickhouse — for one hundred and fifty years.
        </p>
      </header>

      <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 sm:space-y-12">
        <section>
          <h2 className="font-[family-name:var(--font-playfair)] text-2xl sm:text-3xl font-bold text-bourbon-deep mb-4">
            How a Bardstown bourbon distillery becomes a name
          </h2>
          <p className="text-bourbon-stone text-base sm:text-lg leading-relaxed mb-4">
            In 1876 our great-great-great-grandfather, Elijah Hayes, dug a well
            into the limestone shelf that runs under Nelson County, Kentucky.
            That water — naturally filtered, free of iron, rich in calcium —
            is still what we mash with today. He built his first rickhouse the
            same year. Six generations later, the Hayes family is still inside
            the same warehouse walking the same wooden floors, pulling samples
            from barrels we ourselves filled.
          </p>
          <p className="text-bourbon-stone text-base sm:text-lg leading-relaxed">
            Kentucky bourbon is defined by federal law: at least 51% corn,
            distilled to no more than 160 proof, aged in new charred American
            oak. Inside those rules, what separates a great Kentucky bourbon
            from an average one is the patience of the people making it. We
            don&apos;t cut corners. We don&apos;t chill-filter. We don&apos;t
            artificially age. The bourbon you pour from a Bourbon &amp; Oak
            bottle is exactly what came out of a barrel in our rickhouse.
          </p>
        </section>

        <section>
          <h2 className="font-[family-name:var(--font-playfair)] text-2xl sm:text-3xl font-bold text-bourbon-deep mb-4">
            What we make
          </h2>
          <p className="text-bourbon-stone text-base sm:text-lg leading-relaxed mb-4">
            Our core lineup is built around three Kentucky bourbon styles —
            each one a different expression of the same limestone water and
            charred-oak aging.
          </p>
          <ul className="space-y-3 text-bourbon-stone text-base sm:text-lg leading-relaxed list-disc pl-6 marker:text-bourbon-gold">
            <li>
              <strong className="text-bourbon-deep">Single barrel bourbon</strong>{" "}
              — one cask, one bottling, the barrel number printed on the
              label. See our{" "}
              <Link
                href="/blog/master-distiller-barrel-selection-guide"
                className="text-bourbon-gold underline decoration-bourbon-gold/30 underline-offset-4 hover:decoration-bourbon-gold transition-colors"
              >
                guide to how master distillers pick a single barrel
              </Link>
              .
            </li>
            <li>
              <strong className="text-bourbon-deep">Small batch bourbon</strong>{" "}
              — a hand-married selection of 8 to 30 honey barrels, blended
              for a consistent house style. Lower price than single barrel,
              same craft.
            </li>
            <li>
              <strong className="text-bourbon-deep">
                Bottled-in-bond and barrel-proof
              </strong>{" "}
              — federally regulated styles for drinkers who want bourbon as
              the distiller bottled it. Bottled-in-bond is exactly 100 proof,
              from one distillery, one distilling season, aged at least four
              years.
            </li>
          </ul>
          <p className="text-bourbon-stone text-base sm:text-lg leading-relaxed mt-4">
            Beyond the core lineup we carry allocated releases — including the
            Pappy Van Winkle, E.H. Taylor, Eagle Rare and William Larue Weller
            lines — that we hand-source through our distributor relationships.
            Browse the full{" "}
            <Link
              href="/collection"
              className="text-bourbon-gold underline decoration-bourbon-gold/30 underline-offset-4 hover:decoration-bourbon-gold transition-colors"
            >
              collection
            </Link>{" "}
            to see what&apos;s in stock right now.
          </p>
        </section>

        <section>
          <h2 className="font-[family-name:var(--font-playfair)] text-2xl sm:text-3xl font-bold text-bourbon-deep mb-4">
            How we ship Kentucky bourbon
          </h2>
          <p className="text-bourbon-stone text-base sm:text-lg leading-relaxed">
            We ship to every state where it&apos;s legal to receive bourbon by
            mail. Every package requires an adult signature at delivery and
            government-issued ID matching the order name. Full details on
            state restrictions, transit times and free-shipping thresholds are
            on our{" "}
            <Link
              href="/shipping"
              className="text-bourbon-gold underline decoration-bourbon-gold/30 underline-offset-4 hover:decoration-bourbon-gold transition-colors"
            >
              shipping page
            </Link>
            .
          </p>
        </section>

        <section>
          <h2 className="font-[family-name:var(--font-playfair)] text-2xl sm:text-3xl font-bold text-bourbon-deep mb-4">
            Visit the distillery
          </h2>
          <p className="text-bourbon-stone text-base sm:text-lg leading-relaxed">
            We&apos;re a stop on the{" "}
            <a
              href="https://kybourbontrail.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-bourbon-gold underline decoration-bourbon-gold/30 underline-offset-4 hover:decoration-bourbon-gold transition-colors"
            >
              Kentucky Bourbon Trail
            </a>{" "}
            and run guided tastings, warehouse walks and private barrel-pick
            experiences year-round. Book a tour or read about what each
            experience covers on the{" "}
            <Link
              href="/tours"
              className="text-bourbon-gold underline decoration-bourbon-gold/30 underline-offset-4 hover:decoration-bourbon-gold transition-colors"
            >
              tours page
            </Link>
            . Bardstown is a thirty-five minute drive south of Louisville and
            ninety minutes west of Lexington.
          </p>
        </section>

        <section className="border-t border-bourbon-deep/10 pt-8">
          <p className="text-bourbon-stone text-sm sm:text-base leading-relaxed italic">
            Bourbon &amp; Oak is licensed and regulated by the{" "}
            <a
              href="https://www.ttb.gov/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-bourbon-gold underline decoration-bourbon-gold/30 underline-offset-4 hover:decoration-bourbon-gold transition-colors"
            >
              U.S. Alcohol and Tobacco Tax and Trade Bureau (TTB)
            </a>{" "}
            and a member of the{" "}
            <a
              href="https://kybourbon.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-bourbon-gold underline decoration-bourbon-gold/30 underline-offset-4 hover:decoration-bourbon-gold transition-colors"
            >
              Kentucky Distillers&apos; Association
            </a>
            . You must be 21 or older to purchase from this site. Please drink
            responsibly.
          </p>
        </section>
      </article>
    </main>
  );
}
