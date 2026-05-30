import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Returns & Damaged Bottle Policy | Bourbon & Oak",
  description:
    "Damaged bourbon bottles are replaced free of charge. Read our 14-day return policy, restocking rules for unopened bottles, and how to file a claim.",
  alternates: { canonical: "/returns" },
  openGraph: {
    title: "Returns & Damaged Bottle Policy",
    description:
      "Damaged bourbon bottles are replaced free. 14-day return window for unopened bottles. How to file a claim.",
    type: "website",
    url: "/returns",
  },
  twitter: {
    card: "summary_large_image",
    title: "Returns & Damaged Bottle Policy",
    description:
      "Damaged bourbon bottles replaced free. 14-day unopened return window.",
  },
  keywords: [
    "bourbon return policy",
    "damaged bottle replacement bourbon",
    "bourbon refund policy",
    "broken whiskey bottle in transit",
    "Bourbon and Oak returns",
  ],
};

export default function ReturnsPage() {
  return (
    <main className="bg-bourbon-cream min-h-screen pt-24 sm:pt-32 pb-16 sm:pb-20">
      <header className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10 sm:mb-14">
        <p className="text-bourbon-gold text-xs tracking-[0.3em] uppercase mb-3">
          Returns
        </p>
        <h1 className="font-[family-name:var(--font-playfair)] text-4xl sm:text-5xl md:text-6xl font-bold text-bourbon-deep leading-tight mb-3">
          Returns &amp; damaged bottle policy
        </h1>
        <div className="w-20 h-0.5 bg-bourbon-gold mb-5" />
        <p className="text-bourbon-stone max-w-2xl text-base sm:text-lg leading-relaxed">
          Federal law restricts the resale of opened distilled spirits, so we
          can&apos;t accept returns of opened bottles. We&apos;ll always make
          it right when something arrives damaged or wrong — replacements
          ship at no cost.
        </p>
      </header>

      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 sm:space-y-12">
        <div>
          <h2 className="font-[family-name:var(--font-playfair)] text-2xl sm:text-3xl font-bold text-bourbon-deep mb-4">
            Damaged in transit
          </h2>
          <p className="text-bourbon-stone text-base sm:text-lg leading-relaxed mb-4">
            If a bottle arrives broken, leaking, or otherwise damaged:
          </p>
          <ol className="text-bourbon-stone text-base sm:text-lg leading-relaxed list-decimal pl-6 marker:text-bourbon-gold space-y-2 mb-4">
            <li>
              Take clear photos of the outer box, packing material, and the
              damaged bottle within 24 hours of delivery.
            </li>
            <li>
              Email{" "}
              <a
                href="mailto:support@bourbonandoak.com"
                className="text-bourbon-gold underline decoration-bourbon-gold/30 underline-offset-4 hover:decoration-bourbon-gold transition-colors"
              >
                support@bourbonandoak.com
              </a>{" "}
              with the photos and your order number.
            </li>
            <li>
              We&apos;ll ship a replacement bottle within two business days at
              no cost — no need to return the damaged bottle.
            </li>
          </ol>
          <p className="text-bourbon-stone text-base sm:text-lg leading-relaxed">
            Claims filed more than seven days after delivery cannot be
            replaced under our carrier insurance. Inspect packages on arrival.
          </p>
        </div>

        <div>
          <h2 className="font-[family-name:var(--font-playfair)] text-2xl sm:text-3xl font-bold text-bourbon-deep mb-4">
            Unopened bottles — 14-day return window
          </h2>
          <p className="text-bourbon-stone text-base sm:text-lg leading-relaxed mb-4">
            Changed your mind? Unopened, undamaged bottles in their original
            packaging can be returned within 14 days of delivery for store
            credit minus a 15% restocking fee and return shipping. To start a
            return:
          </p>
          <ul className="text-bourbon-stone text-base sm:text-lg leading-relaxed list-disc pl-6 marker:text-bourbon-gold space-y-2">
            <li>
              Email us with your order number and the bottles you want to
              return.
            </li>
            <li>
              We&apos;ll send a UPS Adult Signature pickup label. The bottles
              must be packed in the original carton (or equivalent
              spirits-rated packaging) for the carrier to accept them.
            </li>
            <li>
              On receipt and inspection, we issue store credit to your account
              within five business days.
            </li>
          </ul>
        </div>

        <div>
          <h2 className="font-[family-name:var(--font-playfair)] text-2xl sm:text-3xl font-bold text-bourbon-deep mb-4">
            Allocated and limited-edition bottles
          </h2>
          <p className="text-bourbon-stone text-base sm:text-lg leading-relaxed">
            Allocated Kentucky bourbons — including Pappy Van Winkle, William
            Larue Weller, George T. Stagg, and the rest of the BTAC line —
            are <strong className="text-bourbon-deep">final sale</strong>{" "}
            unless damaged in transit. We can&apos;t accept change-of-mind
            returns on these because we can&apos;t restock them from our
            distributor.
          </p>
        </div>

        <div>
          <h2 className="font-[family-name:var(--font-playfair)] text-2xl sm:text-3xl font-bold text-bourbon-deep mb-4">
            Wrong bottle shipped
          </h2>
          <p className="text-bourbon-stone text-base sm:text-lg leading-relaxed">
            On us. Email us within seven days and we&apos;ll ship the correct
            bottle plus a pre-paid UPS pickup label for the wrong one. No
            restocking fee.
          </p>
        </div>

        <div className="border-t border-bourbon-deep/10 pt-8">
          <p className="text-bourbon-stone text-sm sm:text-base leading-relaxed">
            See also our{" "}
            <Link
              href="/shipping"
              className="text-bourbon-gold underline decoration-bourbon-gold/30 underline-offset-4 hover:decoration-bourbon-gold transition-colors"
            >
              shipping policy
            </Link>{" "}
            and{" "}
            <Link
              href="/faq"
              className="text-bourbon-gold underline decoration-bourbon-gold/30 underline-offset-4 hover:decoration-bourbon-gold transition-colors"
            >
              FAQ
            </Link>
            . Still stuck? Email{" "}
            <a
              href="mailto:support@bourbonandoak.com"
              className="text-bourbon-gold underline decoration-bourbon-gold/30 underline-offset-4 hover:decoration-bourbon-gold transition-colors"
            >
              support@bourbonandoak.com
            </a>
            .
          </p>
        </div>
      </section>
    </main>
  );
}
