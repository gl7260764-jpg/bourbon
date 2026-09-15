import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PREVIEW_UNSUBSCRIBE_TOKEN } from "@/lib/campaign-constants";
import { DISTILLERY } from "@/lib/locations";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Email preferences | Bourbon & Oak",
  // A page reached only through a private link has no business in search.
  robots: { index: false, follow: false },
};

/** m•••@gmail.com — enough to recognise your own address, not enough to leak it. */
function mask(email: string): string {
  const [local, domain] = email.split("@");
  return `${local.slice(0, 1)}•••@${domain}`;
}

/**
 * Where a campaign's unsubscribe link lands.
 *
 * Rendered without the storefront chrome (see SiteChrome): no age gate, no
 * newsletter popup, no chat bubble opening itself. Leaving a list should take
 * one page and one click, and a modal asking to confirm your age first is an
 * obstacle the law does not allow.
 */
export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ t?: string; done?: string; resubscribed?: string; invalid?: string }>;
}) {
  const sp = await searchParams;
  const token = (sp.t ?? "").trim();

  const subscriber =
    token && token !== PREVIEW_UNSUBSCRIBE_TOKEN
      ? await prisma.subscriber.findUnique({
          where: { unsubscribeToken: token },
          select: { email: true, status: true },
        })
      : null;

  let title: string;
  let message: React.ReactNode;
  let form: React.ReactNode = null;

  if (!token) {
    title = "This link is incomplete";
    message = "Open the unsubscribe link straight from the email, or reply to any of our emails and we'll take you off the list.";
  } else if (token === PREVIEW_UNSUBSCRIBE_TOKEN) {
    title = "This was a test email";
    message = "Test sends aren't tied to a subscriber, so there's nothing to unsubscribe from.";
  } else if (!subscriber) {
    title = "We couldn't find this link";
    message = (
      <>
        It may have been mistyped. Reply to any of our emails, or write to{" "}
        <a className="underline" href={`mailto:${DISTILLERY.email}`}>{DISTILLERY.email}</a>, and we&apos;ll
        remove you by hand.
      </>
    );
  } else if (subscriber.status === "UNSUBSCRIBED") {
    title = "You're unsubscribed";
    message = (
      <>
        <strong className="text-bourbon-deep">{mask(subscriber.email)}</strong> won&apos;t receive
        our newsletters anymore. Order confirmations and invoices will still reach you.
      </>
    );
    form = (
      <form method="post" action="/api/unsubscribe" className="mt-8">
        <input type="hidden" name="t" value={token} />
        <input type="hidden" name="action" value="resubscribe" />
        <p className="text-bourbon-stone text-sm mb-3">Unsubscribed by mistake?</p>
        <button
          type="submit"
          className="px-5 py-2.5 border border-bourbon-deep/20 text-bourbon-deep text-xs tracking-widest uppercase font-semibold hover:bg-bourbon-deep hover:text-bourbon-cream transition-colors cursor-pointer"
        >
          Resubscribe
        </button>
      </form>
    );
  } else {
    title = sp.resubscribed ? "You're subscribed again" : "Unsubscribe from our emails?";
    message = sp.resubscribed ? (
      <>
        Welcome back. <strong className="text-bourbon-deep">{mask(subscriber.email)}</strong> will get
        our newsletters again.
      </>
    ) : (
      <>
        <strong className="text-bourbon-deep">{mask(subscriber.email)}</strong> will stop receiving
        our newsletters. Order confirmations and invoices will still reach you.
      </>
    );
    form = sp.resubscribed ? null : (
      <form method="post" action="/api/unsubscribe" className="mt-8">
        <input type="hidden" name="t" value={token} />
        <button
          type="submit"
          className="px-6 py-3 bg-bourbon-deep text-bourbon-cream text-xs tracking-widest uppercase font-semibold hover:bg-bourbon-gold hover:text-bourbon-deep transition-colors cursor-pointer"
        >
          Unsubscribe
        </button>
      </form>
    );
  }

  return (
    <main className="min-h-screen bg-[#F4F1EC] px-4 py-16 sm:py-24">
      <div className="mx-auto max-w-md">
        <Link href="/" className="block text-center mb-8">
          <span className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-bourbon-deep">
            Bourbon &amp; Oak
          </span>
        </Link>
        <div className="bg-white border border-bourbon-deep/10 px-6 py-10 sm:px-10 text-center">
          <h1 className="font-[family-name:var(--font-playfair)] text-2xl sm:text-3xl font-bold text-bourbon-deep">
            {title}
          </h1>
          <p className="mt-4 text-bourbon-stone text-sm leading-relaxed">{message}</p>
          {form}
        </div>
        <p className="mt-6 text-center text-xs text-bourbon-stone/80">
          <Link href="/" className="underline hover:text-bourbon-deep">
            Back to bourbonoaklover.com
          </Link>
        </p>
      </div>
    </main>
  );
}
