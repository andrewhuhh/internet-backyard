"use client";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { addRecipientControlClass, captionMutedClass } from "./styles";

export function RecipientListSearch({
  id,
  value,
  onChange,
  className,
  placeholder = "Search recipients",
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}) {
  return (
    <div
      className={cn(
        "sticky top-0 z-10 border-b border-mbp-border bg-mbp-portal p-1.5",
        className,
      )}
    >
      <Input
        id={id}
        value={value}
        placeholder={placeholder}
        autoComplete="off"
        className={cn(addRecipientControlClass, "h-9")}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

export function RecipientListSearchEmpty({ className }: { className?: string }) {
  return (
    <p className={cn("px-3 py-2 text-center", captionMutedClass, className)}>No matches.</p>
  );
}
