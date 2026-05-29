import type { HTMLAttributes } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addRecipientControlClass, captionMutedClass } from "./styles";

export function AddRecipientField({
  id,
  label,
  value,
  error,
  placeholder,
  inputMode,
  maxLength,
  autoComplete,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  error?: string;
  placeholder: string;
  inputMode?: HTMLAttributes<HTMLInputElement>["inputMode"];
  maxLength?: number;
  autoComplete?: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1">
      <Label className={captionMutedClass} htmlFor={id}>
        {label}
      </Label>
      <Input
        id={id}
        name={id}
        value={value}
        inputMode={inputMode}
        maxLength={maxLength}
        autoComplete={autoComplete}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={addRecipientControlClass}
      />
      {error ? <p className="text-mbp-caption text-mbp-danger">{error}</p> : null}
    </div>
  );
}
