import type { ZodIssue } from "zod";
import { addRecipientInputSchema } from "./constants";
import type {
  AddRecipientErrors,
  AddRecipientFieldKey,
  AddRecipientForm,
  AddRecipientSectionKey,
  BankAccountFormField,
} from "./types";

export type AddRecipientValidatePath =
  | AddRecipientFieldKey
  | `bankAccount.${BankAccountFormField}`;

export function normalizeAddRecipientForm(form: AddRecipientForm) {
  return {
    displayName: form.displayName.trim(),
    type: form.type,
    network: form.network,
    externalRef: form.externalRef.trim(),
    bankAccount: {
      bankName: form.bankAccount.bankName.trim(),
      routingNumber: form.bankAccount.routingNumber.trim(),
      accountNumber: form.bankAccount.accountNumber.trim(),
      accountType: form.bankAccount.accountType,
    },
  };
}

function issueMatchesPath(
  issue: ZodIssue,
  path: AddRecipientValidatePath,
): boolean {
  const [root, nested] = issue.path;
  if (path.startsWith("bankAccount.")) {
    const field = path.slice("bankAccount.".length) as BankAccountFormField;
    return root === "bankAccount" && nested === field;
  }
  return root === path && nested === undefined;
}

export function mapAddRecipientIssuesToErrors(
  issues: ZodIssue[],
  path?: AddRecipientValidatePath,
): AddRecipientErrors {
  const nextErrors: AddRecipientErrors = {};
  for (const issue of issues) {
    if (path && !issueMatchesPath(issue, path)) {
      continue;
    }
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
  return nextErrors;
}

export function validateAddRecipientForm(form: AddRecipientForm): AddRecipientErrors {
  const parsed = addRecipientInputSchema.safeParse(normalizeAddRecipientForm(form));
  if (parsed.success) {
    return {};
  }
  return mapAddRecipientIssuesToErrors(parsed.error.issues);
}

export function addRecipientErrorsAreEmpty(errors: AddRecipientErrors): boolean {
  if (errors.displayName || errors.type || errors.network || errors.externalRef) {
    return false;
  }
  if (errors.bankAccount && Object.values(errors.bankAccount).some(Boolean)) {
    return false;
  }
  return true;
}

export function validateAddRecipientField(
  form: AddRecipientForm,
  path: AddRecipientValidatePath,
): string | undefined {
  const parsed = addRecipientInputSchema.safeParse(normalizeAddRecipientForm(form));
  if (parsed.success) {
    return undefined;
  }
  const fieldErrors = mapAddRecipientIssuesToErrors(parsed.error.issues, path);
  if (path.startsWith("bankAccount.")) {
    const field = path.slice("bankAccount.".length) as BankAccountFormField;
    return fieldErrors.bankAccount?.[field];
  }
  return fieldErrors[path as AddRecipientFieldKey];
}

export function sectionForValidatePath(path: AddRecipientValidatePath): AddRecipientSectionKey {
  if (path === "displayName" || path === "type") {
    return "vendor";
  }
  if (path === "network" || path === "externalRef") {
    return "settlement";
  }
  return "bank";
}
