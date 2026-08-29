"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { validatePaymentOption } from "@/lib/payment-options";

// Reached only from /admin/payment-methods, which the middleware guard covers
// (src/middleware.ts matcher: /admin/:path*).

export interface ActionResult {
  ok: boolean;
  error?: string;
}

function revalidate() {
  revalidatePath("/admin/payment-methods");
  // Checkout renders the rails, and the confirmation page reads the snapshot.
  revalidatePath("/checkout");
}

export async function savePaymentOption(
  id: string | null,
  formData: FormData,
): Promise<ActionResult> {
  const parsed = validatePaymentOption({
    key: formData.get("key"),
    label: formData.get("label"),
    detail: formData.get("detail"),
    discountRate: Number(formData.get("discountPercent") ?? 0) / 100,
    isActive: formData.get("isActive") === "on",
    sortOrder: Number(formData.get("sortOrder") ?? 0),
  });

  if ("error" in parsed) return { ok: false, error: parsed.error };
  const v = parsed.value;

  try {
    if (id) {
      // `key` is intentionally not updated — orders store it as a snapshot and
      // changing it would orphan their reference.
      await prisma.paymentOption.update({
        where: { id },
        data: {
          label: v.label,
          detail: v.detail,
          discountRate: new Prisma.Decimal(v.discountRate),
          isActive: v.isActive,
          sortOrder: v.sortOrder,
        },
      });
    } else {
      await prisma.paymentOption.create({
        data: {
          key: v.key,
          label: v.label,
          detail: v.detail,
          discountRate: new Prisma.Decimal(v.discountRate),
          isActive: v.isActive,
          sortOrder: v.sortOrder,
          // Operator-created rails have no legacy enum counterpart; orders
          // placed against them record PaymentMethod.OTHER.
          legacyMethod: null,
        },
      });
    }
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return { ok: false, error: `A payment method with the key "${v.key}" already exists.` };
    }
    console.error("[savePaymentOption] failed:", err);
    return { ok: false, error: "Could not save. Please try again." };
  }

  revalidate();
  return { ok: true };
}

export async function togglePaymentOption(id: string): Promise<ActionResult> {
  const existing = await prisma.paymentOption.findUnique({
    where: { id },
    select: { isActive: true },
  });
  if (!existing) return { ok: false, error: "Payment method not found." };

  await prisma.paymentOption.update({
    where: { id },
    data: { isActive: !existing.isActive },
  });
  revalidate();
  return { ok: true };
}

export async function deletePaymentOption(id: string): Promise<ActionResult> {
  const existing = await prisma.paymentOption.findUnique({
    where: { id },
    select: { key: true },
  });
  if (!existing) return { ok: false, error: "Payment method not found." };

  // Orders snapshot the label and instructions at order time, so deleting a
  // rail never damages order history — but refuse anyway if it has been used,
  // so reporting by key keeps resolving. Deactivating is the safe default.
  const used = await prisma.order.count({
    where: { paymentOptionKey: existing.key },
  });
  if (used > 0) {
    return {
      ok: false,
      error: `${used} order(s) used this method. Turn it off instead of deleting so order history stays intact.`,
    };
  }

  await prisma.paymentOption.delete({ where: { id } });
  revalidate();
  return { ok: true };
}
