import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentCustomer } from "@/lib/customer-auth";
import {
  ORDER_STATUS_BADGE,
  ORDER_STATUS_LABEL,
  SETTLEMENT_LABEL,
} from "@/lib/order-status";
import AccountClient, {
  type AccountDetails,
  type AccountOrder,
} from "./AccountClient";

export const metadata = {
  title: "Your account | Bourbon & Oak",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const customer = await getCurrentCustomer();
  if (!customer) redirect("/account/login");

  // Match on the account link AND the email, so orders placed before accounts
  // existed (customerId is null on those) still show up for their owner.
  const orders = await prisma.order.findMany({
    where: {
      OR: [{ customerId: customer.id }, { email: customer.email }],
    },
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });

  const mapped: AccountOrder[] = orders.map((o) => ({
    orderNumber: o.orderNumber,
    placedAt: o.createdAt.toISOString(),
    status: o.status,
    statusLabel: ORDER_STATUS_LABEL[o.status],
    statusBadge: ORDER_STATUS_BADGE[o.status],
    settlementLabel:
      o.status === "PENDING" ? SETTLEMENT_LABEL[o.settlementState] : null,
    total: Number(o.total),
    itemCount: o.items.reduce((n, i) => n + i.quantity, 0),
    items: o.items.map((i) => ({
      name: i.productName,
      quantity: i.quantity,
      unitPrice: Number(i.unitPrice),
    })),
    paymentDetails: o.paymentDetailsBody,
    paymentDetailsIssuedAt: o.paymentDetailsIssuedAt?.toISOString() ?? null,
    /* A receipt can only be uploaded once the buyer has actually been told
       where to send the money. Before that the upload box is not just useless,
       it invites a payment to nowhere. */
    canUploadProof:
      o.status === "PENDING" && o.paymentDetailsIssuedAt !== null,
    hasProof: o.paymentProofPublicId !== null,
  }));

  const details: AccountDetails = {
    email: customer.email,
    fullName: customer.fullName ?? "",
    phone: customer.phone ?? "",
    addressLine1: customer.addressLine1 ?? "",
    addressLine2: customer.addressLine2 ?? "",
    city: customer.city ?? "",
    region: customer.region ?? "",
    postal: customer.postal ?? "",
    country: customer.country ?? "",
  };

  return <AccountClient orders={mapped} details={details} />;
}
