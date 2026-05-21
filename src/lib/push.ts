import webpush from "web-push";
import { prisma } from "@/lib/prisma";

let configured = false;

function ensureConfigured(): boolean {
  if (configured) return true;
  const pub = process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  if (!pub || !priv || !subject) {
    console.warn(
      "[push] VAPID env vars missing — push notifications disabled. Required: VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT.",
    );
    return false;
  }
  webpush.setVapidDetails(subject, pub, priv);
  configured = true;
  return true;
}

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  image?: string;
  url?: string;
  tag?: string;
}

export interface PushFanoutResult {
  attempted: number;
  sent: number;
  removed: number;
  failed: number;
}

export async function sendToAllSubscribers(payload: PushPayload): Promise<PushFanoutResult> {
  const result: PushFanoutResult = { attempted: 0, sent: 0, removed: 0, failed: 0 };
  if (!ensureConfigured()) return result;

  const subs = await prisma.pushSubscription.findMany();
  result.attempted = subs.length;
  if (subs.length === 0) return result;

  const body = JSON.stringify(payload);
  const toDelete: string[] = [];

  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          body,
        );
        result.sent++;
      } catch (err) {
        const statusCode = (err as { statusCode?: number })?.statusCode;
        // 404/410 = subscription gone (uninstalled, revoked). Clean it up.
        if (statusCode === 404 || statusCode === 410) {
          toDelete.push(s.id);
          result.removed++;
        } else {
          result.failed++;
          console.error("[push] sendNotification failed for endpoint", s.endpoint, {
            statusCode,
            message: (err as Error)?.message,
          });
        }
      }
    }),
  );

  if (toDelete.length > 0) {
    await prisma.pushSubscription.deleteMany({ where: { id: { in: toDelete } } });
  }

  return result;
}

export async function countSubscribers(): Promise<number> {
  return prisma.pushSubscription.count();
}
