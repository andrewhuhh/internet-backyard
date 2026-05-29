import { format, parseISO } from "date-fns";
import { formatBankAccountDetail } from "@/lib/settlement/bank-account";
import { formatUsd } from "@/lib/settlement/format";
import type { Counterparty, SettlementRail, SettlementReceipt } from "@/lib/settlement/schema";

const receiptStatusLabel: Record<SettlementReceipt["status"], string> = {
  settled: "Sent",
  queued_review: "Pending review",
  scheduled: "Scheduled",
  failed: "Failed",
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

type DownloadSettlementInvoiceInput = {
  receipt: SettlementReceipt;
  rail?: SettlementRail;
  counterparty?: Counterparty;
};

export function downloadSettlementInvoice({
  receipt,
  rail,
  counterparty,
}: DownloadSettlementInvoiceInput) {
  const issuedAt = format(parseISO(receipt.createdAt), "MMMM d, yyyy 'at' h:mm a");
  const scheduledFor = receipt.scheduledFor
    ? format(parseISO(receipt.scheduledFor), "MMMM d, yyyy")
    : null;
  const memo = receipt.memo.trim();
  const rows: Array<{ label: string; value: string }> = [
    { label: "Invoice number", value: receipt.auditRef },
    { label: "Payment ID", value: receipt.id },
    { label: "Status", value: receiptStatusLabel[receipt.status] },
    { label: "From", value: rail?.label ?? "Credit pool" },
    { label: "To", value: counterparty?.displayName ?? "Unknown recipient" },
  ];

  if (counterparty?.bankAccount) {
    rows.push({ label: "Bank", value: formatBankAccountDetail(counterparty.bankAccount) });
  }

  if (scheduledFor) {
    rows.push({ label: "Scheduled for", value: scheduledFor });
  }

  rows.push({ label: "Issued", value: issuedAt });

  const rowMarkup = rows
    .map(
      (row) =>
        `<tr><th scope="row">${escapeHtml(row.label)}</th><td>${escapeHtml(row.value)}</td></tr>`,
    )
    .join("");

  const memoMarkup = memo
    ? `<section class="memo"><h2>Private note</h2><p>${escapeHtml(memo)}</p></section>`
    : "";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Invoice ${escapeHtml(receipt.auditRef)}</title>
  <style>
    body { font-family: system-ui, sans-serif; color: #111; margin: 2rem auto; max-width: 40rem; line-height: 1.5; }
    h1 { font-size: 1.5rem; margin: 0 0 0.25rem; }
    .meta { color: #555; margin-bottom: 2rem; }
    .amount { font-size: 2rem; font-weight: 600; margin: 0 0 2rem; }
    table { width: 100%; border-collapse: collapse; }
    th, td { text-align: left; padding: 0.5rem 0; border-bottom: 1px solid #e5e5e5; vertical-align: top; }
    th { width: 11rem; color: #555; font-weight: 500; }
    .memo { margin-top: 2rem; }
    .memo h2 { font-size: 0.875rem; text-transform: uppercase; letter-spacing: 0.04em; color: #555; }
    .memo p { margin: 0.25rem 0 0; white-space: pre-wrap; }
  </style>
</head>
<body>
  <header>
    <h1>Internet Backyard</h1>
    <p class="meta">Settlement invoice</p>
  </header>
  <p class="amount">${escapeHtml(formatUsd(receipt.amountCents))} USD</p>
  <table>${rowMarkup}</table>
  ${memoMarkup}
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `invoice-${receipt.auditRef}.html`;
  anchor.rel = "noopener";
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
