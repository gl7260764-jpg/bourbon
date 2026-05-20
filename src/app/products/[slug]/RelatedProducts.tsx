import Link from "next/link";
import Image from "next/image";

export interface RelatedProductCard {
  id: string;
  slug: string;
  name: string;
  ageLabel: string;
  price: number;
  image: string;
}

export default function RelatedProducts({
  products,
  categoryName,
}: {
  products: RelatedProductCard[];
  categoryName: string;
}) {
  if (products.length === 0) return null;

  return (
    <section className="mt-24 pt-16 border-t border-bourbon-deep/10">
      <div className="text-center mb-10">
        <p className="text-bourbon-gold text-xs tracking-[0.3em] uppercase mb-2">
          More from this collection
        </p>
        <h2 className="font-[family-name:var(--font-playfair)] text-3xl md:text-4xl font-bold text-bourbon-deep">
          Other {categoryName} You May Like
        </h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {products.map((p) => (
          <Link
            key={p.id}
            href={`/products/${p.slug}`}
            className="group bg-white border border-bourbon-deep/5 overflow-hidden hover:shadow-lg hover:shadow-bourbon-gold/5 transition-all"
          >
            <div className="relative h-64 overflow-hidden bg-bourbon-deep/5">
              <Image
                src={p.image}
                alt={p.name}
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-700"
              />
            </div>
            <div className="p-5">
              <p className="text-bourbon-gold text-xs tracking-widest uppercase mb-1">
                {p.ageLabel} Aged
              </p>
              <h3 className="font-[family-name:var(--font-playfair)] text-lg font-semibold text-bourbon-deep group-hover:text-bourbon-gold transition-colors mb-2">
                {p.name}
              </h3>
              <p className="font-[family-name:var(--font-playfair)] text-xl font-bold text-bourbon-deep">
                ${p.price.toFixed(2)}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
