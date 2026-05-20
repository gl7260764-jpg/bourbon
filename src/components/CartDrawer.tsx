"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "./CartContext";

export default function CartDrawer() {
  const { items, isOpen, closeCart, totalItems, subtotal, updateQuantity, removeItem, clearCart } =
    useCart();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            className="fixed inset-0 z-[60] bg-bourbon-deep/40 backdrop-blur-sm"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 bottom-0 z-[70] w-full max-w-md bg-bourbon-cream border-l border-bourbon-deep/10 shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-5 border-b border-bourbon-deep/10">
              <div>
                <h2 className="font-[family-name:var(--font-playfair)] text-xl font-bold text-bourbon-deep">
                  Your Cart
                </h2>
                <p className="text-bourbon-stone text-xs mt-0.5">
                  {totalItems} {totalItems === 1 ? "item" : "items"}
                </p>
              </div>
              <button
                onClick={closeCart}
                aria-label="Close cart"
                className="text-bourbon-stone hover:text-bourbon-deep transition-colors cursor-pointer"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Cart items */}
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <svg className="w-16 h-16 text-bourbon-deep/15 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  <p className="text-bourbon-deep text-sm font-semibold">Your cart is empty</p>
                  <p className="text-bourbon-stone text-xs mt-1">
                    Add some fine bourbon to get started
                  </p>
                  <button
                    onClick={closeCart}
                    className="mt-6 px-6 py-2.5 bg-bourbon-gold text-bourbon-deep text-sm font-semibold tracking-wider uppercase hover:bg-bourbon-amber transition-colors cursor-pointer"
                  >
                    Continue Shopping
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <AnimatePresence initial={false}>
                    {items.map((item) => (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                        transition={{ duration: 0.25 }}
                        className="flex gap-3 sm:gap-4 bg-white p-3 border border-bourbon-deep/10"
                      >
                        {/* Image */}
                        <div className="relative w-16 h-16 sm:w-20 sm:h-20 shrink-0 overflow-hidden bg-bourbon-deep/5">
                          <Image
                            src={item.image}
                            alt={item.name}
                            fill
                            className="object-cover"
                          />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              {item.age && (
                                <p className="text-bourbon-gold text-[10px] tracking-widest uppercase">
                                  {item.age}
                                </p>
                              )}
                              <h3 className="text-bourbon-deep text-sm font-semibold leading-tight truncate">
                                {item.name}
                              </h3>
                            </div>
                            <button
                              onClick={() => removeItem(item.id)}
                              aria-label={`Remove ${item.name}`}
                              className="text-bourbon-stone/50 hover:text-red-500 transition-colors shrink-0 cursor-pointer"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>

                          <div className="flex items-end justify-between mt-2">
                            {/* Quantity controls */}
                            <div className="flex items-center border border-bourbon-deep/15">
                              <button
                                onClick={() =>
                                  updateQuantity(item.id, item.quantity - 1)
                                }
                                aria-label="Decrease quantity"
                                className="w-9 h-9 sm:w-8 sm:h-8 flex items-center justify-center text-bourbon-deep hover:bg-bourbon-deep/5 transition-colors cursor-pointer text-base sm:text-sm"
                              >
                                −
                              </button>
                              <span className="w-9 h-9 sm:w-8 sm:h-8 flex items-center justify-center text-bourbon-deep text-xs font-semibold border-x border-bourbon-deep/15">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() =>
                                  updateQuantity(item.id, item.quantity + 1)
                                }
                                aria-label="Increase quantity"
                                className="w-9 h-9 sm:w-8 sm:h-8 flex items-center justify-center text-bourbon-deep hover:bg-bourbon-deep/5 transition-colors cursor-pointer text-base sm:text-sm"
                              >
                                +
                              </button>
                            </div>

                            {/* Price */}
                            <span className="font-[family-name:var(--font-playfair)] text-bourbon-deep text-sm font-bold">
                              ${(item.price * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {/* Clear cart */}
                  <button
                    onClick={clearCart}
                    className="text-bourbon-stone/60 hover:text-red-500 text-xs tracking-wider uppercase transition-colors cursor-pointer"
                  >
                    Clear Cart
                  </button>
                </div>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-bourbon-deep/10 bg-white px-4 sm:px-6 py-4 sm:py-5 space-y-3 sm:space-y-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
                {/* Subtotal */}
                <div className="flex items-center justify-between">
                  <span className="text-bourbon-stone text-sm">Subtotal</span>
                  <span className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-bourbon-deep">
                    ${subtotal.toFixed(2)}
                  </span>
                </div>
                <p className="text-bourbon-stone/70 text-xs">
                  Shipping & taxes calculated at checkout
                </p>

                {/* Checkout button */}
                <Link
                  href="/checkout"
                  onClick={closeCart}
                  className="block w-full py-4 bg-bourbon-gold text-bourbon-deep font-semibold tracking-wider uppercase text-sm hover:bg-bourbon-amber transition-colors cursor-pointer text-center"
                >
                  Proceed to Checkout
                </Link>

                <button
                  onClick={closeCart}
                  className="w-full py-3 border border-bourbon-deep/20 text-bourbon-deep font-semibold tracking-wider uppercase text-xs hover:bg-bourbon-deep hover:text-bourbon-cream transition-all cursor-pointer"
                >
                  Continue Shopping
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
