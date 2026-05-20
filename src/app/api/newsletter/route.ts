import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

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

  try {
    await prisma.subscriber.upsert({
      where: { email },
      create: { email, source },
      update: { status: "SUBSCRIBED" },
    });
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
