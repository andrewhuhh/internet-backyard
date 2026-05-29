import { BadgeCheck, Ban, CircleAlert, Clock } from "lucide-react";
import type { Counterparty } from "@/lib/settlement/schema";
import { cn } from "@/lib/utils";
import { counterpartyStatusLabel } from "./recipient-utils";

export function CounterpartyStatusIcon({ status }: { status: Counterparty["status"] }) {
  const label = counterpartyStatusLabel(status);
  const className = cn(
    "size-3.5 shrink-0",
    status === "blocked" ? "text-mbp-danger" : "text-mbp-muted",
  );

  const icon =
    status === "verified" ? (
      <BadgeCheck className={className} aria-hidden />
    ) : status === "pending_review" ? (
      <Clock className={className} aria-hidden />
    ) : status === "missing_evidence" ? (
      <CircleAlert className={className} aria-hidden />
    ) : (
      <Ban className={className} aria-hidden />
    );

  return (
    <span className="inline-flex shrink-0" title={label} aria-label={label} role="img">
      {icon}
    </span>
  );
}
