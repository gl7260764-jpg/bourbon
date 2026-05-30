import { Suspense } from "react";
import ConfirmationClient from "./ConfirmationClient";

export const metadata = {
  title: "Order Confirmed | Bourbon & Oak",
  description: "Your order has been placed.",
  robots: { index: false, follow: false },
};

export default function ConfirmationPage() {
  return (
    <Suspense fallback={null}>
      <ConfirmationClient />
    </Suspense>
  );
}
