"use client";

import { useState, type ReactNode } from "react";
import { AnimatePresence } from "motion/react";
import { ArrowLeft, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { StepMotion } from "@/components/settlement/modern-bill-payment-dialog/step-motion";
import {
  captionMutedClass,
  iconButtonClass,
  mbpScrollClass,
  shellClass,
} from "@/components/settlement/modern-bill-payment-dialog/styles";
import { TransferAmountStep } from "@/components/settlement/transfer-amount-step";
import { TransferConfirmStep } from "@/components/settlement/transfer-confirm-step";
import {
  cents,
  resolveRailLabel,
  selectAccountBalanceCents,
  selectTransferableRails,
  transferRequiresApproval,
  useSettlementStore,
} from "@/lib/settlement/store";
import { cn } from "@/lib/utils";

type TransferStep = "amount" | "confirm";

function pickDestinationRailId(rails: { id: string }[], fromRailId: string) {
  return rails.find((item) => item.id !== fromRailId)?.id ?? "";
}

export type TransferMoneyDialogProps = {
  trigger?: ReactNode;
  defaultFromRailId?: string;
};

export function TransferMoneyDialog({ trigger, defaultFromRailId }: TransferMoneyDialogProps) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<TransferStep>("amount");
  const [fromRailId, setFromRailId] = useState("");
  const [toRailId, setToRailId] = useState("");
  const [amountInput, setAmountInput] = useState("");
  const [amountCents, setAmountCents] = useState(0);
  const [memo, setMemo] = useState("");
  const [noteOpen, setNoteOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const settlementState = useSettlementStore();
  const transferCredit = settlementState.transferCredit;
  const transferableRails = selectTransferableRails(settlementState);

  const balancesByRailId = Object.fromEntries(
    transferableRails.map((item) => [item.id, selectAccountBalanceCents(settlementState, item.id)]),
  );

  const fromRail = transferableRails.find((item) => item.id === fromRailId);
  const toRail = transferableRails.find((item) => item.id === toRailId);
  const needsApproval = fromRail && toRail ? transferRequiresApproval(fromRail, toRail) : false;
  const available = balancesByRailId[fromRailId] ?? 0;
  const isEmpty = amountCents <= 0;
  const exceeds = available > 0 && amountCents > available;
  const canContinue =
    Boolean(fromRail && toRail && fromRailId !== toRailId && !isEmpty && !exceeds);

  function resetForm(nextFromRailId?: string) {
    const from = nextFromRailId ?? defaultFromRailId ?? transferableRails[0]?.id ?? "";
    setFromRailId(from);
    setToRailId(pickDestinationRailId(transferableRails, from));
    setAmountInput("");
    setAmountCents(0);
    setMemo("");
    setNoteOpen(false);
    setStep("amount");
  }

  function handleFromChange(nextFromId: string) {
    setFromRailId(nextFromId);
    if (nextFromId === toRailId) {
      setToRailId(pickDestinationRailId(transferableRails, nextFromId));
    }
  }

  function handleToChange(nextToId: string) {
    setToRailId(nextToId);
    if (nextToId === fromRailId) {
      setFromRailId(pickDestinationRailId(transferableRails, nextToId));
    }
  }

  function swapAccounts() {
    if (!fromRailId || !toRailId) return;
    setFromRailId(toRailId);
    setToRailId(fromRailId);
  }

  async function confirmTransfer() {
    if (isSubmitting || !canContinue) return;

    setIsSubmitting(true);
    const toastId = toast.loading("Transferring credit…");

    try {
      const result = await transferCredit({
        fromRailId,
        toRailId,
        amountCents,
        memo,
      });

      if (result.ok) {
        const destination = resolveRailLabel(useSettlementStore.getState(), toRailId);
        if (result.transfer.status === "awaiting_approval") {
          toast.success("Transfer submitted for approval", {
            id: toastId,
            description: `${cents(amountCents)} to ${destination} is awaiting approval`,
          });
        } else {
          toast.success("Transfer complete", {
            id: toastId,
            description: `${cents(amountCents)} moved to ${destination}`,
          });
        }
        setOpen(false);
        return;
      }

      toast.error("Transfer failed", {
        id: toastId,
        description: result.message,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  function goBack() {
    if (step === "confirm") {
      setStep("amount");
      return;
    }
    setOpen(false);
  }

  const headerTitle = step === "confirm" ? "Confirmation" : "Transfer money";
  const canOpen = transferableRails.length >= 2;

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (nextOpen) {
          if (!canOpen) return;
          resetForm(defaultFromRailId);
        }
        setOpen(nextOpen && canOpen);
      }}
    >
      <DialogTrigger asChild disabled={!canOpen}>
        {trigger ?? (
          <Button variant="outline" className="h-12 rounded-lg px-8 text-base" disabled={!canOpen}>
            Transfer money
          </Button>
        )}
      </DialogTrigger>
      <DialogContent showCloseButton={false} className={shellClass}>
        <DialogTitle className="sr-only">{headerTitle}</DialogTitle>
        <div className={cn("flex h-12 shrink-0 items-center justify-between px-4 pt-2", captionMutedClass)}>
          <Button
            variant="link"
            className={iconButtonClass}
            onClick={goBack}
            type="button"
            aria-label={step === "amount" ? "Close transfer" : "Back to transfer"}
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div className="text-mbp-body">{headerTitle}</div>
          <Button
            variant="link"
            className={iconButtonClass}
            onClick={() => setOpen(false)}
            type="button"
            aria-label="Close"
          >
            <X className="size-4" />
          </Button>
        </div>

        <div className={cn(mbpScrollClass, "flex-1 px-4 pb-4")}>
          <AnimatePresence mode="popLayout">
            {step === "amount" ? (
              <StepMotion step="amount">
                <TransferAmountStep
                  fromRailId={fromRailId}
                  toRailId={toRailId}
                  transferableRails={transferableRails}
                  balancesByRailId={balancesByRailId}
                  amountInput={amountInput}
                  amountCents={amountCents}
                  available={available}
                  canContinue={canContinue}
                  onFromChange={handleFromChange}
                  onToChange={handleToChange}
                  onSwap={swapAccounts}
                  onAmountInputChange={(formatted, nextCents) => {
                    setAmountInput(formatted);
                    setAmountCents(nextCents);
                  }}
                  onContinue={() => setStep("confirm")}
                />
              </StepMotion>
            ) : (
              <StepMotion step="confirm">
                <TransferConfirmStep
                  amountCents={amountCents}
                  amountInputLength={amountInput.length}
                  fromRail={fromRail}
                  toRail={toRail}
                  needsApproval={needsApproval}
                  memo={memo}
                  noteOpen={noteOpen}
                  isSubmitting={isSubmitting}
                  onNoteOpenChange={setNoteOpen}
                  onMemoChange={setMemo}
                  onSubmit={() => {
                    void confirmTransfer();
                  }}
                />
              </StepMotion>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
