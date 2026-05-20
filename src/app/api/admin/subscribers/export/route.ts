import { NextRequest, NextResponse } from "next/server";
import type { SubscriberStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export async function GET(req: NextRequest) {
  const filterRaw = req.nextUrl.searchParams.get("filter") ?? "subscribed";
  const where =
    filterRaw === "subscribed"
      ? { status: "SUBSCRIBED" as SubscriberStatus }
      : filterRaw === "unsubscribed"
        ? { status: "UNSUBSCRIBED" as SubscriberStatus }
        : {};

  const subscribers = await prisma.subscriber.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  const header = ["email", "status", "source", "createdAt"].join(",");
  const rows = subscribers.map((s) =>
    [
      csvEscape(s.email),
      csvEscape(s.status),
      csvEscape(s.source ?? ""),
      csvEscape(s.createdAt.toISOString()),
    ].join(",")
  );

  const csv = [header, ...rows].join("\n");
  const stamp = new Date().toISOString().slice(0, 10);

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="subscribers-${filterRaw}-${stamp}.csv"`,
    },
  });
}
