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
    const digits = Math.max(1, Math.floor(amount / 100).toString().length);
    if (digits >= 8) return "text-[1.7rem]";
    if (digits >= 6) return "text-[2rem]";
    if (digits >= 5) return "text-[2.35rem]";
    return "text-[2.7rem]";
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
        className="w-[360px] overflow-hidden rounded-[18px] border border-white/8 bg-[#1c1c1c] p-0 text-white shadow-2xl sm:max-w-none"
      >
        <DialogTitle className="sr-only">{step === "confirm" ? "Confirmation" : "Bill payment"}</DialogTitle>
        <div className="flex h-11 items-center justify-between px-4 pt-2 text-[#a4a4a4]">
          <button
            className="grid size-6 place-items-center rounded-full text-[#9c9c9c] transition hover:text-white"
            onClick={() => (step === "confirm" ? setStep("amount") : setOpen(false))}
            type="button"
            aria-label={step === "confirm" ? "Back to amount" : "Close bill payment"}
          >
            <ArrowLeft className="size-3.5" />
          </button>
          <div className="text-[12px]">{step === "confirm" ? "Confirmation" : "Bill payment"}</div>
          <button
            className="grid size-6 place-items-center rounded-full text-[#d7d7d7] transition hover:text-white"
            onClick={() => setOpen(false)}
            type="button"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="px-4 pb-4 pt-2">
          <AnimatePresence mode="popLayout">
            {step === "amount" ? (
              <motion.div
                key="amount"
                initial={{ opacity: 0, x: -14, filter: "blur(2px)" }}
                animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, x: -14, filter: "blur(2px)" }}
                transition={motionTransition}
              >
                <div className="grid grid-cols-2 gap-3">
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

                <div className="py-9 text-center">
                  <label className="sr-only" htmlFor="modern-payment-amount">
                    Amount
                  </label>
                  <div className={cn("mx-auto flex max-w-full items-baseline justify-center gap-2 font-semibold tracking-tight", amountTextSize)}>
                    <span className={cn(isEmpty && "text-[#7f7f7f]")}>$</span>
                    <input
                      id="modern-payment-amount"
                      name="modern-payment-amount"
                      aria-label="Payment amount"
                      className={cn("min-w-[1ch] max-w-[9ch] bg-transparent text-center font-semibold tracking-tight outline-none", isEmpty && "text-[#7f7f7f]")}
                      inputMode="decimal"
                      style={{ width: amountInputWidth }}
                      value={amountDisplay}
                      onChange={(event) => {
                        const numeric = Number(event.target.value.replace(/,/g, ""));
                        state.updateDraft({ amountCents: Number.isFinite(numeric) ? Math.round(numeric * 100) : 0 });
                      }}
                    />
                    <span className="text-[0.34em] font-semibold text-white">USD</span>
                  </div>
                  {exceeds ? (
                    <p className="mt-3 text-[13px] text-[#ff4040]">Cannot exceed {cents(available)}</p>
                  ) : (
                    <p className="mt-3 text-[13px] text-[#858585]">{cents(available)} available</p>
                  )}
                  <div className="mt-4 flex items-center justify-center gap-2 text-[12px]">
                    <button
                      className={cn(
                        "rounded-full px-2.5 py-1 font-semibold transition",
                        time === "instant" ? "bg-[#666] text-white" : "text-[#8f8f8f] hover:text-white",
                      )}
                      onClick={() => setTime("instant")}
                      type="button"
                    >
                      Instant
                    </button>
                    <button
                      className={cn(
                        "rounded-full px-2.5 py-1 font-semibold transition",
                        time === "schedule" ? "bg-[#666] text-white" : "text-[#8f8f8f] hover:text-white",
                      )}
                      onClick={() => setTime("schedule")}
                      type="button"
                    >
                      Schedule
                    </button>
                  </div>
                  {time === "schedule" && (
                    <input
                      aria-label="Scheduled payment date"
                      className="mx-auto mt-3 h-8 rounded-lg border border-white/10 bg-[#262626] px-3 text-[13px] text-white outline-none [color-scheme:dark]"
                      name="modern-payment-scheduled-date"
                      onChange={(event) => setScheduledDate(event.target.value)}
                      type="date"
                      value={scheduledDate}
                    />
                  )}
                </div>

                <button
                  className={cn(
                    "h-10 w-full rounded-xl text-[13px] font-semibold transition",
                    canContinue
                      ? "bg-white text-black hover:bg-[#e8e8e8]"
                      : "bg-[#292929] text-[#5e5e5e]",
                  )}
                  disabled={!canContinue}
                  onClick={() => setStep("confirm")}
                  type="button"
                >
                  Continue
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="confirm"
                initial={{ opacity: 0, x: 18, filter: "blur(2px)" }}
                animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, x: 18, filter: "blur(2px)" }}
                transition={motionTransition}
              >
                <div className="pb-5 pt-4 text-center">
                  <div className="text-3xl font-semibold tracking-tight">
                    {cents(amount)}
                    <span className="ml-1 text-xs">USD</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <ConfirmRow label="From" value={rail?.label ?? "Credit pool"} />
                  <ConfirmRow label="To" value={counterparty?.displayName ?? "Nova Foundry"} verified />
                  <ConfirmRow label="Time" value={time === "instant" ? "Instant" : scheduledDate} />
                </div>
                <button className="mx-auto mt-3 block text-[12px] text-[#8c8c8c]" type="button">
                  + Add a private note
                </button>
                <button
                  className="mt-5 h-10 w-full rounded-xl bg-white text-[13px] font-semibold text-black transition hover:bg-[#e8e8e8]"
                  onClick={() => {
                    void state.submit();
                    setOpen(false);
                  }}
                  type="button"
                >
                  Submit
                </button>
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
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="h-auto w-full rounded-xl border-0 bg-[#262626] px-3 py-2 text-left hover:bg-[#2b2b2b]">
        <span className="min-w-0">
          <span className="block text-[11px] text-[#8c8c8c]">{label}</span>
          <span className="mt-1 flex items-center gap-1 truncate text-[13px] font-semibold text-white">
            <SelectValue placeholder={placeholder}>{selected?.label}</SelectValue>
            {verified && selected && <CheckCircle2 className="size-3.5 shrink-0 text-[#a6a6a6]" />}
          </span>
        </span>
      </SelectTrigger>
      <SelectContent className="border-white/10 bg-[#242424] text-white">
        {options.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            <span className="flex w-full items-center justify-between gap-4">
              <span>{item.label}</span>
              {item.meta && <span className="text-[12px] text-[#9a9a9a]">{item.meta}</span>}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function ConfirmRow({ label, value, verified = false }: { label: string; value: string; verified?: boolean }) {
  return (
    <div className="flex h-9 items-center justify-between rounded-lg bg-[#262626] px-3">
      <span className="text-[12px] text-[#898989]">{label}</span>
      <span className="flex items-center gap-1 truncate text-[12px] font-semibold">
        {value}
        {verified && <CheckCircle2 className="size-3.5 text-[#a6a6a6]" />}
      </span>
    </div>
  );
}
