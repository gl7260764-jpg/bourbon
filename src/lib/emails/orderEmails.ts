const COLORS = {
  deep: "#0C0A09",
  dark: "#1C1917",
  stone: "#44403C",
  gold: "#CA8A04",
  amber: "#D97706",
  cream: "#FAFAF9",
  border: "#E7E5E4",
  muted: "#78716C",
};

const BRAND_NAME = "Bourbon Oak Lover";
const BRAND_TAGLINE = "Aged Kentucky Reserve";

const currency = (n: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(n);

const escapeHtml = (raw: string) =>
  raw
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

export interface OrderEmailItem {
  name: string;
  ageLabel?: string | null;
  quantity: number;
  unitPrice: number;
  image?: string;
}

export interface OrderEmailData {
  orderNumber: string;
  placedAt: Date;
  customer: {
    fullName: string;
    email: string;
    phone?: string;
  };
  shippingAddress: {
    line1: string;
    line2?: string;
    city: string;
    region: string;
    postal: string;
    country: string;
  };
  shippingMethodLabel: string;
  paymentMethodLabel: string;
  items: OrderEmailItem[];
  totals: {
    subtotal: number;
    discount: number;
    shippingCost: number;
    tax: number;
    total: number;
  };
}

const SHIPPING_LABELS: Record<string, string> = {
  standard: "Standard Shipping",
  express: "Express Shipping",
  overnight: "Overnight Shipping",
  "white-glove": "White-Glove Delivery",
};

const PAYMENT_LABELS: Record<string, string> = {
  card: "Credit / Debit Card",
  paypal: "PayPal",
  chime: "Chime",
  "apple-pay": "Apple Pay",
  crypto: "Cryptocurrency",
};

export function shippingLabel(id: string): string {
  return SHIPPING_LABELS[id] ?? id;
}

export function paymentLabel(id: string): string {
  return PAYMENT_LABELS[id] ?? id;
}

function header(): string {
  return `
    <tr>
      <td style="padding:36px 32px 28px;text-align:center;background:${COLORS.deep};border-bottom:2px solid ${COLORS.gold};">
        <div style="font-family:Georgia,'Times New Roman',serif;font-size:11px;letter-spacing:6px;color:${COLORS.gold};text-transform:uppercase;margin-bottom:10px;">Est. 1876</div>
        <div style="font-family:Georgia,'Times New Roman',serif;font-size:30px;letter-spacing:5px;color:${COLORS.cream};font-weight:700;text-transform:uppercase;line-height:1.1;">${BRAND_NAME}</div>
        <div style="width:48px;height:1px;background:${COLORS.gold};margin:14px auto 10px;"></div>
        <div style="font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:13px;color:${COLORS.gold};letter-spacing:2px;">${BRAND_TAGLINE}</div>
      </td>
    </tr>
  `;
}

function footer(): string {
  return `
    <tr>
      <td style="padding:28px 32px;text-align:center;background:${COLORS.dark};color:${COLORS.cream};">
        <div style="font-family:Georgia,'Times New Roman',serif;font-size:14px;letter-spacing:3px;color:${COLORS.gold};text-transform:uppercase;margin-bottom:8px;">${BRAND_NAME}</div>
        <div style="font-family:Helvetica,Arial,sans-serif;font-size:11px;color:#A8A29E;line-height:1.6;">
          Crafted in Kentucky &middot; Please drink responsibly<br/>
          Questions? Reply to this email or write us at <a href="mailto:support@bourbonoaklover.com" style="color:${COLORS.gold};text-decoration:none;">support@bourbonoaklover.com</a>
        </div>
      </td>
    </tr>
  `;
}

function shell(inner: string, preheader: string): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${BRAND_NAME}</title>
</head>
<body style="margin:0;padding:0;background:${COLORS.cream};font-family:Helvetica,Arial,sans-serif;color:${COLORS.dark};">
  <div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${escapeHtml(preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${COLORS.cream};">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:#ffffff;border:1px solid ${COLORS.border};">
          ${header()}
          ${inner}
          ${footer()}
        </table>
        <div style="font-family:Helvetica,Arial,sans-serif;font-size:11px;color:${COLORS.muted};margin-top:12px;">
          &copy; ${new Date().getFullYear()} ${BRAND_NAME}. All rights reserved.
        </div>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function itemsTable(items: OrderEmailItem[]): string {
  const rows = items
    .map((it) => {
      const lineTotal = it.unitPrice * it.quantity;
      const age = it.ageLabel ? `<div style="font-size:11px;color:${COLORS.gold};letter-spacing:1.5px;text-transform:uppercase;margin-top:2px;">${escapeHtml(it.ageLabel)} Aged</div>` : "";
      return `
        <tr>
          <td style="padding:14px 0;border-bottom:1px solid ${COLORS.border};vertical-align:top;">
            <div style="font-family:Georgia,'Times New Roman',serif;font-size:15px;font-weight:600;color:${COLORS.deep};">${escapeHtml(it.name)}</div>
            ${age}
            <div style="font-size:12px;color:${COLORS.muted};margin-top:4px;">Qty: ${it.quantity} &times; ${currency(it.unitPrice)}</div>
          </td>
          <td style="padding:14px 0;border-bottom:1px solid ${COLORS.border};text-align:right;vertical-align:top;font-family:Georgia,'Times New Roman',serif;font-size:15px;font-weight:600;color:${COLORS.deep};white-space:nowrap;">
            ${currency(lineTotal)}
          </td>
        </tr>
      `;
    })
    .join("");

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <thead>
        <tr>
          <th align="left" style="padding:0 0 10px;font-size:11px;letter-spacing:2px;color:${COLORS.muted};text-transform:uppercase;border-bottom:1px solid ${COLORS.border};">Item</th>
          <th align="right" style="padding:0 0 10px;font-size:11px;letter-spacing:2px;color:${COLORS.muted};text-transform:uppercase;border-bottom:1px solid ${COLORS.border};">Total</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

function totalsBlock(totals: OrderEmailData["totals"]): string {
  const row = (label: string, value: string, opts?: { strong?: boolean; muted?: boolean }) => `
    <tr>
      <td style="padding:6px 0;font-size:13px;color:${opts?.muted ? COLORS.muted : COLORS.dark};${opts?.strong ? "font-weight:700;" : ""}">${label}</td>
      <td style="padding:6px 0;text-align:right;font-size:13px;color:${opts?.muted ? COLORS.muted : COLORS.dark};${opts?.strong ? "font-weight:700;" : ""}font-family:Georgia,'Times New Roman',serif;">${value}</td>
    </tr>
  `;

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:6px;">
      ${row("Subtotal", currency(totals.subtotal))}
      ${totals.discount > 0 ? row("Discount", `&minus; ${currency(totals.discount)}`, { muted: true }) : ""}
      ${row("Shipping", currency(totals.shippingCost))}
      ${row("Tax", currency(totals.tax))}
      <tr><td colspan="2" style="border-top:1px solid ${COLORS.border};padding:0;line-height:0;font-size:0;">&nbsp;</td></tr>
      <tr>
        <td style="padding:12px 0 0;font-family:Georgia,'Times New Roman',serif;font-size:16px;font-weight:700;color:${COLORS.deep};letter-spacing:1px;text-transform:uppercase;">Total</td>
        <td style="padding:12px 0 0;text-align:right;font-family:Georgia,'Times New Roman',serif;font-size:20px;font-weight:700;color:${COLORS.gold};">${currency(totals.total)}</td>
      </tr>
    </table>
  `;
}

function addressBlock(d: OrderEmailData): string {
  const line2 = d.shippingAddress.line2 ? `<div>${escapeHtml(d.shippingAddress.line2)}</div>` : "";
  return `
    <div style="font-family:Helvetica,Arial,sans-serif;font-size:13px;color:${COLORS.dark};line-height:1.6;">
      <div style="font-weight:600;">${escapeHtml(d.customer.fullName)}</div>
      <div>${escapeHtml(d.shippingAddress.line1)}</div>
      ${line2}
      <div>${escapeHtml(d.shippingAddress.city)}, ${escapeHtml(d.shippingAddress.region)} ${escapeHtml(d.shippingAddress.postal)}</div>
      <div>${escapeHtml(d.shippingAddress.country)}</div>
    </div>
  `;
}

function sectionLabel(text: string): string {
  return `<div style="font-family:Helvetica,Arial,sans-serif;font-size:11px;letter-spacing:3px;color:${COLORS.gold};text-transform:uppercase;margin:0 0 10px;font-weight:700;">${text}</div>`;
}

export function buildCustomerOrderEmail(data: OrderEmailData): { subject: string; html: string; text: string } {
  const firstName = data.customer.fullName.split(/\s+/)[0] ?? "there";
  const placedAt = data.placedAt.toLocaleString("en-US", {
    dateStyle: "long",
    timeStyle: "short",
  });

  const inner = `
    <tr>
      <td style="padding:36px 32px 8px;">
        <div style="font-family:Helvetica,Arial,sans-serif;font-size:11px;letter-spacing:3px;color:${COLORS.gold};text-transform:uppercase;font-weight:700;">Order Received</div>
        <h1 style="font-family:Georgia,'Times New Roman',serif;font-size:26px;color:${COLORS.deep};margin:10px 0 14px;line-height:1.2;">Thank you, ${escapeHtml(firstName)}.</h1>
        <p style="font-family:Helvetica,Arial,sans-serif;font-size:14px;line-height:1.7;color:${COLORS.stone};margin:0 0 8px;">
          We have received your order and a member of our team will be in touch shortly to confirm payment and arrange shipping.
        </p>
        <p style="font-family:Helvetica,Arial,sans-serif;font-size:14px;line-height:1.7;color:${COLORS.stone};margin:0;">
          Below is a summary of what you ordered. If anything looks wrong, just reply to this email.
        </p>
      </td>
    </tr>

    <tr>
      <td style="padding:24px 32px 8px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${COLORS.cream};border:1px solid ${COLORS.border};">
          <tr>
            <td style="padding:18px 20px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="font-family:Helvetica,Arial,sans-serif;font-size:11px;letter-spacing:2px;color:${COLORS.muted};text-transform:uppercase;">Order Number</td>
                  <td align="right" style="font-family:Helvetica,Arial,sans-serif;font-size:11px;letter-spacing:2px;color:${COLORS.muted};text-transform:uppercase;">Placed</td>
                </tr>
                <tr>
                  <td style="font-family:Georgia,'Times New Roman',serif;font-size:16px;font-weight:700;color:${COLORS.deep};padding-top:4px;">${escapeHtml(data.orderNumber)}</td>
                  <td align="right" style="font-family:Georgia,'Times New Roman',serif;font-size:14px;color:${COLORS.deep};padding-top:4px;">${escapeHtml(placedAt)}</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <tr>
      <td style="padding:20px 32px 4px;">
        ${sectionLabel("Your Order")}
        ${itemsTable(data.items)}
      </td>
    </tr>

    <tr>
      <td style="padding:14px 32px 8px;">
        ${totalsBlock(data.totals)}
      </td>
    </tr>

    <tr>
      <td style="padding:24px 32px 8px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td width="50%" valign="top" style="padding-right:12px;">
              ${sectionLabel("Shipping To")}
              ${addressBlock(data)}
            </td>
            <td width="50%" valign="top" style="padding-left:12px;">
              ${sectionLabel("Delivery & Payment")}
              <div style="font-family:Helvetica,Arial,sans-serif;font-size:13px;color:${COLORS.dark};line-height:1.6;">
                <div>${escapeHtml(data.shippingMethodLabel)}</div>
                <div>${escapeHtml(data.paymentMethodLabel)}</div>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <tr>
      <td style="padding:28px 32px 36px;">
        <div style="border-top:1px solid ${COLORS.border};padding-top:20px;font-family:Helvetica,Arial,sans-serif;font-size:13px;line-height:1.7;color:${COLORS.stone};">
          We will reach out shortly with next steps. Thank you for choosing ${BRAND_NAME} &mdash; we appreciate your trust.
          <div style="margin-top:14px;font-family:Georgia,'Times New Roman',serif;font-style:italic;color:${COLORS.gold};">&mdash; The ${BRAND_NAME} Team</div>
        </div>
      </td>
    </tr>
  `;

  const subject = `We've received your order ${data.orderNumber} — ${BRAND_NAME}`;

  const text = [
    `Thank you, ${firstName}.`,
    "",
    `We have received your order ${data.orderNumber} and will be in touch shortly to confirm payment and shipping.`,
    "",
    "Order summary:",
    ...data.items.map((it) => `  - ${it.name} (${it.ageLabel ?? ""}) x${it.quantity} @ ${currency(it.unitPrice)}`),
    "",
    `Subtotal: ${currency(data.totals.subtotal)}`,
    data.totals.discount > 0 ? `Discount: -${currency(data.totals.discount)}` : "",
    `Shipping: ${currency(data.totals.shippingCost)}`,
    `Tax: ${currency(data.totals.tax)}`,
    `Total: ${currency(data.totals.total)}`,
    "",
    `Shipping to: ${data.customer.fullName}, ${data.shippingAddress.line1}, ${data.shippingAddress.city}, ${data.shippingAddress.region} ${data.shippingAddress.postal}, ${data.shippingAddress.country}`,
    `Delivery: ${data.shippingMethodLabel}`,
    `Payment: ${data.paymentMethodLabel}`,
    "",
    `— The ${BRAND_NAME} Team`,
  ]
    .filter(Boolean)
    .join("\n");

  return {
    subject,
    html: shell(inner, `Order ${data.orderNumber} received — we'll be in touch shortly.`),
    text,
  };
}

export function buildSalesOrderEmail(data: OrderEmailData): { subject: string; html: string; text: string } {
  const placedAt = data.placedAt.toLocaleString("en-US", {
    dateStyle: "long",
    timeStyle: "short",
  });

  const inner = `
    <tr>
      <td style="padding:30px 32px 8px;">
        <div style="font-family:Helvetica,Arial,sans-serif;font-size:11px;letter-spacing:3px;color:${COLORS.amber};text-transform:uppercase;font-weight:700;">New Order &middot; Action Required</div>
        <h1 style="font-family:Georgia,'Times New Roman',serif;font-size:24px;color:${COLORS.deep};margin:10px 0 6px;">${escapeHtml(data.orderNumber)}</h1>
        <div style="font-family:Helvetica,Arial,sans-serif;font-size:13px;color:${COLORS.muted};">${escapeHtml(placedAt)}</div>
      </td>
    </tr>

    <tr>
      <td style="padding:18px 32px 8px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${COLORS.cream};border:1px solid ${COLORS.border};">
          <tr>
            <td style="padding:18px 20px;">
              ${sectionLabel("Customer")}
              <div style="font-family:Helvetica,Arial,sans-serif;font-size:14px;line-height:1.7;color:${COLORS.dark};">
                <div style="font-weight:600;font-size:15px;">${escapeHtml(data.customer.fullName)}</div>
                <div><a href="mailto:${escapeHtml(data.customer.email)}" style="color:${COLORS.gold};text-decoration:none;">${escapeHtml(data.customer.email)}</a></div>
                ${data.customer.phone ? `<div>${escapeHtml(data.customer.phone)}</div>` : ""}
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <tr>
      <td style="padding:18px 32px 4px;">
        ${sectionLabel("Items")}
        ${itemsTable(data.items)}
      </td>
    </tr>

    <tr>
      <td style="padding:14px 32px 8px;">
        ${totalsBlock(data.totals)}
      </td>
    </tr>

    <tr>
      <td style="padding:24px 32px 8px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td width="50%" valign="top" style="padding-right:12px;">
              ${sectionLabel("Ship To")}
              ${addressBlock(data)}
            </td>
            <td width="50%" valign="top" style="padding-left:12px;">
              ${sectionLabel("Delivery & Payment")}
              <div style="font-family:Helvetica,Arial,sans-serif;font-size:13px;color:${COLORS.dark};line-height:1.6;">
                <div><strong>Shipping:</strong> ${escapeHtml(data.shippingMethodLabel)}</div>
                <div><strong>Payment:</strong> ${escapeHtml(data.paymentMethodLabel)}</div>
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <tr>
      <td style="padding:24px 32px 32px;">
        <div style="border-top:1px solid ${COLORS.border};padding-top:18px;font-family:Helvetica,Arial,sans-serif;font-size:12px;color:${COLORS.muted};line-height:1.6;">
          Reach out to the customer to confirm payment and arrange shipping. Manage this order in the admin panel using the order number above.
        </div>
      </td>
    </tr>
  `;

  const subject = `[New Order] ${data.orderNumber} — ${currency(data.totals.total)} — ${data.customer.fullName}`;

  const text = [
    `NEW ORDER: ${data.orderNumber}`,
    `Placed: ${placedAt}`,
    "",
    `Customer: ${data.customer.fullName} <${data.customer.email}>${data.customer.phone ? ` / ${data.customer.phone}` : ""}`,
    "",
    "Items:",
    ...data.items.map((it) => `  - ${it.name} (${it.ageLabel ?? ""}) x${it.quantity} @ ${currency(it.unitPrice)} = ${currency(it.unitPrice * it.quantity)}`),
    "",
    `Subtotal: ${currency(data.totals.subtotal)}`,
    data.totals.discount > 0 ? `Discount: -${currency(data.totals.discount)}` : "",
    `Shipping: ${currency(data.totals.shippingCost)}`,
    `Tax: ${currency(data.totals.tax)}`,
    `Total: ${currency(data.totals.total)}`,
    "",
    "Ship to:",
    `  ${data.customer.fullName}`,
    `  ${data.shippingAddress.line1}${data.shippingAddress.line2 ? ", " + data.shippingAddress.line2 : ""}`,
    `  ${data.shippingAddress.city}, ${data.shippingAddress.region} ${data.shippingAddress.postal}`,
    `  ${data.shippingAddress.country}`,
    "",
    `Shipping method: ${data.shippingMethodLabel}`,
    `Payment method: ${data.paymentMethodLabel}`,
  ]
    .filter(Boolean)
    .join("\n");

  return {
    subject,
    html: shell(inner, `New order ${data.orderNumber} — ${currency(data.totals.total)}`),
    text,
  };
}
