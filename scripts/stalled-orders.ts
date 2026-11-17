// Read-only report: where orders are stuck in the payment handshake, and for
// how long. This is the queue a follow-up would work from.
//
//   npx tsx scripts/stalled-orders.ts
import { PrismaClient } from "@prisma/client";

const p = new PrismaClient();
const DAY = 86_400_000;

(async () => {
  const now = Date.now();
  const orders = await p.order.findMany({
    select: {
      orderNumber: true,
      status: true,
      settlementState: true,
      email: true,
      total: true,
      createdAt: true,
      updatedAt: true,
      paymentLabel: true,
      paymentDetailsIssuedAt: true,
      paymentProofUploadedAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const age = (d: Date) => Math.floor((now - d.getTime()) / DAY);

  console.log(`orders: ${orders.length}\n`);

  const buckets = new Map<string, number>();
  for (const o of orders) {
    const key = `${o.status} / ${o.settlementState}`;
    buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }
  console.log("status / settlement state");
  for (const [k, v] of [...buckets].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${k.padEnd(32)} ${String(v).padStart(3)}`);
  }

  const pending = orders.filter((o) => o.status === "PENDING");
  console.log(`\nPENDING (${pending.length}) — the follow-up queue`);
  console.log(
    `  ${"order".padEnd(14)} ${"age".padStart(5)} ${"total".padStart(10)}  ${"rail".padEnd(16)} ${"state".padEnd(17)} details proof`,
  );
  for (const o of pending) {
    console.log(
      `  ${o.orderNumber.padEnd(14)} ${String(age(o.createdAt) + "d").padStart(5)} ` +
        `${("$" + Number(o.total).toFixed(2)).padStart(10)}  ${(o.paymentLabel ?? "—").slice(0, 16).padEnd(16)} ` +
        `${o.settlementState.padEnd(17)} ${o.paymentDetailsIssuedAt ? "   yes " : "    no "} ` +
        `${o.paymentProofUploadedAt ? "yes" : "no"}`,
    );
  }

  const quiet = pending.filter((o) => age(o.updatedAt) >= 3);
  console.log(
    `\nnothing has moved on these for 3+ days: ${quiet.length} of ${pending.length}`,
  );

  await p.$disconnect();
})();
