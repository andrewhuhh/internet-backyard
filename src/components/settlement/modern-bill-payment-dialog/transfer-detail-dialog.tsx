"use client";

import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { downloadTransferReceipt } from "@/lib/settlement/download-transfer-receipt";
import type { CreditTransfer } from "@/lib/settlement/schema";
import { selectAllRails, useSettlementStore } from "@/lib/settlement/store";
import { cn } from "@/lib/utils";
import {
  captionMutedClass,
  iconButtonClass,
  mbpScrollClass,
  primaryButtonClass,
  shellClass,
} from "./styles";
import { TransferConfirmView } from "./transfer-confirm-view";

type TransferDetailDialogProps = {
  transfer: CreditTransfer | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function TransferDetailDialog({ transfer, open, onOpenChange }: TransferDetailDialogProps) {
  const fromRailId = transfer?.fromRailId;
  const toRailId = transfer?.toRailId;

  const fromRail = useSettlementStore((state) =>
    fromRailId ? selectAllRails(state).find((item) => item.id === fromRailId) : undefined,
  );
  const toRail = useSettlementStore((state) =>
    toRailId ? selectAllRails(state).find((item) => item.id === toRailId) : undefined,
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className={shellClass}>
        <DialogTitle className="sr-only">Transfer details</DialogTitle>
        <div className={cn("flex h-12 shrink-0 items-center justify-between px-4 pt-2", captionMutedClass)}>
          <div className="size-7" aria-hidden />
          <div className="text-mbp-body">Transfer details</div>
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
          {transfer ? (
            <TransferConfirmView transfer={transfer} fromRail={fromRail} toRail={toRail} />
          ) : null}
        </div>

        <div className="shrink-0 border-t border-mbp-border-subtle px-4 py-3">
          <Button
            variant="ghost"
            type="button"
            disabled={!transfer}
            className={cn(primaryButtonClass, "gap-2")}
            onClick={() => {
              if (!transfer) return;
              downloadTransferReceipt({ transfer, fromRail, toRail });
            }}
          >
            <Download className="size-4" aria-hidden />
            Download receipt
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
