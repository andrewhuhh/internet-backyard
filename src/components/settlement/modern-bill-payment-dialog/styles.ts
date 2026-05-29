import { cn } from "@/lib/utils";

export const shellClass =
  "flex max-h-[min(36rem,calc(100dvh-2rem))] w-104! max-w-[min(26rem,calc(100vw-2rem))]! flex-col overflow-hidden rounded-mbp-shell! border border-mbp-border-subtle! bg-mbp-shell! p-0! text-mbp-fg! shadow-2xl ring-0! sm:max-w-none";

export const mbpScrollClass = "mbp-scroll min-h-0 overflow-y-auto overscroll-contain";

export const portalSurfaceClass =
  "mbp-scroll rounded-mbp-surface! border border-mbp-border! bg-mbp-portal! text-mbp-fg! ring-0! shadow-md [--select-popover-radius:var(--mbp-radius-surface)] [--select-popover-padding:0.375rem]";

export const calendarClass =
  "bg-transparent! p-0 [--cell-radius:var(--mbp-radius-surface)] text-mbp-fg [&_[data-selected-single=true]]:bg-mbp-fg! [&_[data-selected-single=true]]:text-mbp-inverse! [&_[data-selected-single=true]]:hover:bg-mbp-fg! [&_.text-muted-foreground]:text-mbp-muted [&_[data-outside=true]]:text-mbp-muted";

export const iconButtonClass =
  "grid size-7 place-items-center rounded-full text-mbp-muted transition-colors duration-mbp will-change-[color] hover:text-mbp-fg";

export const controlSurfaceClass =
  "bg-mbp-surface hover:bg-mbp-surface-hover focus-visible:bg-mbp-surface-hover focus-visible:ring-0!";

export const addRecipientControlClass = cn(
  "h-10.5 w-full rounded-mbp-surface! border-mbp-border! px-3 text-mbp-body! md:text-mbp-body! text-mbp-fg! shadow-none! focus-visible:ring-0!",
  controlSurfaceClass,
  "placeholder:text-mbp-placeholder",
);

export const captionMutedClass = "text-mbp-caption text-mbp-muted";

export const selectItemLabelClass = "text-mbp-body leading-none text-mbp-fg";

export const timeToggleClass =
  "rounded-full px-2.5 py-1 font-mbp-emphasis text-mbp-muted transition-[color,background-color] duration-mbp will-change-[color,background-color] hover:text-mbp-fg";

export const primaryButtonClass =
  "h-10.5 w-full rounded-mbp-surface! bg-mbp-fg! text-mbp-body font-mbp-emphasis text-mbp-inverse! transition will-change-[background-color] hover:bg-mbp-primary-hover!";

export const selectItemClass =
  "w-full! items-start! py-2 pr-8 pl-3! text-mbp-fg! focus:bg-mbp-surface-hover! focus:text-mbp-fg!";

export const amountDisplayClass = "font-mbp-emphasis tracking-mbp-tight";
