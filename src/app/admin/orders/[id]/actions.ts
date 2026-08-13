"use server";

import { revalidatePath } from "next/cache";
import { Prisma, OrderStatus, SettlementState } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { canTransition, ORDER_STATUS_LABEL } from "@/lib/order-status";

// Reached only from /admin/orders/*, covered by the middleware guard
// (src/middleware.ts matcher: /admin/:path*).

// Until admin accounts exist (P01) every action is attributed to the single
// shared operator. The column is populated now so the history isn't lost.
const OPERATOR = "admin";

export interface ActionResult {
  ok: boolean;
  error?: string;
}

function revalidateOrder(id: string) {
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
  revalidatePath("/admin");
}

/**
 * Advance the order lifecycle. The transition map is enforced HERE, not in the
 * UI — the buttons are a convenience, this is the rule.
 */
export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
): Promise<ActionResult> {
  if (!id) return { ok: false, error: "Missing order id." };
  if (!Object.values(OrderStatus).includes(status)) {
    return { ok: false, error: `Unknown status: ${status}` };
  }

  const existing = await prisma.order.findUnique({
    where: { id },
    select: { status: true },
  });
  if (!existing) return { ok: false, error: "Order not found." };

  // Idempotent: re-submitting the state it's already in is a no-op, not an
  // error. Double-clicking "Mark shipped" shouldn't scold the operator.
  if (existing.status === status) {
    revalidateOrder(id);
    return { ok: true };
  }

  if (!canTransition(existing.status, status)) {
    return {
      ok: false,
      error: `Can't go from ${ORDER_STATUS_LABEL[existing.status]} to ${ORDER_STATUS_LABEL[status]}. Reload the page — someone may have already changed this order.`,
    };
  }

  await prisma.order.update({ where: { id }, data: { status } });
  revalidateOrder(id);
  return { ok: true };
}

export async function updateOrderNotes(id: string, formData: FormData) {
  if (!id) throw new Error("Missing order id.");
  const raw = formData.get("notes");
  const notes = typeof raw === "string" ? raw.trim() : "";

  await prisma.order.update({
    where: { id },
    data: { notes: notes.length > 0 ? notes : null },
  });

  revalidatePath(`/admin/orders/${id}`);
}

// --- Settlement ------------------------------------------------------------

export type SettlementAction = "record-proof" | "mark-paid" | "reject";

/**
 * The manual payment handshake, discriminated by `action`.
 *
 * `record-proof` — the buyer replied with a reference; log it for verification.
 * `mark-paid`    — money confirmed. Writes settlement state AND the order
 *                  lifecycle in one transaction, so the two can never disagree.
 * `reject`       — the reference didn't check out. Returns the order to
 *                  awaiting-payment with the reason preserved so the buyer can
 *                  try again; deliberately NOT the same as cancelling.
 */
export async function updateSettlement(
  id: string,
  formData: FormData,
): Promise<ActionResult> {
  const action = String(formData.get("action") ?? "") as SettlementAction;
  if (!["record-proof", "mark-paid", "reject"].includes(action)) {
    return { ok: false, error: "Unknown settlement action." };
  }

  const order = await prisma.order.findUnique({
    where: { id },
    select: { status: true, settlementState: true, total: true },
  });
  if (!order) return { ok: false, error: "Order not found." };

  if (order.status !== "PENDING") {
    return {
      ok: false,
      error: `This order is ${ORDER_STATUS_LABEL[order.status].toLowerCase()} — the payment handshake is already finished.`,
    };
  }

  const reference = String(formData.get("paymentReference") ?? "").trim();
  const noteRaw = String(formData.get("settlementNote") ?? "").trim();
  const amountRaw = String(formData.get("amountReceived") ?? "").trim();

  let amountReceived: Prisma.Decimal | null = null;
  if (amountRaw) {
    const n = Number(amountRaw);
    if (!Number.isFinite(n) || n < 0) {
      return { ok: false, error: "Amount received must be a positive number." };
    }
    amountReceived = new Prisma.Decimal(n.toFixed(2));
  }

  const common = {
    settlementUpdatedAt: new Date(),
    settlementUpdatedBy: OPERATOR,
    ...(reference ? { paymentReference: reference } : {}),
    ...(noteRaw ? { settlementNote: noteRaw } : {}),
    ...(amountReceived ? { amountReceived } : {}),
  };

  if (action === "record-proof") {
    if (!reference) {
      return {
        ok: false,
        error: "Enter the reference the customer sent (transaction id, Chime confirmation, etc.).",
      };
    }
    await prisma.order.update({
      where: { id },
      data: { ...common, settlementState: SettlementState.PROOF_SUBMITTED },
    });
  }

  if (action === "mark-paid") {
    // Settlement state and lifecycle status move together, in one write, so a
    // crash between them can't leave the order "confirmed but unpaid".
    await prisma.order.update({
      where: { id },
      data: {
        ...common,
        settlementState: SettlementState.PAID,
        status: OrderStatus.PAID,
      },
    });
  }

  if (action === "reject") {
    if (!noteRaw) {
      return {
        ok: false,
        error: "Give a reason for rejecting — it's the only record of why, and the customer will ask.",
      };
    }
    await prisma.order.update({
      where: { id },
      data: { ...common, settlementState: SettlementState.REJECTED },
    });
  }

  revalidateOrder(id);
  return { ok: true };
}
