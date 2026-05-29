import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Counterparty } from "@/lib/settlement/schema";
import { cn } from "@/lib/utils";
import { CounterpartyStatusIcon } from "./counterparty-status-icon";
import { iconButtonClass } from "./styles";

export function RecipientManageRow({
  name,
  bankLabel,
  status,
  pending,
  onEdit,
  onRequestRemove,
  onCancelRemove,
  onConfirmRemove,
}: {
  name: string;
  bankLabel: string | null;
  status: Counterparty["status"];
  pending: boolean;
  onEdit: () => void;
  onRequestRemove: () => void;
  onCancelRemove: () => void;
  onConfirmRemove: () => void;
}) {
  if (pending) {
    return (
      <div className="space-y-1.5 rounded-mbp-row! bg-mbp-surface! px-3 py-2">
        <p className="text-mbp-body leading-tight text-mbp-fg">
          Remove <span className="font-mbp-emphasis">{name}</span>?
        </p>
        <div className="flex justify-end gap-2">
          <Button
            variant="link"
            type="button"
            className="h-auto px-0 py-0 text-mbp-caption text-mbp-muted hover:text-mbp-fg"
            onClick={onCancelRemove}
          >
            Cancel
          </Button>
          <Button
            variant="link"
            type="button"
            className="h-auto px-0 py-0 text-mbp-caption font-mbp-emphasis text-mbp-danger hover:text-mbp-danger"
            onClick={onConfirmRemove}
          >
            Remove
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-mbp-row! bg-mbp-surface! px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          {status !== "pending_review" ? <CounterpartyStatusIcon status={status} /> : null}
          <p className="min-w-0 truncate text-mbp-body font-mbp-body leading-tight text-mbp-fg">
            {name}
          </p>
        </div>
        <div className="flex shrink-0 items-center">
          <Button
            variant="link"
            type="button"
            className={cn(iconButtonClass, "size-6")}
            onClick={onEdit}
            aria-label={`Edit ${name}`}
          >
            <Pencil className="size-3.5" />
          </Button>
          <Button
            variant="link"
            type="button"
            className={cn(iconButtonClass, "size-6")}
            onClick={onRequestRemove}
            aria-label={`Remove ${name}`}
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </div>
      {bankLabel ? (
        <p className="truncate text-mbp-caption leading-tight text-mbp-muted">{bankLabel}</p>
      ) : null}
    </div>
  );
}
