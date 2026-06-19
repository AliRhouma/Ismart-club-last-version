import type { LucideIcon } from "lucide-react"

/**
 * Generic placeholder screen used by every route until its real screen is
 * built. Keeps navigation clickable end-to-end with an on-brand empty state
 * (design-system §9) rather than a dead/blank page.
 */
export function Placeholder({
  title,
  icon: Icon,
  eyebrow = "Espace de travail",
}: {
  title: string
  icon: LucideIcon
  eyebrow?: string
}) {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8">
      {/* Page header */}
      <div className="flex flex-col gap-2">
        <span className="flex items-center gap-2 font-ui text-[0.7rem] font-bold tracking-[0.12em] text-brand uppercase">
          <span className="h-px w-5 bg-brand" />
          {eyebrow}
        </span>
        <h2 className="font-ui text-2xl font-bold tracking-wide text-ink">
          {title}
        </h2>
        <p className="max-w-prose font-body text-sm text-ink-muted">
          Cet écran fait partie de la maquette interactive. La navigation est
          déjà fonctionnelle — le contenu détaillé arrive prochainement.
        </p>
      </div>

      {/* Empty-state card */}
      <div className="flex flex-col items-center justify-center gap-3 rounded-[var(--radius-lg)] border border-border bg-surface px-6 py-20 text-center">
        <div className="flex size-12 items-center justify-center rounded-[var(--radius-md)] bg-white/[0.03] text-ink-disabled">
          <Icon className="size-6" strokeWidth={1.5} />
        </div>
        <h3 className="font-ui text-sm font-bold text-ink-muted">
          Bientôt disponible
        </h3>
        <p className="max-w-xs font-body text-sm text-ink-disabled">
          L’écran «&nbsp;{title}&nbsp;» est en cours de préparation.
        </p>
      </div>
    </div>
  )
}
