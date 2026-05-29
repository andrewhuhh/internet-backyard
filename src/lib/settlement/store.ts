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
  type CounterpartyBankAccount,
  type CounterpartyType,
  type RailType,
  type SettlementIntent,
  type SettlementNetwork,
  type SettlementRail,
  creditTransferSchema,
  type CreditTransfer,
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
  hiddenCounterpartyIds: string[];
  localRails: SettlementRail[];
  usageEvidence: UsageEvidence[];
  benchmarkQuotes: BenchmarkQuote[];
  receipts: SettlementReceipt[];
  transfers: CreditTransfer[];
  draft: Draft;
  lastError: string | null;
  setScenario: (scenarioId: ScenarioId) => void;
  setStep: (step: FlowStep, direction?: 1 | -1) => void;
  updateDraft: (patch: Partial<Draft>) => void;
  setActiveAccount: (railId: string) => void;
  addCounterparty: (input: {
    displayName: string;
    type: CounterpartyType;
    network: SettlementNetwork;
    externalRef: string;
    bankAccount: CounterpartyBankAccount;
  }) => Counterparty;
  updateCounterparty: (
    id: string,
    input: {
      displayName: string;
      type: CounterpartyType;
      network: SettlementNetwork;
      externalRef: string;
      bankAccount: CounterpartyBankAccount;
    },
  ) => void;
  removeCounterparty: (id: string) => void;
  hideCounterparty: (id: string) => void;
  showCounterparty: (id: string) => void;
  addRail: (input: {
    label: string;
    type: RailType;
    currency: string;
    availableCents: number;
  }) => SettlementRail;
  validateDraft: () => { ok: true; value: Draft } | { ok: false; message: string };
  submit: (options?: { scheduledFor?: Date }) => Promise<void>;
  transferCredit: (input: {
    fromRailId: string;
    toRailId: string;
    amountCents: number;
    memo?: string;
  }) => Promise<{ ok: true; transfer: CreditTransfer } | { ok: false; message: string }>;
  resetFailure: () => void;
};

const initialDraft: Draft = {
  counterpartyId: "cp_nova_foundry",
  railId: "rail_operating_usdc",
  usageEvidenceId: "usage_eval_swarm_042",
  benchmarkQuoteId: "bench_b200_spot",
  amountCents: 184300,
  currency: "USD",
  memo: "",
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
      hiddenCounterpartyIds: [],
      localRails: [],
      usageEvidence: seededUsageEvidence,
      benchmarkQuotes: seededBenchmarkQuotes,
      receipts: [],
      transfers: [],
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
      setActiveAccount: (railId) => {
        const rail =
          selectAvailableRails(get()).find((item) => item.id === railId) ??
          selectAllRails(get()).find((item) => item.id === railId);
        if (!rail) return;
        set({
          draft: { ...get().draft, railId: rail.id, currency: rail.currency },
          lastError: null,
        });
      },
      addCounterparty: (input) => {
        const counterparty = counterpartySchema.parse({
          id: `cp_local_${Date.now()}`,
          displayName: input.displayName,
          type: input.type,
          riskTier: "medium",
          status: "pending_review",
          network: input.network,
          externalRef: input.externalRef,
          bankAccount: input.bankAccount,
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
      updateCounterparty: (id, input) => {
        const current = get();
        const isLocal = current.localCounterparties.some((item) => item.id === id);
        const base = isLocal
          ? current.localCounterparties.find((item) => item.id === id)
          : current.seededCounterparties.find((item) => item.id === id);

        if (!base) {
          return;
        }

        const counterparty = counterpartySchema.parse({
          ...base,
          displayName: input.displayName,
          type: input.type,
          network: input.network,
          externalRef: input.externalRef,
          bankAccount: input.bankAccount,
        });

        set({
          localCounterparties: isLocal
            ? current.localCounterparties.map((item) => (item.id === id ? counterparty : item))
            : [...current.localCounterparties, counterparty],
          lastError: null,
        });
      },
      removeCounterparty: (id) => {
        const current = get();
        const isLocal = current.localCounterparties.some((item) => item.id === id);
        const localCounterparties = isLocal
          ? current.localCounterparties.filter((item) => item.id !== id)
          : current.localCounterparties;
        const hidden = current.hiddenCounterpartyIds ?? [];
        const hiddenCounterpartyIds =
          !isLocal && !hidden.includes(id) ? [...hidden, id] : hidden;

        const nextState = {
          ...current,
          localCounterparties,
          hiddenCounterpartyIds,
        };
        const draft =
          current.draft.counterpartyId === id
            ? {
                ...current.draft,
                counterpartyId: selectAvailableCounterparties(nextState)[0]?.id ?? "",
              }
            : current.draft;

        set({
          localCounterparties,
          hiddenCounterpartyIds,
          draft,
          lastError: null,
        });
      },
      hideCounterparty: (id) => {
        const current = get();
        const hidden = current.hiddenCounterpartyIds ?? [];
        if (hidden.includes(id)) {
          return;
        }

        const hiddenCounterpartyIds = [...hidden, id];
        const nextState = { ...current, hiddenCounterpartyIds };
        const draft =
          current.draft.counterpartyId === id
            ? {
                ...current.draft,
                counterpartyId: selectAvailableCounterparties(nextState)[0]?.id ?? "",
              }
            : current.draft;

        set({ hiddenCounterpartyIds, draft, lastError: null });
      },
      showCounterparty: (id) => {
        const current = get();
        set({
          hiddenCounterpartyIds: (current.hiddenCounterpartyIds ?? []).filter((item) => item !== id),
          lastError: null,
        });
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
        if (result.data.amountCents > selectAccountBalanceCents(get(), rail.id)) {
          return { ok: false, message: "Amount exceeds available rail balance." };
        }
        if (result.data.amountCents > rail.limitCents) {
          return { ok: false, message: "Amount exceeds this rail's transfer limit." };
        }
        return { ok: true, value: result.data };
      },
      submit: async (options) => {
        const validation = get().validateDraft();
        if (!validation.ok) {
          set({ step: "failed", direction: 1, lastError: validation.message });
          return;
        }

        const scheduledForDate = options?.scheduledFor;
        if (scheduledForDate) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const scheduledDay = new Date(scheduledForDate);
          scheduledDay.setHours(0, 0, 0, 0);
          if (scheduledDay < today) {
            set({
              step: "failed",
              direction: 1,
              lastError: "Scheduled date must be today or later.",
            });
            return;
          }
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

        const scheduledForIso = scheduledForDate
          ? (() => {
              const day = new Date(scheduledForDate);
              day.setHours(12, 0, 0, 0);
              return day.toISOString();
            })()
          : undefined;

        const receipt: SettlementReceipt = {
          ...validation.value,
          id: `set_${Date.now()}`,
          status: scheduledForIso
            ? "scheduled"
            : validation.value.reviewMode === "manual_review"
              ? "queued_review"
              : "settled",
          scheduledFor: scheduledForIso,
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
      transferCredit: async (input) => {
        const state = get();
        const rails = selectAvailableRails(state);
        const fromRail = rails.find((item) => item.id === input.fromRailId);
        const toRail = rails.find((item) => item.id === input.toRailId);

        if (!fromRail || !toRail) {
          return { ok: false, message: "Select valid source and destination accounts." };
        }
        if (fromRail.id === toRail.id) {
          return { ok: false, message: "Source and destination must be different accounts." };
        }
        if (fromRail.currency !== toRail.currency) {
          return { ok: false, message: "Accounts must use the same currency." };
        }
        if (fromRail.status === "suspended" || toRail.status === "suspended") {
          return { ok: false, message: "One or both accounts are suspended." };
        }
        if (!isTransferEligibleRail(fromRail)) {
          return { ok: false, message: "Source account cannot send transfers." };
        }
        if (!isTransferEligibleRail(toRail)) {
          return { ok: false, message: "Destination account cannot receive transfers." };
        }

        const parsed = creditTransferSchema
          .omit({ id: true, status: true, createdAt: true, auditRef: true })
          .safeParse({
            fromRailId: input.fromRailId,
            toRailId: input.toRailId,
            amountCents: input.amountCents,
            currency: fromRail.currency,
            memo: input.memo?.trim() ?? "",
          });

        if (!parsed.success) {
          return {
            ok: false,
            message: parsed.error.issues[0]?.message ?? "Transfer details are invalid.",
          };
        }

        if (parsed.data.amountCents > selectAccountBalanceCents(state, fromRail.id)) {
          return { ok: false, message: "Amount exceeds available balance on the source account." };
        }
        if (parsed.data.amountCents > fromRail.limitCents) {
          return { ok: false, message: "Amount exceeds this account's transfer limit." };
        }

        await new Promise((resolve) => setTimeout(resolve, 600));

        const transfer: CreditTransfer = creditTransferSchema.parse({
          ...parsed.data,
          id: `xfer_${Date.now()}`,
          status: transferRequiresApproval(fromRail, toRail) ? "awaiting_approval" : "settled",
          createdAt: new Date().toISOString(),
          auditRef: `IBY-XFER-${Math.random().toString(16).slice(2, 8).toUpperCase()}`,
        });

        set({
          transfers: [transfer, ...get().transfers].slice(0, 24),
          lastError: null,
        });

        return { ok: true, transfer };
      },
      resetFailure: () => set({ step: "compose", direction: -1, lastError: null }),
    }),
    {
      name: "internet-backyard-settlement-demo",
      partialize: (state) => ({
        localCounterparties: state.localCounterparties,
        hiddenCounterpartyIds: state.hiddenCounterpartyIds,
        localRails: state.localRails,
        receipts: state.receipts,
        transfers: state.transfers,
      }),
    },
  ),
);

export function isTransferEligibleRail(rail: SettlementRail) {
  return rail.status === "ready" || rail.status === "requires_approval";
}

export function transferRequiresApproval(fromRail: SettlementRail, toRail: SettlementRail) {
  return fromRail.status === "requires_approval" || toRail.status === "requires_approval";
}

export function selectTransferableRails(state: StoreState) {
  return selectAvailableRails(state).filter(isTransferEligibleRail);
}

export function isCounterpartyHidden(state: StoreState, id: string) {
  return (state.hiddenCounterpartyIds ?? []).includes(id);
}

/** Recipients in the manage view (includes hidden). */
export function selectManageableCounterparties(state: StoreState) {
  const availability = scenarioAvailability[state.scenarioId];
  const localIds = new Set(state.localCounterparties.map((item) => item.id));
  return [
    ...state.seededCounterparties.filter(
      (item) => availability.counterpartyIds.includes(item.id) && !localIds.has(item.id),
    ),
    ...state.localCounterparties,
  ];
}

/** Visible recipients for payment picker (mini select). */
export function selectAvailableCounterparties(state: StoreState) {
  const hidden = new Set(state.hiddenCounterpartyIds ?? []);
  return selectManageableCounterparties(state).filter((item) => !hidden.has(item.id));
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

export function selectActiveRail(state: StoreState) {
  return selectAvailableRails(state).find((item) => item.id === state.draft.railId);
}

/** All counterparties for ledger/history (includes hidden and out-of-scenario). */
export function selectAllCounterparties(state: StoreState) {
  const localIds = new Set(state.localCounterparties.map((item) => item.id));
  return [
    ...state.seededCounterparties.filter((item) => !localIds.has(item.id)),
    ...state.localCounterparties,
  ];
}

/** All rails for ledger/history (includes out-of-scenario). */
export function selectAllRails(state: StoreState) {
  return [...state.seededRails, ...state.localRails];
}

export function resolveCounterpartyName(state: StoreState, counterpartyId: string) {
  return (
    selectAllCounterparties(state).find((item) => item.id === counterpartyId)?.displayName ??
    "Unknown recipient"
  );
}

export function resolveRailLabel(state: StoreState, railId: string) {
  return selectAllRails(state).find((item) => item.id === railId)?.label ?? "Unknown source";
}

export function selectAccountSpentCents(state: StoreState, railId: string) {
  const payments = state.receipts
    .filter((receipt) => receipt.railId === railId && receipt.status === "settled")
    .reduce((sum, receipt) => sum + receipt.amountCents, 0);
  const outbound = state.transfers
    .filter((transfer) => transfer.fromRailId === railId && transfer.status === "settled")
    .reduce((sum, transfer) => sum + transfer.amountCents, 0);
  return payments + outbound;
}

export function selectAccountReceivedCents(state: StoreState, railId: string) {
  return state.transfers
    .filter((transfer) => transfer.toRailId === railId && transfer.status === "settled")
    .reduce((sum, transfer) => sum + transfer.amountCents, 0);
}

export function selectAccountBalanceCents(state: StoreState, railId: string) {
  const rail =
    selectAvailableRails(state).find((item) => item.id === railId) ??
    selectAllRails(state).find((item) => item.id === railId);
  if (!rail) return 0;
  return Math.max(
    0,
    rail.availableCents - selectAccountSpentCents(state, railId) + selectAccountReceivedCents(state, railId),
  );
}

/** Home-only aggregate view across all listed rails. */
export const HOME_EVERYTHING_VIEW_ID = "__everything__";

export function selectTotalBalanceCents(state: StoreState, railIds: string[]) {
  return railIds.reduce((sum, railId) => sum + selectAccountBalanceCents(state, railId), 0);
}

export function cents(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value / 100);
}
