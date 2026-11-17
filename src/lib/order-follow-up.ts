import { Prisma, SettlementState } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { firstNameOf } from "@/lib/order-welcome";
import { getSetting, setSetting } from "@/lib/settings";
import {
  MAX_DETAILS_LEN,
  MAX_FOLLOW_UPS,
  MIN_DETAILS_LEN,
  MIN_GAP_DAYS,
  STALE_DAYS,
  detailsTemplateKey,
  type FollowUpDraft,
  type FollowUpTrack,
  type RailDetailsRow,
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
  /** The payment rails in play, with the starting point saved for each. */
  rails: RailDetailsRow[];
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
  /**
   * Per-rail starting points for payment details, by rail key.
   *
   * This replaces an earlier read of PaymentOption.instructions, which was
   * wrong: that column is dead by design — rails deliberately carry no
   * account details, and a warning pointing an operator at the Payment
   * methods page sent them somewhere that says so in as many words.
   */
  detailsTemplates: Map<string, string>;
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
  facts: {
    firstName: string;
    bottles: string;
    ageDays: number;
    placedOn: string;
    rail: string;
    /** True when details go out with this send, so the copy can point at them. */
    withDetails: boolean;
  },
): { subject: string; paragraphs: string[]; ctaLabel: string } {
  const { firstName, bottles, ageDays, placedOn, rail, withDetails } = facts;
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
            withDetails
              ? `They are on your order page now. Open it below and everything you need to pay the ${sum} is there, along with somewhere to upload your receipt once you have.`
              : `If you still want it, open your order below or simply reply to this email, and the details will be with you the same day. The ${sum} we quoted stands.`,
            `If you would rather leave it, reply with a word and we will close it off. Nothing is owed either way.`,
          ],
        };
      }
      return {
        subject: `Order ${num} — one line from you and we will send the details`,
        ctaLabel: "Open my order",
        paragraphs: [
          hi,
          withDetails
            ? `Following up once more on order ${num} (${bottles}, ${sum}). The payment details are waiting on your order page — the button below opens it.`
            : `Following up once more on order ${num} (${bottles}, ${sum}). We never sent you payment details, and I would rather not let it quietly expire without asking.`,
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
            withDetails
              ? `Rather than keep chasing it, I would rather just ask: do you still want it? If you do, everything you need is already on your order page — open it below and the ${sum} we quoted still stands.`
              : `Rather than keep chasing it, I would rather just ask: do you still want it? If you do, open your order below — or reply with a yes — and I will have everything you need with you the same day. The ${sum} we quoted still stands.`,
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

  /* Details the buyer could actually pay against: what is staged on this
     order, else the rail's starting point. A staged body with no issuedAt is
     invisible to the buyer, which is what makes staging safe — the dashboard
     only renders details once they have been issued. */
  const railKey = order.paymentOptionKey;
  const staged = order.paymentDetailsBody?.trim() ?? "";
  const template = railKey ? (ctx.detailsTemplates.get(railKey) ?? "").trim() : "";
  const detailsDraft = staged || template;
  const needsDetails = order.paymentDetailsIssuedAt === null;
  /* Sending issues the details too, but only when there is something real to
     issue. Below MIN_DETAILS_LEN is a half-typed line, not an account. */
  const willIssueDetails =
    needsDetails && staged.length >= MIN_DETAILS_LEN;

  const { subject, paragraphs, ctaLabel } = compose(order, track, sequence, {
    firstName,
    bottles,
    ageDays,
    placedOn,
    rail,
    withDetails: willIssueDetails || !needsDetails,
  });

  const warnings: string[] = [];

  /* The one warning that can make a message untrue: both DETAILS_OWED and
     STILL_WANTED offer to put details in front of the buyer, and there is
     nothing to put. Fixable right here rather than somewhere else — which is
     the whole reason the details editor lives in this queue. */
  if (needsDetails && staged.length < MIN_DETAILS_LEN) {
    warnings.push(
      template
        ? `Nothing is staged against this order yet. The ${rail} starting point below is filled in — check it, add the reference to quote, and save it.`
        : `This buyer has nowhere to pay: no ${rail} details exist for this order. Write them below and they go out with the email.`,
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
    railKey,
    needsDetails,
    detailsDraft,
    willIssueDetails,
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

  const [railRows, products, conversations] = await Promise.all([
    prisma.paymentOption.findMany({ select: { key: true, label: true } }),
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

  const detailsTemplates = await loadDetailsTemplates(
    railRows.map((r) => r.key),
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
    detailsTemplates,
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

  /* Only the rails actually in the queue. A list of every rail the shop has
     ever offered would bury the two that are blocking money today. */
  const labelByKey = new Map(railRows.map((r) => [r.key, r.label]));
  const railStats = new Map<string, { orders: number; needing: number }>();
  for (const d of drafts) {
    if (!d.railKey) continue;
    const cur = railStats.get(d.railKey) ?? { orders: 0, needing: 0 };
    railStats.set(d.railKey, {
      orders: cur.orders + 1,
      needing: cur.needing + (d.warnings.length > 0 && d.needsDetails ? 1 : 0),
    });
  }
  const rails: RailDetailsRow[] = [...railStats]
    .map(([key, stat]) => ({
      key,
      label: labelByKey.get(key) ?? key,
      orders: stat.orders,
      needing: stat.needing,
      template: detailsTemplates.get(key) ?? "",
    }))
    // Rails with orders that have nowhere to pay come first: that is the work.
    .sort((a, b) => b.needing - a.needing || b.orders - a.orders);

  return {
    drafts,
    held,
    rails,
    totals: {
      count: drafts.length,
      value: drafts.reduce((sum, d) => sum + d.total, 0),
    },
  };
}

// --- Per-rail starting points ------------------------------------------------

/** Every rail's saved starting point, in one pass over the Setting table. */
export async function loadDetailsTemplates(
  railKeys: string[],
): Promise<Map<string, string>> {
  if (railKeys.length === 0) return new Map();
  const rows = await prisma.setting.findMany({
    where: { key: { in: railKeys.map(detailsTemplateKey) } },
    select: { key: true, value: true },
  });
  const byKey = new Map(rows.map((r) => [r.key, r.value]));
  return new Map(
    railKeys.map((key) => [key, byKey.get(detailsTemplateKey(key)) ?? ""]),
  );
}

/**
 * Save a rail's starting point.
 *
 * Deliberately NOT PaymentOption.instructions. That column is dead because
 * rails must not carry account details, and nothing here changes that: this
 * value is only ever typed into a per-order editor by an operator, and no
 * buyer sees it until it has been saved against their own order.
 */
export async function saveDetailsTemplate(
  railKey: string,
  body: string,
): Promise<string | null> {
  const value = body.trim();
  if (value.length > MAX_DETAILS_LEN) {
    return `Keep the details under ${MAX_DETAILS_LEN} characters.`;
  }
  await setSetting(detailsTemplateKey(railKey), value);
  return null;
}

/** One rail's starting point, for prefilling a single draft. */
export async function detailsTemplateFor(railKey: string): Promise<string> {
  return getSetting(detailsTemplateKey(railKey), "");
}

/**
 * Stage payment details against one order without telling the buyer.
 *
 * The buyer's dashboard renders details only once `paymentDetailsIssuedAt` is
 * set, so a staged body is invisible to them. That gap is the point: it lets
 * an operator write and re-read the details, see the draft change to match,
 * and send both in one go — rather than issuing details in one place, mailing
 * from another, and hoping the two said the same thing.
 */
export async function stageOrderDetails(
  orderId: string,
  body: string,
): Promise<string | null> {
  const value = body.trim();
  if (value.length < MIN_DETAILS_LEN) {
    return "Write the actual details the buyer should pay against — account or wallet, and the reference to quote.";
  }
  if (value.length > MAX_DETAILS_LEN) {
    return `Keep the details under ${MAX_DETAILS_LEN} characters.`;
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { status: true, paymentDetailsIssuedAt: true },
  });
  if (!order) return "Order not found.";
  if (order.status !== "PENDING") {
    return "That order is no longer pending, so payment details would be meaningless.";
  }
  /* Already issued means the buyer is looking at the old text right now.
     Correcting it belongs on the order page, which re-issues and re-notifies;
     silently rewriting it from here would change what they see with no word
     about why. */
  if (order.paymentDetailsIssuedAt) {
    return "These details have already been issued. Correct them from the order page, which tells the buyer they changed.";
  }

  await prisma.order.update({
    where: { id: orderId },
    data: { paymentDetailsBody: value },
  });
  return null;
}

/** One order's draft, re-derived from the database. The send path's source of truth. */
export async function draftForOrder(orderId: string): Promise<FollowUpDraft | null> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: QUEUE_SELECT,
  });
  if (!order) return null;

  const [template, conversation] = await Promise.all([
    order.paymentOptionKey
      ? detailsTemplateFor(order.paymentOptionKey)
      : Promise.resolve(""),
    prisma.conversation.findFirst({
      where: { orderId, adminUnread: { gt: 0 } },
      select: { id: true },
    }),
  ]);

  return draftFor(order, {
    detailsTemplates: new Map(
      order.paymentOptionKey ? [[order.paymentOptionKey, template]] : [],
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
  /**
   * Payment details to stage against this order before the message goes.
   * Staging and sending in one call is what makes the email true: the buyer
   * opens the link and the details are already on the page.
   */
  details?: string;
}

export type FollowUpOutcome =
  | {
      orderId: string;
      orderNumber: string;
      ok: true;
      track: FollowUpTrack;
      /** True when this send also gave the buyer somewhere to pay. */
      issuedDetails: boolean;
    }
  | { orderId: string; orderNumber: string; ok: false; error: string };

export interface FollowUpSendReport {
  ok: boolean;
  /** Set when the whole batch failed before anything was claimed. */
  error?: string;
  sent: number;
  failed: number;
  /** How many of those sends also gave a buyer somewhere to pay. */
  issued: number;
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
    return { ok: true, sent: 0, failed: 0, issued: 0, outcomes: [] };
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

      /* Stage first, draft second. The draft's wording depends on whether
         the buyer will have somewhere to pay when they open the link, so the
         details must be written before the message is composed — not after,
         which is how you end up mailing "details to follow" alongside them. */
      if (item.details !== undefined && item.details.trim()) {
        const staged = await stageOrderDetails(item.orderId, item.details);
        if (staged) {
          outcomes.push({
            orderId: item.orderId,
            orderNumber: order.orderNumber,
            ok: false,
            error: staged,
          });
          continue;
        }
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
            data: {
              followUpCount: { increment: 1 },
              lastFollowUpAt: new Date(),
              /* Issuing rides along with the claim. The message is about to
                 say the details are on the order page, so they have to be
                 visible there before it leaves — and if the claim is lost to
                 a second tab, nothing was issued either. Settlement only
                 moves off AWAITING_DETAILS; an order further along keeps the
                 state it has. */
              ...(draft.willIssueDetails
                ? {
                    paymentDetailsIssuedAt: new Date(),
                    paymentDetailsIssuedBy: FOLLOW_UP_OPERATOR,
                    settlementState: SettlementState.AWAITING_PAYMENT,
                  }
                : {}),
            },
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
              issuedDetails: draft.willIssueDetails,
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
    return {
      ok: false,
      error: result.error,
      sent: 0,
      failed: 0,
      issued: 0,
      outcomes: [],
    };
  }

  const outcomes = result.value;
  return {
    ok: true,
    sent: outcomes.filter((o) => o.ok).length,
    failed: outcomes.filter((o) => !o.ok).length,
    issued: outcomes.filter((o) => o.ok && o.issuedDetails).length,
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
