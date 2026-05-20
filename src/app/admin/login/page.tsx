import Link from "next/link";
import { login } from "./actions";

export const metadata = { title: "Admin Login | Bourbon & Oak" };

interface PageProps {
  searchParams: Promise<{ error?: string; from?: string }>;
}

export default async function AdminLoginPage({ searchParams }: PageProps) {
  const { error, from } = await searchParams;

  const errorMessage =
    error === "wrong"
      ? "Wrong password. Try again."
      : error === "unconfigured"
        ? "Admin not configured: set BOURBON_ADMIN_PASSWORD in .env."
        : null;

  return (
    <main className="min-h-screen bg-bourbon-deep flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <Link
          href="/"
          className="block text-center mb-10"
        >
          <span className="font-[family-name:var(--font-playfair)] text-bourbon-cream text-2xl font-bold tracking-wide">
            Bourbon & Oak
          </span>
          <span className="block text-bourbon-gold text-[10px] tracking-[0.4em] uppercase mt-1">
            Cellar Admin
          </span>
        </Link>

        <div className="bg-bourbon-cream p-8 shadow-2xl">
          <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-bourbon-deep mb-1">
            Sign in
          </h1>
          <p className="text-bourbon-stone text-sm mb-6">
            Restricted area. Enter the admin password.
          </p>

          {errorMessage && (
            <div className="mb-5 p-3 bg-red-50 border border-red-200 text-red-700 text-sm">
              {errorMessage}
            </div>
          )}

          <form action={login} className="space-y-4">
            <input type="hidden" name="next" value={from ?? "/admin"} />
            <div>
              <label
                htmlFor="password"
                className="block text-bourbon-stone text-[10px] tracking-widest uppercase mb-1.5"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                autoFocus
                required
                className="w-full bg-white border border-bourbon-deep/15 px-3 py-3 text-bourbon-deep text-sm focus:outline-none focus:border-bourbon-gold transition-colors"
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-bourbon-gold text-bourbon-deep font-semibold tracking-widest uppercase text-xs hover:bg-bourbon-amber transition-colors cursor-pointer"
            >
              Sign in
            </button>
          </form>
        </div>

        <p className="text-bourbon-cream/40 text-xs text-center mt-6">
          <Link href="/" className="hover:text-bourbon-gold transition-colors">
            ← Back to the storefront
          </Link>
        </p>
      </div>
    </main>
  );
}
