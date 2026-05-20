import { NextRequest, NextResponse } from "next/server";
import { Prisma, PaymentMethod, ShippingMethod } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/mailer";
import {
  buildCustomerOrderEmail,
  buildSalesOrderEmail,
  shippingLabel,
  paymentLabel,
} from "@/lib/emails/orderEmails";

type ShippingId = "standard" | "express" | "overnight" | "white-glove";
type PaymentId = "card" | "paypal" | "chime" | "apple-pay" | "crypto";

const SHIPPING_MAP: Record<ShippingId, ShippingMethod> = {
  standard: "STANDARD",
  express: "EXPRESS",
  overnight: "OVERNIGHT",
  "white-glove": "WHITE_GLOVE",
};

const PAYMENT_MAP: Record<PaymentId, PaymentMethod> = {
  card: "CARD",
  paypal: "PAYPAL",
  chime: "CHIME",
  "apple-pay": "APPLE_PAY",
  crypto: "CRYPTO",
};

interface IncomingOrderItem {
  id?: string;
  name?: string;
  image?: string;
  age?: string | null;
  price?: number;
  quantity?: number;
}

interface IncomingOrder {
  orderNumber?: string;
  contact?: { email?: string; phone?: string };
  address?: {
    fullName?: string;
    line1?: string;
    line2?: string;
    city?: string;
    region?: string;
    postal?: string;
    country?: string;
  };
  shipping?: { id?: ShippingId; cost?: number };
  payment?: { id?: PaymentId; discountRate?: number };
  items?: IncomingOrderItem[];
  totals?: {
    subtotal?: number;
    discount?: number;
    shippingCost?: number;
    tax?: number;
    total?: number;
  };
}

function badRequest(error: string) {
  return NextResponse.json({ error }, { status: 400 });
}

export async function POST(req: NextRequest) {
  let body: IncomingOrder;
  try {
    body = (await req.json()) as IncomingOrder;
  } catch {
    return badRequest("Invalid JSON body.");
  }

  const orderNumber = body.orderNumber?.trim();
  const email = body.contact?.email?.trim();
  const phone = body.contact?.phone?.trim() ?? "";
  const address = body.address;
  const shipping = body.shipping;
  const payment = body.payment;
  const items = body.items ?? [];
  const totals = body.totals;

  if (!orderNumber) return badRequest("Missing orderNumber.");
  if (!email || !email.includes("@")) return badRequest("Valid email is required.");
  if (
    !address ||
    !address.fullName?.trim() ||
    !address.line1?.trim() ||
    !address.city?.trim() ||
    !address.region?.trim() ||
    !address.postal?.trim() ||
    !address.country?.trim()
  ) {
    return badRequest("Complete shipping address is required.");
  }
  if (!shipping?.id || !(shipping.id in SHIPPING_MAP)) {
    return badRequest("Invalid shipping method.");
  }
  if (!payment?.id || !(payment.id in PAYMENT_MAP)) {
    return badRequest("Invalid payment method.");
  }
  if (!Array.isArray(items) || items.length === 0) {
    return badRequest("Order must contain at least one item.");
  }
  if (!totals) return badRequest("Missing totals.");

  const shippingMethod = SHIPPING_MAP[shipping.id];
  const paymentMethod = PAYMENT_MAP[payment.id];

  try {
    const createdOrder = await prisma.order.create({
      data: {
        orderNumber,
        status: "PENDING",
        email,
        phone,
        fullName: address.fullName!.trim(),
        addressLine1: address.line1!.trim(),
        addressLine2: address.line2?.trim() || null,
        city: address.city!.trim(),
        region: address.region!.trim(),
        postal: address.postal!.trim(),
        country: address.country!.trim(),
        shippingMethod,
        shippingCost: new Prisma.Decimal(Number(shipping.cost ?? 0)),
        paymentMethod,
        discountRate: new Prisma.Decimal(Number(payment.discountRate ?? 0)),
        subtotal: new Prisma.Decimal(Number(totals.subtotal ?? 0)),
        discount: new Prisma.Decimal(Number(totals.discount ?? 0)),
        tax: new Prisma.Decimal(Number(totals.tax ?? 0)),
        total: new Prisma.Decimal(Number(totals.total ?? 0)),
        items: {
          create: items.map((it) => ({
            productId: it.id ?? null,
            productName: String(it.name ?? "Unnamed item"),
            productImage: String(it.image ?? ""),
            ageLabel: it.age ?? null,
            unitPrice: new Prisma.Decimal(Number(it.price ?? 0)),
            quantity: Math.max(1, Math.floor(Number(it.quantity ?? 1))),
            isCase: false,
          })),
        },
      },
    });

    try {
      const emailData = {
        orderNumber,
        placedAt: createdOrder.createdAt,
        customer: {
          fullName: address.fullName!.trim(),
          email,
          phone: phone || undefined,
        },
        shippingAddress: {
          line1: address.line1!.trim(),
          line2: address.line2?.trim() || undefined,
          city: address.city!.trim(),
          region: address.region!.trim(),
          postal: address.postal!.trim(),
          country: address.country!.trim(),
        },
        shippingMethodLabel: shippingLabel(shipping.id),
        paymentMethodLabel: paymentLabel(payment.id),
        items: items.map((it) => ({
          name: String(it.name ?? "Unnamed item"),
          ageLabel: it.age ?? null,
          quantity: Math.max(1, Math.floor(Number(it.quantity ?? 1))),
          unitPrice: Number(it.price ?? 0),
          image: it.image,
        })),
        totals: {
          subtotal: Number(totals.subtotal ?? 0),
          discount: Number(totals.discount ?? 0),
          shippingCost: Number(totals.shippingCost ?? shipping.cost ?? 0),
          tax: Number(totals.tax ?? 0),
          total: Number(totals.total ?? 0),
        },
      };

      const customerEmail = buildCustomerOrderEmail(emailData);
      const salesEmail = buildSalesOrderEmail(emailData);
      const salesTo = process.env.SALES_EMAIL || process.env.SMTP_USER!;

      const [customerResult, salesResult] = await Promise.allSettled([
        sendEmail({
          to: email,
          subject: customerEmail.subject,
          html: customerEmail.html,
          text: customerEmail.text,
        }),
        sendEmail({
          to: salesTo,
          subject: salesEmail.subject,
          html: salesEmail.html,
          text: salesEmail.text,
          replyTo: email,
        }),
      ]);

      const summarize = (label: string, to: string, r: PromiseSettledResult<boolean>) => {
        if (r.status === "rejected") {
          console.error(`[POST /api/orders] ${label} email rejected (to=${to}):`, r.reason);
        } else if (r.value === false) {
          console.error(`[POST /api/orders] ${label} email returned false (to=${to}) — see [mailer] logs above for SMTP details.`);
        } else {
          console.log(`[POST /api/orders] ${label} email sent (to=${to})`);
        }
      };
      summarize("customer", email, customerResult);
      summarize("sales", salesTo, salesResult);
    } catch (mailErr) {
      console.error("[POST /api/orders] email dispatch failed:", mailErr);
    }

    return NextResponse.json({ orderNumber }, { status: 201 });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json(
        { error: "Order number already exists." },
        { status: 409 }
      );
    }
    console.error("[POST /api/orders] failed:", err);
    return NextResponse.json(
      { error: "Could not save order. Please try again." },
      { status: 500 }
    );
  }
}
