// seo/urls.csv and seo/urls.txt: every page in the live sitemap.xml, in the order worth asking Google to
// index them one by one (Search Console > URL Inspection > Request indexing allows about 10 a day).
//
// Order: the tiers from SEARCH-CONSOLE-URLS.md where a page is listed there (Tier 1 = home, shop and the
// bottles whose titles were just rewritten), then by kind: main pages, shop categories, products, locations,
// blog posts, supporting pages, legal pages.
//
// Re-run after a change is deployed (new bottles, blog posts or locations): it reads the live sitemap, so the
// list is exactly what Google is told about. Your "submitted" / "submitted_date" / "notes" are kept.
// usage: npm run seo:urls
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const SITE = "https://bourbonoaklover.com";
const DIR = path.join(process.cwd(), "seo");
const CSV = path.join(DIR, "urls.csv");
const TXT = path.join(DIR, "urls.txt");
const HEADER = ["order", "url", "page_type", "name", "last_updated", "submitted", "submitted_date", "notes"];

// --- the live sitemap (and any child sitemaps) ---------------------------------------------------------------
async function read(url) {
  const r = await fetch(url, { cache: "no-store" });
  if (!r.ok) throw new Error(`${url} returned ${r.status}`);
  const xml = await r.text();
  const children = [...xml.matchAll(/<sitemap>[\s\S]*?<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
  if (children.length) return (await Promise.all(children.map(read))).flat();
  const unescape = (s) => s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'");
  return [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map(([, b]) => ({
    url: unescape(b.match(/<loc>([^<]+)<\/loc>/)?.[1].trim() ?? ""),
    lastmod: b.match(/<lastmod>([^<]+)<\/lastmod>/)?.[1].trim().slice(0, 10) ?? "",
    priority: Number(b.match(/<priority>([^<]+)<\/priority>/)?.[1] ?? 0),
  })).filter((e) => e.url);
}
const entries = await read(`${SITE}/sitemap.xml`);

// --- names and tiers from the hand-written list, where it has them -------------------------------------------
const tiers = new Map();
const names = new Map();
const md = path.join(process.cwd(), "SEARCH-CONSOLE-URLS.md");
if (existsSync(md)) {
  let tier = null;
  for (const line of readFileSync(md, "utf8").split("\n")) {
    const h = line.match(/^## Tier ([\d.]+)/);
    if (h) tier = Number(h[1]);
    else if (/^## /.test(line)) tier = null;
    const item = line.match(/^- \[[ x]\] \[(https?:\/\/[^\]]+)\]\([^)]*\)\s*(?:—\s*([^(]+))?/);
    if (item) {
      if (tier !== null) tiers.set(item[1], tier);
      if (item[2]) names.set(item[1], item[2].trim());
    }
  }
}

const words = (slug) => decodeURIComponent(slug).replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
const kind = (u) => {
  const { pathname, searchParams } = new URL(u);
  if (pathname === "/") return ["home", "Home"];
  if (pathname === "/shop" && searchParams.get("category")) return ["shop category", `Shop: ${words(searchParams.get("category"))}`];
  if (["/shop", "/collection", "/tours", "/blog"].includes(pathname)) return ["main page", words(pathname.slice(1))];
  if (pathname.startsWith("/products/")) return ["product", words(pathname.split("/")[2])];
  if (pathname.startsWith("/visit")) return ["location", pathname === "/visit" ? "Visit" : `Visit: ${words(pathname.split("/")[2])}`];
  if (pathname.startsWith("/blog/")) return ["blog post", words(pathname.split("/")[2])];
  if (["/privacy", "/terms"].includes(pathname)) return ["legal page", words(pathname.slice(1))];
  return ["info page", words(pathname.slice(1))];
};
const RANK = ["home", "main page", "shop category", "product", "location", "blog post", "info page", "legal page"];
// A page the hand-written list doesn't mention yet takes its kind's tier there, so a new blog post sits with
// the other blog posts rather than at the very end.
const KIND_TIER = { home: 1, "main page": 1, "shop category": 2, product: 3, location: 3.5, "blog post": 4, "info page": 5, "legal page": 5 };
const PLAIN_NAMES = { "/": "Home", "/shop": "Shop" };

const rows = entries
  .map((e) => {
    const [page_type, guess] = kind(e.url);
    const name = PLAIN_NAMES[new URL(e.url).pathname + new URL(e.url).search] ?? (page_type === "shop category" ? guess : (names.get(e.url) ?? guess));
    return { ...e, page_type, name, tier: tiers.get(e.url) ?? KIND_TIER[page_type] };
  })
  .sort(
    (a, b) =>
      a.tier - b.tier ||
      RANK.indexOf(a.page_type) - RANK.indexOf(b.page_type) ||
      b.priority - a.priority ||
      b.lastmod.localeCompare(a.lastmod) ||
      a.url.localeCompare(b.url),
  );

// --- keep what was already marked --------------------------------------------------------------------------
const parse = (line) => {
  const out = [];
  let cur = "", quoted = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') quoted = false;
      else cur += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") { out.push(cur); cur = ""; }
    else cur += ch;
  }
  out.push(cur);
  return out;
};
const kept = new Map();
if (existsSync(CSV)) {
  const [head, ...lines] = readFileSync(CSV, "utf8").split(/\r?\n/).filter(Boolean);
  const cols = parse(head);
  for (const line of lines) {
    const v = parse(line);
    const get = (k) => v[cols.indexOf(k)] ?? "";
    kept.set(get("url"), { submitted: get("submitted"), submitted_date: get("submitted_date"), notes: get("notes") });
  }
}

const cell = (s) => (/[",\n]/.test(String(s)) ? `"${String(s).replace(/"/g, '""')}"` : String(s));
const csv = [
  HEADER.join(","),
  ...rows.map((r, i) => {
    const k = kept.get(r.url) ?? { submitted: "", submitted_date: "", notes: "" };
    return [i + 1, r.url, r.page_type, r.name, r.lastmod, k.submitted, k.submitted_date, k.notes].map(cell).join(",");
  }),
].join("\n");
mkdirSync(DIR, { recursive: true });
writeFileSync(CSV, `${csv}\n`);
// Bare URLs, one per line, for copying into Search Console: a row copied from the CSV carries its other
// columns ("...,product,Name") and Google then looks up that address instead (a 404).
writeFileSync(TXT, `${rows.map((r) => r.url).join("\n")}\n`);

const count = (t) => rows.filter((r) => r.page_type === t).length;
console.log(`seo/urls.csv: ${rows.length} URLs (${RANK.map((t) => `${count(t)} ${t}`).join(", ")})`);
if (kept.size) {
  const added = rows.filter((r) => !kept.has(r.url)).length;
  const gone = [...kept.keys()].filter((u) => !rows.some((r) => r.url === u)).length;
  console.log(`new since last time: ${added}, no longer in the sitemap: ${gone}, marked submitted: ${[...kept.values()].filter((k) => k.submitted).length}`);
}
