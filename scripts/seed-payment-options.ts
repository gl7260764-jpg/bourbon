// Seeds the three rails that were previously hardcoded in CheckoutClient.tsx
// so the switch to DB-driven options is a no-op for existing customers.
// Idempotent — safe to re-run.
import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();

const SEED = [
  {
    key: "chime",
    label: "Chime",
    detail: "Pay from your Chime account via Pay Anyone.",
    instructions:
      "Send the total to our Chime account using Pay Anyone, then reply to this email with the confirmation.\n\nChime handle: (set this in Admin → Payment methods)",
    discountRate: 0,
    legacyMethod: "CHIME" as const,
    sortOrder: 0,
  },
  {
    key: "apple-pay",
    label: "Apple Pay",
    detail: "Touch ID or Face ID confirmation.",
    instructions:
      "Send the total via Apple Pay, then reply to this email with the confirmation.\n\nApple Pay number: (set this in Admin → Payment methods)",
    discountRate: 0,
    legacyMethod: "APPLE_PAY" as const,
    sortOrder: 1,
  },
  {
    key: "crypto",
    label: "Cryptocurrency",
    detail: "Pay with Bitcoin, Ethereum, USDC. Settles in ~10 minutes.",
    instructions:
      "Send the total in BTC, ETH or USDC to the address below, then reply with the transaction hash.\n\nWallet address: (set this in Admin → Payment methods)",
    discountRate: 0.1,
    legacyMethod: "CRYPTO" as const,
    sortOrder: 2,
  },
];

(async () => {
  for (const s of SEED) {
    await p.paymentOption.upsert({
      where: { key: s.key },
      update: {},               // never clobber details the operator has edited
      create: s,
    });
  }
  const all = await p.paymentOption.findMany({ orderBy: { sortOrder: "asc" } });
  console.log(`payment options in db: ${all.length}`);
  for (const o of all) {
    console.log(`  ${o.key.padEnd(12)} ${o.label.padEnd(16)} discount=${Number(o.discountRate) * 100}%  active=${o.isActive}`);
  }
  await p.$disconnect();
})();
