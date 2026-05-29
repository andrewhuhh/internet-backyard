"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { format, isToday, isYesterday, parseISO } from "date-fns";
import { ReceiptDetailDialog } from "@/components/settlement/modern-bill-payment-dialog/receipt-detail-dialog";
import type { Counterparty, CreditTransfer, SettlementReceipt } from "@/lib/settlement/schema";
import { formatUsd } from "@/lib/settlement/format";
import {
  HOME_EVERYTHING_VIEW_ID,
  selectAllCounterparties,
  selectAllRails,
  useSettlementStore,
} from "@/lib/settlement/store";
import { cn } from "@/lib/utils";
import { useShallow } from "zustand/react/shallow";

function resolveCounterpartyName(counterparties: Counterparty[], counterpartyId: string) {
  return counterparties.find((item) => item.id === counterpartyId)?.displayName ?? "Unknown recipient";
}

function resolveRailLabel(rails: { id: string; label: string }[], railId: string) {
  return rails.find((rail) => rail.id === railId)?.label ?? "Unknown account";
}

function transferOriginLabel(transfer: CreditTransfer, rails: { id: string; label: string }[]) {
  return resolveRailLabel(rails, transfer.fromRailId);
}

function sectionLabel(date: Date) {
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "MMMM d");
}

const statusLabel: Record<SettlementReceipt["status"], string> = {
  settled: "Sent",
  queued_review: "Pending",
  scheduled: "Scheduled",
  failed: "Failed",
};

type LedgerEntry =
  | { kind: "payment"; id: string; date: Date; receipt: SettlementReceipt }
  | { kind: "transfer"; id: string; date: Date; transfer: CreditTransfer; direction: "in" | "out" };

function PaymentHistoryRow({
  title,
  subtitle,
  amountLabel,
  mutedAmount,
  onClick,
}: {
  title: string;
  subtitle: string;
  amountLabel: string;
  mutedAmount?: boolean;
  onClick?: () => void;
}) {
  const content = (
    <>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
      </div>
      <p
        className={cn(
          "shrink-0 text-sm font-medium tabular-nums",
          mutedAmount && "text-muted-foreground",
        )}
      >
        {amountLabel}
      </p>
    </>
  );

  const className = cn(
    "flex w-full items-center justify-between gap-3 rounded-xl border-b border-border/60 bg-muted p-3 text-left transition-colors last:border-0",
    onClick && "hover:bg-muted/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
  );

  if (!onClick) {
    return (
      <li>
        <div className={className}>{content}</div>
      </li>
    );
  }

  return (
    <li>
      <button type="button" onClick={onClick} className={className}>
        {content}
      </button>
    </li>
  );
}

type PaymentHistorySectionProps = {
  railId: string;
  /** When set with `HOME_EVERYTHING_VIEW_ID`, limits the aggregate view to these rails. */
  railIds?: string[];
};

const subscribeNoop = () => () => {};

export function PaymentHistorySection({ railId, railIds }: PaymentHistorySectionProps) {
  const isEverythingView = railId === HOME_EVERYTHING_VIEW_ID;
  const [selectedReceipt, setSelectedReceipt] = useState<SettlementReceipt | null>(null);
  const hydrated = useSyncExternalStore(subscribeNoop, () => true, () => false);
  const receipts = useSettlementStore((state) => state.receipts);
  const transfers = useSettlementStore((state) => state.transfers);
  const counterparties = useSettlementStore(useShallow(selectAllCounterparties));
  const allRails = useSettlementStore(useShallow(selectAllRails));

  const entries = useMemo(() => {
    const scopedRailIds = railIds ?? [];
    const matchesRail = (id: string) =>
      isEverythingView ? scopedRailIds.includes(id) : id === railId;

    const paymentEntries: LedgerEntry[] = receipts
      .filter((receipt) => matchesRail(receipt.railId))
      .map((receipt) => ({
        kind: "payment" as const,
        id: receipt.id,
        date: parseISO(receipt.scheduledFor ?? receipt.createdAt),
        receipt,
      }));

    const transferEntries: LedgerEntry[] = transfers
      .filter((transfer) => matchesRail(transfer.fromRailId) || matchesRail(transfer.toRailId))
      .map((transfer) => {
        const direction =
          isEverythingView && !matchesRail(transfer.fromRailId)
            ? ("in" as const)
            : isEverythingView && !matchesRail(transfer.toRailId)
              ? ("out" as const)
              : transfer.toRailId === railId
                ? ("in" as const)
                : ("out" as const);

        return {
          kind: "transfer" as const,
          id: transfer.id,
          date: parseISO(transfer.createdAt),
          transfer,
          direction,
        };
      });

    return [...paymentEntries, ...transferEntries].sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [receipts, transfers, railId, isEverythingView, railIds]);

  const groups = useMemo(() => {
    const map = new Map<string, LedgerEntry[]>();

    for (const entry of entries) {
      const label = sectionLabel(entry.date);
      const bucket = map.get(label) ?? [];
      bucket.push(entry);
      map.set(label, bucket);
    }

    return [...map.entries()];
  }, [entries]);

  if (!hydrated || entries.length === 0) {
    return null;
  }

  return (
    <>
      <div className="space-y-5" aria-label="Payment history">
        {groups.map(([label, items]) => (
          <section key={label}>
            <h2 className="mb-1 px-1 text-base font-medium uppercase tracking-wide text-muted-foreground">
              {label}
            </h2>
            <ul className="space-y-1">
              {items.map((entry) => {
                const dateLabel = format(entry.date, "MMM d");

                if (entry.kind === "payment") {
                  const receipt = entry.receipt;
                  const accountLabel = resolveRailLabel(allRails, receipt.railId);
                  return (
                    <PaymentHistoryRow
                      key={entry.id}
                      title={resolveCounterpartyName(counterparties, receipt.counterpartyId)}
                      subtitle={
                        isEverythingView
                          ? `${accountLabel} · ${dateLabel} · ${statusLabel[receipt.status]}`
                          : `${dateLabel} · ${statusLabel[receipt.status]}`
                      }
                      amountLabel={
                        receipt.status === "failed" || receipt.status === "scheduled"
                          ? formatUsd(receipt.amountCents)
                          : `-${formatUsd(receipt.amountCents)}`
                      }
                      mutedAmount={receipt.status === "scheduled"}
                      onClick={() => setSelectedReceipt(receipt)}
                    />
                  );
                }

                const transfer = entry.transfer;
                const peerRailId =
                  entry.direction === "in" ? transfer.fromRailId : transfer.toRailId;
                const peerLabel = resolveRailLabel(allRails, peerRailId);
                const isPendingApproval = transfer.status === "awaiting_approval";
                const accountLabel = isEverythingView ? transferOriginLabel(transfer, allRails) : null;
                const statusText = isPendingApproval
                  ? "Awaiting approval"
                  : entry.direction === "in"
                    ? "Received"
                    : "Transferred";

                return (
                  <PaymentHistoryRow
                    key={entry.id}
                    title={
                      isEverythingView
                        ? `Transfer to ${resolveRailLabel(allRails, transfer.toRailId)}`
                        : entry.direction === "in"
                          ? `Transfer from ${peerLabel}`
                          : `Transfer to ${peerLabel}`
                    }
                    subtitle={
                      isEverythingView
                        ? `${accountLabel} · ${dateLabel} · ${statusText}`
                        : isPendingApproval
                          ? `${dateLabel} · Awaiting approval`
                          : `${dateLabel} · ${statusText}`
                    }
                    amountLabel={
                      isPendingApproval
                        ? formatUsd(transfer.amountCents)
                        : entry.direction === "in"
                          ? `+${formatUsd(transfer.amountCents)}`
                          : `-${formatUsd(transfer.amountCents)}`
                    }
                    mutedAmount={isPendingApproval}
                  />
                );
              })}
            </ul>
          </section>
        ))}
      </div>
      <ReceiptDetailDialog
        receipt={selectedReceipt}
        open={selectedReceipt !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedReceipt(null);
          }
        }}
      />
    </>
  );
}
