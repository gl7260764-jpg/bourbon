import { randomBytes } from "node:crypto";
import { Prisma, type Campaign } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  PREVIEW_UNSUBSCRIBE_TOKEN,
  asCampaignStatus,
  type CampaignFields,
  type CampaignStatus,
} from "@/lib/campaign-constants";
import {
  renderCampaignHtml,
  renderCampaignText,
  resolveCampaignContent,
  sendProblems,
  type CampaignContent,
  type FeaturedBottle,
} from "@/lib/campaign-template";
import { withCampaignMailer } from "@/lib/campaign-mailer";

/**
 * Campaign sending.
 *
 * There is no job queue in this codebase, so a send is driven by the admin
 * page: it calls the send action, which sends one batch and reports progress,
 * and calls again until the list is done. Each batch is short enough to finish
 * inside a request, and nothing is lost if the tab closes — the next call
 * picks up exactly where the last one stopped.
 *
 * Correctness rests on CampaignSend's unique (campaignId, email): a recipient
 * is claimed by inserting that row BEFORE the message goes out. Two tabs
 * sending at once, a double click, or a retry all collide on the insert, and
 * the loser skips that person.
 */

const SITE = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://bourbonoaklover.com").replace(/\/$/, "");

/** Recipients per request. 25 × a few hundred ms each stays well inside a request. */
export const SEND_BATCH_SIZE = 25;
/** Parallel SMTP connections to Brevo within a batch. */
export const SEND_CONCURRENCY = 4;

export function unsubscribeUrl(token: string): string {
  return `${SITE}/unsubscribe?t=${encodeURIComponent(token)}`;
}

export function fieldsOf(c: Campaign): CampaignFields {
  return {
    subject: c.subject,
    preheader: c.preheader,
    eyebrow: c.eyebrow,
    heading: c.heading,
    body: c.body,
    ctaLabel: c.ctaLabel,
    ctaUrl: c.ctaUrl,
    urgency: c.urgency,
    productId: c.productId,
    priceOverride: c.priceOverride,
    compareAtOverride: c.compareAtOverride,
    audience: c.audience === "SELECTED" ? "SELECTED" : "ALL",
    selectedEmails: c.selectedEmails,
  };
}

const money = (v: Prisma.Decimal | number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(v));

export async function loadFeaturedBottle(productId: string | null): Promise<FeaturedBottle | null> {
  if (!productId) return null;
  const p = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      name: true,
      slug: true,
      bottlePrice: true,
      compareAtPrice: true,
      images: {
        orderBy: [{ isPrimary: "desc" }, { sortOrder: "asc" }],
        take: 1,
        select: { url: true, alt: true },
      },
    },
  });
  if (!p) return null;
  const img = p.images[0];
  return {
    name: p.name,
    imageUrl: img ? (img.url.startsWith("/") ? `${SITE}${img.url}` : img.url) : null,
    imageAlt: img?.alt || p.name,
    price: money(p.bottlePrice),
    // A compare-at at or below the price is not a discount and would print a
    // strikethrough that says nothing.
    compareAt:
      p.compareAtPrice && Number(p.compareAtPrice) > Number(p.bottlePrice)
        ? money(p.compareAtPrice)
        : null,
    url: `${SITE}/products/${p.slug}`,
  };
}

export async function resolveContent(fields: CampaignFields): Promise<CampaignContent> {
  return resolveCampaignContent(fields, await loadFeaturedBottle(fields.productId), SITE);
}

/** The exact HTML a preview shows and a test sends. */
export function renderPreview(content: CampaignContent): { html: string; text: string } {
  const url = unsubscribeUrl(PREVIEW_UNSUBSCRIBE_TOKEN);
  return {
    html: renderCampaignHtml(content, { unsubscribeUrl: url }),
    text: renderCampaignText(content, { unsubscribeUrl: url }),
  };
}

/* ---- Recipients ---------------------------------------------------------- */

/**
 * SQL for "subscribed, in this campaign's audience, not yet claimed".
 *
 * Raw because the not-yet-claimed part is a NOT EXISTS against CampaignSend,
 * which Prisma's query builder cannot express without loading every claimed
 * address into memory first.
 *
 * ALL is bounded by sendStartedAt once a send has begun: someone who joins
 * mid-send was not on the list the operator confirmed. Before that, ALL is a
 * live query, so the count on the Send button includes whoever subscribed
 * since the page loaded.
 */
function audienceWhere(c: Pick<Campaign, "id" | "audience" | "selectedEmails" | "sendStartedAt">) {
  const selected =
    c.audience === "SELECTED"
      ? Prisma.sql`AND s."email" = ANY(${c.selectedEmails}::text[])`
      : c.sendStartedAt
        ? Prisma.sql`AND s."createdAt" <= ${c.sendStartedAt}`
        : Prisma.empty;
  return Prisma.sql`
    s."status" = 'SUBSCRIBED'
    ${selected}
    AND NOT EXISTS (
      SELECT 1 FROM "CampaignSend" cs
      WHERE cs."campaignId" = ${c.id} AND cs."email" = s."email"
    )`;
}

export async function countRemaining(
  c: Pick<Campaign, "id" | "audience" | "selectedEmails" | "sendStartedAt">,
): Promise<number> {
  if (c.audience === "SELECTED" && c.selectedEmails.length === 0) return 0;
  const rows = await prisma.$queryRaw<{ n: bigint }[]>`
    SELECT COUNT(*)::bigint AS n FROM "Subscriber" s WHERE ${audienceWhere(c)}`;
  return Number(rows[0]?.n ?? 0);
}

async function nextRecipients(c: Campaign, limit: number): Promise<string[]> {
  if (c.audience === "SELECTED" && c.selectedEmails.length === 0) return [];
  const rows = await prisma.$queryRaw<{ email: string }[]>`
    SELECT s."email" FROM "Subscriber" s
    WHERE ${audienceWhere(c)}
    ORDER BY s."createdAt" ASC
    LIMIT ${limit}`;
  return rows.map((r) => r.email);
}

/** Mint unsubscribe tokens for anyone about to be emailed who has none. */
async function tokensFor(emails: string[]): Promise<Map<string, string>> {
  const rows = await prisma.subscriber.findMany({
    where: { email: { in: emails } },
    select: { id: true, unsubscribeToken: true },
  });
  await Promise.all(
    rows
      .filter((r) => !r.unsubscribeToken)
      .map((r) =>
        // Conditional on still being null, so two batches racing on the same
        // subscriber cannot hand them two different links.
        prisma.subscriber.updateMany({
          where: { id: r.id, unsubscribeToken: null },
          data: { unsubscribeToken: randomBytes(24).toString("base64url") },
        }),
      ),
  );
  const fresh = await prisma.subscriber.findMany({
    where: { email: { in: emails } },
    select: { email: true, unsubscribeToken: true },
  });
  return new Map(
    fresh.filter((r) => r.unsubscribeToken).map((r) => [r.email, r.unsubscribeToken!]),
  );
}

/* ---- Progress ------------------------------------------------------------ */

export interface SendSummary {
  status: CampaignStatus;
  total: number;
  sent: number;
  failed: number;
  /** Claimed but never confirmed — the process stopped mid-send. May have gone out. */
  unconfirmed: number;
  remaining: number;
  failures: { email: string; error: string }[];
  done: boolean;
}

export async function sendSummary(campaignId: string): Promise<SendSummary> {
  const campaign = await prisma.campaign.findUniqueOrThrow({ where: { id: campaignId } });
  const [grouped, failures, remaining] = await Promise.all([
    prisma.campaignSend.groupBy({
      by: ["status"],
      where: { campaignId },
      _count: { _all: true },
    }),
    prisma.campaignSend.findMany({
      where: { campaignId, status: "FAILED" },
      orderBy: { updatedAt: "desc" },
      take: 200,
      select: { email: true, error: true },
    }),
    campaign.status === "SENT" ? Promise.resolve(0) : countRemaining(campaign),
  ]);
  const count = (s: string) => grouped.find((g) => g.status === s)?._count._all ?? 0;
  const sent = count("SENT");
  const failed = count("FAILED");
  const unconfirmed = count("SENDING");
  const status = asCampaignStatus(campaign.status);
  return {
    status,
    total: sent + failed + unconfirmed + remaining,
    sent,
    failed,
    unconfirmed,
    remaining,
    failures: failures.map((f) => ({ email: f.email, error: f.error ?? "Unknown error" })),
    done: status === "SENT",
  };
}

/* ---- Sending ------------------------------------------------------------- */

export class CampaignError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

/**
 * DRAFT → SENDING. Validates, freezes the content, and stamps the start time
 * that bounds the audience. Conditional on still being DRAFT, so two clicks
 * start one send.
 */
export async function startSend(campaignId: string, confirmCount: number): Promise<void> {
  const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
  if (!campaign) throw new CampaignError("Campaign not found.", 404);
  if (campaign.status !== "DRAFT") return;

  const content = await resolveContent(fieldsOf(campaign));
  const problems = sendProblems(content);
  if (problems.length) throw new CampaignError(problems.join(" "), 400);

  const count = await countRemaining(campaign);
  if (count === 0) throw new CampaignError("There is nobody to send this to.", 400);
  /* The operator confirmed a number. If the list moved since — someone
     subscribed or left — they confirm again rather than sending to a count
     they never saw. */
  if (confirmCount !== count) {
    throw new CampaignError(
      `The recipient count is now ${count}, not ${confirmCount}. Review it and confirm again.`,
      409,
    );
  }

  await prisma.campaign.updateMany({
    where: { id: campaignId, status: "DRAFT" },
    data: {
      status: "SENDING",
      snapshot: content as unknown as Prisma.InputJsonValue,
      sendStartedAt: new Date(),
    },
  });
}

/** Run bounded-concurrency work over a list, never letting one failure stop the rest. */
async function eachLimited<T>(items: T[], limit: number, fn: (item: T) => Promise<void>) {
  let i = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) await fn(items[i++]);
  });
  await Promise.all(workers);
}

async function markSentIfFinished(campaignId: string): Promise<void> {
  const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
  if (!campaign || campaign.status !== "SENDING") return;
  if ((await countRemaining(campaign)) > 0) return;
  await prisma.campaign.updateMany({
    where: { id: campaignId, status: "SENDING" },
    data: { status: "SENT", sentAt: new Date() },
  });
}

/** Send the next batch of a campaign that is already SENDING. */
export async function sendNextBatch(campaignId: string): Promise<SendSummary> {
  const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
  if (!campaign) throw new CampaignError("Campaign not found.", 404);
  if (campaign.status !== "SENDING") return sendSummary(campaignId);
  if (!campaign.snapshot) throw new CampaignError("This campaign has no frozen content to send.", 500);

  const candidates = await nextRecipients(campaign, SEND_BATCH_SIZE);
  if (candidates.length === 0) {
    await markSentIfFinished(campaignId);
    return sendSummary(campaignId);
  }

  const content = campaign.snapshot as unknown as CampaignContent;
  const tag = `campaign-${campaign.id}`;

  const result = await withCampaignMailer(SEND_CONCURRENCY, async (send) => {
    /* Claim inside the verified-connection block, not before it: if Brevo is
       unreachable nobody gets claimed, rather than a whole batch left looking
       like it might have been sent. */
    /* One statement claims the whole batch. ON CONFLICT skips anyone another
       tab already holds, and RETURNING hands back exactly the rows this call
       won. Inserting one row at a time and catching the unique violation
       behaves the same, but every lost race is a failed query, and
       lib/prisma logs failed queries in production — a double click would
       fill the logs with errors that are not errors.

       ids and updatedAt are supplied here because both are filled in by
       Prisma, not by the database, and this bypasses Prisma. */
    const claimedRows = await prisma.$queryRaw<{ email: string }[]>`
      INSERT INTO "CampaignSend" ("id", "campaignId", "email", "status", "createdAt", "updatedAt")
      SELECT gen_random_uuid()::text, ${campaignId}, e, 'SENDING', NOW(), NOW()
      FROM unnest(${candidates}::text[]) AS e
      ON CONFLICT ("campaignId", "email") DO NOTHING
      RETURNING "email"`;
    const claimed = claimedRows.map((r) => r.email);

    const tokens = await tokensFor(claimed);

    await eachLimited(claimed, SEND_CONCURRENCY, async (email) => {
      const token = tokens.get(email);
      if (!token) {
        // Deleted between being selected and being sent.
        await prisma.campaignSend.update({
          where: { campaignId_email: { campaignId, email } },
          data: { status: "FAILED", error: "Subscriber was removed before sending." },
        });
        return;
      }
      const url = unsubscribeUrl(token);
      const r = await send({
        to: email,
        subject: content.subject,
        html: renderCampaignHtml(content, { unsubscribeUrl: url }),
        text: renderCampaignText(content, { unsubscribeUrl: url }),
        unsubscribeUrl: url,
        tag,
      });
      await prisma.campaignSend.update({
        where: { campaignId_email: { campaignId, email } },
        data: r.ok
          ? { status: "SENT", messageId: r.messageId, error: null }
          : { status: "FAILED", error: r.error },
      });
    });
  });

  if (!result.ok) throw new CampaignError(result.error, 502);

  await markSentIfFinished(campaignId);
  return sendSummary(campaignId);
}

/**
 * Put failed recipients back in the queue. Safe because FAILED only ever means
 * the mail server refused the message — unlike SENDING, nothing went out.
 */
export async function requeueFailed(campaignId: string): Promise<void> {
  const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
  if (!campaign) throw new CampaignError("Campaign not found.", 404);
  if (campaign.status === "DRAFT") throw new CampaignError("This campaign has not been sent.", 400);
  const { count } = await prisma.campaignSend.deleteMany({
    where: { campaignId, status: "FAILED" },
  });
  if (count > 0) {
    await prisma.campaign.update({
      where: { id: campaignId },
      data: { status: "SENDING", sentAt: null },
    });
  }
}

/** A test send: the preview's exact HTML, to addresses the operator typed. */
export async function sendTest(
  content: CampaignContent,
  to: string[],
): Promise<{ sent: string[]; failed: { email: string; error: string }[] }> {
  const { html, text } = renderPreview(content);
  const result = await withCampaignMailer(1, async (send) => {
    const sent: string[] = [];
    const failed: { email: string; error: string }[] = [];
    for (const email of to) {
      const r = await send({
        to: email,
        subject: `[Test] ${content.subject}`,
        html,
        text,
        unsubscribeUrl: unsubscribeUrl(PREVIEW_UNSUBSCRIBE_TOKEN),
        tag: "campaign-test",
      });
      if (r.ok) sent.push(email);
      else failed.push({ email, error: r.error });
    }
    return { sent, failed };
  });
  if (!result.ok) throw new CampaignError(result.error, 502);
  return result.value;
}
