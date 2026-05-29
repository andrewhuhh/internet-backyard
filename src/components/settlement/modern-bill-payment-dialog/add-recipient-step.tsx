"use client";

import { Button } from "@/components/ui/button";
import { BANK_ACCOUNT_TYPE_OPTIONS } from "@/lib/settlement/bank-account";
import { SETTLEMENT_NETWORK_OPTIONS } from "@/lib/settlement/settlement-networks";
import { cn } from "@/lib/utils";
import { AddRecipientField } from "./add-recipient-field";
import { AddRecipientFormSection } from "./add-recipient-form-section";
import { AddRecipientSelect } from "./add-recipient-select";
import { primaryButtonClass } from "./styles";
import {
  bankSectionHasError,
  COUNTERPARTY_TYPE_OPTIONS,
  settlementSectionHasError,
  vendorSectionHasError,
} from "./recipient-utils";
import type {
  AddRecipientErrors,
  AddRecipientForm,
  AddRecipientSectionKey,
  BankAccountType,
  CounterpartyType,
  SettlementNetwork,
} from "./types";

type AddRecipientStepProps = {
  form: AddRecipientForm;
  errors: AddRecipientErrors;
  sections: Record<AddRecipientSectionKey, boolean>;
  editingRecipientId: string | null;
  onFormChange: (updater: (current: AddRecipientForm) => AddRecipientForm) => void;
  onErrorsChange: (updater: (current: AddRecipientErrors) => AddRecipientErrors) => void;
  onSectionsChange: (updater: (current: Record<AddRecipientSectionKey, boolean>) => Record<AddRecipientSectionKey, boolean>) => void;
  onSave: () => void;
};

export function AddRecipientStep({
  form,
  errors,
  sections,
  editingRecipientId,
  onFormChange,
  onErrorsChange,
  onSectionsChange,
  onSave,
}: AddRecipientStepProps) {
  const setForm = (updater: (current: AddRecipientForm) => AddRecipientForm) => onFormChange(updater);
  const clearFieldError = (field: keyof Omit<AddRecipientForm, "bankAccount">) => {
    if (errors[field]) {
      onErrorsChange((current) => ({ ...current, [field]: undefined }));
    }
  };
  const clearBankError = (field: keyof AddRecipientForm["bankAccount"]) => {
    if (errors.bankAccount?.[field]) {
      onErrorsChange((current) => ({
        ...current,
        bankAccount: { ...current.bankAccount, [field]: undefined },
      }));
    }
  };

  return (
    <>
      <div className="space-y-4 pb-6">
        <AddRecipientFormSection
          title="Vendor"
          open={sections.vendor}
          onOpenChange={(open) => onSectionsChange((current) => ({ ...current, vendor: open }))}
          hasError={vendorSectionHasError(errors)}
        >
          <AddRecipientField
            id="modern-payment-vendor-name"
            label="Display name"
            value={form.displayName}
            error={errors.displayName}
            onChange={(displayName) => {
              setForm((current) => ({ ...current, displayName }));
              clearFieldError("displayName");
            }}
          />
          <AddRecipientSelect
            id="modern-payment-vendor-type"
            label="Vendor type"
            value={form.type}
            options={COUNTERPARTY_TYPE_OPTIONS}
            error={errors.type}
            onValueChange={(type) => {
              setForm((current) => ({
                ...current,
                type: type as CounterpartyType,
              }));
              clearFieldError("type");
            }}
          />
        </AddRecipientFormSection>

        <AddRecipientFormSection
          title="Settlement"
          open={sections.settlement}
          onOpenChange={(open) => onSectionsChange((current) => ({ ...current, settlement: open }))}
          hasError={settlementSectionHasError(errors)}
        >
          <AddRecipientSelect
            id="modern-payment-vendor-network"
            label="Settlement network"
            value={form.network}
            options={SETTLEMENT_NETWORK_OPTIONS}
            error={errors.network}
            onValueChange={(network) => {
              setForm((current) => ({
                ...current,
                network: network as SettlementNetwork,
              }));
              clearFieldError("network");
            }}
          />
          <AddRecipientField
            id="modern-payment-vendor-ref"
            label="External reference"
            value={form.externalRef}
            error={errors.externalRef}
            onChange={(externalRef) => {
              setForm((current) => ({ ...current, externalRef }));
              clearFieldError("externalRef");
            }}
          />
        </AddRecipientFormSection>

        <AddRecipientFormSection
          title="Bank account"
          open={sections.bank}
          onOpenChange={(open) => onSectionsChange((current) => ({ ...current, bank: open }))}
          hasError={bankSectionHasError(errors)}
        >
          <AddRecipientField
            id="modern-payment-bank-name"
            label="Bank name"
            value={form.bankAccount.bankName}
            error={errors.bankAccount?.bankName}
            onChange={(bankName) => {
              setForm((current) => ({
                ...current,
                bankAccount: { ...current.bankAccount, bankName },
              }));
              clearBankError("bankName");
            }}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <AddRecipientField
              id="modern-payment-bank-routing"
              label="Routing number"
              value={form.bankAccount.routingNumber}
              error={errors.bankAccount?.routingNumber}
              inputMode="numeric"
              maxLength={9}
              autoComplete="off"
              onChange={(routingNumber) => {
                const digits = routingNumber.replace(/\D/g, "").slice(0, 9);
                setForm((current) => ({
                  ...current,
                  bankAccount: { ...current.bankAccount, routingNumber: digits },
                }));
                clearBankError("routingNumber");
              }}
            />
            <AddRecipientField
              id="modern-payment-bank-account"
              label="Account number"
              value={form.bankAccount.accountNumber}
              error={errors.bankAccount?.accountNumber}
              inputMode="numeric"
              maxLength={17}
              autoComplete="off"
              onChange={(accountNumber) => {
                const digits = accountNumber.replace(/\D/g, "").slice(0, 17);
                setForm((current) => ({
                  ...current,
                  bankAccount: { ...current.bankAccount, accountNumber: digits },
                }));
                clearBankError("accountNumber");
              }}
            />
          </div>
          <AddRecipientSelect
            id="modern-payment-bank-account-type"
            label="Account type"
            value={form.bankAccount.accountType}
            options={BANK_ACCOUNT_TYPE_OPTIONS}
            error={errors.bankAccount?.accountType}
            onValueChange={(accountType) => {
              setForm((current) => ({
                ...current,
                bankAccount: {
                  ...current.bankAccount,
                  accountType: accountType as BankAccountType,
                },
              }));
              clearBankError("accountType");
            }}
          />
        </AddRecipientFormSection>
      </div>
      <Button variant="ghost" className={cn(primaryButtonClass)} type="button" onClick={onSave}>
        {editingRecipientId ? "Save changes" : "Save recipient"}
      </Button>
    </>
  );
}
