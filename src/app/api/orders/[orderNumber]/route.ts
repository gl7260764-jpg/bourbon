import { NextResponse } from "next/server";
import { PaymentMethod, ShippingMethod } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const SHIPPING_REVERSE: Record<ShippingMethod, "standard" | "express" | "overnight" | "white-glove"> = {
  STANDARD: "standard",
  EXPRESS: "express",
  OVERNIGHT: "overnight",
  WHITE_GLOVE: "white-glove",
};

const PAYMENT_REVERSE: Record<PaymentMethod, "card" | "paypal" | "chime" | "apple-pay" | "crypto"> = {
  CARD: "card",
  PAYPAL: "paypal",
  CHIME: "chime",
  APPLE_PAY: "apple-pay",
  CRYPTO: "crypto",
};

const SHIPPING_LABELS: Record<ShippingMethod, { label: string; detail: string }> = {
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
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ orderNumber: string }> }
) {
  const { orderNumber } = await params;

  const order = await prisma.order.findUnique({
    where: { orderNumber },
    include: { items: true },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  const shippingInfo = SHIPPING_LABELS[order.shippingMethod];

  const snapshot = {
    orderNumber: order.orderNumber,
    placedAt: order.createdAt.toISOString(),
    status: order.status,
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
      id: PAYMENT_REVERSE[order.paymentMethod],
      label: PAYMENT_LABELS[order.paymentMethod],
      discountRate: Number(order.discountRate),
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

  return NextResponse.json(snapshot);
}
