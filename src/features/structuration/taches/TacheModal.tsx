import { useMemo, useState } from "react"
import { Plus, Trash2, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { useData } from "@/data/useData"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, Select, inputCls } from "@/features/finance/ui"
import {
  TACHE_PRIORITES,
  TACHE_STATUTS,
  type SousTache,
  type Tache,
  type TachePriorite,
  type TacheStatut,
} from "@/data/seed/taches"

import { avancement, ProgressBar, SousTacheRow } from "./ui"

const NONE = "__none__"

/**
 * Create or edit a tâche — the module's one editing surface. Everything is held
 * locally and committed on "Enregistrer", so a half-typed sous-tâche never
 * leaks into the board behind the modal.
 */
export function TacheModal({
  tache,
  defaultSousProjetId,
  onClose,
  onSaved,
  onDeleted,
}: {
  /** Null opens the modal in "nouvelle tâche" mode. */
  tache: Tache | null
  defaultSousProjetId?: string
  onClose: () => void
  onSaved: (nom: string) => void
  onDeleted?: (nom: string) => void
}) {
  const {
    projets,
    sousProjets,
    orgMembres,
    addTache,
    updateTache,
    removeTache,
    setSousTaches,
  } = useData()

  const [nom, setNom] = useState(tache?.nom ?? "")
  const [description, setDescription] = useState(tache?.description ?? "")
  const [statut, setStatut] = useState<TacheStatut>(tache?.statut ?? "À faire")
  const [priorite, setPriorite] = useState<TachePriorite>(
    tache?.priorite ?? "Moyenne",
  )
  const [assigneId, setAssigneId] = useState(tache?.assigneId ?? "")
  const [echeance, setEcheance] = useState(tache?.echeance ?? "")
  const [sousProjetId, setSousProjetId] = useState(
    tache?.sousProjetId ?? defaultSousProjetId ?? sousProjets[0]?.id ?? "",
  )
  const [liste, setListe] = useState<SousTache[]>(
    () => tache?.sousTaches.map((s) => ({ ...s })) ?? [],
  )
  const [draft, setDraft] = useState("")

  const membreOptions = useMemo(
    () => [
      { value: NONE, label: "Non attribuée" },
      ...orgMembres.map((m) => ({ value: m.id, label: `${m.nom} — ${m.role}` })),
    ],
    [orgMembres],
  )

  const sousProjetOptions = useMemo(
    () =>
      sousProjets.map((sp) => ({
        value: sp.id,
        label: `${projets.find((p) => p.id === sp.projetId)?.nom ?? "—"} › ${sp.nom}`,
      })),
    [sousProjets, projets],
  )

  const membreById = useMemo(
    () => Object.fromEntries(orgMembres.map((m) => [m.id, m])),
    [orgMembres],
  )

  const ajouterSousTache = () => {
    const label = draft.trim()
    if (!label) return
    setListe((prev) => [
      ...prev,
      { id: crypto.randomUUID(), nom: label, faite: false, assigneId: null },
    ])
    setDraft("")
  }

  const enregistrer = () => {
    const titre = nom.trim() || "Nouvelle tâche"
    const commun = {
      nom: titre,
      description: description.trim(),
      statut,
      priorite,
      assigneId: assigneId || null,
      echeance: echeance.trim() || "Non planifiée",
      sousProjetId,
    }
    if (tache) {
      updateTache(tache.id, commun)
      setSousTaches(tache.id, liste)
    } else {
      addTache({
        ...commun,
        sousTaches: liste,
        piecesJointes: 0,
        commentaires: 0,
      })
    }
    onSaved(titre)
    onClose()
  }

  const { faites, total, pct } = avancement({
    ...(tache ?? ({} as Tache)),
    statut,
    sousTaches: liste,
  })

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="gap-0 overflow-hidden rounded-xl border-border bg-surface p-0 sm:max-w-[640px]"
      >
        <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div className="min-w-0">
            <DialogTitle className="font-ui text-base font-medium text-ink">
              {tache ? "Modifier la tâche" : "Nouvelle tâche"}
            </DialogTitle>
            <DialogDescription className="mt-0.5 font-body text-[0.8rem] text-ink-muted">
              {tache
                ? "Statut, responsable et sous-tâches."
                : "Rattachez-la à un sous-projet et découpez-la si besoin."}
            </DialogDescription>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="flex size-[30px] shrink-0 items-center justify-center rounded-sm border border-border text-ink-disabled transition-colors hover:border-border-strong hover:text-ink"
          >
            <X size={15} />
          </button>
        </div>

        <div className="flex max-h-[64vh] flex-col gap-3.5 overflow-y-auto px-5 py-4">
          <Field label="Intitulé">
            <input
              autoFocus
              className={inputCls}
              value={nom}
              placeholder="Ex. Clôturer les licences 2026-2027"
              onChange={(e) => setNom(e.target.value)}
            />
          </Field>

          <Field label="Description">
            <textarea
              rows={2}
              className={cn(inputCls, "resize-none")}
              value={description}
              placeholder="Ce qu'il y a à faire, en une phrase."
              onChange={(e) => setDescription(e.target.value)}
            />
          </Field>

          <Field label="Sous-projet">
            <Select
              value={sousProjetId}
              onChange={setSousProjetId}
              options={sousProjetOptions}
            />
          </Field>

          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
            <Field label="Statut">
              <Select
                value={statut}
                onChange={(v) => setStatut(v as TacheStatut)}
                options={TACHE_STATUTS.map((s) => ({ value: s, label: s }))}
              />
            </Field>
            <Field label="Priorité">
              <Select
                value={priorite}
                onChange={(v) => setPriorite(v as TachePriorite)}
                options={TACHE_PRIORITES.map((p) => ({ value: p, label: p }))}
              />
            </Field>
            <Field label="Échéance">
              <input
                className={inputCls}
                value={echeance}
                placeholder="12 sept. 2026"
                onChange={(e) => setEcheance(e.target.value)}
              />
            </Field>
          </div>

          <Field label="Responsable">
            <Select
              value={assigneId || NONE}
              onChange={(v) => setAssigneId(v === NONE ? "" : v)}
              options={membreOptions}
            />
          </Field>

          {/* Sous-tâches */}
          <div className="rounded-lg border border-border">
            <div className="flex items-center justify-between gap-3 border-b border-border px-3.5 py-2.5">
              <span className="font-ui text-[0.68rem] font-medium tracking-[0.08em] text-ink-muted uppercase">
                Sous-tâches
              </span>
              {total > 0 ? (
                <span className="font-body text-[0.72rem] text-ink-muted tabular-nums">
                  {faites}/{total}
                </span>
              ) : null}
            </div>

            {total > 0 ? (
              <div className="px-3.5 pt-3">
                <ProgressBar pct={pct} tone={pct === 100 ? "success" : "info"} />
              </div>
            ) : null}

            <div className="flex flex-col gap-1 px-2.5 py-2.5">
              {liste.length === 0 ? (
                <p className="px-1 py-2 text-center font-body text-[0.76rem] text-ink-disabled">
                  Aucune sous-tâche — la tâche se suit d'un bloc.
                </p>
              ) : (
                liste.map((s) => (
                  <div key={s.id} className="flex flex-col gap-1">
                    <SousTacheRow
                      sousTache={s}
                      membre={s.assigneId ? membreById[s.assigneId] : null}
                      onToggle={() =>
                        setListe((prev) =>
                          prev.map((x) =>
                            x.id === s.id ? { ...x, faite: !x.faite } : x,
                          ),
                        )
                      }
                      action={
                        <button
                          type="button"
                          aria-label={`Supprimer « ${s.nom} »`}
                          onClick={() =>
                            setListe((prev) => prev.filter((x) => x.id !== s.id))
                          }
                          className="flex size-6 shrink-0 items-center justify-center rounded-sm text-ink-disabled transition-colors hover:bg-surface-hover hover:text-danger"
                        >
                          <Trash2 size={13} />
                        </button>
                      }
                    />
                    <div className="mb-1 ml-[30px]">
                      <Select
                        value={s.assigneId || NONE}
                        onChange={(v) =>
                          setListe((prev) =>
                            prev.map((x) =>
                              x.id === s.id
                                ? { ...x, assigneId: v === NONE ? null : v }
                                : x,
                            ),
                          )
                        }
                        options={membreOptions}
                      />
                    </div>
                  </div>
                ))
              )}

              <div className="mt-1 flex items-center gap-2">
                <input
                  className={cn(inputCls, "py-2")}
                  value={draft}
                  placeholder="Ajouter une sous-tâche…"
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      ajouterSousTache()
                    }
                  }}
                />
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Ajouter la sous-tâche"
                  disabled={!draft.trim()}
                  onClick={ajouterSousTache}
                >
                  <Plus size={16} />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          {tache && onDeleted ? (
            <Button
              variant="ghost"
              className="text-danger hover:text-danger"
              onClick={() => {
                removeTache(tache.id)
                onDeleted(tache.nom)
                onClose()
              }}
            >
              <Trash2 size={15} /> Supprimer
            </Button>
          ) : (
            <span className="hidden sm:block" />
          )}
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <Button variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button onClick={enregistrer}>Enregistrer</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
