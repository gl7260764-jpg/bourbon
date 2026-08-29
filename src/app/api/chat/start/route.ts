import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  createSession,
  findOrCreateCustomer,
  isValidEmail,
  normalizeEmail,
} from "@/lib/customer-auth";
import { getAuthMode } from "@/lib/settings";
import { getOrCreateCustomerThread, mergeOrderThreadsIntoPrimary } from "@/lib/customer-chat";
import { appendMessage } from "@/lib/order-chat";
import { issueLoginLink } from "@/lib/login-link";
import { buildSignInLinkEmail } from "@/lib/emails/signInLinkEmail";
import { sendEmail } from "@/lib/mailer";

export const dynamic = "force-dynamic";

const MAX_BODY = 4000;

/**
 * First message from the storefront chat, with the sender's email.
 *
 * The visitor gives an address before their first message so the reply has
 * somewhere to go. That address creates (or finds) their account and their one
 * ongoing thread, and the message lands in it — the operator sees it in the
 * same inbox as everything else.
 *
 * What happens NEXT depends on Admin > Settings > Customer sign-in, and
 * deliberately so. Typing an address into a chat box is not proof of owning it,
 * so signing the sender straight into that account would hand anyone who knows
 * a customer's address their payment details, receipts and order history. Only
 * EMAIL_ONLY — where the operator has already accepted exactly that trade for
 * the whole site — signs them in here. The other modes still take the message
 * and still create the account; they just send a one-tap link instead of
 * assuming the typist is the owner.
 */
export async function POST(req: NextRequest) {
  let body: { email?: string; message?: string };
  try {
    body = (await req.json()) as { email?: string; message?: string };
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const rawEmail = body.email ?? "";
  if (!isValidEmail(rawEmail)) {
    return NextResponse.json(
      { error: "Please enter a valid email address." },
      { status: 400 },
    );
  }
  const email = normalizeEmail(rawEmail);

  const message = (body.message ?? "").trim();
  if (!message) {
    return NextResponse.json({ error: "Type a message first." }, { status: 400 });
  }
  if (message.length > MAX_BODY) {
    return NextResponse.json({ error: "That message is too long." }, { status: 400 });
  }

  try {
    const customer = await findOrCreateCustomer(email, {});
    // Anything left over from the per-order era folds in before their first
    // message, so the thread they land on is complete from the start.
    await mergeOrderThreadsIntoPrimary(customer.id);
    const thread = await getOrCreateCustomerThread(customer.id);

    await appendMessage({
      conversationId: thread.id,
      sender: "VISITOR",
      kind: "TEXT",
      body: message,
    });

    const mode = await getAuthMode();

    if (mode === "EMAIL_ONLY") {
      await prisma.customer.update({
        where: { id: customer.id },
        data: { lastLoginAt: new Date() },
      });
      await createSession(customer.id);
      return NextResponse.json({ ok: true, next: "dashboard" });
    }

    /* Message is already delivered either way — the link is only about getting
       them to the dashboard to continue. A mailer failure is reported so the
       widget can say the message landed but the link did not. */
    let linkSent = false;
    try {
      const link = await issueLoginLink(email);
      if (link.ok) {
        linkSent = await sendEmail({ to: email, ...buildSignInLinkEmail(link.token) });
      }
    } catch (err) {
      console.error("[chat/start] could not send sign-in link:", err);
    }

    return NextResponse.json({ ok: true, next: linkSent ? "check_email" : "sent_only" });
  } catch (err) {
    console.error("[chat/start] failed:", err);
    return NextResponse.json(
      { error: "Could not send your message. Please try again." },
      { status: 500 },
    );
  }
}
