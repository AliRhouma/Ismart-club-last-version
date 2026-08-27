/**
 * Convocations de séance — qui est appelé à une séance, et dans quel groupe.
 *
 * A séance's convocation is built from the club's effectif (`seed/categories`),
 * so a row here only stores IDs: the joueur, the groupe retained FOR THIS
 * SÉANCE, and his réponse. Names, postes and taux de présence are read from the
 * catégorie at render time — never copied (CLAUDE.md: derived values are
 * computed, not stored).
 *
 * `groupeId` is the point of the model: an éducateur regularly borrows two or
 * three joueurs from another groupe for one session. Storing the groupe on the
 * convocation — not on the joueur — keeps that move local to the séance; the
 * club roster on the Joueurs page is untouched.
 */

import type { ConvocationStatut } from "@/data/seed/seances"

export type ConvocationJoueur = {
  /** CategorieJoueur.id — the joueur in the club's effectif. */
  joueurId: string
  /** Groupe retenu pour cette séance (peut différer du groupe du club). */
  groupeId: string
  /** RSVP shown on the Convocation tab. */
  reponse: ConvocationStatut
}

export type SeanceConvocation = {
  /** Matches PlanEvent.id — one convocation per séance. */
  eventId: string
  /** Catégorie the convocation was built from. */
  categorieId: string
  /** Groupes the éducateur convoked (order kept for the header). */
  groupeIds: string[]
  joueurs: ConvocationJoueur[]
}

/** Réponses spread over the roster so the counters read like real data. */
const reponses: ConvocationStatut[] = [
  "accepte", "accepte", "attente", "accepte", "accepte",
  "refuse", "accepte", "accepte", "attente", "accepte",
]

/** Groupe A = minime-j1…j10, Groupe B = j11…j20, Groupe C = j21…j30. */
const groupe = (from: number, groupeId: string): ConvocationJoueur[] =>
  Array.from({ length: 10 }, (_, i) => ({
    joueurId: `minime-j${from + i}`,
    groupeId,
    reponse: reponses[(from + i) % reponses.length],
  }))

/**
 * One séance already has its convocation — Séance 23: les groupes A et B de la
 * catégorie Minime (20 joueurs), plus deux joueurs du groupe C remontés en A
 * pour cette séance uniquement. Séance 26 is left without one on purpose: it's
 * the empty state the builder starts from.
 */
export const convocationsSeed: SeanceConvocation[] = [
  {
    eventId: "ev-seance-23",
    categorieId: "minime",
    groupeIds: ["minime-groupe-a", "minime-groupe-b"],
    joueurs: [
      ...groupe(1, "minime-groupe-a"),
      ...groupe(11, "minime-groupe-b"),
      /* Remontés du groupe C pour cette séance uniquement. */
      { joueurId: "minime-j21", groupeId: "minime-groupe-a", reponse: "accepte" },
      { joueurId: "minime-j24", groupeId: "minime-groupe-a", reponse: "attente" },
    ],
  },
]
