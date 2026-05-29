"use client";

import { useMemo, useSyncExternalStore } from "react";
import { format, isToday, isYesterday, parseISO } from "date-fns";
import type { Counterparty, SettlementReceipt } from "@/lib/settlement/schema";
import { selectAllCounterparties, useSettlementStore } from "@/lib/settlement/store";
import { useShallow } from "zustand/react/shallow";

function formatUsd(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

function resolveCounterpartyName(counterparties: Counterparty[], counterpartyId: string) {
  return counterparties.find((item) => item.id === counterpartyId)?.displayName ?? "Unknown recipient";
}

function sectionLabel(date: Date) {
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "MMMM d");
}

const statusLabel: Record<SettlementReceipt["status"], string> = {
  settled: "Sent",
  queued_review: "Pending",
  failed: "Failed",
};

function PaymentHistoryRow({
  receipt,
  counterpartyName,
}: {
  receipt: SettlementReceipt;
  counterpartyName: string;
}) {
  const dateLabel = format(parseISO(receipt.createdAt), "MMM d");

  return (
    <li className="flex items-center justify-between gap-3 border-b border-border/60 p-3 last:border-0 bg-muted rounded-xl">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{counterpartyName}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {dateLabel} · {statusLabel[receipt.status]}
        </p>
      </div>
      <p className="shrink-0 text-sm font-medium tabular-nums">
        {receipt.status === "failed" ? formatUsd(receipt.amountCents) : `-${formatUsd(receipt.amountCents)}`}
      </p>
    </li>
  );
}

type PaymentHistorySectionProps = {
  railId: string;
};

const subscribeNoop = () => () => {};

export function PaymentHistorySection({ railId }: PaymentHistorySectionProps) {
  const hydrated = useSyncExternalStore(subscribeNoop, () => true, () => false);
  const receipts = useSettlementStore((state) => state.receipts);
  const counterparties = useSettlementStore(useShallow(selectAllCounterparties));
  const accountReceipts = useMemo(
    () => receipts.filter((receipt) => receipt.railId === railId),
    [receipts, railId],
  );

  const groups = useMemo(() => {
    const sorted = [...accountReceipts].sort(
      (a, b) => parseISO(b.createdAt).getTime() - parseISO(a.createdAt).getTime(),
    );
    const map = new Map<string, SettlementReceipt[]>();

    for (const receipt of sorted) {
      const label = sectionLabel(parseISO(receipt.createdAt));
      const bucket = map.get(label) ?? [];
      bucket.push(receipt);
      map.set(label, bucket);
    }

    return [...map.entries()];
  }, [accountReceipts]);

  if (!hydrated || accountReceipts.length === 0) {
    return null;
  }

  return (
    <div className="space-y-5" aria-label="Payment history">
      {groups.map(([label, items]) => (
        <section key={label}>
          <h2 className="mb-1 text-base font-medium uppercase tracking-wide text-muted-foreground px-1">
            {label}
          </h2>
          <ul>
            {items.map((receipt) => (
              <PaymentHistoryRow
                key={receipt.id}
                receipt={receipt}
                counterpartyName={resolveCounterpartyName(counterparties, receipt.counterpartyId)}
              />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
