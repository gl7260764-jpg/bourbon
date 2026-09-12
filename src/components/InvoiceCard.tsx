"use client";

/**
 * An invoice delivered into a chat thread.
 *
 * Rendered from ChatMessageView.invoice, which is present because the message
 * carries a nullable invoiceId rather than a new ChatMessageKind. The message
 * body still reads sensibly on its own, so a client that does not render this
 * card shows a complete sentence instead of an empty bubble.
 */

export interface ChatInvoice {
  number: string;
  total: string;
  status: string;
}

const money = (v: string) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    Number(v),
  );

export default function InvoiceCard({
  invoice,
  tone = "light",
}: {
  invoice: ChatInvoice;
  /** Bubbles differ between surfaces; the card borrows the surrounding tone. */
  tone?: "light" | "dark";
}) {
  const voided = invoice.status === "VOID";
  const paid = invoice.status === "PAID";

  const shell =
    tone === "dark"
      ? "border-bourbon-cream/20 bg-bourbon-cream/5"
      : "border-bourbon-deep/12 bg-white";
  const label = tone === "dark" ? "text-bourbon-cream/55" : "text-bourbon-stone/70";
  const value = tone === "dark" ? "text-bourbon-cream" : "text-bourbon-deep";

  return (
    <div className={`mb-1.5 border ${shell} overflow-hidden`}>
      <div className="flex items-center gap-2.5 px-3 pt-2.5 pb-2">
        <span
          className={`shrink-0 w-8 h-8 flex items-center justify-center border ${
            voided
              ? "border-zinc-300 text-zinc-400"
              : "border-bourbon-gold/50 text-bourbon-gold"
          }`}
          aria-hidden="true"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
            <path d="M14.5 2.5H7a2 2 0 0 0-2 2v15a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7l-4.5-4.5Z" />
            <path d="M14 2.5V8h5" />
            <path d="M9 13h6M9 16.5h4" />
          </svg>
        </span>
        <div className="min-w-0 flex-1">
          <p className={`text-[10px] tracking-[0.18em] uppercase ${label}`}>
            {voided ? "Invoice · void" : paid ? "Receipt" : "Invoice"}
          </p>
          <p className={`text-sm font-semibold tabular-nums truncate ${value} ${voided ? "line-through" : ""}`}>
            {invoice.number}
          </p>
        </div>
        <span className={`shrink-0 text-sm font-semibold tabular-nums ${value} ${voided ? "line-through" : ""}`}>
          {money(invoice.total)}
        </span>
      </div>

      {!voided && (
        <a
          href={`/api/invoices/${invoice.number}/pdf`}
          target="_blank"
          rel="noopener"
          className="block px-3 py-2 border-t border-bourbon-gold/30 bg-bourbon-gold/10 text-bourbon-gold text-[10px] font-semibold tracking-[0.15em] uppercase text-center hover:bg-bourbon-gold/20 transition-colors"
        >
          Download PDF
        </a>
      )}
    </div>
  );
}
