import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { notifyAsync } from "@/lib/ntfy";
import { VISITOR_COOKIE } from "@/lib/visitor";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  let body: { email?: string; source?: string };
  try {
    body = (await req.json()) as { email?: string; source?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  const source = body.source?.trim().slice(0, 80) || "newsletter";

  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json(
      { error: "Please enter a valid email address." },
      { status: 400 }
    );
  }

  // Cookie is httpOnly, so this is the server's read of who is submitting.
  // It may be absent (cookie blocked, or track-visit never ran) — capturing
  // the email still has to work in that case, just without the linkage.
  const visitorId = req.cookies.get(VISITOR_COOKIE)?.value ?? null;

  try {
    const linkedVisitorId = visitorId
      ? (
          await prisma.visitor.findUnique({
            where: { id: visitorId },
            select: { id: true },
          })
        )?.id ?? null
      : null;

    await prisma.subscriber.upsert({
      where: { email },
      create: { email, source, visitorId: linkedVisitorId },
      update: {
        status: "SUBSCRIBED",
        // Only fill the link in; never overwrite the session that first
        // captured them with a later one.
        ...(linkedVisitorId ? { visitorId: linkedVisitorId } : {}),
      },
    });

    notifyAsync({
      event: "subscriber",
      title: "New subscriber",
      message: `${email}${source ? `\nvia ${source}` : ""}`,
      url: "/admin/subscribers",
      priority: 2,
    });

    // Stamp the identity onto the visitor so their whole journey — including
    // everything they browsed before signing up — is attributable.
    if (linkedVisitorId) {
      await prisma.visitor.update({
        where: { id: linkedVisitorId },
        data: { email, emailCapturedAt: new Date() },
      });
    }

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      console.error("[POST /api/newsletter] prisma error:", err.code, err.message);
    } else {
      console.error("[POST /api/newsletter] failed:", err);
    }
    return NextResponse.json(
      { error: "Could not save your email. Please try again." },
      { status: 500 }
    );
  }
}
