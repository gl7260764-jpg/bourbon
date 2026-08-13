"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { SettlementState } from "@prisma/client";
import { SETTLEMENT_BADGE, SETTLEMENT_LABEL } from "@/lib/order-status";
import { updateSettlement } from "./actions";

export interface SettlementData {
  orderId: string;
  orderNumber: string;
  state: SettlementState;
  paymentLabel: string;
  paymentInstructions: string | null;
  paymentReference: string | null;
  amountReceived: number | null;
  settlementNote: string | null;
  updatedAt: string | null;
  updatedBy: string | null;
  /**
   * Short-lived signed URL for the buyer's payment screenshot, generated
   * server-side. The asset is stored as a Cloudinary `authenticated` resource,
   * so there is no permanent public link to leak.
   */
  proofUrl: string | null;
  proofUploadedAt: string | null;
  total: number;
  /** False once the order has moved past PENDING — panel goes read-only. */
  actionable: boolean;
}

function money(n: number) {
  return `$${n.toFixed(2)}`;
}

export default function SettlementPanel({ data }: { data: SettlementData }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);

  function submit(action: string, form: HTMLFormElement) {
    const fd = new FormData(form);
    fd.set("action", action);
    setError(null);
    startTransition(async () => {
      const res = await updateSettlement(data.orderId, fd);
      if (!res.ok) {
        setError(res.error ?? "Something went wrong.");
        return;
      }
      // Re-render from server truth rather than patching local state.
      router.refresh();
    });
  }

  const shortfall =
    data.amountReceived !== null ? data.amountReceived - data.total : null;

  return (
    <section className="bg-white border border-bourbon-deep/10 p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3 mb-4 pb-4 border-b border-bourbon-deep/10 flex-wrap">
        <h2 className="font-[family-name:var(--font-playfair)] text-xl font-bold text-bourbon-deep">
          Payment
        </h2>
        <span
          className={`text-[10px] font-bold tracking-widest uppercase px-2 py-1 ${SETTLEMENT_BADGE[data.state]}`}
        >
          {SETTLEMENT_LABEL[data.state]}
        </span>
      </div>

      <dl className="text-sm space-y-2 mb-4">
        <div className="flex justify-between gap-3">
          <dt className="text-bourbon-stone">Method</dt>
          <dd className="text-bourbon-deep font-semibold">{data.paymentLabel}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-bourbon-stone">Amount due</dt>
          <dd className="text-bourbon-deep font-semibold">{money(data.total)}</dd>
        </div>
        {data.paymentReference && (
          <div className="flex justify-between gap-3">
            <dt className="text-bourbon-stone">Reference</dt>
            <dd className="text-bourbon-deep font-mono text-xs break-all text-right">
              {data.paymentReference}
            </dd>
          </div>
        )}
        {data.amountReceived !== null && (
          <div className="flex justify-between gap-3">
            <dt className="text-bourbon-stone">Received</dt>
            <dd
              className={`font-semibold ${
                shortfall !== null && Math.abs(shortfall) >= 0.01
                  ? "text-rose-700"
                  : "text-bourbon-deep"
              }`}
            >
              {money(data.amountReceived)}
              {shortfall !== null && Math.abs(shortfall) >= 0.01 && (
                <span className="block text-xs font-normal">
                  {shortfall > 0
                    ? `${money(shortfall)} over`
                    : `${money(Math.abs(shortfall))} short`}
                </span>
              )}
            </dd>
          </div>
        )}
        {data.updatedAt && (
          <div className="flex justify-between gap-3">
            <dt className="text-bourbon-stone">Last updated</dt>
            <dd className="text-bourbon-stone text-xs">
              {new Date(data.updatedAt).toLocaleString("en-US", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
              {data.updatedBy ? ` · ${data.updatedBy}` : ""}
            </dd>
          </div>
        )}
      </dl>

      {/* Buyer's proof of payment. Highlighted because it's the thing the
          operator actually has to look at before confirming. */}
      {data.proofUrl && (
        <div className="mb-4 p-3 bg-sky-50 border-2 border-sky-200">
          <div className="flex items-baseline justify-between gap-2 mb-2 flex-wrap">
            <p className="text-sky-800 text-[10px] tracking-widest uppercase font-bold">
              Receipt from customer
            </p>
            {data.proofUploadedAt && (
              <span className="text-bourbon-stone text-[11px]">
                {new Date(data.proofUploadedAt).toLocaleString("en-US", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </span>
            )}
          </div>
          <a href={data.proofUrl} target="_blank" rel="noopener noreferrer">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={data.proofUrl}
              alt="Customer payment screenshot"
              className="w-full max-h-72 object-contain bg-white border border-sky-200 cursor-zoom-in"
            />
          </a>
          <a
            href={data.proofUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-2 text-sky-800 hover:text-sky-900 text-xs tracking-widest uppercase underline"
          >
            Open full size
          </a>
          <p className="text-bourbon-stone text-[11px] mt-2">
            Private link, expires in 15 minutes. Check the amount and the
            destination match before confirming.
          </p>
        </div>
      )}

      {data.settlementNote && (
        <div className="mb-4 p-3 bg-bourbon-cream/60 border border-bourbon-deep/10">
          <p className="text-bourbon-stone text-[10px] tracking-widest uppercase mb-1">
            Note
          </p>
          <p className="text-bourbon-deep text-sm whitespace-pre-wrap">
            {data.settlementNote}
          </p>
        </div>
      )}

      {/* What the customer was told to do — read-only, for reference when
          matching a payment against the right account. */}
      {data.paymentInstructions && (
        <div className="mb-4">
          <button
            type="button"
            onClick={() => setShowInstructions((v) => !v)}
            className="text-bourbon-stone hover:text-bourbon-deep text-xs tracking-widest uppercase transition-colors cursor-pointer"
          >
            {showInstructions ? "Hide" : "Show"} details sent to customer
          </button>
          {showInstructions && (
            <pre className="mt-2 p-3 bg-bourbon-cream/60 border border-bourbon-deep/10 text-bourbon-deep text-xs whitespace-pre-wrap font-[family-name:var(--font-inter)]">
              {data.paymentInstructions}
            </pre>
          )}
        </div>
      )}

      {error && (
        <p className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm">
          {error}
        </p>
      )}

      {!data.actionable ? (
        <p className="text-bourbon-stone text-sm pt-4 border-t border-bourbon-deep/10">
          This order has moved past the payment stage — settlement is now
          read-only.
        </p>
      ) : (
        <form
          onSubmit={(e) => e.preventDefault()}
          className="pt-4 border-t border-bourbon-deep/10 space-y-4"
        >
          <div>
            <label
              htmlFor="paymentReference"
              className="block text-bourbon-deep text-sm font-semibold mb-1"
            >
              Payment reference
            </label>
            <p className="text-bourbon-stone text-xs mb-2">
              What the customer sent back — transaction hash, Chime
              confirmation, Zelle reference.
            </p>
            <input
              id="paymentReference"
              name="paymentReference"
              defaultValue={data.paymentReference ?? ""}
              placeholder="e.g. 0x9f2c… or CHIME-88213"
              className="w-full px-3 py-2 border border-bourbon-deep/20 text-bourbon-deep text-sm font-mono focus:outline-none focus:border-bourbon-gold"
            />
          </div>

          <div>
            <label
              htmlFor="amountReceived"
              className="block text-bourbon-deep text-sm font-semibold mb-1"
            >
              Amount received
            </label>
            <input
              id="amountReceived"
              name="amountReceived"
              type="number"
              step="0.01"
              min="0"
              defaultValue={data.amountReceived ?? ""}
              placeholder={data.total.toFixed(2)}
              className="w-40 px-3 py-2 border border-bourbon-deep/20 text-bourbon-deep text-sm focus:outline-none focus:border-bourbon-gold"
            />
          </div>

          <div>
            <label
              htmlFor="settlementNote"
              className="block text-bourbon-deep text-sm font-semibold mb-1"
            >
              Note <span className="font-normal text-bourbon-stone">(required to reject)</span>
            </label>
            <textarea
              id="settlementNote"
              name="settlementNote"
              rows={2}
              defaultValue={data.settlementNote ?? ""}
              placeholder="Wrong amount, no funds received, wrong account…"
              className="w-full px-3 py-2 border border-bourbon-deep/20 text-bourbon-deep text-sm focus:outline-none focus:border-bourbon-gold"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={pending}
              onClick={(e) => submit("record-proof", e.currentTarget.form!)}
              className="px-5 py-2.5 border border-bourbon-deep/20 text-bourbon-deep font-semibold tracking-wider uppercase text-xs hover:border-bourbon-gold transition-colors cursor-pointer disabled:opacity-60"
            >
              Record reference
            </button>
            <button
              type="submit"
              disabled={pending}
              onClick={(e) => submit("mark-paid", e.currentTarget.form!)}
              className="px-5 py-2.5 bg-emerald-700 text-white font-semibold tracking-wider uppercase text-xs hover:bg-emerald-800 transition-colors cursor-pointer disabled:opacity-60"
            >
              {pending ? "Working…" : "Confirm payment"}
            </button>
            <button
              type="submit"
              disabled={pending}
              onClick={(e) => submit("reject", e.currentTarget.form!)}
              className="px-5 py-2.5 border border-rose-300 text-rose-700 font-semibold tracking-wider uppercase text-xs hover:border-rose-500 transition-colors cursor-pointer disabled:opacity-60"
            >
              Reject
            </button>
          </div>
          <p className="text-bourbon-stone text-xs">
            Confirming payment also moves the order to <strong>Paid</strong>.
            Rejecting keeps it pending so the customer can try again.
          </p>
        </form>
      )}
    </section>
  );
}
