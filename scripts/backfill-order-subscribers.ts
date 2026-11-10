// Put the addresses from orders placed before checkout fed the mailing list
// onto that list. Idempotent — safe to re-run.
//
//   npx tsx scripts/backfill-order-subscribers.ts          report only
//   npx tsx scripts/backfill-order-subscribers.ts --write  actually insert
//
// Anyone already on the list is left exactly as they are, unsubscribed people
// included: an old order is not consent to undo an opt-out.
import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
const write = process.argv.includes("--write");

(async () => {
  const orders = await p.order.findMany({
    select: { email: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  // Oldest order wins the createdAt, so the list reflects when we actually met
  // them rather than when this script ran.
  const firstSeen = new Map<string, Date>();
  for (const o of orders) {
    const email = o.email.trim().toLowerCase();
    if (!email.includes("@")) continue;
    if (!firstSeen.has(email)) firstSeen.set(email, o.createdAt);
  }

  const known = new Map(
    (
      await p.subscriber.findMany({ select: { email: true, status: true } })
    ).map((s) => [s.email, s.status]),
  );

  const missing = [...firstSeen.keys()].filter((e) => !known.has(e));
  const optedOut = [...firstSeen.keys()].filter(
    (e) => known.get(e) === "UNSUBSCRIBED",
  );

  console.log(`orders                  : ${orders.length}`);
  console.log(`distinct buyer addresses: ${firstSeen.size}`);
  console.log(`already on the list     : ${firstSeen.size - missing.length}`);
  console.log(`  of those, opted out   : ${optedOut.length} (left alone)`);
  console.log(`would add               : ${missing.length}`);
  for (const e of missing) console.log(`  + ${e}`);

  if (!write) {
    console.log(`\nreport only — re-run with --write to insert.`);
  } else if (missing.length) {
    const result = await p.subscriber.createMany({
      data: missing.map((email) => ({
        email,
        source: "order",
        createdAt: firstSeen.get(email)!,
      })),
      skipDuplicates: true,
    });
    console.log(`\ninserted: ${result.count}`);
  } else {
    console.log(`\nnothing to do.`);
  }

  await p.$disconnect();
})();
