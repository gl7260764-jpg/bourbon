"use client";

import { useState, useTransition } from "react";
import {
  MAX_DETAIL_LEN,
  MAX_LABEL_LEN,
} from "@/lib/payment-options";
import {
  deletePaymentOption,
  savePaymentOption,
  togglePaymentOption,
} from "./actions";

export interface PaymentOptionRow {
  id: string;
  key: string;
  label: string;
  detail: string | null;
  discountRate: number;
  isActive: boolean;
  sortOrder: number;
  orderCount: number;
}

export default function PaymentMethodsClient({
  options,
}: {
  options: PaymentOptionRow[];
}) {
  const [editing, setEditing] = useState<PaymentOptionRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, startTransition] = useTransition();

  function run(fn: () => Promise<{ ok: boolean; error?: string }>, okText: string) {
    startTransition(async () => {
      const res = await fn();
      setMessage(res.ok ? { ok: true, text: okText } : { ok: false, text: res.error ?? "Failed." });
      if (res.ok) {
        setEditing(null);
        setCreating(false);
      }
    });
  }

  return (
    <>
      {message && (
        <p
          className={`mb-5 text-sm ${message.ok ? "text-emerald-700" : "text-red-600"}`}
        >
          {message.text}
        </p>
      )}

      <div className="flex justify-end mb-5">
        <button
          type="button"
          onClick={() => {
            setCreating(true);
            setEditing(null);
            setMessage(null);
          }}
          className="px-5 py-2.5 bg-bourbon-deep text-bourbon-cream font-semibold tracking-wider uppercase text-xs hover:bg-bourbon-gold hover:text-bourbon-deep transition-colors cursor-pointer"
        >
          + Add payment method
        </button>
      </div>

      {(creating || editing) && (
        <OptionForm
          key={editing?.id ?? "new"}
          option={editing}
          pending={pending}
          onCancel={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSubmit={(fd) =>
            run(
              () => savePaymentOption(editing?.id ?? null, fd),
              editing ? "Payment method updated." : "Payment method added.",
            )
          }
        />
      )}

      <div className="space-y-4">
        {options.length === 0 && !creating && (
          <p className="text-bourbon-stone text-sm py-8 text-center bg-white border border-bourbon-deep/10">
            No payment methods yet. Add one so customers have a way to pay.
          </p>
        )}

        {options.map((o) => (
          <section
            key={o.id}
            className={`bg-white border p-5 ${
              o.isActive ? "border-bourbon-deep/10" : "border-bourbon-deep/10 opacity-60"
            }`}
          >
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h2 className="font-[family-name:var(--font-playfair)] text-lg font-bold text-bourbon-deep">
                    {o.label}
                  </h2>
                  <span className="text-bourbon-stone text-[10px] tracking-widest uppercase font-mono">
                    {o.key}
                  </span>
                  <span
                    className={`text-[10px] tracking-widest uppercase px-1.5 py-0.5 ${
                      o.isActive
                        ? "bg-emerald-500/10 text-emerald-700"
                        : "bg-bourbon-deep/10 text-bourbon-stone"
                    }`}
                  >
                    {o.isActive ? "Live at checkout" : "Off"}
                  </span>
                  {o.discountRate > 0 && (
                    <span className="text-[10px] tracking-widest uppercase px-1.5 py-0.5 bg-bourbon-gold/15 text-bourbon-gold">
                      {Math.round(o.discountRate * 100)}% off
                    </span>
                  )}
                </div>
                {o.detail && (
                  <p className="text-bourbon-stone text-sm">{o.detail}</p>
                )}
                <p className="text-bourbon-stone text-xs mt-2">
                  {o.orderCount} order{o.orderCount === 1 ? "" : "s"} placed with this method
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => {
                    setEditing(o);
                    setCreating(false);
                    setMessage(null);
                  }}
                  className="px-4 py-2 border border-bourbon-deep/20 text-bourbon-deep text-xs tracking-wider uppercase hover:border-bourbon-gold transition-colors cursor-pointer disabled:opacity-50"
                >
                  Edit
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() =>
                    run(
                      () => togglePaymentOption(o.id),
                      o.isActive ? "Turned off." : "Turned on.",
                    )
                  }
                  className="px-4 py-2 border border-bourbon-deep/20 text-bourbon-deep text-xs tracking-wider uppercase hover:border-bourbon-gold transition-colors cursor-pointer disabled:opacity-50"
                >
                  {o.isActive ? "Turn off" : "Turn on"}
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => {
                    if (!confirm(`Delete "${o.label}"? This cannot be undone.`)) return;
                    run(() => deletePaymentOption(o.id), "Payment method deleted.");
                  }}
                  className="px-4 py-2 border border-red-200 text-red-600 text-xs tracking-wider uppercase hover:border-red-400 transition-colors cursor-pointer disabled:opacity-50"
                >
                  Delete
                </button>
              </div>
            </div>

          </section>
        ))}
      </div>
    </>
  );
}

function OptionForm({
  option,
  pending,
  onCancel,
  onSubmit,
}: {
  option: PaymentOptionRow | null;
  pending: boolean;
  onCancel: () => void;
  onSubmit: (fd: FormData) => void;
}) {
  return (
    <form
      action={onSubmit}
      className="bg-white border border-bourbon-gold/40 p-5 sm:p-6 mb-6"
    >
      <h2 className="font-[family-name:var(--font-playfair)] text-xl font-bold text-bourbon-deep mb-5 pb-4 border-b border-bourbon-deep/10">
        {option ? `Edit ${option.label}` : "New payment method"}
      </h2>

      <div className="grid sm:grid-cols-2 gap-5 mb-5">
        <div>
          <label htmlFor="label" className="block text-bourbon-deep text-sm font-semibold mb-1">
            Name shown at checkout
          </label>
          <input
            id="label"
            name="label"
            required
            maxLength={MAX_LABEL_LEN}
            defaultValue={option?.label ?? ""}
            placeholder="Zelle"
            className="w-full px-3 py-2 border border-bourbon-deep/20 text-bourbon-deep text-sm focus:outline-none focus:border-bourbon-gold"
          />
        </div>
        <div>
          <label htmlFor="discountPercent" className="block text-bourbon-deep text-sm font-semibold mb-1">
            Discount for using it (%)
          </label>
          <input
            id="discountPercent"
            name="discountPercent"
            type="number"
            min={0}
            max={50}
            step={0.5}
            defaultValue={option ? option.discountRate * 100 : 0}
            className="w-full px-3 py-2 border border-bourbon-deep/20 text-bourbon-deep text-sm focus:outline-none focus:border-bourbon-gold"
          />
        </div>
      </div>

      <div className="mb-5">
        <label htmlFor="detail" className="block text-bourbon-deep text-sm font-semibold mb-1">
          One-line description
        </label>
        <input
          id="detail"
          name="detail"
          maxLength={MAX_DETAIL_LEN}
          defaultValue={option?.detail ?? ""}
          placeholder="Send from your bank app — no fees."
          className="w-full px-3 py-2 border border-bourbon-deep/20 text-bourbon-deep text-sm focus:outline-none focus:border-bourbon-gold"
        />
      </div>

      <div className="flex items-center gap-6 mb-6 flex-wrap">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            name="isActive"
            defaultChecked={option?.isActive ?? true}
            className="w-4 h-4 accent-bourbon-gold cursor-pointer"
          />
          <span className="text-bourbon-deep text-sm font-semibold">
            Show at checkout
          </span>
        </label>
        <div className="flex items-center gap-2">
          <label htmlFor="sortOrder" className="text-bourbon-deep text-sm font-semibold">
            Order
          </label>
          <input
            id="sortOrder"
            name="sortOrder"
            type="number"
            defaultValue={option?.sortOrder ?? 0}
            className="w-20 px-3 py-2 border border-bourbon-deep/20 text-bourbon-deep text-sm focus:outline-none focus:border-bourbon-gold"
          />
        </div>
        {option && (
          <span className="text-bourbon-stone text-xs font-mono">
            key: {option.key} (fixed)
          </span>
        )}
      </div>

      <div className="flex items-center gap-3 pt-4 border-t border-bourbon-deep/10">
        <button
          type="submit"
          disabled={pending}
          className="px-6 py-2.5 bg-bourbon-deep text-bourbon-cream font-semibold tracking-wider uppercase text-xs hover:bg-bourbon-gold hover:text-bourbon-deep transition-colors cursor-pointer disabled:opacity-60"
        >
          {pending ? "Saving..." : option ? "Save changes" : "Add method"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2.5 border border-bourbon-deep/20 text-bourbon-deep text-xs tracking-wider uppercase hover:border-bourbon-gold transition-colors cursor-pointer"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
