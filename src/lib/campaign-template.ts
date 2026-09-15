import { DISTILLERY } from "@/lib/locations";
import type { CampaignFields } from "@/lib/campaign-constants";

/**
 * The campaign email, as HTML and as plain text.
 *
 * Preview, test and live send all come through renderCampaignHtml with the
 * same resolved content — the only thing that differs between them is the
 * unsubscribe URL, which has to be per recipient. That is what keeps the
 * preview honest: there is no second renderer for it to drift from.
 *
 * Table-based and inline-styled for the same reason as invoice-template.ts:
 * Outlook has no flexbox and several webmail clients strip <style>.
 */

const DEEP = "#0C0A09";
const GOLD = "#CA8A04";
/* Gold fails contrast for small text on white (about 2.9:1). Eyebrows, links
   and the urgency line use this darker amber instead, at about 7:1. */
const AMBER_DARK = "#92400E";
const STONE = "#57534E";
const MUTED = "#78716C";
const RULE = "#E8E5E0";
const GROUND = "#F4F1EC";

/** The featured bottle, as far as the email needs to know it. */
export interface FeaturedBottle {
  name: string;
  imageUrl: string | null;
  imageAlt: string;
  price: string;
  compareAt: string | null;
  url: string;
}

/**
 * Everything the email is rendered from, with the bottle's data already folded
 * in. This is what gets frozen into Campaign.snapshot when a send starts.
 */
export interface CampaignContent {
  subject: string;
  preheader: string;
  eyebrow: string;
  heading: string;
  body: string;
  ctaLabel: string;
  ctaUrl: string;
  urgency: string;
  imageUrl: string;
  imageAlt: string;
  price: string;
  compareAt: string;
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function absolute(url: string, siteUrl: string): string {
  return url.startsWith("/") ? `${siteUrl}${url}` : url;
}

/**
 * Fold the featured bottle into the operator's fields. A filled field always
 * wins; a blank one falls back to the bottle. Pure, so the composer's preview
 * and the send resolve identically.
 */
export function resolveCampaignContent(
  fields: CampaignFields,
  bottle: FeaturedBottle | null,
  siteUrl: string,
): CampaignContent {
  const ctaUrl = fields.ctaUrl ? absolute(fields.ctaUrl, siteUrl) : (bottle?.url ?? "");
  return {
    subject: fields.subject,
    preheader: fields.preheader,
    eyebrow: fields.eyebrow,
    heading: fields.heading || bottle?.name || "",
    body: fields.body,
    // A link with no label still deserves a button; a label with no link does
    // not, and sendProblems says so.
    ctaLabel: fields.ctaLabel || (ctaUrl ? (bottle ? "Shop this bottle" : "Shop now") : ""),
    ctaUrl,
    urgency: fields.urgency,
    imageUrl: bottle?.imageUrl ?? "",
    imageAlt: bottle?.imageAlt ?? "",
    price: fields.priceOverride || bottle?.price || "",
    compareAt: fields.compareAtOverride || bottle?.compareAt || "",
  };
}

/** Reasons this content cannot be sent yet. Empty means it can. */
export function sendProblems(content: CampaignContent): string[] {
  const problems: string[] = [];
  if (!content.subject) problems.push("Add a subject line.");
  if (!content.heading && !content.body) {
    problems.push("Add a heading or some body text.");
  }
  if (content.ctaLabel && !content.ctaUrl) {
    problems.push("The button has a label but no link.");
  }
  return problems;
}

/**
 * Body text → HTML. Deliberately tiny: a blank line starts a paragraph, a
 * single newline is a line break, **double asterisks** are bold, and bare
 * links become clickable. Everything is escaped first, so nothing the operator
 * types can inject markup into 34 inboxes.
 */
function bodyHtml(body: string): string {
  if (!body) return "";
  return body
    .split(/\n{2,}/)
    .map((para) => {
      const inner = esc(para)
        .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
        .replace(
          /(https?:\/\/[^\s<]+[^\s<.,;:!?)])/g,
          `<a href="$1" style="color:${AMBER_DARK};text-decoration:underline">$1</a>`,
        )
        .replace(/\n/g, "<br>");
      return `<p style="margin:0 0 16px;font:400 15px/1.7 Inter,Arial,sans-serif;color:${STONE}">${inner}</p>`;
    })
    .join("");
}

function postalLine(): string {
  return `${DISTILLERY.name} · ${DISTILLERY.streetAddress}, ${DISTILLERY.addressLocality}, ${DISTILLERY.addressRegion} ${DISTILLERY.postalCode}`;
}

export function renderCampaignHtml(
  c: CampaignContent,
  opts: { unsubscribeUrl: string },
): string {
  // Padding after the preheader stops inbox previews pulling body text in
  // behind it.
  const preheader = c.preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:${GROUND}">${esc(c.preheader)}${"&#8199;&#65279;&#847;".repeat(40)}</div>`
    : "";

  const eyebrow = c.eyebrow
    ? `<div style="font:700 11px/1 Inter,Arial,sans-serif;letter-spacing:.24em;text-transform:uppercase;color:${AMBER_DARK};margin:0 0 12px">${esc(c.eyebrow)}</div>`
    : "";

  const heading = c.heading
    ? `<h1 style="margin:0 0 18px;font:700 28px/1.25 Georgia,'Times New Roman',serif;color:${DEEP}">${esc(c.heading)}</h1>`
    : "";

  /* A portrait bottle at full column width would be 700px tall, so it is shown
     at a fixed width and centred. */
  const image = c.imageUrl
    ? `<tr><td align="center" style="padding:0 0 22px"><img src="${esc(c.imageUrl)}" alt="${esc(c.imageAlt || c.heading || "Featured bottle")}" width="260" style="display:block;width:260px;max-width:100%;height:auto;border:0"></td></tr>`
    : "";

  const price = c.price
    ? `<div style="margin:4px 0 18px;font:700 22px/1.2 Inter,Arial,sans-serif;color:${DEEP}">${esc(c.price)}${
        c.compareAt
          ? ` <span style="font-weight:400;font-size:16px;color:${MUTED};text-decoration:line-through">${esc(c.compareAt)}</span>`
          : ""
      }</div>`
    : "";

  const urgency = c.urgency
    ? `<div style="margin:0 0 14px;font:600 13px/1.5 Inter,Arial,sans-serif;color:${AMBER_DARK}">${esc(c.urgency)}</div>`
    : "";

  /* Solid gold with near-black text is 6.6:1 — the same button the invoice
     email uses. Table-based so Outlook keeps the padding. */
  const button =
    c.ctaLabel && c.ctaUrl
      ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:6px 0 4px"><tr><td bgcolor="${GOLD}" style="background:${GOLD}"><a href="${esc(c.ctaUrl)}" style="display:block;padding:14px 30px;font:700 12px/1 Inter,Arial,sans-serif;letter-spacing:.16em;text-transform:uppercase;color:${DEEP};text-decoration:none">${esc(c.ctaLabel)}</a></td></tr></table>`
      : "";

  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light only">
<meta name="supported-color-schemes" content="light">
<title>${esc(c.subject)}</title>
</head>
<body style="margin:0;padding:0;background:${GROUND}" bgcolor="${GROUND}">
${preheader}
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="${GROUND}" style="background:${GROUND}">
  <tr><td align="center" style="padding:28px 12px">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:600px">
      <tr><td bgcolor="${DEEP}" style="background:${DEEP};padding:22px 28px;text-align:center">
        <div style="font:700 21px/1 Georgia,'Times New Roman',serif;color:#FAFAF9;letter-spacing:.02em">Bourbon &amp; Oak</div>
        <div style="font:700 9px/1 Inter,Arial,sans-serif;letter-spacing:.36em;color:${GOLD};margin-top:8px;text-transform:uppercase">Distillery</div>
      </td></tr>
      <tr><td bgcolor="#FFFFFF" style="background:#FFFFFF;border:1px solid ${RULE};border-top:0;padding:32px 28px 30px">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
          ${image}
          <tr><td>
            ${eyebrow}${heading}${price}${bodyHtml(c.body)}${urgency}${button}
          </td></tr>
        </table>
      </td></tr>
      <tr><td style="padding:22px 16px 0;text-align:center;font:400 12px/1.7 Inter,Arial,sans-serif;color:${MUTED}">
        You're receiving this because you subscribed at bourbonoaklover.com.<br>
        <a href="${esc(opts.unsubscribeUrl)}" style="color:${STONE};text-decoration:underline">Unsubscribe</a><br>
        ${esc(postalLine())}<br>
        You must be 21 or older to purchase. Please enjoy responsibly.
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}

/** The plain-text alternative. Same content, same order, no markup. */
export function renderCampaignText(
  c: CampaignContent,
  opts: { unsubscribeUrl: string },
): string {
  const lines: (string | null)[] = [
    c.eyebrow ? c.eyebrow.toUpperCase() : null,
    c.heading || null,
    c.price ? (c.compareAt ? `${c.price} (was ${c.compareAt})` : c.price) : null,
    "",
    c.body ? c.body.replace(/\*\*(.+?)\*\*/g, "$1") : null,
    c.urgency ? "" : null,
    c.urgency || null,
    c.ctaLabel && c.ctaUrl ? "" : null,
    c.ctaLabel && c.ctaUrl ? `${c.ctaLabel}: ${c.ctaUrl}` : null,
    "",
    "—",
    "You're receiving this because you subscribed at bourbonoaklover.com.",
    `Unsubscribe: ${opts.unsubscribeUrl}`,
    postalLine(),
    "You must be 21 or older to purchase. Please enjoy responsibly.",
  ];
  return lines
    .filter((l): l is string => l !== null)
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
