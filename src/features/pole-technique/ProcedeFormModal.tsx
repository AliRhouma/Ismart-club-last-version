import { useState } from "react"

import { cn } from "@/lib/utils"
import { useData } from "@/data/useData"
import {
  procedeTypes,
  type ProcedeItem,
  type ProcedeType,
} from "@/data/seed/procedes"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

const fieldCls =
  "w-full rounded-md border border-input bg-transparent px-3.5 py-2.5 font-body text-sm text-ink outline-none transition-colors placeholder:text-ink-disabled focus:border-border-focus"
const labelCls =
  "block font-ui text-[0.72rem] font-medium tracking-[0.02em] text-ink"

/**
 * Create / edit a procédé. Only the identity + timing fields are editable here —
 * the rich sections (Objectif, Consignes…) are authored on the procédé itself.
 */
export function ProcedeFormModal({
  open,
  onOpenChange,
  procede,
  defaultPrincipeId,
  onSubmit,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Present = edit mode; absent = create. */
  procede?: ProcedeItem
  defaultPrincipeId?: string
  onSubmit: (draft: Omit<ProcedeItem, "id">) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-y-auto rounded-xl sm:max-w-lg">
        {/* Mounted only while open, so every opening starts from the current
            procédé (or a clean create) — a cancelled edit leaves no trace. */}
        {open ? (
          <ProcedeForm
            procede={procede}
            defaultPrincipeId={defaultPrincipeId}
            onCancel={() => onOpenChange(false)}
            onSubmit={onSubmit}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

function ProcedeForm({
  procede,
  defaultPrincipeId,
  onCancel,
  onSubmit,
}: {
  procede?: ProcedeItem
  defaultPrincipeId?: string
  onCancel: () => void
  onSubmit: (draft: Omit<ProcedeItem, "id">) => void
}) {
  const { procedeGroupes, procedePhases, procedePrincipes, session } = useData()

  const [titre, setTitre] = useState(procede?.titre ?? "")
  const [type, setType] = useState<ProcedeType>(procede?.type ?? "Jeu")
  const [principeId, setPrincipeId] = useState(
    procede?.principeId ?? defaultPrincipeId ?? procedePrincipes[0]?.id ?? "",
  )
  const [duree, setDuree] = useState(procede?.duree ?? "10")
  const [sequence, setSequence] = useState(procede?.sequence ?? "1*10")
  const [recuperation, setRecuperation] = useState(
    procede?.recuperation ?? "30",
  )
  const [joueurs, setJoueurs] = useState(String(procede?.effectif[0] ?? 12))
  const [gardiens, setGardiens] = useState(String(procede?.effectif[1] ?? 1))
  const [largeur, setLargeur] = useState(String(procede?.surface[0] ?? 30))
  const [longueur, setLongueur] = useState(String(procede?.surface[1] ?? 40))

  const num = (v: string, fallback: number) => {
    const n = Number.parseInt(v, 10)
    return Number.isFinite(n) && n >= 0 ? n : fallback
  }

  const canSave = titre.trim() !== "" && principeId !== ""

  const handleSubmit = () => {
    if (!canSave) return
    onSubmit({
      titre: titre.trim(),
      type,
      principeId,
      duree: duree.trim() || "10",
      sequence: sequence.trim() || "1*10",
      recuperation: recuperation.trim() || "30",
      surface: [num(largeur, 30), num(longueur, 40)],
      effectif: [num(joueurs, 12), num(gardiens, 0)],
      materiel: procede?.materiel ?? [],
      image: procede?.image,
      video: procede?.video ?? false,
      partage: procede?.partage ?? false,
      auteur: procede?.auteur ?? session?.name ?? "Staff technique",
      categories: procede?.categories ?? [],
      sections: procede?.sections ?? [],
    })
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          {procede ? "Modifier le procédé" : "Nouveau procédé"}
        </DialogTitle>
        <DialogDescription>
          {procede
            ? "Mettez à jour l'intitulé, le rattachement et le format de travail."
            : "Rattachez le procédé à un principe de jeu, puis précisez son format."}
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <label className={labelCls} htmlFor="procede-titre">
            Intitulé
          </label>
          <input
            id="procede-titre"
            value={titre}
            onChange={(e) => setTitre(e.target.value)}
            placeholder="Jeu de position 7+4 vs 7"
            className={fieldCls}
            autoFocus
          />
        </div>

        <div className="flex flex-col gap-2">
          <span className={labelCls}>Type</span>
          <div className="flex gap-2">
            {procedeTypes.map((t) => (
              <button
                key={t}
                type="button"
                role="radio"
                aria-checked={t === type}
                onClick={() => setType(t)}
                className={cn(
                  "flex-1 rounded-md border px-3 py-2 font-ui text-[0.8rem] transition-colors",
                  t === type
                    ? "border-border-second bg-surface-nested text-ink"
                    : "border-border text-ink-muted hover:border-border-strong hover:text-ink",
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className={labelCls} htmlFor="procede-principe">
            Principe de jeu
          </label>
          <select
            id="procede-principe"
            value={principeId}
            onChange={(e) => setPrincipeId(e.target.value)}
            className={fieldCls}
          >
            {procedeGroupes.map((g) => (
              <optgroup key={g.id} label={g.nom}>
                {procedePhases
                  .filter((ph) => ph.groupeId === g.id)
                  .flatMap((ph) =>
                    procedePrincipes
                      .filter((pr) => pr.phaseId === ph.id)
                      .map((pr) => (
                        <option key={pr.id} value={pr.id}>
                          {ph.nom} — {pr.nom}
                        </option>
                      )),
                  )}
              </optgroup>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Field label="Durée (min)" value={duree} onChange={setDuree} />
          <Field label="Séquence" value={sequence} onChange={setSequence} />
          <Field
            label="Récup. (s)"
            value={recuperation}
            onChange={setRecuperation}
          />
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Field label="Joueurs" value={joueurs} onChange={setJoueurs} />
          <Field label="Gardiens" value={gardiens} onChange={setGardiens} />
          <Field label="Largeur (m)" value={largeur} onChange={setLargeur} />
          <Field label="Longueur (m)" value={longueur} onChange={setLongueur} />
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button onClick={handleSubmit} disabled={!canSave}>
          {procede ? "Enregistrer" : "Créer le procédé"}
        </Button>
      </DialogFooter>
    </>
  )
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className="block font-ui text-[0.66rem] font-medium tracking-[0.06em] text-ink-muted uppercase">
        {label}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={fieldCls}
      />
    </label>
  )
}
