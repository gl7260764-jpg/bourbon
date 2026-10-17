import Link from "next/link";
import type { Metadata } from "next";
import {
  DTC_RESEARCH_AS_OF,
  RESTRICTED_STATES,
  SHIPPABLE_STATES,
} from "@/lib/shipping-states";

export const metadata: Metadata = {
  title: "Bourbon Shipping & Delivery — State Restrictions | Bourbon & Oak",
  description:
    "Which states we can ship bourbon to, and why the list is short — spirits shipping rules by state, transit times, a $100 order minimum and free shipping over $500.",
  alternates: { canonical: "/shipping" },
  openGraph: {
    title: "Bourbon Shipping & Delivery — State Restrictions",
    description:
      "How we ship Kentucky bourbon — state-by-state rules, transit times, $100 minimum order and free shipping over $500.",
    type: "website",
    url: "/shipping",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bourbon Shipping & Delivery — State Restrictions",
    description:
      "How we ship Kentucky bourbon — state restrictions, age verification, $100 minimum order, free shipping over $500.",
  },
  keywords: [
    "ship bourbon to my state",
    "bourbon shipping restrictions by state",
    "alcohol shipping age verification",
    "can you mail bourbon",
    "free bourbon shipping",
    "bourbon delivery to home",
    "Kentucky bourbon shipping rules",
  ],
};

export default function ShippingPage() {
  return (
    <main className="bg-bourbon-cream min-h-screen pt-24 sm:pt-32 pb-16 sm:pb-20">
      <header className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10 sm:mb-14">
        <p className="text-bourbon-gold text-xs tracking-[0.3em] uppercase mb-3">
          Shipping
        </p>
        <h1 className="font-[family-name:var(--font-playfair)] text-4xl sm:text-5xl md:text-6xl font-bold text-bourbon-deep leading-tight mb-3">
          Bourbon shipping &amp; delivery
        </h1>
        <div className="w-20 h-0.5 bg-bourbon-gold mb-5" />
        <p className="text-bourbon-stone max-w-2xl text-base sm:text-lg leading-relaxed">
          Bourbon &amp; Oak ships Kentucky bourbon to the{" "}
          {SHIPPABLE_STATES.length} U.S. jurisdictions where a licensed retailer
          may send distilled spirits direct to a consumer. Orders start at $100,
          shipping is a flat $9.99, and anything over $500 ships free within the
          continental U.S.
        </p>
      </header>

      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 sm:space-y-12">
        <div>
          <h2 className="font-[family-name:var(--font-playfair)] text-2xl sm:text-3xl font-bold text-bourbon-deep mb-4">
            Shipping rates &amp; transit times
          </h2>
          <div className="bg-white border border-bourbon-deep/10 p-5 sm:p-7 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-4 border-b border-bourbon-deep/10">
              <div>
                <p className="text-bourbon-stone text-[10px] tracking-widest uppercase mb-1">
                  Minimum order
                </p>
                <p className="text-bourbon-deep font-semibold">$100</p>
                <p className="text-bourbon-stone text-xs mt-1">
                  before shipping
                </p>
              </div>
              <div>
                <p className="text-bourbon-stone text-[10px] tracking-widest uppercase mb-1">
                  Under $500
                </p>
                <p className="text-bourbon-deep font-semibold">$9.99 flat</p>
                <p className="text-bourbon-stone text-xs mt-1">
                  2–5 business days
                </p>
              </div>
              <div>
                <p className="text-bourbon-stone text-[10px] tracking-widest uppercase mb-1">
                  $500 and over
                </p>
                <p className="text-bourbon-gold font-semibold">Free</p>
                <p className="text-bourbon-stone text-xs mt-1">
                  2–5 business days
                </p>
              </div>
            </div>
            <p className="text-bourbon-stone text-sm sm:text-base leading-relaxed">
              <strong className="text-bourbon-deep">
                Orders over $500 ship free
              </strong>{" "}
              to the continental U.S. (excluding states listed below).
              Everything below that is a flat $9.99 however many bottles you
              order, so a full case costs the same to ship as a single bottle.
            </p>
          </div>
        </div>

        <div>
          <h2 className="font-[family-name:var(--font-playfair)] text-2xl sm:text-3xl font-bold text-bourbon-deep mb-4">
            Age verification &amp; signature
          </h2>
          <p className="text-bourbon-stone text-base sm:text-lg leading-relaxed mb-4">
            Federal and state law require both the buyer and the recipient of
            any bourbon shipment to be 21 or older. We verify in three places:
          </p>
          <ol className="text-bourbon-stone text-base sm:text-lg leading-relaxed list-decimal pl-6 marker:text-bourbon-gold space-y-2">
            <li>
              At purchase — our age gate confirms you are 21+ before you can
              browse the store.
            </li>
            <li>
              At checkout — your billing name and date of birth are matched
              against ID verification data.
            </li>
            <li>
              At delivery — the carrier (UPS) checks government-issued photo ID
              and obtains a signature from someone 21 or older. They will not
              leave the package unattended.
            </li>
          </ol>
          <p className="text-bourbon-stone text-base sm:text-lg leading-relaxed mt-4">
            If no qualifying adult is present, the carrier will attempt delivery
            up to three times before returning the package to us. We refund the
            bottles minus the outbound shipping cost.
          </p>
        </div>

        <div>
          <h2 className="font-[family-name:var(--font-playfair)] text-2xl sm:text-3xl font-bold text-bourbon-deep mb-4">
            Where we can ship
          </h2>
          <p className="text-bourbon-stone text-base sm:text-lg leading-relaxed mb-4">
            Bourbon is a distilled spirit, and the rules for shipping spirits
            are far tighter than the rules for wine. A licensed retailer may
            ship wine to most of the country; for spirits, only{" "}
            {SHIPPABLE_STATES.length} jurisdictions permit it. We will not take
            an order we cannot lawfully deliver, so checkout lists these and
            nothing else.
          </p>
          <div className="bg-white border border-bourbon-deep/10 p-5 sm:p-7">
            <ul className="divide-y divide-bourbon-deep/10">
              {SHIPPABLE_STATES.map((s) => (
                <li key={s.code} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex items-baseline gap-3">
                    <span className="text-bourbon-deep font-semibold">
                      {s.name}
                    </span>
                    <span className="text-bourbon-gold text-[10px] tracking-[0.2em] uppercase">
                      {s.code}
                    </span>
                  </div>
                  {s.limit && (
                    <p className="text-bourbon-stone text-sm mt-1 leading-relaxed">
                      {s.limit}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </div>
          <p className="text-bourbon-stone text-sm leading-relaxed mt-4">
            Volume caps are set by each jurisdiction, not by us, and apply per
            person over the stated period.
          </p>
        </div>

        <div>
          <h2 className="font-[family-name:var(--font-playfair)] text-2xl sm:text-3xl font-bold text-bourbon-deep mb-4">
            States we cannot ship to
          </h2>
          <p className="text-bourbon-stone text-base sm:text-lg leading-relaxed mb-4">
            The remaining {RESTRICTED_STATES.length} jurisdictions do not permit
            a retailer to ship spirits direct to a consumer. That includes
            Kentucky: our own state licenses distillers to ship, not retailers.
            If yours is on this list, the bottle cannot be sent to your door by
            us, whatever the carrier may be willing to carry.
          </p>
          <div className="bg-white border border-bourbon-deep/10 p-5 sm:p-7">
            <ul className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-1.5">
              {RESTRICTED_STATES.map((s) => (
                <li key={s.code} className="text-bourbon-stone text-sm py-0.5">
                  {s.name}
                </li>
              ))}
            </ul>
          </div>
          <p className="text-bourbon-stone text-sm leading-relaxed mt-4 italic">
            Reflects state law as researched in {DTC_RESEARCH_AS_OF}. These
            rules change by legislative session and are reviewed with counsel
            before we open a new jurisdiction.
          </p>
        </div>

        <div>
          <h2 className="font-[family-name:var(--font-playfair)] text-2xl sm:text-3xl font-bold text-bourbon-deep mb-4">
            Allocated bottles &amp; pre-orders
          </h2>
          <p className="text-bourbon-stone text-base sm:text-lg leading-relaxed">
            Allocated Kentucky bourbons — Pappy Van Winkle, William Larue
            Weller, George T. Stagg, and the BTAC line — ship in custom
            protective cartons with extra padding. Pre-orders for future
            releases ship within seven days of in-stock arrival. See current
            availability in the{" "}
            <Link
              href="/collection"
              className="text-bourbon-gold underline decoration-bourbon-gold/30 underline-offset-4 hover:decoration-bourbon-gold transition-colors"
            >
              collection
            </Link>
            .
          </p>
        </div>

        <div>
          <h2 className="font-[family-name:var(--font-playfair)] text-2xl sm:text-3xl font-bold text-bourbon-deep mb-4">
            International shipping
          </h2>
          <p className="text-bourbon-stone text-base sm:text-lg leading-relaxed">
            We do not currently ship internationally — U.S. export licensing and
            destination-country duties make it impractical for the volumes we
            move. If you&apos;re visiting Kentucky, we&apos;ll happily ship your
            purchase to a U.S. address before you fly home.
          </p>
        </div>

        <div className="border-t border-bourbon-deep/10 pt-8">
          <p className="text-bourbon-stone text-sm sm:text-base leading-relaxed">
            Questions about a specific shipment? Email{" "}
            <a
              href="mailto:support@bourbonoaklover.com"
              className="text-bourbon-gold underline decoration-bourbon-gold/30 underline-offset-4 hover:decoration-bourbon-gold transition-colors"
            >
              support@bourbonoaklover.com
            </a>{" "}
            with your order number. See also our{" "}
            <Link
              href="/returns"
              className="text-bourbon-gold underline decoration-bourbon-gold/30 underline-offset-4 hover:decoration-bourbon-gold transition-colors"
            >
              returns and damaged-bottle policy
            </Link>
            .
          </p>
        </div>
      </section>
    </main>
  );
}
