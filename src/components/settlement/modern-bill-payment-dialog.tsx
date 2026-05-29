"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, CheckCircle2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import {
  cents,
  selectAvailableCounterparties,
  selectAvailableRails,
  selectResolvedDependencies,
  useSettlementStore,
} from "@/lib/settlement/store";

type ModernStep = "amount" | "confirm";

const motionTransition = { type: "spring", stiffness: 520, damping: 44, mass: 0.7 } as const;

export function ModernBillPaymentDialog() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<ModernStep>("amount");
  const state = useSettlementStore();
  const recipients = selectAvailableCounterparties(state);
  const fundingSources = selectAvailableRails(state);
  const { counterparty, rail } = selectResolvedDependencies(state);
  const available = rail?.availableCents ?? 0;
  const amount = state.draft.amountCents;
  const isEmpty = amount <= 0;
  const exceeds = available > 0 && amount > available;
  const canContinue = Boolean(counterparty && rail && !isEmpty && !exceeds);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="h-10 rounded-lg px-4">Modern bill payment</Button>
      </DialogTrigger>
      <DialogContent
        showCloseButton={false}
        className="w-[320px] overflow-hidden rounded-[18px] border border-white/8 bg-[#1c1c1c] p-0 text-white shadow-2xl sm:max-w-none"
      >
        <DialogTitle className="sr-only">{step === "confirm" ? "Confirmation" : "Bill payment"}</DialogTitle>
        <div className="flex h-10 items-center justify-between px-4 pt-2 text-[#a4a4a4]">
          <button
            className="grid size-6 place-items-center rounded-full text-[#9c9c9c] transition hover:text-white"
            onClick={() => (step === "confirm" ? setStep("amount") : setOpen(false))}
            type="button"
            aria-label={step === "confirm" ? "Back to amount" : "Close bill payment"}
          >
            <ArrowLeft className="size-3.5" />
          </button>
          <div className="text-[11px]">{step === "confirm" ? "Confirmation" : "Bill payment"}</div>
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
                  <MiniSelector label="From" value={rail?.label ?? fundingSources[0]?.label ?? "Add source"} />
                  <MiniSelector label="To" value={counterparty?.displayName ?? recipients[0]?.displayName ?? "Add recipient"} verified />
                </div>

                <div className="py-8 text-center">
                  <label className="sr-only" htmlFor="modern-payment-amount">
                    Amount
                  </label>
                  <div className="flex items-baseline justify-center gap-2">
                    <span className={cn("text-4xl font-semibold tracking-tight", isEmpty && "text-[#7f7f7f]")}>$</span>
                    <input
                      id="modern-payment-amount"
                      name="modern-payment-amount"
                      aria-label="Payment amount"
                      className={cn(
                        "w-[150px] bg-transparent text-center text-4xl font-semibold tracking-tight outline-none",
                        isEmpty && "text-[#7f7f7f]",
                      )}
                      inputMode="decimal"
                      value={amount > 0 ? (amount / 100).toLocaleString("en-US", { maximumFractionDigits: 2 }) : "0"}
                      onChange={(event) => {
                        const numeric = Number(event.target.value.replace(/,/g, ""));
                        state.updateDraft({ amountCents: Number.isFinite(numeric) ? Math.round(numeric * 100) : 0 });
                      }}
                    />
                    <span className="text-sm font-semibold text-white">USD</span>
                  </div>
                  {exceeds ? (
                    <p className="mt-3 text-[12px] text-[#ff4040]">Cannot exceed {cents(available)}</p>
                  ) : (
                    <p className="mt-3 text-[12px] text-[#858585]">{cents(available)} available</p>
                  )}
                  <div className="mt-4 flex items-center justify-center gap-2 text-[11px]">
                    <span className="rounded-full bg-[#666] px-2 py-0.5 font-semibold text-white">Instant</span>
                    <span className="text-[#8f8f8f]">Schedule</span>
                  </div>
                </div>

                <button
                  className={cn(
                    "h-9 w-full rounded-xl text-[12px] font-semibold transition",
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
                  <ConfirmRow label="Time" value="Instant" />
                </div>
                <button className="mx-auto mt-3 block text-[11px] text-[#8c8c8c]" type="button">
                  + Add a private note
                </button>
                <button
                  className="mt-5 h-9 w-full rounded-xl bg-white text-[12px] font-semibold text-black transition hover:bg-[#e8e8e8]"
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

function MiniSelector({ label, value, verified = false }: { label: string; value: string; verified?: boolean }) {
  return (
    <div className="rounded-xl bg-[#262626] px-3 py-2">
      <div className="text-[10px] text-[#8c8c8c]">{label}</div>
      <div className="mt-1 flex items-center gap-1 truncate text-[12px] font-semibold">
        <span className="truncate">{value}</span>
        {verified && <CheckCircle2 className="size-3 shrink-0 text-[#a6a6a6]" />}
      </div>
    </div>
  );
}

function ConfirmRow({ label, value, verified = false }: { label: string; value: string; verified?: boolean }) {
  return (
    <div className="flex h-8 items-center justify-between rounded-lg bg-[#262626] px-3">
      <span className="text-[11px] text-[#898989]">{label}</span>
      <span className="flex items-center gap-1 truncate text-[11px] font-semibold">
        {value}
        {verified && <CheckCircle2 className="size-3 text-[#a6a6a6]" />}
      </span>
    </div>
  );
}
