import { cn } from "@/lib/utils";
import { captionMutedClass } from "./styles";

export function ConfirmRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-h-10 items-center justify-between rounded-mbp-row! bg-mbp-surface! px-3.5">
      <span className={cn("leading-tight", captionMutedClass)}>{label}</span>
      <span className="truncate text-mbp-body font-mbp-emphasis leading-[1.15] text-mbp-fg">{value}</span>
    </div>
  );
}
