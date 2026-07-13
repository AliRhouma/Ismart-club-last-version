import { useState, type ReactNode } from "react"
import { Check, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { useData } from "@/data/useData"
import { CATEGORIES, PLAYER_POOL } from "@/data/seed/objectifs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"

const inputCls =
  "w-full rounded-md border border-input bg-transparent px-3.5 py-2.5 font-body text-sm text-ink outline-none transition-colors placeholder:text-ink-disabled focus:border-border-focus"

function Field({
  label,
  children,
  hint,
}: {
  label: string
  children: ReactNode
  hint?: string
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-ui text-[0.7rem] font-medium tracking-[0.06em] text-ink-muted uppercase">
        {label}
      </span>
      {children}
      {hint ? (
        <span className="font-body text-[0.72rem] text-ink-disabled">{hint}</span>
      ) : null}
    </label>
  )
}

/**
 * Create-objective modal. Fields are pre-filled with a believable draft (no
 * validation, no derived logic — per the task). On "Créer" it adds the
 * objective to the store, which also pushes an unread notification to the bell.
 */
export function ObjectifFormModal({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: (titre: string) => void
}) {
  const { addObjectif } = useData()

  // Pre-filled draft.
  const [titre, setTitre] = useState("Objectif accélération 10m")
  const [categorie, setCategorie] = useState("Minime")
  const [affecter, setAffecter] = useState("Sélection Minime A — 22 joueurs")
  const [critere, setCritere] = useState("Sprint 10m départ arrêté")
  const [valeurCible, setValeurCible] = useState("1.9 s")
  const [description, setDescription] = useState(
    "Améliorer l'explosivité sur les 10 premiers mètres, mesurée au chronomètre électronique.",
  )

  const submit = () => {
    addObjectif({
      titre: titre.trim() || "Nouvel objectif",
      categorie,
      // The picker is illustrative — assign a representative squad so the row
      // shows a realistic "Nom, Nom +N".
      assignes: PLAYER_POOL.slice(0, 22),
      critere: critere.trim(),
      valeurCible: valeurCible.trim(),
      description: description.trim(),
    })
    onCreated(titre.trim() || "Nouvel objectif")
    onClose()
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="gap-0 overflow-hidden rounded-xl border-border bg-surface p-0 sm:max-w-[560px]"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div className="min-w-0">
            <DialogTitle className="font-ui text-base font-medium text-ink">
              Nouvel objectif technique
            </DialogTitle>
            <DialogDescription className="mt-0.5 font-body text-[0.8rem] text-ink-muted">
              Définissez la cible, le critère d'évaluation et l'affectation.
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

        {/* Body */}
        <div className="flex max-h-[70vh] flex-col gap-3.5 overflow-y-auto px-5 py-4">
          <Field label="Titre de l'objectif">
            <input
              className={inputCls}
              value={titre}
              onChange={(e) => setTitre(e.target.value)}
            />
          </Field>

          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <Field label="Catégorie">
              <select
                value={categorie}
                onChange={(e) => setCategorie(e.target.value)}
                className={cn(inputCls, "cursor-pointer appearance-none")}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c} className="bg-surface text-ink">
                    {c}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Valeur cible">
              <input
                className={inputCls}
                value={valeurCible}
                onChange={(e) => setValeurCible(e.target.value)}
              />
            </Field>
          </div>

          <Field label="Affecter à" hint="Joueurs ou sélection concernés">
            <input
              className={inputCls}
              value={affecter}
              onChange={(e) => setAffecter(e.target.value)}
            />
          </Field>

          <Field label="Critère d'évaluation">
            <input
              className={inputCls}
              value={critere}
              onChange={(e) => setCritere(e.target.value)}
            />
          </Field>

          <Field label="Description">
            <textarea
              rows={3}
              className={cn(inputCls, "resize-none")}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Field>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-3.5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-input px-4 py-2 font-ui text-sm font-medium text-ink transition-colors hover:border-border-strong hover:bg-accent"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={submit}
            className="inline-flex items-center gap-1.5 rounded-md bg-brand px-5 py-2 font-ui text-sm font-medium text-ink-inverted shadow-glow transition-[colors,opacity] hover:bg-brand-dim"
          >
            <Check size={16} /> Créer
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
