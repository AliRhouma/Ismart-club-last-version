import { useState } from "react"
import { Check, Package } from "lucide-react"

import { cn } from "@/lib/utils"
import { MATERIAUX } from "@/data/seed/materiaux"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export type LigneMateriel = { quantite: string; nom: string }

/**
 * La caisse de matériel, ouverte. Les douze références sont posées à plat —
 * l'éducateur reconnaît le visuel, tape la quantité en dessous, et ce qui reste
 * à 0 ne sort pas. Un clic sur le visuel sert de raccourci : il pose la quantité
 * habituelle de la référence, ou la remet à 0.
 */
export function MaterielPicker({
  lignes,
  onClose,
  onValider,
}: {
  lignes: LigneMateriel[]
  onClose: () => void
  onValider: (lignes: LigneMateriel[]) => void
}) {
  // Une quantité par référence, amorcée avec ce qui est déjà sur la séance.
  const [quantites, setQuantites] = useState<Record<string, string>>(() => {
    const par: Record<string, string> = {}
    for (const m of MATERIAUX) {
      const deja = lignes.find(
        (l) => l.nom.trim().toLowerCase() === m.nom.toLowerCase(),
      )
      par[m.id] = deja ? deja.quantite : "0"
    }
    return par
  })

  const nombre = (v: string) => Number(v) || 0
  const choisis = MATERIAUX.filter((m) => nombre(quantites[m.id]) > 0)

  const poser = (id: string, valeur: string) =>
    setQuantites((prev) => ({ ...prev, [id]: valeur }))

  const valider = () => {
    onValider(
      choisis.map((m) => ({
        nom: m.nom,
        quantite: String(nombre(quantites[m.id])),
      })),
    )
    onClose()
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[88vh] overflow-y-auto rounded-xl sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Matériel de la séance</DialogTitle>
          <DialogDescription>
            Indiquez la quantité sous chaque référence. Ce qui reste à 0 ne sort
            pas de la caisse.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {MATERIAUX.map((m) => {
            const qte = nombre(quantites[m.id])
            const actif = qte > 0
            return (
              <div
                key={m.id}
                className={cn(
                  "flex flex-col gap-2 rounded-lg border p-3 transition-colors",
                  actif
                    ? "border-border-second bg-surface-nested"
                    : "border-border",
                )}
              >
                {/* Le visuel est aussi le raccourci : un clic pose la quantité
                    habituelle, un second la retire. */}
                <button
                  type="button"
                  onClick={() => poser(m.id, actif ? "0" : String(m.defaut))}
                  aria-pressed={actif}
                  title={actif ? `Retirer ${m.nom}` : `Ajouter ${m.nom}`}
                  className="group flex h-20 items-center justify-center rounded-md border border-border transition-colors hover:border-border-strong"
                >
                  <img
                    src={m.svg}
                    alt=""
                    aria-hidden
                    className={cn(
                      "max-h-14 max-w-[70%] object-contain transition-opacity",
                      actif
                        ? "opacity-100"
                        : "opacity-60 group-hover:opacity-100",
                    )}
                  />
                </button>

                <span className="truncate font-ui text-[0.78rem] text-ink">
                  {m.nom}
                </span>

                <input
                  type="number"
                  min={0}
                  value={quantites[m.id]}
                  aria-label={`Quantité — ${m.nom}`}
                  onFocus={(e) => e.currentTarget.select()}
                  onChange={(e) => poser(m.id, e.target.value)}
                  className={cn(
                    "w-full rounded-md border bg-transparent px-2.5 py-1.5 text-center font-body text-sm outline-none transition-colors focus:border-border-focus",
                    actif
                      ? "border-border-strong text-ink"
                      : "border-input text-ink-disabled",
                  )}
                />
              </div>
            )
          })}
        </div>

        <DialogFooter className="items-center sm:justify-between">
          <p className="flex items-center gap-2 font-body text-[0.8rem] text-ink-muted">
            <Package size={14} className="text-ink-disabled" />
            {choisis.length === 0
              ? "Aucune référence sélectionnée"
              : `${choisis.length} référence${choisis.length > 1 ? "s" : ""} · ${choisis.reduce((t, m) => t + nombre(quantites[m.id]), 0)} pièces`}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={onClose}>
              Annuler
            </Button>
            <Button onClick={valider}>
              <Check /> Valider
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
