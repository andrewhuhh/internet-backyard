"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  seededBenchmarkQuotes,
  seededCounterparties,
  seededRails,
  seededUsageEvidence,
  type ScenarioId,
} from "./seed";
import {
  counterpartySchema,
  settlementIntentSchema,
  settlementRailSchema,
  type BenchmarkQuote,
  type Counterparty,
  type CounterpartyType,
  type RailType,
  type SettlementIntent,
  type SettlementRail,
  type SettlementReceipt,
  type UsageEvidence,
} from "./schema";

type FlowStep =
  | "compose"
  | "counterparty"
  | "rail"
  | "review"
  | "submitting"
  | "success"
  | "failed";

type Draft = SettlementIntent;

type StoreState = {
  scenarioId: ScenarioId;
  step: FlowStep;
  direction: 1 | -1;
  seededCounterparties: Counterparty[];
  seededRails: SettlementRail[];
  localCounterparties: Counterparty[];
  localRails: SettlementRail[];
  usageEvidence: UsageEvidence[];
  benchmarkQuotes: BenchmarkQuote[];
  receipts: SettlementReceipt[];
  draft: Draft;
  lastError: string | null;
  setScenario: (scenarioId: ScenarioId) => void;
  setStep: (step: FlowStep, direction?: 1 | -1) => void;
  updateDraft: (patch: Partial<Draft>) => void;
  addCounterparty: (input: {
    displayName: string;
    type: CounterpartyType;
    network: string;
    externalRef: string;
  }) => Counterparty;
  addRail: (input: {
    label: string;
    type: RailType;
    currency: string;
    availableCents: number;
  }) => SettlementRail;
  validateDraft: () => { ok: true; value: Draft } | { ok: false; message: string };
  submit: () => Promise<void>;
  resetFailure: () => void;
};

const initialDraft: Draft = {
  counterpartyId: "cp_nova_foundry",
  railId: "rail_operating_usdc",
  usageEvidenceId: "usage_eval_swarm_042",
  benchmarkQuoteId: "bench_b200_spot",
  amountCents: 184300,
  currency: "USD",
  memo: "Settle verified B200 eval swarm usage against benchmark context.",
  reviewMode: "standard",
};

const scenarioAvailability: Record<ScenarioId, { counterpartyIds: string[]; railIds: string[] }> = {
  ready: {
    counterpartyIds: ["cp_nova_foundry", "cp_orchid_agents", "cp_harbor_compute"],
    railIds: ["rail_operating_usdc", "rail_wire_ops", "rail_agent_credits"],
  },
  "missing-counterparty": {
    counterpartyIds: [],
    railIds: ["rail_operating_usdc", "rail_agent_credits"],
  },
  "missing-rail": {
    counterpartyIds: ["cp_nova_foundry", "cp_harbor_compute"],
    railIds: [],
  },
  empty: {
    counterpartyIds: [],
    railIds: [],
  },
};

export const useSettlementStore = create<StoreState>()(
  persist(
    (set, get) => ({
      scenarioId: "ready",
      step: "compose",
      direction: 1,
      seededCounterparties,
      seededRails,
      localCounterparties: [],
      localRails: [],
      usageEvidence: seededUsageEvidence,
      benchmarkQuotes: seededBenchmarkQuotes,
      receipts: [],
      draft: initialDraft,
      lastError: null,
      setScenario: (scenarioId) => {
        const availability = scenarioAvailability[scenarioId];
        set({
          scenarioId,
          step: "compose",
          direction: 1,
          lastError: null,
          draft: {
            ...get().draft,
            counterpartyId: availability.counterpartyIds[0] ?? "",
            railId: availability.railIds[0] ?? "",
          },
        });
      },
      setStep: (step, direction = 1) => set({ step, direction, lastError: null }),
      updateDraft: (patch) => set({ draft: { ...get().draft, ...patch }, lastError: null }),
      addCounterparty: (input) => {
        const counterparty = counterpartySchema.parse({
          id: `cp_local_${Date.now()}`,
          displayName: input.displayName,
          type: input.type,
          riskTier: "medium",
          status: "pending_review",
          network: input.network,
          externalRef: input.externalRef,
        });

        set({
          localCounterparties: [...get().localCounterparties, counterparty],
          draft: { ...get().draft, counterpartyId: counterparty.id },
          step: "compose",
          direction: -1,
          lastError: null,
        });
        return counterparty;
      },
      addRail: (input) => {
        const rail = settlementRailSchema.parse({
          id: `rail_local_${Date.now()}`,
          label: input.label,
          type: input.type,
          currency: input.currency.toUpperCase(),
          status: input.type === "bank_account" ? "requires_microdeposit" : "ready",
          limitCents: Math.max(input.availableCents, 500000),
          availableCents: input.availableCents,
          settlementWindow: input.type === "wire" ? "same day" : "demo instant",
        });

        set({
          localRails: [...get().localRails, rail],
          draft: { ...get().draft, railId: rail.id, currency: rail.currency },
          step: "compose",
          direction: -1,
          lastError: null,
        });
        return rail;
      },
      validateDraft: () => {
        const result = settlementIntentSchema.safeParse(get().draft);
        if (!result.success) {
          return {
            ok: false,
            message: result.error.issues[0]?.message ?? "Settlement intent is invalid.",
          };
        }

        const { counterparty, rail } = selectResolvedDependencies(get());
        if (!counterparty) return { ok: false, message: "Resolve a counterparty before review." };
        if (!rail) return { ok: false, message: "Resolve a settlement rail before review." };
        if (counterparty.status === "blocked") return { ok: false, message: "Counterparty is blocked." };
        if (rail.status === "suspended") return { ok: false, message: "Settlement rail is suspended." };
        if (result.data.amountCents > rail.availableCents) {
          return { ok: false, message: "Amount exceeds available rail balance." };
        }
        if (result.data.amountCents > rail.limitCents) {
          return { ok: false, message: "Amount exceeds this rail's transfer limit." };
        }
        return { ok: true, value: result.data };
      },
      submit: async () => {
        const validation = get().validateDraft();
        if (!validation.ok) {
          set({ step: "failed", direction: 1, lastError: validation.message });
          return;
        }

        set({ step: "submitting", direction: 1, lastError: null });
        await new Promise((resolve) => setTimeout(resolve, 900));

        const shouldFail = validation.value.reviewMode === "expedited" && validation.value.amountCents > 150000;
        if (shouldFail) {
          set({
            step: "failed",
            direction: 1,
            lastError: "Expedited settlement tripped benchmark variance review.",
          });
          return;
        }

        const receipt: SettlementReceipt = {
          ...validation.value,
          id: `set_${Date.now()}`,
          status: validation.value.reviewMode === "manual_review" ? "queued_review" : "settled",
          createdAt: new Date().toISOString(),
          auditRef: `IBY-${Math.random().toString(16).slice(2, 10).toUpperCase()}`,
        };

        set({
          receipts: [receipt, ...get().receipts].slice(0, 8),
          step: "success",
          direction: 1,
          lastError: null,
        });
      },
      resetFailure: () => set({ step: "compose", direction: -1, lastError: null }),
    }),
    {
      name: "internet-backyard-settlement-demo",
      partialize: (state) => ({
        localCounterparties: state.localCounterparties,
        localRails: state.localRails,
        receipts: state.receipts,
      }),
    },
  ),
);

export function selectAvailableCounterparties(state: StoreState) {
  const availability = scenarioAvailability[state.scenarioId];
  return [
    ...state.seededCounterparties.filter((item) => availability.counterpartyIds.includes(item.id)),
    ...state.localCounterparties,
  ];
}

export function selectAvailableRails(state: StoreState) {
  const availability = scenarioAvailability[state.scenarioId];
  return [
    ...state.seededRails.filter((item) => availability.railIds.includes(item.id)),
    ...state.localRails,
  ];
}

export function selectResolvedDependencies(state: StoreState) {
  const counterparties = selectAvailableCounterparties(state);
  const rails = selectAvailableRails(state);
  return {
    counterparty: counterparties.find((item) => item.id === state.draft.counterpartyId),
    rail: rails.find((item) => item.id === state.draft.railId),
  };
}

export function cents(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value / 100);
}
