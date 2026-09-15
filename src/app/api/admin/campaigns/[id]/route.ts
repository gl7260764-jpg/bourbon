import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import {
  isEmail,
  normalizeCampaignFields,
  type CampaignFields,
} from "@/lib/campaign-constants";
import { sendProblems } from "@/lib/campaign-template";
import {
  CampaignError,
  countRemaining,
  fieldsOf,
  renderPreview,
  requeueFailed,
  resolveContent,
  sendNextBatch,
  sendSummary,
  sendTest,
  startSend,
} from "@/lib/campaigns";

export const dynamic = "force-dynamic";
/* A send batch opens SMTP connections and waits on Brevo for each message.
   Batches are sized to finish well inside this, but the default is too tight
   to leave headroom on a slow day. */
export const maxDuration = 60;

/* Authorisation is the middleware's job: src/middleware.ts guards
   /api/admin/:path* the same way it guards /admin/:path*. */

type Ctx = { params: Promise<{ id: string }> };

const ACTIONS = ["preview", "save", "test", "send", "retry-failed", "delete"] as const;
type Action = (typeof ACTIONS)[number];

function fail(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

function revalidate(id: string) {
  revalidatePath("/admin/campaigns");
  revalidatePath(`/admin/campaigns/${id}`);
}

/** Recipient count for a set of fields that may not be saved yet. */
async function audienceCount(id: string, fields: CampaignFields): Promise<number> {
  return countRemaining({
    id,
    audience: fields.audience,
    selectedEmails: fields.selectedEmails,
    sendStartedAt: null,
  });
}

/**
 * Every composer action goes through this one handler, discriminated by
 * `action`. Preview, test and send all resolve content from the same
 * normalised fields through the same renderer, so what the operator previews
 * is what the list receives.
 */
export async function POST(req: NextRequest, ctx: Ctx) {
  const { id } = await ctx.params;

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return fail("Invalid request.", 400);

  const action = body.action as Action;
  if (!ACTIONS.includes(action)) return fail("Unknown action.", 400);

  const campaign = await prisma.campaign.findUnique({ where: { id } });
  if (!campaign) return fail("Campaign not found.", 404);

  const isDraft = campaign.status === "DRAFT";
  /* Fields come from the request when the composer sends them (it always
     does), else from the saved campaign. */
  const { fields, errors } =
    body.fields !== undefined
      ? normalizeCampaignFields(body.fields)
      : { fields: fieldsOf(campaign), errors: [] as string[] };

  try {
    switch (action) {
      case "preview": {
        const content = await resolveContent(fields);
        const { html } = renderPreview(content);
        return NextResponse.json({
          html,
          problems: [...errors, ...sendProblems(content)],
          recipients: await audienceCount(id, fields),
        });
      }

      case "save": {
        if (!isDraft) return fail("This campaign has already been sent and can no longer be edited.", 409);
        await prisma.campaign.update({ where: { id }, data: fields });
        revalidate(id);
        return NextResponse.json({ ok: true, errors });
      }

      case "test": {
        if (!isDraft) return fail("Test sends are only available while drafting.", 409);
        const raw = typeof body.to === "string" ? body.to : "";
        const to = [...new Set(raw.split(/[\s,;]+/).map((e) => e.trim().toLowerCase()).filter(Boolean))];
        if (to.length === 0) return fail("Enter an address to send the test to.", 400);
        if (to.length > 5) return fail("Send a test to five addresses at most.", 400);
        const bad = to.find((e) => !isEmail(e));
        if (bad) return fail(`"${bad}" is not a valid email address.`, 400);

        await prisma.campaign.update({ where: { id }, data: fields });
        const content = await resolveContent(fields);
        const problems = [...errors, ...sendProblems(content)];
        if (problems.length) return fail(problems.join(" "), 400);

        const result = await sendTest(content, to);
        revalidate(id);
        return NextResponse.json(result);
      }

      case "send": {
        if (isDraft) {
          await prisma.campaign.update({ where: { id }, data: fields });
          if (errors.length) return fail(errors.join(" "), 400);
          const confirmCount = Number(body.confirmCount);
          if (!Number.isInteger(confirmCount) || confirmCount < 0) {
            return fail("Confirm the recipient count before sending.", 400);
          }
          await startSend(id, confirmCount);
        }
        const summary = await sendNextBatch(id);
        revalidate(id);
        return NextResponse.json(summary);
      }

      case "retry-failed": {
        await requeueFailed(id);
        revalidate(id);
        return NextResponse.json(await sendSummary(id));
      }

      case "delete": {
        // Sent campaigns are the record of what the list received; only
        // drafts can go.
        if (!isDraft) return fail("Sent campaigns are kept as a record and cannot be deleted.", 409);
        await prisma.campaign.delete({ where: { id } });
        revalidatePath("/admin/campaigns");
        return NextResponse.json({ ok: true });
      }
    }
  } catch (err) {
    if (err instanceof CampaignError) return fail(err.message, err.status);
    console.error(`[campaigns] ${action} failed for ${id}:`, err);
    return fail("Something went wrong on the server. Nothing further was sent — try again.", 500);
  }
}
