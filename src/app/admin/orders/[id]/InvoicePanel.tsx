"use client";

import { useState } from "react";

/**
 * Generate, send and void invoices for one order.
 *
 * Generating and sending are separate buttons on purpose: an invoice that has
 * reached a customer's inbox cannot be unsent, so the operator gets to look at
 * the document before anyone else does.
 */

export interface InvoiceRow {
  id: string;
  invoiceNumber: string;
  total: string;
  issuedAt: string;
  emailSentAt: string | null;
  emailSentTo?: string | null;
  chatSentAt: string | null;
  voidedAt: string | null;
  voidReason?: string | null;
  status: "PAID" | "DUE" | "VOID";
}

export interface InvoicePanelData {
  orderId: string;
  orderNumber: string;
  customerEmail: string;
  invoices: InvoiceRow[];
}

const money = (v: string) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
    Number(v),
  );

const when = (iso: string) =>
  new Date(iso).toLocaleString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

function StatusChip({ status }: { status: InvoiceRow["status"] }) {
  const styles: Record<InvoiceRow["status"], string> = {
    PAID: "bg-emerald-50 border-emerald-300 text-emerald-700",
    DUE: "bg-bourbon-warm border-bourbon-gold/50 text-amber-800",
    VOID: "bg-zinc-100 border-zinc-300 text-zinc-500",
  };
  return (
    <span
      className={`shrink-0 px-2 py-0.5 border text-[10px] font-bold tracking-widest ${styles[status]}`}
    >
      {status === "PAID" ? "PAID" : status === "DUE" ? "DUE" : "VOID"}
    </span>
  );
}

/** A green tick when delivered, a muted dash when not. */
function Delivery({ label, at }: { label: string; at: string | null }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 ${at ? "text-emerald-700" : "text-bourbon-stone/50"}`}
      title={at ? `${label} ${when(at)}` : `Not sent by ${label.toLowerCase()}`}
    >
      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {at ? <path d="m5 13 4 4L19 7" /> : <path d="M5 12h14" />}
      </svg>
      {label}
    </span>
  );
}

export default function InvoicePanel({ data }: { data: InvoicePanelData }) {
  const [invoices, setInvoices] = useState<InvoiceRow[]>(data.invoices);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const live = invoices.filter((i) => !i.voidedAt);

  async function generate() {
    setBusy("generate");
    setError(null);
    setNotice(null);
    try {
      const res = await fetch("/api/admin/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: data.orderId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not generate the invoice.");
      setInvoices((prev) => [json.invoice as InvoiceRow, ...prev]);
      setNotice(`${json.invoice.invoiceNumber} generated. Nothing has been sent yet.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(null);
    }
  }

  async function send(id: string, channels: { email: boolean; chat: boolean }) {
    setBusy(id);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch(`/api/admin/invoices/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(channels),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not send the invoice.");

      if (json.invoice) {
        setInvoices((prev) =>
          prev.map((i) => (i.id === id ? (json.invoice as InvoiceRow) : i)),
        );
      }

      /* Report per channel. "Sent" would be a lie when one of the two failed,
         and the operator needs to know which to retry. */
      const r = json.result as {
        email: { attempted: boolean; ok: boolean; to?: string; error?: string };
        chat: { attempted: boolean; ok: boolean; error?: string };
      };
      const good: string[] = [];
      const bad: string[] = [];
      if (r.email.attempted) {
        if (r.email.ok) good.push(`emailed to ${r.email.to}`);
        else bad.push(`email failed — ${r.email.error ?? "unknown error"}`);
      }
      if (r.chat.attempted) {
        if (r.chat.ok) good.push("posted to their chat");
        else bad.push(`chat failed — ${r.chat.error ?? "unknown error"}`);
      }
      if (bad.length) setError(bad.join(" · "));
      if (good.length) setNotice(`Invoice ${good.join(" and ")}.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(null);
    }
  }

  async function voidInvoice(id: string, number: string) {
    const reason = window.prompt(
      `Void ${number}? The number stays spent and the customer keeps any copy already sent.\n\nReason (optional):`,
    );
    if (reason === null) return;
    setBusy(id);
    setError(null);
    setNotice(null);
    try {
      const res = await fetch(`/api/admin/invoices/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not void the invoice.");
      setInvoices((prev) =>
        prev.map((i) => (i.id === id ? (json.invoice as InvoiceRow) : i)),
      );
      setNotice(`${number} voided.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="bg-white border border-bourbon-deep/10 p-5">
      <div className="flex items-start justify-between gap-3 mb-1">
        <h2 className="font-[family-name:var(--font-playfair)] text-lg font-bold text-bourbon-deep">
          Invoices
        </h2>
        {live.length > 0 && (
          <span className="text-bourbon-stone/70 text-xs tabular-nums mt-1">
            {live.length} issued
          </span>
        )}
      </div>
      <p className="text-bourbon-stone text-xs leading-relaxed mb-4">
        Generating does not send. Review the document, then send it to{" "}
        <span className="text-bourbon-deep">{data.customerEmail}</span> and into
        their dashboard chat.
      </p>

      {invoices.length === 0 ? (
        <p className="text-bourbon-stone/70 text-sm mb-4">
          No invoice has been generated for this order yet.
        </p>
      ) : (
        <ul className="space-y-3 mb-4">
          {invoices.map((inv) => {
            const voided = Boolean(inv.voidedAt);
            const working = busy === inv.id;
            return (
              <li
                key={inv.id}
                className={`border p-3.5 ${voided ? "border-bourbon-deep/10 bg-bourbon-cream/60" : "border-bourbon-deep/15"}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`font-semibold text-sm tabular-nums ${voided ? "text-bourbon-stone/60 line-through" : "text-bourbon-deep"}`}
                      >
                        {inv.invoiceNumber}
                      </span>
                      <StatusChip status={voided ? "VOID" : inv.status} />
                    </div>
                    <p className="text-bourbon-stone text-xs mt-1 tabular-nums">
                      {money(inv.total)} · issued {when(inv.issuedAt)}
                    </p>
                    {voided && inv.voidReason && (
                      <p className="text-bourbon-stone/70 text-xs mt-1 italic">
                        {inv.voidReason}
                      </p>
                    )}
                  </div>
                  <a
                    href={`/api/invoices/${inv.invoiceNumber}/pdf`}
                    target="_blank"
                    rel="noopener"
                    className="shrink-0 px-3 py-1.5 border border-bourbon-deep/20 text-bourbon-deep text-[10px] font-semibold tracking-widest uppercase hover:border-bourbon-gold hover:text-bourbon-gold transition-colors"
                  >
                    PDF
                  </a>
                </div>

                {!voided && (
                  <>
                    <div className="flex items-center gap-4 mt-3 text-xs">
                      <Delivery label="Email" at={inv.emailSentAt} />
                      <Delivery label="Chat" at={inv.chatSentAt} />
                    </div>

                    <div className="flex flex-wrap gap-2 mt-3">
                      <button
                        type="button"
                        onClick={() => send(inv.id, { email: true, chat: true })}
                        disabled={working}
                        className="px-3.5 py-2 bg-bourbon-gold text-bourbon-deep text-[10px] font-semibold tracking-widest uppercase hover:bg-bourbon-amber transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {working
                          ? "Sending…"
                          : inv.emailSentAt || inv.chatSentAt
                            ? "Send again"
                            : "Send"}
                      </button>
                      <button
                        type="button"
                        onClick={() => send(inv.id, { email: true, chat: false })}
                        disabled={working}
                        className="px-3.5 py-2 border border-bourbon-deep/20 text-bourbon-deep text-[10px] font-semibold tracking-widest uppercase hover:border-bourbon-gold hover:text-bourbon-gold transition-colors cursor-pointer disabled:opacity-50"
                      >
                        Email only
                      </button>
                      <button
                        type="button"
                        onClick={() => send(inv.id, { email: false, chat: true })}
                        disabled={working}
                        className="px-3.5 py-2 border border-bourbon-deep/20 text-bourbon-deep text-[10px] font-semibold tracking-widest uppercase hover:border-bourbon-gold hover:text-bourbon-gold transition-colors cursor-pointer disabled:opacity-50"
                      >
                        Chat only
                      </button>
                      <button
                        type="button"
                        onClick={() => voidInvoice(inv.id, inv.invoiceNumber)}
                        disabled={working}
                        className="px-3.5 py-2 text-bourbon-stone/70 text-[10px] font-semibold tracking-widest uppercase hover:text-red-600 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        Void
                      </button>
                    </div>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <button
        type="button"
        onClick={generate}
        disabled={busy === "generate"}
        className="w-full px-4 py-3 border border-bourbon-deep/25 text-bourbon-deep text-[11px] font-semibold tracking-widest uppercase hover:border-bourbon-gold hover:text-bourbon-gold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {busy === "generate"
          ? "Generating…"
          : invoices.length === 0
            ? "Generate invoice"
            : "Generate a new invoice"}
      </button>

      {notice && (
        <p className="mt-3 text-emerald-700 text-xs leading-relaxed">{notice}</p>
      )}
      {error && (
        <p className="mt-3 text-red-600 text-xs leading-relaxed">{error}</p>
      )}
    </section>
  );
}
