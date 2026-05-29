import {
  settlementNetworkSchema,
  type SettlementNetwork,
} from "@/lib/settlement/schema";

export const SETTLEMENT_NETWORK_CATALOG: ReadonlyArray<{
  value: SettlementNetwork;
  label: string;
}> = [
  { value: "iby_verified_vendors", label: "IBY verified vendors" },
  { value: "agent_task_marketplace", label: "Agent task marketplace" },
  { value: "spot_gpu_desk", label: "Spot GPU desk" },
];

export const SETTLEMENT_NETWORK_OPTIONS = settlementNetworkSchema.options.map((value) => ({
  value,
  label: settlementNetworkLabel(value),
}));

export function settlementNetworkLabel(network: SettlementNetwork): string {
  return (
    SETTLEMENT_NETWORK_CATALOG.find((entry) => entry.value === network)?.label ?? network
  );
}
