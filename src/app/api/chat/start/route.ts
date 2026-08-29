import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  createSession,
  findOrCreateCustomer,
  isValidEmail,
  normalizeEmail,
} from "@/lib/customer-auth";
import { getAuthMode } from "@/lib/settings";
import { mergeIntoPrimaryThread } from "@/lib/customer-chat";
import { getOrCreateConversation, MAX_CHAT_MESSAGE_LEN } from "@/lib/chat";
import { issueLoginLink } from "@/lib/login-link";
import { buildSignInLinkEmail } from "@/lib/emails/signInLinkEmail";
import { sendEmail } from "@/lib/mailer";
import { sendToAdmins } from "@/lib/push";

export const dynamic = "force-dynamic";

/**
 * First message from the storefront widget, with the sender's address.
 *
 * The message goes into the widget's OWN device-scoped thread, not into the
 * customer's dashboard thread. That distinction is the whole security story:
 * the widget's thread is reachable only by the browser holding the visitor
 * cookie, so writing there cannot expose anyone else's history. Writing
 * straight into a thread keyed by a typed-in email would let anyone read a
 * stranger's conversation by guessing their address.
 *
 * The thread is stamped with the customer it belongs to, so the operator sees
 * a name rather than an anonymous device, and it folds into that customer's
 * one dashboard thread the moment they actually sign in.
 *
 * Where they go next depends on Admin > Settings > Customer sign-in:
 *   EMAIL_ONLY  the operator has accepted unverified sign-in site-wide, so
 *               this signs them in and hands the conversation to the dashboard
 *   otherwise   they keep chatting right here in the widget, and get a
 *               one-tap link to pick it up on the dashboard whenever they like
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
  if (message.length > MAX_CHAT_MESSAGE_LEN) {
    return NextResponse.json({ error: "That message is too long." }, { status: 400 });
  }

  /* getOrCreateConversation writes the visitor cookie onto a response, so a
     throwaway one is passed in and its cookies are copied onto the real reply
     at the end. Returning this object, or reading its headers, trips Next's
     "NextResponse.next() in a route handler" guard — same pattern as
     /api/chat/send. */
  const res = NextResponse.next();
  const withCookies = (payload: unknown, init?: ResponseInit) => {
    const out = NextResponse.json(payload, init);
    for (const cookie of res.cookies.getAll()) out.cookies.set(cookie);
    return out;
  };

  try {
    const customer = await findOrCreateCustomer(email, {});
    const { conversationId } = await getOrCreateConversation(req, res);

    /* Claim the device thread for this customer. Only ever set here and on
       merge, so an anonymous thread cannot be silently reassigned by anyone
       else typing the same address later — it is already claimed. */
    const existing = await prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { customerId: true },
    });
    if (!existing?.customerId) {
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { customerId: customer.id },
      });
    }

    await prisma.$transaction([
      prisma.chatMessage.create({
        data: { conversationId, sender: "VISITOR", body: message },
      }),
      prisma.conversation.update({
        where: { id: conversationId },
        data: {
          lastMessageAt: new Date(),
          lastMessageFrom: "VISITOR",
          status: "OPEN",
          adminUnread: { increment: 1 },
        },
      }),
    ]);

    try {
      await sendToAdmins({
        title: `New chat from ${email}`,
        body: message.length > 90 ? `${message.slice(0, 90)}…` : message,
        url: "/admin/chat",
        tag: `chat-${conversationId}`,
      });
    } catch (err) {
      console.error("[chat/start] admin push failed:", err);
    }

    const mode = await getAuthMode();

    if (mode === "EMAIL_ONLY") {
      await prisma.customer.update({
        where: { id: customer.id },
        data: { lastLoginAt: new Date() },
      });
      // Hand the conversation over intact before the dashboard opens it.
      await mergeIntoPrimaryThread(customer.id);
      await createSession(customer.id);
      return withCookies({ ok: true, next: "dashboard" });
    }

    /* Not signed in, and deliberately not. The link is the way onto the
       dashboard; until then the widget itself carries the conversation. */
    let linkSent = false;
    try {
      const link = await issueLoginLink(email);
      if (link.ok) {
        linkSent = await sendEmail({ to: email, ...buildSignInLinkEmail(link.token) });
      }
    } catch (err) {
      console.error("[chat/start] could not send sign-in link:", err);
    }

    return withCookies({ ok: true, next: "continue", linkSent });
  } catch (err) {
    console.error("[chat/start] failed:", err);
    return NextResponse.json(
      { error: "Could not send your message. Please try again." },
      { status: 500 },
    );
  }
}
