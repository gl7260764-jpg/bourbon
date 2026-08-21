import { redirect } from "next/navigation";
import { getCurrentCustomer, isValidEmail, normalizeEmail } from "@/lib/customer-auth";
import LoginForm from "./LoginForm";

export const metadata = {
  title: "Sign in | Bourbon & Oak",
  // Account pages are private and must never be indexed.
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AccountLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const customer = await getCurrentCustomer();
  if (customer) redirect("/account");

  /* The confirmation page hands the order's email across so a buyer coming
     straight from checkout never retypes what they just entered. Validated
     here rather than trusted: it arrives in a URL anyone can edit, and it only
     ever prefills the field — the emailed code is still what grants the
     session, so a forged value gets someone nothing. */
  const { email: raw } = await searchParams;
  const initialEmail = raw && isValidEmail(raw) ? normalizeEmail(raw) : "";

  return (
    <main className="bg-bourbon-cream min-h-screen pt-24 sm:pt-32 pb-20 px-4">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <p className="text-bourbon-gold text-xs tracking-[0.3em] uppercase mb-3">
            Your account
          </p>
          <h1 className="font-[family-name:var(--font-playfair)] text-3xl sm:text-4xl font-bold text-bourbon-deep mb-3">
            Sign in
          </h1>
          <p className="text-bourbon-stone text-sm">
            {initialEmail
              ? "We'll email you a code to confirm it's you."
              : "Track your orders, send us a payment receipt, and keep your delivery details for next time."}
          </p>
        </div>

        <div className="bg-white border border-bourbon-deep/10 p-6 sm:p-8">
          <LoginForm initialEmail={initialEmail} />
        </div>

        <p className="text-bourbon-stone text-xs text-center mt-6">
          Your account is created automatically with your first order.
        </p>
      </div>
    </main>
  );
}
