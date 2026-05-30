import CheckoutClient from "./CheckoutClient";

export const metadata = {
  title: "Checkout | Bourbon & Oak",
  description:
    "Complete your order — contact info, delivery, shipping carrier, and payment (10% off with crypto).",
  robots: { index: false, follow: false },
};

export default function CheckoutPage() {
  return <CheckoutClient />;
}
