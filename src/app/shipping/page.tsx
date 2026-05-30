import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bourbon Shipping & Delivery — State Restrictions | Bourbon & Oak",
  description:
    "How we ship Kentucky bourbon — adult signature required, state-by-state shipping rules, transit times, and free shipping on orders over $250.",
  alternates: { canonical: "/shipping" },
  openGraph: {
    title: "Bourbon Shipping & Delivery — State Restrictions",
    description:
      "How we ship Kentucky bourbon — adult signature required, state-by-state shipping rules, transit times, and free shipping over $250.",
    type: "website",
    url: "/shipping",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bourbon Shipping & Delivery — State Restrictions",
    description:
      "How we ship Kentucky bourbon — state restrictions, age verification, free shipping over $250.",
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

// Direct-to-consumer alcohol shipping rules change yearly; these reflect
// 2026 baseline and are conservative. Update annually with the legal team.
const noShipStates = [
  { state: "Alabama", reason: "DTC alcohol shipping prohibited by state law" },
  { state: "Arkansas", reason: "DTC alcohol shipping prohibited" },
  { state: "Delaware", reason: "DTC distilled spirits prohibited" },
  { state: "Kentucky", reason: "In-state retail license required" },
  { state: "Mississippi", reason: "DTC alcohol shipping prohibited" },
  { state: "Rhode Island", reason: "DTC distilled spirits prohibited" },
  { state: "South Dakota", reason: "DTC alcohol shipping prohibited" },
  { state: "Utah", reason: "State-controlled liquor system; no DTC shipping" },
];

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
          Bourbon &amp; Oak ships Kentucky bourbon to every U.S. state where
          direct-to-consumer distilled-spirits shipping is legal. Every
          package requires an adult signature with photo ID at delivery, and
          orders over $250 ship free within the continental U.S.
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
                  Single bottle
                </p>
                <p className="text-bourbon-deep font-semibold">$18 – $32</p>
                <p className="text-bourbon-stone text-xs mt-1">2–5 business days</p>
              </div>
              <div>
                <p className="text-bourbon-stone text-[10px] tracking-widest uppercase mb-1">
                  Two to five bottles
                </p>
                <p className="text-bourbon-deep font-semibold">$28 – $48</p>
                <p className="text-bourbon-stone text-xs mt-1">2–5 business days</p>
              </div>
              <div>
                <p className="text-bourbon-stone text-[10px] tracking-widest uppercase mb-1">
                  Case (6+ bottles)
                </p>
                <p className="text-bourbon-deep font-semibold">$35 – $60</p>
                <p className="text-bourbon-stone text-xs mt-1">3–7 business days</p>
              </div>
            </div>
            <p className="text-bourbon-stone text-sm sm:text-base leading-relaxed">
              <strong className="text-bourbon-deep">Orders over $250 ship free</strong>{" "}
              to the continental U.S. (excluding states listed below). Rates
              are shown live at checkout based on your delivery ZIP code and
              package weight. We use UPS Adult Signature Required service on
              every shipment.
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
              At delivery — the carrier (UPS) checks government-issued photo
              ID and obtains a signature from someone 21 or older. They will
              not leave the package unattended.
            </li>
          </ol>
          <p className="text-bourbon-stone text-base sm:text-lg leading-relaxed mt-4">
            If no qualifying adult is present, the carrier will attempt
            delivery up to three times before returning the package to us. We
            refund the bottles minus the outbound shipping cost.
          </p>
        </div>

        <div>
          <h2 className="font-[family-name:var(--font-playfair)] text-2xl sm:text-3xl font-bold text-bourbon-deep mb-4">
            States we cannot ship to
          </h2>
          <p className="text-bourbon-stone text-base sm:text-lg leading-relaxed mb-4">
            Eight U.S. states currently prohibit or restrict direct-to-consumer
            bourbon shipping. We won&apos;t accept orders for delivery to:
          </p>
          <div className="bg-white border border-bourbon-deep/10 p-5 sm:p-7">
            <ul className="divide-y divide-bourbon-deep/10">
              {noShipStates.map((s) => (
                <li
                  key={s.state}
                  className="flex items-baseline justify-between gap-4 py-2.5"
                >
                  <span className="text-bourbon-deep font-semibold">
                    {s.state}
                  </span>
                  <span className="text-bourbon-stone text-sm text-right">
                    {s.reason}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <p className="text-bourbon-stone text-sm leading-relaxed mt-4 italic">
            Restrictions reflect 2026 state law and change periodically.
            Reviewed annually with counsel.
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
            We do not currently ship internationally — U.S. export licensing
            and destination-country duties make it impractical for the volumes
            we move. If you&apos;re visiting Kentucky, we&apos;ll happily ship
            your purchase to a U.S. address before you fly home.
          </p>
        </div>

        <div className="border-t border-bourbon-deep/10 pt-8">
          <p className="text-bourbon-stone text-sm sm:text-base leading-relaxed">
            Questions about a specific shipment? Email{" "}
            <a
              href="mailto:support@bourbonandoak.com"
              className="text-bourbon-gold underline decoration-bourbon-gold/30 underline-offset-4 hover:decoration-bourbon-gold transition-colors"
            >
              support@bourbonandoak.com
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
