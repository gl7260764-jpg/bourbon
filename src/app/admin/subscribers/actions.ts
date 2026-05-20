"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function toggleSubscriberStatus(id: string) {
  const current = await prisma.subscriber.findUnique({ where: { id } });
  if (!current) return;

  await prisma.subscriber.update({
    where: { id },
    data: {
      status:
        current.status === "SUBSCRIBED" ? "UNSUBSCRIBED" : "SUBSCRIBED",
    },
  });

  revalidatePath("/admin/subscribers");
}

export async function deleteSubscriber(id: string) {
  await prisma.subscriber.delete({ where: { id } });
  revalidatePath("/admin/subscribers");
}
