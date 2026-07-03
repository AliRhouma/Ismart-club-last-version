/**
 * Documents — the club's written records (rapports, comptes rendus, fiches de
 * poste, règlements…). A lightweight catalogue: each row is a titled document
 * with a type and a last-modified date. The editor itself is a placeholder for
 * now, so we only model what the list screen shows.
 *
 * Seed rows keep readable slug ids; rows added at runtime get crypto UUIDs.
 */

/** Document categories (empty string = "Sans type"). */
export type DocType =
  | ""
  | "Rapport"
  | "Compte rendu"
  | "Note interne"
  | "Procédure"
  | "Fiche de poste"
  | "Charte"
  | "Règlement"

export const DOC_TYPES: { value: DocType; label: string }[] = [
  { value: "", label: "Sans type" },
  { value: "Rapport", label: "Rapport" },
  { value: "Compte rendu", label: "Compte rendu" },
  { value: "Note interne", label: "Note interne" },
  { value: "Procédure", label: "Procédure" },
  { value: "Fiche de poste", label: "Fiche de poste" },
  { value: "Charte", label: "Charte" },
  { value: "Règlement", label: "Règlement" },
]

export type Document = {
  id: string
  title: string
  type: DocType
  /** Display date, e.g. "12 juin 2026". */
  updatedAt: string
}

/** Ready-to-use starting points surfaced by "Depuis un modèle". */
export type DocTemplate = {
  id: string
  label: string
  description: string
  type: DocType
  title: string
}

export const docTemplates: DocTemplate[] = [
  {
    id: "tpl-compte-rendu",
    label: "Compte rendu de réunion",
    description: "Ordre du jour, décisions et actions à suivre.",
    type: "Compte rendu",
    title: "Compte rendu de réunion",
  },
  {
    id: "tpl-fiche-poste",
    label: "Fiche de poste",
    description: "Missions, responsabilités et rattachement.",
    type: "Fiche de poste",
    title: "Fiche de poste — Nouveau rôle",
  },
  {
    id: "tpl-reglement",
    label: "Règlement intérieur",
    description: "Règles de vie et engagements du club.",
    type: "Règlement",
    title: "Règlement intérieur",
  },
  {
    id: "tpl-rapport",
    label: "Rapport mensuel",
    description: "Bilan d'activité et indicateurs du mois.",
    type: "Rapport",
    title: "Rapport mensuel",
  },
]

/** A varied, believable catalogue so the screen reads on first load. */
export const documentsSeed: Document[] = [
  {
    id: "doc-reglement-interieur",
    title: "Règlement intérieur du club 2025-2026",
    type: "Règlement",
    updatedAt: "27 juin 2026",
  },
  {
    id: "doc-cr-reunion-bureau",
    title: "Compte rendu — réunion du bureau du 18 juin",
    type: "Compte rendu",
    updatedAt: "19 juin 2026",
  },
  {
    id: "doc-fiche-poste-coordinateur",
    title:
      "Fiche de poste — Coordinateur sportif de la catégorie U15 et référent formation",
    type: "Fiche de poste",
    updatedAt: "11 juin 2026",
  },
  {
    id: "doc-rapport-mensuel-mai",
    title: "Rapport mensuel — activité de mai",
    type: "Rapport",
    updatedAt: "3 juin 2026",
  },
  {
    id: "doc-charte-educateur",
    title: "Charte de l'éducateur",
    type: "Charte",
    updatedAt: "21 mai 2026",
  },
  {
    id: "doc-note-deplacements",
    title: "Note interne — organisation des déplacements",
    type: "Note interne",
    updatedAt: "14 mai 2026",
  },
]
