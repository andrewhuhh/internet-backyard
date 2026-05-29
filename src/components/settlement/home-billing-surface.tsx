"use client";

import { useEffect } from "react";
import { useShallow } from "zustand/react/shallow";
import { Button } from "@/components/ui/button";
import { AccountSelect } from "@/components/settlement/account-select";
import { ModernBillPaymentDialog } from "@/components/settlement/modern-bill-payment-dialog/modern-bill-payment-dialog";
import { PaymentHistorySection } from "@/components/settlement/payment-ledger";
import type { SettlementRail } from "@/lib/settlement/schema";
import {
  selectAccountBalanceCents,
  selectActiveRail,
  selectAvailableRails,
  useSettlementStore,
} from "@/lib/settlement/store";

function formatUsd(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

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
  const setActiveAccount = useSettlementStore((state) => state.setActiveAccount);
  const rails = useSettlementStore(useShallow(selectAvailableRails));
  const rail = useSettlementStore(selectActiveRail);
  const balanceCents = useSettlementStore((state) =>
    selectAccountBalanceCents(state, state.draft.railId),
  );
  const accountReceipts = receipts.filter((receipt) => receipt.railId === activeRailId);
  const pendingReceipts = accountReceipts.filter((receipt) => receipt.status === "queued_review");
  const pendingCents = pendingReceipts.reduce((sum, receipt) => sum + receipt.amountCents, 0);

  useEffect(() => {
    const firstRailId = rails[0]?.id;
    if (!firstRailId) return;
    if (!rails.some((item) => item.id === activeRailId)) {
      setActiveAccount(firstRailId);
    }
  }, [activeRailId, rails, setActiveAccount]);

  if (rails.length === 0) {
    return (
      <p className="max-w-sm text-center text-sm text-muted-foreground">
        No funding accounts are available in this scenario.
      </p>
    );
  }

  return (
    <div className="flex w-full max-w-sm flex-col gap-8 mt-[30vh]">
      <header className="space-y-8 text-center">
        <div className="flex justify-center">
          <AccountSelect value={activeRailId} rails={rails} onValueChange={setActiveAccount} />
        </div>
        <div className="space-y-2">
          <p className="text-6xl font-semibold tracking-tight tabular-nums">{formatUsd(balanceCents)}</p>
          {rail ? (
            <p className="text-sm text-muted-foreground">
              {accountSubtitle(rail, pendingReceipts.length, pendingCents)}
            </p>
          ) : null}
        </div>
   
      </header>

      <ModernBillPaymentDialog
        trigger={
          <Button type="button" className="h-11 w-full rounded-xl text-base font-medium">
            Send money
          </Button>
        }
      />

      {accountReceipts.length > 0 ? <PaymentHistorySection railId={activeRailId} /> : null}
    </div>
  );
}
