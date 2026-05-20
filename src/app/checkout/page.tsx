import CheckoutClient from "./CheckoutClient";

export const metadata = {
  title: "Checkout | Bourbon & Oak",
  description:
    "Complete your order — contact info, delivery, shipping carrier, and payment (10% off with crypto).",
};

export default function CheckoutPage() {
  return <CheckoutClient />;
}
