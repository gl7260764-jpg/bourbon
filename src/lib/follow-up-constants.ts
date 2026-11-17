/**
 * Follow-up types, labels and thresholds.
 *
 * Split out of order-follow-up.ts for the same reason campaign-constants.ts is
 * split out of campaigns.ts: the admin queue is a client component and needs
 * the labels, and importing them from the module that opens a Prisma client
 * would drag the database layer into the browser bundle.
 *
 * Client-safe: types and constants only.
 */

export type FollowUpTrack =
  /** We never sent payment details. The order is blocked on us. */
  | "DETAILS_OWED"
  /** Details were issued; the buyer has not paid. The only track that chases money. */
  | "PAYMENT_DUE"
  /** They sent a receipt and nobody has verified it. Blocked on us again. */
  | "PROOF_STALLED"
  /** Old enough that interest, not payment, is the open question. */
  | "STILL_WANTED";

export const TRACKS: FollowUpTrack[] = [
  "DETAILS_OWED",
  "PROOF_STALLED",
  "PAYMENT_DUE",
  "STILL_WANTED",
];

export const TRACK_LABEL: Record<FollowUpTrack, string> = {
  DETAILS_OWED: "We owe details",
  PAYMENT_DUE: "Payment due",
  PROOF_STALLED: "Receipt unverified",
  STILL_WANTED: "Confirm interest",
};

/** Rose marks a track where the delay is ours, which is most of this queue. */
export const TRACK_BADGE: Record<FollowUpTrack, string> = {
  DETAILS_OWED: "bg-rose-100 text-rose-800",
  PAYMENT_DUE: "bg-amber-100 text-amber-800",
  PROOF_STALLED: "bg-rose-100 text-rose-800",
  STILL_WANTED: "bg-stone-200 text-stone-700",
};

/** One line for the operator on what each track is actually saying. */
export const TRACK_SUMMARY: Record<FollowUpTrack, string> = {
  DETAILS_OWED:
    "Owns the miss and offers to send details today, or to close the order. Does not ask for money.",
  PAYMENT_DUE:
    "The only track that chases payment: details are issued and the order is genuinely waiting on the buyer.",
  PROOF_STALLED:
    "Acknowledges the receipt we have not verified. Asks for nothing.",
  STILL_WANTED:
    "Asks whether they still want it before chasing payment, and offers a clean exit.",
};

/** Past this age the question stops being "will you pay" and becomes "do you still want it". */
export const STALE_DAYS = 45;
/** Most nudges one order may ever receive. Three unanswered emails is an answer. */
export const MAX_FOLLOW_UPS = 3;
/** Minimum quiet period between two follow-ups on the same order. */
export const MIN_GAP_DAYS = 7;
/** Recipients per send request. Each one opens an SMTP round trip to Brevo. */
export const FOLLOW_UP_BATCH_SIZE = 10;

export interface FollowUpDraft {
  orderId: string;
  orderNumber: string;
  email: string;
  fullName: string;
  firstName: string;
  total: number;
  /** The bottles, in a sentence. */
  bottles: string;
  itemCount: number;
  ageDays: number;
  placedOn: string;
  /** The rail the buyer chose, in their words. */
  rail: string;
  track: FollowUpTrack;
  /** 1 for the first nudge on this order. */
  sequence: number;
  subject: string;
  /** Editable body, one paragraph per entry. The sign-in link is not in here. */
  paragraphs: string[];
  /** Label on the button the template always appends. Not editable. */
  ctaLabel: string;
  /** Why this track was chosen, for the operator — never sent. */
  reason: string;
  /** Things to know before pressing send. Never sent. */
  warnings: string[];
}

export interface FollowUpHistoryRow {
  track: string;
  sequence: number;
  subject: string;
  status: string;
  error: string | null;
  sentAt: string;
}
