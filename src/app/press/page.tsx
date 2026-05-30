import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Press & Media | Bourbon & Oak Distillery",
  description:
    "Press resources for journalists, bourbon writers and trade media — high-res photography, founder bios, distillery facts, and review samples.",
  alternates: { canonical: "/press" },
  openGraph: {
    title: "Press & Media | Bourbon & Oak Distillery",
    description:
      "Press kit, founder bios, distillery facts, and review samples for journalists and trade media.",
    type: "website",
    url: "/press",
  },
  twitter: {
    card: "summary_large_image",
    title: "Press & Media | Bourbon & Oak Distillery",
    description:
      "Press kit, founder bios, distillery facts, and review samples.",
  },
  keywords: [
    "Bourbon and Oak press",
    "Kentucky bourbon press contact",
    "bourbon distillery media kit",
    "bourbon review samples",
    "Bourbon and Oak media inquiries",
  ],
};

const facts = [
  { label: "Founded", value: "1876" },
  { label: "Location", value: "Bardstown, Kentucky" },
  { label: "Family generation", value: "6th (Hayes family)" },
  { label: "Master Distiller", value: "Eleanor Hayes" },
  { label: "Rickhouses on-site", value: "7 active warehouses" },
  { label: "Barrels under aging", value: "~120,000" },
  { label: "Annual production", value: "~32,000 cases" },
  { label: "Water source", value: "Limestone-filtered well" },
  { label: "Kentucky Bourbon Trail member", value: "Since 1999" },
];

export default function PressPage() {
  return (
    <main className="bg-bourbon-cream min-h-screen pt-24 sm:pt-32 pb-16 sm:pb-20">
      <header className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10 sm:mb-14">
        <p className="text-bourbon-gold text-xs tracking-[0.3em] uppercase mb-3">
          Press &amp; Media
        </p>
        <h1 className="font-[family-name:var(--font-playfair)] text-4xl sm:text-5xl md:text-6xl font-bold text-bourbon-deep leading-tight mb-3">
          Press &amp; Media
        </h1>
        <div className="w-20 h-0.5 bg-bourbon-gold mb-5" />
        <p className="text-bourbon-stone max-w-2xl text-base sm:text-lg leading-relaxed">
          Resources for journalists, bourbon writers and trade media covering
          the Kentucky bourbon industry. For review samples, expert quotes,
          high-resolution photography or to schedule a distillery visit,
          contact our press desk directly.
        </p>
      </header>

      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 sm:space-y-12">
        <div>
          <h2 className="font-[family-name:var(--font-playfair)] text-2xl sm:text-3xl font-bold text-bourbon-deep mb-4">
            Press contact
          </h2>
          <div className="bg-white border border-bourbon-deep/10 p-5 sm:p-7 space-y-3">
            <div>
              <p className="text-bourbon-stone text-[10px] tracking-widest uppercase mb-1">
                Email
              </p>
              <a
                href="mailto:support@bourbonandoak.com"
                className="text-bourbon-deep font-semibold hover:text-bourbon-gold transition-colors"
              >
                support@bourbonandoak.com
              </a>
            </div>
            <div>
              <p className="text-bourbon-stone text-[10px] tracking-widest uppercase mb-1">
                Response time
              </p>
              <p className="text-bourbon-deep">Within one business day</p>
            </div>
            <div>
              <p className="text-bourbon-stone text-[10px] tracking-widest uppercase mb-1">
                Distillery
              </p>
              <p className="text-bourbon-deep">
                1876 Oak Barrel Lane
                <br />
                Bardstown, KY 40004
              </p>
            </div>
          </div>
        </div>

        <div>
          <h2 className="font-[family-name:var(--font-playfair)] text-2xl sm:text-3xl font-bold text-bourbon-deep mb-4">
            Distillery facts
          </h2>
          <div className="bg-white border border-bourbon-deep/10 p-5 sm:p-7">
            <dl className="divide-y divide-bourbon-deep/10">
              {facts.map((f) => (
                <div
                  key={f.label}
                  className="flex items-baseline justify-between gap-4 py-2.5"
                >
                  <dt className="text-bourbon-stone text-sm tracking-wide">
                    {f.label}
                  </dt>
                  <dd className="text-bourbon-deep font-semibold text-right">
                    {f.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        <div>
          <h2 className="font-[family-name:var(--font-playfair)] text-2xl sm:text-3xl font-bold text-bourbon-deep mb-4">
            Available for interview
          </h2>
          <ul className="text-bourbon-stone text-base sm:text-lg leading-relaxed list-disc pl-6 marker:text-bourbon-gold space-y-2">
            <li>
              <strong className="text-bourbon-deep">Eleanor Hayes</strong> —
              Master Distiller. Topics: barrel selection, char level science,
              the next generation of Kentucky bourbon, women in distilling.
            </li>
            <li>
              <strong className="text-bourbon-deep">Marcus Hayes</strong> —
              CEO &amp; sixth-generation owner. Topics: family-business
              succession, the bourbon boom, supply allocation, Bardstown
              tourism.
            </li>
            <li>
              <strong className="text-bourbon-deep">James Whitfield</strong> —
              Head Bartender. Topics: classic and modern bourbon cocktails,
              the bourbon-bar revival, the resurgence of the Kentucky
              julep.
            </li>
          </ul>
        </div>

        <div>
          <h2 className="font-[family-name:var(--font-playfair)] text-2xl sm:text-3xl font-bold text-bourbon-deep mb-4">
            Review samples
          </h2>
          <p className="text-bourbon-stone text-base sm:text-lg leading-relaxed">
            We send review samples to credentialed bourbon writers, trade
            publications, and major spirits competitions. Include outlet,
            recent bylines, and shipping address in your initial email — we
            verify trade status before fulfilling.
          </p>
        </div>

        <div>
          <h2 className="font-[family-name:var(--font-playfair)] text-2xl sm:text-3xl font-bold text-bourbon-deep mb-4">
            Recent coverage
          </h2>
          <p className="text-bourbon-stone text-base sm:text-lg leading-relaxed">
            Read our latest releases, barrel-pick reports and rickhouse
            stories in the{" "}
            <Link
              href="/blog"
              className="text-bourbon-gold underline decoration-bourbon-gold/30 underline-offset-4 hover:decoration-bourbon-gold transition-colors"
            >
              From the Distillery
            </Link>{" "}
            archive. For a guided distillery visit — including a private
            tasting led by the master distiller — see{" "}
            <Link
              href="/tours"
              className="text-bourbon-gold underline decoration-bourbon-gold/30 underline-offset-4 hover:decoration-bourbon-gold transition-colors"
            >
              tours
            </Link>
            .
          </p>
        </div>
      </section>
    </main>
  );
}
