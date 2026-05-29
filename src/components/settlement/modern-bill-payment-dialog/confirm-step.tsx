"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatBankAccountDetail } from "@/lib/settlement/bank-account";
import type { Counterparty, SettlementRail } from "@/lib/settlement/schema";
import { cn } from "@/lib/utils";
import { amountFontSizeStyle, formatAmountDisplay } from "./amount-utils";
import { ConfirmRow } from "./confirm-row";
import { addRecipientControlClass, amountDisplayClass, captionMutedClass, primaryButtonClass } from "./styles";
import type { PaymentTime } from "./types";

type ConfirmStepProps = {
  amountCents: number;
  amountInputLength: number;
  rail: SettlementRail | undefined;
  counterparty: Counterparty | undefined;
  time: PaymentTime;
  scheduledDateLabel: string;
  memo: string;
  noteOpen: boolean;
  isSubmitting: boolean;
  onNoteOpenChange: (open: boolean) => void;
  onMemoChange: (memo: string) => void;
  onSubmit: () => void;
};

export function ConfirmStep({
  amountCents,
  amountInputLength,
  rail,
  counterparty,
  time,
  scheduledDateLabel,
  memo,
  noteOpen,
  isSubmitting,
  onNoteOpenChange,
  onMemoChange,
  onSubmit,
}: ConfirmStepProps) {
  const amountFontStyle = amountFontSizeStyle(amountInputLength);
  const noteRef = useRef<HTMLTextAreaElement>(null);
  const showNoteField = noteOpen || memo.trim().length > 0;

  useEffect(() => {
    if (showNoteField) {
      noteRef.current?.focus();
    }
  }, [showNoteField]);

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
      {showNoteField ? (
        <div className="mt-3 space-y-1">
          <label htmlFor="modern-payment-private-note" className={cn("block", captionMutedClass)}>
            Private note
          </label>
          <Textarea
            ref={noteRef}
            id="modern-payment-private-note"
            name="modern-payment-private-note"
            value={memo}
            maxLength={180}
            rows={3}
            disabled={isSubmitting}
            placeholder="Only visible to your team"
            className={cn(addRecipientControlClass, "min-h-20 resize-none py-2.5")}
            onChange={(event) => onMemoChange(event.target.value)}
          />
          <p className={cn("text-right", captionMutedClass)}>{memo.length}/180</p>
        </div>
      ) : (
        <Button
          variant="link"
          className={cn("mx-auto mt-3 flex leading-tight", captionMutedClass)}
          type="button"
          disabled={isSubmitting}
          onClick={() => onNoteOpenChange(true)}
        >
          + Add a private note
        </Button>
      )}
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
