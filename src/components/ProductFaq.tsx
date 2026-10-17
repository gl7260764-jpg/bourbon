import type { ProductFaqItem } from "@/lib/product-faq";

/**
 * The questions-and-answers block on a bottle's page.
 *
 * A server component on purpose. The one claim about AI retrieval with
 * evidence behind it is that static markup is parsed far more reliably than
 * anything a crawler has to execute JavaScript to see — so this renders in the
 * HTML, not after hydration.
 *
 * Plain <h3> and <p> rather than a disclosure widget: content hidden behind a
 * summary element is still in the DOM, but it is also the first thing a reader
 * on a phone skips. These answers are short enough to just show.
 */
export default function ProductFaq({
  items,
  productName,
}: {
  items: ProductFaqItem[];
  productName: string;
}) {
  if (items.length === 0) return null;

  return (
    <section
      aria-labelledby="product-faq-heading"
      className="border-t border-bourbon-deep/10 pt-10 sm:pt-12"
    >
      <p className="text-bourbon-gold text-[10px] sm:text-xs tracking-[0.3em] uppercase mb-2">
        Questions
      </p>
      <h2
        id="product-faq-heading"
        className="font-[family-name:var(--font-playfair)] text-2xl sm:text-3xl font-bold text-bourbon-deep"
      >
        About {productName}
      </h2>

      {/* Two columns from md up. A single column of short answers on a wide
          screen leaves a long ragged edge and makes the section look thinner
          than it is. */}
      <div className="mt-7 grid grid-cols-1 gap-x-12 gap-y-7 md:grid-cols-2">
        {items.map((item) => (
          <div key={item.question}>
            <h3 className="text-bourbon-deep text-base font-semibold leading-snug">
              {item.question}
            </h3>
            <p className="mt-2 text-bourbon-stone text-sm leading-relaxed">
              {item.answer}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
