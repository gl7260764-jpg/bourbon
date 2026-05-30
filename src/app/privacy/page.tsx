import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | Bourbon & Oak",
  description:
    "How Bourbon & Oak collects, uses and protects your data — orders, age verification, marketing emails, cookies, and your rights under CCPA and GDPR.",
  alternates: { canonical: "/privacy" },
  openGraph: {
    title: "Privacy Policy | Bourbon & Oak",
    description:
      "How Bourbon & Oak collects, uses and protects your data — orders, age verification, cookies, CCPA and GDPR rights.",
    type: "website",
    url: "/privacy",
  },
  twitter: {
    card: "summary_large_image",
    title: "Privacy Policy | Bourbon & Oak",
    description: "Your data and how we use it.",
  },
};

export default function PrivacyPage() {
  return (
    <main className="bg-bourbon-cream min-h-screen pt-24 sm:pt-32 pb-16 sm:pb-20">
      <header className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10 sm:mb-14">
        <p className="text-bourbon-gold text-xs tracking-[0.3em] uppercase mb-3">
          Legal
        </p>
        <h1 className="font-[family-name:var(--font-playfair)] text-4xl sm:text-5xl md:text-6xl font-bold text-bourbon-deep leading-tight mb-3">
          Privacy Policy
        </h1>
        <div className="w-20 h-0.5 bg-bourbon-gold mb-5" />
        <p className="text-bourbon-stone max-w-2xl text-base sm:text-lg leading-relaxed">
          Last updated 1 January 2026. Bourbon &amp; Oak respects your privacy.
          This page explains what we collect, how we use it, and the rights
          you have over your data.
        </p>
      </header>

      <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 sm:space-y-10">
        <section>
          <h2 className="font-[family-name:var(--font-playfair)] text-xl sm:text-2xl font-bold text-bourbon-deep mb-3">
            What we collect
          </h2>
          <ul className="text-bourbon-stone text-base leading-relaxed list-disc pl-6 marker:text-bourbon-gold space-y-2">
            <li>
              <strong className="text-bourbon-deep">Order data:</strong> name,
              shipping &amp; billing address, email, phone, date of birth (for
              age verification), order history.
            </li>
            <li>
              <strong className="text-bourbon-deep">Payment data:</strong>{" "}
              processed by our payment provider; we never see your full card
              number.
            </li>
            <li>
              <strong className="text-bourbon-deep">Site analytics:</strong>{" "}
              pseudonymous visitor cookies, page-view counts, country/region
              from IP, browser type. No PII tied to analytics.
            </li>
            <li>
              <strong className="text-bourbon-deep">Marketing:</strong> email
              address if you join our newsletter, with explicit consent.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="font-[family-name:var(--font-playfair)] text-xl sm:text-2xl font-bold text-bourbon-deep mb-3">
            How we use it
          </h2>
          <p className="text-bourbon-stone text-base leading-relaxed">
            We use the data to fulfill orders, verify legal age, comply with
            federal and state alcohol-shipping requirements, send
            order-related transactional email, and — only with your consent —
            send marketing email about new releases. We do not sell your
            personal data. We do not share order data with third parties
            except our shipping carrier (UPS) and payment processor, both
            bound by their own privacy obligations.
          </p>
        </section>

        <section>
          <h2 className="font-[family-name:var(--font-playfair)] text-xl sm:text-2xl font-bold text-bourbon-deep mb-3">
            Cookies
          </h2>
          <p className="text-bourbon-stone text-base leading-relaxed">
            We use first-party cookies for cart persistence, age-gate
            confirmation, and pseudonymous analytics. No third-party tracking
            or advertising cookies. You can disable cookies in your browser;
            the cart and age gate will stop working but you can still browse.
          </p>
        </section>

        <section>
          <h2 className="font-[family-name:var(--font-playfair)] text-xl sm:text-2xl font-bold text-bourbon-deep mb-3">
            Your rights
          </h2>
          <p className="text-bourbon-stone text-base leading-relaxed mb-3">
            Depending on where you live, you may have the right to:
          </p>
          <ul className="text-bourbon-stone text-base leading-relaxed list-disc pl-6 marker:text-bourbon-gold space-y-1.5">
            <li>Request a copy of your personal data</li>
            <li>Correct or update inaccurate data</li>
            <li>Delete your data (subject to order-record retention laws)</li>
            <li>Opt out of marketing email at any time (one click in any email)</li>
            <li>
              CCPA (California): request what we collect and sell — we
              don&apos;t sell anything, but the right exists
            </li>
            <li>
              GDPR (EU/UK): request data portability and lodge complaints with
              your supervisory authority
            </li>
          </ul>
          <p className="text-bourbon-stone text-base leading-relaxed mt-3">
            Send any privacy request to{" "}
            <a
              href="mailto:support@bourbonandoak.com"
              className="text-bourbon-gold underline decoration-bourbon-gold/30 underline-offset-4 hover:decoration-bourbon-gold transition-colors"
            >
              support@bourbonandoak.com
            </a>
            . We respond within 30 days.
          </p>
        </section>

        <section>
          <h2 className="font-[family-name:var(--font-playfair)] text-xl sm:text-2xl font-bold text-bourbon-deep mb-3">
            Data retention
          </h2>
          <p className="text-bourbon-stone text-base leading-relaxed">
            We retain order records for seven years to comply with federal
            alcohol-distribution recordkeeping. Marketing email subscribers
            are retained until unsubscribe. Analytics data is aggregated and
            retained for 24 months.
          </p>
        </section>

        <section className="border-t border-bourbon-deep/10 pt-8">
          <p className="text-bourbon-stone text-sm leading-relaxed">
            See also our{" "}
            <Link
              href="/terms"
              className="text-bourbon-gold underline decoration-bourbon-gold/30 underline-offset-4 hover:decoration-bourbon-gold transition-colors"
            >
              Terms of Service
            </Link>
            .
          </p>
        </section>
      </article>
    </main>
  );
}
