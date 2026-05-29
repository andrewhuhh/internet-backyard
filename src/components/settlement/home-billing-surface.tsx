"use client";

import { useEffect, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { Button } from "@/components/ui/button";
import { AccountSelect } from "@/components/settlement/account-select";
import { ModernBillPaymentDialog } from "@/components/settlement/modern-bill-payment-dialog/modern-bill-payment-dialog";
import { PaymentHistorySection } from "@/components/settlement/payment-ledger";
import { TransferMoneyDialog } from "@/components/settlement/transfer-money-dialog";
import type { SettlementRail } from "@/lib/settlement/schema";
import {
  HOME_EVERYTHING_VIEW_ID,
  selectAccountBalanceCents,
  selectAvailableRails,
  selectTotalBalanceCents,
  useSettlementStore,
} from "@/lib/settlement/store";
import { formatUsd } from "@/lib/settlement/format";

function humanizeSettlementWindow(window: string) {
  if (window.includes("instant")) return "Instant";
  if (window.includes("same day")) return "Same day";
  if (window.includes("hourly")) return "Hourly";
  return window.charAt(0).toUpperCase() + window.slice(1);
}

function accountSubtitle(rail: SettlementRail, pendingCount: number, pendingCents: number) {
  if (rail.status === "suspended") return "Transfers suspended";
  if (rail.status === "requires_microdeposit") return "Verify account to send";
  if (rail.status === "requires_approval") return "Transfers require approval";
  if (pendingCount > 0) {
    const label = pendingCount === 1 ? "payment" : "payments";
    return `${pendingCount} pending ${label} · ${formatUsd(pendingCents)}`;
  }
  return `${humanizeSettlementWindow(rail.settlementWindow)} · Up to ${formatUsd(rail.limitCents)} per transfer`;
}

export function HomeBillingSurface() {
  const activeRailId = useSettlementStore((state) => state.draft.railId);
  const receipts = useSettlementStore((state) => state.receipts);
  const transfers = useSettlementStore((state) => state.transfers);
  const setActiveAccount = useSettlementStore((state) => state.setActiveAccount);
  const rails = useSettlementStore(useShallow(selectAvailableRails));
  const railIds = rails.map((item) => item.id);
  const [homeViewId, setHomeViewId] = useState(HOME_EVERYTHING_VIEW_ID);
  const isEverythingView = homeViewId === HOME_EVERYTHING_VIEW_ID;
  const balanceCents = useSettlementStore((state) =>
    isEverythingView
      ? selectTotalBalanceCents(state, railIds)
      : selectAccountBalanceCents(state, homeViewId),
  );
  const accountReceipts = isEverythingView
    ? receipts.filter((receipt) => railIds.includes(receipt.railId))
    : receipts.filter((receipt) => receipt.railId === homeViewId);
  const pendingReceipts = accountReceipts.filter(
    (receipt) => receipt.status === "queued_review" || receipt.status === "scheduled",
  );
  const pendingCents = pendingReceipts.reduce((sum, receipt) => sum + receipt.amountCents, 0);
  const selectedRail = isEverythingView ? null : rails.find((item) => item.id === homeViewId);

  useEffect(() => {
    const firstRailId = rails[0]?.id;
    if (!firstRailId) return;
    if (!rails.some((item) => item.id === activeRailId)) {
      setActiveAccount(firstRailId);
    }
  }, [activeRailId, rails, setActiveAccount]);

  function handleAccountChange(nextViewId: string) {
    setHomeViewId(nextViewId);
    if (nextViewId !== HOME_EVERYTHING_VIEW_ID) {
      setActiveAccount(nextViewId);
    }
  }

  if (rails.length === 0) {
    return (
      <p className="max-w-sm text-center text-sm text-muted-foreground">
        No funding accounts are available in this scenario.
      </p>
    );
  }

  return (
    <div className="flex w-full max-w-sm flex-col gap-8 mt-[20vh]">
      <header className="space-y-8 text-center">
        <div className="flex justify-center">
          <AccountSelect
            value={homeViewId}
            rails={rails}
            includeEverythingOption
            onValueChange={handleAccountChange}
          />
        </div>
        <div className="space-y-2">
          <p className="text-6xl font-semibold tracking-tight tabular-nums">
            {formatUsd(balanceCents)}
          </p>
          {isEverythingView ? (
            <p className="text-sm text-muted-foreground">
              {pendingReceipts.length > 0
                ? `${pendingReceipts.length} pending ${pendingReceipts.length === 1 ? "payment" : "payments"} · ${formatUsd(pendingCents)}`
                : `${rails.length} accounts`}
            </p>
          ) : selectedRail ? (
            <p className="text-sm text-muted-foreground">
              {accountSubtitle(selectedRail, pendingReceipts.length, pendingCents)}
            </p>
          ) : null}
        </div>
   
      </header>

      <div className="flex flex-col gap-2">
        <ModernBillPaymentDialog
          trigger={
            <Button type="button" className="h-11 w-full rounded-xl text-base font-medium">
              Send money
            </Button>
          }
        />
        <TransferMoneyDialog
          defaultFromRailId={isEverythingView ? activeRailId : homeViewId}
          trigger={
            <Button
              type="button"
              variant="outline"
              className="h-11 w-full rounded-xl text-base font-medium"
            >
              Transfer money
            </Button>
          }
        />
      </div>

      {accountReceipts.length > 0 ||
      (isEverythingView
        ? transfers.some(
            (transfer) =>
              railIds.includes(transfer.fromRailId) || railIds.includes(transfer.toRailId),
          )
        : transfers.some(
            (transfer) => transfer.fromRailId === homeViewId || transfer.toRailId === homeViewId,
          )) ? (
        <PaymentHistorySection
          railId={isEverythingView ? HOME_EVERYTHING_VIEW_ID : homeViewId}
          railIds={isEverythingView ? railIds : undefined}
        />
      ) : null}
    </div>
  );
}
