import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/** Marks the rows that arrived through checkout rather than a signup box, so
 *  the admin list and any later audit can tell the two apart. */
export const ORDER_SUBSCRIBER_SOURCE = "order";

export type MailingListResult =
  "added" | "already-known" | "opted-out" | "failed";

/**
 * Put a buyer's address on the mailing list.
 *
 * Deliberately *not* the upsert the newsletter route uses. That one sets
 * status back to SUBSCRIBED, because someone typing their address into a
 * signup box is giving fresh consent that overrides an earlier unsubscribe.
 * An order is not that: the address arrives as a side effect of buying
 * something. So this only ever adds an address that is not already known —
 * anyone who has asked to come off the list stays off it, however many orders
 * they place afterwards. Putting them back would defeat the unsubscribe link
 * we are obliged to honour.
 *
 * Never throws. A mailing list write must not be able to fail a checkout.
 */
export async function addBuyerToMailingList(
  rawEmail: string,
): Promise<MailingListResult> {
  const email = rawEmail.trim().toLowerCase();
  if (!email.includes("@")) return "failed";

  try {
    const existing = await prisma.subscriber.findUnique({
      where: { email },
      select: { status: true },
    });
    if (existing) {
      return existing.status === "UNSUBSCRIBED" ? "opted-out" : "already-known";
    }

    await prisma.subscriber.create({
      data: { email, source: ORDER_SUBSCRIBER_SOURCE },
    });
    return "added";
  } catch (err) {
    // P2002 is the unique index on email: a second order for the same address
    // landed between the read and the write. The row exists, which is the
    // outcome we wanted — not an error.
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return "already-known";
    }
    console.error("[mailing-list] could not add buyer:", err);
    return "failed";
  }
}
