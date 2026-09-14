import { Check } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * Step rail for a multi-step form (Nouvelle campagne, Fiche de création
 * séance…). Three or four steps at most: past the fourth, the page wants to be
 * a real flow with its own routes.
 *
 * A step already cleared can be clicked to go back to it when `onSelect` is
 * given — re-reading what you typed two screens ago should never cost a
 * cancelled form. Steps ahead stay inert: they are not decided yet.
 */
export function Steps({
  steps,
  current,
  onSelect,
}: {
  steps: string[]
  /** 1-based. */
  current: number
  onSelect?: (step: number) => void
}) {
  return (
    <ol className="flex flex-wrap items-center gap-3">
      {steps.map((label, i) => {
        const n = i + 1
        const fait = n < current
        const actif = n === current
        const contenu = (
          <>
            <span
              className={cn(
                "flex size-6 shrink-0 items-center justify-center rounded-full border font-ui text-[0.68rem] tabular-nums transition-colors",
                fait
                  ? "border-info/40 bg-info/10 text-info"
                  : actif
                    ? "border-info bg-info text-ink-inverted"
                    : "border-border-strong text-ink-disabled",
              )}
            >
              {fait ? <Check size={12} /> : n}
            </span>
            <span
              className={cn(
                "font-ui text-[0.78rem] transition-colors",
                actif ? "text-ink" : fait ? "text-ink-muted" : "text-ink-disabled",
              )}
            >
              {label}
            </span>
          </>
        )

        return (
          <li key={label} className="flex items-center gap-3">
            {fait && onSelect ? (
              <button
                type="button"
                onClick={() => onSelect(n)}
                className="flex items-center gap-2 rounded-pill px-1 py-0.5 transition-colors hover:text-ink"
              >
                {contenu}
              </button>
            ) : (
              <span
                aria-current={actif ? "step" : undefined}
                className="flex items-center gap-2 px-1 py-0.5"
              >
                {contenu}
              </span>
            )}
            {n < steps.length ? (
              <span aria-hidden className="h-px w-6 bg-border-strong" />
            ) : null}
          </li>
        )
      })}
    </ol>
  )
}
