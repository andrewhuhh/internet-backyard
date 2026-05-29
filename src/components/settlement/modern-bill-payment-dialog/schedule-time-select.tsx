"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  SCHEDULE_TIME_SLOT_OPTIONS,
  scheduleTimeSlotValue,
} from "@/lib/settlement/schedule-datetime";
import { cn } from "@/lib/utils";
import { captionMutedClass, portalSurfaceClass, selectItemClass, selectItemLabelClass } from "./styles";

type ScheduleTimeSelectProps = {
  value: Date;
  onChange: (date: Date) => void;
};

export function ScheduleTimeSelect({ value, onChange }: ScheduleTimeSelectProps) {
  const slotValue = scheduleTimeSlotValue(value);
  const selected = SCHEDULE_TIME_SLOT_OPTIONS.find((item) => item.value === slotValue);

  return (
    <Select
      value={slotValue}
      onValueChange={(next) => {
        const [hours, minutes] = next.split(":").map(Number);
        const nextDate = new Date(value);
        nextDate.setHours(
          Number.isFinite(hours) ? hours : 0,
          Number.isFinite(minutes) ? minutes : 0,
          0,
          0,
        );
        onChange(nextDate);
      }}
    >
      <SelectTrigger
        className={cn(
          "h-9 w-full rounded-mbp-surface! border-mbp-border! bg-mbp-surface! px-2.5 text-mbp-body shadow-none! focus-visible:ring-0!",
          "[&>svg]:size-4 [&>svg]:text-mbp-muted",
        )}
      >
        <SelectValue placeholder="Select time">{selected?.label ?? "Select time"}</SelectValue>
      </SelectTrigger>
      <SelectContent align="center" className={cn(portalSurfaceClass, "max-h-56")}>
        {SCHEDULE_TIME_SLOT_OPTIONS.map((item) => (
          <SelectItem key={item.value} value={item.value} className={selectItemClass}>
            <span className={selectItemLabelClass}>{item.label}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
