"use client";

import { useState, type HTMLAttributes, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { format } from "date-fns";
import { ArrowLeft, BadgeCheck, Ban, ChevronDown, CircleAlert, Clock, Pencil, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  BANK_ACCOUNT_TYPE_OPTIONS,
  formatBankAccountDetail,
} from "@/lib/settlement/bank-account";
import {
  SETTLEMENT_NETWORK_OPTIONS,
} from "@/lib/settlement/settlement-networks";
import {
  counterpartyBankAccountSchema,
  counterpartySchema,
  counterpartyTypeSchema,
  type BankAccountType,
  type Counterparty,
  type CounterpartyType,
  type SettlementNetwork,
} from "@/lib/settlement/schema";
import {
  cents,
  selectAvailableCounterparties,
  selectAvailableRails,
  selectResolvedDependencies,
  useSettlementStore,
} from "@/lib/settlement/store";

type ModernStep = "amount" | "confirm" | "manageRecipients" | "addRecipient";
type AddRecipientReturnStep = "amount" | "manageRecipients";
type PaymentTime = "instant" | "schedule";

const SELECT_ADD_RECIPIENT_VALUE = "__add_recipient__";

const MAX_AMOUNT_CENTS = 99_999_999_999_999;

const addRecipientInputSchema = counterpartySchema
  .pick({
    displayName: true,
    type: true,
    network: true,
    externalRef: true,
  })
  .extend({
    bankAccount: counterpartyBankAccountSchema,
  });

const EMPTY_BANK_ACCOUNT_FORM = {
  bankName: "",
  routingNumber: "",
  accountNumber: "",
  accountType: "checking" as BankAccountType,
};

const EMPTY_ADD_RECIPIENT_FORM = {
  displayName: "",
  type: "agent_vendor" as CounterpartyType,
  network: "iby_verified_vendors" as SettlementNetwork,
  externalRef: "",
  bankAccount: { ...EMPTY_BANK_ACCOUNT_FORM },
};

type AddRecipientForm = typeof EMPTY_ADD_RECIPIENT_FORM;
type BankAccountFormField = keyof AddRecipientForm["bankAccount"];
type AddRecipientFieldKey = keyof Omit<AddRecipientForm, "bankAccount">;
type AddRecipientErrors = Partial<Record<AddRecipientFieldKey, string>> & {
  bankAccount?: Partial<Record<BankAccountFormField, string>>;
};

type AddRecipientSectionKey = "vendor" | "settlement" | "bank";

const DEFAULT_ADD_RECIPIENT_SECTIONS: Record<AddRecipientSectionKey, boolean> = {
  vendor: true,
  settlement: true,
  bank: false,
};

function vendorSectionHasError(errors: AddRecipientErrors) {
  return Boolean(errors.displayName || errors.type);
}

function settlementSectionHasError(errors: AddRecipientErrors) {
  return Boolean(errors.network || errors.externalRef);
}

function bankSectionHasError(errors: AddRecipientErrors) {
  if (!errors.bankAccount) {
    return false;
  }
  return Object.values(errors.bankAccount).some(Boolean);
}

function recipientFormFromCounterparty(recipient: Counterparty): AddRecipientForm {
  return {
    displayName: recipient.displayName,
    type: recipient.type,
    network: recipient.network,
    externalRef: recipient.externalRef,
    bankAccount: recipient.bankAccount
      ? { ...recipient.bankAccount }
      : { ...EMPTY_BANK_ACCOUNT_FORM },
  };
}

function recipientBankLabel(recipient: Counterparty): string | null {
  return recipient.bankAccount ? formatBankAccountDetail(recipient.bankAccount) : null;
}

const COUNTERPARTY_TYPE_OPTIONS = counterpartyTypeSchema.options.map((value) => ({
  value,
  label: counterpartyTypeLabel(value),
}));

const motionTransition = {
  type: "spring",
  stiffness: 520,
  damping: 44,
  mass: 0.7,
} as const;

const shellClass =
  "flex max-h-[min(36rem,calc(100dvh-2rem))] w-104! max-w-[min(26rem,calc(100vw-2rem))]! flex-col overflow-hidden rounded-mbp-shell! border border-mbp-border-subtle! bg-mbp-shell! p-0! text-mbp-fg! shadow-2xl ring-0! sm:max-w-none";

const mbpScrollClass = "mbp-scroll min-h-0 overflow-y-auto overscroll-contain";

const portalSurfaceClass =
  "mbp-scroll rounded-mbp-surface! border border-mbp-border! bg-mbp-portal! text-mbp-fg! ring-0! shadow-md [--select-popover-radius:var(--mbp-radius-surface)] [--select-popover-padding:0.375rem]";

const calendarClass =
  "bg-transparent! p-0 [--cell-radius:var(--mbp-radius-surface)] text-mbp-fg [&_[data-selected-single=true]]:bg-mbp-fg! [&_[data-selected-single=true]]:text-mbp-inverse! [&_[data-selected-single=true]]:hover:bg-mbp-fg! [&_.text-muted-foreground]:text-mbp-muted [&_[data-outside=true]]:text-mbp-muted";

const iconButtonClass =
  "grid size-7 place-items-center rounded-full text-mbp-muted transition-colors duration-mbp will-change-[color] hover:text-mbp-fg";

const controlSurfaceClass =
  "bg-mbp-surface hover:bg-mbp-surface-hover focus-visible:bg-mbp-surface-hover focus-visible:ring-0!";

const addRecipientControlClass = cn(
  "h-10.5 w-full rounded-mbp-surface! border-mbp-border! px-3 text-mbp-body! md:text-mbp-body! text-mbp-fg! shadow-none! focus-visible:ring-0!",
  controlSurfaceClass,
  "placeholder:text-mbp-placeholder",
);

const captionMutedClass = "text-mbp-caption text-mbp-muted";

const selectItemLabelClass = "text-mbp-body leading-none text-mbp-fg";

const timeToggleClass =
  "rounded-full px-2.5 py-1 font-mbp-emphasis text-mbp-muted transition-[color,background-color] duration-mbp will-change-[color,background-color] hover:text-mbp-fg";

const primaryButtonClass =
  "h-10.5 w-full rounded-mbp-surface! bg-mbp-fg! text-mbp-body font-mbp-emphasis text-mbp-inverse! transition will-change-[background-color] hover:bg-mbp-primary-hover!";

const selectItemClass =
  "w-full! items-start! py-2 pr-8 pl-3! text-mbp-fg! focus:bg-mbp-surface-hover! focus:text-mbp-fg!";

const amountDisplayClass = "font-mbp-emphasis tracking-mbp-tight";

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
  const amountFontStyle = amountFontSizeStyle(amountInput.length);
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
      return;
    }

    if (editingRecipientId) {
      state.updateCounterparty(editingRecipientId, parsed.data);
    } else {
      state.addCounterparty(parsed.data);
    }
    setAddRecipientForm(EMPTY_ADD_RECIPIENT_FORM);
    setAddRecipientErrors({});
    setEditingRecipientId(null);
    setPendingRemoveId(null);
    setStep(addRecipientReturnStep);
  }

  function confirmRemoveRecipient(id: string) {
    state.removeCounterparty(id);
    setPendingRemoveId(null);
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
              <motion.div
                className="will-change-[transform,opacity,filter]"
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
                    placeholder="Select source"
                    onValueChange={(railId) => state.updateDraft({ railId })}
                    options={fundingSources.map((item) => ({
                      value: item.id,
                      label: item.label,
                      amount: cents(item.availableCents),
                    }))}
                  />
                  <div className="flex min-w-0 flex-col">
                    <MiniSelect
                      label="To"
                      value={hasRecipients ? state.draft.counterpartyId : ""}
                      placeholder={hasRecipients ? "Select recipient" : "Add recipient"}
                      onValueChange={(next) => {
                        if (next === SELECT_ADD_RECIPIENT_VALUE) {
                          openAddRecipient("amount");
                          return;
                        }
                        state.updateDraft({ counterpartyId: next });
                      }}
                      options={
                        hasRecipients
                          ? recipients.map((item) => ({
                              value: item.id,
                              label: item.displayName,
                            }))
                          : [{ value: SELECT_ADD_RECIPIENT_VALUE, label: "Add recipient" }]
                      }
                    />
                    {hasRecipients ? (
                      <Button
                        variant="link"
                        type="button"
                        className={cn(
                          "mt-1 h-auto self-end px-0 py-0 text-mbp-caption leading-tight text-mbp-muted transition-colors duration-mbp hover:text-mbp-fg",
                        )}
                        onClick={openManageRecipients}
                      >
                        Add/manage
                      </Button>
                    ) : null}
                  </div>
                </div>

                <div className="py-9 text-center">
                  <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-3 items-center">
                      <div
                        className={cn("flex max-w-full min-w-0 items-baseline justify-center", amountDisplayClass)}
                        style={amountFontStyle}
                      >
                        <span className={cn(isEmpty && "text-mbp-placeholder")}>$</span>
                        <input
                          id="modern-payment-amount"
                          name="modern-payment-amount"
                          aria-label="Payment amount"
                          placeholder="0"
                          className={cn(
                            "w-auto max-w-full bg-transparent text-center outline-none field-sizing-content placeholder:text-mbp-placeholder",
                            amountDisplayClass,
                            isEmpty && "min-w-[1ch] text-mbp-placeholder",
                          )}
                          inputMode="decimal"
                          value={amountInput}
                          onChange={(event) => {
                            const formatted = formatAmountInput(event.target.value);
                            setAmountInput(formatted);
                            state.updateDraft({ amountCents: parseAmountInput(formatted) });
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
                        <span className="block font-mbp-emphasis leading-tight text-mbp-danger">
                          Cannot exceed {formatAmountDisplay(available)}
                        </span>
                      ) : (
                        <span className="block text-mbp-body leading-tight text-mbp-muted">
                          {formatAmountDisplay(available)} available
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-center gap-2 text-mbp-caption">
                      <Button
                        variant={time === "instant" ? "secondary" : "link"}
                        className={timeToggleClass}
                        onClick={() => setTime("instant")}
                        type="button"
                      >
                        Instant
                      </Button>
                      <Popover open={scheduleOpen} onOpenChange={setScheduleOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant={time === "schedule" ? "secondary" : "link"}
                            className={timeToggleClass}
                            onClick={() => setTime("schedule")}
                            type="button"
                          >
                            {time === "schedule" ? scheduledDateLabel : "Schedule"}
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
                              setScheduledDate(date);
                              setTime("schedule");
                              setScheduleOpen(false);
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
                  onClick={() => setStep("confirm")}
                  type="button"
                >
                  Continue
                </Button>
              </motion.div>
            ) : step === "manageRecipients" ? (
              <motion.div
                className="will-change-[transform,opacity,filter]"
                key="manageRecipients"
                initial={{ opacity: 0, x: 14, filter: "blur(2px)" }}
                animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, x: 14, filter: "blur(2px)" }}
                transition={motionTransition}
              >
                <div className="space-y-1">
                  {recipients.length === 0 ? (
                    <p className={cn("py-4 text-center", captionMutedClass)}>No recipients yet.</p>
                  ) : (
                    recipients.map((recipient) => (
                      <RecipientManageRow
                        key={recipient.id}
                        name={recipient.displayName}
                        bankLabel={recipientBankLabel(recipient)}
                        status={recipient.status}
                        pending={pendingRemoveId === recipient.id}
                        onEdit={() => openEditRecipient(recipient, "manageRecipients")}
                        onRequestRemove={() => setPendingRemoveId(recipient.id)}
                        onCancelRemove={() => setPendingRemoveId(null)}
                        onConfirmRemove={() => confirmRemoveRecipient(recipient.id)}
                      />
                    ))
                  )}
                </div>
                <Button
                  variant="ghost"
                  className={cn(primaryButtonClass, "mt-3")}
                  type="button"
                  onClick={() => openAddRecipient("manageRecipients")}
                >
                  Add recipient
                </Button>
              </motion.div>
            ) : step === "addRecipient" ? (
              <motion.div
                className="flex flex-col will-change-[transform,opacity,filter]"
                key="addRecipient"
                initial={{ opacity: 0, x: 14, filter: "blur(2px)" }}
                animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, x: 14, filter: "blur(2px)" }}
                transition={motionTransition}
              >
                <div className="space-y-4 pb-9">
                  <AddRecipientFormSection
                    title="Vendor"
                    open={addRecipientSections.vendor}
                    onOpenChange={(open) =>
                      setAddRecipientSections((current) => ({ ...current, vendor: open }))
                    }
                    hasError={vendorSectionHasError(addRecipientErrors)}
                  >
                  <AddRecipientField
                    id="modern-payment-vendor-name"
                    label="Display name"
                    value={addRecipientForm.displayName}
                    error={addRecipientErrors.displayName}
                    placeholder="Nova Foundry"
                    onChange={(displayName) => {
                      setAddRecipientForm((current) => ({ ...current, displayName }));
                      if (addRecipientErrors.displayName) {
                        setAddRecipientErrors((current) => ({ ...current, displayName: undefined }));
                      }
                    }}
                  />
                  <div className="space-y-1">
                    <Label className={captionMutedClass} htmlFor="modern-payment-vendor-type">
                      Vendor type
                    </Label>
                    <Select
                      value={addRecipientForm.type}
                      onValueChange={(type) => {
                        setAddRecipientForm((current) => ({
                          ...current,
                          type: type as CounterpartyType,
                        }));
                        if (addRecipientErrors.type) {
                          setAddRecipientErrors((current) => ({ ...current, type: undefined }));
                        }
                      }}
                    >
                      <SelectTrigger
                        id="modern-payment-vendor-type"
                        className={addRecipientControlClass}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent align="start" className={portalSurfaceClass}>
                        {COUNTERPARTY_TYPE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value} className={selectItemClass}>
                            <span className={selectItemLabelClass}>{option.label}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {addRecipientErrors.type ? (
                      <p className="text-mbp-caption text-mbp-danger">{addRecipientErrors.type}</p>
                    ) : null}
                  </div>
                  </AddRecipientFormSection>
                  <AddRecipientFormSection
                    title="Settlement"
                    open={addRecipientSections.settlement}
                    onOpenChange={(open) =>
                      setAddRecipientSections((current) => ({ ...current, settlement: open }))
                    }
                    hasError={settlementSectionHasError(addRecipientErrors)}
                  >
                  <div className="space-y-1">
                    <Label className={captionMutedClass} htmlFor="modern-payment-vendor-network">
                      Settlement network
                    </Label>
                    <Select
                      value={addRecipientForm.network}
                      onValueChange={(network) => {
                        setAddRecipientForm((current) => ({
                          ...current,
                          network: network as SettlementNetwork,
                        }));
                        if (addRecipientErrors.network) {
                          setAddRecipientErrors((current) => ({ ...current, network: undefined }));
                        }
                      }}
                    >
                      <SelectTrigger
                        id="modern-payment-vendor-network"
                        className={addRecipientControlClass}
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent align="start" className={portalSurfaceClass}>
                        {SETTLEMENT_NETWORK_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value} className={selectItemClass}>
                            <span className={selectItemLabelClass}>{option.label}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {addRecipientErrors.network ? (
                      <p className="text-mbp-caption text-mbp-danger">{addRecipientErrors.network}</p>
                    ) : null}
                  </div>
                  <AddRecipientField
                    id="modern-payment-vendor-ref"
                    label="External reference"
                    value={addRecipientForm.externalRef}
                    error={addRecipientErrors.externalRef}
                    placeholder="vendor:NOVA-2049"
                    onChange={(externalRef) => {
                      setAddRecipientForm((current) => ({ ...current, externalRef }));
                      if (addRecipientErrors.externalRef) {
                        setAddRecipientErrors((current) => ({ ...current, externalRef: undefined }));
                      }
                    }}
                  />
                  </AddRecipientFormSection>
                  <AddRecipientFormSection
                    title="Bank account"
                    open={addRecipientSections.bank}
                    onOpenChange={(open) =>
                      setAddRecipientSections((current) => ({ ...current, bank: open }))
                    }
                    hasError={bankSectionHasError(addRecipientErrors)}
                  >
                    <AddRecipientField
                      id="modern-payment-bank-name"
                      label="Bank name"
                      value={addRecipientForm.bankAccount.bankName}
                      error={addRecipientErrors.bankAccount?.bankName}
                      placeholder="First National"
                      onChange={(bankName) => {
                        setAddRecipientForm((current) => ({
                          ...current,
                          bankAccount: { ...current.bankAccount, bankName },
                        }));
                        if (addRecipientErrors.bankAccount?.bankName) {
                          setAddRecipientErrors((current) => ({
                            ...current,
                            bankAccount: { ...current.bankAccount, bankName: undefined },
                          }));
                        }
                      }}
                    />
                    <div className="grid gap-4 sm:grid-cols-2">
                      <AddRecipientField
                        id="modern-payment-bank-routing"
                        label="Routing number"
                        value={addRecipientForm.bankAccount.routingNumber}
                        error={addRecipientErrors.bankAccount?.routingNumber}
                        placeholder="021000021"
                        inputMode="numeric"
                        maxLength={9}
                        autoComplete="off"
                        onChange={(routingNumber) => {
                          const digits = routingNumber.replace(/\D/g, "").slice(0, 9);
                          setAddRecipientForm((current) => ({
                            ...current,
                            bankAccount: { ...current.bankAccount, routingNumber: digits },
                          }));
                          if (addRecipientErrors.bankAccount?.routingNumber) {
                            setAddRecipientErrors((current) => ({
                              ...current,
                              bankAccount: { ...current.bankAccount, routingNumber: undefined },
                            }));
                          }
                        }}
                      />
                      <AddRecipientField
                        id="modern-payment-bank-account"
                        label="Account number"
                        value={addRecipientForm.bankAccount.accountNumber}
                        error={addRecipientErrors.bankAccount?.accountNumber}
                        placeholder="8844221901"
                        inputMode="numeric"
                        maxLength={17}
                        autoComplete="off"
                        onChange={(accountNumber) => {
                          const digits = accountNumber.replace(/\D/g, "").slice(0, 17);
                          setAddRecipientForm((current) => ({
                            ...current,
                            bankAccount: { ...current.bankAccount, accountNumber: digits },
                          }));
                          if (addRecipientErrors.bankAccount?.accountNumber) {
                            setAddRecipientErrors((current) => ({
                              ...current,
                              bankAccount: { ...current.bankAccount, accountNumber: undefined },
                            }));
                          }
                        }}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className={captionMutedClass} htmlFor="modern-payment-bank-account-type">
                        Account type
                      </Label>
                      <Select
                        value={addRecipientForm.bankAccount.accountType}
                        onValueChange={(accountType) => {
                          setAddRecipientForm((current) => ({
                            ...current,
                            bankAccount: {
                              ...current.bankAccount,
                              accountType: accountType as BankAccountType,
                            },
                          }));
                          if (addRecipientErrors.bankAccount?.accountType) {
                            setAddRecipientErrors((current) => ({
                              ...current,
                              bankAccount: { ...current.bankAccount, accountType: undefined },
                            }));
                          }
                        }}
                      >
                        <SelectTrigger
                          id="modern-payment-bank-account-type"
                          className={addRecipientControlClass}
                        >
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent align="start" className={portalSurfaceClass}>
                          {BANK_ACCOUNT_TYPE_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value} className={selectItemClass}>
                              <span className={selectItemLabelClass}>{option.label}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {addRecipientErrors.bankAccount?.accountType ? (
                        <p className="text-mbp-caption text-mbp-danger">
                          {addRecipientErrors.bankAccount.accountType}
                        </p>
                      ) : null}
                    </div>
                  </AddRecipientFormSection>
                </div>
                <Button
                  variant="ghost"
                  className={cn(primaryButtonClass)}
                  type="button"
                  onClick={confirmSaveRecipient}
                >
                  {editingRecipientId ? "Save changes" : "Save recipient"}
                </Button>
              </motion.div>
            ) : (
              <motion.div
                className="will-change-[transform,opacity,filter]"
                key="confirm"
                initial={{ opacity: 0, x: 18, filter: "blur(2px)" }}
                animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, x: 18, filter: "blur(2px)" }}
                transition={motionTransition}
              >
                <div className="py-4 pb-5 text-center">
                  <div className={cn(amountDisplayClass, "text-mbp-fg")} style={amountFontStyle}>
                    {formatAmountDisplay(amount)}
                    <span className="ml-1 text-xs">USD</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <ConfirmRow label="From" value={rail?.label ?? "Credit pool"} />
                  <ConfirmRow label="To" value={counterparty?.displayName ?? "Nova Foundry"} />
                  {counterparty?.bankAccount ? (
                    <ConfirmRow
                      label="Bank"
                      value={formatBankAccountDetail(counterparty.bankAccount)}
                    />
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
}: {
  label: string;
  value: string;
  placeholder: string;
  options: Array<{ value: string; label: string; amount?: string }>;
  onValueChange: (value: string) => void;
}) {
  const selected = options.find((item) => item.value === value);
  const displayLabel = selected?.label ?? placeholder;
  return (
    <div className="w-full min-w-0">
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger
        className={cn(
          "min-h-13 min-w-0 w-full items-center border-0! rounded-mbp-surface! px-3 py-2.5 text-left shadow-none! will-change-[background-color] dark:bg-mbp-surface! dark:hover:bg-mbp-surface-hover!",
          controlSurfaceClass,
          "[&_svg]:size-[1em]! [&_svg]:text-mbp-muted!",
        )}
      >
        <span className="min-w-0 flex-1 overflow-hidden">
          <span className={cn("block leading-none", captionMutedClass)}>{label}</span>
          <span className="mt-1 flex min-w-0 items-center gap-1 text-mbp-body leading-[1.15] text-mbp-fg">
            <span className="min-w-0 flex-1 truncate">
              <SelectValue placeholder={placeholder}>{displayLabel}</SelectValue>
            </span>
          </span>
        </span>
      </SelectTrigger>
      <SelectContent
        align="start"
        className={cn(
          portalSurfaceClass,
          "min-w-(--radix-select-trigger-width) w-max max-w-[min(26rem,calc(100vw-2rem))] overflow-x-visible",
          "**:data-[position=popper]:h-auto **:data-[position=popper]:w-auto **:data-[position=popper]:min-w-full",
        )}
      >
        {options.map((item) => (
          <SelectItem key={item.value} value={item.value} className={selectItemClass}>
            <div className="flex min-w-full w-max flex-col items-start gap-0.5">
              <span className={cn(selectItemLabelClass, "whitespace-nowrap")}>{item.label}</span>
              {item.amount ? (
                <span className={cn(captionMutedClass, "whitespace-nowrap")}>{item.amount}</span>
              ) : null}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
    </div>
  );
}

function formatAmountDisplay(cents: number) {
  if (cents <= 0) return "";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

function formatAmountInput(raw: string) {
  let s = raw.replace(/,/g, "").replace(/[^\d.]/g, "");
  const dotIndex = s.indexOf(".");
  if (dotIndex !== -1) {
    const int = s.slice(0, dotIndex);
    const frac = s.slice(dotIndex + 1).replace(/\./g, "");
    s = int + "." + frac.slice(0, 2);
  }
  if (s.startsWith(".")) s = `0${s}`;
  const parts = s.split(".");
  if (parts[0].length > 12) parts[0] = parts[0].slice(0, 12);
  s = parts.join(".");

  if (!s) return "";

  const intPart = parts[0];
  let formatted = intPart ? new Intl.NumberFormat("en-US").format(Number(intPart)) : "0";

  if (parts.length > 1) {
    const frac = parts[1];
    if (frac) formatted += `.${frac}`;
    if (s.endsWith(".")) formatted += ".";
  }

  return formatted;
}

function parseAmountInput(raw: string) {
  const dollars = Number(raw.replace(/,/g, ""));
  if (!Number.isFinite(dollars) || dollars <= 0) return 0;
  return Math.min(Math.round(dollars * 100), MAX_AMOUNT_CENTS);
}

function amountFontSizeStyle(displayLength: number) {
  const chars = Math.max(displayLength, 1);
  return {
    fontSize: `min(var(--mbp-amount-font-max), max(var(--mbp-amount-font-min), calc(var(--mbp-amount-font-row) * 1rem / ${chars})))`,
  };
}

function ConfirmRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-h-10 items-center justify-between rounded-mbp-row! bg-mbp-surface! px-3.5">
      <span className={cn("leading-tight", captionMutedClass)}>{label}</span>
      <span className="truncate text-mbp-body font-mbp-emphasis leading-[1.15] text-mbp-fg">{value}</span>
    </div>
  );
}

function counterpartyTypeLabel(type: CounterpartyType) {
  switch (type) {
    case "model_provider":
      return "Model provider";
    case "agent_vendor":
      return "Agent vendor";
    case "workspace":
      return "Workspace";
    case "compute_market":
      return "Compute market";
  }
}

function counterpartyStatusLabel(status: Counterparty["status"]) {
  switch (status) {
    case "verified":
      return "Verified";
    case "pending_review":
      return "Pending review";
    case "missing_evidence":
      return "Missing evidence";
    case "blocked":
      return "Blocked";
  }
}

function CounterpartyStatusIcon({ status }: { status: Counterparty["status"] }) {
  const label = counterpartyStatusLabel(status);
  const className = cn(
    "size-3.5 shrink-0",
    status === "blocked" ? "text-mbp-danger" : "text-mbp-muted",
  );

  const icon =
    status === "verified" ? (
      <BadgeCheck className={className} aria-hidden />
    ) : status === "pending_review" ? (
      <Clock className={className} aria-hidden />
    ) : status === "missing_evidence" ? (
      <CircleAlert className={className} aria-hidden />
    ) : (
      <Ban className={className} aria-hidden />
    );

  return (
    <span className="inline-flex shrink-0" title={label} aria-label={label} role="img">
      {icon}
    </span>
  );
}

function AddRecipientFormSection({
  title,
  open,
  onOpenChange,
  hasError,
  children,
}: {
  title: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hasError?: boolean;
  children: ReactNode;
}) {
  return (
    <Collapsible open={open} onOpenChange={onOpenChange}>
      <CollapsibleTrigger type="button" className="flex w-full items-center gap-2 text-left">
        <span className="min-w-0 flex-1">{title}</span>
        {hasError ? <span className="shrink-0 text-mbp-caption text-mbp-danger">Fix errors</span> : null}
        <ChevronDown
          className={cn("size-4 shrink-0 transition-transform duration-200", open && "rotate-180")}
          aria-hidden
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-2 pt-2">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}

function AddRecipientField({
  id,
  label,
  value,
  error,
  placeholder,
  inputMode,
  maxLength,
  autoComplete,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  error?: string;
  placeholder: string;
  inputMode?: HTMLAttributes<HTMLInputElement>["inputMode"];
  maxLength?: number;
  autoComplete?: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1">
      <Label className={captionMutedClass} htmlFor={id}>
        {label}
      </Label>
      <Input
        id={id}
        name={id}
        value={value}
        inputMode={inputMode}
        maxLength={maxLength}
        autoComplete={autoComplete}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={addRecipientControlClass}
      />
      {error ? <p className="text-mbp-caption text-mbp-danger">{error}</p> : null}
    </div>
  );
}

function RecipientManageRow({
  name,
  bankLabel,
  status,
  pending,
  onEdit,
  onRequestRemove,
  onCancelRemove,
  onConfirmRemove,
}: {
  name: string;
  bankLabel: string | null;
  status: Counterparty["status"];
  pending: boolean;
  onEdit: () => void;
  onRequestRemove: () => void;
  onCancelRemove: () => void;
  onConfirmRemove: () => void;
}) {
  if (pending) {
    return (
      <div className="space-y-1.5 rounded-mbp-row! bg-mbp-surface! px-3 py-2">
        <p className="text-mbp-body leading-tight text-mbp-fg">
          Remove <span className="font-mbp-emphasis">{name}</span>?
        </p>
        <div className="flex justify-end gap-2">
          <Button
            variant="link"
            type="button"
            className="h-auto px-0 py-0 text-mbp-caption text-mbp-muted hover:text-mbp-fg"
            onClick={onCancelRemove}
          >
            Cancel
          </Button>
          <Button
            variant="link"
            type="button"
            className="h-auto px-0 py-0 text-mbp-caption font-mbp-emphasis text-mbp-danger hover:text-mbp-danger"
            onClick={onConfirmRemove}
          >
            Remove
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-mbp-row! bg-mbp-surface! px-3 py-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          <CounterpartyStatusIcon status={status} />
          <p className="min-w-0 truncate text-mbp-body font-mbp-emphasis leading-tight text-mbp-fg">
            {name}
          </p>
        </div>
        <div className="flex shrink-0 items-center">
          <Button
            variant="link"
            type="button"
            className={cn(iconButtonClass, "size-6")}
            onClick={onEdit}
            aria-label={`Edit ${name}`}
          >
            <Pencil className="size-3.5" />
          </Button>
          <Button
            variant="link"
            type="button"
            className={cn(iconButtonClass, "size-6")}
            onClick={onRequestRemove}
            aria-label={`Remove ${name}`}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>
      {bankLabel ? (
        <p className="truncate text-mbp-caption leading-tight text-mbp-muted">{bankLabel}</p>
      ) : null}
    </div>
  );
}
