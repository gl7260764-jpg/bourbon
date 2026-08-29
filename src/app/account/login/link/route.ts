import { NextResponse, type NextRequest } from "next/server";
import { createSession, findOrCreateCustomer } from "@/lib/customer-auth";
import { verifyLoginLink } from "@/lib/login-link";

export const dynamic = "force-dynamic";

/**
 * Land here from the button in an email and end up signed in on the dashboard.
 *
 * A GET that creates a session is normally a bad idea, but this is the
 * password-reset pattern: the secret arrived in the mailbox, and a mail client
 * can only follow a link, not post a form. The token is single-use and
 * consumed atomically in verifyLoginLink, so a scanner that prefetches the URL
 * burns it rather than leaving it live — the buyer then gets the "already
 * used" message and can request another, which is the safe failure.
 *
 * Every outcome redirects rather than rendering, so the token never survives
 * in the address bar or in the referrer of anything the dashboard loads.
 */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token") ?? "";
  const fail = (reason: string) =>
    NextResponse.redirect(new URL(`/account/login?link=${reason}`, req.url));

  const result = await verifyLoginLink(token);
  if (!result.ok) return fail(result.reason);

  try {
    const customer = await findOrCreateCustomer(result.email, {});
    await createSession(customer.id);
  } catch (err) {
    console.error("[account/login/link] could not start session:", err);
    return fail("error");
  }

  return NextResponse.redirect(new URL("/account", req.url));
}
