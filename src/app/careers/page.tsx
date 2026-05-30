import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Careers at a Kentucky Bourbon Distillery | Bourbon & Oak",
  description:
    "Distillery, rickhouse and bourbon-bar jobs in Bardstown, Kentucky. Open roles, internships, and apprenticeships at a family-owned Kentucky bourbon distillery.",
  alternates: { canonical: "/careers" },
  openGraph: {
    title: "Careers at a Kentucky Bourbon Distillery",
    description:
      "Distillery, rickhouse and bourbon-bar jobs in Bardstown, Kentucky.",
    type: "website",
    url: "/careers",
  },
  twitter: {
    card: "summary_large_image",
    title: "Careers at a Kentucky Bourbon Distillery",
    description:
      "Distillery, rickhouse and bourbon-bar jobs in Bardstown, Kentucky.",
  },
  keywords: [
    "bourbon distillery jobs Kentucky",
    "Bardstown distillery jobs",
    "rickhouse jobs Kentucky",
    "Kentucky bourbon careers",
    "distillery apprenticeship Kentucky",
    "bourbon bar jobs Bardstown",
  ],
};

const openings = [
  {
    role: "Cellar Associate (Rickhouse)",
    location: "Bardstown, KY · On-site",
    type: "Full-time",
    summary:
      "Hands-on warehouse work: receiving fresh barrels, racking and dunnage, sampling for the master distiller, end-of-aging dump-and-bottle. Physical role. Bourbon experience helpful, training provided.",
  },
  {
    role: "Tour Guide &amp; Tasting Host",
    location: "Bardstown, KY · On-site",
    type: "Full-time / Part-time",
    summary:
      "Lead guided distillery tours along the Kentucky Bourbon Trail. Deep bourbon knowledge will be trained; we look for great hosts. Weekend availability required.",
  },
  {
    role: "Assistant Distiller",
    location: "Bardstown, KY · On-site",
    type: "Full-time",
    summary:
      "Support the master distiller through fermentation, distillation, barrel entry and barrel pulls. Background in food science, brewing, or chemistry preferred. Two-year apprenticeship track to journeyman distiller.",
  },
  {
    role: "Ecommerce &amp; Allocation Coordinator",
    location: "Bardstown, KY · Hybrid",
    type: "Full-time",
    summary:
      "Manage allocated-bottle releases, coordinate with our shipping carrier on multi-state compliance, work with the cellar concierge on customer questions. Logistics and ecommerce experience required.",
  },
];

export default function CareersPage() {
  return (
    <main className="bg-bourbon-cream min-h-screen pt-24 sm:pt-32 pb-16 sm:pb-20">
      <header className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10 sm:mb-14">
        <p className="text-bourbon-gold text-xs tracking-[0.3em] uppercase mb-3">
          Careers
        </p>
        <h1 className="font-[family-name:var(--font-playfair)] text-4xl sm:text-5xl md:text-6xl font-bold text-bourbon-deep leading-tight mb-3">
          Work at a Kentucky bourbon distillery
        </h1>
        <div className="w-20 h-0.5 bg-bourbon-gold mb-5" />
        <p className="text-bourbon-stone max-w-2xl text-base sm:text-lg leading-relaxed">
          Bourbon &amp; Oak hires distillers, rickhouse staff, tour guides and
          ecommerce operators in Bardstown, Kentucky — the bourbon capital of
          the world. We&apos;re a sixth-generation family business that pays
          well, trains thoroughly, and treats craft like the long game it is.
        </p>
      </header>

      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-10">
        <div>
          <h2 className="font-[family-name:var(--font-playfair)] text-2xl sm:text-3xl font-bold text-bourbon-deep mb-4">
            Open roles
          </h2>
          <div className="space-y-4 sm:space-y-5">
            {openings.map((job) => (
              <article
                key={job.role}
                className="bg-white border border-bourbon-deep/10 p-5 sm:p-7"
              >
                <p className="text-bourbon-gold text-[10px] tracking-widest uppercase font-semibold mb-2">
                  {job.type} · {job.location}
                </p>
                <h3
                  className="font-[family-name:var(--font-playfair)] text-lg sm:text-xl font-bold text-bourbon-deep mb-2"
                  dangerouslySetInnerHTML={{ __html: job.role }}
                />
                <p className="text-bourbon-stone text-sm sm:text-base leading-relaxed">
                  {job.summary}
                </p>
              </article>
            ))}
          </div>
        </div>

        <div>
          <h2 className="font-[family-name:var(--font-playfair)] text-2xl sm:text-3xl font-bold text-bourbon-deep mb-4">
            How to apply
          </h2>
          <p className="text-bourbon-stone text-base sm:text-lg leading-relaxed mb-4">
            Send a résumé and short note about the role to{" "}
            <a
              href="mailto:support@bourbonandoak.com"
              className="text-bourbon-gold underline decoration-bourbon-gold/30 underline-offset-4 hover:decoration-bourbon-gold transition-colors"
            >
              support@bourbonandoak.com
            </a>
            . If you&apos;ve worked in another distillery before, tell us what
            you made and where. If you haven&apos;t, tell us why bourbon. All
            roles are based in Bardstown — relocation help available for the
            distiller track.
          </p>
          <p className="text-bourbon-stone text-base sm:text-lg leading-relaxed">
            Don&apos;t see your role here? We always read introductions.
            Bourbon &amp; Oak is an equal-opportunity employer; you must be
            21+ to work in any production or tasting role.
          </p>
        </div>

        <div className="border-t border-bourbon-deep/10 pt-8">
          <p className="text-bourbon-stone text-sm leading-relaxed">
            Curious about who we are first?{" "}
            <Link
              href="/about"
              className="text-bourbon-gold underline decoration-bourbon-gold/30 underline-offset-4 hover:decoration-bourbon-gold transition-colors"
            >
              Read the story of the distillery
            </Link>
            .
          </p>
        </div>
      </section>
    </main>
  );
}
