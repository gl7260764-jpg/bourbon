import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import {
  ADMIN_COOKIE,
  expectedTokenForCurrentPassword,
} from "@/lib/admin-auth";
import { getCurrentCustomer } from "@/lib/customer-auth";
import { snapshotOf } from "@/lib/invoice";
import { invoiceFileName, renderInvoicePdf } from "@/lib/invoice-pdf";

/* react-pdf reads font files off disk, so this cannot run on the edge. */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The invoice as a PDF.
 *
 * Rendered on demand rather than served from storage: the document is frozen in
 * Invoice.snapshot, so re-rendering always produces the same bytes and there is
 * no cached file to invalidate when an invoice is voided.
 *
 * Two callers are allowed and nobody else. An invoice names a customer, their
 * home address and what they bought, so "knows the invoice number" is not
 * authorisation — the number is sequential and trivially guessable.
 */
async function isAdmin(): Promise<boolean> {
  const jar = await cookies();
  const token = jar.get(ADMIN_COOKIE)?.value;
  if (!token) return false;
  const expected = await expectedTokenForCurrentPassword();
  return Boolean(expected && token === expected);
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ number: string }> },
) {
  const { number } = await params;

  const invoice = await prisma.invoice.findUnique({
    where: { invoiceNumber: number },
    include: { order: { select: { customerId: true, email: true } } },
  });
  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
  }

  if (!(await isAdmin())) {
    const customer = await getCurrentCustomer();
    const ownsIt =
      customer &&
      (invoice.order.customerId === customer.id ||
        invoice.order.email.toLowerCase() === customer.email.toLowerCase());
    if (!ownsIt) {
      // 404 rather than 403: confirming an invoice exists is itself a leak.
      return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
    }
  }

  const snap = snapshotOf(invoice);

  try {
    const pdf = await renderInvoicePdf(snap);
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${invoiceFileName(snap)}"`,
        "Content-Length": String(pdf.length),
        // Private: this is one customer's document, never a shared cache's.
        "Cache-Control": "private, no-store",
      },
    });
  } catch (err) {
    console.error(`[invoice-pdf] ${number} failed to render:`, err);
    return NextResponse.json(
      { error: "Could not render that invoice." },
      { status: 500 },
    );
  }
}
