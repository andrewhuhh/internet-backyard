import {
  benchmarkQuoteSchema,
  counterpartySchema,
  settlementRailSchema,
  usageEvidenceSchema,
  type BenchmarkQuote,
  type Counterparty,
  type SettlementRail,
  type UsageEvidence,
} from "./schema";

export const seededCounterparties = counterpartySchema.array().parse([
  {
    id: "cp_nova_foundry",
    displayName: "Nova Foundry",
    type: "model_provider",
    riskTier: "low",
    status: "verified",
    network: "iby_verified_vendors",
    externalRef: "vendor:NOVA-2049",
    bankAccount: {
      bankName: "First National",
      routingNumber: "021000021",
      accountNumber: "8844221901",
      accountType: "checking",
    },
  },
  {
    id: "cp_orchid_agents",
    displayName: "Orchid Agents",
    type: "agent_vendor",
    riskTier: "medium",
    status: "pending_review",
    network: "agent_task_marketplace",
    externalRef: "contract:OA-17",
    bankAccount: {
      bankName: "Silicon Valley Bank",
      routingNumber: "121140399",
      accountNumber: "3301984420",
      accountType: "checking",
    },
  },
  {
    id: "cp_harbor_compute",
    displayName: "Harbor Compute Exchange",
    type: "compute_market",
    riskTier: "low",
    status: "verified",
    network: "spot_gpu_desk",
    externalRef: "venue:HARBOR-B200",
    bankAccount: {
      bankName: "Mercury",
      routingNumber: "084106768",
      accountNumber: "7712048831",
      accountType: "savings",
    },
  },
] satisfies Counterparty[]);

export const seededRails = settlementRailSchema.array().parse([
  {
    id: "rail_operating_usdc",
    label: "Operating balance",
    type: "operating_balance",
    currency: "USD",
    status: "ready",
    limitCents: 2500000,
    availableCents: 1842000,
    settlementWindow: "instant ledger",
  },
  {
    id: "rail_wire_ops",
    label: "Ops wire account",
    type: "wire",
    currency: "USD",
    status: "requires_approval",
    limitCents: 10000000,
    availableCents: 7600000,
    settlementWindow: "same day",
  },
  {
    id: "rail_agent_credits",
    label: "Agent credit facility",
    type: "usage_credit",
    currency: "USD",
    status: "ready",
    limitCents: 900000,
    availableCents: 610000,
    settlementWindow: "netted hourly",
  },
] satisfies SettlementRail[]);

export const seededUsageEvidence = usageEvidenceSchema.array().parse([
  {
    id: "usage_eval_swarm_042",
    workloadName: "Eval swarm batch 042",
    meteringBasis: "gpu_seconds",
    periodStart: "2026-05-27T08:00:00.000Z",
    periodEnd: "2026-05-27T18:00:00.000Z",
    quantity: 184320,
    unitLabel: "B200 gpu-sec",
    evidenceHash: "sha256:8c42d0f1a9bf",
    confidence: 96,
  },
  {
    id: "usage_agent_runs_may",
    workloadName: "Procurement agent runs",
    meteringBasis: "agent_task",
    periodStart: "2026-05-26T00:00:00.000Z",
    periodEnd: "2026-05-28T00:00:00.000Z",
    quantity: 382,
    unitLabel: "completed tasks",
    evidenceHash: "sha256:c71b6ea4d912",
    confidence: 91,
  },
  {
    id: "usage_rag_ingest_77",
    workloadName: "RAG ingest pipeline 77",
    meteringBasis: "hybrid",
    periodStart: "2026-05-25T12:00:00.000Z",
    periodEnd: "2026-05-27T12:00:00.000Z",
    quantity: 1,
    unitLabel: "hybrid batch",
    evidenceHash: "sha256:fe09a6b18277",
    confidence: 87,
  },
] satisfies UsageEvidence[]);

export const seededBenchmarkQuotes = benchmarkQuoteSchema.array().parse([
  {
    id: "bench_b200_spot",
    label: "B200 blended spot index",
    basis: "gpu_seconds",
    unitPriceCents: 1,
    source: "Compute desk composite",
    asOf: "2026-05-28T14:00:00.000Z",
    confidence: 82,
  },
  {
    id: "bench_agent_task",
    label: "Agent task success band",
    basis: "agent_task",
    unitPriceCents: 740,
    source: "IBY task market sample",
    asOf: "2026-05-28T15:30:00.000Z",
    confidence: 76,
  },
  {
    id: "bench_hybrid_ingest",
    label: "Hybrid ingest reference",
    basis: "hybrid",
    unitPriceCents: 128000,
    source: "Contract reference",
    asOf: "2026-05-28T11:45:00.000Z",
    confidence: 89,
  },
] satisfies BenchmarkQuote[]);

export const scenarioPresets = [
  {
    id: "ready",
    label: "Both dependencies ready",
    counterpartyIds: ["cp_nova_foundry", "cp_harbor_compute"],
    railIds: ["rail_operating_usdc", "rail_agent_credits"],
  },
  {
    id: "missing-counterparty",
    label: "Missing counterparty",
    counterpartyIds: [],
    railIds: ["rail_operating_usdc", "rail_agent_credits"],
  },
  {
    id: "missing-rail",
    label: "Missing settlement rail",
    counterpartyIds: ["cp_nova_foundry", "cp_harbor_compute"],
    railIds: [],
  },
  {
    id: "empty",
    label: "No dependencies yet",
    counterpartyIds: [],
    railIds: [],
  },
] as const;

export type ScenarioId = (typeof scenarioPresets)[number]["id"];
