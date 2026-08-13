"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PaymentProofUpload from "@/app/checkout/confirmation/PaymentProofUpload";
import { updateAccountDetails } from "./actions";

export interface AccountOrder {
  orderNumber: string;
  placedAt: string;
  status: string;
  statusLabel: string;
  statusBadge: string;
  settlementLabel: string | null;
  total: number;
  itemCount: number;
  items: { name: string; quantity: number; unitPrice: number }[];
  /** Only pending orders can still receive a receipt. */
  canUploadProof: boolean;
  hasProof: boolean;
}

export interface AccountDetails {
  email: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  region: string;
  postal: string;
  country: string;
}

const money = (n: number) => `$${n.toFixed(2)}`;

export default function AccountClient({
  orders,
  details,
}: {
  orders: AccountOrder[];
  details: AccountDetails;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(
    // Open the first order that still needs a receipt — that's the one the
    // customer most likely came here to deal with.
    orders.find((o) => o.canUploadProof && !o.hasProof)?.orderNumber ?? null,
  );

  async function signOut() {
    await fetch("/api/account/logout", { method: "POST" });
    router.refresh();
    router.push("/");
  }

  return (
    <main className="bg-bourbon-cream min-h-screen pt-24 sm:pt-32 pb-16 sm:pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-bourbon-gold text-xs tracking-[0.3em] uppercase mb-2">
              Your account
            </p>
            <h1 className="font-[family-name:var(--font-playfair)] text-3xl sm:text-4xl font-bold text-bourbon-deep">
              {details.fullName || "Welcome back"}
            </h1>
            <p className="text-bourbon-stone text-sm mt-2">{details.email}</p>
          </div>
          <button
            type="button"
            onClick={signOut}
            className="px-5 py-2.5 border border-bourbon-deep/20 text-bourbon-deep text-xs tracking-widest uppercase hover:border-bourbon-gold transition-colors cursor-pointer"
          >
            Sign out
          </button>
        </div>

        {/* Orders */}
        <section className="mb-10">
          <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-bourbon-deep mb-4">
            Your orders
          </h2>

          {orders.length === 0 ? (
            <div className="bg-white border border-bourbon-deep/10 p-8 text-center">
              <p className="text-bourbon-stone mb-6">
                No orders on this address yet.
              </p>
              <Link
                href="/shop"
                className="inline-flex px-8 py-4 bg-bourbon-gold text-bourbon-deep font-semibold tracking-widest uppercase text-xs hover:bg-bourbon-amber transition-colors"
              >
                Browse the shop
              </Link>
            </div>
          ) : (
            <ul className="space-y-4">
              {orders.map((o) => {
                const open = expanded === o.orderNumber;
                return (
                  <li
                    key={o.orderNumber}
                    className="bg-white border border-bourbon-deep/10"
                  >
                    <button
                      type="button"
                      onClick={() => setExpanded(open ? null : o.orderNumber)}
                      className="w-full text-left p-5 flex flex-wrap items-center justify-between gap-3 cursor-pointer"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-[family-name:var(--font-playfair)] text-lg font-bold text-bourbon-deep">
                            {o.orderNumber}
                          </span>
                          <span
                            className={`text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 ${o.statusBadge}`}
                          >
                            {o.statusLabel}
                          </span>
                          {o.canUploadProof && !o.hasProof && (
                            <span className="text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 bg-amber-100 text-amber-800">
                              Receipt needed
                            </span>
                          )}
                        </div>
                        <p className="text-bourbon-stone text-sm">
                          {new Date(o.placedAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}{" "}
                          · {o.itemCount} item{o.itemCount === 1 ? "" : "s"}
                          {o.settlementLabel ? ` · ${o.settlementLabel}` : ""}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-[family-name:var(--font-playfair)] text-xl font-bold text-bourbon-deep">
                          {money(o.total)}
                        </span>
                        <span className="text-bourbon-stone text-xs">
                          {open ? "▲" : "▼"}
                        </span>
                      </div>
                    </button>

                    {open && (
                      <div className="px-5 pb-5 border-t border-bourbon-deep/10 pt-4">
                        <ul className="space-y-2 mb-4">
                          {o.items.map((it, i) => (
                            <li
                              key={i}
                              className="flex justify-between gap-3 text-sm"
                            >
                              <span className="text-bourbon-deep">
                                {it.name}{" "}
                                <span className="text-bourbon-stone">
                                  × {it.quantity}
                                </span>
                              </span>
                              <span className="text-bourbon-stone whitespace-nowrap">
                                {money(it.unitPrice * it.quantity)}
                              </span>
                            </li>
                          ))}
                        </ul>

                        {o.canUploadProof ? (
                          <PaymentProofUpload
                            orderNumber={o.orderNumber}
                            alreadyUploaded={o.hasProof}
                          />
                        ) : (
                          <p className="text-bourbon-stone text-sm">
                            Nothing to do here — this order is {o.statusLabel.toLowerCase()}.
                          </p>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Saved details */}
        <section>
          <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-bourbon-deep mb-4">
            Delivery details
          </h2>
          <form
            action={(fd) =>
              startTransition(async () => {
                const res = await updateAccountDetails(fd);
                setSaved(res.ok ? "Saved." : res.error ?? "Could not save.");
              })
            }
            className="bg-white border border-bourbon-deep/10 p-5 sm:p-6 space-y-4"
          >
            <p className="text-bourbon-stone text-sm">
              We use these to prefill checkout. Changing them here doesn&apos;t
              alter orders you&apos;ve already placed.
            </p>

            <div className="grid sm:grid-cols-2 gap-4">
              <Field name="fullName" label="Full name" defaultValue={details.fullName} />
              <Field name="phone" label="Phone" defaultValue={details.phone} />
            </div>
            <Field name="addressLine1" label="Address" defaultValue={details.addressLine1} />
            <Field name="addressLine2" label="Address line 2" defaultValue={details.addressLine2} />
            <div className="grid sm:grid-cols-2 gap-4">
              <Field name="city" label="City" defaultValue={details.city} />
              <Field name="region" label="State / Region" defaultValue={details.region} />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field name="postal" label="Postal code" defaultValue={details.postal} />
              <Field name="country" label="Country" defaultValue={details.country} />
            </div>

            <div className="flex items-center gap-4 pt-2">
              <button
                type="submit"
                disabled={pending}
                className="px-6 py-3 bg-bourbon-deep text-bourbon-cream font-semibold tracking-widest uppercase text-xs hover:bg-bourbon-gold hover:text-bourbon-deep transition-colors cursor-pointer disabled:opacity-60"
              >
                {pending ? "Saving…" : "Save details"}
              </button>
              {saved && (
                <span className="text-emerald-700 text-sm">{saved}</span>
              )}
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}

function Field({
  name,
  label,
  defaultValue,
}: {
  name: string;
  label: string;
  defaultValue: string;
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="block text-bourbon-stone text-[10px] tracking-widest uppercase mb-1.5"
      >
        {label}
      </label>
      <input
        id={name}
        name={name}
        defaultValue={defaultValue}
        className="w-full bg-white border border-bourbon-deep/15 px-3 py-2.5 text-bourbon-deep text-sm focus:outline-none focus:border-bourbon-gold transition-colors"
      />
    </div>
  );
}
