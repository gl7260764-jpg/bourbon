// The customer-facing shape of an order, shared by the confirmation page
// (server-rendered) and GET /api/orders/[orderNumber] (used by the client
// fallback). Previously this mapping lived only in the API route, which forced
// the confirmation page to fetch over HTTP after mount — the reason the navbar
// and footer painted before the order did.

import type { Order, OrderItem, PaymentMethod, ShippingMethod } from "@prisma/client";

const SHIPPING_REVERSE: Record<
  ShippingMethod,
  "standard" | "express" | "overnight" | "white-glove"
> = {
  STANDARD: "standard",
  EXPRESS: "express",
  OVERNIGHT: "overnight",
  WHITE_GLOVE: "white-glove",
};

// Widened to string: operator-added rails have no fixed enum counterpart, and
// the authoritative key is Order.paymentOptionKey anyway.
const PAYMENT_REVERSE: Record<PaymentMethod, string> = {
  CARD: "card",
  PAYPAL: "paypal",
  CHIME: "chime",
  APPLE_PAY: "apple-pay",
  CRYPTO: "crypto",
  OTHER: "other",
};

const SHIPPING_LABELS: Record<
  ShippingMethod,
  { label: string; detail: string }
> = {
  STANDARD: { label: "Standard Ground", detail: "5–7 business days" },
  EXPRESS: { label: "Express", detail: "2–3 business days" },
  OVERNIGHT: { label: "Overnight", detail: "Next business day" },
  WHITE_GLOVE: {
    label: "White Glove International",
    detail: "Signature, climate-controlled · 7–14 days",
  },
};

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  CARD: "Credit or Debit Card",
  PAYPAL: "PayPal",
  CHIME: "Chime",
  APPLE_PAY: "Apple Pay",
  CRYPTO: "Cryptocurrency",
  OTHER: "Other",
};

export interface OrderSnapshot {
  orderNumber: string;
  placedAt: string;
  status?: string;
  /** Whether a payment screenshot is already on file. The image itself is
   *  private and never exposed to the customer's view. */
  hasPaymentProof?: boolean;
  contact: { email: string; phone: string };
  address: {
    fullName: string;
    line1: string;
    line2: string;
    city: string;
    region: string;
    postal: string;
    country: string;
  };
  shipping: {
    id: "standard" | "express" | "overnight" | "white-glove";
    label: string;
    detail: string;
    cost: number;
  };
  payment: {
    id: string;
    label: string;
    discountRate: number;
    instructions?: string | null;
  };
  items: {
    id: string;
    name: string;
    image: string;
    age: string | null;
    price: number;
    quantity: number;
  }[];
  totals: {
    subtotal: number;
    discount: number;
    shippingCost: number;
    tax: number;
    total: number;
  };
}

export function toOrderSnapshot(
  order: Order & { items: OrderItem[] },
): OrderSnapshot {
  const shippingInfo = SHIPPING_LABELS[order.shippingMethod];

  return {
    orderNumber: order.orderNumber,
    placedAt: order.createdAt.toISOString(),
    status: order.status,
    hasPaymentProof: order.paymentProofPublicId !== null,
    contact: { email: order.email, phone: order.phone },
    address: {
      fullName: order.fullName,
      line1: order.addressLine1,
      line2: order.addressLine2 ?? "",
      city: order.city,
      region: order.region,
      postal: order.postal,
      country: order.country,
    },
    shipping: {
      id: SHIPPING_REVERSE[order.shippingMethod],
      label: shippingInfo.label,
      detail: shippingInfo.detail,
      cost: Number(order.shippingCost),
    },
    payment: {
      // Prefer the snapshot taken at order time — it's the only thing that
      // knows about operator-added rails, and it can't drift if the method is
      // renamed later.
      id: order.paymentOptionKey ?? PAYMENT_REVERSE[order.paymentMethod],
      label: order.paymentLabel ?? PAYMENT_LABELS[order.paymentMethod],
      discountRate: Number(order.discountRate),
      // Account details as they were when this customer ordered.
      instructions: order.paymentInstructions,
    },
    items: order.items.map((it) => ({
      id: it.id,
      name: it.productName,
      image: it.productImage,
      age: it.ageLabel,
      price: Number(it.unitPrice),
      quantity: it.quantity,
    })),
    totals: {
      subtotal: Number(order.subtotal),
      discount: Number(order.discount),
      shippingCost: Number(order.shippingCost),
      tax: Number(order.tax),
      total: Number(order.total),
    },
  };
}
