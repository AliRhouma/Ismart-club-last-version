import { useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"

import { useData } from "@/data/useData"
import type { ProgrammeAnnuel } from "@/data/seed/programmation"
import type { Categorie, CategorieGroupe } from "@/data/seed/categories"
import {
  cheminProgramme,
  saisonDepuisSlug,
} from "@/features/pole-technique/programmationRoutes"

export type ProgrammeContexte = {
  saison: string | null
  categorie: Categorie | undefined
  /** Every groupe of the équipe runs this programme. */
  groupes: CategorieGroupe[]
  /** The programme of this exact saison × équipe, if it exists yet. */
  programme: ProgrammeAnnuel | null
  /** False when the URL names a saison or équipe that doesn't exist. */
  valide: boolean
  /** Switching a scope select is a navigation — the URL stays the truth. */
  allerVers: (patch: Partial<{ saison: string; categorieId: string }>) => void
}

/**
 * The scope every tab of the programme section works in. It is read from the
 * URL — the parcours (saison → équipe) puts it there — and mirrored into the
 * store so the rest of the app keeps one source of truth. Reading the URL
 * rather than the store matters: the store catches up one render later, and a
 * tab must never flash the previous équipe's data on the way in.
 */
export function useProgramme(): ProgrammeContexte {
  const navigate = useNavigate()
  const { saison: slugSaison, categorieId: paramCategorieId } = useParams()
  const {
    saisons,
    categories,
    programmesAnnuels,
    programmeScope,
    setProgrammeScope,
  } = useData()

  const saison = saisonDepuisSlug(slugSaison ?? "", saisons)
  const categorie = categories.find((c) => c.id === paramCategorieId)

  useEffect(() => {
    if (!saison || !categorie) return
    if (
      programmeScope.saison === saison &&
      programmeScope.categorieId === categorie.id
    )
      return
    setProgrammeScope({ saison, categorieId: categorie.id })
  }, [saison, categorie, programmeScope, setProgrammeScope])

  const programme =
    programmesAnnuels.find(
      (p) => p.saison === saison && p.categorieId === categorie?.id,
    ) ?? null

  const allerVers: ProgrammeContexte["allerVers"] = (patch) =>
    navigate(
      cheminProgramme(
        patch.saison ?? saison ?? "",
        patch.categorieId ?? categorie?.id ?? "",
      ),
    )

  return {
    saison,
    categorie,
    groupes: categorie?.groupes ?? [],
    programme,
    valide: !!saison && !!categorie,
    allerVers,
  }
}
