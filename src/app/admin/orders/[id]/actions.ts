"use server";

import { revalidatePath } from "next/cache";
import { OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const ALLOWED_STATUSES: OrderStatus[] = [
  "PENDING",
  "PAID",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
];

export async function updateOrderStatus(id: string, status: OrderStatus) {
  if (!id) throw new Error("Missing order id.");
  if (!ALLOWED_STATUSES.includes(status)) {
    throw new Error(`Invalid status: ${status}`);
  }

  await prisma.order.update({
    where: { id },
    data: { status },
  });

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
  revalidatePath("/admin");
}

export async function updateOrderNotes(id: string, formData: FormData) {
  if (!id) throw new Error("Missing order id.");
  const raw = formData.get("notes");
  const notes = typeof raw === "string" ? raw.trim() : "";

  await prisma.order.update({
    where: { id },
    data: { notes: notes.length > 0 ? notes : null },
  });

  revalidatePath(`/admin/orders/${id}`);
}
