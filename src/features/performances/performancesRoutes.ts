/**
 * The Performances parcours in URL form: saison → its questionnaires and
 * modèles → one questionnaire / one modèle (and the modèle's editor).
 */
import { saisonEnSlug } from "@/features/pole-technique/programmationRoutes"

export const RACINE_PERFORMANCES = "/pole-technique/performances"

export const cheminSaisonPerf = (saison: string) =>
  `${RACINE_PERFORMANCES}/${saisonEnSlug(saison)}`

export const cheminQuestionnaire = (saison: string, id: string) =>
  `${cheminSaisonPerf(saison)}/questionnaires/${id}`

export const cheminModele = (saison: string, id: string) =>
  `${cheminSaisonPerf(saison)}/modeles/${id}`

export const cheminModeleEdition = (saison: string, id: string) =>
  `${cheminModele(saison, id)}/modifier`

export const cheminModeleNouveau = (saison: string) =>
  `${cheminSaisonPerf(saison)}/modeles/nouveau`
