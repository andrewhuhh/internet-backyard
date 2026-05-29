"use client";

import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { Counterparty, SettlementRail } from "@/lib/settlement/schema";
import { cents } from "@/lib/settlement/store";
import {
  amountFontSizeStyle,
  formatAmountDisplay,
  formatAmountInput,
  parseAmountInput,
} from "./amount-utils";
import { SELECT_ADD_RECIPIENT_VALUE, SELECT_MANAGE_RECIPIENTS_VALUE } from "./constants";
import { AnimatedAmountInput } from "./animated-amount-input";
import { MiniSelect } from "./mini-select";
import {
  amountDisplayClass,
  calendarClass,
  portalSurfaceClass,
  primaryButtonClass,
  timeToggleClass,
} from "./styles";
import type { PaymentTime } from "./types";

type AmountStepProps = {
  railId: string;
  counterpartyId: string;
  fundingSources: SettlementRail[];
  recipients: Counterparty[];
  hasVisibleRecipients: boolean;
  allRecipientsHidden: boolean;
  amountInput: string;
  amountCents: number;
  available: number;
  canContinue: boolean;
  time: PaymentTime;
  scheduledDate: Date | undefined;
  scheduleOpen: boolean;
  onRailChange: (railId: string) => void;
  onCounterpartyChange: (counterpartyId: string) => void;
  onAddRecipient: () => void;
  onManageRecipients: () => void;
  onAmountInputChange: (formatted: string, cents: number) => void;
  onTimeChange: (time: PaymentTime) => void;
  onScheduledDateChange: (date: Date) => void;
  onScheduleOpenChange: (open: boolean) => void;
  onContinue: () => void;
};

export function AmountStep({
  railId,
  counterpartyId,
  fundingSources,
  recipients,
  hasVisibleRecipients,
  allRecipientsHidden,
  amountInput,
  amountCents,
  available,
  canContinue,
  time,
  scheduledDate,
  scheduleOpen,
  onRailChange,
  onCounterpartyChange,
  onAddRecipient,
  onManageRecipients,
  onAmountInputChange,
  onTimeChange,
  onScheduledDateChange,
  onScheduleOpenChange,
  onContinue,
}: AmountStepProps) {
  const isEmpty = amountCents <= 0;
  const exceeds = available > 0 && amountCents > available;
  const amountFontStyle = amountFontSizeStyle(amountInput.length);
  const scheduledDateLabel = scheduledDate ? format(scheduledDate, "MMM d") : "Schedule";
  const recipientOptions = hasVisibleRecipients
    ? recipients.map((item) => ({
        value: item.id,
        label: item.displayName,
      }))
    : allRecipientsHidden
      ? [{ value: SELECT_MANAGE_RECIPIENTS_VALUE, label: "Manage recipients" }]
      : [{ value: SELECT_ADD_RECIPIENT_VALUE, label: "Add recipient" }];
  const recipientPlaceholder = hasVisibleRecipients
    ? "Select recipient"
    : allRecipientsHidden
      ? "Manage recipients"
      : "Add recipient";

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <MiniSelect
          label="From"
          value={railId}
          placeholder="Select source"
          onValueChange={onRailChange}
          options={fundingSources.map((item) => ({
            value: item.id,
            label: item.label,
            amount: cents(item.availableCents),
          }))}
        />
        <div className="flex min-w-0 flex-col">
          <MiniSelect
            label="To"
            value={hasVisibleRecipients ? counterpartyId : ""}
            placeholder={recipientPlaceholder}
            onValueChange={(next) => {
              if (next === SELECT_ADD_RECIPIENT_VALUE) {
                onAddRecipient();
                return;
              }
              if (next === SELECT_MANAGE_RECIPIENTS_VALUE) {
                onManageRecipients();
                return;
              }
              onCounterpartyChange(next);
            }}
            options={recipientOptions}
          />
          {hasVisibleRecipients || allRecipientsHidden ? (
            <Button
              variant="link"
              type="button"
              className={cn(
                "mt-1 h-auto self-end px-0 py-0 text-mbp-caption leading-tight text-mbp-muted transition-colors duration-mbp hover:text-mbp-fg px-2",
              )}
              onClick={onManageRecipients}
            >
              {allRecipientsHidden ? "Manage recipients" : "Add/manage"}
            </Button>
          ) : null}
        </div>
      </div>

      <div className="py-9 text-center">
        <div className="flex flex-col gap-4">
          <label
            htmlFor="modern-payment-amount"
            className="flex w-full cursor-text flex-col items-center gap-2"
          >
            <div
              className={cn("flex max-w-full min-w-0 items-baseline justify-center", amountDisplayClass)}
              style={amountFontStyle}
            >
              <span className={cn(isEmpty && "text-mbp-placeholder")}>$</span>
              <AnimatedAmountInput
                id="modern-payment-amount"
                name="modern-payment-amount"
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
              <span className="block text-mbp-body leading-tight text-mbp-muted">
                {formatAmountDisplay(available)} available
              </span>
            )}
          </label>
          <div className="flex items-center justify-center gap-2 text-mbp-caption">
            <Button
              variant={time === "instant" ? "secondary" : "ghost"}
              className={timeToggleClass}
              onClick={() => onTimeChange("instant")}
              type="button"
            >
              Instant
            </Button>
            <Popover open={scheduleOpen} onOpenChange={onScheduleOpenChange}>
              <PopoverTrigger asChild>
                <Button
                  variant={time === "schedule" ? "secondary" : "ghost"}
                  className={timeToggleClass}
                  onClick={() => onTimeChange("schedule")}
                  type="button"
                >
                  {scheduledDateLabel}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                align="center"
                side="top"
                sideOffset={10}
                className={cn(portalSurfaceClass, "w-fit! min-w-0 p-1.5!")}
              >
                <Calendar
                  mode="single"
                  className={calendarClass}
                  classNames={{
                    caption_label: "font-medium select-none text-sm text-mbp-fg",
                    weekday:
                      "flex-1 rounded-(--cell-radius) text-mbp-caption font-normal text-mbp-muted select-none",
                    today:
                      "rounded-(--cell-radius) bg-mbp-surface text-mbp-fg data-[selected=true]:rounded-none",
                    outside: "text-mbp-muted aria-selected:text-mbp-muted",
                  }}
                  selected={scheduledDate}
                  onSelect={(date) => {
                    if (!date) return;
                    onScheduledDateChange(date);
                    onTimeChange("schedule");
                    onScheduleOpenChange(false);
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>
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
