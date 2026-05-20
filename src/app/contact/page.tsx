import ContactForm from "./ContactForm";

export const metadata = {
  title: "Contact Us | Bourbon & Oak",
  description:
    "Questions about a release, an allocated bottle, or shipping? Send us a note — we read every one.",
};

export default function ContactPage() {
  return (
    <main className="bg-bourbon-cream min-h-screen pt-24 sm:pt-32 pb-16 sm:pb-20">
      {/* Header */}
      <header className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10 sm:mb-14">
        <p className="text-bourbon-gold text-xs tracking-[0.3em] uppercase mb-3">
          Get In Touch
        </p>
        <h1 className="font-[family-name:var(--font-playfair)] text-4xl sm:text-5xl md:text-6xl font-bold text-bourbon-deep leading-tight mb-3">
          Contact Us
        </h1>
        <div className="w-20 h-0.5 bg-bourbon-gold mb-5" />
        <p className="text-bourbon-stone max-w-2xl text-base sm:text-lg leading-relaxed">
          Questions about a release, an allocated bottle, or shipping? Send us
          a note — we read every one and reply within one business day.
        </p>
      </header>

      {/* Two column */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 lg:gap-12">
        {/* Form */}
        <section className="bg-white border border-bourbon-deep/10 p-5 sm:p-8">
          <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-bourbon-deep mb-6 pb-4 border-b border-bourbon-deep/10">
            Send a message
          </h2>
          <ContactForm />
        </section>

        {/* Info card */}
        <aside>
          <div className="lg:sticky lg:top-28 bg-white border border-bourbon-deep/10 p-5 sm:p-7 space-y-6">
            <div>
              <p className="text-bourbon-stone text-[10px] tracking-widest uppercase mb-1.5">
                Email
              </p>
              <a
                href="mailto:cellar@bourbonandoak.com"
                className="text-bourbon-deep font-semibold hover:text-bourbon-gold transition-colors"
              >
                cellar@bourbonandoak.com
              </a>
            </div>
            <div>
              <p className="text-bourbon-stone text-[10px] tracking-widest uppercase mb-1.5">
                Phone
              </p>
              <a
                href="tel:+15025550199"
                className="text-bourbon-deep font-semibold hover:text-bourbon-gold transition-colors"
              >
                (502) 555-0199
              </a>
              <p className="text-bourbon-stone text-xs mt-1">
                Cellar concierge, 21+ only
              </p>
            </div>
            <div>
              <p className="text-bourbon-stone text-[10px] tracking-widest uppercase mb-1.5">
                Hours
              </p>
              <p className="text-bourbon-deep text-sm">
                Mon–Fri · 9am – 6pm ET
              </p>
              <p className="text-bourbon-deep text-sm">
                Saturday · 10am – 4pm ET
              </p>
              <p className="text-bourbon-stone text-sm">Sunday · Closed</p>
            </div>
            <div className="pt-5 border-t border-bourbon-deep/10">
              <p className="text-bourbon-stone text-[10px] tracking-widest uppercase mb-1.5">
                Distillery
              </p>
              <p className="text-bourbon-deep text-sm leading-relaxed">
                1876 Oak Barrel Lane
                <br />
                Bardstown, KY 40004
              </p>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
