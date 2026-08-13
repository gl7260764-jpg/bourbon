import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export const CUSTOMER_COOKIE = "bol_customer";
const SESSION_DAYS = 30;

/**
 * Customer sessions.
 *
 * The cookie holds a random opaque token and nothing else — no email, no id,
 * no signature to verify — so a stolen or forged cookie is useless unless the
 * token exists in the database, and any session can be revoked server-side.
 *
 * This module deliberately knows nothing about how a session was *granted*.
 * Sign-in is currently unverified (email only, by product decision); adding a
 * magic link or OTP later means changing only the login route, because
 * everything downstream reads sessions through here.
 */

function newToken(): string {
  // 32 random bytes, hex — 256 bits of entropy, not guessable.
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export function isValidEmail(raw: string): boolean {
  return EMAIL_RE.test(normalizeEmail(raw));
}

/**
 * Find the customer for this email, creating the account if it's new.
 * Called from the order route (first order creates the account) and from
 * login.
 */
export async function findOrCreateCustomer(
  email: string,
  details?: {
    fullName?: string | null;
    phone?: string | null;
    addressLine1?: string | null;
    addressLine2?: string | null;
    city?: string | null;
    region?: string | null;
    postal?: string | null;
    country?: string | null;
  },
) {
  const normalized = normalizeEmail(email);

  // Only overwrite prefill fields with non-empty values, so a later order that
  // omits something can't blank out what we already knew.
  const updates = Object.fromEntries(
    Object.entries(details ?? {}).filter(([, v]) => v != null && v !== ""),
  );

  return prisma.customer.upsert({
    where: { email: normalized },
    update: updates,
    create: { email: normalized, ...updates },
  });
}

export async function createSession(customerId: string): Promise<string> {
  const token = newToken();
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  await prisma.customerSession.create({
    data: { token, customerId, expiresAt },
  });

  const jar = await cookies();
  jar.set(CUSTOMER_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });

  return token;
}

/** The signed-in customer, or null. Safe to call from any server component. */
export async function getCurrentCustomer() {
  const jar = await cookies();
  const token = jar.get(CUSTOMER_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.customerSession.findUnique({
    where: { token },
    include: { customer: true },
  });
  if (!session) return null;

  if (session.expiresAt.getTime() < Date.now()) {
    // Expired sessions are cleaned up on the way past rather than by a cron.
    await prisma.customerSession
      .delete({ where: { id: session.id } })
      .catch(() => {});
    return null;
  }

  return session.customer;
}

export async function destroyCurrentSession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(CUSTOMER_COOKIE)?.value;
  if (token) {
    await prisma.customerSession.deleteMany({ where: { token } });
  }
  jar.delete(CUSTOMER_COOKIE);
}
