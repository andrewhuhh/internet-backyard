"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BANK_ACCOUNT_TYPE_OPTIONS } from "@/lib/settlement/bank-account";
import { SETTLEMENT_NETWORK_OPTIONS } from "@/lib/settlement/settlement-networks";
import { cn } from "@/lib/utils";
import { AddRecipientField } from "./add-recipient-field";
import { AddRecipientFormSection } from "./add-recipient-form-section";
import {
  addRecipientControlClass,
  captionMutedClass,
  portalSurfaceClass,
  primaryButtonClass,
  selectItemClass,
  selectItemLabelClass,
} from "./styles";
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
      <div className="space-y-4 pb-9">
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
            placeholder="Nova Foundry"
            onChange={(displayName) => {
              setForm((current) => ({ ...current, displayName }));
              clearFieldError("displayName");
            }}
          />
          <div className="space-y-1">
            <Label className={captionMutedClass} htmlFor="modern-payment-vendor-type">
              Vendor type
            </Label>
            <Select
              value={form.type}
              onValueChange={(type) => {
                setForm((current) => ({
                  ...current,
                  type: type as CounterpartyType,
                }));
                clearFieldError("type");
              }}
            >
              <SelectTrigger id="modern-payment-vendor-type" className={addRecipientControlClass}>
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
            {errors.type ? (
              <p className="text-mbp-caption text-mbp-danger">{errors.type}</p>
            ) : null}
          </div>
        </AddRecipientFormSection>

        <AddRecipientFormSection
          title="Settlement"
          open={sections.settlement}
          onOpenChange={(open) => onSectionsChange((current) => ({ ...current, settlement: open }))}
          hasError={settlementSectionHasError(errors)}
        >
          <div className="space-y-1">
            <Label className={captionMutedClass} htmlFor="modern-payment-vendor-network">
              Settlement network
            </Label>
            <Select
              value={form.network}
              onValueChange={(network) => {
                setForm((current) => ({
                  ...current,
                  network: network as SettlementNetwork,
                }));
                clearFieldError("network");
              }}
            >
              <SelectTrigger id="modern-payment-vendor-network" className={addRecipientControlClass}>
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
            {errors.network ? (
              <p className="text-mbp-caption text-mbp-danger">{errors.network}</p>
            ) : null}
          </div>
          <AddRecipientField
            id="modern-payment-vendor-ref"
            label="External reference"
            value={form.externalRef}
            error={errors.externalRef}
            placeholder="vendor:NOVA-2049"
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
            placeholder="First National"
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
              placeholder="021000021"
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
              placeholder="8844221901"
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
          <div className="space-y-1">
            <Label className={captionMutedClass} htmlFor="modern-payment-bank-account-type">
              Account type
            </Label>
            <Select
              value={form.bankAccount.accountType}
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
            >
              <SelectTrigger id="modern-payment-bank-account-type" className={addRecipientControlClass}>
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
            {errors.bankAccount?.accountType ? (
              <p className="text-mbp-caption text-mbp-danger">{errors.bankAccount.accountType}</p>
            ) : null}
          </div>
        </AddRecipientFormSection>
      </div>
      <Button variant="ghost" className={cn(primaryButtonClass)} type="button" onClick={onSave}>
        {editingRecipientId ? "Save changes" : "Save recipient"}
      </Button>
    </>
  );
}
