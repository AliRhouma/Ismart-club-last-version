import { cn } from "@/lib/utils"
import { Avatar } from "@/components/kit/Avatar"
import { Badge } from "@/components/kit/Badge"
import type { ObjectifStatut } from "@/data/seed/objectifs"

/* ── Statut badge — En attente (amber) / Accepté (green) / Refusé (red) ──── */
const STATUT_VARIANT = {
  "En attente": "warning",
  Accepté: "success",
  Refusé: "danger",
} as const

export function StatutBadge({ statut }: { statut: ObjectifStatut }) {
  return (
    <Badge variant={STATUT_VARIANT[statut]} dot>
      {statut}
    </Badge>
  )
}

/* ── Assignee cell — stacked avatars + "Nom, Nom +N" ────────────────────── */
export function AssigneeCell({
  assignes,
  className,
}: {
  assignes: string[]
  className?: string
}) {
  const shownAvatars = assignes.slice(0, 3)
  const namesLabel =
    assignes.slice(0, 2).join(", ") +
    (assignes.length > 2 ? ` +${assignes.length - 2}` : "")

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className="flex shrink-0 -space-x-2">
        {shownAvatars.map((name) => (
          <Avatar
            key={name}
            name={name}
            size="sm"
            className="ring-2 ring-surface"
          />
        ))}
      </div>
      <span className="truncate font-body text-sm text-ink-subtle">
        {namesLabel}
      </span>
    </div>
  )
}
