import { format, set } from "date-fns";

const DEFAULT_SCHEDULE_HOUR = 9;
const DEFAULT_SCHEDULE_MINUTE = 0;
const TIME_SLOT_MINUTES = 30;

export function defaultScheduledDateTime() {
  const now = new Date();
  return set(now, {
    hours: DEFAULT_SCHEDULE_HOUR,
    minutes: DEFAULT_SCHEDULE_MINUTE,
    seconds: 0,
    milliseconds: 0,
  });
}

export function formatScheduledDateTime(date: Date) {
  return format(date, "MMM d, h:mm a");
}

export function mergeScheduleDay(day: Date, existing?: Date) {
  const hours = existing?.getHours() ?? DEFAULT_SCHEDULE_HOUR;
  const minutes = existing?.getMinutes() ?? DEFAULT_SCHEDULE_MINUTE;
  return set(day, { hours, minutes, seconds: 0, milliseconds: 0 });
}

export function scheduleTimeSlotValue(date: Date) {
  return `${date.getHours()}:${date.getMinutes()}`;
}

export function buildScheduleTimeSlotOptions() {
  const options: Array<{ value: string; label: string }> = [];
  for (let hour = 0; hour < 24; hour += 1) {
    for (let minute = 0; minute < 60; minute += TIME_SLOT_MINUTES) {
      const slot = set(new Date(2000, 0, 1), { hours: hour, minutes: minute });
      options.push({
        value: `${hour}:${minute}`,
        label: format(slot, "h:mm a"),
      });
    }
  }
  return options;
}

export const SCHEDULE_TIME_SLOT_OPTIONS = buildScheduleTimeSlotOptions();
