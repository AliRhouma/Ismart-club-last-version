import { useMemo, useState } from "react"
import { Check, Library, Search, Timer, Users, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { useData } from "@/data/useData"
import { procedeFromLibrary, type Procede } from "@/data/seed/seances"
import type { ProcedeItem, ProcedeType } from "@/data/seed/procedes"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { ProcedeVignette } from "@/features/planification/ProcedeVignette"
import { Select, inputCls } from "@/features/finance/ui"
import { Segmented, type SegOption } from "@/features/budget/ui"

/**
 * Procédé picker — Séance ▸ Procédé ▸ « Ajouter un procédé ».
 *
 * The club already keeps its exercises in one place (Pôle technique ▸
 * Procédés), so building a séance is *picking from the library*, never
 * re-typing an exercise. Three filters cover how a coach actually looks for
 * one: the phase de jeu it trains (groupe), its form (jeu / situation /
 * exercice), and its name. Selection is multiple — a séance is built in one
 * pass, not one modal per exercise.
 *
 * What lands in the séance is a **copy** (`procedeFromLibrary`), so the same
 * exercise can be programmed twice and the library stays untouched.
 */

type TypeFiltre = "tous" | ProcedeType

const TYPE_OPTIONS: SegOption<TypeFiltre>[] = [
  { value: "tous", label: "Tous" },
  { value: "Jeu", label: "Jeu" },
  { value: "Situation", label: "Situation" },
  { value: "Exercice", label: "Exercice" },
]

export function ProcedePicker({
  seanceLabel,
  /** Library ids already in the séance — flagged, but not blocked: a coach may
   *  deliberately run the same exercise twice in one session. */
  dejaProgrammes,
  onClose,
  onAdd,
}: {
  seanceLabel: string
  dejaProgrammes: string[]
  onClose: () => void
  onAdd: (procedes: Procede[]) => void
}) {
  const { procedes, procedeGroupes, procedePhases, procedePrincipes } = useData()

  const [groupeId, setGroupeId] = useState("")
  const [type, setType] = useState<TypeFiltre>("tous")
  const [q, setQ] = useState("")
  const [choisis, setChoisis] = useState<string[]>([])

  /** principe id → its name and the groupe it hangs off. */
  const principeIndex = useMemo(() => {
    const phaseGroupe = new Map(procedePhases.map((p) => [p.id, p.groupeId]))
    return new Map(
      procedePrincipes.map((p) => [
        p.id,
        { nom: p.nom, groupeId: phaseGroupe.get(p.phaseId) ?? "" },
      ]),
    )
  }, [procedePhases, procedePrincipes])

  const query = q.trim().toLowerCase()
  const resultats = useMemo(
    () =>
      procedes.filter((p) => {
        if (type !== "tous" && p.type !== type) return false
        if (groupeId && principeIndex.get(p.principeId)?.groupeId !== groupeId)
          return false
        if (!query) return true
        return (
          p.titre.toLowerCase().includes(query) ||
          (principeIndex.get(p.principeId)?.nom ?? "")
            .toLowerCase()
            .includes(query)
        )
      }),
    [procedes, type, groupeId, query, principeIndex],
  )

  const toggle = (id: string) =>
    setChoisis((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )

  const ajouter = () => {
    // Keep the coach's picking order — that's the order they land in the plan.
    const items = choisis
      .map((id) => procedes.find((p) => p.id === id))
      .filter((p): p is ProcedeItem => Boolean(p))
    onAdd(items.map(procedeFromLibrary))
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="flex max-h-[92svh] flex-col gap-0 overflow-hidden rounded-xl border-border bg-surface p-0 sm:max-w-[54rem]">
        {/* Header */}
        <div className="flex items-start gap-3 border-b border-border px-5 py-4">
          <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-md bg-brand-blue-600/10 text-brand-blue-600">
            <Library size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <DialogTitle className="truncate font-ui text-base font-medium text-ink">
              Ajouter un procédé
            </DialogTitle>
            <DialogDescription className="mt-0.5 font-body text-[0.8rem] text-ink-muted">
              {seanceLabel} — choisissez dans la bibliothèque du club.
            </DialogDescription>
          </div>
        </div>

        {/* Filtres */}
        <div className="flex flex-col gap-3 border-b border-border px-5 py-3.5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative min-w-0 flex-1">
              <Search
                size={15}
                className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-disabled"
              />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Rechercher un procédé ou un principe…"
                className={cn(inputCls, "pl-9")}
              />
              {q ? (
                <button
                  type="button"
                  aria-label="Effacer la recherche"
                  onClick={() => setQ("")}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-ink-disabled transition-colors hover:text-ink"
                >
                  <X size={15} />
                </button>
              ) : null}
            </div>
            <div className="w-full shrink-0 sm:w-56">
              <Select
                value={groupeId}
                onChange={setGroupeId}
                options={[
                  { value: "", label: "Toutes les phases de jeu" },
                  ...procedeGroupes.map((g) => ({ value: g.id, label: g.nom })),
                ]}
              />
            </div>
          </div>
          <Segmented value={type} onChange={setType} options={TYPE_OPTIONS} />
        </div>

        {/* Résultats */}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {resultats.length === 0 ? (
            <p className="rounded-lg border border-border px-4 py-10 text-center font-body text-[0.85rem] text-ink-disabled">
              Aucun procédé ne correspond. Élargissez la recherche, ou créez-le
              dans Pôle technique ▸ Procédés.
            </p>
          ) : (
            <ul className="overflow-hidden rounded-lg border border-border">
              {resultats.map((p, i) => (
                <ProcedeLigne
                  key={p.id}
                  procede={p}
                  principe={principeIndex.get(p.principeId)?.nom ?? "—"}
                  on={choisis.includes(p.id)}
                  deja={dejaProgrammes.includes(p.id)}
                  first={i === 0}
                  onToggle={() => toggle(p.id)}
                />
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-col gap-3 border-t border-border px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-body text-[0.82rem] text-ink-muted">
            <span className="font-ui font-medium text-ink tabular-nums">
              {choisis.length}
            </span>{" "}
            procédé{choisis.length > 1 ? "s" : ""} sélectionné
            {choisis.length > 1 ? "s" : ""} sur{" "}
            <span className="tabular-nums">{resultats.length}</span> affiché
            {resultats.length > 1 ? "s" : ""}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button onClick={ajouter} disabled={choisis.length === 0}>
              <Check size={16} />
              Ajouter à la séance
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/** One library procédé, selectable. */
function ProcedeLigne({
  procede,
  principe,
  on,
  deja,
  first,
  onToggle,
}: {
  procede: ProcedeItem
  principe: string
  on: boolean
  deja: boolean
  first: boolean
  onToggle: () => void
}) {
  const [joueurs, gardiens] = procede.effectif
  return (
    <li>
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={on}
        className={cn(
          "flex w-full items-start gap-3 px-3.5 py-3 text-left transition-colors hover:bg-surface-hover",
          !first && "border-t border-border",
        )}
      >
        <span
          className={cn(
            "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-sm border transition-colors",
            on
              ? "border-info bg-info/15 text-info"
              : "border-border-strong text-transparent",
          )}
        >
          <Check size={13} />
        </span>

        {/* Le schéma : ce qu'on reconnaît avant de lire le titre. */}
        <ProcedeVignette
          src={procede.image}
          titre={procede.titre}
          className="h-14 w-20 sm:h-16 sm:w-24"
        />

        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="truncate font-ui text-[0.88rem] text-ink">
              {procede.titre}
            </span>
            <span className="shrink-0 rounded-pill border border-brand-blue-600/30 bg-brand-blue-600/10 px-2 py-0.5 font-ui text-[0.66rem] font-medium text-brand-blue-600">
              {procede.type}
            </span>
            {deja ? (
              <span className="shrink-0 rounded-pill border border-border-strong px-2 py-0.5 font-ui text-[0.66rem] text-ink-muted">
                Déjà programmé
              </span>
            ) : null}
          </span>
          <span className="mt-1 block truncate font-body text-[0.76rem] text-ink-muted">
            {principe}
          </span>
          <span className="mt-1.5 flex flex-wrap items-center gap-x-3.5 gap-y-1 font-ui text-[0.72rem] text-ink-disabled">
            <span className="inline-flex items-center gap-1.5">
              <Timer size={12} />
              <span className="tabular-nums">{procede.duree} min</span> ·{" "}
              <span className="tabular-nums">{procede.sequence}</span> · récup{" "}
              <span className="tabular-nums">{procede.recuperation} s</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Users size={12} />
              <span className="tabular-nums">{joueurs}</span> joueurs
              {gardiens > 0 ? (
                <>
                  {" · "}
                  <span className="tabular-nums">{gardiens}</span> gardien
                  {gardiens > 1 ? "s" : ""}
                </>
              ) : null}
            </span>
            <span className="tabular-nums">
              {procede.surface[0]} × {procede.surface[1]} m
            </span>
          </span>
        </span>
      </button>
    </li>
  )
}
