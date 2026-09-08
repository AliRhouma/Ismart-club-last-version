/**
 * Évaluations — the grids a club scores its players against.
 *
 * A grille is a named set of critères belonging to one domaine (statistiques de
 * match, physique, tactique…). Each joueur is scored on every critère of the
 * grille, and a critère is one of two kinds:
 *
 *  · **note**   — a mark out of a barème (almost always 100).
 *  · **mesure** — a measured value in its own unité (secondes, mètres, km/h).
 *                 It is not a mark, so it never feeds an average.
 *
 * The notes themselves live in `evaluationNotes` on the store, one row per
 * (séance × joueur × critère), so a séance only carries what was actually
 * scored — an unscored critère has no row rather than a zero.
 */

export type CritereType = "note" | "mesure"

export type EvaluationCritere = {
  id: string
  /** Short label — the table column head. */
  nom: string
  /** Full wording, shown as the column's tooltip and on the fiche. */
  libelle: string
  type: CritereType
  /** "note" only — what the mark is out of. */
  bareme?: number
  /** "mesure" only — what the value is expressed in. */
  unite?: string
  /** Surfaced on the joueur's card in his fiche. */
  surCarte: boolean
  /** Supporting files can be attached to the score. */
  avecDocuments: boolean
}

export type EvaluationGrille = {
  id: string
  nom: string
  /** Domaine d'évaluation — how the grilles are grouped in the picker. */
  domaine: string
  /** Private grids stay between the staff and the joueur concerned. */
  prive: boolean
  criteres: EvaluationCritere[]
}

/** One score: a joueur, on one critère, for one séance. */
export type EvaluationNote = {
  id: string
  /** SeanceDetail.eventId — the séance being debriefed. */
  seanceId: string
  /** CategorieJoueur.id. */
  joueurId: string
  critereId: string
  valeur: number
}

const note = (
  id: string,
  nom: string,
  libelle: string,
  opts: { bareme?: number; surCarte?: boolean; avecDocuments?: boolean } = {},
): EvaluationCritere => ({
  id,
  nom,
  libelle,
  type: "note",
  bareme: opts.bareme ?? 100,
  surCarte: opts.surCarte ?? true,
  avecDocuments: opts.avecDocuments ?? false,
})

const mesure = (
  id: string,
  nom: string,
  libelle: string,
  unite: string,
  opts: { surCarte?: boolean; avecDocuments?: boolean } = {},
): EvaluationCritere => ({
  id,
  nom,
  libelle,
  type: "mesure",
  unite,
  surCarte: opts.surCarte ?? true,
  avecDocuments: opts.avecDocuments ?? false,
})

export const evaluationGrillesSeed: EvaluationGrille[] = [
  {
    id: "grille-stats-match",
    nom: "Statistiques individuelles match",
    domaine: "Match",
    prive: true,
    criteres: [
      note("cr-temps-de-jeu", "Temps de jeu", "Temps de jeu"),
      mesure("cr-buts-encaisses", "Buts encaissés", "Buts encaissés", "buts", {
        avecDocuments: true,
      }),
      note("cr-passes-d", "Passes décisives", "Passes décisives"),
      note("cr-buts-marques", "Buts marqués", "Buts marqués"),
      note("cr-recuperations", "Récupérations", "Récupérations de la balle"),
      note(
        "cr-desequilibres",
        "Déséquilibres",
        "Déséquilibres provoqués",
        { avecDocuments: true },
      ),
    ],
  },
  {
    id: "grille-physique",
    nom: "Physique",
    domaine: "Physique",
    prive: true,
    criteres: [
      mesure("cr-vitesse-30m", "Vitesse 30 m", "Vitesse linéaire 30 m", "s"),
      note("cr-vitesse-l", "Vitesse en L", "Vitesse en L"),
      mesure("cr-vitesse-10m", "Vitesse 10 m", "Vitesse linéaire 10 m", "s"),
      mesure("cr-vma", "VMA", "Vitesse maximale aérobie", "km/h", {
        avecDocuments: true,
      }),
      mesure(
        "cr-detente-h",
        "Détente horizontale",
        "Détente horizontale",
        "cm",
      ),
      mesure("cr-detente-v", "Détente verticale", "Détente verticale", "cm"),
    ],
  },
  {
    id: "grille-tactique",
    nom: "Tactique",
    domaine: "Tactique",
    prive: true,
    criteres: [
      note("cr-intelligence", "Intelligence de jeu", "Intelligence de jeu"),
      note("cr-reactivite", "Réactivité", "Réactivité / Adaptation"),
      note(
        "cr-placement",
        "Placement",
        "Placement / Déplacement / Replacement",
      ),
      note("cr-utilisation", "Utilisation du ballon", "Utilisation du ballon"),
      note(
        "cr-jeu-sans-ballon",
        "Jeu sans ballon",
        "Jeu sans ballon et anticipation des actions",
        { avecDocuments: true },
      ),
    ],
  },
]

/**
 * Séance 21 is already debriefed on the tactique grille — a spread of marks so
 * the tab opens on something read, not an empty sheet. Keyed by that séance's
 * own participant ids; every other séance starts blank, which is the state a
 * coach actually meets.
 */
const MARQUES: Record<string, number[]> = {
  "sp-gk": [72, 65, 80, 58, 70],
  "sp-df1": [88, 91, 84, 79, 86],
  "sp-df2": [54, 60, 49, 62, 55],
  "sp-me1": [76, 70, 73, 81, 68],
  "sp-at1": [93, 87, 90, 95, 89],
}

export const evaluationNotesSeed: EvaluationNote[] = Object.entries(
  MARQUES,
).flatMap(([joueurId, valeurs]) =>
  valeurs.map((valeur, i) => ({
    id: `note-s21-${joueurId}-${i}`,
    seanceId: "ev-seance-21",
    joueurId,
    critereId: evaluationGrillesSeed[2].criteres[i].id,
    valeur,
  })),
)
