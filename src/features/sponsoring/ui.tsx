import type { ReactNode } from "react"
import {
  LayoutDashboard,
  CalendarDays,
  Check,
  Trophy,
  Bell,
  List,
  Dumbbell,
  MessageSquare,
  type LucideIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import type { SlotKey, SpaceKey } from "@/data/seed/sponsoring"

/* ── Toggle switch (selected = blue, per design rule 3) ─────────────────── */
export function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label?: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-[22px] w-[38px] shrink-0 items-center rounded-full border transition-colors",
        checked
          ? "border-info/40 bg-info"
          : "border-border-strong bg-transparent",
      )}
    >
      <span
        className={cn(
          "inline-block size-[15px] rounded-full bg-ink shadow-sm transition-transform",
          checked ? "translate-x-[18px] bg-ink-inverted" : "translate-x-[3px]",
        )}
      />
    </button>
  )
}

/* ── Coloured tier badge (an offer's name in its colour) ────────────────── */
export function TierBadge({
  name,
  color,
  size = "md",
}: {
  name: string
  color: string
  size?: "sm" | "md"
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-pill border font-ui font-medium whitespace-nowrap",
        size === "sm"
          ? "px-2.5 py-0.5 text-[0.68rem]"
          : "px-3 py-1 text-[0.8rem]",
      )}
      style={{
        // Tier colours are product data, not chrome — coloured tint + text.
        borderColor: `${color}55`,
        backgroundColor: `${color}1a`,
        color,
      }}
    >
      <span
        className="size-2 rounded-full"
        style={{ backgroundColor: color }}
      />
      {name || "Sans nom"}
    </span>
  )
}

/* ── Icon per ad-space slot (for the compact slot row) ──────────────────── */
export const SLOT_ICON: Record<SlotKey, LucideIcon> = {
  accueil: LayoutDashboard,
  planification: CalendarDays,
  match_detail: Trophy,
  messagerie: MessageSquare,
  notification: Bell,
}

/* ── Icon per offer ad space (offer form + offer cards) ─────────────────── */
export const SPACE_ICON: Record<SpaceKey, LucideIcon> = {
  calendar: CalendarDays,
  match_list: List,
  match_detail: Trophy,
  session_detail: Dumbbell,
  notification: Bell,
  messagerie: MessageSquare,
}

/* ── Always-visible explanation card (NOT a tooltip) ────────────────────── */
export function ExplainCard({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <div className="rounded-md border border-border bg-surface-nested px-4 py-3.5">
      <p className="font-ui text-[0.8rem] font-medium text-ink-subtle">
        {title}
      </p>
      <div className="mt-1.5 flex flex-col gap-1.5 font-body text-[0.8rem] leading-relaxed text-ink-muted">
        {children}
      </div>
    </div>
  )
}

/* ── Confirmation toast (same one the partenaires / offres screens use) ──── */
export function Toast({
  msg,
  id,
  /** Lets a screen lift the toast over a docked panel of its own. */
  className,
}: {
  msg: string
  id?: number | string
  className?: string
}) {
  return (
    <div
      key={id}
      role="status"
      className={cn(
        "animate-toast-in fixed right-5 bottom-5 z-[120] flex items-center gap-2.5 rounded-md border border-success/30 bg-surface px-4 py-3 shadow-deep",
        className,
      )}
    >
      <span className="flex size-6 items-center justify-center rounded-full bg-success/15 text-success">
        <Check size={14} />
      </span>
      <span className="font-body text-[0.84rem] text-ink">{msg}</span>
    </div>
  )
}

/* ── Section heading inside the form ────────────────────────────────────── */
export function SectionTitle({
  children,
  hint,
}: {
  children: ReactNode
  hint?: ReactNode
}) {
  return (
    <div className="mb-4 flex items-baseline justify-between gap-3 border-b border-border pb-2">
      <h2 className="font-ui text-[0.72rem] font-medium tracking-[0.1em] text-ink-muted uppercase">
        {children}
      </h2>
      {hint ? (
        <span className="font-body text-[0.72rem] text-ink-disabled">
          {hint}
        </span>
      ) : null}
    </div>
  )
}
