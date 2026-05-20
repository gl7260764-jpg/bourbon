"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import {
  AmexLogo,
  ApplePayLogo,
  BitcoinLogo,
  ChimeLogo,
  DhlLogo,
  EthereumLogo,
  FedexLogo,
  MastercardLogo,
  PaypalLogo,
  UpsLogo,
  UspsLogo,
  VisaLogo,
} from "../Logos";

type ShippingId = "standard" | "express" | "overnight" | "white-glove";
type PaymentId = "card" | "paypal" | "chime" | "apple-pay" | "crypto";

interface OrderSnapshot {
  orderNumber: string;
  placedAt: string;
  contact: { email: string; phone: string };
  address: {
    fullName: string;
    line1: string;
    line2: string;
    city: string;
    region: string;
    postal: string;
    country: string;
  };
  shipping: {
    id: ShippingId;
    label: string;
    detail: string;
    cost: number;
  };
  payment: {
    id: PaymentId;
    label: string;
    discountRate: number;
  };
  items: {
    id: string;
    name: string;
    image: string;
    age: string | null;
    price: number;
    quantity: number;
  }[];
  totals: {
    subtotal: number;
    discount: number;
    shippingCost: number;
    tax: number;
    total: number;
  };
}

function shippingCarrier(id: ShippingId) {
  switch (id) {
    case "standard":
      return { logo: <UspsLogo />, name: "USPS" };
    case "express":
      return { logo: <UpsLogo />, name: "UPS" };
    case "overnight":
      return { logo: <FedexLogo />, name: "FedEx" };
    case "white-glove":
      return { logo: <DhlLogo />, name: "DHL Express" };
  }
}

function paymentLogos(id: PaymentId) {
  switch (id) {
    case "card":
      return (
        <div className="flex items-center gap-1.5">
          <VisaLogo />
          <MastercardLogo />
          <AmexLogo />
        </div>
      );
    case "paypal":
      return <PaypalLogo />;
    case "chime":
      return <ChimeLogo />;
    case "apple-pay":
      return <ApplePayLogo />;
    case "crypto":
      return (
        <div className="flex items-center gap-2">
          <BitcoinLogo />
          <EthereumLogo />
        </div>
      );
  }
}

function estimatedDelivery(shippingId: ShippingId, placedAt: string) {
  const days: Record<ShippingId, [number, number]> = {
    standard: [5, 7],
    express: [2, 3],
    overnight: [1, 1],
    "white-glove": [7, 14],
  };
  const [min, max] = days[shippingId];
  const start = new Date(placedAt);
  const fmt = (d: Date) =>
    d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  const minDate = new Date(start);
  minDate.setDate(minDate.getDate() + min);
  const maxDate = new Date(start);
  maxDate.setDate(maxDate.getDate() + max);
  if (min === max) return fmt(minDate);
  return `${fmt(minDate)} – ${fmt(maxDate)}`;
}

function readSessionSnapshot(): OrderSnapshot | null {
  try {
    const raw = sessionStorage.getItem("bourbon:last-order");
    return raw ? (JSON.parse(raw) as OrderSnapshot) : null;
  } catch {
    return null;
  }
}

export default function ConfirmationClient() {
  const searchParams = useSearchParams();
  const orderParam = searchParams.get("order");
  const [order, setOrder] = useState<OrderSnapshot | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const sessionSnapshot = readSessionSnapshot();
    const orderNumber = orderParam ?? sessionSnapshot?.orderNumber ?? null;

    async function load() {
      if (orderNumber) {
        try {
          const res = await fetch(
            `/api/orders/${encodeURIComponent(orderNumber)}`,
            { cache: "no-store" }
          );
          if (res.ok) {
            const data = (await res.json()) as OrderSnapshot;
            if (!cancelled) {
              setOrder(data);
              setLoaded(true);
              return;
            }
          }
        } catch {
          // network error → fall through to session snapshot
        }
      }

      // Fallback: in-memory snapshot from the just-completed checkout.
      if (!cancelled) {
        setOrder(sessionSnapshot);
        setLoaded(true);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [orderParam]);

  if (!loaded) return null;

  if (!order) {
    return (
      <main className="bg-bourbon-cream min-h-screen pt-24 sm:pt-32 pb-20 px-4">
        <div className="max-w-xl mx-auto text-center bg-white border border-bourbon-deep/10 p-8 sm:p-12">
          <h1 className="font-[family-name:var(--font-playfair)] text-3xl sm:text-4xl font-bold text-bourbon-deep mb-3">
            No recent order
          </h1>
          <p className="text-bourbon-stone mb-8">
            We couldn&apos;t find a recent order in this browser. If you just placed one, your confirmation email is the source of truth.
          </p>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 px-8 py-4 bg-bourbon-gold text-bourbon-deep font-semibold tracking-widest uppercase text-xs hover:bg-bourbon-amber transition-colors"
          >
            Back to the Shop
          </Link>
        </div>
      </main>
    );
  }

  const carrier = shippingCarrier(order.shipping.id);
  const placedAtDate = new Date(order.placedAt);
  const delivery = estimatedDelivery(order.shipping.id, order.placedAt);

  return (
    <main className="bg-bourbon-cream min-h-screen pt-24 sm:pt-32 pb-16 sm:pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="text-center mb-10 sm:mb-12">
          <div className="mx-auto mb-5 flex items-center justify-center w-16 h-16 rounded-full bg-bourbon-gold">
            <svg className="w-8 h-8 text-bourbon-deep" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-bourbon-gold text-xs tracking-[0.3em] uppercase mb-3">
            Order Confirmed
          </p>
          <h1 className="font-[family-name:var(--font-playfair)] text-4xl sm:text-5xl font-bold text-bourbon-deep mb-3">
            Thank you, {order.address.fullName.split(" ")[0] || "friend"}
          </h1>
          <p className="text-bourbon-stone max-w-xl mx-auto">
            We&apos;ve emailed your receipt to{" "}
            <span className="text-bourbon-deep font-semibold">{order.contact.email}</span>. We&apos;ll text shipping updates to {order.contact.phone || "your phone"}.
          </p>
        </div>

        {/* Order header card */}
        <div className="bg-bourbon-deep text-bourbon-cream p-5 sm:p-6 mb-6 grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div>
            <p className="text-bourbon-gold text-[10px] tracking-widest uppercase mb-1">Order #</p>
            <p className="font-[family-name:var(--font-playfair)] text-lg font-bold">{order.orderNumber}</p>
          </div>
          <div>
            <p className="text-bourbon-gold text-[10px] tracking-widest uppercase mb-1">Placed</p>
            <p className="text-sm font-semibold">
              {placedAtDate.toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
            <p className="text-xs text-bourbon-cream/60">
              {placedAtDate.toLocaleTimeString(undefined, {
                hour: "numeric",
                minute: "2-digit",
              })}
            </p>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <p className="text-bourbon-gold text-[10px] tracking-widest uppercase mb-1">
              Estimated arrival
            </p>
            <p className="text-sm font-semibold">{delivery}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
          {/* Left column */}
          <div className="space-y-6">
            {/* Items */}
            <section className="bg-white border border-bourbon-deep/10 p-5 sm:p-7">
              <h2 className="font-[family-name:var(--font-playfair)] text-xl sm:text-2xl font-bold text-bourbon-deep mb-5">
                What you ordered
              </h2>
              <ul className="divide-y divide-bourbon-deep/10">
                {order.items.map((it) => (
                  <li key={it.id} className="py-4 first:pt-0 last:pb-0 flex gap-4">
                    <div className="relative w-20 h-20 shrink-0 bg-bourbon-deep/5 overflow-hidden">
                      <Image src={it.image} alt={it.name} fill className="object-cover" sizes="80px" />
                    </div>
                    <div className="flex-1 min-w-0">
                      {it.age && (
                        <p className="text-bourbon-gold text-[10px] tracking-widest uppercase mb-1">{it.age} Aged</p>
                      )}
                      <h3 className="text-bourbon-deep font-semibold leading-tight">{it.name}</h3>
                      <p className="text-bourbon-stone text-sm mt-1">
                        Qty {it.quantity} × ${it.price.toFixed(2)}
                      </p>
                    </div>
                    <span className="font-[family-name:var(--font-playfair)] text-bourbon-deep text-lg font-bold whitespace-nowrap">
                      ${(it.price * it.quantity).toFixed(2)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Address + Shipping + Payment */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <section className="bg-white border border-bourbon-deep/10 p-5">
                <h3 className="text-bourbon-stone text-[10px] tracking-widest uppercase mb-3">
                  Shipping to
                </h3>
                <p className="text-bourbon-deep font-semibold">{order.address.fullName}</p>
                <p className="text-bourbon-stone text-sm leading-relaxed mt-2">
                  {order.address.line1}
                  {order.address.line2 ? <><br />{order.address.line2}</> : null}
                  <br />
                  {order.address.city}, {order.address.region} {order.address.postal}
                  <br />
                  {order.address.country}
                </p>
                <p className="text-bourbon-stone text-sm mt-3">
                  {order.contact.phone}
                </p>
              </section>

              <section className="bg-white border border-bourbon-deep/10 p-5">
                <h3 className="text-bourbon-stone text-[10px] tracking-widest uppercase mb-3">
                  Shipping method
                </h3>
                <div className="flex items-center gap-2 mb-2">{carrier.logo}<span className="text-bourbon-stone text-xs">{carrier.name}</span></div>
                <p className="text-bourbon-deep font-semibold">{order.shipping.label}</p>
                <p className="text-bourbon-stone text-sm mt-1">{order.shipping.detail}</p>
                <p className="text-bourbon-stone text-sm mt-3">
                  Estimated arrival: <span className="text-bourbon-deep font-semibold">{delivery}</span>
                </p>
              </section>

              <section className="bg-white border border-bourbon-deep/10 p-5 sm:col-span-2">
                <h3 className="text-bourbon-stone text-[10px] tracking-widest uppercase mb-3">
                  Payment
                </h3>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-bourbon-deep font-semibold">{order.payment.label}</p>
                      {order.payment.discountRate > 0 && (
                        <span className="px-2 py-0.5 bg-bourbon-gold text-bourbon-deep text-[10px] font-bold tracking-widest uppercase">
                          {Math.round(order.payment.discountRate * 100)}% Off
                        </span>
                      )}
                    </div>
                    {order.payment.id === "crypto" && (
                      <p className="text-bourbon-stone text-sm">
                        Settles when the network confirms (~10 min for BTC).
                      </p>
                    )}
                    {order.payment.id === "chime" && (
                      <p className="text-bourbon-stone text-sm">
                        Open Chime → Pay Anyone → send to{" "}
                        <span className="text-bourbon-deep font-semibold">$BourbonOak</span>{" "}
                        with your order # in the memo.
                      </p>
                    )}
                  </div>
                  <div>{paymentLogos(order.payment.id)}</div>
                </div>
              </section>
            </div>
          </div>

          {/* Totals card */}
          <aside>
            <div className="lg:sticky lg:top-28 bg-white border border-bourbon-deep/10 p-5 sm:p-6">
              <h2 className="font-[family-name:var(--font-playfair)] text-xl font-bold text-bourbon-deep mb-4 pb-4 border-b border-bourbon-deep/10">
                Receipt
              </h2>

              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between text-bourbon-stone">
                  <span>Subtotal</span>
                  <span className="text-bourbon-deep">${order.totals.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-bourbon-stone">
                  <span>Shipping</span>
                  <span className="text-bourbon-deep">
                    {order.totals.shippingCost === 0 ? "Free" : `$${order.totals.shippingCost.toFixed(2)}`}
                  </span>
                </div>
                {order.totals.discount > 0 && (
                  <div className="flex items-center justify-between text-bourbon-gold font-semibold">
                    <span>Discount ({Math.round(order.payment.discountRate * 100)}%)</span>
                    <span>−${order.totals.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-bourbon-stone">
                  <span>Tax</span>
                  <span className="text-bourbon-deep">${order.totals.tax.toFixed(2)}</span>
                </div>
              </div>

              <div className="mt-5 pt-5 border-t border-bourbon-deep/10 flex items-baseline justify-between">
                <span className="text-bourbon-stone text-xs tracking-widest uppercase">Total paid</span>
                <span className="font-[family-name:var(--font-playfair)] text-3xl font-bold text-bourbon-deep">
                  ${order.totals.total.toFixed(2)}
                </span>
              </div>

              <button
                onClick={() => window.print()}
                className="mt-5 w-full py-3 border border-bourbon-deep text-bourbon-deep font-semibold tracking-widest uppercase text-xs hover:bg-bourbon-deep hover:text-bourbon-cream transition-all cursor-pointer"
              >
                Print Receipt
              </button>

              <Link
                href="/shop"
                className="mt-3 block w-full py-3 bg-bourbon-gold text-bourbon-deep font-semibold tracking-widest uppercase text-xs hover:bg-bourbon-amber transition-colors text-center"
              >
                Continue Shopping
              </Link>

              <p className="mt-5 text-bourbon-stone/70 text-[11px] leading-relaxed">
                Adult signature (21+) required upon delivery. Questions? Reply to your confirmation email.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
