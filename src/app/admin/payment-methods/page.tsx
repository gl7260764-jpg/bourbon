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
    discountRate: Number(o.discountRate),
    isActive: o.isActive,
    sortOrder: o.sortOrder,
    orderCount: countByKey.get(o.key) ?? 0,
  }));


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
          What customers can pay with at checkout. Changes go live immediately —
          no deploy needed.
        </p>
      </div>

      <p className="mb-6 p-4 bg-bourbon-gold/10 border border-bourbon-gold/30 text-bourbon-deep text-sm">
        These rails are the <strong>choices</strong> shown at checkout &mdash; they
        carry no account details. After an order is placed you open it under{" "}
        <strong>Orders</strong> and send that buyer their payment details, which
        is the only place the details are ever shown. Nothing here is emailed.
      </p>

      <PaymentMethodsClient options={rows} />
    </>
  );
}
