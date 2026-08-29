import { redirect } from "next/navigation";
import { getCurrentCustomer, isValidEmail, normalizeEmail } from "@/lib/customer-auth";
import LoginForm from "./LoginForm";
import { getAuthMode } from "@/lib/settings";

export const metadata = {
  title: "Sign in | Bourbon & Oak",
  // Account pages are private and must never be indexed.
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AccountLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; link?: string }>;
}) {
  const customer = await getCurrentCustomer();
  if (customer) redirect("/account");

  /* The confirmation page hands the order's email across so a buyer coming
     straight from checkout never retypes what they just entered. Validated
     here rather than trusted: it arrives in a URL anyone can edit, and it only
     ever prefills the field — the emailed code is still what grants the
     session, so a forged value gets someone nothing. */
  const { email: raw, link } = await searchParams;
  const initialEmail = raw && isValidEmail(raw) ? normalizeEmail(raw) : "";
  const mode = await getAuthMode();

  /* /account/login/link redirects here when a one-click link does not work,
     rather than rendering an error at a URL that still holds the token. */
  const linkError =
    link === "expired"
      ? "That sign-in link has expired. Enter your email for a fresh one."
      : link === "used"
        ? "That sign-in link has already been used. Enter your email for a fresh one."
        : link === "invalid"
          ? "That sign-in link isn't valid. Enter your email for a fresh one."
          : link === "error"
            ? "Something went wrong opening that link. Please try again."
            : null;

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
            {mode === "EMAIL_ONLY"
              ? "Enter the email you ordered with."
              : initialEmail
                ? mode === "LINK"
                  ? "We'll email you a link that signs you straight in."
                  : "We'll email you a code to confirm it's you."
                : "Track your orders, send us a payment receipt, and keep your delivery details for next time."}
          </p>
        </div>

        {linkError && (
          <p className="mb-4 border border-amber-300 bg-amber-50 text-amber-900 text-sm p-3.5" role="alert">
            {linkError}
          </p>
        )}

        <div className="bg-white border border-bourbon-deep/10 p-6 sm:p-8">
          <LoginForm initialEmail={initialEmail} mode={mode} />
        </div>

        <p className="text-bourbon-stone text-xs text-center mt-6">
          Your account is created automatically with your first order.
        </p>
      </div>
    </main>
  );
}
