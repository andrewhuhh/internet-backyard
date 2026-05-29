import { z } from "zod";

export const counterpartyTypeSchema = z.enum([
  "model_provider",
  "agent_vendor",
  "workspace",
  "compute_market",
]);

export const counterpartyStatusSchema = z.enum([
  "verified",
  "pending_review",
  "missing_evidence",
  "blocked",
]);

export const railTypeSchema = z.enum([
  "operating_balance",
  "bank_account",
  "wire",
  "usage_credit",
  "invoice_agreement",
]);

export const railStatusSchema = z.enum([
  "ready",
  "requires_microdeposit",
  "requires_approval",
  "suspended",
]);

export const meteringBasisSchema = z.enum([
  "tokens",
  "gpu_seconds",
  "agent_task",
  "benchmark_unit",
  "hybrid",
]);

export const settlementNetworkSchema = z.enum([
  "iby_verified_vendors",
  "agent_task_marketplace",
  "spot_gpu_desk",
]);

export const bankAccountTypeSchema = z.enum(["checking", "savings"]);

export const counterpartyBankAccountSchema = z.object({
  bankName: z.string().min(2, "Enter the bank name."),
  routingNumber: z
    .string()
    .regex(/^\d{9}$/, "Routing number must be 9 digits."),
  accountNumber: z
    .string()
    .min(4, "Account number is too short.")
    .max(17, "Account number is too long."),
  accountType: bankAccountTypeSchema,
});

export const counterpartySchema = z.object({
  id: z.string().startsWith("cp_"),
  displayName: z.string().min(2),
  type: counterpartyTypeSchema,
  riskTier: z.enum(["low", "medium", "high"]),
  status: counterpartyStatusSchema,
  network: settlementNetworkSchema,
  externalRef: z.string().min(3),
  bankAccount: counterpartyBankAccountSchema.optional(),
});

export const settlementRailSchema = z.object({
  id: z.string().startsWith("rail_"),
  label: z.string().min(2),
  type: railTypeSchema,
  currency: z.string().length(3).toUpperCase(),
  status: railStatusSchema,
  limitCents: z.number().int().positive(),
  availableCents: z.number().int().nonnegative(),
  settlementWindow: z.string().min(2),
});

export const usageEvidenceSchema = z.object({
  id: z.string().startsWith("usage_"),
  workloadName: z.string().min(2),
  meteringBasis: meteringBasisSchema,
  periodStart: z.string().datetime(),
  periodEnd: z.string().datetime(),
  quantity: z.number().positive(),
  unitLabel: z.string().min(1),
  evidenceHash: z.string().min(12),
  confidence: z.number().int().min(0).max(100),
});

export const benchmarkQuoteSchema = z.object({
  id: z.string().startsWith("bench_"),
  label: z.string().min(2),
  basis: meteringBasisSchema,
  unitPriceCents: z.number().int().positive(),
  source: z.string().min(2),
  asOf: z.string().datetime(),
  confidence: z.number().int().min(0).max(100),
});

export const settlementIntentSchema = z.object({
  counterpartyId: z.string().startsWith("cp_", "Select a counterparty."),
  railId: z.string().startsWith("rail_", "Select a settlement rail."),
  usageEvidenceId: z.string().startsWith("usage_"),
  benchmarkQuoteId: z.string().startsWith("bench_"),
  amountCents: z.number().int().min(100, "Settlement amount must be at least $1.00."),
  currency: z.string().length(3).toUpperCase(),
  memo: z.string().max(180),
  reviewMode: z.enum(["standard", "expedited", "manual_review"]),
});

export const settlementReceiptSchema = settlementIntentSchema.extend({
  id: z.string().startsWith("set_"),
  status: z.enum(["settled", "queued_review", "scheduled", "failed"]),
  scheduledFor: z.string().datetime().optional(),
  createdAt: z.string().datetime(),
  auditRef: z.string().min(8),
});

export const creditTransferSchema = z.object({
  id: z.string().startsWith("xfer_"),
  fromRailId: z.string().startsWith("rail_"),
  toRailId: z.string().startsWith("rail_"),
  amountCents: z.number().int().min(100, "Transfer amount must be at least $1.00."),
  currency: z.string().length(3).toUpperCase(),
  memo: z.string().max(180),
  status: z.enum(["settled", "failed", "awaiting_approval"]),
  createdAt: z.string().datetime(),
  auditRef: z.string().min(8),
});

export type Counterparty = z.infer<typeof counterpartySchema>;
export type CounterpartyType = z.infer<typeof counterpartyTypeSchema>;
export type SettlementNetwork = z.infer<typeof settlementNetworkSchema>;
export type BankAccountType = z.infer<typeof bankAccountTypeSchema>;
export type CounterpartyBankAccount = z.infer<typeof counterpartyBankAccountSchema>;
export type SettlementRail = z.infer<typeof settlementRailSchema>;
export type RailType = z.infer<typeof railTypeSchema>;
export type UsageEvidence = z.infer<typeof usageEvidenceSchema>;
export type BenchmarkQuote = z.infer<typeof benchmarkQuoteSchema>;
export type SettlementIntent = z.infer<typeof settlementIntentSchema>;
export type SettlementReceipt = z.infer<typeof settlementReceiptSchema>;
export type CreditTransfer = z.infer<typeof creditTransferSchema>;
