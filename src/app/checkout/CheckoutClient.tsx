"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/components/CartContext";
import { useRouter } from "next/navigation";
import {
  clearProfile,
  loadProfile,
  saveProfile,
  type SavedProfile,
} from "./profileStorage";
import {
  // AmexLogo, // unused while credit card payment is disabled
  ApplePayLogo,
  BitcoinLogo,
  ChimeLogo,
  DhlLogo,
  EthereumLogo,
  FedexLogo,
  // MastercardLogo, // unused while credit card payment is disabled
  UpsLogo,
  UspsLogo,
  // VisaLogo, // unused while credit card payment is disabled
} from "./Logos";

type ShippingId = "standard" | "express" | "overnight" | "white-glove";
type PaymentId = "card" | "paypal" | "chime" | "apple-pay" | "crypto";

interface ShippingOption {
  id: ShippingId;
  label: string;
  detail: string;
  carrier: React.ReactNode;
  cost: number;
  freeOver?: number;
}

const SHIPPING_OPTIONS: ShippingOption[] = [
  {
    id: "standard",
    label: "Standard Ground",
    detail: "5–7 business days",
    carrier: (
      <span className="inline-flex items-center gap-1.5">
        <UspsLogo />
        <span className="text-bourbon-stone text-xs">USPS</span>
      </span>
    ),
    cost: 9.0,
    freeOver: 200,
  },
  {
    id: "express",
    label: "Express",
    detail: "2–3 business days",
    carrier: (
      <span className="inline-flex items-center gap-1.5">
        <UpsLogo />
        <span className="text-bourbon-stone text-xs">UPS</span>
      </span>
    ),
    cost: 19.0,
  },
  {
    id: "overnight",
    label: "Overnight",
    detail: "Next business day",
    carrier: (
      <span className="inline-flex items-center gap-1.5">
        <FedexLogo />
        <span className="text-bourbon-stone text-xs">FedEx</span>
      </span>
    ),
    cost: 39.0,
  },
  {
    id: "white-glove",
    label: "White Glove International",
    detail: "Signature, climate-controlled · 7–14 days",
    carrier: (
      <span className="inline-flex items-center gap-1.5">
        <DhlLogo />
        <span className="text-bourbon-stone text-xs">DHL Express</span>
      </span>
    ),
    cost: 79.0,
  },
];

interface PaymentOption {
  id: PaymentId;
  label: string;
  detail: string;
  logos: React.ReactNode;
  discount?: number;
}

const CRYPTO_DISCOUNT_RATE = 0.1;

const PAYMENT_OPTIONS: PaymentOption[] = [
  // Credit/Debit card payment temporarily disabled.
  // {
  //   id: "card",
  //   label: "Credit or Debit Card",
  //   detail: "Visa, Mastercard, Amex",
  //   logos: (
  //     <div className="flex items-center gap-1.5">
  //       <VisaLogo />
  //       <MastercardLogo />
  //       <AmexLogo />
  //     </div>
  //   ),
  // },
  {
    id: "chime",
    label: "Chime",
    detail: "Pay from your Chime account via Pay Anyone.",
    logos: <ChimeLogo />,
  },
  {
    id: "apple-pay",
    label: "Apple Pay",
    detail: "Touch ID or Face ID confirmation.",
    logos: <ApplePayLogo />,
  },
  {
    id: "crypto",
    label: "Cryptocurrency",
    detail: "Pay with Bitcoin, Ethereum, USDC. Settles in ~10 minutes.",
    logos: (
      <div className="flex items-center gap-2">
        <BitcoinLogo />
        <EthereumLogo />
      </div>
    ),
    discount: CRYPTO_DISCOUNT_RATE,
  },
];

function FieldLabel({ children, htmlFor }: { children: React.ReactNode; htmlFor: string }) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-bourbon-stone text-[10px] tracking-widest uppercase mb-1.5"
    >
      {children}
    </label>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full bg-white border border-bourbon-deep/15 px-3 py-3 text-bourbon-deep text-sm focus:outline-none focus:border-bourbon-gold transition-colors ${props.className ?? ""}`}
    />
  );
}

function StepHeading({ n, title }: { n: number; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <span className="flex items-center justify-center w-7 h-7 rounded-full bg-bourbon-deep text-bourbon-cream text-xs font-bold">
        {n}
      </span>
      <h2 className="font-[family-name:var(--font-playfair)] text-xl sm:text-2xl font-bold text-bourbon-deep">
        {title}
      </h2>
    </div>
  );
}

export default function CheckoutClient() {
  const router = useRouter();
  const { items, subtotal, clearCart } = useCart();

  const [contact, setContact] = useState({ email: "", phone: "" });
  const [address, setAddress] = useState({
    fullName: "",
    line1: "",
    line2: "",
    city: "",
    region: "",
    postal: "",
    country: "US",
  });
  const [shippingId, setShippingId] = useState<ShippingId>("standard");
  const [paymentId, setPaymentId] = useState<PaymentId>("chime");
  const [placing, setPlacing] = useState(false);
  const [placeError, setPlaceError] = useState<string | null>(null);

  const [savedProfile, setSavedProfile] = useState<SavedProfile | null>(null);
  const [saveForLater, setSaveForLater] = useState(true);

  // On mount: prefill from saved profile (localStorage)
  useEffect(() => {
    const profile = loadProfile();
    if (profile) {
      setContact(profile.contact);
      setAddress(profile.address);
      setSavedProfile(profile);
    }
  }, []);

  const handleForgetSaved = () => {
    clearProfile();
    setSavedProfile(null);
    setContact({ email: "", phone: "" });
    setAddress({
      fullName: "",
      line1: "",
      line2: "",
      city: "",
      region: "",
      postal: "",
      country: "US",
    });
  };

  const shippingOption = SHIPPING_OPTIONS.find((s) => s.id === shippingId)!;
  const paymentOption = PAYMENT_OPTIONS.find((p) => p.id === paymentId)!;

  const shippingCost = useMemo(() => {
    if (shippingOption.freeOver && subtotal >= shippingOption.freeOver) return 0;
    return shippingOption.cost;
  }, [shippingOption, subtotal]);

  const discount = useMemo(() => {
    if (!paymentOption.discount) return 0;
    return subtotal * paymentOption.discount;
  }, [paymentOption, subtotal]);

  const taxRate = 0.085;
  const taxableBase = Math.max(0, subtotal - discount);
  const tax = taxableBase * taxRate;
  const total = taxableBase + shippingCost + tax;

  const canPlace =
    items.length > 0 &&
    contact.email.includes("@") &&
    address.fullName.trim() &&
    address.line1.trim() &&
    address.city.trim() &&
    address.postal.trim();

  const handlePlaceOrder = async () => {
    if (!canPlace || placing) return;
    setPlaceError(null);
    setPlacing(true);

    const orderNumber =
      "BO-" + Math.random().toString(36).slice(2, 10).toUpperCase();

    const snapshot = {
      orderNumber,
      placedAt: new Date().toISOString(),
      contact: { ...contact },
      address: { ...address },
      shipping: {
        id: shippingId,
        label: shippingOption.label,
        detail: shippingOption.detail,
        cost: shippingCost,
      },
      payment: {
        id: paymentId,
        label: paymentOption.label,
        discountRate: paymentOption.discount ?? 0,
      },
      items: items.map((it) => ({
        id: String(it.id),
        name: it.name,
        image: it.image,
        age: it.age ?? null,
        price: it.price,
        quantity: it.quantity,
      })),
      totals: {
        subtotal,
        discount,
        shippingCost,
        tax,
        total,
      },
    };

    // Always write to sessionStorage first as a fallback — the confirmation
    // page can still render even if the API call hiccups before navigation.
    try {
      sessionStorage.setItem(
        "bourbon:last-order",
        JSON.stringify(snapshot)
      );
    } catch {
      // sessionStorage may be unavailable (private mode); proceed anyway
    }

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(snapshot),
      });

      if (!res.ok) {
        let message = "Could not place your order. Please try again.";
        try {
          const data = (await res.json()) as { error?: string };
          if (data?.error) message = data.error;
        } catch {
          // ignore JSON parse errors
        }
        setPlaceError(message);
        setPlacing(false);
        return;
      }
    } catch {
      setPlaceError(
        "Network error while placing your order. Please check your connection and try again."
      );
      setPlacing(false);
      return;
    }

    // Persist contact + address for next time, or honor opt-out
    if (saveForLater) {
      saveProfile({ contact: { ...contact }, address: { ...address } });
    } else if (savedProfile) {
      clearProfile();
    }

    clearCart();
    router.push(`/checkout/confirmation?order=${encodeURIComponent(orderNumber)}`);
  };

  if (items.length === 0) {
    return (
      <main className="bg-bourbon-cream min-h-screen pt-24 sm:pt-32 pb-20 px-4">
        <div className="max-w-xl mx-auto text-center">
          <h1 className="font-[family-name:var(--font-playfair)] text-3xl sm:text-4xl font-bold text-bourbon-deep mb-3">
            Your cart is empty
          </h1>
          <p className="text-bourbon-stone mb-8">
            Add a bottle or two and we&apos;ll get you to checkout.
          </p>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 px-8 py-4 bg-bourbon-gold text-bourbon-deep font-semibold tracking-widest uppercase text-xs hover:bg-bourbon-amber transition-colors"
          >
            Browse the Shop
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-bourbon-cream min-h-screen pt-24 sm:pt-32 pb-16 sm:pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 sm:mb-12">
          <p className="text-bourbon-gold text-xs tracking-[0.3em] uppercase mb-2">
            Final Step
          </p>
          <h1 className="font-[family-name:var(--font-playfair)] text-4xl sm:text-5xl font-bold text-bourbon-deep">
            Checkout
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8 lg:gap-12">
          {/* Form */}
          <div className="space-y-6">
            {/* Contact */}
            <section className="bg-white border border-bourbon-deep/10 p-5 sm:p-7">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <StepHeading n={1} title="Contact information" />
                {savedProfile && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-bourbon-gold/15 text-bourbon-deep font-semibold tracking-widest uppercase text-[10px]">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414L8.414 15a1 1 0 01-1.414 0L3.293 11.293a1 1 0 011.414-1.414L7.707 12.879l7.586-7.586a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Prefilled
                    </span>
                    <button
                      type="button"
                      onClick={handleForgetSaved}
                      className="text-bourbon-stone hover:text-red-500 underline underline-offset-2 transition-colors cursor-pointer"
                    >
                      Forget saved info
                    </button>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <FieldLabel htmlFor="email">Email</FieldLabel>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    value={contact.email}
                    onChange={(e) => setContact({ ...contact, email: e.target.value })}
                  />
                </div>
                <div>
                  <FieldLabel htmlFor="phone">Phone</FieldLabel>
                  <Input
                    id="phone"
                    type="tel"
                    autoComplete="tel"
                    placeholder="(555) 555-0000"
                    value={contact.phone}
                    onChange={(e) => setContact({ ...contact, phone: e.target.value })}
                  />
                </div>
              </div>
            </section>

            {/* Address */}
            <section className="bg-white border border-bourbon-deep/10 p-5 sm:p-7">
              <StepHeading n={2} title="Delivery address" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <FieldLabel htmlFor="fullName">Full name (signature required, 21+)</FieldLabel>
                  <Input
                    id="fullName"
                    autoComplete="name"
                    value={address.fullName}
                    onChange={(e) => setAddress({ ...address, fullName: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <FieldLabel htmlFor="line1">Street address</FieldLabel>
                  <Input
                    id="line1"
                    autoComplete="address-line1"
                    placeholder="123 Bourbon St"
                    value={address.line1}
                    onChange={(e) => setAddress({ ...address, line1: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <FieldLabel htmlFor="line2">Apt, suite, etc. (optional)</FieldLabel>
                  <Input
                    id="line2"
                    autoComplete="address-line2"
                    value={address.line2}
                    onChange={(e) => setAddress({ ...address, line2: e.target.value })}
                  />
                </div>
                <div>
                  <FieldLabel htmlFor="city">City</FieldLabel>
                  <Input
                    id="city"
                    autoComplete="address-level2"
                    value={address.city}
                    onChange={(e) => setAddress({ ...address, city: e.target.value })}
                  />
                </div>
                <div>
                  <FieldLabel htmlFor="region">State / Region</FieldLabel>
                  <Input
                    id="region"
                    autoComplete="address-level1"
                    value={address.region}
                    onChange={(e) => setAddress({ ...address, region: e.target.value })}
                  />
                </div>
                <div>
                  <FieldLabel htmlFor="postal">ZIP / Postal</FieldLabel>
                  <Input
                    id="postal"
                    autoComplete="postal-code"
                    value={address.postal}
                    onChange={(e) => setAddress({ ...address, postal: e.target.value })}
                  />
                </div>
                <div>
                  <FieldLabel htmlFor="country">Country</FieldLabel>
                  <select
                    id="country"
                    value={address.country}
                    onChange={(e) => setAddress({ ...address, country: e.target.value })}
                    className="w-full bg-white border border-bourbon-deep/15 px-3 py-3 text-bourbon-deep text-sm focus:outline-none focus:border-bourbon-gold cursor-pointer"
                  >
                    <option value="US">United States</option>
                    <option value="CA">Canada</option>
                    <option value="UK">United Kingdom</option>
                    <option value="DE">Germany</option>
                    <option value="JP">Japan</option>
                    <option value="AU">Australia</option>
                  </select>
                </div>
              </div>

              {/* Save profile */}
              <label className="mt-5 pt-4 border-t border-bourbon-deep/10 flex items-start gap-3 cursor-pointer group">
                <span
                  className={`mt-0.5 flex items-center justify-center w-5 h-5 border-2 transition-all shrink-0 ${
                    saveForLater
                      ? "bg-bourbon-gold border-bourbon-gold"
                      : "bg-white border-bourbon-deep/30 group-hover:border-bourbon-deep/60"
                  }`}
                  aria-hidden
                >
                  {saveForLater && (
                    <svg className="w-3 h-3 text-bourbon-deep" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </span>
                <input
                  type="checkbox"
                  checked={saveForLater}
                  onChange={(e) => setSaveForLater(e.target.checked)}
                  className="sr-only"
                />
                <span className="flex-1">
                  <span className="block text-bourbon-deep text-sm font-semibold">
                    {savedProfile
                      ? "Keep this contact & address saved on this device"
                      : "Save this contact & address for faster checkout next time"}
                  </span>
                  <span className="block text-bourbon-stone text-xs mt-0.5">
                    Stored only in your browser. Uncheck and place an order to forget it.
                  </span>
                </span>
              </label>
            </section>

            {/* Shipping */}
            <section className="bg-white border border-bourbon-deep/10 p-5 sm:p-7">
              <StepHeading n={3} title="Shipping method" />
              <div className="space-y-3">
                {SHIPPING_OPTIONS.map((opt) => {
                  const selected = shippingId === opt.id;
                  const isFree = opt.freeOver !== undefined && subtotal >= opt.freeOver;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setShippingId(opt.id)}
                      className={`w-full text-left flex items-start gap-4 p-4 border-2 transition-all cursor-pointer ${
                        selected
                          ? "border-bourbon-gold bg-bourbon-gold/5"
                          : "border-bourbon-deep/10 hover:border-bourbon-deep/30"
                      }`}
                    >
                      <span
                        className={`mt-0.5 flex items-center justify-center w-5 h-5 rounded-full border-2 shrink-0 ${
                          selected ? "border-bourbon-gold" : "border-bourbon-deep/30"
                        }`}
                      >
                        {selected && <span className="w-2.5 h-2.5 rounded-full bg-bourbon-gold" />}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="text-bourbon-deep font-semibold text-sm">{opt.label}</span>
                          {opt.carrier}
                        </div>
                        <p className="text-bourbon-stone text-xs">{opt.detail}</p>
                        {opt.freeOver && !isFree && (
                          <p className="text-bourbon-stone/70 text-[11px] mt-1">
                            Free on orders over ${opt.freeOver}
                          </p>
                        )}
                      </div>
                      <span className="font-[family-name:var(--font-playfair)] text-bourbon-deep font-bold whitespace-nowrap">
                        {isFree ? (
                          <span className="text-bourbon-gold">Free</span>
                        ) : (
                          `$${opt.cost.toFixed(2)}`
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Payment */}
            <section className="bg-white border border-bourbon-deep/10 p-5 sm:p-7">
              <StepHeading n={4} title="Payment method" />
              <div className="space-y-3">
                {PAYMENT_OPTIONS.map((opt) => {
                  const selected = paymentId === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setPaymentId(opt.id)}
                      className={`w-full text-left flex items-start gap-4 p-4 border-2 transition-all cursor-pointer ${
                        selected
                          ? "border-bourbon-gold bg-bourbon-gold/5"
                          : "border-bourbon-deep/10 hover:border-bourbon-deep/30"
                      }`}
                    >
                      <span
                        className={`mt-0.5 flex items-center justify-center w-5 h-5 rounded-full border-2 shrink-0 ${
                          selected ? "border-bourbon-gold" : "border-bourbon-deep/30"
                        }`}
                      >
                        {selected && <span className="w-2.5 h-2.5 rounded-full bg-bourbon-gold" />}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1.5">
                          <span className="text-bourbon-deep font-semibold text-sm">{opt.label}</span>
                          {opt.discount && (
                            <span className="px-2 py-0.5 bg-bourbon-gold text-bourbon-deep text-[10px] font-bold tracking-widest uppercase">
                              Save {Math.round(opt.discount * 100)}%
                            </span>
                          )}
                        </div>
                        <p className="text-bourbon-stone text-xs">{opt.detail}</p>
                      </div>
                      <div className="shrink-0">{opt.logos}</div>
                    </button>
                  );
                })}
              </div>

              {/* Card details form temporarily disabled along with the card payment option. */}
              {/* <AnimatePresence initial={false}>
                {paymentId === "card" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <FieldLabel htmlFor="cc-number">Card number</FieldLabel>
                        <Input id="cc-number" autoComplete="cc-number" placeholder="1234 1234 1234 1234" inputMode="numeric" />
                      </div>
                      <div>
                        <FieldLabel htmlFor="cc-exp">Expiration</FieldLabel>
                        <Input id="cc-exp" autoComplete="cc-exp" placeholder="MM / YY" inputMode="numeric" />
                      </div>
                      <div>
                        <FieldLabel htmlFor="cc-cvc">CVC</FieldLabel>
                        <Input id="cc-cvc" autoComplete="cc-csc" placeholder="123" inputMode="numeric" />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence> */}

              <AnimatePresence initial={false}>
                {paymentId === "crypto" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-5 p-4 bg-bourbon-gold/10 border border-bourbon-gold/30 text-bourbon-deep text-sm">
                      <p className="font-semibold mb-1">10% off applied to your subtotal.</p>
                      <p className="text-bourbon-stone text-xs">
                        After placing the order you&apos;ll see a wallet address and QR for BTC, ETH, or USDC. Order confirms when the network confirms (~10 min for BTC).
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </section>
          </div>

          {/* Order summary */}
          <aside>
            <div className="lg:sticky lg:top-28 bg-white border border-bourbon-deep/10 p-5 sm:p-6">
              <h2 className="font-[family-name:var(--font-playfair)] text-xl font-bold text-bourbon-deep mb-4 pb-4 border-b border-bourbon-deep/10">
                Order summary
              </h2>

              {/* Items */}
              <ul className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {items.map((item) => (
                  <li key={item.id} className="flex gap-3">
                    <div className="relative w-14 h-14 shrink-0 bg-bourbon-deep/5 overflow-hidden">
                      <Image src={item.image} alt={item.name} fill className="object-cover" sizes="56px" />
                      <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-bourbon-deep text-bourbon-cream text-[10px] font-bold flex items-center justify-center">
                        {item.quantity}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-bourbon-deep text-sm font-semibold leading-tight truncate">{item.name}</p>
                      {item.age && (
                        <p className="text-bourbon-stone text-[11px] tracking-widest uppercase mt-0.5">{item.age}</p>
                      )}
                    </div>
                    <span className="text-bourbon-deep text-sm font-semibold whitespace-nowrap">
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                  </li>
                ))}
              </ul>

              {/* Totals */}
              <div className="mt-5 pt-5 border-t border-bourbon-deep/10 space-y-2 text-sm">
                <div className="flex items-center justify-between text-bourbon-stone">
                  <span>Subtotal</span>
                  <span className="text-bourbon-deep">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-bourbon-stone">
                  <span>Shipping</span>
                  <span className="text-bourbon-deep">
                    {shippingCost === 0 ? "Free" : `$${shippingCost.toFixed(2)}`}
                  </span>
                </div>
                {discount > 0 && (
                  <div className="flex items-center justify-between text-bourbon-gold font-semibold">
                    <span>Crypto discount ({Math.round(CRYPTO_DISCOUNT_RATE * 100)}%)</span>
                    <span>−${discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-bourbon-stone">
                  <span>Estimated tax</span>
                  <span className="text-bourbon-deep">${tax.toFixed(2)}</span>
                </div>
              </div>

              <div className="mt-5 pt-5 border-t border-bourbon-deep/10 flex items-baseline justify-between">
                <span className="text-bourbon-stone text-xs tracking-widest uppercase">Total</span>
                <span className="font-[family-name:var(--font-playfair)] text-3xl font-bold text-bourbon-deep">
                  ${total.toFixed(2)}
                </span>
              </div>

              {placeError && (
                <div
                  role="alert"
                  className="mt-5 px-3 py-2.5 border border-red-300 bg-red-50 text-red-700 text-xs"
                >
                  {placeError}
                </div>
              )}

              <button
                onClick={handlePlaceOrder}
                disabled={!canPlace || placing}
                className={`mt-5 w-full py-4 font-semibold tracking-widest uppercase text-xs transition-colors ${
                  canPlace && !placing
                    ? "bg-bourbon-gold text-bourbon-deep hover:bg-bourbon-amber cursor-pointer"
                    : "bg-bourbon-deep/10 text-bourbon-deep/40 cursor-not-allowed"
                }`}
              >
                {placing
                  ? "Placing order…"
                  : canPlace
                    ? `Place Order — $${total.toFixed(2)}`
                    : "Complete the form to continue"}
              </button>

              <Link
                href="/shop"
                className="mt-3 block text-center text-bourbon-stone hover:text-bourbon-deep text-xs tracking-widest uppercase transition-colors"
              >
                ← Continue shopping
              </Link>

              <p className="mt-5 text-bourbon-stone/70 text-[11px] leading-relaxed">
                By placing this order you confirm you are 21 years of age or older. An adult signature is required upon delivery.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
