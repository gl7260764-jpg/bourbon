import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { snapshotOf } from "@/lib/invoice";
import { deliverInvoice } from "@/lib/invoice-delivery";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Send an issued invoice, or void it.
 *
 * POST { email, chat } delivers by the chosen channels and answers with what
 * each one actually did — an invoice that emailed but failed to reach the chat
 * must not report as simply "sent".
 *
 * DELETE voids. The row survives and the number stays spent, because an invoice
 * that reached a customer cannot be made not to have existed; correcting one
 * means voiding it and issuing a new number.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  let body: { email?: boolean; chat?: boolean };
  try {
    body = (await req.json()) as { email?: boolean; chat?: boolean };
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const email = body.email !== false;
  const chat = body.chat !== false;
  if (!email && !chat) {
    return NextResponse.json(
      { error: "Choose at least one way to send it." },
      { status: 400 },
    );
  }

  const invoice = await prisma.invoice.findUnique({ where: { id } });
  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
  }
  if (invoice.voidedAt) {
    return NextResponse.json(
      { error: "That invoice is void. Generate a new one instead." },
      { status: 400 },
    );
  }

  const result = await deliverInvoice(invoice, { email, chat });
  const fresh = await prisma.invoice.findUnique({ where: { id } });

  return NextResponse.json({
    result,
    invoice: fresh
      ? {
          id: fresh.id,
          invoiceNumber: fresh.invoiceNumber,
          total: String(fresh.total),
          issuedAt: fresh.issuedAt.toISOString(),
          emailSentAt: fresh.emailSentAt?.toISOString() ?? null,
          emailSentTo: fresh.emailSentTo,
          chatSentAt: fresh.chatSentAt?.toISOString() ?? null,
          voidedAt: null,
          status: snapshotOf(fresh).status,
        }
      : null,
  });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  let reason = "";
  try {
    const body = (await req.json()) as { reason?: string };
    reason = (body.reason ?? "").trim().slice(0, 500);
  } catch {
    /* a reason is optional */
  }

  const invoice = await prisma.invoice.findUnique({ where: { id } });
  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found." }, { status: 404 });
  }
  if (invoice.voidedAt) {
    return NextResponse.json({ error: "Already void." }, { status: 400 });
  }

  const voided = await prisma.invoice.update({
    where: { id },
    data: {
      voidedAt: new Date(),
      voidedBy: "admin",
      voidReason: reason || null,
    },
  });

  return NextResponse.json({
    invoice: {
      id: voided.id,
      invoiceNumber: voided.invoiceNumber,
      total: String(voided.total),
      issuedAt: voided.issuedAt.toISOString(),
      emailSentAt: voided.emailSentAt?.toISOString() ?? null,
      emailSentTo: voided.emailSentTo,
      chatSentAt: voided.chatSentAt?.toISOString() ?? null,
      voidedAt: voided.voidedAt?.toISOString() ?? null,
      voidReason: voided.voidReason,
      status: "VOID" as const,
    },
  });
}
