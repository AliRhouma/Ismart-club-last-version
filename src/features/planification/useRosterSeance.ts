import { useMemo } from "react"

import { useData } from "@/data/useData"
import type { SeanceDetail } from "@/data/seed/seances"
import type { JoueurGroupe } from "@/features/planification/GroupesJoueurs"

/**
 * Who can be placed in a chasuble: the convoqués if the séance has a
 * convocation, else the joueurs attached to it. The two sources carry
 * different shapes.
 */
export function useRosterSeance(detail: SeanceDetail): JoueurGroupe[] {
  const { categories, convocations } = useData()
  return useMemo(() => {
    const convocation = convocations.find((c) => c.eventId === detail.eventId)
    if (convocation) {
      const categorie = categories.find((c) => c.id === convocation.categorieId)
      return convocation.joueurs
        .map((j) => categorie?.joueurs.find((x) => x.id === j.joueurId))
        .filter((j) => !!j)
        .map((j) => ({ id: j.id, nom: j.nom, poste: j.poste, photo: j.photo }))
    }
    return detail.participants
      .filter((p) => p.kind === "joueur")
      .map((p) => ({ id: p.id, nom: p.name, poste: p.role }))
  }, [detail.eventId, detail.participants, convocations, categories])
}
