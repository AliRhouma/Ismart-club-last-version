import type { LucideIcon } from "lucide-react"
import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

/**
 * Centered empty-state block (design-system §9). Used both for "nothing here
 * yet" placeholders and for lists the user has emptied via deletes. Keep the
 * message short; pass a primary `action` (e.g. a "Create" button) when there
 * is an obvious next step.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon
  title: string
  description?: ReactNode
  action?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 px-6 py-16 text-center",
        className,
      )}
    >
      {Icon ? (
        <div className="flex size-12 items-center justify-center rounded-md bg-accent text-ink-disabled">
          <Icon className="size-6" strokeWidth={1.5} />
        </div>
      ) : null}
      <h3 className="font-ui text-sm font-bold text-ink-muted">{title}</h3>
      {description ? (
        <p className="max-w-xs font-body text-sm text-ink-disabled">
          {description}
        </p>
      ) : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  )
}
