import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

/**
 * Standard page heading used at the top of every screen: an optional green
 * eyebrow label, the title, an optional subtitle, and an optional right-side
 * action slot (buttons, filters…). The action slot stacks below the title on
 * narrow screens and sits to the right from `sm` up.
 */
export function PageHeader({
  title,
  subtitle,
  eyebrow,
  actions,
  className,
}: {
  title: ReactNode
  subtitle?: ReactNode
  eyebrow?: ReactNode
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
        {eyebrow ? (
          <span className="flex items-center gap-2 font-ui text-[0.7rem] font-bold tracking-[0.12em] text-brand uppercase">
            <span className="h-px w-5 bg-brand" />
            {eyebrow}
          </span>
        ) : null}
        <h1 className="truncate font-ui text-2xl font-bold tracking-wide text-ink">
          {title}
        </h1>
        {subtitle ? (
          <p className="font-body text-sm text-ink-muted">{subtitle}</p>
        ) : null}
      </div>

      {actions ? (
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      ) : null}
    </div>
  )
}
