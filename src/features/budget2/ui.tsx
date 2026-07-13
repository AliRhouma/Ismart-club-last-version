import { Fragment, type ReactNode } from "react"
import { Link } from "react-router-dom"
import { ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/kit/Badge"
import { STATUS_META, type Budget2Status } from "@/data/seed/budget2"
import { BUDGET2_TABS, type Budget2Tab } from "@/features/budget2/helpers"

/* ── Breadcrumb (Budget / Saison … / Brouillon / « draft ») ─────────────── */
export type Crumb = { label: string; to?: string }

export function Crumbs({ items }: { items: Crumb[] }) {
  return (
    <nav
      aria-label="Fil d'Ariane"
      className="flex flex-wrap items-center gap-1.5 font-body text-[0.78rem] text-ink-muted"
    >
      {items.map((item, i) => {
        const last = i === items.length - 1
        return (
          <Fragment key={i}>
            {item.to && !last ? (
              <Link
                to={item.to}
                className="transition-colors hover:text-ink"
              >
                {item.label}
              </Link>
            ) : (
              <span className={cn(last && "text-ink")}>{item.label}</span>
            )}
            {last ? null : (
              <ChevronRight size={13} className="text-ink-disabled" />
            )}
          </Fragment>
        )
      })}
    </nav>
  )
}

/* ── Draft status badge ─────────────────────────────────────────────────── */
export function StatusBadge({ status }: { status: Budget2Status }) {
  const meta = STATUS_META[status]
  return (
    <Badge variant={meta.badge} dot={status === "valide"}>
      {meta.label}
    </Badge>
  )
}

/* ── Season budget tabs — route-linked, neutral active (design system) ──── */
export function Budget2Tabs({
  seasonId,
  active,
  draftCount,
}: {
  seasonId: string
  active: Budget2Tab
  draftCount: number
}) {
  return (
    <div className="inline-flex gap-1 rounded-pill border border-border p-1">
      {BUDGET2_TABS.map((tab) => {
        const on = tab.value === active
        return (
          <Link
            key={tab.value}
            to={`/budget2/${seasonId}/${tab.value}`}
            aria-current={on ? "page" : undefined}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-pill px-4 py-1.5 font-ui text-[0.78rem] font-medium transition-colors",
              on
                ? "border border-border-second bg-surface-nested text-ink"
                : "border border-transparent text-ink-muted hover:text-ink",
            )}
          >
            {tab.label}
            {tab.value === "brouillon" && draftCount > 0 ? (
              <span
                className={cn(
                  "rounded-full px-1.5 text-[0.66rem] tabular-nums",
                  on ? "bg-surface-hover" : "bg-accent",
                )}
              >
                {draftCount}
              </span>
            ) : null}
          </Link>
        )
      })}
    </div>
  )
}

/* ── Money figure (label + value), used in cards & the balance bar ──────── */
export function Figure({
  label,
  value,
  tone,
  big,
  align = "left",
}: {
  label: ReactNode
  value: ReactNode
  tone?: "positive" | "negative"
  big?: boolean
  align?: "left" | "right"
}) {
  return (
    <div className={cn("min-w-0", align === "right" && "text-right")}>
      <div
        className={cn(
          "leading-none tabular-nums",
          big
            ? "font-display text-[1.6rem] font-semibold"
            : "font-ui text-[0.98rem] font-medium",
          tone === "positive" && "text-success",
          tone === "negative" && "text-danger",
          !tone && "text-ink",
        )}
      >
        {value}
      </div>
      <div className="mt-1 font-ui text-[0.6rem] font-medium tracking-[0.1em] text-ink-disabled uppercase">
        {label}
      </div>
    </div>
  )
}
