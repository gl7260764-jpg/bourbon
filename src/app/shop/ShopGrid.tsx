"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/components/CartContext";
import { useToast } from "@/components/CartToast";

export interface ShopProductCard {
  id: string;
  slug: string;
  name: string;
  ageLabel: string;
  price: number;
  compareAtPrice: number | null;
  rating: number;
  reviews: number;
  image: string;
  badge: string | null;
  availabilityLabel: string | null;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[...Array(5)].map((_, i) => (
        <svg
          key={i}
          className={`w-3.5 h-3.5 ${i < Math.floor(rating) ? "text-bourbon-gold" : "text-bourbon-stone/30"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export default function ShopGrid({ products }: { products: ShopProductCard[] }) {
  const { addItem } = useCart();
  const { showToast } = useToast();

  const handleAddToCart = (product: ShopProductCard) => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      age: product.ageLabel,
    });
    showToast(product.name, product.image, product.price);
  };

  if (products.length === 0) {
    return (
      <div className="bg-white border border-bourbon-deep/5 p-16 text-center">
        <p className="text-bourbon-stone">
          No bottles match these filters. Try a different category.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-6">
      {products.map((product) => (
        <div
          key={product.id}
          className="group bg-white border border-bourbon-deep/5 overflow-hidden shadow-sm hover:shadow-xl hover:shadow-bourbon-gold/5 hover:-translate-y-1.5 transition-all duration-500 flex flex-col"
        >
          <Link
            href={`/products/${product.slug}`}
            className="relative h-48 sm:h-72 overflow-hidden bg-bourbon-deep/5 block"
          >
            <Image
              src={product.image}
              alt={product.name}
              fill
              sizes="(min-width: 1280px) 33vw, (min-width: 640px) 50vw, 50vw"
              className="object-cover group-hover:scale-110 transition-transform duration-700"
            />
            {product.badge && (
              <span className="absolute top-2 left-2 sm:top-3 sm:left-3 px-2 sm:px-3 py-0.5 sm:py-1 bg-bourbon-gold text-bourbon-deep text-[9px] sm:text-xs font-semibold tracking-wider uppercase">
                {product.badge}
              </span>
            )}
            {product.availabilityLabel && (
              <span className="absolute top-2 right-2 sm:top-3 sm:right-3 px-2 sm:px-3 py-0.5 sm:py-1 bg-bourbon-deep/90 text-bourbon-cream text-[9px] sm:text-[10px] font-semibold tracking-wider uppercase">
                {product.availabilityLabel}
              </span>
            )}
          </Link>

          <div className="p-3 sm:p-5 flex-1 flex flex-col">
            <p className="text-bourbon-gold text-[10px] sm:text-xs tracking-widest uppercase mb-1">
              {product.ageLabel} Aged
            </p>
            <Link href={`/products/${product.slug}`}>
              <h3 className="font-[family-name:var(--font-playfair)] text-sm sm:text-lg font-semibold text-bourbon-deep mb-2 group-hover:text-bourbon-gold transition-colors line-clamp-2">
                {product.name}
              </h3>
            </Link>
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <StarRating rating={product.rating} />
              <span className="text-bourbon-stone text-[10px] sm:text-xs">({product.reviews})</span>
            </div>
            <div className="mt-auto flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 sm:gap-1">
              <div>
                <span className="font-[family-name:var(--font-playfair)] text-base sm:text-xl font-bold text-bourbon-deep">
                  ${product.price.toFixed(2)}
                </span>
                {product.compareAtPrice && (
                  <span className="ml-2 text-bourbon-stone/60 text-xs sm:text-sm line-through">
                    ${product.compareAtPrice.toFixed(2)}
                  </span>
                )}
              </div>
              <button
                onClick={() => handleAddToCart(product)}
                className="text-[10px] sm:text-xs tracking-wider uppercase text-bourbon-gold font-semibold hover:text-bourbon-amber transition-colors cursor-pointer text-left sm:text-right"
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
