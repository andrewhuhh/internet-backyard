"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmRow } from "@/components/settlement/modern-bill-payment-dialog/confirm-row";
import { amountFontSizeStyle, formatAmountDisplay } from "@/components/settlement/modern-bill-payment-dialog/amount-utils";
import {
  addRecipientControlClass,
  amountDisplayClass,
  captionMutedClass,
  primaryButtonClass,
} from "@/components/settlement/modern-bill-payment-dialog/styles";
import type { SettlementRail } from "@/lib/settlement/schema";
import { cn } from "@/lib/utils";

type TransferConfirmStepProps = {
  amountCents: number;
  amountInputLength: number;
  fromRail: SettlementRail | undefined;
  toRail: SettlementRail | undefined;
  needsApproval: boolean;
  memo: string;
  noteOpen: boolean;
  isSubmitting: boolean;
  onNoteOpenChange: (open: boolean) => void;
  onMemoChange: (memo: string) => void;
  onSubmit: () => void;
};

export function TransferConfirmStep({
  amountCents,
  amountInputLength,
  fromRail,
  toRail,
  needsApproval,
  memo,
  noteOpen,
  isSubmitting,
  onNoteOpenChange,
  onMemoChange,
  onSubmit,
}: TransferConfirmStepProps) {
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
      <div className="pb-6 text-center">
        <div className={cn(amountDisplayClass, "text-mbp-fg")} style={amountFontStyle}>
          {formatAmountDisplay(amountCents)}
          <span className="ml-1 text-xs">USD</span>
        </div>
      </div>
      <div className="space-y-1">
        <ConfirmRow label="From" value={fromRail?.label ?? "—"} />
        <ConfirmRow label="To" value={toRail?.label ?? "—"} />
        <ConfirmRow label="Time" value={needsApproval ? "Awaiting approval" : "Instant"} />
      </div>
      {showNoteField ? (
        <div className="mt-3 space-y-1">
          <label htmlFor="transfer-memo" className="sr-only">
            Private note
          </label>
          <Textarea
            ref={noteRef}
            id="transfer-memo"
            name="transfer-memo"
            value={memo}
            maxLength={180}
            rows={3}
            disabled={isSubmitting}
            placeholder="Private note, only visible to your team."
            className={cn(addRecipientControlClass, "min-h-20 resize-none py-2.5")}
            onChange={(event) => onMemoChange(event.target.value)}
          />
          <div className="flex items-center justify-between gap-2">
            <Button
              variant="link"
              className="h-fit text-xs"
              type="button"
              disabled={isSubmitting}
              onClick={() => {
                onMemoChange("");
                onNoteOpenChange(false);
              }}
            >
              Remove
            </Button>
            <p className={captionMutedClass}>{memo.length}/180</p>
          </div>
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
        {isSubmitting
          ? needsApproval
            ? "Requesting…"
            : "Transferring…"
          : needsApproval
            ? "Request transfer"
            : "Transfer"}
      </Button>
    </>
  );
}
