import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";

/**
 * One-click sign-in links.
 *
 * The security model is the same as a password-reset link: the secret goes to
 * the mailbox, so possession of the mailbox is the proof. Unlike a 6-digit
 * code the keyspace is large enough to be the protection on its own, which is
 * why there is no attempt cap here — there is nothing to brute force.
 *
 * Only a SHA-256 hash is stored, so a leaked database row is not a working
 * login. A plain hash (no salt, no KDF) is correct for a 256-bit random token:
 * there is no dictionary to attack, and the lookup has to be by exact value.
 */

/** Long enough that an order email sitting unread for a week still works. */
export const LINK_TTL_DAYS = 7;
/** Links a single address may request inside the window, to stop mail-bombing. */
export const MAX_ISSUES_PER_WINDOW = 5;
export const ISSUE_WINDOW_MINUTES = 15;

function hash(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function newLinkToken(): string {
  return randomBytes(32).toString("base64url");
}

export type IssueLinkResult =
  | { ok: true; token: string }
  | { ok: false; reason: "rate_limited" };

/**
 * Mint a link for an address. `consumePrevious` is the default because a fresh
 * request should invalidate the older link; the order-confirmation path passes
 * false so that sending a second email does not silently break the first one
 * the buyer may already have open.
 */
export async function issueLoginLink(
  email: string,
  { consumePrevious = true }: { consumePrevious?: boolean } = {},
): Promise<IssueLinkResult> {
  const since = new Date(Date.now() - ISSUE_WINDOW_MINUTES * 60_000);
  const recent = await prisma.loginLink.count({
    where: { email, createdAt: { gte: since } },
  });
  if (recent >= MAX_ISSUES_PER_WINDOW) return { ok: false, reason: "rate_limited" };

  if (consumePrevious) {
    await prisma.loginLink.updateMany({
      where: { email, consumedAt: null },
      data: { consumedAt: new Date() },
    });
  }

  const token = newLinkToken();
  await prisma.loginLink.create({
    data: {
      email,
      tokenHash: hash(token),
      expiresAt: new Date(Date.now() + LINK_TTL_DAYS * 24 * 60 * 60 * 1000),
    },
  });
  return { ok: true, token };
}

export type VerifyLinkResult =
  | { ok: true; email: string }
  | { ok: false; reason: "invalid" | "expired" | "used" };

/**
 * Exchange a token for the address it was issued to, consuming it.
 *
 * Consumption is a conditional update rather than a read-then-write, so two
 * simultaneous clicks — a mail client prefetching the link and the human
 * tapping it — cannot both succeed.
 */
export async function verifyLoginLink(token: string): Promise<VerifyLinkResult> {
  if (!token) return { ok: false, reason: "invalid" };

  const row = await prisma.loginLink.findUnique({
    where: { tokenHash: hash(token) },
  });
  if (!row) return { ok: false, reason: "invalid" };
  if (row.consumedAt) return { ok: false, reason: "used" };
  if (row.expiresAt.getTime() < Date.now()) return { ok: false, reason: "expired" };

  const claimed = await prisma.loginLink.updateMany({
    where: { id: row.id, consumedAt: null },
    data: { consumedAt: new Date() },
  });
  if (claimed.count !== 1) return { ok: false, reason: "used" };

  return { ok: true, email: row.email };
}
