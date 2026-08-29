"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import OrderChat from "@/components/OrderChat";
import EnablePushDialog from "@/components/EnablePushDialog";
import PushSettingRow from "@/components/PushSettingRow";
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
  /** Payment details the admin issued for this order, or null if not yet sent. */
  paymentDetails: string | null;
  paymentDetailsIssuedAt: string | null;
  /** Pending AND details issued — see page.tsx for why both are required. */
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

const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

/* Status is carried by a drawn dot rather than another pill, so a scan down the
   left edge reads the state of every order before any text is parsed. */
function statusTone(o: AccountOrder): string {
  if (o.canUploadProof && !o.hasProof) return "bg-amber-500";
  if (o.status === "PENDING") return "bg-sky-500";
  if (o.status === "CANCELLED" || o.status === "REFUNDED") return "bg-bourbon-stone/40";
  return "bg-emerald-500";
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      className={`w-4 h-4 shrink-0 text-bourbon-stone transition-transform duration-200 ${open ? "-rotate-180" : ""}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M6 9l6 6 6-6" />
    </svg>
  );
}

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
  const [chatFor, setChatFor] = useState<string | null>(null);
  /* Drives the opt-in prompt: an order that is still pending with no details
     issued is exactly the case a push notification is useful for. */
  const waitingOnDetails = orders.filter(
    (o) => o.status === "PENDING" && !o.paymentDetailsIssuedAt,
  ).length;
  const needsReceipt = orders.filter((o) => o.canUploadProof && !o.hasProof);

  const [expanded, setExpanded] = useState<string | null>(
    // Open the first order that still needs a receipt — that's the one the
    // customer most likely came here to deal with.
    orders.find((o) => o.canUploadProof && !o.hasProof)?.orderNumber ?? null,
  );
  const orderRefs = useRef<Record<string, HTMLLIElement | null>>({});

  const lifetime = orders.reduce((n, o) => n + o.total, 0);
  const since = orders.length
    ? new Date(
        Math.min(...orders.map((o) => new Date(o.placedAt).getTime())),
      ).toLocaleDateString(undefined, { month: "long", year: "numeric" })
    : null;

  /* One line, and only the line that is true right now. A buyer opening this
     page has exactly one question — is anything waiting on me? */
  const attention =
    needsReceipt.length > 0
      ? {
          text:
            needsReceipt.length === 1
              ? "One order is waiting for your receipt."
              : `${needsReceipt.length} orders are waiting for your receipt.`,
          jumpTo: needsReceipt[0].orderNumber,
        }
      : waitingOnDetails > 0
        ? {
            text:
              waitingOnDetails === 1
                ? "We're preparing payment details for one order."
                : `We're preparing payment details for ${waitingOnDetails} orders.`,
            jumpTo: null,
          }
        : null;

  function jumpTo(orderNumber: string) {
    setExpanded(orderNumber);
    orderRefs.current[orderNumber]?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }

  async function signOut() {
    await fetch("/api/account/logout", { method: "POST" });
    router.refresh();
    router.push("/");
  }

  return (
    <main className="bg-bourbon-cream min-h-screen pb-16 sm:pb-20">
      <EnablePushDialog waitingCount={waitingOnDetails} />

      {/* Cellar band. Full-bleed dark ground that runs under the fixed header,
          so the page opens on the brand rather than on a form. */}
      <header className="bg-bourbon-deep text-bourbon-cream pt-28 sm:pt-36">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 sm:pb-10">
          <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
            <div className="min-w-0">
              <h1 className="font-[family-name:var(--font-playfair)] text-3xl sm:text-[2.75rem] font-bold leading-[1.1] text-bourbon-cream">
                {details.fullName || "Welcome back"}
              </h1>
              <p className="text-bourbon-cream/65 text-sm mt-2 break-words">
                {details.email}
              </p>
            </div>
            <button
              type="button"
              onClick={signOut}
              className="shrink-0 px-5 py-2.5 border border-bourbon-cream/25 text-bourbon-cream text-xs tracking-widest uppercase hover:border-bourbon-gold hover:text-bourbon-gold transition-colors cursor-pointer"
            >
              Sign out
            </button>
          </div>

          {orders.length > 0 && (
            <>
              {/* Typographic meta rather than metric tiles — the numbers are
                  context, not the point of the page. */}
              <div className="mt-7 pt-5 border-t border-bourbon-cream/15 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-bourbon-cream/65">
                <span>
                  <span className="text-bourbon-cream font-semibold tabular-nums">
                    {orders.length}
                  </span>{" "}
                  {orders.length === 1 ? "order" : "orders"}
                </span>
                <span aria-hidden="true" className="text-bourbon-cream/25">·</span>
                <span>
                  <span className="text-bourbon-cream font-semibold tabular-nums">
                    {money(lifetime)}
                  </span>{" "}
                  with us
                </span>
                {since && (
                  <>
                    <span aria-hidden="true" className="text-bourbon-cream/25">·</span>
                    <span>Since {since}</span>
                  </>
                )}
              </div>

              {attention && (
                <div className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2">
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-bourbon-gold shrink-0"
                    aria-hidden="true"
                  />
                  <p className="text-bourbon-gold text-sm font-medium">
                    {attention.text}
                  </p>
                  {attention.jumpTo && (
                    <button
                      type="button"
                      onClick={() => jumpTo(attention.jumpTo!)}
                      className="text-bourbon-cream text-xs tracking-widest uppercase underline underline-offset-4 decoration-bourbon-gold/50 hover:decoration-bourbon-gold transition-colors cursor-pointer"
                    >
                      Take me there
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10">
        <PushSettingRow />

        <section className="mb-12">
          <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-bourbon-deep mb-4">
            Your orders
          </h2>

          {orders.length === 0 ? (
            /* Teaches what this page becomes, rather than reporting emptiness. */
            <div className="bg-white border border-bourbon-deep/10 px-6 py-14 text-center">
              <p className="font-[family-name:var(--font-playfair)] text-xl text-bourbon-deep mb-2">
                Nothing here yet
              </p>
              <p className="text-bourbon-stone text-sm max-w-sm mx-auto mb-7">
                Once you order, this is where you&apos;ll find your payment
                details, upload a receipt, and talk to us about any bottle on
                its way.
              </p>
              <Link
                href="/shop"
                className="inline-flex px-8 py-3.5 bg-bourbon-gold text-bourbon-deep font-semibold tracking-widest uppercase text-xs hover:bg-bourbon-amber transition-colors"
              >
                Browse the shop
              </Link>
            </div>
          ) : (
            <ul className="space-y-3">
              {orders.map((o) => {
                const open = expanded === o.orderNumber;
                return (
                  <li
                    key={o.orderNumber}
                    ref={(el) => {
                      orderRefs.current[o.orderNumber] = el;
                    }}
                    className={`bg-white border transition-colors ${
                      open
                        ? "border-bourbon-gold/50"
                        : "border-bourbon-deep/10 hover:border-bourbon-deep/25"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setExpanded(open ? null : o.orderNumber)}
                      aria-expanded={open}
                      className="w-full text-left p-5 cursor-pointer"
                    >
                      {/* Two tiers so the identity line and the amount always
                          share a row: badges wrapping under a vertically
                          centred price left the two visually unrelated on a
                          narrow screen. */}
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${statusTone(o)}`}
                          aria-hidden="true"
                        />
                        <span className="font-[family-name:var(--font-playfair)] text-lg font-bold text-bourbon-deep truncate">
                          {o.orderNumber}
                        </span>
                        <span className="ml-auto font-[family-name:var(--font-playfair)] text-xl font-bold text-bourbon-deep tabular-nums whitespace-nowrap">
                          {money(o.total)}
                        </span>
                        <Chevron open={open} />
                      </div>

                      <div className="pl-5 mt-2">
                        <div className="flex items-center gap-2 flex-wrap">
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
                          {o.status === "PENDING" && !o.paymentDetails && (
                            <span className="text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 bg-sky-100 text-sky-800">
                              Details coming
                            </span>
                          )}
                        </div>
                        <p className="text-bourbon-stone text-sm mt-1.5">
                          {shortDate(o.placedAt)} · {o.itemCount} item
                          {o.itemCount === 1 ? "" : "s"}
                          {o.settlementLabel ? ` · ${o.settlementLabel}` : ""}
                        </p>
                      </div>
                    </button>

                    {open && (
                      <div className="px-5 pb-5 border-t border-bourbon-deep/10 pt-5">
                        <ul className="mb-5 divide-y divide-bourbon-deep/[0.06]">
                          {o.items.map((it, i) => (
                            <li
                              key={i}
                              className="flex justify-between gap-4 text-sm py-2 first:pt-0 last:pb-0"
                            >
                              <span className="text-bourbon-deep">
                                {it.name}
                                <span className="text-bourbon-stone">
                                  {" "}
                                  × {it.quantity}
                                </span>
                              </span>
                              <span className="text-bourbon-stone tabular-nums whitespace-nowrap">
                                {money(it.unitPrice * it.quantity)}
                              </span>
                            </li>
                          ))}
                        </ul>

                        {/* Payment details, once issued. Rendered here rather
                            than emailed: account and wallet details sent by
                            email are what payment-redirection fraud imitates. */}
                        {o.paymentDetails && (
                          <div className="mb-5 border border-bourbon-gold/40 bg-bourbon-gold/[0.07] p-4 sm:p-5">
                            <div className="flex items-baseline justify-between gap-2 flex-wrap mb-2.5">
                              <p className="text-bourbon-deep text-sm font-semibold">
                                Where to send payment
                              </p>
                              {o.paymentDetailsIssuedAt && (
                                <span className="text-bourbon-stone text-[11px] tabular-nums">
                                  Sent{" "}
                                  {new Date(
                                    o.paymentDetailsIssuedAt,
                                  ).toLocaleDateString(undefined, {
                                    month: "short",
                                    day: "numeric",
                                  })}
                                </span>
                              )}
                            </div>
                            <pre className="whitespace-pre-wrap font-sans text-bourbon-deep text-sm leading-relaxed">
                              {o.paymentDetails}
                            </pre>
                            <p className="text-bourbon-stone text-[11px] mt-3.5 pt-3.5 border-t border-bourbon-gold/25">
                              Pay the full{" "}
                              <span className="tabular-nums font-semibold text-bourbon-deep">
                                {money(o.total)}
                              </span>{" "}
                              and quote {o.orderNumber}. We will never email you
                              these details or ask you to send payment anywhere
                              else.
                            </p>
                          </div>
                        )}

                        {o.canUploadProof ? (
                          <PaymentProofUpload
                            orderNumber={o.orderNumber}
                            alreadyUploaded={o.hasProof}
                          />
                        ) : o.status === "PENDING" ? (
                          /* Pending but no details yet — the order is waiting
                             on us, not on the buyer. Say so plainly instead of
                             showing a dead upload box. */
                          <div className="border border-bourbon-deep/10 bg-bourbon-cream p-4">
                            <p className="text-bourbon-deep text-sm font-semibold mb-1">
                              Payment details are on the way
                            </p>
                            <p className="text-bourbon-stone text-sm">
                              We are preparing the payment details for this
                              order. You will get an email the moment they are
                              ready, and they will appear here — there is
                              nothing to do until then.
                            </p>
                          </div>
                        ) : (
                          <p className="text-bourbon-stone text-sm">
                            Nothing to do here — this order is{" "}
                            {o.statusLabel.toLowerCase()}.
                          </p>
                        )}

                        {/* Chat with the admin about this specific order.
                            Collapsed by default: most orders never need it,
                            and an always-open thread would push the payment
                            details and the receipt box below the fold. */}
                        <div className="mt-5 pt-4 border-t border-bourbon-deep/[0.08]">
                          <button
                            type="button"
                            onClick={() =>
                              setChatFor(
                                chatFor === o.orderNumber ? null : o.orderNumber,
                              )
                            }
                            aria-expanded={chatFor === o.orderNumber}
                            className="inline-flex items-center gap-2 text-bourbon-stone text-xs font-semibold tracking-wider uppercase hover:text-bourbon-gold transition-colors cursor-pointer"
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              aria-hidden="true"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.75}
                                d="M21 11.5a8.38 8.38 0 01-9 8.4 8.5 8.5 0 01-3.8-.9L3 21l1.9-5.2A8.38 8.38 0 014 11.5a8.5 8.5 0 018.5-8.5 8.38 8.38 0 018.5 8.5z"
                              />
                            </svg>
                            {chatFor === o.orderNumber
                              ? "Hide chat"
                              : "Chat with us about this order"}
                          </button>

                          {chatFor === o.orderNumber && (
                            <div className="mt-3">
                              <OrderChat
                                endpoint={`/api/account/orders/${o.orderNumber}/chat`}
                                me="VISITOR"
                                orderNumber={o.orderNumber}
                                emptyHint={`Ask us anything about ${o.orderNumber} — payment, delivery, or anything else. You can send photos and voice notes too.`}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section>
          <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-bourbon-deep mb-1">
            Delivery details
          </h2>
          <p className="text-bourbon-stone text-sm mb-4">
            Used to prefill checkout. Changing them here doesn&apos;t alter
            orders you&apos;ve already placed.
          </p>

          <form
            action={(fd) =>
              startTransition(async () => {
                const res = await updateAccountDetails(fd);
                setSaved(res.ok ? "Saved." : res.error ?? "Could not save.");
              })
            }
            className="bg-white border border-bourbon-deep/10 p-5 sm:p-7 space-y-5"
          >
            <div className="grid sm:grid-cols-2 gap-5">
              <Field name="fullName" label="Full name" defaultValue={details.fullName} />
              <Field name="phone" label="Phone" defaultValue={details.phone} />
            </div>
            <Field name="addressLine1" label="Address" defaultValue={details.addressLine1} />
            <Field name="addressLine2" label="Address line 2" defaultValue={details.addressLine2} />
            <div className="grid sm:grid-cols-2 gap-5">
              <Field name="city" label="City" defaultValue={details.city} />
              <Field name="region" label="State / Region" defaultValue={details.region} />
            </div>
            <div className="grid sm:grid-cols-2 gap-5">
              <Field name="postal" label="Postal code" defaultValue={details.postal} />
              <Field name="country" label="Country" defaultValue={details.country} />
            </div>

            <div className="flex items-center gap-4 pt-1">
              <button
                type="submit"
                disabled={pending}
                className="px-6 py-3 bg-bourbon-deep text-bourbon-cream font-semibold tracking-widest uppercase text-xs hover:bg-bourbon-gold hover:text-bourbon-deep transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {pending ? "Saving…" : "Save details"}
              </button>
              {saved && (
                <span
                  role="status"
                  className={`text-sm ${saved === "Saved." ? "text-emerald-700" : "text-red-600"}`}
                >
                  {saved}
                </span>
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
        className="w-full bg-white border border-bourbon-deep/15 px-3 py-2.5 text-bourbon-deep text-sm focus:outline-none focus:border-bourbon-gold hover:border-bourbon-deep/30 transition-colors"
      />
    </div>
  );
}
