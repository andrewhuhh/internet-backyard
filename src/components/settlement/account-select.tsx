"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SettlementRail } from "@/lib/settlement/schema";
import { cn } from "@/lib/utils";

function formatUsd(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

type AccountSelectProps = {
  value: string;
  rails: SettlementRail[];
  onValueChange: (railId: string) => void;
};

export function AccountSelect({ value, rails, onValueChange }: AccountSelectProps) {
  const selected = rails.find((item) => item.id === value);

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
          {selected ? `${selected.label} (${selected.currency})` : "Select account"}
        </SelectValue>
      </SelectTrigger>
      <SelectContent align="center" className="min-w-(--radix-select-trigger-width)">
        {rails.map((item) => (
          <SelectItem key={item.id} value={item.id}>
            <div className="flex flex-col items-start gap-0.5 py-0.5">
              <span className="font-medium leading-tight">
                {item.label} ({item.currency})
              </span>
              <span className="text-xs text-muted-foreground">
                {formatUsd(item.availableCents)} available
              </span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
