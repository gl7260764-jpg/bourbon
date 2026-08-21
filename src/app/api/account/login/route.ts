import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  createSession,
  findOrCreateCustomer,
  isValidEmail,
  normalizeEmail,
} from "@/lib/customer-auth";
import {
  CODE_TTL_MINUTES,
  issueLoginCode,
  verifyLoginCode,
} from "@/lib/login-code";
import { sendEmail } from "@/lib/mailer";

export const dynamic = "force-dynamic";

/**
 * Two-step customer sign-in.
 *
 *   { email }          → emails a 6-digit code, creates no session
 *   { email, code }    → verifies the code, then creates the session
 *
 * Sign-in used to be email-only and unverified, which meant anyone who knew a
 * customer's address could read their order history. That was tolerable when
 * the account showed only past orders; it is not now that the same account
 * carries payment details, bank screenshots and private messages.
 *
 * Everything downstream still reads sessions through lib/customer-auth, so
 * only this route changed.
 */
export async function POST(req: NextRequest) {
  let body: { email?: string; code?: string };
  try {
    body = (await req.json()) as { email?: string; code?: string };
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
  const code = typeof body.code === "string" ? body.code.trim() : "";

  // ---- Step 1: request a code -------------------------------------------
  if (!code) {
    try {
      const issued = await issueLoginCode(email);
      if (!issued.ok) {
        return NextResponse.json(
          { error: "Too many codes requested. Try again in a few minutes." },
          { status: 429 },
        );
      }

      const sent = await sendEmail({
        to: email,
        subject: `${issued.code} is your Bourbon & Oak sign-in code`,
        html: `
          <div style="font-family:Georgia,serif;max-width:480px;margin:0 auto;padding:32px 24px;color:#0C0A09">
            <p style="letter-spacing:.3em;text-transform:uppercase;font-size:11px;color:#CA8A04;margin:0 0 12px">Bourbon &amp; Oak</p>
            <h1 style="font-size:22px;margin:0 0 16px">Your sign-in code</h1>
            <p style="font-size:15px;line-height:1.6;color:#44403C;margin:0 0 20px">
              Enter this code to sign in to your account. It expires in ${CODE_TTL_MINUTES} minutes.
            </p>
            <p style="font-size:34px;letter-spacing:.35em;font-weight:bold;margin:0 0 20px">${issued.code}</p>
            <p style="font-size:13px;line-height:1.6;color:#78716C;margin:0">
              If you didn't try to sign in, you can ignore this email — no one can
              access your account without this code.
            </p>
          </div>`,
        text: `Your Bourbon & Oak sign-in code is ${issued.code}. It expires in ${CODE_TTL_MINUTES} minutes.`,
      });

      /* A mailer failure must be visible. Returning ok:true here would leave
         the customer staring at a code entry screen for an email that is never
         going to arrive. */
      if (!sent) {
        return NextResponse.json(
          { error: "We couldn't send the code. Please try again shortly." },
          { status: 502 },
        );
      }

      return NextResponse.json({ ok: true, stage: "code_sent" });
    } catch (err) {
      console.error("[account/login] issue failed:", err);
      return NextResponse.json(
        { error: "Could not start sign-in. Please try again." },
        { status: 500 },
      );
    }
  }

  // ---- Step 2: verify and create the session -----------------------------
  try {
    const result = await verifyLoginCode(email, code);
    if (!result.ok) {
      const message =
        result.reason === "expired"
          ? "That code has expired. Request a new one."
          : result.reason === "too_many"
            ? "Too many incorrect attempts. Request a new code."
            : result.reason === "no_code"
              ? "Request a code first."
              : "That code is not correct.";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const customer = await findOrCreateCustomer(email);
    await prisma.customer.update({
      where: { id: customer.id },
      data: { lastLoginAt: new Date() },
    });
    await createSession(customer.id);

    return NextResponse.json({ ok: true, stage: "signed_in" });
  } catch (err) {
    console.error("[account/login] verify failed:", err);
    return NextResponse.json(
      { error: "Could not sign you in. Please try again." },
      { status: 500 },
    );
  }
}
