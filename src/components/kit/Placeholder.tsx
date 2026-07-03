import type { LucideIcon } from "lucide-react"

/**
 * Generic placeholder screen used by every route until its real screen is
 * built. Keeps navigation clickable end-to-end with an on-brand empty state
 * (design-system §9) rather than a dead/blank page.
 */
export function Placeholder({
  title,
  icon: Icon,
}: {
  title: string
  icon: LucideIcon
}) {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-8">
      {/* Page header */}
      <div className="flex flex-col gap-2">
        <h2 className="font-ui text-2xl font-semibold tracking-normal text-ink">
          {title}
        </h2>
        <p className="max-w-prose font-body text-sm text-ink-muted">
          Cet écran fait partie de la maquette interactive. La navigation est
          déjà fonctionnelle — le contenu détaillé arrive prochainement.
        </p>
      </div>

      {/* Empty-state card */}
      <div className="flex flex-col items-center justify-center gap-3 rounded-[var(--radius-lg)] border border-border px-6 py-20 text-center">
        <div className="flex size-12 items-center justify-center rounded-[var(--radius-md)] bg-white/[0.03] text-ink-disabled">
          <Icon className="size-6" strokeWidth={1.5} />
        </div>
        <h3 className="font-ui text-sm font-medium text-ink-muted">
          Bientôt disponible
        </h3>
        <p className="max-w-xs font-body text-sm text-ink-disabled">
          L’écran «&nbsp;{title}&nbsp;» est en cours de préparation.
        </p>
      </div>
    </div>
  )
}
