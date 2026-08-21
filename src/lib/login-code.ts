import { createHash, randomInt, timingSafeEqual } from "node:crypto";
import { prisma } from "@/lib/prisma";

/**
 * One-time email codes for customer sign-in.
 *
 * Only a SHA-256 hash of the code is stored. A 6-digit code has a tiny
 * keyspace, so the protection here is not the hash itself — it is the
 * combination of a short TTL, a hard attempt cap, and single use. The hash
 * exists so a leaked database row is not a working login.
 */

export const CODE_TTL_MINUTES = 10;
export const MAX_ATTEMPTS = 5;
/** Codes a single address may request inside the window, to stop mail-bombing. */
export const MAX_ISSUES_PER_WINDOW = 5;
export const ISSUE_WINDOW_MINUTES = 15;

function hash(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

/** Cryptographically random — Math.random() is predictable and unusable here. */
function newCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

export type IssueResult =
  | { ok: true; code: string }
  | { ok: false; reason: "rate_limited" };

export async function issueLoginCode(email: string): Promise<IssueResult> {
  const since = new Date(Date.now() - ISSUE_WINDOW_MINUTES * 60_000);
  const recent = await prisma.loginCode.count({
    where: { email, createdAt: { gte: since } },
  });
  if (recent >= MAX_ISSUES_PER_WINDOW) return { ok: false, reason: "rate_limited" };

  const code = newCode();
  // Any earlier unconsumed code for this address dies now, so a second request
  // cannot leave two valid codes in play.
  await prisma.loginCode.updateMany({
    where: { email, consumedAt: null },
    data: { consumedAt: new Date() },
  });
  await prisma.loginCode.create({
    data: {
      email,
      codeHash: hash(code),
      expiresAt: new Date(Date.now() + CODE_TTL_MINUTES * 60_000),
    },
  });
  return { ok: true, code };
}

export type VerifyResult =
  | { ok: true }
  | { ok: false; reason: "no_code" | "expired" | "too_many" | "mismatch" };

export async function verifyLoginCode(
  email: string,
  candidate: string,
): Promise<VerifyResult> {
  const row = await prisma.loginCode.findFirst({
    where: { email, consumedAt: null },
    orderBy: { createdAt: "desc" },
  });
  if (!row) return { ok: false, reason: "no_code" };
  if (row.expiresAt < new Date()) return { ok: false, reason: "expired" };
  if (row.attempts >= MAX_ATTEMPTS) return { ok: false, reason: "too_many" };

  // Count the attempt before comparing, so a crash mid-verify cannot hand
  // someone a free guess.
  await prisma.loginCode.update({
    where: { id: row.id },
    data: { attempts: { increment: 1 } },
  });

  const a = Buffer.from(hash(candidate.trim()));
  const b = Buffer.from(row.codeHash);
  const match = a.length === b.length && timingSafeEqual(a, b);
  if (!match) return { ok: false, reason: "mismatch" };

  await prisma.loginCode.update({
    where: { id: row.id },
    data: { consumedAt: new Date() },
  });
  return { ok: true };
}
