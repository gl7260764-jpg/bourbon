import type { Metadata } from "next";
import Link from "next/link";
import ContactForm from "./ContactForm";
import OpenStatus from "./OpenStatus";

export const metadata: Metadata = {
  title: "Contact Bourbon & Oak — Kentucky Bourbon Distillery",
  description:
    "Contact the Bourbon & Oak distillery in Bardstown, KY — questions about a release, allocated bottles, shipping, or distillery tours. One business day reply.",
  alternates: { canonical: "/contact" },
  openGraph: {
    title: "Contact Bourbon & Oak — Kentucky Bourbon Distillery",
    description:
      "Questions about a release, allocated bottles, shipping, or distillery tours. One business day reply.",
    url: "/contact",
    type: "website",
  },
};

/* One stroke weight, one grid, drawn here rather than pulled from a set that
   would ship a hundred unused glyphs. */
function Icon({ path, className = "" }: { path: React.ReactNode; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`w-[18px] h-[18px] shrink-0 ${className}`}
    >
      {path}
    </svg>
  );
}

const MailIcon = (
  <>
    <rect x="2.5" y="4.5" width="19" height="15" />
    <path d="m3 6 9 6.5L21 6" />
  </>
);
const PhoneIcon = (
  <path d="M6.5 3.5h3l1.5 4-2 1.5a12 12 0 0 0 6 6l1.5-2 4 1.5v3a2 2 0 0 1-2.2 2A17 17 0 0 1 4.5 5.7a2 2 0 0 1 2-2.2Z" />
);
const PinIcon = (
  <>
    <path d="M20 10.5c0 5.2-8 12-8 12s-8-6.8-8-12a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10.5" r="2.75" />
  </>
);
const ClockIcon = (
  <>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 2" />
  </>
);

/** A single way to reach us. Hairlines, not nested cards. */
function Channel({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-4 py-5 first:pt-0 last:pb-0 border-b border-bourbon-deep/10 last:border-0">
      <span className="text-bourbon-gold mt-0.5">
        <Icon path={icon} />
      </span>
      <div className="min-w-0">
        <p className="text-bourbon-stone/80 text-[10px] tracking-[0.2em] uppercase mb-1.5">
          {label}
        </p>
        {children}
      </div>
    </div>
  );
}

export default function ContactPage() {
  return (
    <main className="bg-bourbon-cream min-h-screen">
      <header className="relative bg-bourbon-deep text-bourbon-cream pt-28 sm:pt-36 overflow-hidden border-b border-bourbon-gold/30">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-32 -right-20 w-[38rem] h-[38rem] rounded-full opacity-[0.13]"
          style={{
            background:
              "radial-gradient(circle, #D97706 0%, rgba(217,119,6,0.35) 42%, transparent 68%)",
          }}
        />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-10 sm:pb-14">
          <h1 className="animate-fade-up font-[family-name:var(--font-playfair)] text-4xl sm:text-5xl md:text-6xl font-bold leading-[1.05] text-bourbon-cream max-w-3xl">
            Talk to the cellar
          </h1>
          <p
            className="animate-fade-up text-bourbon-cream/70 text-base sm:text-lg leading-relaxed mt-5 max-w-xl"
            style={{ animationDelay: "80ms" }}
          >
            A question about a release, an allocated bottle, or where your order
            has got to — a person reads every note and answers within one
            business day.
          </p>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-10 lg:gap-16">
        <section>
          <h2 className="font-[family-name:var(--font-playfair)] text-2xl sm:text-3xl font-bold text-bourbon-deep">
            Send a note
          </h2>
          <p className="text-bourbon-stone text-sm mt-2 mb-7">
            Everything except the subject is required.
          </p>
          <ContactForm />
        </section>

        {/* Not a second white panel — hairline-separated channels sitting
            directly on the page, so the form keeps the visual weight. */}
        <aside className="lg:sticky lg:top-28 lg:self-start lg:border-l lg:border-bourbon-deep/10 lg:pl-10">
          <h2 className="font-[family-name:var(--font-playfair)] text-xl font-bold text-bourbon-deep mb-1">
            Reach us directly
          </h2>
          <div className="mb-6">
            <OpenStatus />
          </div>

          <Channel icon={MailIcon} label="Email">
            <a
              href="mailto:support@bourbonoaklover.com"
              className="text-bourbon-deep font-semibold hover:text-bourbon-gold transition-colors break-words"
            >
              support@bourbonoaklover.com
            </a>
          </Channel>

          <Channel icon={PhoneIcon} label="Phone">
            <a
              href="tel:+15025550199"
              className="text-bourbon-deep font-semibold hover:text-bourbon-gold transition-colors"
            >
              (502) 555-0199
            </a>
            <p className="text-bourbon-stone text-xs mt-1">
              Cellar concierge · 21+ only
            </p>
          </Channel>

          <Channel icon={ClockIcon} label="Hours">
            <dl className="text-sm space-y-1">
              <div className="flex justify-between gap-4">
                <dt className="text-bourbon-stone">Mon – Fri</dt>
                <dd className="text-bourbon-deep tabular-nums">9am – 6pm ET</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-bourbon-stone">Saturday</dt>
                <dd className="text-bourbon-deep tabular-nums">10am – 4pm ET</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-bourbon-stone">Sunday</dt>
                <dd className="text-bourbon-stone">Closed</dd>
              </div>
            </dl>
          </Channel>

          <Channel icon={PinIcon} label="Distillery">
            <p className="text-bourbon-deep text-sm leading-relaxed">
              1876 Oak Barrel Lane
              <br />
              Bardstown, KY 40004
            </p>
            <Link
              href="/visit"
              className="inline-block mt-2 text-bourbon-gold text-sm font-semibold hover:text-bourbon-amber transition-colors"
            >
              Plan a visit
            </Link>
          </Channel>
        </aside>
      </div>
    </main>
  );
}
