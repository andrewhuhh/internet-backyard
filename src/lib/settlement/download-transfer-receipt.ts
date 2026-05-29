import { format, parseISO } from "date-fns";
import { formatUsd } from "@/lib/settlement/format";
import type { CreditTransfer, SettlementRail } from "@/lib/settlement/schema";

const transferStatusLabel: Record<CreditTransfer["status"], string> = {
  settled: "Transferred",
  awaiting_approval: "Awaiting approval",
  failed: "Failed",
};

const transferDateLabel: Record<CreditTransfer["status"], string> = {
  settled: "Transferred",
  awaiting_approval: "Submitted",
  failed: "Date",
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

type DownloadTransferReceiptInput = {
  transfer: CreditTransfer;
  fromRail?: SettlementRail;
  toRail?: SettlementRail;
};

export function downloadTransferReceipt({
  transfer,
  fromRail,
  toRail,
}: DownloadTransferReceiptInput) {
  const createdAt = format(parseISO(transfer.createdAt), "MMMM d, yyyy 'at' h:mm a");
  const memo = transfer.memo.trim();
  const rows: Array<{ label: string; value: string }> = [
    { label: "Reference", value: transfer.auditRef },
    { label: "Transfer ID", value: transfer.id },
    { label: "Status", value: transferStatusLabel[transfer.status] },
    { label: "From", value: fromRail?.label ?? "Unknown account" },
    { label: "To", value: toRail?.label ?? "Unknown account" },
    { label: transferDateLabel[transfer.status], value: createdAt },
  ];

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
  <title>Transfer ${escapeHtml(transfer.auditRef)}</title>
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
    <p class="meta">Transfer receipt</p>
  </header>
  <p class="amount">${escapeHtml(formatUsd(transfer.amountCents))} USD</p>
  <table>${rowMarkup}</table>
  ${memoMarkup}
</body>
</html>`;

  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `transfer-${transfer.auditRef}.html`;
  anchor.rel = "noopener";
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
