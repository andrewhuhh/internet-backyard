"use client";

import { Button } from "@/components/ui/button";
import { formatBankAccountDetail } from "@/lib/settlement/bank-account";
import type { Counterparty, SettlementRail } from "@/lib/settlement/schema";
import { cn } from "@/lib/utils";
import { amountFontSizeStyle, formatAmountDisplay } from "./amount-utils";
import { ConfirmRow } from "./confirm-row";
import { amountDisplayClass, captionMutedClass, primaryButtonClass } from "./styles";
import type { PaymentTime } from "./types";

type ConfirmStepProps = {
  amountCents: number;
  amountInputLength: number;
  rail: SettlementRail | undefined;
  counterparty: Counterparty | undefined;
  time: PaymentTime;
  scheduledDateLabel: string;
  isSubmitting: boolean;
  onSubmit: () => void;
};

export function ConfirmStep({
  amountCents,
  amountInputLength,
  rail,
  counterparty,
  time,
  scheduledDateLabel,
  isSubmitting,
  onSubmit,
}: ConfirmStepProps) {
  const amountFontStyle = amountFontSizeStyle(amountInputLength);

  return (
    <>
      <div className="py-4 pb-5 text-center">
        <div className={cn(amountDisplayClass, "text-mbp-fg")} style={amountFontStyle}>
          {formatAmountDisplay(amountCents)}
          <span className="ml-1 text-xs">USD</span>
        </div>
      </div>
      <div className="space-y-2">
        <ConfirmRow label="From" value={rail?.label ?? "Credit pool"} />
        <ConfirmRow label="To" value={counterparty?.displayName ?? "Nova Foundry"} />
        {counterparty?.bankAccount ? (
          <ConfirmRow label="Bank" value={formatBankAccountDetail(counterparty.bankAccount)} />
        ) : null}
        <ConfirmRow label="Time" value={time === "instant" ? "Instant" : scheduledDateLabel} />
      </div>
      <Button
        variant="link"
        className={cn("mx-auto mt-3 flex leading-tight", captionMutedClass)}
        type="button"
      >
        + Add a private note
      </Button>
      <Button
        variant="ghost"
        className={cn(primaryButtonClass, "mt-5")}
        disabled={isSubmitting}
        onClick={onSubmit}
        type="button"
      >
        {isSubmitting ? "Submitting…" : "Submit"}
      </Button>
    </>
  );
}
