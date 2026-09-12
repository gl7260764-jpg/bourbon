import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { ADMIN_COOKIE, expectedTokenForCurrentPassword } from "@/lib/admin-auth";
import { getCurrentCustomer } from "@/lib/customer-auth";
import { snapshotOf } from "@/lib/invoice";
import { renderInvoiceHtml } from "@/lib/invoice-template";

export const dynamic = "force-dynamic";

/* An invoice is one person's private document. Keep it out of search results
   even if a URL leaks — the numbers are sequential. */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "Invoice — Bourbon & Oak",
};

async function isAdmin(): Promise<boolean> {
  const jar = await cookies();
  const token = jar.get(ADMIN_COOKIE)?.value;
  if (!token) return false;
  const expected = await expectedTokenForCurrentPassword();
  return Boolean(expected && token === expected);
}

export default async function InvoicePage({
  params,
}: {
  params: Promise<{ number: string }>;
}) {
  const { number } = await params;

  const invoice = await prisma.invoice.findUnique({
    where: { invoiceNumber: number },
    include: { order: { select: { customerId: true, email: true } } },
  });
  if (!invoice) notFound();

  if (!(await isAdmin())) {
    const customer = await getCurrentCustomer();
    const ownsIt =
      customer &&
      (invoice.order.customerId === customer.id ||
        invoice.order.email.toLowerCase() === customer.email.toLowerCase());
    // 404 rather than a sign-in prompt: confirming the invoice exists is
    // itself a leak, and the number is guessable.
    if (!ownsIt) notFound();
  }

  const snap = snapshotOf(invoice);

  return (
    <main className="bg-[#e8e6e1] min-h-screen pt-24 sm:pt-28 pb-12">
      <div className="max-w-[794px] mx-auto px-3 mb-4 flex flex-wrap items-center justify-between gap-3">
        <a
          href="/account"
          className="text-bourbon-stone text-xs tracking-widest uppercase hover:text-bourbon-deep transition-colors"
        >
          ← Back to your account
        </a>
        <a
          href={`/api/invoices/${snap.invoiceNumber}/pdf`}
          target="_blank"
          rel="noopener"
          className="px-5 py-2.5 bg-bourbon-gold text-bourbon-deep text-[11px] font-semibold tracking-widest uppercase hover:bg-bourbon-amber transition-colors"
        >
          Download PDF
        </a>
      </div>

      {/* The document itself, from the same template the email embeds. */}
      <div
        className="overflow-x-auto"
        dangerouslySetInnerHTML={{ __html: renderInvoiceHtml(snap) }}
      />
    </main>
  );
}
