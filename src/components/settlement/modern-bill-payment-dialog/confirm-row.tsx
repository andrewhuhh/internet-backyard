import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { captionMutedClass } from "./styles";

export function ConfirmRow({
  label,
  value,
  valueLeading,
}: {
  label: string;
  value: string;
  valueLeading?: ReactNode;
}) {
  return (
    <div className="flex min-h-10 items-center justify-between rounded-mbp-row! bg-mbp-surface! px-3.5">
      <span className={cn("leading-tight", captionMutedClass)}>{label}</span>
      <span className="flex min-w-0 max-w-[65%] items-center gap-1">
        {valueLeading}
        <span className="truncate text-mbp-body font-mbp-body leading-[1.15] text-mbp-fg">{value}</span>
      </span>
    </div>
  );
}
