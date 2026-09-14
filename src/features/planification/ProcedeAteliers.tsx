import { useMemo } from "react"

import { useData } from "@/data/useData"
import type { Procede, SeanceDetail } from "@/data/seed/seances"
import {
  GroupesJoueurs,
  type JoueurGroupe,
} from "@/features/planification/GroupesJoueurs"

/**
 * The ateliers of one procédé: how the squad is split for *this* exercise.
 *
 * Membership is per procédé, not per séance — a joueur can be in atelier 1 on
 * the rondo and atelier 3 on the finishing drill — so the groups live on the
 * procédé and are rebuilt from ids at render time. The panel itself is the
 * shared `GroupesJoueurs`; this only binds it to the store.
 */
export function ProcedeAteliers({
  detail,
  procede,
  notify,
}: {
  detail: SeanceDetail
  procede: Procede
  notify: (msg: string) => void
}) {
  const { categories, convocations, setProcedeAteliers } = useData()

  // Who can be placed: the convoqués if the séance has a convocation, else the
  // joueurs attached to it. The two sources carry different shapes.
  const roster: JoueurGroupe[] = useMemo(() => {
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

  return (
    <section className="flex flex-col gap-4 rounded-lg border border-border p-4 sm:p-6">
      <h3 className="font-ui text-[0.95rem] font-medium text-ink">
        Groupes de joueurs
      </h3>

      <GroupesJoueurs
        roster={roster}
        groupes={procede.ateliers ?? []}
        onChange={(suite) =>
          setProcedeAteliers(detail.eventId, procede.id, suite)
        }
        notify={notify}
        aide="propres à ce procédé"
        vide={{
          titre: "Aucun groupe",
          description:
            "Sans groupe, tout le monde travaille ensemble sur ce procédé.",
        }}
      />
    </section>
  )
}
