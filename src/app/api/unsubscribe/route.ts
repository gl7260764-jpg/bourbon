import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { PREVIEW_UNSUBSCRIBE_TOKEN } from "@/lib/campaign-constants";

export const dynamic = "force-dynamic";

/**
 * Unsubscribe, by the secret token in a campaign email.
 *
 * POST only, and that is load-bearing. Mail security scanners and link
 * previewers fetch every URL in a message; if GET unsubscribed, a corporate
 * inbox would unsubscribe its owner before they ever saw the email. The link
 * in the footer opens a page with a button, and only the button — or a mail
 * client's one-click request — changes anything.
 *
 * Two callers:
 *  - Gmail/Yahoo/Apple's one-click, per RFC 8058: a POST to the
 *    List-Unsubscribe URL with the form body `List-Unsubscribe=One-Click`. It
 *    must work without confirmation, cookies or JavaScript, and gets a plain
 *    200 back.
 *  - The /unsubscribe page's own form, which also offers resubscribing. That
 *    one is redirected back to the page to show the result.
 */
export async function POST(req: NextRequest) {
  const form = await req.formData().catch(() => null);
  const token = (req.nextUrl.searchParams.get("t") ?? String(form?.get("t") ?? "")).trim();
  const oneClick = form?.get("List-Unsubscribe") === "One-Click";
  const resubscribe = !oneClick && form?.get("action") === "resubscribe";

  const back = (flag: string) =>
    NextResponse.redirect(
      new URL(`/unsubscribe?t=${encodeURIComponent(token)}&${flag}=1`, req.nextUrl.origin),
      303,
    );

  // The test email's link. Nothing to change, but not an error either.
  if (token === PREVIEW_UNSUBSCRIBE_TOKEN) {
    return oneClick ? NextResponse.json({ ok: true }) : back("done");
  }

  const subscriber = token
    ? await prisma.subscriber.findUnique({
        where: { unsubscribeToken: token },
        select: { id: true },
      })
    : null;

  if (!subscriber) {
    return oneClick
      ? NextResponse.json({ error: "Unknown unsubscribe link." }, { status: 404 })
      : back("invalid");
  }

  await prisma.subscriber.update({
    where: { id: subscriber.id },
    data: { status: resubscribe ? "SUBSCRIBED" : "UNSUBSCRIBED" },
  });

  if (oneClick) return NextResponse.json({ ok: true });
  return back(resubscribe ? "resubscribed" : "done");
}
