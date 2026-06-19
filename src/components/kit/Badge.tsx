import type { ReactNode } from "react"

import { cn } from "@/lib/utils"
import { tintFor } from "@/lib/tint"

const variants = {
  default: "border-border bg-accent text-ink-muted",
  brand: "border-brand/25 bg-brand/10 text-brand",
  success: "border-success/25 bg-success/10 text-success",
  warning: "border-warning/25 bg-warning/10 text-warning",
  danger: "border-danger/25 bg-danger/10 text-danger",
  info: "border-info/25 bg-info/10 text-info",
  neutral: "border-neutral/25 bg-neutral/10 text-neutral",
  home: "border-team-home/25 bg-team-home/10 text-team-home",
  away: "border-team-away/25 bg-team-away/10 text-team-away",
} as const

export type BadgeVariant = keyof typeof variants

/**
 * Small status / category badge (design-system §7). Use a semantic `variant`
 * for known statuses (success / warning / danger…), or `autoColor` to derive a
 * stable tint from the label text — handy for free-form categories where the
 * exact set isn't known ahead of time. `dot` prepends a leading status dot.
 */
export function Badge({
  children,
  variant = "default",
  autoColor = false,
  dot = false,
  className,
}: {
  children: ReactNode
  variant?: BadgeVariant
  autoColor?: boolean
  dot?: boolean
  className?: string
}) {
  const auto =
    autoColor && (typeof children === "string" || typeof children === "number")
      ? tintFor(String(children))
      : null

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-pill border px-2.5 py-0.5 font-ui text-[0.65rem] font-bold tracking-[0.08em] whitespace-nowrap uppercase",
        auto ? cn("border-transparent", auto.bg, auto.text) : variants[variant],
        className,
      )}
    >
      {dot ? (
        <span className="size-1.5 shrink-0 rounded-full bg-current" />
      ) : null}
      {children}
    </span>
  )
}
