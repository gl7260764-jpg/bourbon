"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { issuePaymentDetails } from "./actions";

export interface PaymentDetailsData {
  orderId: string;
  orderNumber: string;
  body: string | null;
  issuedAt: string | null;
  issuedBy: string | null;
  /** False once the order has left PENDING — panel goes read-only. */
  actionable: boolean;
}

export default function PaymentDetailsPanel({
  data,
}: {
  data: PaymentDetailsData;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [body, setBody] = useState(data.body ?? "");
  const [editing, setEditing] = useState(!data.issuedAt);

  const issued = Boolean(data.issuedAt);

  function submit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const res = await issuePaymentDetails(data.orderId, formData);
      if (!res.ok) {
        setError(res.error ?? "Could not save.");
        return;
      }
      setEditing(false);
      router.refresh();
    });
  }

  return (
    <section className="bg-white border border-bourbon-deep/10 p-5">
      <div className="flex items-baseline justify-between gap-3 mb-4 flex-wrap">
        <h2 className="font-[family-name:var(--font-playfair)] text-lg font-bold text-bourbon-deep">
          Payment details
        </h2>
        {issued ? (
          <span className="text-[10px] tracking-widest uppercase px-2 py-0.5 bg-emerald-100 text-emerald-800">
            Issued
          </span>
        ) : (
          <span className="text-[10px] tracking-widest uppercase px-2 py-0.5 bg-rose-100 text-rose-800">
            Not sent
          </span>
        )}
      </div>

      {!issued && (
        <p className="text-bourbon-stone text-sm mb-4">
          The buyer cannot pay or upload a receipt until you send these. They
          currently see &ldquo;details on the way&rdquo; on their dashboard.
        </p>
      )}

      {issued && !editing ? (
        <>
          <pre className="whitespace-pre-wrap font-sans text-bourbon-deep text-sm bg-bourbon-cream border border-bourbon-deep/10 p-3.5 leading-relaxed">
            {data.body}
          </pre>
          <p className="text-bourbon-stone text-[11px] mt-2.5">
            Sent {new Date(data.issuedAt!).toLocaleString("en-US", { timeZone: "UTC" })} UTC
            {data.issuedBy ? ` by ${data.issuedBy}` : ""}
          </p>
          {data.actionable && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="mt-3 text-bourbon-gold text-xs tracking-widest uppercase font-semibold hover:text-bourbon-amber transition-colors cursor-pointer"
            >
              Correct these details
            </button>
          )}
        </>
      ) : data.actionable ? (
        <form action={submit} className="space-y-3">
          <textarea
            name="paymentDetailsBody"
            required
            rows={7}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            disabled={pending}
            placeholder={"Bank: …\nAccount name: …\nAccount number: …\nReference: quote your order number"}
            className="w-full bg-white border border-bourbon-deep/15 px-3 py-2.5 text-bourbon-deep text-sm leading-relaxed focus:outline-none focus:border-bourbon-gold transition-colors disabled:opacity-60"
          />
          <p className="text-bourbon-stone text-[11px]">
            Shown to the buyer exactly as typed, on their dashboard only — never
            emailed. Re-issuing replaces what they see and emails them again.
          </p>

          {error && (
            <p className="text-red-600 text-sm" role="alert">
              {error}
            </p>
          )}

          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={pending}
              className="px-4 py-2.5 bg-bourbon-gold text-bourbon-deep text-xs font-semibold tracking-widest uppercase hover:bg-bourbon-amber transition-colors cursor-pointer disabled:opacity-60"
            >
              {pending ? "Sending..." : issued ? "Re-issue details" : "Send payment details"}
            </button>
            {issued && (
              <button
                type="button"
                onClick={() => {
                  setEditing(false);
                  setBody(data.body ?? "");
                  setError(null);
                }}
                className="px-3 py-2.5 text-bourbon-stone text-xs tracking-widest uppercase hover:text-bourbon-deep transition-colors cursor-pointer"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      ) : (
        <p className="text-bourbon-stone text-sm">
          This order has moved past pending — payment details are read-only.
        </p>
      )}
    </section>
  );
}
