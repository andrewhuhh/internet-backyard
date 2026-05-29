import { formatBankAccountDetail } from "@/lib/settlement/bank-account";
import { counterpartyTypeSchema, type Counterparty, type CounterpartyType } from "@/lib/settlement/schema";
import { EMPTY_BANK_ACCOUNT_FORM } from "./constants";
import type { AddRecipientErrors, AddRecipientForm } from "./types";

export function vendorSectionHasError(errors: AddRecipientErrors) {
  return Boolean(errors.displayName || errors.type);
}

export function settlementSectionHasError(errors: AddRecipientErrors) {
  return Boolean(errors.network || errors.externalRef);
}

export function bankSectionHasError(errors: AddRecipientErrors) {
  if (!errors.bankAccount) {
    return false;
  }
  return Object.values(errors.bankAccount).some(Boolean);
}

export function recipientFormFromCounterparty(recipient: Counterparty): AddRecipientForm {
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

export function recipientBankLabel(recipient: Counterparty): string | null {
  return recipient.bankAccount ? formatBankAccountDetail(recipient.bankAccount) : null;
}

export const COUNTERPARTY_TYPE_OPTIONS = counterpartyTypeSchema.options.map((value) => ({
  value,
  label: counterpartyTypeLabel(value),
}));

export function counterpartyTypeLabel(type: CounterpartyType) {
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

export function counterpartyStatusLabel(status: Counterparty["status"]) {
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
