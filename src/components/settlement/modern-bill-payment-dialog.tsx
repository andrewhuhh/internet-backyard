"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, CheckCircle2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  cents,
  selectAvailableCounterparties,
  selectAvailableRails,
  selectResolvedDependencies,
  useSettlementStore,
} from "@/lib/settlement/store";

type ModernStep = "amount" | "confirm";
type PaymentTime = "instant" | "schedule";

const motionTransition = { type: "spring", stiffness: 520, damping: 44, mass: 0.7 } as const;

export function ModernBillPaymentDialog() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<ModernStep>("amount");
  const [time, setTime] = useState<PaymentTime>("instant");
  const [scheduledDate, setScheduledDate] = useState("2026-05-29");
  const state = useSettlementStore();
  const recipients = selectAvailableCounterparties(state);
  const fundingSources = selectAvailableRails(state);
  const { counterparty, rail } = selectResolvedDependencies(state);
  const available = rail?.availableCents ?? 0;
  const amount = state.draft.amountCents;
  const isEmpty = amount <= 0;
  const exceeds = available > 0 && amount > available;
  const canContinue = Boolean(counterparty && rail && !isEmpty && !exceeds);
  const amountTextSize = useMemo(() => {
    return sizeByCharacterCount(Math.max(1, Math.floor(amount / 100).toString().length), {
      base: "modern-payment-amount-lg",
      medium: "modern-payment-amount-md",
      small: "modern-payment-amount-sm",
      smallest: "modern-payment-amount-xs",
    });
  }, [amount]);
  const amountDisplay = amount > 0 ? (amount / 100).toLocaleString("en-US", { maximumFractionDigits: 2 }) : "0";
  const amountInputWidth = `${Math.max(1, amountDisplay.length) + 0.5}ch`;

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (nextOpen) {
          state.updateDraft({ amountCents: 0 });
          setStep("amount");
          setTime("instant");
        }
        setOpen(nextOpen);
      }}
    >
      <DialogTrigger asChild>
        <Button className="h-10 rounded-lg px-4">Modern bill payment</Button>
      </DialogTrigger>
      <DialogContent
        showCloseButton={false}
        className="modern-payment-dialog p-0 shadow-2xl sm:max-w-none"
      >
        <DialogTitle className="sr-only">{step === "confirm" ? "Confirmation" : "Bill payment"}</DialogTitle>
        <div className="modern-payment-header">
          <Button
            variant="link"
            className="modern-payment-icon-button"
            onClick={() => (step === "confirm" ? setStep("amount") : setOpen(false))}
            type="button"
            aria-label={step === "confirm" ? "Back to amount" : "Close bill payment"}
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div className="modern-payment-title">{step === "confirm" ? "Confirmation" : "Bill payment"}</div>
          <Button
            variant="link"
            className="modern-payment-icon-button"
            onClick={() => setOpen(false)}
            type="button"
            aria-label="Close"
          >
            <X className="size-4" />
          </Button>
        </div>

        <div className="modern-payment-body">
          <AnimatePresence mode="popLayout">
            {step === "amount" ? (
              <motion.div
                className="modern-payment-animated-panel"
                key="amount"
                initial={{ opacity: 0, x: -14, filter: "blur(2px)" }}
                animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, x: -14, filter: "blur(2px)" }}
                transition={motionTransition}
              >
                <div className="modern-payment-grid">
                  <MiniSelect
                    label="From"
                    value={state.draft.railId}
                    placeholder="Add source"
                    onValueChange={(railId) => state.updateDraft({ railId })}
                    options={fundingSources.map((item) => ({
                      value: item.id,
                      label: item.label,
                      meta: cents(item.availableCents),
                    }))}
                  />
                  <MiniSelect
                    label="To"
                    value={state.draft.counterpartyId}
                    placeholder="Add recipient"
                    onValueChange={(counterpartyId) => state.updateDraft({ counterpartyId })}
                    verified
                    options={recipients.map((item) => ({
                      value: item.id,
                      label: item.displayName,
                      meta: item.status.replaceAll("_", " "),
                    }))}
                  />
                </div>

                <div className="modern-payment-amount-section">
                  <label className="sr-only" htmlFor="modern-payment-amount">
                    Amount
                  </label>
                  <div className={cn("modern-payment-amount-row", amountTextSize)}>
                    <span className={cn(isEmpty && "modern-payment-empty")}>$</span>
                    <input
                      id="modern-payment-amount"
                      name="modern-payment-amount"
                      aria-label="Payment amount"
                      className={cn("modern-payment-amount-input", isEmpty && "modern-payment-empty")}
                      inputMode="decimal"
                      style={{ width: amountInputWidth }}
                      value={amountDisplay}
                      onChange={(event) => {
                        const numeric = Number(event.target.value.replace(/,/g, ""));
                        state.updateDraft({ amountCents: Number.isFinite(numeric) ? Math.round(numeric * 100) : 0 });
                      }}
                    />
                    <span className="modern-payment-currency">USD</span>
                  </div>
                  {exceeds ? (
                    <p className="modern-payment-meta mt-3 text-(--mp-danger)">Cannot exceed {cents(available)}</p>
                  ) : (
                    <p className="modern-payment-meta mt-3">{cents(available)} available</p>
                  )}
                  <div className="modern-payment-time-toggle mt-4">
                    <Button
                      variant={time === "instant" ? "secondary" : "link"}
                      className="modern-payment-pill"
                      onClick={() => setTime("instant")}
                      type="button"
                    >
                      Instant
                    </Button>
                    <Button
                      variant={time === "schedule" ? "secondary" : "link"}
                      className="modern-payment-pill"
                      onClick={() => setTime("schedule")}
                      type="button"
                    >
                      Schedule
                    </Button>
                  </div>
                  {time === "schedule" && (
                    <input
                      aria-label="Scheduled payment date"
                      className="modern-payment-date modern-payment-meta mx-auto mt-3"
                      name="modern-payment-scheduled-date"
                      onChange={(event) => setScheduledDate(event.target.value)}
                      type="date"
                      value={scheduledDate}
                    />
                  )}
                </div>

                <Button
                  className={cn(
                    "modern-payment-button w-full transition",
                    canContinue
                      ? "modern-payment-primary"
                      : "modern-payment-disabled",
                  )}
                  disabled={!canContinue}
                  onClick={() => setStep("confirm")}
                  type="button"
                >
                  Continue
                </Button>
              </motion.div>
            ) : (
              <motion.div
                className="modern-payment-animated-panel"
                key="confirm"
                initial={{ opacity: 0, x: 18, filter: "blur(2px)" }}
                animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, x: 18, filter: "blur(2px)" }}
                transition={motionTransition}
              >
                <div className="modern-payment-confirm-head">
                  <div className="modern-payment-confirm-amount">
                    {cents(amount)}
                    <span className="modern-payment-confirm-currency">USD</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <ConfirmRow label="From" value={rail?.label ?? "Credit pool"} />
                  <ConfirmRow label="To" value={counterparty?.displayName ?? "Nova Foundry"} verified />
                  <ConfirmRow label="Time" value={time === "instant" ? "Instant" : scheduledDate} />
                </div>
                <Button variant="link" className="modern-payment-note-action" type="button">
                  + Add a private note
                </Button>
                <Button
                  className="modern-payment-button modern-payment-primary mt-5 w-full transition"
                  onClick={() => {
                    void state.submit();
                    setOpen(false);
                  }}
                  type="button"
                >
                  Submit
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function MiniSelect({
  label,
  value,
  placeholder,
  options,
  onValueChange,
  verified = false,
}: {
  label: string;
  value: string;
  placeholder: string;
  options: Array<{ value: string; label: string; meta?: string }>;
  onValueChange: (value: string) => void;
  verified?: boolean;
}) {
  const selected = options.find((item) => item.value === value);
  const displayLabel = selected?.label ?? placeholder;
  const labelSize = sizeByCharacterCount(displayLabel.length, {
    base: "text-(length:--mp-text-lg)",
    medium: "text-(length:--mp-text-md)",
    small: "text-(length:--mp-text-sm)",
    smallest: "text-(length:--mp-text-xs)",
  });
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="modern-payment-select-trigger w-full">
        <span className="min-w-0">
          <span className="modern-payment-label block">{label}</span>
          <span className={cn("modern-payment-value modern-payment-select-value-row", labelSize)}>
            <span className="modern-payment-select-value-text">
              <SelectValue placeholder={placeholder}>{displayLabel}</SelectValue>
            </span>
            {verified && selected && <CheckCircle2 className="modern-payment-inline-icon shrink-0" />}
          </span>
        </span>
      </SelectTrigger>
      <SelectContent align="start" className="modern-payment-popover">
        {options.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            <span className="modern-payment-option-row">
              <span>{item.label}</span>
              {item.meta && <span className="modern-payment-meta">{item.meta}</span>}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function sizeByCharacterCount(
  count: number,
  sizes: { base: string; medium: string; small: string; smallest: string },
) {
  if (count > 10) return sizes.smallest;
  if (count > 8) return sizes.small;
  if (count > 6) return sizes.medium;
  return sizes.base;
}

function ConfirmRow({ label, value, verified = false }: { label: string; value: string; verified?: boolean }) {
  return (
    <div className="modern-payment-row flex items-center justify-between">
      <span className="modern-payment-meta">{label}</span>
      <span className="modern-payment-value modern-payment-select-value-row truncate">
        {value}
        {verified && <CheckCircle2 className="modern-payment-inline-icon" />}
      </span>
    </div>
  );
}
