"use client";

import { useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { AnimatePresence } from "motion/react";
import { ArrowLeft, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { Counterparty } from "@/lib/settlement/schema";
import {
  cents,
  selectAvailableCounterparties,
  selectAvailableRails,
  selectResolvedDependencies,
  useSettlementStore,
} from "@/lib/settlement/store";
import { cn } from "@/lib/utils";
import { AddRecipientStep } from "./add-recipient-step";
import { AmountStep } from "./amount-step";
import { ConfirmStep } from "./confirm-step";
import {
  addRecipientInputSchema,
  DEFAULT_ADD_RECIPIENT_SECTIONS,
  EMPTY_ADD_RECIPIENT_FORM,
} from "./constants";
import { ManageRecipientsStep } from "./manage-recipients-step";
import {
  bankSectionHasError,
  recipientFormFromCounterparty,
  settlementSectionHasError,
  vendorSectionHasError,
} from "./recipient-utils";
import { StepMotion } from "./step-motion";
import {
  captionMutedClass,
  iconButtonClass,
  mbpScrollClass,
  shellClass,
} from "./styles";
import type {
  AddRecipientErrors,
  AddRecipientFieldKey,
  AddRecipientReturnStep,
  BankAccountFormField,
  ModernStep,
  PaymentTime,
} from "./types";

export function ModernBillPaymentDialog() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<ModernStep>("amount");
  const [time, setTime] = useState<PaymentTime>("instant");
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>(new Date(2026, 4, 29));
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [addRecipientForm, setAddRecipientForm] = useState(EMPTY_ADD_RECIPIENT_FORM);
  const [addRecipientErrors, setAddRecipientErrors] = useState<AddRecipientErrors>({});
  const [addRecipientSections, setAddRecipientSections] = useState(DEFAULT_ADD_RECIPIENT_SECTIONS);
  const [addRecipientReturnStep, setAddRecipientReturnStep] = useState<AddRecipientReturnStep>("amount");
  const [editingRecipientId, setEditingRecipientId] = useState<string | null>(null);
  const [pendingRemoveId, setPendingRemoveId] = useState<string | null>(null);
  const [amountInput, setAmountInput] = useState("");
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  const state = useSettlementStore();
  const recipients = selectAvailableCounterparties(state);
  const hasRecipients = recipients.length > 0;
  const fundingSources = selectAvailableRails(state);
  const { counterparty, rail } = selectResolvedDependencies(state);
  const available = rail?.availableCents ?? 0;
  const amount = state.draft.amountCents;
  const isEmpty = amount <= 0;
  const exceeds = available > 0 && amount > available;
  const canContinue = Boolean(counterparty && rail && !isEmpty && !exceeds);
  const scheduledDateLabel = scheduledDate ? format(scheduledDate, "MMM d") : "Schedule";

  function openManageRecipients() {
    setPendingRemoveId(null);
    setStep("manageRecipients");
  }

  function openAddRecipient(returnStep: AddRecipientReturnStep) {
    setAddRecipientForm(EMPTY_ADD_RECIPIENT_FORM);
    setAddRecipientErrors({});
    setAddRecipientSections({ ...DEFAULT_ADD_RECIPIENT_SECTIONS });
    setAddRecipientReturnStep(returnStep);
    setEditingRecipientId(null);
    setPendingRemoveId(null);
    setStep("addRecipient");
  }

  function openEditRecipient(recipient: Counterparty, returnStep: AddRecipientReturnStep) {
    setAddRecipientForm(recipientFormFromCounterparty(recipient));
    setAddRecipientErrors({});
    setAddRecipientSections({
      vendor: true,
      settlement: true,
      bank: Boolean(recipient.bankAccount),
    });
    setAddRecipientReturnStep(returnStep);
    setEditingRecipientId(recipient.id);
    setPendingRemoveId(null);
    setStep("addRecipient");
  }

  function confirmSaveRecipient() {
    const parsed = addRecipientInputSchema.safeParse({
      displayName: addRecipientForm.displayName.trim(),
      type: addRecipientForm.type,
      network: addRecipientForm.network,
      externalRef: addRecipientForm.externalRef.trim(),
      bankAccount: {
        bankName: addRecipientForm.bankAccount.bankName.trim(),
        routingNumber: addRecipientForm.bankAccount.routingNumber.trim(),
        accountNumber: addRecipientForm.bankAccount.accountNumber.trim(),
        accountType: addRecipientForm.bankAccount.accountType,
      },
    });

    if (!parsed.success) {
      const nextErrors: AddRecipientErrors = {};
      for (const issue of parsed.error.issues) {
        const [root, nested] = issue.path;
        if (root === "bankAccount" && typeof nested === "string") {
          const field = nested as BankAccountFormField;
          nextErrors.bankAccount ??= {};
          if (!nextErrors.bankAccount[field]) {
            nextErrors.bankAccount[field] = issue.message;
          }
          continue;
        }
        if (typeof root === "string" && root !== "bankAccount") {
          const field = root as AddRecipientFieldKey;
          if (!nextErrors[field]) {
            nextErrors[field] = issue.message;
          }
        }
      }
      setAddRecipientErrors(nextErrors);
      setAddRecipientSections((current) => ({
        vendor: current.vendor || vendorSectionHasError(nextErrors),
        settlement: current.settlement || settlementSectionHasError(nextErrors),
        bank: current.bank || bankSectionHasError(nextErrors),
      }));
      toast.error("Couldn't save recipient", {
        description: "Check the highlighted fields and try again.",
      });
      return;
    }

    const savedName = parsed.data.displayName;
    if (editingRecipientId) {
      state.updateCounterparty(editingRecipientId, parsed.data);
      toast.success("Recipient updated", { description: savedName });
    } else {
      state.addCounterparty(parsed.data);
      toast.success("Recipient added", { description: savedName });
    }
    setAddRecipientForm(EMPTY_ADD_RECIPIENT_FORM);
    setAddRecipientErrors({});
    setEditingRecipientId(null);
    setPendingRemoveId(null);
    setStep(addRecipientReturnStep);
  }

  function confirmRemoveRecipient(id: string) {
    const removed = recipients.find((recipient) => recipient.id === id);
    state.removeCounterparty(id);
    setPendingRemoveId(null);
    toast.success("Recipient removed", {
      description: removed?.displayName,
    });
  }

  async function confirmPayment() {
    if (isSubmittingPayment) {
      return;
    }

    setIsSubmittingPayment(true);
    const toastId = toast.loading("Submitting bill payment…");

    try {
      await state.submit();
      const result = useSettlementStore.getState();

      if (result.step === "success") {
        const payee = counterparty?.displayName ?? "recipient";
        toast.success("Payment submitted", {
          id: toastId,
          description: `${cents(amount)} sent to ${payee}`,
        });
        setOpen(false);
        return;
      }

      toast.error("Payment failed", {
        id: toastId,
        description: result.lastError ?? "Something went wrong. Try again.",
      });
    } finally {
      setIsSubmittingPayment(false);
    }
  }

  function goBack() {
    if (step === "addRecipient") {
      setAddRecipientErrors({});
      setEditingRecipientId(null);
      setPendingRemoveId(null);
      setStep(addRecipientReturnStep);
      return;
    }
    if (step === "confirm" || step === "manageRecipients") {
      setPendingRemoveId(null);
      setStep("amount");
      return;
    }
    setOpen(false);
  }

  const headerTitle =
    step === "confirm"
      ? "Confirmation"
      : step === "manageRecipients"
        ? "Manage recipients"
        : step === "addRecipient"
          ? editingRecipientId
            ? "Edit recipient"
            : "Add recipient"
          : "Bill payment";

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (nextOpen) {
          state.updateDraft({ amountCents: 0 });
          setAmountInput("");
          setStep("amount");
          setTime("instant");
          setScheduleOpen(false);
        }
        setOpen(nextOpen);
      }}
    >
      <DialogTrigger asChild>
        <Button className="h-12 rounded-lg px-8 text-base">Pay a bill</Button>
      </DialogTrigger>
      <DialogContent showCloseButton={false} className={shellClass}>
        <DialogTitle className="sr-only">{headerTitle}</DialogTitle>
        <div className={cn("flex h-12 shrink-0 items-center justify-between px-4 pt-2", captionMutedClass)}>
          <Button
            variant="link"
            className={iconButtonClass}
            onClick={goBack}
            type="button"
            aria-label={step === "amount" ? "Close bill payment" : "Back to bill payment"}
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

        <div className={cn(mbpScrollClass, "flex-1 px-4 pb-4 pt-2")}>
          <AnimatePresence mode="popLayout">
            {step === "amount" ? (
              <StepMotion step="amount">
                <AmountStep
                  railId={state.draft.railId}
                  counterpartyId={state.draft.counterpartyId}
                  fundingSources={fundingSources}
                  recipients={recipients}
                  hasRecipients={hasRecipients}
                  amountInput={amountInput}
                  amountCents={amount}
                  available={available}
                  canContinue={canContinue}
                  time={time}
                  scheduledDate={scheduledDate}
                  scheduleOpen={scheduleOpen}
                  onRailChange={(railId) => state.updateDraft({ railId })}
                  onCounterpartyChange={(counterpartyId) => state.updateDraft({ counterpartyId })}
                  onAddRecipient={() => openAddRecipient("amount")}
                  onManageRecipients={openManageRecipients}
                  onAmountInputChange={(formatted, amountCents) => {
                    setAmountInput(formatted);
                    state.updateDraft({ amountCents });
                  }}
                  onTimeChange={setTime}
                  onScheduledDateChange={setScheduledDate}
                  onScheduleOpenChange={setScheduleOpen}
                  onContinue={() => setStep("confirm")}
                />
              </StepMotion>
            ) : step === "manageRecipients" ? (
              <StepMotion step="manageRecipients">
                <ManageRecipientsStep
                  recipients={recipients}
                  pendingRemoveId={pendingRemoveId}
                  onEdit={(recipient) => openEditRecipient(recipient, "manageRecipients")}
                  onRequestRemove={setPendingRemoveId}
                  onCancelRemove={() => setPendingRemoveId(null)}
                  onConfirmRemove={confirmRemoveRecipient}
                  onAddRecipient={() => openAddRecipient("manageRecipients")}
                />
              </StepMotion>
            ) : step === "addRecipient" ? (
              <StepMotion step="addRecipient" className="flex flex-col will-change-[transform,opacity,filter]">
                <AddRecipientStep
                  form={addRecipientForm}
                  errors={addRecipientErrors}
                  sections={addRecipientSections}
                  editingRecipientId={editingRecipientId}
                  onFormChange={setAddRecipientForm}
                  onErrorsChange={setAddRecipientErrors}
                  onSectionsChange={setAddRecipientSections}
                  onSave={confirmSaveRecipient}
                />
              </StepMotion>
            ) : (
              <StepMotion step="confirm">
                <ConfirmStep
                  amountCents={amount}
                  amountInputLength={amountInput.length}
                  rail={rail}
                  counterparty={counterparty}
                  time={time}
                  scheduledDateLabel={scheduledDateLabel}
                  isSubmitting={isSubmittingPayment}
                  onSubmit={() => {
                    void confirmPayment();
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
