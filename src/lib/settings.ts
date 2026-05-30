import { prisma } from "@/lib/prisma";

/**
 * Tiny key-value settings store backed by the `Setting` table. Use for small
 * bits of admin-editable config (e.g. the live-chat greeting) that don't
 * warrant their own model.
 */
export async function getSetting(
  key: string,
  fallback: string,
): Promise<string> {
  const row = await prisma.setting.findUnique({ where: { key } });
  return row?.value ?? fallback;
}

export async function setSetting(key: string, value: string): Promise<void> {
  await prisma.setting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
}
