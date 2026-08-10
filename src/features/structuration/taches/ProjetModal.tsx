import { useState } from "react"
import { Check, Plus, Trash2, X } from "lucide-react"

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
  PROJET_STATUTS,
  TACHE_PRIORITES,
  type Projet,
  type ProjetStatut,
  type TachePriorite,
} from "@/data/seed/taches"

/**
 * Create or edit a projet. The pôles are picked straight from the organigramme's
 * unités — the two modules share the same vocabulary, so a projet can't name a
 * pôle the club doesn't have.
 */
export function ProjetModal({
  projet,
  onClose,
  onSaved,
  onDeleted,
}: {
  projet: Projet | null
  onClose: () => void
  onSaved: (nom: string) => void
  onDeleted?: (nom: string) => void
}) {
  const {
    orgUnites,
    sousProjets,
    addProjet,
    updateProjet,
    removeProjet,
    addSousProjet,
  } = useData()

  const [nom, setNom] = useState(projet?.nom ?? "")
  const [description, setDescription] = useState(projet?.description ?? "")
  const [statut, setStatut] = useState<ProjetStatut>(
    projet?.statut ?? "Planification",
  )
  const [priorite, setPriorite] = useState<TachePriorite>(
    projet?.priorite ?? "Moyenne",
  )
  const [echeance, setEcheance] = useState(projet?.echeance ?? "")
  const [poles, setPoles] = useState<string[]>(projet?.poles ?? [])
  const [premierSousProjet, setPremierSousProjet] = useState("")

  const unites = orgUnites.filter((u) => u.nom.trim() !== "")
  const mesSousProjets = projet
    ? sousProjets.filter((sp) => sp.projetId === projet.id)
    : []

  const enregistrer = () => {
    const titre = nom.trim() || "Nouveau projet"
    const commun = {
      nom: titre,
      description: description.trim(),
      statut,
      priorite,
      poles,
      echeance: echeance.trim() || "Non planifié",
    }
    if (projet) {
      updateProjet(projet.id, commun)
    } else {
      const id = addProjet(commun)
      // A projet without a sous-projet can't hold a tâche, so seed the first one.
      addSousProjet({
        projetId: id,
        nom: premierSousProjet.trim() || "Général",
        pole: poles[0] ?? "—",
      })
    }
    onSaved(titre)
    onClose()
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="gap-0 overflow-hidden rounded-xl border-border bg-surface p-0 sm:max-w-[580px]"
      >
        <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div className="min-w-0">
            <DialogTitle className="font-ui text-base font-medium text-ink">
              {projet ? "Modifier le projet" : "Nouveau projet"}
            </DialogTitle>
            <DialogDescription className="mt-0.5 font-body text-[0.8rem] text-ink-muted">
              Un chantier du club, découpé en sous-projets.
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
          <Field label="Nom du projet">
            <input
              autoFocus
              className={inputCls}
              value={nom}
              placeholder="Ex. Tournoi international U17"
              onChange={(e) => setNom(e.target.value)}
            />
          </Field>

          <Field label="Description">
            <textarea
              rows={2}
              className={cn(inputCls, "resize-none")}
              value={description}
              placeholder="Ce que le projet doit produire."
              onChange={(e) => setDescription(e.target.value)}
            />
          </Field>

          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
            <Field label="Statut">
              <Select
                value={statut}
                onChange={(v) => setStatut(v as ProjetStatut)}
                options={PROJET_STATUTS.map((s) => ({ value: s, label: s }))}
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
                placeholder="20 déc. 2026"
                onChange={(e) => setEcheance(e.target.value)}
              />
            </Field>
          </div>

          <Field label="Pôles concernés" hint="Les unités de l'organigramme.">
            <div className="flex flex-wrap gap-1.5">
              {unites.map((u) => {
                const on = poles.includes(u.nom)
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() =>
                      setPoles((prev) =>
                        on ? prev.filter((p) => p !== u.nom) : [...prev, u.nom],
                      )
                    }
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-pill border px-2.5 py-1 font-ui text-[0.7rem] transition-colors",
                      on
                        ? "border-brand-blue-600/40 bg-brand-blue-600/10 text-brand-blue-600"
                        : "border-border text-ink-muted hover:border-border-strong hover:text-ink",
                    )}
                  >
                    {on ? <Check size={11} /> : null}
                    {u.nom}
                  </button>
                )
              })}
            </div>
          </Field>

          {projet ? (
            <Field label="Sous-projets">
              <div className="flex flex-col gap-1.5">
                {mesSousProjets.length === 0 ? (
                  <span className="font-body text-[0.76rem] text-ink-disabled">
                    Aucun sous-projet.
                  </span>
                ) : (
                  mesSousProjets.map((sp) => (
                    <div
                      key={sp.id}
                      className="flex items-center justify-between gap-2 rounded-sm border border-border px-3 py-2"
                    >
                      <span className="min-w-0 truncate font-body text-[0.8rem] text-ink">
                        {sp.nom}
                      </span>
                      <span className="shrink-0 font-body text-[0.7rem] text-ink-muted">
                        {sp.pole}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </Field>
          ) : (
            <Field
              label="Premier sous-projet"
              hint="Une tâche est toujours rattachée à un sous-projet."
            >
              <div className="flex items-center gap-2">
                <input
                  className={inputCls}
                  value={premierSousProjet}
                  placeholder="Général"
                  onChange={(e) => setPremierSousProjet(e.target.value)}
                />
                <span className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border text-ink-disabled">
                  <Plus size={15} />
                </span>
              </div>
            </Field>
          )}
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          {projet && onDeleted ? (
            <Button
              variant="ghost"
              className="text-danger hover:text-danger"
              onClick={() => {
                removeProjet(projet.id)
                onDeleted(projet.nom)
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
