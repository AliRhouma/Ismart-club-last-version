import type { ReactNode } from "react"
import { ChevronDown } from "lucide-react"

import { cn } from "@/lib/utils"
import type { Nature } from "@/data/seed/finance"

/** Shared input chrome — transparent fill, neutral border, focus = border only. */
export const inputCls =
  "w-full rounded-md border border-input bg-input-bg px-3.5 py-2.5 font-body text-sm text-ink outline-none transition-colors placeholder:text-ink-disabled focus:border-border-focus"

/* ── Labelled field ─────────────────────────────────────────────────────── */
export function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string
  required?: boolean
  hint?: ReactNode
  children: ReactNode
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-ui text-[0.7rem] font-medium tracking-[0.06em] text-ink-muted uppercase">
        {label}
        {required ? <span className="ml-0.5 text-danger">*</span> : null}
      </span>
      {children}
      {hint ? (
        <span className="font-body text-[0.72rem] text-ink-disabled">{hint}</span>
      ) : null}
    </label>
  )
}

/* ── Native select, styled ──────────────────────────────────────────────── */
export type Option = { value: string; label: string }

export function Select({
  value,
  onChange,
  options,
  placeholder,
  disabled,
}: {
  value: string
  onChange: (v: string) => void
  options: Option[]
  placeholder?: string
  disabled?: boolean
}) {
  return (
    <div className="relative">
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          inputCls,
          "cursor-pointer appearance-none pr-9",
          disabled && "cursor-not-allowed opacity-45",
        )}
      >
        {placeholder ? (
          <option value="" className="bg-surface text-ink-muted">
            {placeholder}
          </option>
        ) : null}
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-surface text-ink">
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={15}
        className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-ink-disabled"
      />
    </div>
  )
}

/* ── Nature pill — Revenu green / Dépense coral ─────────────────────────── */
export function NaturePill({ nature }: { nature: Nature }) {
  const revenu = nature === "Revenu"
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-pill border px-2.5 py-0.5 font-ui text-[0.65rem] font-medium tracking-[0.06em] whitespace-nowrap uppercase",
        revenu
          ? "border-success/25 bg-success/10 text-success"
          : "border-danger/25 bg-danger/10 text-danger",
      )}
    >
      <span className="size-1.5 shrink-0 rounded-full bg-current" />
      {nature}
    </span>
  )
}

/* ── KPI tile for the reactive summary bar ──────────────────────────────── */
export function Kpi({
  label,
  value,
  tone,
}: {
  label: string
  value: ReactNode
  tone?: "positive" | "negative"
}) {
  return (
    <div className="rounded-lg border border-border px-4 py-3.5">
      <div className="font-ui text-[0.62rem] font-medium tracking-[0.1em] text-ink-muted uppercase">
        {label}
      </div>
      <div
        className={cn(
          "mt-1.5 font-display text-[1.55rem] leading-none font-semibold tabular-nums",
          tone === "positive" && "text-success",
          tone === "negative" && "text-danger",
          !tone && "text-ink",
        )}
      >
        {value}
      </div>
    </div>
  )
}
