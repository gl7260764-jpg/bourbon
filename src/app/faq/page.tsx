import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bourbon FAQ — Shipping, Allocation, Aging & Tasting | Bourbon & Oak",
  description:
    "Answers to the most-asked Kentucky bourbon questions: state shipping restrictions, single barrel vs small batch, bottled-in-bond, allocated bottles, and storage.",
  alternates: { canonical: "/faq" },
  openGraph: {
    title: "Bourbon FAQ — Shipping, Allocation, Aging & Tasting",
    description:
      "The most-asked Kentucky bourbon questions answered: shipping, single barrel, bottled-in-bond, allocated bottles, storage and proof.",
    type: "website",
    url: "/faq",
  },
  twitter: {
    card: "summary_large_image",
    title: "Bourbon FAQ — Shipping, Allocation, Aging & Tasting",
    description:
      "The most-asked Kentucky bourbon questions answered.",
  },
  keywords: [
    "bourbon FAQ",
    "what is single barrel bourbon",
    "what is bottled in bond bourbon",
    "can you ship bourbon to my state",
    "how old to buy bourbon",
    "is bourbon gluten free",
    "what does allocated bourbon mean",
    "how to store bourbon",
    "proof vs ABV",
    "Kentucky straight bourbon definition",
    "difference between bourbon and whiskey",
    "what is mash bill",
  ],
};

type QA = {
  q: string;
  // a is JSX so we can include links and emphasis; we strip to plain text for JSON-LD
  a: React.ReactNode;
  // Plain-text version used by FAQPage schema (Google parses the answer text)
  text: string;
};

const faqs: QA[] = [
  {
    q: "Can you ship bourbon to my state?",
    text: "We ship bourbon to every U.S. state where it is legal to receive distilled spirits by mail. As of 2026 we do not ship to AL, AR, DE, KY, MS, RI, SD or UT — those states either prohibit direct-to-consumer alcohol shipping or require an in-state license we don't hold. Every shipment requires an adult signature with ID verification at delivery.",
    a: (
      <>
        We ship Kentucky bourbon to every U.S. state where it&apos;s legal to
        receive distilled spirits by mail. As of 2026 we do <em>not</em> ship
        to AL, AR, DE, KY, MS, RI, SD or UT — those states either prohibit
        direct-to-consumer alcohol shipping or require an in-state license we
        don&apos;t hold. Every shipment requires an adult signature with ID
        verification at delivery. See the full state-by-state breakdown on our{" "}
        <Link
          href="/shipping"
          className="text-bourbon-gold underline decoration-bourbon-gold/30 underline-offset-4 hover:decoration-bourbon-gold transition-colors"
        >
          shipping page
        </Link>
        .
      </>
    ),
  },
  {
    q: "How old do you have to be to buy bourbon?",
    text: "You must be 21 or older to buy bourbon in the United States. We verify age on every order — first on this site, then again at delivery, where the carrier checks government-issued ID matching the order name.",
    a: (
      <>
        You must be 21 or older to buy bourbon in the United States. We verify
        age on every order — first on this site through our age gate, then
        again at delivery, where the carrier checks a government-issued ID
        matching the order name. If the recipient is not 21 or refuses to
        present ID, the carrier returns the package and we refund the bottles
        minus shipping.
      </>
    ),
  },
  {
    q: "What is single barrel bourbon?",
    text: "Single barrel bourbon is whiskey bottled from one specific cask, never married with other barrels. The barrel number, warehouse and often rick position appear on the label, so every bottle from that barrel will taste the same as every other — but a different single-barrel release from the same distillery can taste markedly different. Single barrel is the most personal expression in American whiskey.",
    a: (
      <>
        Single barrel bourbon is whiskey bottled from one specific cask, never
        married with other barrels. The barrel number, warehouse and often
        rick position appear on the label, so every bottle from that barrel
        will taste the same as every other from it — but a different
        single-barrel release from the same distillery can taste markedly
        different. Read our master distiller&apos;s{" "}
        <Link
          href="/blog/master-distiller-barrel-selection-guide"
          className="text-bourbon-gold underline decoration-bourbon-gold/30 underline-offset-4 hover:decoration-bourbon-gold transition-colors"
        >
          guide to how single barrels are picked
        </Link>
        .
      </>
    ),
  },
  {
    q: "What is small batch bourbon?",
    text: "Small batch bourbon is a hand-married blend of a small number of barrels — typically 8 to 30, sometimes up to 100 — chosen for a consistent flavor profile. There is no legal definition; 'small batch' is a marketing term, but reputable distilleries use it to mean a deliberately curated mingling. Small batch bourbons are usually less expensive than single barrels and more consistent bottle-to-bottle.",
    a: (
      <>
        Small batch bourbon is a hand-married blend of a small number of
        barrels — typically 8 to 30, sometimes up to 100 — chosen for a
        consistent flavor profile. There is no legal definition; &quot;small
        batch&quot; is a marketing term, but reputable distilleries use it to
        mean a deliberately curated mingling. Small batch bourbons are usually
        less expensive than single barrels and more consistent bottle-to-bottle.
      </>
    ),
  },
  {
    q: "What is bottled-in-bond bourbon?",
    text: "Bottled-in-bond is a federally regulated whiskey category created by the Bottled-in-Bond Act of 1897. To carry the label, the bourbon must be: the product of one distillery, made by one master distiller, in one distilling season (Jan–Jun or Jul–Dec), aged in a federally bonded warehouse for at least four years, and bottled at exactly 100 proof. It's the strictest authenticity guarantee in American whiskey.",
    a: (
      <>
        Bottled-in-bond is a federally regulated whiskey category created by
        the{" "}
        <a
          href="https://www.ttb.gov/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-bourbon-gold underline decoration-bourbon-gold/30 underline-offset-4 hover:decoration-bourbon-gold transition-colors"
        >
          Bottled-in-Bond Act of 1897
        </a>
        . To carry the label, the bourbon must be: the product of one
        distillery, made by one master distiller, in one distilling season
        (January–June or July–December), aged in a federally bonded warehouse
        for at least four years, and bottled at exactly 100 proof. It&apos;s
        the strictest authenticity guarantee in American whiskey.
      </>
    ),
  },
  {
    q: "What does 'allocated' bourbon mean?",
    text: "An allocated bourbon is one where annual demand vastly exceeds annual supply, so the distillery rations bottles to retailers in fixed quotas. Pappy Van Winkle, E.H. Taylor Barrel Proof, William Larue Weller and George T. Stagg are the most famous examples. Allocated bottles usually sell out within hours of release at retail, which is why the secondary market exists.",
    a: (
      <>
        An allocated bourbon is one where annual demand vastly exceeds annual
        supply, so the distillery rations bottles to retailers in fixed
        quotas. <strong className="text-bourbon-deep">Pappy Van Winkle</strong>
        , <strong className="text-bourbon-deep">E.H. Taylor Barrel Proof</strong>,{" "}
        <strong className="text-bourbon-deep">William Larue Weller</strong> and{" "}
        <strong className="text-bourbon-deep">George T. Stagg</strong> are the
        most famous examples. Allocated bottles usually sell out within hours
        of release at retail. Get on our newsletter list to be notified when
        we receive an allocation.
      </>
    ),
  },
  {
    q: "How should I store bourbon?",
    text: "Store bourbon upright (not on its side — the high-proof spirit will degrade the cork), out of direct sunlight, at room temperature. An unopened bottle will last decades. Once opened, oxidation slowly changes the flavor; finish a bottle within 1–2 years for best taste. Half-empty bottles oxidize faster — transfer to a smaller bottle if you're a slow drinker.",
    a: (
      <>
        Store bourbon <strong className="text-bourbon-deep">upright</strong>{" "}
        (not on its side — the high-proof spirit will degrade the cork), out
        of direct sunlight, at room temperature. An unopened bottle will last
        decades. Once opened, oxidation slowly changes the flavor — finish a
        bottle within one to two years for best taste. Half-empty bottles
        oxidize faster, so transfer the remainder to a smaller bottle if
        you&apos;re a slow drinker.
      </>
    ),
  },
  {
    q: "Is bourbon gluten-free?",
    text: "Yes. Distillation removes the gluten protein from any grain mash, including bourbon's corn-rye-malt or corn-wheat-malt base. Bourbon is safe for people with celiac disease and gluten sensitivity. The TTB and the FDA both classify distilled spirits as gluten-free regardless of the source grain.",
    a: (
      <>
        Yes. Distillation removes the gluten protein from any grain mash,
        including bourbon&apos;s corn-rye-malt or corn-wheat-malt base.
        Bourbon is safe for people with celiac disease and gluten sensitivity.
        The TTB and the FDA both classify distilled spirits as gluten-free
        regardless of the source grain.
      </>
    ),
  },
  {
    q: "What's the difference between proof and ABV?",
    text: "Proof is exactly twice the ABV (alcohol by volume). A bourbon labeled '90 proof' is 45% ABV. The U.S. proof system was created so distillers could prove the alcohol content by 'gunpowder test' — soaking gunpowder in spirit and lighting it. 100 proof was the minimum strength at which the powder would still ignite.",
    a: (
      <>
        Proof is exactly twice the ABV (alcohol by volume). A bourbon labeled
        &quot;90 proof&quot; is 45% ABV. The U.S. proof system was created so
        distillers could <em>prove</em> the alcohol content by &quot;gunpowder
        test&quot; — soaking gunpowder in spirit and lighting it. 100 proof
        was the minimum strength at which the powder would still ignite.
      </>
    ),
  },
  {
    q: "What's the difference between bourbon and whiskey?",
    text: "All bourbon is whiskey, but not all whiskey is bourbon. Bourbon is a legally defined American whiskey that must be: made in the U.S., from a mash bill of at least 51% corn, distilled to no more than 160 proof, aged in NEW charred American oak barrels at no more than 125 proof entry, and bottled at no less than 80 proof. Scotch, Irish, Japanese and rye whiskeys don't meet those rules.",
    a: (
      <>
        All bourbon is whiskey, but not all whiskey is bourbon. Bourbon is a
        legally defined American whiskey that must be: made in the U.S., from
        a mash bill of at least 51% corn, distilled to no more than 160 proof,
        aged in <strong className="text-bourbon-deep">new</strong> charred
        American oak barrels at no more than 125 proof entry, and bottled at
        no less than 80 proof. Scotch, Irish, Japanese and most rye whiskeys
        don&apos;t meet those rules.
      </>
    ),
  },
  {
    q: "What is a mash bill?",
    text: "A mash bill is the grain recipe a distillery uses for a particular whiskey. For bourbon, the mash bill must be at least 51% corn; the remainder is typically rye and malted barley, or wheat and malted barley (a 'wheated' bourbon). High-rye bourbon tastes spicier and drier; wheated bourbon tastes softer and more honeyed. Same distillery, different mash bill, completely different bourbon.",
    a: (
      <>
        A mash bill is the grain recipe a distillery uses for a particular
        whiskey. For bourbon, the mash bill must be at least 51% corn; the
        remainder is typically rye and malted barley, or wheat and malted
        barley (a &quot;wheated&quot; bourbon). High-rye bourbon tastes
        spicier and drier; wheated bourbon tastes softer and more honeyed.
        Same distillery, different mash bill, completely different bourbon.
      </>
    ),
  },
  {
    q: "How long does bourbon have to be aged?",
    text: "There's no minimum aging requirement to call something 'bourbon,' but to call it 'straight bourbon' it must be aged at least two years. If aged less than four years, the age must be stated on the label. Bottled-in-bond bourbon requires four years. Most premium Kentucky bourbon ages 6–12 years; allocated bottles like Pappy Van Winkle 23 age more than two decades.",
    a: (
      <>
        There&apos;s no minimum aging requirement to call something
        &quot;bourbon,&quot; but to call it{" "}
        <strong className="text-bourbon-deep">&quot;straight bourbon&quot;</strong>{" "}
        it must be aged at least two years. If aged less than four years, the
        age must be stated on the label. Bottled-in-bond bourbon requires four
        years. Most premium Kentucky bourbon ages 6–12 years; allocated bottles
        like Pappy Van Winkle 23 age more than two decades.
      </>
    ),
  },
  {
    q: "Do you offer free shipping?",
    text: "Yes — orders over $250 ship free within the continental United States. Below that threshold, shipping is calculated at checkout based on weight and destination, typically $18–$32 for a single bottle and $35–$60 for a case. Allocated bottles ship in custom protective cartons.",
    a: (
      <>
        Yes — orders over <strong className="text-bourbon-deep">$250</strong>{" "}
        ship free within the continental United States. Below that threshold,
        shipping is calculated at checkout based on weight and destination,
        typically $18–$32 for a single bottle and $35–$60 for a case.
        Allocated bottles ship in custom protective cartons. Full details on
        the{" "}
        <Link
          href="/shipping"
          className="text-bourbon-gold underline decoration-bourbon-gold/30 underline-offset-4 hover:decoration-bourbon-gold transition-colors"
        >
          shipping page
        </Link>
        .
      </>
    ),
  },
  {
    q: "What happens if my bottle arrives broken?",
    text: "Damaged-in-transit bottles are replaced free of charge. Photograph the package and the broken bottle, email support@bourbonandoak.com within 7 days of delivery, and we'll ship a replacement at no cost. Full policy and how to file a claim is on our returns page.",
    a: (
      <>
        Damaged-in-transit bottles are replaced free of charge. Photograph the
        package and the broken bottle, email{" "}
        <a
          href="mailto:support@bourbonandoak.com"
          className="text-bourbon-gold underline decoration-bourbon-gold/30 underline-offset-4 hover:decoration-bourbon-gold transition-colors"
        >
          support@bourbonandoak.com
        </a>{" "}
        within seven days of delivery, and we&apos;ll ship a replacement at
        no cost. Full policy on the{" "}
        <Link
          href="/returns"
          className="text-bourbon-gold underline decoration-bourbon-gold/30 underline-offset-4 hover:decoration-bourbon-gold transition-colors"
        >
          returns page
        </Link>
        .
      </>
    ),
  },
];

export default function FAQPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.text,
      },
    })),
  };

  return (
    <main className="bg-bourbon-cream min-h-screen pt-24 sm:pt-32 pb-16 sm:pb-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <header className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-10 sm:mb-14">
        <p className="text-bourbon-gold text-xs tracking-[0.3em] uppercase mb-3">
          Frequently Asked
        </p>
        <h1 className="font-[family-name:var(--font-playfair)] text-4xl sm:text-5xl md:text-6xl font-bold text-bourbon-deep leading-tight mb-3">
          Bourbon FAQ
        </h1>
        <div className="w-20 h-0.5 bg-bourbon-gold mb-5" />
        <p className="text-bourbon-stone max-w-2xl text-base sm:text-lg leading-relaxed">
          The most-asked questions about Kentucky bourbon — shipping rules by
          state, what single barrel and bottled-in-bond actually mean, why
          some bottles are allocated, and how to store bourbon so it lasts.
          Have a question we haven&apos;t answered? Email{" "}
          <a
            href="mailto:support@bourbonandoak.com"
            className="text-bourbon-gold underline decoration-bourbon-gold/30 underline-offset-4 hover:decoration-bourbon-gold transition-colors"
          >
            support@bourbonandoak.com
          </a>
          .
        </p>
      </header>

      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
        {faqs.map((faq, i) => (
          <article
            key={i}
            className="bg-white border border-bourbon-deep/10 p-5 sm:p-7"
          >
            <h2 className="font-[family-name:var(--font-playfair)] text-lg sm:text-xl font-bold text-bourbon-deep mb-3 leading-tight">
              {faq.q}
            </h2>
            <div className="text-bourbon-stone text-sm sm:text-base leading-relaxed">
              {faq.a}
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
