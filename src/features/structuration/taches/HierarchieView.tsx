import { useMemo, useState } from "react"
import {
  ChevronDown,
  ChevronRight,
  FolderTree,
  ListChecks,
  Pencil,
  Search,
  Users,
  UserX,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { useData } from "@/data/useData"
import { Avatar } from "@/components/kit/Avatar"
import { EmptyState } from "@/components/kit/EmptyState"
import { Select, inputCls } from "@/features/finance/ui"
import type { Projet, Tache } from "@/data/seed/taches"

import {
  AssigneeChip,
  Echeance,
  PrioriteBadge,
  ProgressBar,
  ProjetStatutBadge,
  SousTacheRow,
  statutMeta,
} from "./ui"

type Assignation = "toutes" | "attribuees" | "non-attribuees"

const ASSIGNATIONS: { value: Assignation; label: string; icon: typeof Users }[] = [
  { value: "toutes", label: "Toutes", icon: ListChecks },
  { value: "attribuees", label: "Attribuées", icon: Users },
  { value: "non-attribuees", label: "Non attribuées", icon: UserX },
]

/** How many of a set of tâches are done. */
function progression(taches: Tache[]) {
  const total = taches.length
  const faites = taches.filter((t) => t.statut === "Terminée").length
  return { faites, total, pct: total ? Math.round((faites / total) * 100) : 0 }
}

/**
 * Hiérarchie — projet › sous-projet › tâche › sous-tâche, with the assignment
 * filters that make "what is nobody carrying?" a one-click question. The rail
 * holds the filters on desktop and stacks above the tree on a phone.
 */
export function HierarchieView({
  onOpenTache,
  onOpenProjet,
}: {
  onOpenTache: (tache: Tache) => void
  onOpenProjet: (projet: Projet) => void
}) {
  const { projets, sousProjets, taches, orgMembres, toggleSousTache } = useData()

  const [assignation, setAssignation] = useState<Assignation>("toutes")
  const [responsable, setResponsable] = useState("")
  const [recherche, setRecherche] = useState("")
  const [ouverts, setOuverts] = useState<Set<string>>(
    () => new Set([projets[0]?.id, sousProjets[0]?.id].filter(Boolean) as string[]),
  )

  const basculer = (id: string) =>
    setOuverts((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const membreById = useMemo(
    () => Object.fromEntries(orgMembres.map((m) => [m.id, m])),
    [orgMembres],
  )

  const visibles = useMemo(() => {
    const q = recherche.trim().toLowerCase()
    return taches.filter((t) => {
      if (assignation === "attribuees" && !t.assigneId) return false
      if (assignation === "non-attribuees" && t.assigneId) return false
      if (responsable && t.assigneId !== responsable) return false
      if (q && !t.nom.toLowerCase().includes(q) && !t.description.toLowerCase().includes(q))
        return false
      return true
    })
  }, [taches, assignation, responsable, recherche])

  const nonAttribuees = taches.filter((t) => !t.assigneId).length

  // Only people who actually carry something show up in the filter.
  const responsableOptions = useMemo(() => {
    const ids = new Set(taches.map((t) => t.assigneId).filter(Boolean) as string[])
    return orgMembres
      .filter((m) => ids.has(m.id))
      .map((m) => ({ value: m.id, label: m.nom }))
  }, [taches, orgMembres])

  const projetsVisibles = projets.filter((p) =>
    visibles.some((t) =>
      sousProjets.some((sp) => sp.projetId === p.id && sp.id === t.sousProjetId),
    ),
  )

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-5">
      {/* Filters rail */}
      <aside className="flex shrink-0 flex-col gap-3 rounded-lg border border-border p-4 lg:sticky lg:top-4 lg:w-[290px]">
        <span className="font-ui text-[0.62rem] font-medium tracking-[0.1em] text-ink-muted uppercase">
          Filtres
        </span>

        {/* A vertical list, not a segmented row: "Non attribuées" never fits on
            a third of a 290px rail, and truncating the one filter people look
            for would be the wrong thing to shorten. */}
        <div className="flex flex-col gap-1 rounded-md border border-border p-1">
          {ASSIGNATIONS.map(({ value, label, icon: Icon }) => {
            const active = assignation === value
            const compte =
              value === "toutes"
                ? taches.length
                : value === "attribuees"
                  ? taches.length - nonAttribuees
                  : nonAttribuees
            return (
              <button
                key={value}
                type="button"
                onClick={() => setAssignation(value)}
                className={cn(
                  "flex items-center gap-2 rounded-sm border px-2.5 py-1.5 text-left font-ui text-[0.74rem] font-medium transition-colors",
                  active
                    ? "border-border-second bg-surface-nested text-ink"
                    : "border-transparent text-ink-muted hover:text-ink",
                )}
              >
                <Icon size={14} className="shrink-0" />
                <span className="min-w-0 flex-1 truncate">{label}</span>
                <span
                  className={cn(
                    "shrink-0 rounded-pill px-1.5 font-ui text-[0.64rem] tabular-nums",
                    value === "non-attribuees" && compte > 0
                      ? "bg-warning/15 text-warning"
                      : "bg-surface-nested text-ink-muted",
                  )}
                >
                  {compte}
                </span>
              </button>
            )
          })}
        </div>

        <div className="relative">
          <Search
            size={14}
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-disabled"
          />
          <input
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Rechercher une tâche…"
            className={cn(inputCls, "py-2 pl-9")}
          />
        </div>

        <Select
          value={responsable}
          onChange={setResponsable}
          options={responsableOptions}
          placeholder="Tous les responsables"
        />

        <div className="mt-1 flex items-center justify-between border-t border-border pt-3">
          <span className="font-body text-[0.74rem] text-ink-muted">
            {visibles.length} tâche{visibles.length > 1 ? "s" : ""} affichée
            {visibles.length > 1 ? "s" : ""}
          </span>
          {assignation !== "toutes" || responsable || recherche ? (
            <button
              type="button"
              onClick={() => {
                setAssignation("toutes")
                setResponsable("")
                setRecherche("")
              }}
              className="font-ui text-[0.68rem] font-medium tracking-[0.05em] text-info uppercase transition-opacity hover:opacity-80"
            >
              Réinitialiser
            </button>
          ) : null}
        </div>
      </aside>

      {/* Tree */}
      <div className="min-w-0 flex-1 rounded-lg border border-border">
        {projetsVisibles.length === 0 ? (
          <EmptyState
            icon={FolderTree}
            title="Aucune tâche"
            description="Aucune tâche ne correspond à ces filtres. Élargissez la recherche ou réinitialisez-les."
          />
        ) : (
          <ul className="divide-y divide-border">
            {projetsVisibles.map((projet) => {
              const sps = sousProjets.filter((sp) => sp.projetId === projet.id)
              const mesTaches = visibles.filter((t) =>
                sps.some((sp) => sp.id === t.sousProjetId),
              )
              const { faites, total, pct } = progression(mesTaches)
              const open = ouverts.has(projet.id)

              return (
                <li key={projet.id}>
                  {/* Projet */}
                  <div className="flex items-center gap-1 px-2 py-2 sm:px-3">
                    <button
                      type="button"
                      onClick={() => basculer(projet.id)}
                      className="flex min-w-0 flex-1 items-center gap-2.5 rounded-sm px-1.5 py-1.5 text-left transition-colors hover:bg-surface-hover"
                    >
                      <span className="shrink-0 text-ink-muted">
                        {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-ui text-[0.9rem] font-medium text-ink">
                          {projet.nom}
                        </span>
                        <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                          <ProjetStatutBadge statut={projet.statut} />
                          <span className="font-body text-[0.72rem] text-ink-muted tabular-nums">
                            {faites}/{total} tâches · {pct}%
                          </span>
                        </span>
                      </span>
                    </button>
                    <div className="hidden w-32 shrink-0 sm:block">
                      <ProgressBar pct={pct} tone={pct === 100 ? "success" : "info"} />
                    </div>
                    <button
                      type="button"
                      aria-label={`Modifier « ${projet.nom} »`}
                      onClick={() => onOpenProjet(projet)}
                      className="flex size-8 shrink-0 items-center justify-center rounded-sm text-ink-muted transition-colors hover:bg-surface-hover hover:text-ink"
                    >
                      <Pencil size={14} />
                    </button>
                  </div>

                  {/* Sous-projets */}
                  {open ? (
                    <div className="ml-4 border-l border-border pb-2 sm:ml-6">
                      {sps.map((sp) => {
                        const spTaches = visibles.filter(
                          (t) => t.sousProjetId === sp.id,
                        )
                        if (spTaches.length === 0) return null
                        const spOpen = ouverts.has(sp.id)
                        const p = progression(spTaches)

                        return (
                          <div key={sp.id} className="pl-2 sm:pl-3">
                            <button
                              type="button"
                              onClick={() => basculer(sp.id)}
                              className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left transition-colors hover:bg-surface-hover"
                            >
                              <span className="shrink-0 text-ink-muted">
                                {spOpen ? (
                                  <ChevronDown size={14} />
                                ) : (
                                  <ChevronRight size={14} />
                                )}
                              </span>
                              <span className="min-w-0 flex-1 truncate font-body text-[0.82rem] text-ink-subtle">
                                {sp.nom}
                              </span>
                              <span className="hidden shrink-0 font-body text-[0.7rem] text-ink-disabled sm:block">
                                {sp.pole}
                              </span>
                              <span className="shrink-0 font-body text-[0.7rem] text-ink-muted tabular-nums">
                                {p.faites}/{p.total}
                              </span>
                            </button>

                            {/* Tâches */}
                            {spOpen ? (
                              <ul className="mt-0.5 mb-2 ml-3 flex flex-col gap-1 border-l border-border pl-2 sm:ml-4 sm:pl-3">
                                {spTaches.map((t) => {
                                  const { icon: Icon } = statutMeta[t.statut]
                                  const tOpen = ouverts.has(t.id)
                                  const membre = t.assigneId
                                    ? membreById[t.assigneId]
                                    : null
                                  return (
                                    <li key={t.id}>
                                      <div className="flex items-center gap-2 rounded-sm px-1.5 py-1.5 transition-colors hover:bg-surface-hover">
                                        <button
                                          type="button"
                                          aria-label={
                                            tOpen
                                              ? "Masquer les sous-tâches"
                                              : "Voir les sous-tâches"
                                          }
                                          disabled={t.sousTaches.length === 0}
                                          onClick={() => basculer(t.id)}
                                          className="flex size-5 shrink-0 items-center justify-center rounded-sm text-ink-disabled transition-colors enabled:hover:text-ink disabled:opacity-0"
                                        >
                                          {tOpen ? (
                                            <ChevronDown size={13} />
                                          ) : (
                                            <ChevronRight size={13} />
                                          )}
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() => onOpenTache(t)}
                                          className="flex min-w-0 flex-1 items-center gap-2 text-left"
                                        >
                                          <Icon
                                            size={13}
                                            className={cn(
                                              "shrink-0",
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
                                        </button>

                                        <span className="hidden shrink-0 md:block">
                                          <PrioriteBadge priorite={t.priorite} />
                                        </span>
                                        <span className="hidden shrink-0 lg:block">
                                          <Echeance tache={t} />
                                        </span>
                                        <span className="shrink-0">
                                          {membre ? (
                                            <Avatar name={membre.nom} size="sm" />
                                          ) : (
                                            <AssigneeChip
                                              membre={null}
                                              className="[&>span]:hidden"
                                            />
                                          )}
                                        </span>
                                      </div>

                                      {/* Sous-tâches — tickable straight from the tree */}
                                      {tOpen ? (
                                        <div className="mt-0.5 mb-1.5 ml-7 flex flex-col">
                                          {t.sousTaches.map((s) => (
                                            <SousTacheRow
                                              key={s.id}
                                              sousTache={s}
                                              membre={
                                                s.assigneId
                                                  ? membreById[s.assigneId]
                                                  : null
                                              }
                                              onToggle={() =>
                                                toggleSousTache(t.id, s.id)
                                              }
                                            />
                                          ))}
                                        </div>
                                      ) : null}
                                    </li>
                                  )
                                })}
                              </ul>
                            ) : null}
                          </div>
                        )
                      })}
                    </div>
                  ) : null}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
