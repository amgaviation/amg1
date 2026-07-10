import "server-only";

import fs from "node:fs";
import path from "node:path";
import {
  Document,
  Image,
  Link,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer,
} from "@react-pdf/renderer";
import type { BillingSettings } from "@/lib/portal/billing-config";

export type BillingPdfLineItem = {
  category: string;
  description?: string | null;
  quantity: number;
  unit_price: number;
  amount: number;
  notes?: string | null;
};

export type BillingPdfInput = {
  kind: "quote" | "invoice" | "receipt";
  documentNumber: string;
  status?: string | null;
  issuedAt?: string | null;
  dueDate?: string | null;
  missionRef?: string | null;
  quoteRef?: string | null;
  invoiceRef?: string | null;
  clientName?: string | null;
  clientEmail?: string | null;
  settings: BillingSettings;
  lineItems: BillingPdfLineItem[];
  subtotal: number;
  discountTotal?: number;
  taxTotal?: number;
  depositAmount?: number;
  amountPaid?: number;
  amountDue?: number;
  total: number;
  terms?: string | null;
  paymentInstructions?: string | null;
  payOnlineUrl?: string | null;
  disclaimer?: string | null;
  payment?: {
    amount: number;
    method?: string | null;
    paidAt?: string | null;
    reference?: string | null;
  };
};

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontSize: 10,
    color: "#162033",
    fontFamily: "Helvetica",
    lineHeight: 1.35,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottom: "1 solid #c6cfda",
    paddingBottom: 18,
    marginBottom: 22,
  },
  logo: { width: 135, height: 42, objectFit: "contain" },
  brandFallback: { fontSize: 17, fontWeight: 700, color: "#0c2242" },
  companyMeta: { marginTop: 8, color: "#526070", maxWidth: 250 },
  docTitle: { fontSize: 24, fontWeight: 700, textAlign: "right", color: "#0c2242" },
  docNumber: { marginTop: 7, textAlign: "right", color: "#526070" },
  twoCol: { flexDirection: "row", gap: 20, marginBottom: 18 },
  panel: {
    flex: 1,
    border: "1 solid #d7dee8",
    borderRadius: 4,
    padding: 12,
  },
  panelTitle: {
    fontSize: 9,
    letterSpacing: 0.7,
    textTransform: "uppercase",
    color: "#6d7a89",
    marginBottom: 7,
  },
  strong: { fontWeight: 700 },
  muted: { color: "#6d7a89" },
  table: { border: "1 solid #d7dee8", borderRadius: 4, marginTop: 8 },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#eef2f6",
    borderBottom: "1 solid #d7dee8",
    paddingVertical: 8,
    paddingHorizontal: 9,
    fontSize: 8,
    textTransform: "uppercase",
    color: "#526070",
  },
  row: {
    flexDirection: "row",
    borderBottom: "1 solid #edf1f5",
    paddingVertical: 8,
    paddingHorizontal: 9,
  },
  colDescription: { flex: 4 },
  colQty: { flex: 0.8, textAlign: "right" },
  colMoney: { flex: 1.2, textAlign: "right" },
  itemCategory: { fontWeight: 700 },
  itemDescription: { marginTop: 2, color: "#526070" },
  totals: { marginLeft: "auto", marginTop: 18, width: 230 },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottom: "1 solid #edf1f5",
    paddingVertical: 5,
  },
  grandTotal: { fontSize: 13, fontWeight: 700, color: "#0c2242" },
  section: { marginTop: 18 },
  paragraph: { color: "#526070" },
  payLink: { color: "#0c2242", fontWeight: 700, textDecoration: "underline" },
  footer: {
    position: "absolute",
    left: 36,
    right: 36,
    bottom: 26,
    borderTop: "1 solid #d7dee8",
    paddingTop: 8,
    color: "#6d7a89",
    fontSize: 8,
  },
});

function money(value?: number | null) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value ?? 0));
}

function date(value?: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function title(kind: BillingPdfInput["kind"]) {
  if (kind === "quote") return "Quote";
  if (kind === "receipt") return "Receipt";
  return "Invoice";
}

function logoDataUri(logoPath: string) {
  const safePath = logoPath.startsWith("/") ? logoPath.slice(1) : logoPath;
  const fullPath = path.join(process.cwd(), "public", safePath.replace(/^public\//, ""));
  try {
    const ext = path.extname(fullPath).toLowerCase().replace(".", "") || "png";
    return `data:image/${ext};base64,${fs.readFileSync(fullPath).toString("base64")}`;
  } catch {
    return null;
  }
}

function BillingPdfDocument({ input }: { input: BillingPdfInput }) {
  const logo = logoDataUri(input.settings.logo_path);
  const discount = Number(input.discountTotal ?? 0);
  const tax = Number(input.taxTotal ?? 0);
  const deposit = Number(input.depositAmount ?? 0);
  const amountPaid = Number(input.amountPaid ?? input.payment?.amount ?? 0);
  const amountDue = Number(input.amountDue ?? Math.max(input.total - amountPaid, 0));

  return (
    <Document title={`${title(input.kind)} ${input.documentNumber}`}>
      <Page size="LETTER" style={styles.page}>
        <View style={styles.header}>
          <View>
            {logo ? (
              <Image src={logo} style={styles.logo} />
            ) : (
              <Text style={styles.brandFallback}>{input.settings.company_name}</Text>
            )}
            <Text style={styles.companyMeta}>
              {[
                input.settings.company_legal_name,
                input.settings.company_address,
                input.settings.company_email,
                input.settings.company_phone,
              ]
                .filter(Boolean)
                .join("\n")}
            </Text>
          </View>
          <View>
            <Text style={styles.docTitle}>{title(input.kind).toUpperCase()}</Text>
            <Text style={styles.docNumber}>{input.documentNumber}</Text>
            <Text style={styles.docNumber}>Issued {date(input.issuedAt ?? new Date().toISOString())}</Text>
            {input.dueDate ? <Text style={styles.docNumber}>Due {date(input.dueDate)}</Text> : null}
          </View>
        </View>

        <View style={styles.twoCol}>
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>Bill To</Text>
            <Text style={styles.strong}>{input.clientName ?? input.clientEmail ?? "Client"}</Text>
            {input.clientEmail ? <Text style={styles.muted}>{input.clientEmail}</Text> : null}
          </View>
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>Reference</Text>
            {input.missionRef ? <Text>Mission: {input.missionRef}</Text> : null}
            {input.quoteRef ? <Text>Quote: {input.quoteRef}</Text> : null}
            {input.invoiceRef ? <Text>Invoice: {input.invoiceRef}</Text> : null}
            {input.status ? <Text>Status: {input.status.replace(/_/g, " ")}</Text> : null}
          </View>
        </View>

        {input.kind === "receipt" && input.payment ? (
          <View style={styles.panel}>
            <Text style={styles.panelTitle}>Payment Recorded</Text>
            <Text style={styles.grandTotal}>{money(input.payment.amount)}</Text>
            <Text style={styles.muted}>Method: {input.payment.method ?? "Manual"}</Text>
            <Text style={styles.muted}>Date: {date(input.payment.paidAt)}</Text>
            {input.payment.reference ? <Text style={styles.muted}>Reference: {input.payment.reference}</Text> : null}
          </View>
        ) : null}

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colDescription}>Description</Text>
            <Text style={styles.colQty}>Qty</Text>
            <Text style={styles.colMoney}>Unit</Text>
            <Text style={styles.colMoney}>Amount</Text>
          </View>
          {input.lineItems.map((item, index) => (
            <View style={styles.row} key={`${item.category}-${index}`}>
              <View style={styles.colDescription}>
                <Text style={styles.itemCategory}>{item.category}</Text>
                {item.description ? <Text style={styles.itemDescription}>{item.description}</Text> : null}
                {item.notes ? <Text style={styles.itemDescription}>{item.notes}</Text> : null}
              </View>
              <Text style={styles.colQty}>{item.quantity}</Text>
              <Text style={styles.colMoney}>{money(item.unit_price)}</Text>
              <Text style={styles.colMoney}>{money(item.amount)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text>Subtotal</Text>
            <Text>{money(input.subtotal)}</Text>
          </View>
          {discount ? (
            <View style={styles.totalRow}>
              <Text>Discount</Text>
              <Text>-{money(discount)}</Text>
            </View>
          ) : null}
          {tax ? (
            <View style={styles.totalRow}>
              <Text>Tax</Text>
              <Text>{money(tax)}</Text>
            </View>
          ) : null}
          {deposit ? (
            <View style={styles.totalRow}>
              <Text>Deposit Required</Text>
              <Text>{money(deposit)}</Text>
            </View>
          ) : null}
          <View style={styles.totalRow}>
            <Text style={styles.grandTotal}>Total</Text>
            <Text style={styles.grandTotal}>{money(input.total)}</Text>
          </View>
          {input.kind !== "quote" ? (
            <>
              <View style={styles.totalRow}>
                <Text>Paid</Text>
                <Text>{money(amountPaid)}</Text>
              </View>
              <View style={styles.totalRow}>
                <Text>Amount Due</Text>
                <Text>{money(amountDue)}</Text>
              </View>
            </>
          ) : null}
        </View>

        {input.terms ? (
          <View style={styles.section}>
            <Text style={styles.panelTitle}>Terms</Text>
            <Text style={styles.paragraph}>{input.terms}</Text>
          </View>
        ) : null}

        {input.paymentInstructions && input.kind !== "quote" ? (
          <View style={styles.section}>
            <Text style={styles.panelTitle}>Payment Instructions</Text>
            <Text style={styles.paragraph}>{input.paymentInstructions}</Text>
            {input.payOnlineUrl ? (
              <Text style={styles.paragraph}>
                Pay online: <Link src={input.payOnlineUrl} style={styles.payLink}>{input.payOnlineUrl}</Link>
              </Text>
            ) : null}
          </View>
        ) : null}

        {input.disclaimer ? (
          <View style={styles.footer}>
            <Text>{input.disclaimer}</Text>
          </View>
        ) : null}
      </Page>
    </Document>
  );
}

export async function renderBillingPdf(input: BillingPdfInput): Promise<Buffer> {
  return renderToBuffer(<BillingPdfDocument input={input} />);
}
