/**
 * Read-only: what the follow-up queue would say, and to whom.
 *
 *   npx tsx scripts/follow-up-preview.ts            # breakdown + one sample per track
 *   npx tsx scripts/follow-up-preview.ts --all      # every draft in full
 *
 * This exists because these messages go to real customers after weeks of
 * silence, and reading them in a terminal against real orders catches a
 * wooden sentence faster than clicking through the admin panel does. It opens
 * no connection to Brevo and writes nothing.
 */
import { PrismaClient } from "@prisma/client";
import { draftFor, loadDetailsTemplates } from "@/lib/order-follow-up";

const prisma = new PrismaClient();
const showAll = process.argv.includes("--all");

const rule = (ch = "-") => ch.repeat(72);

(async () => {
  const orders = await prisma.order.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      orderNumber: true,
      email: true,
      fullName: true,
      total: true,
      createdAt: true,
      settlementState: true,
      paymentLabel: true,
      paymentOptionKey: true,
      paymentDetailsBody: true,
      paymentDetailsIssuedAt: true,
      paymentProofUploadedAt: true,
      followUpCount: true,
      lastFollowUpAt: true,
      items: {
        select: {
          productId: true,
          productName: true,
          quantity: true,
          isCase: true,
          unitPrice: true,
        },
      },
    },
  });

  const rails = await prisma.paymentOption.findMany({ select: { key: true } });
  const detailsTemplates = await loadDetailsTemplates(rails.map((r) => r.key));

  // Supply, resolved the same way the admin queue resolves it, so a draft
  // read here carries the same warnings it would carry in the panel.
  const orderedIds = [
    ...new Set(
      orders.flatMap((o) =>
        o.items.map((i) => i.productId).filter((id): id is string => Boolean(id)),
      ),
    ),
  ];
  const products = await prisma.product.findMany({
    where: { id: { in: orderedIds } },
    select: { id: true, availability: true },
  });
  const listed = new Map(products.map((p) => [p.id, p.availability]));

  const ctx = {
    detailsTemplates,
    // Chat is left out: it needs the admin inbox's unread counts and this
    // script is about reading the words, not the queue's completeness.
    unansweredChat: new Set<string>(),
    goneFromCatalogue: new Set(
      orderedIds.filter((id) => !listed.has(id) || listed.get(id) === "ARCHIVED"),
    ),
    outOfStock: new Set(orderedIds.filter((id) => listed.get(id) === "SOLD_OUT")),
    now: Date.now(),
  };

  const drafts = orders.map((o) => draftFor(o, ctx));

  const byTrack = new Map<string, { n: number; value: number }>();
  for (const d of drafts) {
    const cur = byTrack.get(d.track) ?? { n: 0, value: 0 };
    byTrack.set(d.track, { n: cur.n + 1, value: cur.value + d.total });
  }

  console.log(`pending orders: ${drafts.length}\n`);
  console.log("track               orders      value");
  for (const [track, stat] of [...byTrack].sort((a, b) => b[1].n - a[1].n)) {
    console.log(
      `  ${track.padEnd(16)} ${String(stat.n).padStart(5)}  $${stat.value.toFixed(2).padStart(10)}`,
    );
  }

  const warned = drafts.filter((d) => d.warnings.length > 0);
  console.log(`\nwith warnings: ${warned.length} of ${drafts.length}`);
  const noWhereToPay = drafts.filter((d) => d.needsDetails && !d.detailsDraft.trim());
  console.log(
    `buyers with nowhere to pay: ${noWhereToPay.length}` +
      (noWhereToPay.length
        ? ` (rails: ${[...new Set(noWhereToPay.map((d) => d.rail))].join(", ")})`
        : ""),
  );

  const show = showAll
    ? drafts
    : [...new Map(drafts.map((d) => [d.track, d])).values()];

  console.log(`\n${rule("=")}`);
  for (const d of show) {
    console.log(
      `\n${d.track} · ${d.orderNumber} · ${d.ageDays}d · $${d.total.toFixed(2)} · ${d.rail}`,
    );
    console.log(`to:     ${d.fullName} <${d.email}>`);
    console.log(`why:    ${d.reason}`);
    for (const w of d.warnings) console.log(`WARN:   ${w}`);
    console.log(`subject: ${d.subject}\n`);
    console.log(d.paragraphs.join("\n\n"));
    console.log(`\n[ ${d.ctaLabel} ]`);
    console.log(rule());
  }

  await prisma.$disconnect();
})();
