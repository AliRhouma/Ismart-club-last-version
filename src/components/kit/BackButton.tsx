import { ArrowLeft } from "lucide-react"
import { useNavigate } from "react-router-dom"

import { cn } from "@/lib/utils"

/**
 * Standard return control. The convention everywhere in the app: an
 * icon-only, square, empty (transparent) bordered button placed top-left,
 * above the page header. No visible text — the arrow is the universal "go
 * back" affordance. The destination name is kept as the accessible label and
 * hover tooltip so context is never lost.
 *
 * `to` is the parent route (string) or a history delta (e.g. -1).
 */
export function BackButton({
  to,
  label = "Retour",
  className,
}: {
  to: string | number
  label?: string
  className?: string
}) {
  const navigate = useNavigate()
  const goBack = () => {
    if (typeof to === "number") navigate(to)
    else navigate(to)
  }

  return (
    <button
      type="button"
      onClick={goBack}
      aria-label={label}
      title={label}
      className={cn(
        "mb-4 inline-flex size-9 items-center justify-center rounded-md border border-border text-ink-muted transition-colors hover:border-[var(--border-hover)] hover:bg-accent hover:text-ink focus:border-border-focus",
        className,
      )}
    >
      <ArrowLeft size={16} />
    </button>
  )
}
