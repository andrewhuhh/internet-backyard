"use client";

import { format, parseISO } from "date-fns";
import type { CreditTransfer, SettlementRail } from "@/lib/settlement/schema";
import { cn } from "@/lib/utils";
import { amountFontSizeStyle, formatAmountDisplay } from "./amount-utils";
import { ConfirmRow } from "./confirm-row";
import { amountDisplayClass, captionMutedClass } from "./styles";

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

type TransferConfirmViewProps = {
  transfer: CreditTransfer;
  fromRail: SettlementRail | undefined;
  toRail: SettlementRail | undefined;
};

export function TransferConfirmView({ transfer, fromRail, toRail }: TransferConfirmViewProps) {
  const amountDisplay = formatAmountDisplay(transfer.amountCents);
  const amountFontStyle = amountFontSizeStyle(Math.max(amountDisplay.length, 4));
  const createdAtLabel = format(parseISO(transfer.createdAt), "MMM d, yyyy 'at' h:mm a");
  const memo = transfer.memo.trim();

  return (
    <>
      <div className="pb-6 text-center">
        <div className={cn(amountDisplayClass, "text-mbp-fg")} style={amountFontStyle}>
          {amountDisplay}
          <span className="ml-1 text-xs">USD</span>
        </div>
      </div>
      <div className="space-y-1">
        <ConfirmRow label="Status" value={transferStatusLabel[transfer.status]} />
        <ConfirmRow label="From" value={fromRail?.label ?? "Unknown account"} />
        <ConfirmRow label="To" value={toRail?.label ?? "Unknown account"} />
        <ConfirmRow label={transferDateLabel[transfer.status]} value={createdAtLabel} />
        <ConfirmRow label="Reference" value={transfer.auditRef} />
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
