import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { buildFollowUpEmail } from "@/lib/emails/followUpEmail";
import { FOLLOW_UP_BATCH_SIZE } from "@/lib/follow-up-constants";
import {
  draftForOrder,
  saveDetailsTemplate,
  sendFollowUps,
  setFollowUpMuted,
  stageOrderDetails,
  validateFollowUpEdit,
  type FollowUpSendItem,
} from "@/lib/order-follow-up";

export const dynamic = "force-dynamic";
/* A batch opens an SMTP connection and waits on Brevo for each message.
   FOLLOW_UP_BATCH_SIZE is set to finish well inside this, but the default is
   too tight to leave headroom on a slow day. */
export const maxDuration = 60;

/* Authorisation is the middleware's job: src/middleware.ts guards
   /api/admin/:path* the same way it guards /admin/:path*. */

const ACTIONS = [
  "preview",
  "send",
  "send-batch",
  "mute",
  "unmute",
  "stage-details",
  "save-template",
] as const;
type Action = (typeof ACTIONS)[number];

function fail(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

function revalidate() {
  revalidatePath("/admin/follow-ups");
  revalidatePath("/admin/orders");
}

const asStrings = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return fail("Invalid request.", 400);

  const action = body.action as Action;
  if (!ACTIONS.includes(action)) return fail("Unknown action.", 400);

  const orderId = typeof body.orderId === "string" ? body.orderId : "";

  try {
    switch (action) {
      /* The email as the recipient will see it, built through the same
         renderer the send path uses — so an operator cannot preview one thing
         and send another. */
      case "preview": {
        if (!orderId) return fail("No order given.", 400);
        const draft = await draftForOrder(orderId);
        if (!draft) return fail("Order not found.", 404);

        const subject =
          typeof body.subject === "string" && body.subject.trim()
            ? body.subject.trim()
            : draft.subject;
        const edited = asStrings(body.paragraphs).map((p) => p.trim()).filter(Boolean);
        const paragraphs = edited.length > 0 ? edited : draft.paragraphs;

        const invalid = validateFollowUpEdit({ subject, paragraphs });
        if (invalid) return fail(invalid, 400);

        const site = (
          process.env.NEXT_PUBLIC_SITE_URL ?? "https://bourbonoaklover.com"
        ).replace(/\/$/, "");
        const mail = buildFollowUpEmail({
          draft,
          subject,
          paragraphs,
          // The real send mints a one-click sign-in token per recipient; a
          // preview must not burn one against this buyer's rate limit.
          orderUrl: `${site}/account`,
        });
        return NextResponse.json({ subject: mail.subject, html: mail.html, draft });
      }

      /* Write payment details against one order without telling the buyer.
         Staged separately from sending so the operator can save them, watch
         the draft change to match, and only then send. */
      case "stage-details": {
        if (!orderId) return fail("No order given.", 400);
        const details = typeof body.details === "string" ? body.details : "";
        const problem = await stageOrderDetails(orderId, details);
        if (problem) return fail(problem, 400);
        /* Optionally keep it as the starting point for this rail, so the next
           order paying the same way does not have to be typed out again. */
        if (body.alsoSaveTemplate === true && typeof body.railKey === "string") {
          const railProblem = await saveDetailsTemplate(body.railKey, details);
          if (railProblem) return fail(railProblem, 400);
        }
        revalidate();
        return NextResponse.json({ ok: true, draft: await draftForOrder(orderId) });
      }

      case "save-template": {
        const railKey = typeof body.railKey === "string" ? body.railKey : "";
        if (!railKey) return fail("No payment method given.", 400);
        const details = typeof body.details === "string" ? body.details : "";
        const problem = await saveDetailsTemplate(railKey, details);
        if (problem) return fail(problem, 400);
        revalidate();
        return NextResponse.json({ ok: true });
      }

      case "send": {
        if (!orderId) return fail("No order given.", 400);
        const subject = typeof body.subject === "string" ? body.subject : undefined;
        const paragraphs =
          body.paragraphs === undefined ? undefined : asStrings(body.paragraphs);
        const invalid = validateFollowUpEdit({ subject, paragraphs });
        if (invalid) return fail(invalid, 400);

        const details = typeof body.details === "string" ? body.details : undefined;
        const report = await sendFollowUps([
          { orderId, subject, paragraphs, details },
        ]);
        revalidate();
        if (!report.ok) return fail(report.error ?? "Nothing was sent.", 502);
        const outcome = report.outcomes[0];
        if (outcome && !outcome.ok) return fail(outcome.error, 409);
        return NextResponse.json(report);
      }

      case "send-batch": {
        const ids = [...new Set(asStrings(body.orderIds))];
        if (ids.length === 0) return fail("Nothing selected.", 400);
        if (ids.length > FOLLOW_UP_BATCH_SIZE) {
          return fail(
            `Send at most ${FOLLOW_UP_BATCH_SIZE} at a time — the page will come back for the rest.`,
            400,
          );
        }
        const items: FollowUpSendItem[] = ids.map((id) => ({ orderId: id }));
        const report = await sendFollowUps(items);
        revalidate();
        if (!report.ok) return fail(report.error ?? "Nothing was sent.", 502);
        return NextResponse.json(report);
      }

      case "mute":
      case "unmute": {
        if (!orderId) return fail("No order given.", 400);
        await setFollowUpMuted(orderId, action === "mute");
        revalidate();
        return NextResponse.json({ ok: true });
      }
    }
  } catch (err) {
    console.error(`[follow-ups] ${action} failed:`, err);
    return fail(
      "Something went wrong on the server. Nothing further was sent — try again.",
      500,
    );
  }
}
