"use client";

import { format, parseISO } from "date-fns";
import { formatBankAccountDetail } from "@/lib/settlement/bank-account";
import type { Counterparty, SettlementRail, SettlementReceipt } from "@/lib/settlement/schema";
import { cn } from "@/lib/utils";
import { amountFontSizeStyle, formatAmountDisplay } from "./amount-utils";
import { ConfirmRow } from "./confirm-row";
import { CounterpartyStatusIcon } from "./counterparty-status-icon";
import { amountDisplayClass, captionMutedClass } from "./styles";

const receiptStatusLabel: Record<SettlementReceipt["status"], string> = {
  settled: "Sent",
  queued_review: "Pending review",
  scheduled: "Scheduled",
  failed: "Failed",
};

type ReceiptConfirmViewProps = {
  receipt: SettlementReceipt;
  rail: SettlementRail | undefined;
  counterparty: Counterparty | undefined;
};

export function ReceiptConfirmView({ receipt, rail, counterparty }: ReceiptConfirmViewProps) {
  const amountDisplay = formatAmountDisplay(receipt.amountCents);
  const amountFontStyle = amountFontSizeStyle(Math.max(amountDisplay.length, 4));
  const sentAtLabel = format(parseISO(receipt.createdAt), "MMM d, yyyy 'at' h:mm a");
  const scheduledForLabel = receipt.scheduledFor
    ? format(parseISO(receipt.scheduledFor), "MMM d, yyyy 'at' h:mm a")
    : null;
  const memo = receipt.memo.trim();

  return (
    <>
      <div className="pb-6 text-center">
        <div className={cn(amountDisplayClass, "text-mbp-fg")} style={amountFontStyle}>
          {amountDisplay}
          <span className="ml-1 text-xs">USD</span>
        </div>
      </div>
      <div className="space-y-1">
        <ConfirmRow label="Status" value={receiptStatusLabel[receipt.status]} />
        <ConfirmRow label="From" value={rail?.label ?? "Credit pool"} />
        <ConfirmRow
          label="To"
          value={counterparty?.displayName ?? "Unknown recipient"}
          valueLeading={
            counterparty?.status === "verified" ? (
              <CounterpartyStatusIcon status="verified" size="md" />
            ) : null
          }
        />
        {counterparty?.bankAccount ? (
          <ConfirmRow label="Bank" value={formatBankAccountDetail(counterparty.bankAccount)} />
        ) : null}
        {scheduledForLabel ? (
          <ConfirmRow label="Scheduled for" value={scheduledForLabel} />
        ) : (
          <ConfirmRow label="Sent" value={sentAtLabel} />
        )}
        {scheduledForLabel ? <ConfirmRow label="Created" value={sentAtLabel} /> : null}
        <ConfirmRow label="Reference" value={receipt.auditRef} />
      </div>
      {memo ? (
        <div className="mt-3 space-y-1 rounded-mbp-surface! bg-mbp-surface! px-3.5 py-2.5">
          <p className={captionMutedClass}>Private note</p>
          <p className="text-mbp-body font-mbp-body leading-snug text-mbp-fg">{memo}</p>
        </div>
      ) : null}
    </>
  );
}
