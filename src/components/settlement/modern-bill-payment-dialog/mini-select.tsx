import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  captionMutedClass,
  controlSurfaceClass,
  portalSurfaceClass,
  selectItemClass,
  selectItemLabelClass,
} from "./styles";

export function MiniSelect({
  label,
  value,
  placeholder,
  options,
  onValueChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  options: Array<{ value: string; label: string; amount?: string }>;
  onValueChange: (value: string) => void;
}) {
  const selected = options.find((item) => item.value === value);
  const displayLabel = selected?.label ?? placeholder;
  return (
    <div className="w-full min-w-0">
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger
          className={cn(
            "min-h-13 min-w-0 w-full items-center border-0! rounded-mbp-surface! p-3 text-left shadow-none! will-change-[background-color] dark:bg-mbp-surface! dark:hover:bg-mbp-surface-hover!",
            controlSurfaceClass,
            "[&_svg]:size-[1em]! [&_svg]:text-mbp-muted!",
          )}
        >
          <span className="min-w-0 flex-1 overflow-hidden">
            <span className={cn("block leading-none", captionMutedClass)}>{label}</span>
            <span className="mt-1 flex min-w-0 items-center gap-1 text-mbp-body leading-[1.15] text-mbp-fg">
              <span className="min-w-0 flex-1 truncate">
                <SelectValue placeholder={placeholder}>{displayLabel}</SelectValue>
              </span>
            </span>
          </span>
        </SelectTrigger>
        <SelectContent
          align="start"
          className={cn(
            portalSurfaceClass,
            "min-w-(--radix-select-trigger-width) w-max max-w-[min(26rem,calc(100vw-2rem))] overflow-x-visible",
            "**:data-[position=popper]:h-auto **:data-[position=popper]:w-auto **:data-[position=popper]:min-w-full",
          )}
        >
          {options.map((item) => (
            <SelectItem key={item.value} value={item.value} className={selectItemClass}>
              <div className="flex min-w-full w-max flex-col items-start gap-0.5">
                <span className={cn(selectItemLabelClass, "whitespace-nowrap")}>{item.label}</span>
                {item.amount ? (
                  <span className={cn(captionMutedClass, "whitespace-nowrap")}>{item.amount}</span>
                ) : null}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
