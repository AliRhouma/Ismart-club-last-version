import type { LucideIcon } from "lucide-react"
import {
  AlertCircle,
  CheckCircle2,
  Circle,
  PauseCircle,
  ScanEye,
  Zap,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Avatar } from "@/components/kit/Avatar"
import type {
  ProjetStatut,
  SousTache,
  Tache,
  TachePriorite,
  TacheStatut,
} from "@/data/seed/taches"
import type { OrgMembre } from "@/data/seed/organigramme"

/* ── Statut ─────────────────────────────────────────────────────────────── */

/**
 * Real workflow status, so semantic colour is allowed. "En cours" and "En
 * revue" share the blue accent — one filled, one outlined — rather than
 * inventing a sixth hue for the palette.
 */
export const statutMeta: Record<
  TacheStatut,
  { icon: LucideIcon; chip: string; dot: string }
> = {
  "À faire": {
    icon: Circle,
    chip: "border-border bg-surface-nested text-ink-muted",
    dot: "bg-ink-disabled",
  },
  "En cours": {
    icon: Zap,
    chip: "border-brand-blue-600/30 bg-brand-blue-600/10 text-brand-blue-600",
    dot: "bg-brand-blue-600",
  },
  "En pause": {
    icon: PauseCircle,
    chip: "border-warning/25 bg-warning/10 text-warning",
    dot: "bg-warning",
  },
  "En revue": {
    icon: ScanEye,
    chip: "border-brand-blue-600/40 bg-transparent text-brand-blue-600",
    dot: "bg-brand-blue-600/50",
  },
  Terminée: {
    icon: CheckCircle2,
    chip: "border-success/25 bg-success/10 text-success",
    dot: "bg-success",
  },
}

export function StatutBadge({
  statut,
  className,
}: {
  statut: TacheStatut
  className?: string
}) {
  const { icon: Icon, chip } = statutMeta[statut]
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-pill border px-2 py-0.5 font-ui text-[0.66rem] font-medium whitespace-nowrap",
        chip,
        className,
      )}
    >
      <Icon size={11} />
      {statut}
    </span>
  )
}

const projetStatutChip: Record<ProjetStatut, string> = {
  Planification: "border-border bg-surface-nested text-ink-muted",
  "En cours": "border-brand-blue-600/30 bg-brand-blue-600/10 text-brand-blue-600",
  Terminé: "border-success/25 bg-success/10 text-success",
}

export function ProjetStatutBadge({ statut }: { statut: ProjetStatut }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-pill border px-2 py-0.5 font-ui text-[0.66rem] font-medium whitespace-nowrap",
        projetStatutChip[statut],
      )}
    >
      {statut}
    </span>
  )
}

/* ── Priorité ───────────────────────────────────────────────────────────── */

const prioriteChip: Record<TachePriorite, string> = {
  Urgente: "border-danger/30 bg-danger/10 text-danger",
  Haute: "border-warning/25 bg-warning/10 text-warning",
  Moyenne: "border-border bg-surface-nested text-ink-muted",
  Basse: "border-border bg-transparent text-ink-disabled",
}

export function PrioriteBadge({ priorite }: { priorite: TachePriorite }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-pill border px-2 py-0.5 font-ui text-[0.6rem] font-medium tracking-[0.06em] whitespace-nowrap uppercase",
        prioriteChip[priorite],
      )}
    >
      {priorite}
    </span>
  )
}

/* ── Progression ────────────────────────────────────────────────────────── */

/** Sous-tâches done / total — the only progress number in the module. */
export function avancement(tache: Tache) {
  const total = tache.sousTaches.length
  if (total === 0) return { faites: 0, total: 0, pct: tache.statut === "Terminée" ? 100 : 0 }
  const faites = tache.sousTaches.filter((s) => s.faite).length
  return { faites, total, pct: Math.round((faites / total) * 100) }
}

export function ProgressBar({
  pct,
  tone = "info",
  className,
}: {
  pct: number
  tone?: "info" | "success"
  className?: string
}) {
  return (
    <div
      className={cn("h-[5px] overflow-hidden rounded-pill bg-surface-nested", className)}
    >
      <div
        className={cn(
          "h-full rounded-pill transition-[width] duration-500",
          tone === "success" ? "bg-success" : "bg-info",
        )}
        style={{ width: `${Math.min(Math.max(pct, 0), 100)}%` }}
      />
    </div>
  )
}

/* ── Assignation ────────────────────────────────────────────────────────── */

/** A person chip, or the explicit "non attribuée" warning when there is none. */
export function AssigneeChip({
  membre,
  size = "sm",
  className,
}: {
  membre: OrgMembre | null | undefined
  size?: "sm" | "md"
  className?: string
}) {
  if (!membre) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 font-body text-[0.72rem] text-warning",
          className,
        )}
      >
        <AlertCircle size={13} />
        Non attribuée
      </span>
    )
  }
  return (
    <span className={cn("inline-flex min-w-0 items-center gap-2", className)}>
      <Avatar name={membre.nom} size={size} />
      <span className="min-w-0 truncate font-body text-[0.76rem] text-ink-subtle">
        {membre.nom}
      </span>
    </span>
  )
}

/* ── Sous-tâche row ─────────────────────────────────────────────────────── */

export function SousTacheRow({
  sousTache,
  membre,
  onToggle,
  action,
}: {
  sousTache: SousTache
  membre?: OrgMembre | null
  onToggle?: () => void
  action?: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-sm px-1 py-1.5 transition-colors hover:bg-surface-hover">
      <button
        type="button"
        onClick={onToggle}
        disabled={!onToggle}
        aria-pressed={sousTache.faite}
        aria-label={sousTache.faite ? "Marquer à faire" : "Marquer faite"}
        className={cn(
          "flex size-[18px] shrink-0 items-center justify-center rounded-sm border transition-colors",
          sousTache.faite
            ? "border-success/40 bg-success/15 text-success"
            : "border-border-strong text-transparent hover:border-ink-muted",
          onToggle ? "cursor-pointer" : "cursor-default",
        )}
      >
        <CheckCircle2 size={12} />
      </button>
      <span
        className={cn(
          "min-w-0 flex-1 truncate font-body text-[0.8rem]",
          sousTache.faite ? "text-ink-disabled line-through" : "text-ink",
        )}
      >
        {sousTache.nom}
      </span>
      {membre ? (
        <Avatar name={membre.nom} size="sm" className="shrink-0" />
      ) : (
        <span className="shrink-0 font-body text-[0.68rem] text-ink-disabled">
          —
        </span>
      )}
      {action}
    </div>
  )
}

/* ── Échéance ───────────────────────────────────────────────────────────── */

export function Echeance({
  tache,
  className,
}: {
  tache: Pick<Tache, "echeance" | "enRetard">
  className?: string
}) {
  return (
    <span
      className={cn(
        "font-body text-[0.7rem] tabular-nums",
        tache.enRetard ? "text-danger" : "text-ink-disabled",
        className,
      )}
    >
      {tache.enRetard ? "En retard · " : ""}
      {tache.echeance}
    </span>
  )
}
