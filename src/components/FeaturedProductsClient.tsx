"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "./CartContext";
import { useToast } from "./CartToast";

export interface FeaturedProductCard {
  id: string;
  slug: string;
  name: string;
  ageLabel: string;
  price: number;
  rating: number;
  reviews: number;
  image: string;
  badge: string | null;
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

export default function FeaturedProductsClient({
  products,
}: {
  products: FeaturedProductCard[];
}) {
  const { addItem } = useCart();
  const { showToast } = useToast();

  const handleAddToCart = (product: FeaturedProductCard) => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      age: product.ageLabel,
    });
    showToast(product.name, product.image, product.price);
  };

  return (
    <section id="products" className="py-20 bg-bourbon-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <span className="text-bourbon-gold text-xs tracking-[0.3em] uppercase">
            Our Collection
          </span>
          <h2 className="font-[family-name:var(--font-playfair)] text-4xl md:text-5xl font-bold text-bourbon-deep mt-3 mb-4">
            Featured Bourbons
          </h2>
          <div className="w-20 h-0.5 bg-bourbon-gold mx-auto mb-4" />
          <p className="text-bourbon-stone max-w-2xl mx-auto">
            Each bottle tells a story of patience, tradition, and the art of distillation perfected over generations.
          </p>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {products.map((product, i) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.5 }}
              whileHover={{ y: -8 }}
              className="group bg-white border border-bourbon-deep/5 overflow-hidden shadow-sm hover:shadow-xl hover:shadow-bourbon-gold/5 transition-all duration-500"
            >
              <Link
                href={`/products/${product.slug}`}
                className="relative h-44 sm:h-64 overflow-hidden bg-bourbon-deep/5 block"
              >
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-700"
                />
                {product.badge && (
                  <span className="absolute top-3 left-3 px-3 py-1 bg-bourbon-gold text-bourbon-deep text-xs font-semibold tracking-wider uppercase">
                    {product.badge}
                  </span>
                )}
                <div className="absolute inset-0 bg-bourbon-deep/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={(e) => {
                      e.preventDefault();
                      handleAddToCart(product);
                    }}
                    className="w-10 h-10 bg-bourbon-cream flex items-center justify-center hover:bg-bourbon-gold transition-colors"
                  >
                    <svg className="w-5 h-5 text-bourbon-deep" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-10 h-10 bg-bourbon-cream flex items-center justify-center hover:bg-bourbon-gold transition-colors"
                  >
                    <svg className="w-5 h-5 text-bourbon-deep" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-10 h-10 bg-bourbon-cream flex items-center justify-center hover:bg-bourbon-gold transition-colors"
                  >
                    <svg className="w-5 h-5 text-bourbon-deep" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </motion.button>
                </div>
              </Link>

              <div className="p-3 sm:p-5">
                <p className="text-bourbon-gold text-[10px] sm:text-xs tracking-widest uppercase mb-1">
                  {product.ageLabel} Aged
                </p>
                <Link href={`/products/${product.slug}`}>
                  <h3 className="font-[family-name:var(--font-playfair)] text-base sm:text-lg font-semibold text-bourbon-deep mb-2 group-hover:text-bourbon-gold transition-colors">
                    {product.name}
                  </h3>
                </Link>
                <div className="flex items-center gap-2 mb-3">
                  <StarRating rating={product.rating} />
                  <span className="text-bourbon-stone text-xs">({product.reviews})</span>
                </div>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="font-[family-name:var(--font-playfair)] text-lg sm:text-xl font-bold text-bourbon-deep">
                    ${product.price.toFixed(2)}
                  </span>
                  <button
                    onClick={() => handleAddToCart(product)}
                    className="text-[10px] sm:text-xs tracking-wider uppercase text-bourbon-gold font-semibold hover:text-bourbon-amber transition-colors cursor-pointer"
                  >
                    Add to Cart
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <button className="px-10 py-4 border-2 border-bourbon-deep text-bourbon-deep font-semibold tracking-wider uppercase text-sm hover:bg-bourbon-deep hover:text-bourbon-cream transition-all duration-300">
            View All Collection
          </button>
        </motion.div>
      </div>
    </section>
  );
}
