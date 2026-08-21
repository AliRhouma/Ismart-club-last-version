import { useState } from "react"
import { Check, Pipette, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { useData } from "@/data/useData"
import {
  blankPartner,
  PRESET_COLORS,
  type Partner,
} from "@/data/seed/sponsoring"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"

const inputCls =
  "w-full rounded-md border border-input bg-transparent px-3.5 py-2.5 font-body text-sm text-ink outline-none transition-colors placeholder:text-ink-disabled focus:border-border-focus"

/**
 * Add / edit a partenaire: a name and a description, nothing else.
 *
 * The colour is the partenaire's pastille — it rings its avatar in the table and
 * on its fiche, so two partners are told apart at a glance. Six presets cover the
 * usual cases; the pipette takes a brand's exact hex when the club has it.
 *
 * The form is deliberately short — a partenaire is created the moment the
 * club shakes hands, well before the pack, the contract dates or the sponsor's
 * iSmart Club account are settled. Those are filled in later from the partner's
 * own fiche; the seed defaults (today → +1 an, aucun pack, aucun compte) cover
 * the gap so the table always has something to show.
 *
 * Referenced OffreFormScreen (field styling, footer) and the Objectif modal
 * (header + close button) to stay on-brand.
 */
export function PartnerFormModal({
  editing,
  onClose,
  onSaved,
}: {
  /** Existing partenaire when editing, null when creating. */
  editing: Partner | null
  onClose: () => void
  onSaved: (msg: string) => void
}) {
  const { addPartner, updatePartner } = useData()

  // Editing keeps the fields the form no longer shows (période, compte) intact.
  const [draft, setDraft] = useState<Omit<Partner, "id">>(() =>
    editing ? { ...editing } : blankPartner(""),
  )

  // La pipette est « active » dès que la couleur n'est plus un preset.
  const custom = !PRESET_COLORS.some((c) => sameColor(draft.color, c))

  const set = <K extends keyof Omit<Partner, "id">>(
    key: K,
    val: Omit<Partner, "id">[K],
  ) => setDraft((d) => ({ ...d, [key]: val }))

  const submit = () => {
    const clean: Omit<Partner, "id"> = {
      ...draft,
      name: draft.name.trim() || "Sans nom",
      description: draft.description.trim(),
    }
    if (editing) {
      updatePartner(editing.id, clean)
      onSaved(`Partenaire « ${clean.name} » mis à jour`)
    } else {
      addPartner(clean)
      onSaved(`Partenaire « ${clean.name} » ajouté`)
    }
    onClose()
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[88vh] flex-col gap-0 overflow-hidden rounded-xl border-border bg-surface p-0 sm:max-w-[480px]"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div className="min-w-0">
            <DialogTitle className="font-ui text-base font-medium text-ink">
              {editing ? "Modifier le partenaire" : "Ajouter un partenaire"}
            </DialogTitle>
            <DialogDescription className="mt-1.5 font-body text-[0.78rem] text-ink-muted">
              Le nom et la description du contrat. Le pack et la période se
              renseignent depuis sa fiche.
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
        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-5 py-5">
          <label className="flex flex-col gap-1.5">
            <span className="font-ui text-[0.7rem] font-medium tracking-[0.06em] text-ink-muted uppercase">
              Nom du partenaire
            </span>
            <input
              autoFocus
              className={inputCls}
              placeholder="Délice Danone"
              value={draft.name}
              onChange={(e) => set("name", e.target.value)}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="font-ui text-[0.7rem] font-medium tracking-[0.06em] text-ink-muted uppercase">
              Description
            </span>
            <textarea
              rows={3}
              className={cn(inputCls, "resize-none")}
              placeholder="Partenaire historique du club, présent sur les maillots depuis 2019."
              value={draft.description}
              onChange={(e) => set("description", e.target.value)}
            />
            <span className="font-body text-[0.72rem] leading-snug text-ink-disabled">
              Ce texte apparaîtra sur la fiche du partenaire dans l'annuaire du
              club.
            </span>
          </label>

          {/* ── Couleur ───────────────────────────────────────────────────
              Six pastilles suffisent dans 90 % des cas ; la pipette est là pour
              la couleur exacte d'une marque, sans encombrer la rangée. */}
          <div className="flex flex-col gap-2.5">
            <span className="font-ui text-[0.7rem] font-medium tracking-[0.06em] text-ink-muted uppercase">
              Couleur
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {PRESET_COLORS.map((color) => (
                <Swatch
                  key={color}
                  color={color}
                  selected={sameColor(draft.color, color)}
                  onSelect={() => set("color", color)}
                />
              ))}

              <span className="mx-0.5 h-6 w-px shrink-0 bg-border" />

              {/* Pipette — n'importe quelle couleur, y compris hors presets. */}
              <label
                title="Couleur personnalisée"
                className={cn(
                  "relative flex size-8 cursor-pointer items-center justify-center rounded-pill border transition-colors",
                  custom
                    ? "border-transparent ring-2 ring-info ring-offset-2 ring-offset-surface"
                    : "border-border hover:border-border-strong",
                )}
                style={custom ? { backgroundColor: draft.color } : undefined}
              >
                <Pipette
                  size={14}
                  className={custom ? "text-ink-inverted" : "text-ink-muted"}
                />
                <input
                  type="color"
                  value={draft.color}
                  onChange={(e) => set("color", e.target.value)}
                  className="absolute inset-0 size-full cursor-pointer opacity-0"
                />
              </label>

              <span className="ml-1 font-mono text-[0.72rem] text-ink-disabled uppercase">
                {draft.color}
              </span>
            </div>
          </div>
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
            disabled={!draft.name.trim()}
            className="inline-flex items-center gap-1.5 rounded-md bg-brand px-5 py-2 font-ui text-sm font-medium text-ink-inverted shadow-glow transition-colors hover:bg-brand-dim disabled:cursor-not-allowed disabled:opacity-45"
          >
            <Check size={16} />
            {editing ? "Enregistrer" : "Ajouter le partenaire"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/** Hex comparison, casse ignorée — `<input type="color">` renvoie en minuscules. */
function sameColor(a: string, b: string) {
  return a.toLowerCase() === b.toLowerCase()
}

/** Une pastille de couleur sélectionnable (sélection = anneau bleu, règle 3). */
function Swatch({
  color,
  selected,
  onSelect,
}: {
  color: string
  selected: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={`Couleur ${color}`}
      onClick={onSelect}
      style={{ backgroundColor: color }}
      className={cn(
        "flex size-8 items-center justify-center rounded-pill transition-transform",
        selected
          ? "ring-2 ring-info ring-offset-2 ring-offset-surface"
          : "hover:scale-105",
      )}
    >
      {selected ? <Check size={14} className="text-ink-inverted" /> : null}
    </button>
  )
}
