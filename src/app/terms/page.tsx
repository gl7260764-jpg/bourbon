import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | Bourbon & Oak",
  description:
    "Terms of service for Bourbon & Oak — age requirement, allocated bottle policy, shipping limits, order acceptance, and dispute resolution.",
  alternates: { canonical: "/terms" },
  openGraph: {
    title: "Terms of Service | Bourbon & Oak",
    description:
      "Terms of service for the Bourbon & Oak store — age requirement, allocated bottles, shipping limits, order acceptance.",
    type: "website",
    url: "/terms",
  },
  twitter: {
    card: "summary_large_image",
    title: "Terms of Service | Bourbon & Oak",
    description: "Terms of service for the Bourbon & Oak store.",
  },
};

export default function TermsPage() {
  return (
    <main className="bg-bourbon-cream min-h-screen pt-24 sm:pt-32 pb-16 sm:pb-20">
      <header className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10 sm:mb-14">
        <p className="text-bourbon-gold text-xs tracking-[0.3em] uppercase mb-3">
          Legal
        </p>
        <h1 className="font-[family-name:var(--font-playfair)] text-4xl sm:text-5xl md:text-6xl font-bold text-bourbon-deep leading-tight mb-3">
          Terms of Service
        </h1>
        <div className="w-20 h-0.5 bg-bourbon-gold mb-5" />
        <p className="text-bourbon-stone max-w-2xl text-base sm:text-lg leading-relaxed">
          Last updated 1 January 2026. By using bourbonandoak.com or buying
          from us, you agree to these terms. Read them.
        </p>
      </header>

      <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-10">
        <section>
          <h2 className="font-[family-name:var(--font-playfair)] text-xl sm:text-2xl font-bold text-bourbon-deep mb-3">
            1. Age requirement
          </h2>
          <p className="text-bourbon-stone text-base leading-relaxed">
            You must be 21 or older to buy from this site. Both the
            account-holder and the recipient must be 21+. Misrepresenting age
            voids the order and may be reported to authorities. See our{" "}
            <Link
              href="/shipping"
              className="text-bourbon-gold underline decoration-bourbon-gold/30 underline-offset-4 hover:decoration-bourbon-gold transition-colors"
            >
              shipping policy
            </Link>{" "}
            for delivery age verification.
          </p>
        </section>

        <section>
          <h2 className="font-[family-name:var(--font-playfair)] text-xl sm:text-2xl font-bold text-bourbon-deep mb-3">
            2. Order acceptance
          </h2>
          <p className="text-bourbon-stone text-base leading-relaxed">
            Submitting an order does not guarantee acceptance. We may decline
            or cancel any order for any reason, including inventory error,
            pricing error, suspected fraud, or shipping address in a
            restricted state. If we cancel, we refund in full.
          </p>
        </section>

        <section>
          <h2 className="font-[family-name:var(--font-playfair)] text-xl sm:text-2xl font-bold text-bourbon-deep mb-3">
            3. Allocated bottles
          </h2>
          <p className="text-bourbon-stone text-base leading-relaxed">
            Allocated Kentucky bourbons (Pappy Van Winkle, William Larue
            Weller, George T. Stagg and similar) are sold final-sale and on a
            one-bottle-per-household basis unless otherwise noted. Resale and
            secondary-market transactions are not eligible for our damaged-
            bottle replacement program.
          </p>
        </section>

        <section>
          <h2 className="font-[family-name:var(--font-playfair)] text-xl sm:text-2xl font-bold text-bourbon-deep mb-3">
            4. Shipping
          </h2>
          <p className="text-bourbon-stone text-base leading-relaxed">
            We ship only to U.S. states where direct-to-consumer distilled-
            spirits shipping is legal. Refused or undeliverable shipments are
            refunded minus outbound shipping. See our{" "}
            <Link
              href="/shipping"
              className="text-bourbon-gold underline decoration-bourbon-gold/30 underline-offset-4 hover:decoration-bourbon-gold transition-colors"
            >
              shipping page
            </Link>{" "}
            for restricted states.
          </p>
        </section>

        <section>
          <h2 className="font-[family-name:var(--font-playfair)] text-xl sm:text-2xl font-bold text-bourbon-deep mb-3">
            5. Returns
          </h2>
          <p className="text-bourbon-stone text-base leading-relaxed">
            Damaged-in-transit bottles are replaced at no cost. Unopened
            bottles may be returned for store credit within 14 days minus a
            15% restocking fee. Federal law prohibits return of opened
            distilled spirits. Full policy:{" "}
            <Link
              href="/returns"
              className="text-bourbon-gold underline decoration-bourbon-gold/30 underline-offset-4 hover:decoration-bourbon-gold transition-colors"
            >
              /returns
            </Link>
            .
          </p>
        </section>

        <section>
          <h2 className="font-[family-name:var(--font-playfair)] text-xl sm:text-2xl font-bold text-bourbon-deep mb-3">
            6. Content &amp; intellectual property
          </h2>
          <p className="text-bourbon-stone text-base leading-relaxed">
            All editorial content, product photography, and the Bourbon &amp;
            Oak name and logo are owned by Bourbon &amp; Oak Distillery.
            Reproduction for personal, non-commercial reference is permitted;
            commercial reproduction requires written permission to{" "}
            <a
              href="mailto:support@bourbonandoak.com"
              className="text-bourbon-gold underline decoration-bourbon-gold/30 underline-offset-4 hover:decoration-bourbon-gold transition-colors"
            >
              support@bourbonandoak.com
            </a>
            .
          </p>
        </section>

        <section>
          <h2 className="font-[family-name:var(--font-playfair)] text-xl sm:text-2xl font-bold text-bourbon-deep mb-3">
            7. Limitation of liability
          </h2>
          <p className="text-bourbon-stone text-base leading-relaxed">
            To the maximum extent permitted by law, Bourbon &amp; Oak&apos;s
            liability for any claim arising from a purchase is limited to the
            amount paid for the affected order. Drink responsibly.
          </p>
        </section>

        <section>
          <h2 className="font-[family-name:var(--font-playfair)] text-xl sm:text-2xl font-bold text-bourbon-deep mb-3">
            8. Governing law
          </h2>
          <p className="text-bourbon-stone text-base leading-relaxed">
            These terms are governed by the laws of the Commonwealth of
            Kentucky. Disputes will be resolved in the state or federal
            courts of Nelson County, Kentucky.
          </p>
        </section>

        <section className="border-t border-bourbon-deep/10 pt-8">
          <p className="text-bourbon-stone text-sm leading-relaxed">
            See also our{" "}
            <Link
              href="/privacy"
              className="text-bourbon-gold underline decoration-bourbon-gold/30 underline-offset-4 hover:decoration-bourbon-gold transition-colors"
            >
              Privacy Policy
            </Link>
            .
          </p>
        </section>
      </article>
    </main>
  );
}
