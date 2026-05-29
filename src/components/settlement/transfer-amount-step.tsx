"use client";

import { ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedAmountInput } from "@/components/settlement/modern-bill-payment-dialog/animated-amount-input";
import {
  amountFontSizeStyle,
  formatAmountDisplay,
  formatAmountInput,
  parseAmountInput,
} from "@/components/settlement/modern-bill-payment-dialog/amount-utils";
import { MiniSelect } from "@/components/settlement/modern-bill-payment-dialog/mini-select";
import {
  amountDisplayClass,
  iconButtonClass,
  primaryButtonClass,
} from "@/components/settlement/modern-bill-payment-dialog/styles";
import type { SettlementRail } from "@/lib/settlement/schema";
import { cents } from "@/lib/settlement/store";
import { cn } from "@/lib/utils";

type TransferAmountStepProps = {
  fromRailId: string;
  toRailId: string;
  transferableRails: SettlementRail[];
  balancesByRailId: Record<string, number>;
  amountInput: string;
  amountCents: number;
  available: number;
  canContinue: boolean;
  onFromChange: (railId: string) => void;
  onToChange: (railId: string) => void;
  onSwap: () => void;
  onAmountInputChange: (formatted: string, amountCents: number) => void;
  onContinue: () => void;
};

export function TransferAmountStep({
  fromRailId,
  toRailId,
  transferableRails,
  balancesByRailId,
  amountInput,
  amountCents,
  available,
  canContinue,
  onFromChange,
  onToChange,
  onSwap,
  onAmountInputChange,
  onContinue,
}: TransferAmountStepProps) {
  const isEmpty = amountCents <= 0;
  const exceeds = available > 0 && amountCents > available;
  const amountFontStyle = amountFontSizeStyle(amountInput.length);

  const railOptions = transferableRails.map((item) => ({
    value: item.id,
    label: item.label,
    amount: cents(balancesByRailId[item.id] ?? 0),
  }));

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <MiniSelect
          label="From"
          value={fromRailId}
          placeholder="Select account"
          options={railOptions}
          onValueChange={onFromChange}
        />
        <MiniSelect
          label="To"
          value={toRailId}
          placeholder="Select account"
          options={railOptions.filter((item) => item.value !== fromRailId)}
          onValueChange={onToChange}
        />
      </div>
      <div className="flex justify-center">
        <Button
          variant="link"
          type="button"
          className={cn(
            "mt-1 h-auto px-2 py-0 text-mbp-caption leading-tight text-mbp-muted transition-colors duration-mbp hover:text-mbp-fg",
            iconButtonClass,
            "size-auto rounded-full flex items-center" // ensure same line
          )}
          aria-label="Swap accounts"
          onClick={onSwap}
          disabled={!fromRailId || !toRailId}
        >
          <ArrowLeftRight className="mr-1 size-3.5 inline" />
        </Button>
      </div>

      <div className="py-9 text-center">
        <div className="flex flex-col gap-4">
          <label
            htmlFor="transfer-amount"
            className="flex w-full cursor-text flex-col items-center gap-2"
          >
            <div
              className={cn("flex max-w-full min-w-0 items-baseline justify-center", amountDisplayClass)}
              style={amountFontStyle}
            >
              <span className={cn(isEmpty && "text-mbp-placeholder")}>$</span>
              <AnimatedAmountInput
                id="transfer-amount"
                name="transfer-amount"
                placeholder="0"
                className={cn("w-auto max-w-full", amountDisplayClass)}
                isEmpty={isEmpty}
                value={amountInput}
                onChange={(event) => {
                  const formatted = formatAmountInput(event.target.value);
                  onAmountInputChange(formatted, parseAmountInput(formatted));
                }}
              />
              <span
                className={cn(
                  "p-0.5 text-[0.34em] font-mbp-emphasis",
                  isEmpty && "text-mbp-placeholder",
                )}
              >
                USD
              </span>
            </div>
            {exceeds ? (
              <span className="block text-mbp-body font-mbp-emphasis leading-tight text-mbp-danger">
                Cannot exceed {formatAmountDisplay(available)}
              </span>
            ) : (
              <span className={cn("block text-mbp-body leading-tight text-mbp-muted")}>
                {formatAmountDisplay(available)} available
              </span>
            )}
          </label>
        </div>
      </div>

      <Button
        variant="ghost"
        className={cn(
          "h-10.5 w-full rounded-mbp-surface! text-mbp-body font-mbp-emphasis transition",
          canContinue ? primaryButtonClass : "bg-mbp-disabled! text-mbp-disabled-fg!",
        )}
        disabled={!canContinue}
        onClick={onContinue}
        type="button"
      >
        Continue
      </Button>
    </>
  );
}
