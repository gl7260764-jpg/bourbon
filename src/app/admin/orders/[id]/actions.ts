"use server";

import { revalidatePath } from "next/cache";
import { Prisma, OrderStatus, SettlementState } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { canTransition, ORDER_STATUS_LABEL } from "@/lib/order-status";
import { notifyPaymentDetailsIssued } from "@/lib/emails/paymentDetailsEmail";
import { sendToCustomer } from "@/lib/push";

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

/**
 * Issue the payment details for one order.
 *
 * This is the step the whole manual-settlement flow now hangs off: until an
 * operator writes these, the buyer sees "details on the way" rather than a
 * payment form, and cannot upload a receipt for money they were never told
 * where to send. Kept separate from `paymentInstructions`, which is the
 * immutable snapshot of the rail as it stood at checkout.
 */
export async function issuePaymentDetails(
  id: string,
  formData: FormData,
): Promise<ActionResult> {
  const body = String(formData.get("paymentDetailsBody") ?? "").trim();
  if (body.length < 10) {
    return {
      ok: false,
      error:
        "Write the actual details the buyer should pay against — account or wallet, and the reference to quote.",
    };
  }
  if (body.length > 4000) {
    return { ok: false, error: "Payment details are too long (4000 characters max)." };
  }

  const order = await prisma.order.findUnique({
    where: { id },
    select: {
      status: true,
      settlementState: true,
      email: true,
      orderNumber: true,
      total: true,
      customerId: true,
      paymentDetailsIssuedAt: true,
    },
  });
  if (!order) return { ok: false, error: "Order not found." };
  if (order.status !== "PENDING") {
    return {
      ok: false,
      error: `This order is ${ORDER_STATUS_LABEL[order.status].toLowerCase()} — payment details are no longer relevant.`,
    };
  }

  /* Re-issuing is allowed (a wrong account number has to be fixable) but it
     must not drag a paid or rejected order backwards. Only an order still
     waiting on the buyer moves state. */
  const nextState =
    order.settlementState === "AWAITING_DETAILS"
      ? SettlementState.AWAITING_PAYMENT
      : order.settlementState;

  await prisma.order.update({
    where: { id },
    data: {
      paymentDetailsBody: body,
      paymentDetailsIssuedAt: new Date(),
      paymentDetailsIssuedBy: OPERATOR,
      settlementState: nextState,
    },
  });

  /* Tell the buyer, two ways, neither of which is allowed to fail the write.
     The details are issued regardless and the dashboard is the source of
     truth — a buyer who never enabled notifications simply opens the
     dashboard and sees them, which is why nothing here is awaited into the
     result. */
  try {
    await notifyPaymentDetailsIssued({
      email: order.email,
      orderNumber: order.orderNumber,
      total: Number(order.total),
      reissued: order.paymentDetailsIssuedAt !== null,
    });
  } catch (err) {
    console.error("[issuePaymentDetails] email failed:", err);
  }

  if (order.customerId) {
    try {
      await sendToCustomer(order.customerId, {
        title: order.paymentDetailsIssuedAt
          ? `Updated payment details — ${order.orderNumber}`
          : `Payment details ready — ${order.orderNumber}`,
        body: `Open your dashboard to see where to send $${Number(order.total).toFixed(2)}.`,
        url: "/account",
        // Same tag per order, so re-issuing replaces the old notification in
        // the tray instead of stacking a second one.
        tag: `order-${order.orderNumber}-payment`,
      });
    } catch (err) {
      console.error("[issuePaymentDetails] push failed:", err);
    }
  }

  revalidateOrder(id);
  return { ok: true };
}
