import {
  bankAccountTypeSchema,
  type BankAccountType,
  type CounterpartyBankAccount,
} from "@/lib/settlement/schema";

export const BANK_ACCOUNT_TYPE_OPTIONS = bankAccountTypeSchema.options.map((value) => ({
  value,
  label: bankAccountTypeLabel(value),
}));

export function bankAccountTypeLabel(type: BankAccountType): string {
  switch (type) {
    case "checking":
      return "Checking";
    case "savings":
      return "Savings";
  }
}

export function maskAccountNumber(accountNumber: string): string {
  const trimmed = accountNumber.trim();
  if (trimmed.length < 4) {
    return trimmed;
  }
  return `···${trimmed.slice(-4)}`;
}

export function formatBankAccountDetail(bankAccount: CounterpartyBankAccount): string {
  return `${bankAccount.bankName} ${maskAccountNumber(bankAccount.accountNumber)}`;
}
