"use client"

import type { ReactNode } from "react"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { AlertCircle, Check, Info, Loader2, X } from "lucide-react"
import { cn } from "@/lib/utils"

function ToastIconBadge({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        "flex size-5 shrink-0 items-center justify-center rounded-full",
        className,
      )}
    >
      {children}
    </span>
  )
}

const Toaster = ({ theme = "dark", ...props }: ToasterProps) => {
  return (
    <Sonner
      theme={theme}
      className="toaster group"
      icons={{
        success: (
          <ToastIconBadge className="bg-primary/15 text-primary">
            <Check className="size-3 stroke-[2.5]" aria-hidden />
          </ToastIconBadge>
        ),
        info: (
          <ToastIconBadge className="bg-accent/50 text-accent-foreground">
            <Info className="size-3 stroke-[2.5]" aria-hidden />
          </ToastIconBadge>
        ),
        warning: (
          <ToastIconBadge className="bg-chart-3/20 text-chart-3">
            <AlertCircle className="size-3 stroke-[2.5]" aria-hidden />
          </ToastIconBadge>
        ),
        error: (
          <ToastIconBadge className="bg-destructive/15 text-destructive">
            <AlertCircle className="size-3 stroke-[2.5]" aria-hidden />
          </ToastIconBadge>
        ),
        loading: (
          <ToastIconBadge className="bg-muted text-muted-foreground">
            <Loader2 className="size-3 animate-spin stroke-[2.5]" aria-hidden />
          </ToastIconBadge>
        ),
        close: <X className="size-3.5" strokeWidth={2} aria-hidden />,
      }}
      style={
        {
          "--normal-bg": "var(--card)",
          "--normal-text": "var(--card-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius-xl)",
          "--toast-close-button-start": "unset",
          "--toast-close-button-end": "0",
          "--toast-close-button-transform": "translate(35%, -35%)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast:
            "cn-toast !gap-3 !border !bg-card !p-4 !text-card-foreground !shadow-lg !font-sans",
          title: "!text-sm !font-medium !leading-snug",
          description: "!text-sm !text-muted-foreground",
          content: "!gap-0.5",
          icon: "!size-5",
          closeButton:
            "!size-5 !border-border !bg-card !text-muted-foreground hover:!border-border hover:!bg-muted hover:!text-foreground",
          actionButton:
            "!h-7 !rounded-md !border-0 !bg-primary !px-2.5 !text-xs !font-medium !text-primary-foreground",
          cancelButton:
            "!h-7 !rounded-md !border-0 !bg-muted !px-2.5 !text-xs !font-medium !text-muted-foreground",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
