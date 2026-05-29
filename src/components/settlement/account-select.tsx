"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatUsd } from "@/lib/settlement/format";
import type { SettlementRail } from "@/lib/settlement/schema";
import {
  HOME_EVERYTHING_VIEW_ID,
  selectAccountBalanceCents,
  selectTotalBalanceCents,
  useSettlementStore,
} from "@/lib/settlement/store";
import { cn } from "@/lib/utils";
import { useShallow } from "zustand/react/shallow";

type AccountSelectProps = {
  value: string;
  rails: SettlementRail[];
  onValueChange: (railId: string) => void;
  /** Home screen only — adds an aggregate "Everything" option at the top of the list. */
  includeEverythingOption?: boolean;
};

export function AccountSelect({
  value,
  rails,
  onValueChange,
  includeEverythingOption = false,
}: AccountSelectProps) {
  const selected = rails.find((item) => item.id === value);
  const isEverythingView = includeEverythingOption && value === HOME_EVERYTHING_VIEW_ID;
  const balancesByRailId = useSettlementStore(
    useShallow((state) =>
      Object.fromEntries(rails.map((item) => [item.id, selectAccountBalanceCents(state, item.id)])),
    ),
  );
  const totalBalanceCents = useSettlementStore((state) =>
    includeEverythingOption ? selectTotalBalanceCents(state, rails.map((item) => item.id)) : 0,
  );

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger
        aria-label="Switch account"
        className={cn(
          "h-10 min-w-48 max-w-full rounded-lg border-0 bg-secondary/80 px-3",
          "font-medium shadow-none hover:bg-secondary",
          "focus-visible:bg-secondary focus-visible:ring-2 focus-visible:ring-ring",
        )}
      >
        <SelectValue placeholder="Select account">
          {isEverythingView
            ? "Everything"
            : selected
              ? `${selected.label} (${selected.currency})`
              : "Select account"}
        </SelectValue>
      </SelectTrigger>
      <SelectContent align="center" className="min-w-(--radix-select-trigger-width)">
        {includeEverythingOption ? (
          <SelectItem value={HOME_EVERYTHING_VIEW_ID}>
            <div className="flex flex-col items-start gap-0.5 py-0.5">
              <span className="font-medium leading-tight">Everything</span>
              <span className="text-xs text-muted-foreground">
                {formatUsd(totalBalanceCents)} available
              </span>
            </div>
          </SelectItem>
        ) : null}
        {rails.map((item) => (
          <SelectItem key={item.id} value={item.id}>
            <div className="flex flex-col items-start gap-0.5 py-0.5">
              <span className="font-medium leading-tight">
                {item.label} ({item.currency})
              </span>
              <span className="text-xs text-muted-foreground">
                {formatUsd(balancesByRailId[item.id] ?? 0)} available
              </span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
