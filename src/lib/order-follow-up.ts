import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { firstNameOf } from "@/lib/order-welcome";
import {
  MAX_FOLLOW_UPS,
  MIN_GAP_DAYS,
  STALE_DAYS,
  type FollowUpDraft,
  type FollowUpTrack,
} from "@/lib/follow-up-constants";

/**
 * Order follow-ups.
 *
 * The queue this works from is not "people who owe us money". That was the
 * assumption going in, and the data said otherwise: the overwhelming majority
 * of stalled orders are stalled because nobody ever sent the buyer anywhere to
 * pay. A "you haven't paid" nudge to someone we never gave details to is both
 * false and the fastest way to lose them.
 *
 * So a follow-up picks a TRACK from what is actually true of the order — who
 * it is waiting on, and for how long — and the message owns our side of it
 * where ours is the side at fault. Nothing here guesses: every sentence is
 * built from a column.
 *
 * Nothing sends on its own. Drafts are composed for an operator to read, edit
 * and send, one order at a time or in a batch. There is no scheduler, and
 * deliberately so — the first message these buyers get after two months of
 * silence should be seen by a human first.
 */

export {
  STALE_DAYS,
  MAX_FOLLOW_UPS,
  MIN_GAP_DAYS,
  TRACK_LABEL,
  TRACK_BADGE,
} from "@/lib/follow-up-constants";

/** Groups these sends in Brevo's statistics, apart from campaign mail. */
export const FOLLOW_UP_TAG = "order-follow-up";
/** Recorded as the sender until admin accounts exist, like the settlement columns. */
export const FOLLOW_UP_OPERATOR = "admin";

const DAY_MS = 86_400_000;

export interface FollowUpQueue {
  drafts: FollowUpDraft[];
  /** Pending orders held back, and why. */
  held: { orderNumber: string; reason: string }[];
  totals: { count: number; value: number };
}

const money = (v: Prisma.Decimal | number) => `$${Number(v).toFixed(2)}`;

const dateOf = (d: Date) =>
  d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

/**
 * The bottles, as a person would say them.
 *
 * Capped at three named items because the point of listing them is
 * recognition — "oh, that order" — and a buyer who ordered nine bottles does
 * not need all nine recited back to know which order this is.
 */
function bottleSentence(
  items: { productName: string; quantity: number; isCase: boolean }[],
): string {
  const named = items.slice(0, 3).map((i) => {
    const unit = i.isCase ? "case" : "bottle";
    const count = i.quantity > 1 ? ` (${i.quantity} ${unit}${i.quantity === 1 ? "" : "s"})` : "";
    return `${i.productName}${count}`;
  });
  const rest = items.length - named.length;
  if (rest > 0) named.push(`${rest} more`);
  if (named.length === 1) return named[0];
  return `${named.slice(0, -1).join(", ")} and ${named[named.length - 1]}`;
}

interface OrderRow {
  id: string;
  orderNumber: string;
  email: string;
  fullName: string;
  total: Prisma.Decimal;
  createdAt: Date;
  settlementState: string;
  paymentLabel: string | null;
  paymentOptionKey: string | null;
  paymentDetailsBody: string | null;
  paymentDetailsIssuedAt: Date | null;
  paymentProofUploadedAt: Date | null;
  followUpCount: number;
  lastFollowUpAt: Date | null;
  items: { productId: string | null; productName: string; quantity: number; isCase: boolean; unitPrice: Prisma.Decimal }[];
}

interface Context {
  /** Payment option keys that have no instructions configured. */
  railsWithoutDetails: Set<string>;
  /** Order ids whose buyer has a message we have not opened. */
  unansweredChat: Set<string>;
  /** Product ids deleted or retired since the order, among those ordered. */
  goneFromCatalogue: Set<string>;
  /** Product ids still listed but not currently supplyable. */
  outOfStock: Set<string>;
  now: number;
}

/**
 * Which track an order belongs to.
 *
 * Age wins. An order placed eleven weeks ago is a different conversation from
 * one placed on Tuesday even when the database state is identical, because the
 * buyer's own memory of it has faded and asking them to pay for something they
 * may have forgotten ordering reads as a scam.
 */
export function trackFor(
  order: Pick<OrderRow, "settlementState" | "createdAt" | "paymentProofUploadedAt">,
  now: number,
): { track: FollowUpTrack; reason: string } {
  const ageDays = Math.floor((now - order.createdAt.getTime()) / DAY_MS);

  if (order.settlementState === "PROOF_SUBMITTED") {
    // Never ask for money from someone who has already sent a receipt, however
    // old the order is. They have done their part; we have not done ours.
    return {
      track: "PROOF_STALLED",
      reason: `Receipt submitted${
        order.paymentProofUploadedAt ? ` on ${dateOf(order.paymentProofUploadedAt)}` : ""
      } and not yet verified. The delay is ours.`,
    };
  }

  if (ageDays >= STALE_DAYS) {
    return {
      track: "STILL_WANTED",
      reason: `Placed ${ageDays} days ago, past the ${STALE_DAYS}-day mark. Asking for payment on something this old presumes they still want it.`,
    };
  }

  if (order.settlementState === "AWAITING_DETAILS") {
    return {
      track: "DETAILS_OWED",
      reason: `No payment details were ever issued. The order is blocked on us, not on the buyer.`,
    };
  }

  return {
    track: "PAYMENT_DUE",
    reason: `Payment details were issued and nothing has been paid. The order is genuinely waiting on the buyer.`,
  };
}

/**
 * Write the message.
 *
 * Every track offers a way out as plainly as it offers a way forward. These
 * are unpaid orders: a buyer who has changed their mind owes us nothing, and
 * the email that does not say so is the one that gets reported as spam.
 */
function compose(
  order: OrderRow,
  track: FollowUpTrack,
  sequence: number,
  facts: { firstName: string; bottles: string; ageDays: number; placedOn: string; rail: string },
): { subject: string; paragraphs: string[]; ctaLabel: string } {
  const { firstName, bottles, ageDays, placedOn, rail } = facts;
  const hi = firstName ? `Hi ${firstName},` : "Hello,";
  const num = order.orderNumber;
  const sum = money(order.total);
  const owedDetails = order.paymentDetailsIssuedAt === null;

  switch (track) {
    case "DETAILS_OWED":
      if (sequence === 1) {
        return {
          subject: `We still owe you payment details — order ${num}`,
          ctaLabel: "Open my order",
          paragraphs: [
            hi,
            `You placed order ${num} with us on ${placedOn} — ${bottles} — and we never sent you the details to pay with. That is our miss, not yours, and I am sorry it has sat this long.`,
            `If you still want it, open your order below or simply reply to this email, and the details will be with you the same day. The ${sum} we quoted stands.`,
            `If you would rather leave it, reply with a word and we will close it off. Nothing is owed either way.`,
          ],
        };
      }
      return {
        subject: `Order ${num} — one line from you and we will send the details`,
        ctaLabel: "Open my order",
        paragraphs: [
          hi,
          `Following up once more on order ${num} (${bottles}, ${sum}). We never sent you payment details, and I would rather not let it quietly expire without asking.`,
          `Reply either way — "send them" or "close it" — and I will act on it today.`,
        ],
      };

    case "PAYMENT_DUE":
      if (sequence === 1) {
        return {
          subject: `Order ${num} is held and waiting for you`,
          ctaLabel: "Open my order",
          paragraphs: [
            hi,
            `Your order ${num} — ${bottles} — is still held for you at ${sum}. You chose ${rail}, and the details to pay against are on your order page; the button below signs you straight in, with no password to remember.`,
            `Once you have paid, upload the receipt on that same page and we will confirm it and get the bottles moving.`,
            `If something has changed, reply and tell me — I would rather release the stock than have you feel chased.`,
          ],
        };
      }
      return {
        subject: `Still holding order ${num} for you`,
        ctaLabel: "Open my order",
        paragraphs: [
          hi,
          `Order ${num} (${bottles}, ${sum}) is still held, ${ageDays} days on. Everything you need to pay is on your order page.`,
          `If you no longer want it, one word back and it is released — no awkwardness.`,
        ],
      };

    case "PROOF_STALLED":
      return {
        subject: `We have your receipt for order ${num}`,
        ctaLabel: "View my order",
        paragraphs: [
          hi,
          `Your receipt for order ${num} (${bottles}, ${sum}) reached us and it is with me now. I am sorry it has taken this long to come back to you.`,
          `Nothing further is needed from you. I will confirm as soon as it clears, and you can follow the order's status at the link below in the meantime.`,
        ],
      };

    case "STILL_WANTED": {
      const ours = owedDetails
        ? ` We never sent you the details to pay with, which is on us.`
        : "";
      if (sequence === 1) {
        return {
          subject: `Do you still want order ${num}?`,
          ctaLabel: "Yes — open my order",
          paragraphs: [
            hi,
            `You ordered ${bottles} from us on ${placedOn}, ${ageDays} days ago, and it never got as far as being paid.${ours}`,
            `Rather than keep chasing it, I would rather just ask: do you still want it? If you do, open your order below — or reply with a yes — and I will have everything you need with you the same day. The ${sum} we quoted still stands.`,
            `If you have moved on, reply "close it" and I will clear it from our books. You will not hear from me about it again, and nothing is owed.`,
          ],
        };
      }
      return {
        subject: `Closing order ${num} unless you say otherwise`,
        ctaLabel: "Keep my order",
        paragraphs: [
          hi,
          `Last note about order ${num} (${bottles}, ${sum}) from ${placedOn}. I have not heard back, so I will close it off and release the stock.`,
          `If that is wrong and you do still want it, press the button below or reply within the week and it stays yours at the price quoted.`,
        ],
      };
    }
  }
}

/** Build a draft for one loaded order. Pure: no I/O, so it is easy to reason about. */
export function draftFor(order: OrderRow, ctx: Context): FollowUpDraft {
  const ageDays = Math.floor((ctx.now - order.createdAt.getTime()) / DAY_MS);
  const { track, reason } = trackFor(order, ctx.now);
  const sequence = order.followUpCount + 1;
  const firstName = firstNameOf(order.fullName);
  const bottles = bottleSentence(order.items);
  const placedOn = dateOf(order.createdAt);
  const rail = order.paymentLabel ?? "your chosen payment method";

  const { subject, paragraphs, ctaLabel } = compose(order, track, sequence, {
    firstName,
    bottles,
    ageDays,
    placedOn,
    rail,
  });

  const warnings: string[] = [];

  /* The one warning that can make a message untrue. DETAILS_OWED and
     STILL_WANTED both promise details "the same day"; that promise is only
     keepable if there is something to send. A rail with no instructions
     configured and no per-order details written means there is not. */
  if (
    order.paymentDetailsBody === null &&
    order.paymentOptionKey &&
    ctx.railsWithoutDetails.has(order.paymentOptionKey)
  ) {
    warnings.push(
      `No ${rail} details are configured, so the promise to send them today cannot be kept yet. Add them under Payment methods first.`,
    );
  }

  if (ctx.unansweredChat.has(order.id)) {
    warnings.push(
      `This buyer has a chat message we have not opened. Answer that before emailing them.`,
    );
  }

  /* Supply, which matters more here than anywhere else in the panel: these
     messages promise to honour a price agreed up to three months ago, and an
     operator should not make that promise about a bottle that has since been
     retired or sold out. */
  const gone = order.items.filter(
    (i) => i.productId && ctx.goneFromCatalogue.has(i.productId),
  );
  if (gone.length > 0) {
    warnings.push(
      `Retired from the catalogue since this order: ${gone
        .map((i) => i.productName)
        .join(", ")}. The draft offers to honour a price for something we may no longer stock.`,
    );
  }

  const short = order.items.filter(
    (i) => i.productId && ctx.outOfStock.has(i.productId),
  );
  if (short.length > 0) {
    warnings.push(
      `Sold out right now: ${short
        .map((i) => i.productName)
        .join(", ")}. Worth checking you can fill the order before inviting them back to pay for it.`,
    );
  }

  return {
    orderId: order.id,
    orderNumber: order.orderNumber,
    email: order.email,
    fullName: order.fullName,
    firstName,
    total: Number(order.total),
    bottles,
    itemCount: order.items.reduce((n, i) => n + i.quantity, 0),
    ageDays,
    placedOn,
    rail,
    track,
    sequence,
    subject,
    paragraphs,
    ctaLabel,
    reason,
    warnings,
  };
}

const QUEUE_SELECT = {
  id: true,
  orderNumber: true,
  email: true,
  fullName: true,
  total: true,
  createdAt: true,
  settlementState: true,
  paymentLabel: true,
  paymentOptionKey: true,
  paymentDetailsBody: true,
  paymentDetailsIssuedAt: true,
  paymentProofUploadedAt: true,
  followUpCount: true,
  lastFollowUpAt: true,
  items: {
    select: {
      productId: true,
      productName: true,
      quantity: true,
      isCase: true,
      unitPrice: true,
    },
  },
} as const;

/**
 * Every pending order, sorted oldest first, with a draft for the ones eligible
 * to be written to and a reason for the ones held back.
 *
 * Held orders are listed rather than filtered away because "why is this order
 * not in the queue" is the first question an operator asks, and a silent
 * filter makes it unanswerable.
 */
export async function loadFollowUpQueue(): Promise<FollowUpQueue> {
  const now = Date.now();

  const orders = await prisma.order.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "asc" },
    select: { ...QUEUE_SELECT, followUpMutedAt: true },
  });

  const [rails, products, conversations] = await Promise.all([
    prisma.paymentOption.findMany({ select: { key: true, instructions: true } }),
    prisma.product.findMany({
      where: {
        id: {
          in: [
            ...new Set(
              orders.flatMap((o) =>
                o.items.map((i) => i.productId).filter((id): id is string => Boolean(id)),
              ),
            ),
          ],
        },
      },
      select: { id: true, availability: true },
    }),
    prisma.conversation.findMany({
      where: { adminUnread: { gt: 0 } },
      select: { orderId: true, customerId: true },
    }),
  ]);

  const railsWithoutDetails = new Set(
    rails.filter((r) => !r.instructions?.trim()).map((r) => r.key),
  );

  /* A deleted product and a retired one are the same problem from the buyer's
     side: there is no longer a listing behind what they ordered. */
  const listed = new Map(products.map((p) => [p.id, p.availability]));
  const orderedProducts = new Set(
    orders.flatMap((o) =>
      o.items.map((i) => i.productId).filter((id): id is string => Boolean(id)),
    ),
  );
  const goneFromCatalogue = new Set(
    [...orderedProducts].filter(
      (id) => !listed.has(id) || listed.get(id) === "ARCHIVED",
    ),
  );
  const outOfStock = new Set(
    [...orderedProducts].filter((id) => listed.get(id) === "SOLD_OUT"),
  );

  /* Unanswered chat is matched by order thread only. The merged per-customer
     thread cannot be attributed to one order, so an unread message there would
     flag every order that buyer has ever placed — a warning that fires on
     everything teaches operators to ignore warnings. */
  const unansweredChat = new Set(
    conversations.map((c) => c.orderId).filter((id): id is string => Boolean(id)),
  );

  const ctx: Context = {
    railsWithoutDetails,
    unansweredChat,
    goneFromCatalogue,
    outOfStock,
    now,
  };

  const drafts: FollowUpDraft[] = [];
  const held: { orderNumber: string; reason: string }[] = [];

  for (const order of orders) {
    if (order.followUpMutedAt) {
      held.push({ orderNumber: order.orderNumber, reason: "Muted by an operator." });
      continue;
    }
    if (order.followUpCount >= MAX_FOLLOW_UPS) {
      held.push({
        orderNumber: order.orderNumber,
        reason: `Already had ${order.followUpCount} follow-ups, which is the cap.`,
      });
      continue;
    }
    if (
      order.lastFollowUpAt &&
      now - order.lastFollowUpAt.getTime() < MIN_GAP_DAYS * DAY_MS
    ) {
      const days = Math.ceil(
        (MIN_GAP_DAYS * DAY_MS - (now - order.lastFollowUpAt.getTime())) / DAY_MS,
      );
      held.push({
        orderNumber: order.orderNumber,
        reason: `Followed up ${dateOf(order.lastFollowUpAt)} — eligible again in ${days} day${days === 1 ? "" : "s"}.`,
      });
      continue;
    }
    drafts.push(draftFor(order, ctx));
  }

  return {
    drafts,
    held,
    totals: {
      count: drafts.length,
      value: drafts.reduce((sum, d) => sum + d.total, 0),
    },
  };
}

/** One order's draft, re-derived from the database. The send path's source of truth. */
export async function draftForOrder(orderId: string): Promise<FollowUpDraft | null> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: QUEUE_SELECT,
  });
  if (!order) return null;

  const [rails, conversation] = await Promise.all([
    prisma.paymentOption.findMany({ select: { key: true, instructions: true } }),
    prisma.conversation.findFirst({
      where: { orderId, adminUnread: { gt: 0 } },
      select: { id: true },
    }),
  ]);

  return draftFor(order, {
    railsWithoutDetails: new Set(
      rails.filter((r) => !r.instructions?.trim()).map((r) => r.key),
    ),
    unansweredChat: conversation ? new Set([orderId]) : new Set(),
    // Supply is an operator warning on the queue, not a send-time concern: by
    // the time this runs the operator has already read it and decided.
    goneFromCatalogue: new Set(),
    outOfStock: new Set(),
    now: Date.now(),
  });
}

// --- Sending -----------------------------------------------------------------

export interface FollowUpSendItem {
  orderId: string;
  /** The operator's edit, when they made one. Falls back to the derived draft. */
  subject?: string;
  paragraphs?: string[];
}

export type FollowUpOutcome =
  | { orderId: string; orderNumber: string; ok: true; track: FollowUpTrack }
  | { orderId: string; orderNumber: string; ok: false; error: string };

export interface FollowUpSendReport {
  ok: boolean;
  /** Set when the whole batch failed before anything was claimed. */
  error?: string;
  sent: number;
  failed: number;
  outcomes: FollowUpOutcome[];
}

/** 200 characters of subject line is already more than any client will show. */
const MAX_SUBJECT = 200;
const MAX_BODY = 4000;

export function validateFollowUpEdit(input: {
  subject?: string;
  paragraphs?: string[];
}): string | null {
  if (input.subject !== undefined) {
    const s = input.subject.trim();
    if (!s) return "The subject cannot be empty.";
    if (s.length > MAX_SUBJECT) return `Keep the subject under ${MAX_SUBJECT} characters.`;
  }
  if (input.paragraphs !== undefined) {
    const kept = input.paragraphs.map((p) => p.trim()).filter(Boolean);
    if (kept.length === 0) return "The message cannot be empty.";
    if (kept.join("\n\n").length > MAX_BODY) {
      return `Keep the message under ${MAX_BODY} characters.`;
    }
  }
  return null;
}

/** Eligibility, re-checked at send time so a tab left open overnight cannot send twice. */
function ineligibleReason(
  order: { followUpMutedAt: Date | null; followUpCount: number; lastFollowUpAt: Date | null },
  now: number,
): string | null {
  if (order.followUpMutedAt) return "Follow-ups are muted on this order.";
  if (order.followUpCount >= MAX_FOLLOW_UPS) {
    return `This order has already had ${order.followUpCount} follow-ups.`;
  }
  if (
    order.lastFollowUpAt &&
    now - order.lastFollowUpAt.getTime() < MIN_GAP_DAYS * DAY_MS
  ) {
    return `It was followed up on ${dateOf(order.lastFollowUpAt)} — too recent to send again.`;
  }
  return null;
}

/**
 * Send one batch of follow-ups.
 *
 * The transport is verified before anything is claimed (withCampaignMailer does
 * that), so a missing Brevo key or an outage fails the whole call with nothing
 * written and nothing half-sent. Once the connection is good, each order is
 * claimed by inserting its OrderFollowUp row BEFORE the message leaves — the
 * unique (orderId, sequence) means a double click or a stale second tab loses
 * the insert and sends nothing.
 *
 * A send that throws at the SMTP stage still keeps its claim. That looks harsh
 * on a transport blip, but the alternative is worse: nodemailer rejecting after
 * the server has accepted the message would release the slot and mail the same
 * person twice.
 */
export async function sendFollowUps(
  items: FollowUpSendItem[],
): Promise<FollowUpSendReport> {
  if (items.length === 0) {
    return { ok: true, sent: 0, failed: 0, outcomes: [] };
  }

  // Imported here rather than at the top of the module so that loading the
  // queue — which every render of the admin page does — does not also pull in
  // nodemailer and the link-minting code.
  const { withCampaignMailer } = await import("@/lib/campaign-mailer");
  const { buildFollowUpEmail } = await import("@/lib/emails/followUpEmail");
  const { issueLoginLink } = await import("@/lib/login-link");
  const { signInLinkUrl } = await import("@/lib/emails/signInLinkEmail");

  const SITE = (
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://bourbonoaklover.com"
  ).replace(/\/$/, "");

  const result = await withCampaignMailer(2, async (send) => {
    const outcomes: FollowUpOutcome[] = [];

    for (const item of items) {
      const now = Date.now();
      const order = await prisma.order.findUnique({
        where: { id: item.orderId },
        select: {
          orderNumber: true,
          email: true,
          status: true,
          followUpMutedAt: true,
          followUpCount: true,
          lastFollowUpAt: true,
        },
      });
      if (!order) {
        outcomes.push({
          orderId: item.orderId,
          orderNumber: item.orderId,
          ok: false,
          error: "Order not found.",
        });
        continue;
      }
      if (order.status !== "PENDING") {
        outcomes.push({
          orderId: item.orderId,
          orderNumber: order.orderNumber,
          ok: false,
          error: `The order is ${order.status.toLowerCase()} — there is nothing to follow up.`,
        });
        continue;
      }
      const blocked = ineligibleReason(order, now);
      if (blocked) {
        outcomes.push({
          orderId: item.orderId,
          orderNumber: order.orderNumber,
          ok: false,
          error: blocked,
        });
        continue;
      }

      const draft = await draftForOrder(item.orderId);
      if (!draft) {
        outcomes.push({
          orderId: item.orderId,
          orderNumber: order.orderNumber,
          ok: false,
          error: "Could not build a draft for this order.",
        });
        continue;
      }

      const subject = item.subject?.trim() || draft.subject;
      const paragraphs = (item.paragraphs ?? draft.paragraphs)
        .map((p) => p.trim())
        .filter(Boolean);
      const invalid = validateFollowUpEdit({ subject, paragraphs });
      if (invalid) {
        outcomes.push({
          orderId: item.orderId,
          orderNumber: order.orderNumber,
          ok: false,
          error: invalid,
        });
        continue;
      }

      /* Claim the slot. Both writes in one transaction so the counter on the
         order and the history row can never disagree about how many follow-ups
         an order has had. */
      let followUpId: string;
      try {
        const [row] = await prisma.$transaction([
          prisma.orderFollowUp.create({
            data: {
              orderId: item.orderId,
              track: draft.track,
              sequence: draft.sequence,
              subject,
              body: paragraphs.join("\n\n"),
              status: "SENDING",
              sentBy: FOLLOW_UP_OPERATOR,
            },
            select: { id: true },
          }),
          prisma.order.update({
            where: { id: item.orderId },
            data: { followUpCount: { increment: 1 }, lastFollowUpAt: new Date() },
          }),
        ]);
        followUpId = row.id;
      } catch (err) {
        const taken =
          err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";
        outcomes.push({
          orderId: item.orderId,
          orderNumber: order.orderNumber,
          ok: false,
          error: taken
            ? "Another tab or request already sent this follow-up."
            : "Could not record the follow-up, so nothing was sent.",
        });
        continue;
      }

      /* Mint the one-click link. consumePrevious is false so that a buyer who
         still has an unopened link from their order confirmation does not find
         it broken by this email. If minting fails the message still goes — the
         plain account page is a worse experience, not a wrong one. */
      let orderUrl = `${SITE}/account`;
      try {
        const link = await issueLoginLink(order.email, { consumePrevious: false });
        if (link.ok) orderUrl = signInLinkUrl(link.token);
      } catch (err) {
        console.error(`[follow-up] link for ${order.orderNumber} failed:`, err);
      }

      const mail = buildFollowUpEmail({ draft, subject, paragraphs, orderUrl });
      /* No unsubscribeUrl: this is transactional. The recipient is being
         written to because they placed this order, and an Unsubscribe button
         rendered beside instructions for paying us would be absurd. See
         CampaignEmail.unsubscribeUrl. */
      const outcome = await send({
        to: order.email,
        subject: mail.subject,
        html: mail.html,
        text: mail.text,
        tag: FOLLOW_UP_TAG,
      });

      await prisma.orderFollowUp.update({
        where: { id: followUpId },
        data: outcome.ok
          ? { status: "SENT", messageId: outcome.messageId }
          : { status: "FAILED", error: outcome.error.slice(0, 500) },
      });

      outcomes.push(
        outcome.ok
          ? {
              orderId: item.orderId,
              orderNumber: order.orderNumber,
              ok: true,
              track: draft.track,
            }
          : {
              orderId: item.orderId,
              orderNumber: order.orderNumber,
              ok: false,
              error: outcome.error,
            },
      );
    }

    return outcomes;
  });

  if (!result.ok) {
    return { ok: false, error: result.error, sent: 0, failed: 0, outcomes: [] };
  }

  const outcomes = result.value;
  return {
    ok: true,
    sent: outcomes.filter((o) => o.ok).length,
    failed: outcomes.filter((o) => !o.ok).length,
    outcomes,
  };
}

/** Stop chasing an order, or start again. */
export async function setFollowUpMuted(
  orderId: string,
  muted: boolean,
): Promise<void> {
  await prisma.order.update({
    where: { id: orderId },
    data: { followUpMutedAt: muted ? new Date() : null },
  });
}

/** What this order has already been sent, newest first. */
export async function followUpHistory(orderId: string) {
  return prisma.orderFollowUp.findMany({
    where: { orderId },
    orderBy: { sequence: "desc" },
    select: {
      track: true,
      sequence: true,
      subject: true,
      body: true,
      status: true,
      error: true,
      sentAt: true,
    },
  });
}
