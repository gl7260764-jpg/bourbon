"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentCustomer } from "@/lib/customer-auth";

export interface ActionResult {
  ok: boolean;
  error?: string;
}

/**
 * Update the delivery details kept for prefill. Every field is optional — the
 * customer may only have some of it — but the session is not: the customer id
 * comes from the cookie, never from the form, so one account can't edit
 * another.
 */
export async function updateAccountDetails(
  formData: FormData,
): Promise<ActionResult> {
  const customer = await getCurrentCustomer();
  if (!customer) return { ok: false, error: "Please sign in again." };

  const str = (key: string, max = 120) => {
    const v = formData.get(key);
    const s = typeof v === "string" ? v.trim() : "";
    return s ? s.slice(0, max) : null;
  };

  await prisma.customer.update({
    where: { id: customer.id },
    data: {
      fullName: str("fullName"),
      phone: str("phone", 40),
      addressLine1: str("addressLine1"),
      addressLine2: str("addressLine2"),
      city: str("city", 80),
      region: str("region", 80),
      postal: str("postal", 20),
      country: str("country", 80),
    },
  });

  revalidatePath("/account");
  return { ok: true };
}
