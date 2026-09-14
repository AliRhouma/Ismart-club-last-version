import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

/**
 * Standard page heading used at the top of every screen: the title, an optional
 * subtitle, and an optional right-side action slot (buttons, filters…). The
 * action slot stacks below the title on narrow screens and sits to the right
 * from `sm` up, wrapping onto extra rows rather than overflowing when a screen
 * hangs several actions off it.
 */
export function PageHeader({
  title,
  subtitle,
  actions,
  className,
}: {
  title: ReactNode
  subtitle?: ReactNode
  actions?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="flex min-w-0 flex-col gap-1.5">
        <h1 className="truncate font-ui text-2xl font-semibold tracking-normal text-ink">
          {title}
        </h1>
        {subtitle ? (
          <p className="font-body text-sm text-ink-muted">{subtitle}</p>
        ) : null}
      </div>

      {actions ? (
        <div className="flex flex-wrap items-center justify-end gap-2">{actions}</div>
      ) : null}
    </div>
  )
}
