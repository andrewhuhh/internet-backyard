"use client";

import { Button } from "@/components/ui/button";
import type { Counterparty } from "@/lib/settlement/schema";
import { cn } from "@/lib/utils";
import { RecipientManageRow } from "./recipient-manage-row";
import { recipientBankLabel } from "./recipient-utils";
import { captionMutedClass, primaryButtonClass } from "./styles";

type ManageRecipientsStepProps = {
  recipients: Counterparty[];
  pendingRemoveId: string | null;
  onEdit: (recipient: Counterparty) => void;
  onRequestRemove: (id: string) => void;
  onCancelRemove: () => void;
  onConfirmRemove: (id: string) => void;
  onAddRecipient: () => void;
};

export function ManageRecipientsStep({
  recipients,
  pendingRemoveId,
  onEdit,
  onRequestRemove,
  onCancelRemove,
  onConfirmRemove,
  onAddRecipient,
}: ManageRecipientsStepProps) {
  return (
    <>
      <div className="space-y-1">
        {recipients.length === 0 ? (
          <p className={cn("py-4 text-center", captionMutedClass)}>No recipients yet.</p>
        ) : (
          recipients.map((recipient) => (
            <RecipientManageRow
              key={recipient.id}
              name={recipient.displayName}
              bankLabel={recipientBankLabel(recipient)}
              status={recipient.status}
              pending={pendingRemoveId === recipient.id}
              onEdit={() => onEdit(recipient)}
              onRequestRemove={() => onRequestRemove(recipient.id)}
              onCancelRemove={onCancelRemove}
              onConfirmRemove={() => onConfirmRemove(recipient.id)}
            />
          ))
        )}
      </div>
      <Button
        variant="ghost"
        className={cn(primaryButtonClass, "mt-3")}
        type="button"
        onClick={onAddRecipient}
      >
        Add recipient
      </Button>
    </>
  );
}
