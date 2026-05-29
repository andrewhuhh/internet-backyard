"use client";

import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { downloadSettlementInvoice } from "@/lib/settlement/download-invoice";
import type { SettlementReceipt } from "@/lib/settlement/schema";
import {
  selectAllCounterparties,
  selectAllRails,
  useSettlementStore,
} from "@/lib/settlement/store";
import { cn } from "@/lib/utils";
import { ReceiptConfirmView } from "./receipt-confirm-view";
import {
  captionMutedClass,
  iconButtonClass,
  mbpScrollClass,
  primaryButtonClass,
  shellClass,
} from "./styles";

type ReceiptDetailDialogProps = {
  receipt: SettlementReceipt | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ReceiptDetailDialog({ receipt, open, onOpenChange }: ReceiptDetailDialogProps) {
  const counterpartyId = receipt?.counterpartyId;
  const railId = receipt?.railId;

  const counterparty = useSettlementStore((state) =>
    counterpartyId
      ? selectAllCounterparties(state).find((item) => item.id === counterpartyId)
      : undefined,
  );
  const rail = useSettlementStore((state) =>
    railId ? selectAllRails(state).find((item) => item.id === railId) : undefined,
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className={shellClass}>
        <DialogTitle className="sr-only">Payment details</DialogTitle>
        <div className={cn("flex h-12 shrink-0 items-center justify-between px-4 pt-2", captionMutedClass)}>
          <div className="size-7" aria-hidden />
          <div className="text-mbp-body">Payment details</div>
          <Button
            variant="link"
            className={iconButtonClass}
            onClick={() => onOpenChange(false)}
            type="button"
            aria-label="Close"
          >
            <X className="size-4" />
          </Button>
        </div>

        <div className={cn(mbpScrollClass, "flex-1 px-4 pb-4")}>
          {receipt ? (
            <ReceiptConfirmView receipt={receipt} rail={rail} counterparty={counterparty} />
          ) : null}
        </div>

        <div className="shrink-0 border-t border-mbp-border-subtle px-4 py-3">
          <Button
            variant="ghost"
            type="button"
            disabled={!receipt}
            className={cn(primaryButtonClass, "gap-2")}
            onClick={() => {
              if (!receipt) return;
              downloadSettlementInvoice({ receipt, rail, counterparty });
            }}
          >
            <Download className="size-4" aria-hidden />
            Download invoice
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
