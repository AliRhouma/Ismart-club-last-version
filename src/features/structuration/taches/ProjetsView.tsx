import { useMemo, useState } from "react"
import { CalendarDays, FolderKanban, MessageSquare, Paperclip, Plus } from "lucide-react"

import { cn } from "@/lib/utils"
import { useData } from "@/data/useData"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/kit/EmptyState"
import { PROJET_STATUTS, type Projet, type Tache } from "@/data/seed/taches"

import {
  AssigneeChip,
  Echeance,
  PrioriteBadge,
  ProgressBar,
  ProjetStatutBadge,
  statutMeta,
} from "./ui"

/**
 * Projets — one card per chantier: where it stands, who is on it, and the
 * tâches underneath. The card body scrolls on its own so a busy projet never
 * stretches the grid row.
 */
export function ProjetsView({
  onOpenTache,
  onOpenProjet,
  onNewProjet,
}: {
  onOpenTache: (tache: Tache) => void
  onOpenProjet: (projet: Projet) => void
  onNewProjet: () => void
}) {
  const { projets, sousProjets, taches, orgMembres } = useData()
  const [filtre, setFiltre] = useState<"Tous" | (typeof PROJET_STATUTS)[number]>(
    "Tous",
  )

  const membreById = useMemo(
    () => Object.fromEntries(orgMembres.map((m) => [m.id, m])),
    [orgMembres],
  )

  const visibles = projets.filter((p) => filtre === "Tous" || p.statut === filtre)

  return (
    <div className="flex flex-col gap-4">
      {/* Status filter */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border px-3 py-2.5 sm:px-4">
        <div className="flex flex-wrap items-center gap-1">
          {(["Tous", ...PROJET_STATUTS] as const).map((s) => {
            const active = filtre === s
            return (
              <button
                key={s}
                type="button"
                onClick={() => setFiltre(s)}
                className={cn(
                  "rounded-pill border px-3 py-1.5 font-ui text-[0.74rem] font-medium transition-colors",
                  active
                    ? "border-border-second bg-surface-nested text-ink"
                    : "border-transparent text-ink-muted hover:text-ink",
                )}
              >
                {s === "Tous" ? "Tous les projets" : s}
              </button>
            )
          })}
        </div>
        <span className="font-body text-[0.74rem] text-ink-muted">
          {visibles.length} projet{visibles.length > 1 ? "s" : ""}
        </span>
      </div>

      {visibles.length === 0 ? (
        <div className="rounded-lg border border-border">
          <EmptyState
            icon={FolderKanban}
            title="Aucun projet"
            description="Aucun projet ne correspond à ce filtre."
            action={
              <Button onClick={onNewProjet}>
                <Plus size={16} /> Nouveau projet
              </Button>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {visibles.map((projet) => {
            const sps = sousProjets.filter((sp) => sp.projetId === projet.id)
            const mesTaches = taches.filter((t) =>
              sps.some((sp) => sp.id === t.sousProjetId),
            )
            const faites = mesTaches.filter((t) => t.statut === "Terminée").length
            const pct = mesTaches.length
              ? Math.round((faites / mesTaches.length) * 100)
              : 0
            const pj = mesTaches.reduce((s, t) => s + t.piecesJointes, 0)
            const com = mesTaches.reduce((s, t) => s + t.commentaires, 0)

            return (
              <article
                key={projet.id}
                className="flex flex-col overflow-hidden rounded-lg border border-border transition-colors hover:border-border-strong"
              >
                {/* Header */}
                <div className="border-b border-border p-4 sm:p-5">
                  <div className="flex items-start gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-surface-nested text-ink-muted">
                      <FolderKanban size={18} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() => onOpenProjet(projet)}
                        className="block w-full text-left"
                      >
                        <h3 className="truncate font-ui text-base font-medium text-ink transition-colors hover:text-brand-blue-600">
                          {projet.nom}
                        </h3>
                      </button>
                      <p className="mt-0.5 line-clamp-2 font-body text-[0.8rem] text-ink-muted">
                        {projet.description}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    <ProjetStatutBadge statut={projet.statut} />
                    <PrioriteBadge priorite={projet.priorite} />
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <span className="font-body text-[0.76rem] text-ink-muted tabular-nums">
                      {faites} / {mesTaches.length} tâches terminées
                    </span>
                    <span className="font-ui text-[0.78rem] font-medium text-ink tabular-nums">
                      {pct}%
                    </span>
                  </div>
                  <ProgressBar
                    className="mt-2"
                    pct={pct}
                    tone={pct === 100 ? "success" : "info"}
                  />

                  <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 font-body text-[0.74rem] text-ink-muted">
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays size={13} /> {projet.echeance}
                    </span>
                    <span className="inline-flex items-center gap-1.5 tabular-nums">
                      <Paperclip size={13} /> {pj}
                    </span>
                    <span className="inline-flex items-center gap-1.5 tabular-nums">
                      <MessageSquare size={13} /> {com}
                    </span>
                  </div>

                  {projet.poles.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {projet.poles.map((p) => (
                        <span
                          key={p}
                          className="rounded-pill border border-brand-blue-600/30 bg-brand-blue-600/10 px-2 py-0.5 font-ui text-[0.66rem] text-brand-blue-600"
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>

                {/* Tâches */}
                <div className="flex max-h-[340px] flex-col gap-1.5 overflow-y-auto p-3 sm:p-4">
                  {mesTaches.length === 0 ? (
                    <p className="py-6 text-center font-body text-[0.78rem] text-ink-disabled">
                      Aucune tâche pour l'instant.
                    </p>
                  ) : (
                    mesTaches.map((t) => {
                      const { icon: Icon } = statutMeta[t.statut]
                      const faitesST = t.sousTaches.filter((s) => s.faite).length
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => onOpenTache(t)}
                          className="rounded-md border border-border p-2.5 text-left transition-colors hover:border-border-strong hover:bg-surface-hover"
                        >
                          <div className="flex items-start gap-2">
                            <Icon
                              size={14}
                              className={cn(
                                "mt-0.5 shrink-0",
                                t.statut === "Terminée"
                                  ? "text-success"
                                  : t.statut === "En pause"
                                    ? "text-warning"
                                    : t.statut === "À faire"
                                      ? "text-ink-disabled"
                                      : "text-brand-blue-600",
                              )}
                            />
                            <span
                              className={cn(
                                "min-w-0 flex-1 truncate font-body text-[0.82rem]",
                                t.statut === "Terminée"
                                  ? "text-ink-muted line-through"
                                  : "text-ink",
                              )}
                            >
                              {t.nom}
                            </span>
                            {t.sousTaches.length > 0 ? (
                              <span className="shrink-0 font-body text-[0.72rem] text-ink-muted tabular-nums">
                                {faitesST}/{t.sousTaches.length}
                              </span>
                            ) : null}
                          </div>
                          <div className="mt-2 ml-6 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                            <AssigneeChip
                              membre={t.assigneId ? membreById[t.assigneId] : null}
                            />
                            <Echeance tache={t} />
                          </div>
                        </button>
                      )
                    })
                  )}
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}
