import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

export function AddRecipientFormSection({
  title,
  open,
  onOpenChange,
  hasError,
  children,
}: {
  title: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hasError?: boolean;
  children: ReactNode;
}) {
  return (
    <Collapsible open={open} onOpenChange={onOpenChange}>
      <CollapsibleTrigger type="button" className="flex w-full items-center gap-2 text-left">
        <span className="min-w-0 flex-1">{title}</span>
        {hasError ? <span className="shrink-0 text-mbp-caption text-mbp-danger">Fix errors</span> : null}
        <ChevronDown
          className={cn("size-4 shrink-0 transition-transform duration-200", open && "rotate-180")}
          aria-hidden
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-2 pt-2">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}
