import type { ReactNode } from "react"
import { CheckCircle2, CircleDashed, Loader } from "lucide-react"
import type { LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import type { OrgTache, OrgTacheStatut } from "@/data/seed/organigramme"

/* ── Status vocabulary ──────────────────────────────────────────────────── */

/** Tâche statut → its icon + colour. Real status, so semantic colours apply. */
export const statutMeta: Record<
  OrgTacheStatut,
  { icon: LucideIcon; cls: string }
> = {
  "À faire": { icon: CircleDashed, cls: "text-ink-muted" },
  "En cours": { icon: Loader, cls: "text-info" },
  Terminée: { icon: CheckCircle2, cls: "text-success" },
}

/** Priorité pill classes — gold for haute, neutral for the rest. */
const prioriteCls: Record<string, string> = {
  Haute: "border-warning/25 bg-warning/10 text-warning",
  Moyenne: "border-border bg-surface-nested text-ink-muted",
  Basse: "border-border bg-surface-nested text-ink-disabled",
}

/* ── Tâche row (used in the node and in the transfer modal) ─────────────── */

export function TacheRow({
  tache,
  onClick,
  className,
}: {
  tache: OrgTache
  onClick?: () => void
  className?: string
}) {
  const { icon: Icon, cls } = statutMeta[tache.statut]
  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-sm border border-border bg-surface-nested px-2.5 py-2 transition-colors",
        onClick && "cursor-pointer hover:border-border-strong",
        className,
      )}
    >
      <div className="flex items-start gap-2">
        <Icon size={13} className={cn("mt-0.5 shrink-0", cls)} />
        <span className="min-w-0 flex-1 truncate font-body text-[0.78rem] text-ink">
          {tache.titre}
        </span>
      </div>
      <div className="mt-1.5 ml-[21px] flex items-center gap-2">
        <span
          className={cn(
            "rounded-pill border px-1.5 py-px font-ui text-[0.6rem] font-medium tracking-[0.06em] uppercase",
            prioriteCls[tache.priorite],
          )}
        >
          {tache.priorite}
        </span>
        <span
          className={cn(
            "font-body text-[0.68rem] tabular-nums",
            tache.enRetard ? "text-danger" : "text-ink-disabled",
          )}
        >
          {tache.enRetard ? "En retard · " : ""}
          {tache.echeance}
        </span>
      </div>
    </div>
  )
}

/* ── Compact stat, for the toolbar strip ────────────────────────────────── */

export function StatChip({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: number
  icon: LucideIcon
}) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex size-8 items-center justify-center rounded-md border border-border text-ink-muted">
        <Icon size={15} />
      </span>
      <span className="flex flex-col leading-tight">
        <span className="font-ui text-[0.6rem] font-medium tracking-[0.1em] text-ink-muted uppercase">
          {label}
        </span>
        <span className="font-ui text-sm text-ink tabular-nums">{value}</span>
      </span>
    </div>
  )
}

/* ── Toolbar toggle (Membres / Tâches / Relations) ──────────────────────── */

export function ToggleBtn({
  active,
  onClick,
  icon: Icon,
  children,
}: {
  active: boolean
  onClick: () => void
  icon: LucideIcon
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-pill border px-3 font-ui text-[0.76rem] font-medium transition-colors",
        active
          ? "border-border-second bg-surface-nested text-ink"
          : "border-transparent text-ink-muted hover:text-ink",
      )}
    >
      <Icon size={14} />
      {children}
    </button>
  )
}

/** Thin vertical rule between toolbar groups. */
export function ToolSep() {
  return <span aria-hidden className="h-6 w-px shrink-0 bg-border" />
}
