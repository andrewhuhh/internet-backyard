"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import type { Counterparty } from "@/lib/settlement/schema";
import { cn } from "@/lib/utils";
import { RECIPIENT_SEARCH_THRESHOLD } from "./constants";
import { RecipientListSearch, RecipientListSearchEmpty } from "./recipient-list-search";
import { RecipientManageRow } from "./recipient-manage-row";
import { filterRecipientsBySearch, recipientBankLabel } from "./recipient-utils";
import { captionMutedClass, primaryButtonClass } from "./styles";

type ManageRecipientsStepProps = {
  recipients: Counterparty[];
  hiddenCounterpartyIds: string[];
  pendingRemoveId: string | null;
  onEdit: (recipient: Counterparty) => void;
  onToggleVisibility: (recipient: Counterparty) => void;
  onRequestRemove: (id: string) => void;
  onCancelRemove: () => void;
  onConfirmRemove: (id: string) => void;
  onAddRecipient: () => void;
};

export function ManageRecipientsStep({
  recipients,
  hiddenCounterpartyIds,
  pendingRemoveId,
  onEdit,
  onToggleVisibility,
  onRequestRemove,
  onCancelRemove,
  onConfirmRemove,
  onAddRecipient,
}: ManageRecipientsStepProps) {
  const hiddenIds = useMemo(() => new Set(hiddenCounterpartyIds), [hiddenCounterpartyIds]);
  const [searchQuery, setSearchQuery] = useState("");
  const showSearch = recipients.length > RECIPIENT_SEARCH_THRESHOLD;
  const visibleRecipients = useMemo(
    () => (showSearch ? filterRecipientsBySearch(recipients, searchQuery) : recipients),
    [recipients, searchQuery, showSearch],
  );

  return (
    <>
      <div className="space-y-1 pb-6">
        {recipients.length === 0 ? (
          <p className={cn("py-4 text-center", captionMutedClass)}>No recipients yet.</p>
        ) : (
          <>
            {showSearch ? (
              <RecipientListSearch
                id="manage-recipients-search"
                value={searchQuery}
                onChange={setSearchQuery}
                className="sticky top-0 z-10 mb-2 border-b-0 bg-transparent p-0 pb-2"
              />
            ) : null}
            {visibleRecipients.length === 0 ? (
              <RecipientListSearchEmpty className="py-4" />
            ) : (
              visibleRecipients.map((recipient) => (
                <RecipientManageRow
                  key={recipient.id}
                  name={recipient.displayName}
                  bankLabel={recipientBankLabel(recipient)}
                  status={recipient.status}
                  hidden={hiddenIds.has(recipient.id)}
                  pending={pendingRemoveId === recipient.id}
                  onEdit={() => onEdit(recipient)}
                  onToggleVisibility={() => onToggleVisibility(recipient)}
                  onRequestRemove={() => onRequestRemove(recipient.id)}
                  onCancelRemove={onCancelRemove}
                  onConfirmRemove={() => onConfirmRemove(recipient.id)}
                />
              ))
            )}
          </>
        )}
      </div>
      <Button
        variant="ghost"
        className={primaryButtonClass}
        type="button"
        onClick={onAddRecipient}
      >
        Add recipient
      </Button>
    </>
  );
}
