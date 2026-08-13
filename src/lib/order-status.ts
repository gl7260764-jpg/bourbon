// The order lifecycle, in one place.
//
// Before this existed the legal-transition map lived only in the order detail
// page — it decided which buttons to render, but the server action accepted
// any status at all. A stale tab, a double submit, or a hand-rolled request
// could drive an order REFUNDED -> PENDING. The map below is now the
// authority; the UI derives its buttons from the same constant, so the two
// can't drift.
//
// Client-safe: types and pure functions only.

import type { OrderStatus, SettlementState } from "@prisma/client";

/** Which statuses may follow a given status. Terminal states have none. */
export const LEGAL_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["PAID", "CANCELLED"],
  PAID: ["SHIPPED", "REFUNDED", "CANCELLED"],
  SHIPPED: ["DELIVERED", "REFUNDED"],
  DELIVERED: ["REFUNDED"],
  CANCELLED: [],
  REFUNDED: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return LEGAL_TRANSITIONS[from].includes(to);
}

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: "Pending",
  PAID: "Paid",
  SHIPPED: "Shipped",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
};

// Semantic colours: emerald = settled, amber = waiting, sky = in progress,
// rose = failed/destructive, zinc = neutral.
export const ORDER_STATUS_BADGE: Record<OrderStatus, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  PAID: "bg-emerald-100 text-emerald-800",
  SHIPPED: "bg-sky-100 text-sky-800",
  DELIVERED: "bg-emerald-100 text-emerald-900",
  CANCELLED: "bg-stone-200 text-stone-700",
  REFUNDED: "bg-rose-100 text-rose-800",
};

export const SETTLEMENT_LABEL: Record<SettlementState, string> = {
  AWAITING_PAYMENT: "Awaiting payment",
  PROOF_SUBMITTED: "Proof submitted — verify",
  PAID: "Payment confirmed",
  REJECTED: "Payment rejected",
};

export const SETTLEMENT_BADGE: Record<SettlementState, string> = {
  AWAITING_PAYMENT: "bg-amber-100 text-amber-800",
  PROOF_SUBMITTED: "bg-sky-100 text-sky-800",
  PAID: "bg-emerald-100 text-emerald-800",
  REJECTED: "bg-rose-100 text-rose-800",
};

/**
 * Settlement only means anything while the order is still awaiting money.
 * Once an order is shipped, delivered, cancelled or refunded, the payment
 * handshake is history and the panel should stop offering actions.
 */
export function settlementIsActionable(status: OrderStatus): boolean {
  return status === "PENDING";
}

export interface StatusAction {
  label: string;
  next: OrderStatus;
  variant: "primary" | "secondary" | "danger";
}

const ACTION_META: Record<
  OrderStatus,
  { label: string; variant: StatusAction["variant"] }
> = {
  PAID: { label: "Mark paid", variant: "primary" },
  SHIPPED: { label: "Mark shipped", variant: "primary" },
  DELIVERED: { label: "Mark delivered", variant: "primary" },
  REFUNDED: { label: "Refund", variant: "secondary" },
  CANCELLED: { label: "Cancel order", variant: "danger" },
  PENDING: { label: "Reopen", variant: "secondary" },
};

/** Buttons to offer, derived from the same map the server enforces. */
export function actionsFor(status: OrderStatus): StatusAction[] {
  return LEGAL_TRANSITIONS[status].map((next) => ({
    next,
    label: ACTION_META[next].label,
    variant: ACTION_META[next].variant,
  }));
}
