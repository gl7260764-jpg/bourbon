import {
  type InvoiceSnapshot,
  STATUS_LABEL,
  formatIssueDate,
  money,
  paymentNote,
} from "@/lib/invoice";

/**
 * The invoice document, as HTML.
 *
 * One template serves three surfaces: the web view at /invoice/[number], the
 * body of the email, and the page the PDF is rendered from. They must not drift
 * — a customer comparing the PDF against the link in their inbox should see the
 * same document.
 *
 * Written as table-based, inline-styled HTML because email clients demand it:
 * Outlook has no flexbox or grid, and stylesheets are stripped by several
 * webmail clients. That constraint drives the markup everywhere else too,
 * rather than maintaining a second template for email.
 */

const GOLD = "#CA8A04";
const DEEP = "#0C0A09";
const CREAM = "#FAFAF9";
const STONE = "#57534E";
const MUTED = "#a8a29e";
const RULE = "#e8e5e0";

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Status pill colours. Paid is green, due is amber, void is grey and flat. */
function statusStyle(status: InvoiceSnapshot["status"]): string {
  if (status === "PAID") {
    return "background:#DCFCE7;border:1px solid rgba(21,128,61,.4);color:#15803D";
  }
  if (status === "VOID") {
    return "background:#f4f4f5;border:1px solid #d4d4d8;color:#71717a";
  }
  return "background:#FEF3C7;border:1px solid rgba(202,138,4,.45);color:#92400E";
}

function partyBlock(label: string, name: string, lines: string[], email: string): string {
  const rest = lines
    .map((l) => `<div style="margin-bottom:2px">${esc(l)}</div>`)
    .join("");
  return `
    <div style="font:700 8px/1 Inter,Arial,sans-serif;letter-spacing:.2em;color:${MUTED};margin-bottom:8px">${esc(label)}</div>
    <div style="font:600 13px/1.3 Inter,Arial,sans-serif;color:${DEEP};margin-bottom:5px">${esc(name)}</div>
    <div style="font:400 10.5px/1.7 Inter,Arial,sans-serif;color:${STONE}">
      ${rest}
      ${email ? `<div style="margin-top:2px">${esc(email)}</div>` : ""}
    </div>`;
}

function lineRows(inv: InvoiceSnapshot): string {
  return inv.lines
    .map(
      (l, i) => `
      <tr style="background:${i % 2 === 1 ? "#ffffff" : "transparent"}">
        <td style="padding:14px 12px;border-bottom:1px solid ${RULE};font:600 11.5px/1.4 Inter,Arial,sans-serif;color:${DEEP};vertical-align:top">
          ${esc(l.description)}
          ${l.detail ? `<div style="font:400 9.5px/1.4 Inter,Arial,sans-serif;color:#8a8580;margin-top:3px">${esc(l.detail)}</div>` : ""}
        </td>
        <td style="padding:14px 12px;border-bottom:1px solid ${RULE};font:400 11.5px/1.4 Inter,Arial,sans-serif;color:${DEEP};text-align:right;vertical-align:top">${l.quantity}</td>
        <td style="padding:14px 12px;border-bottom:1px solid ${RULE};font:400 11.5px/1.4 Inter,Arial,sans-serif;color:${DEEP};text-align:right;vertical-align:top;white-space:nowrap">${money(l.unitPrice, inv.currency)}</td>
        <td style="padding:14px 12px;border-bottom:1px solid ${RULE};font:400 11.5px/1.4 Inter,Arial,sans-serif;color:${DEEP};text-align:right;vertical-align:top;white-space:nowrap">${money(l.amount, inv.currency)}</td>
      </tr>`,
    )
    .join("");
}

function totalRow(label: string, value: string, color = STONE): string {
  return `
    <tr>
      <td style="padding:7px 0;font:400 11px/1.4 Inter,Arial,sans-serif;color:${STONE}">${esc(label)}</td>
      <td style="padding:7px 0;font:500 11px/1.4 Inter,Arial,sans-serif;color:${color};text-align:right;white-space:nowrap">${value}</td>
    </tr>`;
}

export interface InvoiceHtmlOptions {
  /** Absolute URL of the hosted invoice, linked from the email. */
  viewUrl?: string;
  /** Standalone page wrapper. Off when embedding into an email body. */
  standalone?: boolean;
}

export function renderInvoiceHtml(
  inv: InvoiceSnapshot,
  opts: InvoiceHtmlOptions = {},
): string {
  const t = inv.totals;
  const note = paymentNote(inv);

  const doc = `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:794px;margin:0 auto;background:${CREAM};border-collapse:collapse">
  <!-- letterhead -->
  <tr><td style="background:${DEEP};padding:34px 40px 30px">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
      <tr>
        <td style="vertical-align:top">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
            <td style="width:36px;height:36px;border:1.5px solid ${GOLD};color:${GOLD};text-align:center;font:700 19px/34px Georgia,serif">B</td>
            <td style="padding-left:11px">
              <div style="font:700 20px/1.1 Georgia,'Times New Roman',serif;color:${CREAM}">Bourbon &amp; Oak</div>
              <div style="font:600 7.5px/1 Inter,Arial,sans-serif;letter-spacing:.24em;color:${GOLD};margin-top:4px">EST. 1876</div>
            </td>
          </tr></table>
        </td>
        <td style="vertical-align:top;text-align:right">
          <div style="font:700 31px/1 Inter,Arial,sans-serif;letter-spacing:.16em;color:${CREAM}">INVOICE</div>
          <div style="font:400 9.5px/1 Inter,Arial,sans-serif;letter-spacing:.1em;color:rgba(250,250,249,.55);margin-top:6px">${esc(inv.invoiceNumber)}</div>
        </td>
      </tr>
    </table>

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:26px;border-top:1px solid rgba(250,250,249,.15)">
      <tr>
        <td style="padding-top:17px;vertical-align:bottom;font:400 10px/1.7 Inter,Arial,sans-serif;color:rgba(250,250,249,.6)">
          ${esc(inv.seller.lines[0])} &middot; ${esc(inv.seller.lines[1])}<br>${esc(inv.seller.email)}
        </td>
        <td style="padding-top:17px;vertical-align:bottom;text-align:right">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="right"><tr>
            <td style="padding-left:30px;text-align:right">
              <div style="font:600 7.5px/1 Inter,Arial,sans-serif;letter-spacing:.18em;color:rgba(250,250,249,.45);margin-bottom:5px">ORDER</div>
              <div style="font:600 11.5px/1 Inter,Arial,sans-serif;color:${CREAM}">${esc(inv.orderNumber)}</div>
            </td>
            <td style="padding-left:30px;text-align:right">
              <div style="font:600 7.5px/1 Inter,Arial,sans-serif;letter-spacing:.18em;color:rgba(250,250,249,.45);margin-bottom:5px">ISSUED</div>
              <div style="font:600 11.5px/1 Inter,Arial,sans-serif;color:${CREAM}">${esc(formatIssueDate(inv.issuedAt))}</div>
            </td>
            <td style="padding-left:30px;text-align:right">
              <div style="font:600 7.5px/1 Inter,Arial,sans-serif;letter-spacing:.18em;color:rgba(250,250,249,.45);margin-bottom:5px">TERMS</div>
              <div style="font:600 11.5px/1 Inter,Arial,sans-serif;color:${CREAM}">${esc(inv.terms)}</div>
            </td>
          </tr></table>
        </td>
      </tr>
    </table>
  </td></tr>

  <!-- gold rule -->
  <tr><td style="height:2px;background:${GOLD};line-height:2px;font-size:0">&nbsp;</td></tr>

  <!-- parties -->
  <tr><td style="padding:32px 40px 0">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
      <tr>
        <td style="width:38%;vertical-align:top">${partyBlock("BILLED TO", inv.billedTo.name, inv.billedTo.lines, inv.billedTo.email)}</td>
        <td style="width:38%;vertical-align:top">${partyBlock("SHIPPED TO", inv.shippedTo.name, inv.shippedTo.lines, "")}
          <div style="font:400 10.5px/1.7 Inter,Arial,sans-serif;color:${STONE};margin-top:6px">${esc(inv.shippingLabel)}<br>Adult signature required</div>
        </td>
        <td style="vertical-align:top;text-align:right">
          <span style="display:inline-block;padding:6px 13px;font:700 9px/1 Inter,Arial,sans-serif;letter-spacing:.13em;${statusStyle(inv.status)}">${STATUS_LABEL[inv.status]}</span>
        </td>
      </tr>
    </table>
  </td></tr>

  <!-- lines -->
  <tr><td style="padding:30px 40px 0">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse">
      <thead><tr style="background:${DEEP}">
        <th style="width:52%;padding:9px 12px;font:700 8px/1 Inter,Arial,sans-serif;letter-spacing:.17em;color:${CREAM};text-align:left">DESCRIPTION</th>
        <th style="padding:9px 12px;font:700 8px/1 Inter,Arial,sans-serif;letter-spacing:.17em;color:${CREAM};text-align:right">QTY</th>
        <th style="padding:9px 12px;font:700 8px/1 Inter,Arial,sans-serif;letter-spacing:.17em;color:${CREAM};text-align:right">UNIT PRICE</th>
        <th style="padding:9px 12px;font:700 8px/1 Inter,Arial,sans-serif;letter-spacing:.17em;color:${CREAM};text-align:right">AMOUNT</th>
      </tr></thead>
      <tbody>${lineRows(inv)}</tbody>
    </table>
  </td></tr>

  <!-- pay + totals -->
  <tr><td style="padding:26px 40px 0">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
      <tr>
        <td style="vertical-align:top;padding-right:34px">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#ffffff;border:1px solid ${RULE};border-left:3px solid ${GOLD}">
            <tr><td style="padding:16px 18px">
              <div style="font:700 8px/1 Inter,Arial,sans-serif;letter-spacing:.2em;color:${MUTED};margin-bottom:9px">${esc(note.title)}</div>
              <div style="font:400 10.5px/1.75 Inter,Arial,sans-serif;color:${STONE}">${esc(note.body)}</div>
            </td></tr>
          </table>
        </td>
        <td style="width:300px;vertical-align:top">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
            ${totalRow("Subtotal", money(t.subtotal, inv.currency), DEEP)}
            ${t.discountLabel ? totalRow(t.discountLabel, `&minus;${money(t.discount, inv.currency)}`, "#15803D") : ""}
            ${totalRow("Shipping", money(t.shipping, inv.currency), DEEP)}
            ${totalRow("Tax", money(t.tax, inv.currency), DEEP)}
          </table>
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:11px;background:${DEEP}">
            <tr>
              <td style="padding:15px 18px;font:700 8.5px/1 Inter,Arial,sans-serif;letter-spacing:.16em;color:${GOLD};vertical-align:middle">${inv.status === "PAID" ? "TOTAL PAID" : "TOTAL DUE"}</td>
              <td style="padding:15px 18px;font:700 23px/1 Inter,Arial,sans-serif;color:${CREAM};text-align:right;white-space:nowrap">${money(t.total, inv.currency)}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </td></tr>

  ${
    opts.viewUrl
      ? `<tr><td style="padding:26px 40px 0;text-align:center">
    <a href="${esc(opts.viewUrl)}" style="display:inline-block;padding:13px 30px;background:${GOLD};color:${DEEP};font:600 11px/1 Inter,Arial,sans-serif;letter-spacing:.14em;text-transform:uppercase;text-decoration:none">View invoice online</a>
  </td></tr>`
      : ""
  }

  <!-- foot -->
  <tr><td style="padding:34px 40px 34px">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-top:1px solid ${RULE}">
      <tr>
        <td style="padding-top:22px;font:400 9px/1.6 Inter,Arial,sans-serif;color:${MUTED};vertical-align:top">
          ${esc(inv.seller.name)} &middot; ${esc(inv.seller.lines[1])}<br>Six generations of Kentucky bourbon since 1876
        </td>
        <td style="padding-top:22px;font:400 9px/1.6 Inter,Arial,sans-serif;color:${MUTED};text-align:right;vertical-align:top">
          You must be 21+ to purchase.<br>Adult signature required at delivery.
        </td>
      </tr>
    </table>
  </td></tr>
</table>`;

  if (!opts.standalone) return doc;

  return `<!doctype html>
<html><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Invoice ${esc(inv.invoiceNumber)} — Bourbon &amp; Oak</title>
<style>
  body{margin:0;background:#e8e6e1;padding:24px 12px;font-family:Inter,system-ui,-apple-system,sans-serif}
  /* The document is a fixed-width business form; on a phone it scrolls
     horizontally rather than reflowing, which keeps the columns aligned. */
  .sheet{overflow-x:auto}
  @media print{
    body{background:#fff;padding:0}
    .sheet table{max-width:none}
    @page{size:A4;margin:12mm}
  }
</style>
</head><body><div class="sheet">${doc}</div></body></html>`;
}

/** Covering email. The document itself is embedded beneath this. */
/**
 * The email that carries an invoice.
 *
 * Deliberately short. This used to inline the whole invoice document into the
 * body — renderInvoiceHtml is drawn for a 794px A4 page, and dropped into an
 * inbox it came out as a wall of table that reflowed badly on a phone and worse
 * in Outlook. The document is the PDF attachment and the web view; the email's
 * job is only to say what arrived, what is owed, and where to open it.
 *
 * The plain-text alternative says the same things in the same order, so a
 * client that blocks HTML loses nothing.
 */
export function renderInvoiceEmail(
  inv: InvoiceSnapshot,
  opts: { viewUrl?: string; hasPdf: boolean },
): { subject: string; html: string; text: string } {
  const paid = inv.status === "PAID";
  const voided = inv.status === "VOID";
  const subject = paid
    ? `Receipt ${inv.invoiceNumber} — order ${inv.orderNumber}`
    : `Invoice ${inv.invoiceNumber} — order ${inv.orderNumber}`;

  const firstName = inv.billedTo.name.split(" ")[0] || "there";
  const total = money(inv.totals.total, inv.currency);

  const intro = paid
    ? `Your payment has been received in full. This is your receipt for order ${esc(inv.orderNumber)} — keep it for your records.`
    : voided
      ? `Invoice ${esc(inv.invoiceNumber)} for order ${esc(inv.orderNumber)} has been withdrawn. Nothing is payable against it.`
      : `Here is your invoice for order ${esc(inv.orderNumber)}. The full breakdown is on the invoice itself.`;

  const totalLabel = paid ? "Total paid" : voided ? "Invoice total" : "Total due";
  const pdfLine = opts.hasPdf
    ? `<p style="margin:0 0 4px">A PDF copy is attached to this email.</p>`
    : "";

  const button = opts.viewUrl
    ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:22px 0 0">
         <tr><td style="background:${GOLD}">
           <a href="${esc(opts.viewUrl)}" style="display:block;padding:11px 26px;font:700 11px/1 Inter,Arial,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:${DEEP};text-decoration:none">View invoice online</a>
         </td></tr>
       </table>`
    : "";

  const html = `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;background:#f4f1ec;padding:28px 14px;font-family:Inter,Arial,sans-serif">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:560px;margin:0 auto">
    <tr><td style="padding:0 0 16px;text-align:center">
      <div style="font:700 17px/1 Georgia,serif;color:${DEEP};letter-spacing:.02em">Bourbon &amp; Oak</div>
      <div style="font:700 8px/1 Inter,Arial,sans-serif;letter-spacing:.34em;color:${MUTED};margin-top:6px;text-transform:uppercase">Distillery</div>
    </td></tr>

    <tr><td style="background:#ffffff;border:1px solid ${RULE};padding:26px 24px">
      <p style="margin:0 0 12px;font:400 14px/1.65 Inter,Arial,sans-serif;color:${DEEP}">Hello ${esc(firstName)},</p>
      <p style="margin:0 0 18px;font:400 13.5px/1.7 Inter,Arial,sans-serif;color:${STONE}">${intro}</p>

      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-top:1px solid ${RULE};border-bottom:1px solid ${RULE};margin:0 0 18px">
        <tr><td style="padding:14px 0">
          <div style="font:700 8px/1 Inter,Arial,sans-serif;letter-spacing:.2em;color:${MUTED};text-transform:uppercase">${esc(totalLabel)}</div>
          <div style="font:700 26px/1.2 Inter,Arial,sans-serif;color:${DEEP};margin-top:7px${voided ? ";text-decoration:line-through" : ""}">${esc(total)}</div>
          <div style="font:400 11.5px/1.6 Inter,Arial,sans-serif;color:${STONE};margin-top:8px">
            ${esc(inv.invoiceNumber)} &middot; Order ${esc(inv.orderNumber)}<br>Issued ${esc(formatIssueDate(inv.issuedAt))}
          </div>
        </td></tr>
      </table>

      <div style="font:400 12.5px/1.7 Inter,Arial,sans-serif;color:${STONE}">${pdfLine}</div>
      ${button}
    </td></tr>

    <tr><td style="padding:16px 4px 0;font:400 11px/1.7 Inter,Arial,sans-serif;color:${MUTED};text-align:center">
      Questions about this invoice? Just reply to this email.<br>
      Bourbon &amp; Oak Distillery, Bardstown, Kentucky
    </td></tr>
  </table>
</body></html>`;

  const text = [
    paid ? `Receipt ${inv.invoiceNumber}` : `Invoice ${inv.invoiceNumber}`,
    "",
    `Hello ${firstName},`,
    "",
    paid
      ? `Your payment has been received in full. This is your receipt for order ${inv.orderNumber} — keep it for your records.`
      : voided
        ? `Invoice ${inv.invoiceNumber} for order ${inv.orderNumber} has been withdrawn. Nothing is payable against it.`
        : `Here is your invoice for order ${inv.orderNumber}. The full breakdown is on the invoice itself.`,
    "",
    `${totalLabel}: ${total}`,
    `Order ${inv.orderNumber}`,
    `Issued ${formatIssueDate(inv.issuedAt)}`,
    "",
    opts.hasPdf ? "A PDF copy is attached to this email." : null,
    opts.viewUrl ? `View online: ${opts.viewUrl}` : null,
    "",
    "Questions about this invoice? Just reply to this email.",
    "Bourbon & Oak Distillery, Bardstown, Kentucky",
  ]
    /* null is a line that did not apply; "" is a deliberate blank one. The
       old filter dropped both, which ran every paragraph together. */
    .filter((l): l is string => l !== null)
    .join("\n");

  return { subject, html, text };
}
