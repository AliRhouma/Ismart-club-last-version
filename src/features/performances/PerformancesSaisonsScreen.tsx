import { useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { Activity } from "lucide-react"

import { useData } from "@/data/useData"
import { SAISON_ACTIVE } from "@/data/seed/programmation"
import { PageHeader } from "@/components/kit/PageHeader"
import { Badge } from "@/components/kit/Badge"
import { Bar } from "@/features/budget/ui"
import { pluriel } from "@/features/pole-technique/categorieUi"
import {
  CarteNav,
  TeteDeCarte,
} from "@/features/pole-technique/ProgrammationParcours"
import { cheminSaisonPerf } from "@/features/performances/performancesRoutes"

/**
 * Performances — step 1: the saison. Same parcours card as Programmation, so
 * Pôle technique reads as one family; the footer says how much the staff
 * actually collected that saison (réponses reçues / attendues).
 */
export function PerformancesSaisonsScreen() {
  const navigate = useNavigate()
  const { saisons, questionnaires, categories } = useData()

  const lignes = useMemo(
    () =>
      [...saisons].reverse().map((saison) => {
        const qs = questionnaires.filter((q) => q.saison === saison)
        const attendues = qs.reduce((n, q) => {
          const cat = categories.find((c) => c.id === q.categorieId)
          return (
            n +
            (cat?.joueurs.filter((j) => !q.groupeId || j.groupeId === q.groupeId)
              .length ?? 0)
          )
        }, 0)
        const recues = qs.reduce((n, q) => n + q.reponses.length, 0)
        return { saison, qs, attendues, recues }
      }),
    [saisons, questionnaires, categories],
  )

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Performances"
        subtitle="Questionnaires de bien-être et de charge — choisissez la saison."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {lignes.map(({ saison, qs, attendues, recues }) => (
          <CarteNav key={saison} onOpen={() => navigate(cheminSaisonPerf(saison))}>
            <TeteDeCarte
              icon={Activity}
              titre={saison}
              sousTitre={
                qs.length ? pluriel(qs.length, "questionnaire") : "Aucun questionnaire"
              }
              badge={
                saison === SAISON_ACTIVE ? (
                  <Badge variant="info">En cours</Badge>
                ) : null
              }
            />
            {attendues ? (
              <span className="flex flex-col gap-1.5">
                <span className="flex items-baseline justify-between font-ui text-[0.74rem] text-ink-muted">
                  <span>Réponses reçues</span>
                  <span className="text-ink">
                    {recues}
                    <span className="text-ink-disabled"> / {attendues}</span>
                  </span>
                </span>
                <Bar sm value={(recues / attendues) * 100} />
              </span>
            ) : (
              <span className="font-body text-[0.78rem] text-ink-disabled">
                Rien de lancé pour l'instant.
              </span>
            )}
          </CarteNav>
        ))}
      </div>
    </div>
  )
}
