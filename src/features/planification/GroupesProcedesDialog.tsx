import { useState } from "react"
import { Layers, PenLine, Users, type LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import type { ModeGroupesProcede, ProcedeAtelier } from "@/data/seed/seances"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { hexCouleur } from "@/features/planification/atelierCouleurs"

/**
 * The last step of « Ajouter un procédé »: for each picked exercise, does it
 * run with the séance's groups, with groups of its own, or with nobody split
 * at all? Personalised groups are built on the procédé's Groupes tab, where
 * the coach lands right after.
 */
export function GroupesProcedesDialog({
  procedes,
  groupesSeance,
  onAnnuler,
  onValider,
}: {
  procedes: { id: string; titre: string; detail?: string }[]
  groupesSeance: ProcedeAtelier[]
  onAnnuler: () => void
  onValider: (choix: Record<string, ModeGroupesProcede>) => void
}) {
  const [choix, setChoix] = useState<Record<string, ModeGroupesProcede>>({})
  const de = (id: string): ModeGroupesProcede => choix[id] ?? "seance"
  const choisir = (id: string, mode: ModeGroupesProcede) =>
    setChoix((c) => ({ ...c, [id]: mode }))

  return (
    <Dialog open onOpenChange={(o) => !o && onAnnuler()}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Répartition des joueurs</DialogTitle>
          <DialogDescription>
            {procedes.length > 1
              ? "Pour chaque procédé : les groupes de la séance, des groupes personnalisés, ou sans groupe."
              : "Les groupes de la séance, des groupes personnalisés, ou sans groupe."}
          </DialogDescription>
        </DialogHeader>

        <ul className="flex min-w-0 flex-col gap-4">
          {procedes.map((p) => (
            <li key={p.id} className="flex min-w-0 flex-col gap-2">
              <span className="min-w-0">
                <span className="block truncate font-ui text-[0.86rem] text-ink">
                  {p.titre}
                </span>
                {p.detail ? (
                  <span className="block font-body text-[0.72rem] text-ink-disabled">
                    {p.detail}
                  </span>
                ) : null}
              </span>
              <div
                role="radiogroup"
                aria-label={"Groupes pour " + p.titre}
                className="grid min-w-0 gap-2 sm:grid-cols-3"
              >
                <Option
                  on={de(p.id) === "seance"}
                  onClick={() => choisir(p.id, "seance")}
                  icon={Layers}
                  titre="Groupes de la séance"
                  texte={
                    groupesSeance.length
                      ? `${groupesSeance.length} groupe${groupesSeance.length > 1 ? "s" : ""}`
                      : "Aucun défini"
                  }
                  pastilles={groupesSeance}
                />
                <Option
                  on={de(p.id) === "personnalises"}
                  onClick={() => choisir(p.id, "personnalises")}
                  icon={PenLine}
                  titre="Personnalisés"
                  texte="Créés sur ce procédé"
                />
                <Option
                  on={de(p.id) === "aucun"}
                  onClick={() => choisir(p.id, "aucun")}
                  icon={Users}
                  titre="Sans groupe"
                  texte="Tout le monde ensemble"
                />
              </div>
            </li>
          ))}
        </ul>

        <DialogFooter>
          <Button variant="ghost" onClick={onAnnuler}>
            Annuler
          </Button>
          <Button
            onClick={() =>
              onValider(Object.fromEntries(procedes.map((p) => [p.id, de(p.id)])))
            }
          >
            Ajouter à la séance
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Option({
  on,
  onClick,
  icon: Icon,
  titre,
  texte,
  pastilles,
}: {
  on: boolean
  onClick: () => void
  icon: LucideIcon
  titre: string
  texte: string
  pastilles?: ProcedeAtelier[]
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={on}
      onClick={onClick}
      className={cn(
        "flex min-w-0 items-start gap-2.5 rounded-lg border p-3 text-left transition-colors",
        on
          ? "border-info/50 bg-info/10"
          : "border-border hover:border-border-strong",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border",
          on ? "border-info" : "border-border-strong",
        )}
      >
        {on ? <span className="size-2 rounded-full bg-info" /> : null}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5 font-ui text-[0.82rem] text-ink">
          <Icon size={13} className="shrink-0 text-ink-muted" />
          <span className="truncate">{titre}</span>
        </span>
        <span className="mt-0.5 flex items-center gap-1.5 font-body text-[0.72rem] text-ink-muted">
          {pastilles?.length ? (
            <span aria-hidden className="flex items-center gap-0.5">
              {pastilles.map((g) => (
                <span
                  key={g.id}
                  className="size-2 rounded-full ring-1 ring-white/15"
                  style={{ backgroundColor: hexCouleur(g.couleur) }}
                />
              ))}
            </span>
          ) : null}
          {texte}
        </span>
      </span>
    </button>
  )
}
