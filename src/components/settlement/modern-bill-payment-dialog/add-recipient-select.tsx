import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  addRecipientControlClass,
  captionMutedClass,
  portalSurfaceClass,
  selectItemClass,
  selectItemLabelClass,
} from "./styles";

export function AddRecipientSelect({
  id,
  label,
  value,
  options,
  error,
  onValueChange,
}: {
  id: string;
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  error?: string;
  onValueChange: (value: string) => void;
}) {
  const selected = options.find((item) => item.value === value);
  const displayLabel = selected?.label ?? label;

  return (
    <div className="space-y-1">
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger
          id={id}
          className={cn(addRecipientControlClass, "min-h-13 h-auto items-center py-2")}
        >
          <span className="min-w-0 flex-1 overflow-hidden text-left">
            <span className={cn("block leading-none", captionMutedClass)}>{label}</span>
            <span className="mt-1 block truncate text-mbp-body leading-[1.15] text-mbp-fg">
              <SelectValue>{displayLabel}</SelectValue>
            </span>
          </span>
        </SelectTrigger>
        <SelectContent align="start" className={portalSurfaceClass}>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value} className={selectItemClass}>
              <span className={selectItemLabelClass}>{option.label}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error ? <p className="text-mbp-caption text-mbp-danger">{error}</p> : null}
    </div>
  );
}
