import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { InvoiceError, issueInvoice, snapshotOf } from "@/lib/invoice";

/* react-pdf is reachable from the delivery path this route's siblings use. */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Issue an invoice for an order.
 *
 * Admin-only by virtue of living under /api/admin, which middleware gates.
 * Issuing does not send: generating and delivering are separate acts, so an
 * operator can look at the document before it reaches a customer.
 */
export async function POST(req: NextRequest) {
  let body: { orderId?: string };
  try {
    body = (await req.json()) as { orderId?: string };
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const orderId = (body.orderId ?? "").trim();
  if (!orderId) {
    return NextResponse.json({ error: "Which order?" }, { status: 400 });
  }

  try {
    const invoice = await issueInvoice(orderId, "admin");
    return NextResponse.json({
      invoice: {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        total: String(invoice.total),
        issuedAt: invoice.issuedAt.toISOString(),
        emailSentAt: null,
        chatSentAt: null,
        voidedAt: null,
        status: snapshotOf(invoice).status,
      },
    });
  } catch (err) {
    if (err instanceof InvoiceError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error("[admin/invoices] issue failed:", err);
    return NextResponse.json(
      { error: "Could not generate that invoice." },
      { status: 500 },
    );
  }
}

/** Invoices for one order, newest first. Drives the panel after a refresh. */
export async function GET(req: NextRequest) {
  const orderId = req.nextUrl.searchParams.get("orderId");
  if (!orderId) {
    return NextResponse.json({ error: "Which order?" }, { status: 400 });
  }

  const rows = await prisma.invoice.findMany({
    where: { orderId },
    orderBy: { issuedAt: "desc" },
  });

  return NextResponse.json({
    invoices: rows.map((i) => ({
      id: i.id,
      invoiceNumber: i.invoiceNumber,
      total: String(i.total),
      issuedAt: i.issuedAt.toISOString(),
      emailSentAt: i.emailSentAt?.toISOString() ?? null,
      emailSentTo: i.emailSentTo,
      chatSentAt: i.chatSentAt?.toISOString() ?? null,
      voidedAt: i.voidedAt?.toISOString() ?? null,
      voidReason: i.voidReason,
      status: snapshotOf(i).status,
    })),
  });
}
