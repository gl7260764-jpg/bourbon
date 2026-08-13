import { prisma } from "@/lib/prisma";
import PaymentMethodsClient, { type PaymentOptionRow } from "./PaymentMethodsClient";

export const metadata = { title: "Payment methods | Admin" };
export const dynamic = "force-dynamic";

export default async function AdminPaymentMethodsPage() {
  const options = await prisma.paymentOption.findMany({
    orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
  });

  // How many orders each rail has taken — shown so the operator knows what
  // turning one off actually affects, and why delete may be refused.
  const counts = await prisma.order.groupBy({
    by: ["paymentOptionKey"],
    _count: { _all: true },
    where: { paymentOptionKey: { not: null } },
  });
  const countByKey = new Map(
    counts.map((c) => [c.paymentOptionKey!, c._count._all]),
  );

  const rows: PaymentOptionRow[] = options.map((o) => ({
    id: o.id,
    key: o.key,
    label: o.label,
    detail: o.detail,
    instructions: o.instructions,
    discountRate: Number(o.discountRate),
    isActive: o.isActive,
    sortOrder: o.sortOrder,
    orderCount: countByKey.get(o.key) ?? 0,
  }));

  const missingDetails = rows.filter((r) => r.isActive && !r.instructions).length;

  return (
    <>
      <div className="mb-8">
        <p className="text-bourbon-gold text-xs tracking-[0.3em] uppercase mb-2">
          Selling
        </p>
        <h1 className="font-[family-name:var(--font-playfair)] text-3xl sm:text-4xl font-bold text-bourbon-deep">
          Payment methods
        </h1>
        <p className="text-bourbon-stone text-sm mt-2">
          What customers can pay with, and the account details they receive once
          they order. Changes go live immediately — no deploy needed.
        </p>
      </div>

      {missingDetails > 0 && (
        <p className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-sm">
          <strong>{missingDetails}</strong> live payment method
          {missingDetails === 1 ? " has" : "s have"} no account details set.
          Customers choosing {missingDetails === 1 ? "it" : "them"} are told the
          method exists but not where to send the money.
        </p>
      )}

      <PaymentMethodsClient options={rows} />
    </>
  );
}
