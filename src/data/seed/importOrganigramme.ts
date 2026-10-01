/**
 * The resolved result of the "importer un organigramme" wizard — everything
 * the store has to append, already mapped to our own unités, members and
 * documents. Built in the wizard, applied by `importerOrganigramme`.
 */
import type { Fiche, MembreLie } from "@/data/seed/fichesPoste"
import type { OrgMembre, OrgUnite } from "@/data/seed/organigramme"

export type PlanImportOrganigramme = {
  ressourceId: string
  /** New unités, with their final parent ids. */
  unites: OrgUnite[]
  /** Positions of the whole chart (existing + new), re-laid out together. */
  positions: Record<string, { x: number; y: number }>
  /** People created during the mapping ("Nouveau membre…"). */
  nouveauxMembres: OrgMembre[]
  /** Partner documents imported as our own drafts. */
  nouvellesFiches: Fiche[]
  /** Member ↔ document links (titulaire, rôle, charte to sign). */
  liens: { ficheId: string; lien: MembreLie }[]
}
