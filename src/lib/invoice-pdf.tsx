import path from "node:path";
import {
  Document,
  Font,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer,
} from "@react-pdf/renderer";
import {
  type InvoiceSnapshot,
  STATUS_LABEL,
  formatIssueDate,
  money,
} from "@/lib/invoice";

/**
 * The invoice as a real PDF.
 *
 * This is a second rendering of the same document — react-pdf has its own
 * layout engine and cannot consume the HTML template, so the markup is
 * necessarily separate. Both renderers are driven from one InvoiceSnapshot and
 * neither computes anything: every figure is read straight off the snapshot, so
 * the two can differ in layout but never in content.
 *
 * Node-only. renderToBuffer needs the filesystem for fonts, so any route
 * importing this must run on the Node runtime, not the edge.
 */

const FONT_DIR = path.join(process.cwd(), "src", "lib", "fonts");

/* Registered once per process. react-pdf keeps a module-level registry, so
   re-registering on every render leaks and slows cold starts. */
let fontsReady = false;
function registerFonts() {
  if (fontsReady) return;
  Font.register({
    family: "Inter",
    fonts: [
      { src: path.join(FONT_DIR, "Inter-Regular.ttf"), fontWeight: 400 },
      { src: path.join(FONT_DIR, "Inter-SemiBold.ttf"), fontWeight: 600 },
      { src: path.join(FONT_DIR, "Inter-Bold.ttf"), fontWeight: 700 },
    ],
  });
  Font.register({
    family: "Playfair",
    fonts: [{ src: path.join(FONT_DIR, "PlayfairDisplay-Bold.ttf"), fontWeight: 700 }],
  });
  /* Without this, react-pdf never breaks a long unbroken string — a product
     name with no spaces would run off the page rather than wrap. */
  Font.registerHyphenationCallback((word) => [word]);
  fontsReady = true;
}

const GOLD = "#CA8A04";
const DEEP = "#0C0A09";
const CREAM = "#FAFAF9";
const STONE = "#57534E";
const MUTED = "#A8A29E";
const RULE = "#E8E5E0";
const GREEN = "#15803D";

const s = StyleSheet.create({
  page: { fontFamily: "Inter", fontSize: 9, color: DEEP, backgroundColor: CREAM },

  band: { backgroundColor: DEEP, paddingHorizontal: 40, paddingTop: 32, paddingBottom: 28 },
  bandTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  logoRow: { flexDirection: "row", alignItems: "center" },
  badge: {
    width: 30, height: 30, borderWidth: 1.2, borderColor: GOLD,
    alignItems: "center", justifyContent: "center", marginRight: 9,
  },
  badgeText: { fontFamily: "Playfair", fontWeight: 700, fontSize: 16, color: GOLD },
  wordmark: { fontFamily: "Playfair", fontWeight: 700, fontSize: 17, color: CREAM },
  est: { fontSize: 6, fontWeight: 600, letterSpacing: 1.7, color: GOLD, marginTop: 3 },
  invoiceWord: { fontSize: 26, fontWeight: 700, letterSpacing: 3.6, color: CREAM, textAlign: "right" },
  invoiceNo: { fontSize: 8, letterSpacing: 0.8, color: "#8C8885", marginTop: 5, textAlign: "right" },

  bandRule: { borderTopWidth: 1, borderTopColor: "#2A2724", marginTop: 22, paddingTop: 14 },
  bandBottom: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  sellerLine: { fontSize: 8, lineHeight: 1.6, color: "#8C8885" },
  metaRow: { flexDirection: "row" },
  metaCell: { marginLeft: 26, alignItems: "flex-end" },
  metaLabel: { fontSize: 5.8, fontWeight: 700, letterSpacing: 1.3, color: "#6E6A67", marginBottom: 4 },
  metaValue: { fontSize: 9, fontWeight: 600, color: CREAM },

  goldRule: { height: 2, backgroundColor: GOLD },

  body: { paddingHorizontal: 40, paddingTop: 26, flexGrow: 1 },

  parties: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  party: { width: "37%" },
  lbl: { fontSize: 5.8, fontWeight: 700, letterSpacing: 1.3, color: MUTED, marginBottom: 6 },
  who: { fontSize: 10.5, fontWeight: 600, color: DEEP, marginBottom: 4 },
  addr: { fontSize: 8.2, lineHeight: 1.65, color: STONE },

  pill: { paddingVertical: 4, paddingHorizontal: 9, borderWidth: 1 },
  pillText: { fontSize: 6.6, fontWeight: 700, letterSpacing: 1 },

  thead: { flexDirection: "row", backgroundColor: DEEP, marginTop: 24 },
  th: { fontSize: 5.8, fontWeight: 700, letterSpacing: 1.2, color: CREAM, paddingVertical: 7, paddingHorizontal: 9 },
  tr: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: RULE },
  td: { paddingVertical: 10, paddingHorizontal: 9 },
  cDesc: { width: "52%" },
  cQty: { width: "12%", textAlign: "right" },
  cUnit: { width: "18%", textAlign: "right" },
  cAmt: { width: "18%", textAlign: "right" },
  itemName: { fontSize: 9, fontWeight: 600, color: DEEP },
  itemDetail: { fontSize: 7.2, color: "#8A8580", marginTop: 2.5 },
  cell: { fontSize: 9, color: DEEP },

  lower: { flexDirection: "row", marginTop: 22, alignItems: "flex-start" },
  payBox: {
    /* flexBasis 0 is load-bearing: react-pdf sizes a flexGrow item from its
       CONTENT when no basis is given, so a long payment instruction widened
       this box straight over the totals column instead of wrapping inside it. */
    flexGrow: 1, flexBasis: 0, minWidth: 0,
    marginRight: 26, backgroundColor: "#FFFFFF",
    borderWidth: 1, borderColor: RULE, borderLeftWidth: 3, borderLeftColor: GOLD,
    padding: 13,
  },
  payTitle: { fontSize: 5.8, fontWeight: 700, letterSpacing: 1.3, color: MUTED, marginBottom: 7 },
  payText: { fontSize: 8.2, lineHeight: 1.7, color: STONE },

  totals: { width: 215, flexShrink: 0 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 5 },
  totalLabel: { fontSize: 8.4, color: STONE },
  totalValue: { fontSize: 8.4, fontWeight: 600, color: DEEP },
  grand: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    backgroundColor: DEEP, paddingVertical: 11, paddingHorizontal: 13, marginTop: 9,
  },
  grandLabel: { fontSize: 6.4, fontWeight: 700, letterSpacing: 1.2, color: GOLD },
  grandValue: { fontSize: 17, fontWeight: 700, color: CREAM },

  foot: {
    position: "absolute", bottom: 28, left: 40, right: 40,
    borderTopWidth: 1, borderTopColor: RULE, paddingTop: 16,
    flexDirection: "row", justifyContent: "space-between",
  },
  footText: { fontSize: 6.6, lineHeight: 1.6, color: MUTED },
});

function pillColors(status: InvoiceSnapshot["status"]) {
  if (status === "PAID") return { backgroundColor: "#DCFCE7", borderColor: "#86EFAC", color: GREEN };
  if (status === "VOID") return { backgroundColor: "#F4F4F5", borderColor: "#D4D4D8", color: "#71717A" };
  return { backgroundColor: "#FEF3C7", borderColor: "#E4BE6A", color: "#92400E" };
}

function InvoiceDoc({ inv }: { inv: InvoiceSnapshot }) {
  const t = inv.totals;
  const paid = inv.status === "PAID";
  const pc = pillColors(inv.status);

  return (
    <Document
      title={`Invoice ${inv.invoiceNumber}`}
      author="Bourbon & Oak Distillery"
      subject={`Invoice for order ${inv.orderNumber}`}
    >
      <Page size="A4" style={s.page}>
        {/* letterhead */}
        <View style={s.band}>
          <View style={s.bandTop}>
            <View style={s.logoRow}>
              <View style={s.badge}><Text style={s.badgeText}>B</Text></View>
              <View>
                <Text style={s.wordmark}>Bourbon &amp; Oak</Text>
                <Text style={s.est}>EST. 1876</Text>
              </View>
            </View>
            <View>
              <Text style={s.invoiceWord}>INVOICE</Text>
              <Text style={s.invoiceNo}>{inv.invoiceNumber}</Text>
            </View>
          </View>

          <View style={s.bandRule}>
            <View style={s.bandBottom}>
              <Text style={s.sellerLine}>
                {inv.seller.lines[0]} · {inv.seller.lines[1]}
                {"\n"}
                {inv.seller.email}
              </Text>
              <View style={s.metaRow}>
                <View style={s.metaCell}>
                  <Text style={s.metaLabel}>ORDER</Text>
                  <Text style={s.metaValue}>{inv.orderNumber}</Text>
                </View>
                <View style={s.metaCell}>
                  <Text style={s.metaLabel}>ISSUED</Text>
                  <Text style={s.metaValue}>{formatIssueDate(inv.issuedAt)}</Text>
                </View>
                <View style={s.metaCell}>
                  <Text style={s.metaLabel}>TERMS</Text>
                  <Text style={s.metaValue}>{inv.terms}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
        <View style={s.goldRule} />

        <View style={s.body}>
          {/* parties */}
          <View style={s.parties}>
            <View style={s.party}>
              <Text style={s.lbl}>BILLED TO</Text>
              <Text style={s.who}>{inv.billedTo.name}</Text>
              <Text style={s.addr}>
                {inv.billedTo.lines.join("\n")}
                {inv.billedTo.email ? `\n${inv.billedTo.email}` : ""}
              </Text>
            </View>
            <View style={s.party}>
              <Text style={s.lbl}>SHIPPED TO</Text>
              <Text style={s.who}>{inv.shippedTo.name}</Text>
              <Text style={s.addr}>
                {inv.shippedTo.lines.join("\n")}
                {`\n${inv.shippingLabel}\nAdult signature required`}
              </Text>
            </View>
            <View style={[s.pill, { backgroundColor: pc.backgroundColor, borderColor: pc.borderColor }]}>
              <Text style={[s.pillText, { color: pc.color }]}>{STATUS_LABEL[inv.status]}</Text>
            </View>
          </View>

          {/* lines */}
          <View style={s.thead} fixed>
            <Text style={[s.th, s.cDesc]}>DESCRIPTION</Text>
            <Text style={[s.th, s.cQty]}>QTY</Text>
            <Text style={[s.th, s.cUnit]}>UNIT PRICE</Text>
            <Text style={[s.th, s.cAmt]}>AMOUNT</Text>
          </View>
          {inv.lines.map((l, i) => (
            <View key={i} style={[s.tr, i % 2 === 1 ? { backgroundColor: "#FFFFFF" } : {}]} wrap={false}>
              <View style={[s.td, s.cDesc]}>
                <Text style={s.itemName}>{l.description}</Text>
                {l.detail ? <Text style={s.itemDetail}>{l.detail}</Text> : null}
              </View>
              <Text style={[s.td, s.cQty, s.cell]}>{l.quantity}</Text>
              <Text style={[s.td, s.cUnit, s.cell]}>{money(l.unitPrice, inv.currency)}</Text>
              <Text style={[s.td, s.cAmt, s.cell]}>{money(l.amount, inv.currency)}</Text>
            </View>
          ))}

          {/* pay + totals */}
          <View style={s.lower}>
            <View style={s.payBox}>
              <Text style={s.payTitle}>{paid ? "PAYMENT RECEIVED" : "HOW TO PAY"}</Text>
              <Text style={s.payText}>
                {paid
                  ? `Paid by ${inv.paymentLabel}. Thank you — nothing further is owed on this order.`
                  : inv.payInstructions
                    ? inv.payInstructions
                    : `Payment by ${inv.paymentLabel}. Quote reference ${inv.orderNumber} so we can match your payment. Your order ships once payment clears.`}
              </Text>
            </View>

            <View style={s.totals}>
              <View style={s.totalRow}>
                <Text style={s.totalLabel}>Subtotal</Text>
                <Text style={s.totalValue}>{money(t.subtotal, inv.currency)}</Text>
              </View>
              {t.discountLabel ? (
                <View style={s.totalRow}>
                  <Text style={s.totalLabel}>{t.discountLabel}</Text>
                  <Text style={[s.totalValue, { color: GREEN }]}>
                    -{money(t.discount, inv.currency)}
                  </Text>
                </View>
              ) : null}
              <View style={s.totalRow}>
                <Text style={s.totalLabel}>Shipping</Text>
                <Text style={s.totalValue}>{money(t.shipping, inv.currency)}</Text>
              </View>
              <View style={s.totalRow}>
                <Text style={s.totalLabel}>Tax</Text>
                <Text style={s.totalValue}>{money(t.tax, inv.currency)}</Text>
              </View>
              <View style={s.grand}>
                <Text style={s.grandLabel}>{paid ? "TOTAL PAID" : "TOTAL DUE"}</Text>
                <Text style={s.grandValue}>{money(t.total, inv.currency)}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={s.foot} fixed>
          <Text style={s.footText}>
            {inv.seller.name} · {inv.seller.lines[1]}
            {"\n"}Six generations of Kentucky bourbon since 1876
          </Text>
          <Text style={[s.footText, { textAlign: "right" }]}>
            You must be 21+ to purchase.
            {"\n"}Adult signature required at delivery.
          </Text>
        </View>
      </Page>
    </Document>
  );
}

/** Render to a Buffer, ready to attach to an email or upload. */
export async function renderInvoicePdf(inv: InvoiceSnapshot): Promise<Buffer> {
  registerFonts();
  return renderToBuffer(<InvoiceDoc inv={inv} />);
}

/** Filename used for the attachment and the download. */
export function invoiceFileName(inv: InvoiceSnapshot): string {
  return `invoice-${inv.invoiceNumber}.pdf`;
}
