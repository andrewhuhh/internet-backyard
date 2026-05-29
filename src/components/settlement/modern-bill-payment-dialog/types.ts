import type {
  BankAccountType,
  CounterpartyType,
  SettlementNetwork,
} from "@/lib/settlement/schema";
import type { EMPTY_ADD_RECIPIENT_FORM } from "./constants";

export type ModernStep = "amount" | "confirm" | "manageRecipients" | "addRecipient";
export type AddRecipientReturnStep = "amount" | "manageRecipients";
export type PaymentTime = "instant" | "schedule";

export type AddRecipientForm = typeof EMPTY_ADD_RECIPIENT_FORM;
export type BankAccountFormField = keyof AddRecipientForm["bankAccount"];
export type AddRecipientFieldKey = keyof Omit<AddRecipientForm, "bankAccount">;
export type AddRecipientErrors = Partial<Record<AddRecipientFieldKey, string>> & {
  bankAccount?: Partial<Record<BankAccountFormField, string>>;
};

export type AddRecipientSectionKey = "vendor" | "settlement" | "bank";

export type { BankAccountType, CounterpartyType, SettlementNetwork };
