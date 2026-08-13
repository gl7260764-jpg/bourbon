// One-off: create Customer records for orders placed before accounts existed,
// and link those orders to them. Idempotent — safe to re-run.
import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();

(async () => {
  const orders = await p.order.findMany({
    where: { customerId: null },
    orderBy: { createdAt: "asc" },
  });
  console.log(`orders without an account: ${orders.length}`);

  let created = 0;
  let linked = 0;

  for (const o of orders) {
    const email = o.email.trim().toLowerCase();
    if (!email.includes("@")) {
      console.log(`  skipped ${o.orderNumber}: unusable email "${o.email}"`);
      continue;
    }

    const existing = await p.customer.findUnique({ where: { email } });
    // Newest order wins for prefill details, so walk oldest → newest.
    const customer = existing
      ? await p.customer.update({
          where: { email },
          data: {
            fullName: o.fullName || existing.fullName,
            phone: o.phone || existing.phone,
            addressLine1: o.addressLine1 || existing.addressLine1,
            addressLine2: o.addressLine2 ?? existing.addressLine2,
            city: o.city || existing.city,
            region: o.region || existing.region,
            postal: o.postal || existing.postal,
            country: o.country || existing.country,
          },
        })
      : await p.customer.create({
          data: {
            email,
            fullName: o.fullName,
            phone: o.phone,
            addressLine1: o.addressLine1,
            addressLine2: o.addressLine2,
            city: o.city,
            region: o.region,
            postal: o.postal,
            country: o.country,
          },
        });
    if (!existing) created++;

    await p.order.update({ where: { id: o.id }, data: { customerId: customer.id } });
    linked++;
  }

  console.log(`\ncustomers created: ${created}`);
  console.log(`orders linked    : ${linked}`);
  const all = await p.customer.findMany({
    select: { email: true, _count: { select: { orders: true } } },
    orderBy: { createdAt: "asc" },
  });
  console.log(`\naccounts now (${all.length}):`);
  for (const c of all) console.log(`  ${c.email.padEnd(32)} ${c._count.orders} order(s)`);
  await p.$disconnect();
})();
