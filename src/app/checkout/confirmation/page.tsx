import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { toOrderSnapshot, type OrderSnapshot } from "@/lib/order-snapshot";
import ConfirmationClient from "./ConfirmationClient";

export const metadata = {
  title: "Order Confirmed | Bourbon & Oak",
  description: "Your order has been placed.",
  robots: { index: false, follow: false },
};

// The order is read per-request; never cache one customer's confirmation.
export const dynamic = "force-dynamic";

export default async function ConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order: orderNumber } = await searchParams;

  // Resolve the order on the server so the confirmation paints with the rest
  // of the page. Without this the client mounted, fetched over HTTP, and
  // rendered null in the meantime — which is why the navbar and footer
  // appeared first with a blank gap between them.
  let initialOrder: OrderSnapshot | null = null;
  if (orderNumber) {
    try {
      const row = await prisma.order.findUnique({
        where: { orderNumber },
        include: { items: true },
      });
      if (row) initialOrder = toOrderSnapshot(row);
    } catch (err) {
      // Fall through to the client fallback rather than erroring the page —
      // the customer has just paid and must still see something useful.
      console.error("[confirmation] order lookup failed:", err);
    }
  }

  return (
    <Suspense fallback={null}>
      <ConfirmationClient initialOrder={initialOrder} />
    </Suspense>
  );
}
