// Reverses scripts/import-weller-lineup.ts:
// - Deletes the 4 Weller products by slug (ProductImage + Award cascade).
// - Leaves the "wellers" category in place.
// Run with:  npx tsx scripts/delete-weller-lineup.ts

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

(function loadDotenv() {
  const envPath = path.resolve(".env");
  if (!existsSync(envPath)) return;
  const text = readFileSync(envPath, "utf8");
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
})();

import { prisma } from "../src/lib/prisma";

const SLUGS = [
  "weller-single-barrel",
  "weller-cypb",
  "weller-12-year",
  "weller-full-proof",
];

async function main() {
  let deleted = 0;
  for (const slug of SLUGS) {
    const existing = await prisma.product.findUnique({ where: { slug } });
    if (!existing) {
      console.log(`• Skipping "${slug}" — not found.`);
      continue;
    }
    await prisma.product.delete({ where: { slug } });
    console.log(`  ✓ Deleted "${existing.name}" (slug=${slug}).`);
    deleted++;
  }
  console.log(`\nDone — deleted ${deleted} of ${SLUGS.length}.`);
}

main()
  .catch((err) => {
    console.error("\nDelete failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
