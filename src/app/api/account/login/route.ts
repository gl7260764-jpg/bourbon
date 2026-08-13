import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  createSession,
  findOrCreateCustomer,
  isValidEmail,
  normalizeEmail,
} from "@/lib/customer-auth";

export const dynamic = "force-dynamic";

/**
 * Email-only sign-in, unverified by product decision.
 *
 * ⚠ Anyone who knows a customer's email address can sign in as them and read
 * their home address, phone number and order history. This is accepted for now.
 * The upgrade path is to email a one-time link from here instead of creating
 * the session immediately — nothing else in the app needs to change, because
 * every other surface reads sessions through lib/customer-auth.
 */
export async function POST(req: NextRequest) {
  let body: { email?: string };
  try {
    body = (await req.json()) as { email?: string };
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const raw = body.email ?? "";
  if (!isValidEmail(raw)) {
    return NextResponse.json(
      { error: "Please enter a valid email address." },
      { status: 400 },
    );
  }

  const email = normalizeEmail(raw);

  try {
    // Signing in with an address that has ordered before adopts that account;
    // a brand-new address gets an empty one, which is harmless and keeps the
    // flow identical either way.
    const customer = await findOrCreateCustomer(email);

    await prisma.customer.update({
      where: { id: customer.id },
      data: { lastLoginAt: new Date() },
    });

    await createSession(customer.id);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[account/login] failed:", err);
    return NextResponse.json(
      { error: "Could not sign you in. Please try again." },
      { status: 500 },
    );
  }
}
