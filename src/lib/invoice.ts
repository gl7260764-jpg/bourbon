import type { Invoice, Order, OrderItem, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { DISTILLERY } from "@/lib/locations";
import { toOrderSnapshot } from "@/lib/order-snapshot";

/**
 * Invoice issuing.
 *
 * The document is frozen at issue time. Everything the template renders comes
 * out of Invoice.snapshot rather than being re-read from the order, so editing
 * an order — a corrected address, a changed shipping method — never rewrites an
 * invoice that has already reached somebody's inbox. Same reasoning as
 * Order.paymentInstructions, which snapshots the payment rail as the buyer saw it.
 *
 * Correcting an issued invoice means voiding it and issuing a new number, never
 * editing in place.
 */

/** Seller identity. Single source of truth is DISTILLERY, used by schema.org too. */
export interface InvoiceParty {
  name: string;
  lines: string[];
  email: string;
}

export interface InvoiceLine {
  description: string;
  /** Second line under the description: age statement, size, case/bottle. */
  detail: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface InvoiceSnapshot {
  invoiceNumber: string;
  orderNumber: string;
  issuedAt: string;
  /** Human phrase, not a date: these orders are payable immediately. */
  terms: string;
  status: InvoiceStatus;
  seller: InvoiceParty;
  billedTo: InvoiceParty;
  shippedTo: InvoiceParty;
  shippingLabel: string;
  /* The payment RAIL only — "Zelle", "Cash App" — never the account behind it,
     and null when the order does not name one. The issued details themselves
     are deliberately absent: this document gets emailed, and the site tells
     every customer we never send payment details by email. Printing them here
     would make that promise false and turn a forwarded invoice into a way to
     redirect someone's money. They live on the dashboard, behind a login. */
  paymentLabel: string | null;
  lines: InvoiceLine[];
  totals: {
    subtotal: number;
    discount: number;
    discountLabel: string | null;
    shipping: number;
    tax: number;
    total: number;
  };
  currency: string;
}

export type InvoiceStatus = "PAID" | "DUE" | "VOID";

/** What the invoice should say about payment, from the order's own state. */
export function statusForOrder(order: Order): InvoiceStatus {
  if (order.settlementState === "PAID" || order.status === "PAID") return "PAID";
  if (order.status === "SHIPPED" || order.status === "DELIVERED") return "PAID";
  return "DUE";
}

export const STATUS_LABEL: Record<InvoiceStatus, string> = {
  PAID: "PAID IN FULL",
  DUE: "PAYMENT DUE",
  VOID: "VOID",
};

export function money(n: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(n);
}

export function formatIssueDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

const SELLER: InvoiceParty = {
  name: DISTILLERY.name,
  lines: [
    DISTILLERY.streetAddress,
    `${DISTILLERY.addressLocality}, ${DISTILLERY.addressRegion} ${DISTILLERY.postalCode}`,
    "United States",
  ],
  // Deliberately no telephone. DISTILLERY.telephone is still a placeholder
  // (555-0199) and a fake number on an invoice is worse than none at all.
  email: DISTILLERY.email,
};

/**
 * Freeze an order into the document an invoice renders from.
 *
 * Totals are taken from the order's own stored figures rather than recomputed:
 * the order is what the customer agreed to pay, and an invoice that disagrees
 * with the confirmation email is a support ticket, not a document.
 */
export function buildInvoiceSnapshot(
  order: Order & { items: OrderItem[] },
  invoiceNumber: string,
  issuedAt: Date = new Date(),
): InvoiceSnapshot {
  const s = toOrderSnapshot(order);
  const status = statusForOrder(order);

  const addressLines = [
    s.address.line1,
    s.address.line2,
    `${s.address.city}, ${s.address.region} ${s.address.postal}`,
    s.address.country,
  ].filter((l) => l.trim().length > 0);

  const lines: InvoiceLine[] = order.items.map((it) => {
    const detail = [
      it.ageLabel,
      it.isCase ? "Case of 6 · 750ml" : "750ml",
    ]
      .filter(Boolean)
      .join(" · ");
    return {
      description: it.productName,
      detail,
      quantity: it.quantity,
      unitPrice: Number(it.unitPrice),
      amount: Number(it.unitPrice) * it.quantity,
    };
  });

  const discount = Number(order.discount);
  const rate = Number(order.discountRate);
  const paymentLabel =
    order.paymentLabel?.trim() ||
    (order.paymentMethod === "OTHER" ? null : s.payment.label);

  return {
    invoiceNumber,
    orderNumber: order.orderNumber,
    issuedAt: issuedAt.toISOString(),
    terms: status === "PAID" ? "Paid in full" : "Due on receipt",
    status,
    seller: SELLER,
    billedTo: {
      name: s.address.fullName,
      lines: addressLines,
      email: order.email,
    },
    shippedTo: {
      name: s.address.fullName,
      lines: addressLines,
      email: "",
    },
    shippingLabel: s.shipping.label,
    /* An operator-named rail wins; a bare OTHER names nothing useful, so the
       invoice says nothing rather than printing a meaningless "Other". */
    paymentLabel,
    lines,
    totals: {
      subtotal: Number(order.subtotal),
      discount,
      // Only name a rate when there is one, so a zero-discount invoice does
      // not carry a meaningless "0% off" line.
      discountLabel:
        discount > 0
          ? `Discount${paymentLabel ? ` · ${paymentLabel}` : ""}${rate > 0 ? ` (${Math.round(rate * 100)}%)` : ""}`
          : null,
      shipping: Number(order.shippingCost),
      tax: Number(order.tax),
      total: Number(order.total),
    },
    currency: "USD",
  };
}

/**
 * Next number in this calendar year's sequence: INV-2026-0001.
 *
 * Derived by counting rather than kept in a counter row, so there is nothing to
 * drift out of sync with the table. Two operators clicking at once would derive
 * the same number, which is why the caller retries on the unique constraint
 * rather than trusting this to be race-free on its own.
 */
export async function nextInvoiceNumber(now: Date = new Date()): Promise<string> {
  const year = now.getUTCFullYear();
  const prefix = `INV-${year}-`;
  const last = await prisma.invoice.findFirst({
    where: { invoiceNumber: { startsWith: prefix } },
    orderBy: { invoiceNumber: "desc" },
    select: { invoiceNumber: true },
  });
  const lastSeq = last ? Number(last.invoiceNumber.slice(prefix.length)) : 0;
  const next = Number.isFinite(lastSeq) ? lastSeq + 1 : 1;
  return `${prefix}${String(next).padStart(4, "0")}`;
}

export class InvoiceError extends Error {}

/**
 * Issue an invoice for an order.
 *
 * Retries on a duplicate number, which is the one collision worth handling: the
 * sequence is derived, so two simultaneous issues would otherwise both take the
 * same number and one would fail with a raw Prisma error.
 */
export async function issueInvoice(
  orderId: string,
  issuedBy: string,
): Promise<Invoice> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });
  if (!order) throw new InvoiceError("That order no longer exists.");
  if (order.items.length === 0) {
    throw new InvoiceError("That order has no line items to invoice.");
  }

  const issuedAt = new Date();

  for (let attempt = 0; attempt < 5; attempt++) {
    const invoiceNumber = await nextInvoiceNumber(issuedAt);
    const snapshot = buildInvoiceSnapshot(order, invoiceNumber, issuedAt);
    try {
      return await prisma.invoice.create({
        data: {
          invoiceNumber,
          orderId: order.id,
          snapshot: snapshot as unknown as Prisma.InputJsonValue,
          currency: snapshot.currency,
          subtotal: order.subtotal,
          discount: order.discount,
          shipping: order.shippingCost,
          tax: order.tax,
          total: order.total,
          issuedAt,
          issuedBy,
        },
      });
    } catch (err) {
      const code = (err as { code?: string }).code;
      if (code === "P2002") continue; // number taken — derive the next one
      throw err;
    }
  }

  throw new InvoiceError(
    "Could not allocate an invoice number. Please try again.",
  );
}

/**
 * What the invoice says about payment.
 *
 * Shared by the HTML and PDF renderers so the two cannot drift, and
 * deliberately free of account numbers: an invoice is emailed and forwarded,
 * and the details belong behind the dashboard login instead.
 */
export function paymentNote(inv: InvoiceSnapshot): { title: string; body: string } {
  if (inv.status === "PAID") {
    return {
      title: "PAYMENT RECEIVED",
      body: inv.paymentLabel
        ? `Paid by ${inv.paymentLabel}. Thank you — nothing further is owed on this order.`
        : "Paid in full. Thank you — nothing further is owed on this order.",
    };
  }
  if (inv.status === "VOID") {
    return {
      title: "VOID",
      body: "This invoice has been withdrawn and nothing is payable against it.",
    };
  }
  return {
    title: "HOW TO PAY",
    body:
      (inv.paymentLabel ? `Payment by ${inv.paymentLabel}. ` : "") +
      `Sign in to your account to see where to send it — for your security we never send payment details by email. Quote reference ${inv.orderNumber} so we can match your payment.`,
  };
}

/** Read the frozen document back off a row. */
export function snapshotOf(invoice: Invoice): InvoiceSnapshot {
  const snap = invoice.snapshot as unknown as InvoiceSnapshot;
  // A voided invoice must say so wherever it is rendered, including on a PDF
  // that was generated before it was voided.
  if (invoice.voidedAt) return { ...snap, status: "VOID" };
  return snap;
}
