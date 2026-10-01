import type { ReactNode } from "react"
import { ClipboardList, ListChecks, Shield } from "lucide-react"

import { cn } from "@/lib/utils"
import type { FicheContenu, FicheType } from "@/data/seed/fichesPoste"

/** Document family icon — same glyphs as Fiches & Documents. */
export function IconeDoc({ type, size = 14 }: { type: FicheType; size?: number }) {
  if (type === "Fiche de Poste") return <ClipboardList size={size} />
  if (type === "Liste des Rôles") return <ListChecks size={size} />
  return <Shield size={size} />
}

/** A document's content, read-only — objectif, rattachement, sections. */
export function ContenuDoc({ contenu, compact = false }: { contenu?: FicheContenu; compact?: boolean }) {
  if (!contenu)
    return <p className="font-body text-[0.82rem] text-ink-disabled">Ce document n'a pas de contenu rédigé.</p>
  return (
    <div className={cn("flex flex-col", compact ? "gap-3" : "gap-4")}>
      {contenu.objectif || contenu.rattachement ? (
        <div className="flex flex-col gap-1.5 border-b border-border pb-3">
          {contenu.objectif ? (
            <p className="font-body text-[0.84rem] text-ink-subtle">
              <span className="text-ink-muted">Objectif : </span>
              {contenu.objectif}
            </p>
          ) : null}
          {contenu.rattachement ? (
            <p className="font-body text-[0.84rem] text-ink-subtle">
              <span className="text-ink-muted">Rattachement : </span>
              {contenu.rattachement}
            </p>
          ) : null}
        </div>
      ) : null}
      {contenu.sections.map((s) => (
        <div key={s.titre} className="flex flex-col gap-1.5">
          <h4 className="font-ui text-[0.84rem] font-medium text-ink">{s.titre}</h4>
          <ul className="flex flex-col gap-1">
            {s.points.map((pt) => (
              <li key={pt} className="flex gap-2 font-body text-[0.82rem] text-ink-subtle">
                <span className="mt-[0.45rem] size-1 shrink-0 rounded-full bg-ink-disabled" />
                {pt}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}

export function Panneau({
  titre,
  aside,
  children,
  className,
}: {
  titre?: ReactNode
  aside?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section className={cn("flex flex-col gap-4 rounded-lg border border-border p-5", className)}>
      {titre ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-ui text-[0.95rem] font-medium text-ink">{titre}</h2>
          {aside}
        </div>
      ) : null}
      {children}
    </section>
  )
}

/** Small counter chip: "3 postes", "2 chartes"… */
export function Puce({ children, ton = "neutre" }: { children: ReactNode; ton?: "neutre" | "info" | "warning" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-pill border px-2 py-0.5 font-ui text-[0.68rem] whitespace-nowrap",
        ton === "neutre" && "border-border text-ink-muted",
        ton === "info" && "border-brand-blue-600/30 bg-brand-blue-600/10 text-brand-blue-600",
        ton === "warning" && "border-warning/30 bg-warning/10 text-warning",
      )}
    >
      {children}
    </span>
  )
}
