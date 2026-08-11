import { prisma } from "@/lib/prisma";
import {
  DEFAULT_POPUP_SETTINGS,
  POPUP_DELAY_KEY,
  POPUP_ENABLED_KEY,
  POPUP_NAG_KEY,
  POPUP_REPROMPT_DAYS_KEY,
  normalizePopupSettings,
  type PopupSettings,
} from "@/lib/popup-constants";

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

/**
 * Email-capture popup config. Read in one round trip rather than four
 * getSetting() calls, since the storefront hits this on every page load.
 */
export async function getPopupSettings(): Promise<PopupSettings> {
  const rows = await prisma.setting.findMany({
    where: {
      key: {
        in: [
          POPUP_ENABLED_KEY,
          POPUP_DELAY_KEY,
          POPUP_NAG_KEY,
          POPUP_REPROMPT_DAYS_KEY,
        ],
      },
    },
  });
  const map = new Map(rows.map((r) => [r.key, r.value]));

  return normalizePopupSettings({
    enabled: map.has(POPUP_ENABLED_KEY)
      ? map.get(POPUP_ENABLED_KEY) === "true"
      : DEFAULT_POPUP_SETTINGS.enabled,
    delaySeconds: map.has(POPUP_DELAY_KEY)
      ? Number(map.get(POPUP_DELAY_KEY))
      : DEFAULT_POPUP_SETTINGS.delaySeconds,
    nagUntilSubscribed: map.has(POPUP_NAG_KEY)
      ? map.get(POPUP_NAG_KEY) === "true"
      : DEFAULT_POPUP_SETTINGS.nagUntilSubscribed,
    repromptAfterDays: map.has(POPUP_REPROMPT_DAYS_KEY)
      ? Number(map.get(POPUP_REPROMPT_DAYS_KEY))
      : DEFAULT_POPUP_SETTINGS.repromptAfterDays,
  });
}

export async function savePopupSettings(s: PopupSettings): Promise<void> {
  await prisma.$transaction([
    prisma.setting.upsert({
      where: { key: POPUP_ENABLED_KEY },
      update: { value: String(s.enabled) },
      create: { key: POPUP_ENABLED_KEY, value: String(s.enabled) },
    }),
    prisma.setting.upsert({
      where: { key: POPUP_DELAY_KEY },
      update: { value: String(s.delaySeconds) },
      create: { key: POPUP_DELAY_KEY, value: String(s.delaySeconds) },
    }),
    prisma.setting.upsert({
      where: { key: POPUP_NAG_KEY },
      update: { value: String(s.nagUntilSubscribed) },
      create: { key: POPUP_NAG_KEY, value: String(s.nagUntilSubscribed) },
    }),
    prisma.setting.upsert({
      where: { key: POPUP_REPROMPT_DAYS_KEY },
      update: { value: String(s.repromptAfterDays) },
      create: { key: POPUP_REPROMPT_DAYS_KEY, value: String(s.repromptAfterDays) },
    }),
  ]);
}
