import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Admin inbox. Returns OPEN conversations newest-first with a last-message
 * preview, unread count, and the visitor's geo for context. Polled by the
 * admin chat page to keep the list and unread badges live.
 */
export async function GET() {
  const conversations = await prisma.conversation.findMany({
    where: { status: "OPEN" },
    orderBy: { lastMessageAt: "desc" },
    take: 100,
    select: {
      id: true,
      visitorId: true,
      lastMessageAt: true,
      lastMessageFrom: true,
      adminUnread: true,
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { body: true, sender: true },
      },
    },
  });

  const visitorIds = conversations.map((c) => c.visitorId);
  const visitors = await prisma.visitor.findMany({
    where: { id: { in: visitorIds } },
    select: { id: true, country: true, city: true, countryCode: true },
  });
  const geoById = new Map(visitors.map((v) => [v.id, v]));

  const items = conversations.map((c) => {
    const geo = geoById.get(c.visitorId);
    return {
      id: c.id,
      lastMessageAt: c.lastMessageAt,
      lastMessageFrom: c.lastMessageFrom,
      adminUnread: c.adminUnread,
      preview: c.messages[0]?.body ?? "",
      location: geo
        ? [geo.city, geo.country].filter(Boolean).join(", ") || null
        : null,
      countryCode: geo?.countryCode ?? null,
    };
  });

  const totalUnread = items.reduce((sum, c) => sum + c.adminUnread, 0);

  return NextResponse.json({ conversations: items, totalUnread });
}
