import { NextRequest, NextResponse } from "next/server";
import { Prisma, PaymentMethod, ShippingMethod } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { findOrCreateCustomer } from "@/lib/customer-auth";
import { sendEmail } from "@/lib/mailer";
import { ageLabel } from "@/lib/product-format";
import {
  buildCustomerOrderEmail,
  buildSalesOrderEmail,
} from "@/lib/emails/orderEmails";

type ShippingId = "standard" | "express" | "overnight" | "white-glove";
type PaymentId = "card" | "paypal" | "chime" | "apple-pay" | "crypto";

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
  // Shipping is no longer selectable and is always free, so nothing about it
  // is validated against the request any more — see below where it's forced.
  if (!payment?.id) {
    return badRequest("Invalid payment method.");
  }
  if (!Array.isArray(items) || items.length === 0) {
    return badRequest("Order must contain at least one item.");
  }

  // Forced, not read from the request: every order ships free under the one
  // remaining method. The column stays so historical orders keep their real
  // carrier and charge.
  const shippingMethod: ShippingMethod = "STANDARD";

  // Resolve the payment rail from the database, not from the request. This is
  // what makes the discount trustworthy: the client tells us WHICH method was
  // chosen, never what it's worth.
  const option = await prisma.paymentOption.findFirst({
    where: { key: payment.id, isActive: true },
  });
  if (!option) {
    return badRequest("That payment method is no longer available.");
  }
  const paymentMethod: PaymentMethod =
    option.legacyMethod ?? PAYMENT_MAP[payment.id as PaymentId] ?? "OTHER";
  const resolvedDiscountRate = Number(option.discountRate);

  // --- Price every line from the catalogue, never from the request ---------
  //
  // Until now `unitPrice`, `subtotal` and `total` were written straight from
  // the request body, so a crafted POST could buy a $750 bottle for $1. The
  // client now only says WHICH product and HOW MANY; every figure below is
  // derived here.
  //
  // Cart ids carry a "::case" suffix for case purchases (see
  // ProductDetailClient), so the suffix decides which price applies and is
  // stripped before the product lookup.
  const parsedLines = items.map((it) => {
    const rawId = String(it.id ?? "");
    const isCase = rawId.endsWith("::case");
    return {
      productId: isCase ? rawId.slice(0, -"::case".length) : rawId,
      isCase,
      quantity: Math.max(1, Math.floor(Number(it.quantity ?? 1))),
      image: String(it.image ?? ""),
    };
  });

  if (parsedLines.some((l) => !l.productId)) {
    return badRequest("Every item must reference a product.");
  }

  const products = await prisma.product.findMany({
    where: { id: { in: [...new Set(parsedLines.map((l) => l.productId))] } },
    include: {
      images: { orderBy: { sortOrder: "asc" }, take: 1 },
    },
  });
  const productById = new Map(products.map((p) => [p.id, p]));

  const missing = parsedLines.filter((l) => !productById.has(l.productId));
  if (missing.length > 0) {
    return badRequest(
      "One or more items are no longer available. Please refresh your cart and try again.",
    );
  }

  const resolvedLines = [];
  for (const line of parsedLines) {
    const product = productById.get(line.productId)!;

    // A case price is only honoured when the product actually sells by the
    // case; otherwise fall back to the bottle price rather than inventing one.
    const sellsCases = product.casePrice !== null && product.bottlesPerCase !== null;
    if (line.isCase && !sellsCases) {
      return badRequest(
        `${product.name} is not sold by the case. Please refresh your cart and try again.`,
      );
    }

    const unitPrice = line.isCase
      ? Number(product.casePrice)
      : Number(product.bottlePrice);

    resolvedLines.push({
      productId: product.id,
      productName:
        line.isCase && product.bottlesPerCase
          ? `${product.name} — Case of ${product.bottlesPerCase}`
          : product.name,
      productImage: line.image || product.images[0]?.url || "",
      ageLabel: ageLabel(product.ageYears),
      unitPrice,
      quantity: line.quantity,
      isCase: line.isCase,
    });
  }

  // Round to cents at each step so the stored figures add up exactly.
  const round2 = (n: number) => Math.round(n * 100) / 100;
  const computedSubtotal = round2(
    resolvedLines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0),
  );
  const computedDiscount = round2(computedSubtotal * resolvedDiscountRate);
  // Shipping and tax are both zero now; kept explicit so the arithmetic below
  // stays obvious if either ever comes back.
  const computedShipping = 0;
  const computedTax = 0;
  const computedTotal = round2(
    Math.max(0, computedSubtotal - computedDiscount) +
      computedShipping +
      computedTax,
  );

  // The client's own figures are ignored, but a mismatch means the buyer was
  // shown a different price than they're being charged — worth knowing about.
  const clientTotal = Number(totals?.total ?? NaN);
  if (Number.isFinite(clientTotal) && Math.abs(clientTotal - computedTotal) >= 0.01) {
    console.warn(
      `[orders] total mismatch on ${orderNumber}: client sent ${clientTotal}, server computed ${computedTotal}`,
    );
  }

  // First order for an email address creates the account. Later orders refresh
  // the prefill details. Never fatal: an account problem must not cost an order.
  let customerId: string | null = null;
  try {
    const customer = await findOrCreateCustomer(email, {
      fullName: address.fullName?.trim(),
      phone: phone || null,
      addressLine1: address.line1?.trim(),
      addressLine2: address.line2?.trim() || null,
      city: address.city?.trim(),
      region: address.region?.trim(),
      postal: address.postal?.trim(),
      country: address.country?.trim(),
    });
    customerId = customer.id;
  } catch (err) {
    console.error("[orders] could not attach customer account:", err);
  }

  try {
    const createdOrder = await prisma.order.create({
      data: {
        orderNumber,
        status: "PENDING",
        email,
        customerId,
        phone,
        fullName: address.fullName!.trim(),
        addressLine1: address.line1!.trim(),
        addressLine2: address.line2?.trim() || null,
        city: address.city!.trim(),
        region: address.region!.trim(),
        postal: address.postal!.trim(),
        country: address.country!.trim(),
        shippingMethod,
        // Always free — never taken from the client.
        shippingCost: new Prisma.Decimal(0),
        paymentMethod,
        // Rate comes from the PaymentOption row, never from the request body.
        discountRate: new Prisma.Decimal(resolvedDiscountRate),
        // Snapshot the rail as the customer saw it. Editing a wallet address
        // later must never rewrite what an earlier buyer was told to pay.
        paymentOptionKey: option.key,
        paymentLabel: option.label,
        paymentInstructions: option.instructions,
        // Every figure below is computed from the catalogue above.
        subtotal: new Prisma.Decimal(computedSubtotal),
        discount: new Prisma.Decimal(computedDiscount),
        // Tax removed from the storefront — the column stays so historical
        // orders keep their figures, but new orders are always 0.
        tax: new Prisma.Decimal(computedTax),
        total: new Prisma.Decimal(computedTotal),
        items: {
          create: resolvedLines.map((l) => ({
            productId: l.productId,
            productName: l.productName,
            productImage: l.productImage,
            ageLabel: l.ageLabel,
            unitPrice: new Prisma.Decimal(l.unitPrice),
            quantity: l.quantity,
            // Was hardcoded false, so case orders were recorded as bottles.
            isCase: l.isCase,
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
        // No shippingMethodLabel: shipping is free and no longer shown to the
        // customer, so the email omits the delivery block entirely.
        // Label and details come from the resolved rail, so a newly added
        // method works in email without a code change.
        paymentMethodLabel: option.label,
        paymentInstructions: option.instructions,
        // Same resolved lines the order was written from, so the email can
        // never quote a different price than the database holds.
        items: resolvedLines.map((l) => ({
          name: l.productName,
          ageLabel: l.ageLabel,
          quantity: l.quantity,
          unitPrice: l.unitPrice,
          image: l.productImage,
        })),
        totals: {
          subtotal: computedSubtotal,
          discount: computedDiscount,
          shippingCost: computedShipping,
          tax: computedTax,
          total: computedTotal,
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
