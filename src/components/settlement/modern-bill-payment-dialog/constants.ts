import { counterpartySchema, counterpartyBankAccountSchema } from "@/lib/settlement/schema";
import type { BankAccountType, CounterpartyType, SettlementNetwork } from "@/lib/settlement/schema";
export const SELECT_ADD_RECIPIENT_VALUE = "__add_recipient__";
export const SELECT_MANAGE_RECIPIENTS_VALUE = "__manage_recipients__";

/** Show recipient search once the list grows past this count. */
export const RECIPIENT_SEARCH_THRESHOLD = 3;

export const MAX_AMOUNT_CENTS = 99_999_999_999_999;

export const addRecipientInputSchema = counterpartySchema
  .pick({
    displayName: true,
    type: true,
    network: true,
    externalRef: true,
  })
  .extend({
    bankAccount: counterpartyBankAccountSchema,
  });

export const EMPTY_BANK_ACCOUNT_FORM = {
  bankName: "",
  routingNumber: "",
  accountNumber: "",
  accountType: "checking" as BankAccountType,
};

export const EMPTY_ADD_RECIPIENT_FORM = {
  displayName: "",
  type: "agent_vendor" as CounterpartyType,
  network: "iby_verified_vendors" as SettlementNetwork,
  externalRef: "",
  bankAccount: { ...EMPTY_BANK_ACCOUNT_FORM },
};

export const DEFAULT_ADD_RECIPIENT_SECTIONS: Record<"vendor" | "settlement" | "bank", boolean> = {
  vendor: true,
  settlement: true,
  bank: false,
};

export const motionTransition = {
  type: "spring",
  stiffness: 520,
  damping: 44,
  mass: 0.7,
} as const;
