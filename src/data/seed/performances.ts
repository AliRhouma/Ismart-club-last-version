/**
 * Performances — the wellness / load questionnaires of Pôle technique.
 *
 * A **modèle** (template) holds an échelle (min → max, a step, optional labels
 * per value), the questions answered on it, and the "analyse des scores": the
 * intervals that turn a joueur's total into a verdict (Hooper 4–8 → Excellent).
 * A **questionnaire** is one launch of a modèle for a catégorie, within a
 * saison; joueurs answer it and each réponse keeps one value per question.
 *
 * A questionnaire carries a *copy* of its modèle as it was at launch, so
 * editing or deleting a modèle never rewrites answers already collected.
 *
 * Totals, verdicts, response rates are derived in render — never stored.
 */

import { categoriesSeed } from "@/data/seed/categories"
import {
  PARTAGE_PAR_DEFAUT,
  type ProgrammePartage,
} from "@/data/seed/programmation"

export type Echelle = {
  /** Preset the scale was picked from ("Échelle personnalisée" when edited). */
  nom: string
  min: number
  max: number
  pas: number
  /** Optional wording per value, e.g. { 1: "Très très faible" }. */
  etiquettes: Record<number, string>
}

/** How an interval reads — genuine status, so it maps to success/warning/danger. */
export type TonScore = "bon" | "moyen" | "mauvais"

export type IntervalleScore = {
  id: string
  min: number
  max: number
  libelle: string
  ton: TonScore
}

export type QuestionModele = {
  id: string
  texte: string
}

export type ModeleQuestionnaire = {
  id: string
  nom: string
  /** "AAAA-MM-JJ". */
  creeLe: string
  auteur: string
  echelle: Echelle
  intervalles: IntervalleScore[]
  questions: QuestionModele[]
  partage: ProgrammePartage
}

/** The part of a modèle a questionnaire freezes at launch. */
export type ModeleFige = Pick<
  ModeleQuestionnaire,
  "nom" | "echelle" | "intervalles" | "questions"
>

export type ReponseQuestionnaire = {
  id: string
  joueurId: string
  /** questionId → value on the échelle. */
  valeurs: Record<string, number>
  /** "AAAA-MM-JJ". */
  reponduLe: string
}

export type Questionnaire = {
  id: string
  nom: string
  saison: string
  categorieId: string
  /** Empty = every groupe of the catégorie. */
  groupeId: string | null
  /** "AAAA-MM-JJ". */
  lanceLe: string
  statut: "ouvert" | "clos"
  modeleId: string
  modele: ModeleFige
  reponses: ReponseQuestionnaire[]
}

/* ── Échelle presets ─────────────────────────────────────────────────────── */

const libelles = (min: number, mots: string[]) =>
  Object.fromEntries(mots.map((m, i) => [min + i, m]))

const SEPT_NIVEAUX = [
  "Très très faible",
  "Très faible",
  "Faible",
  "Normal",
  "Élevé",
  "Très élevé",
  "Très très élevé",
]

export const ECHELLE_PERSONNALISEE = "Échelle personnalisée"

/** The scales offered by the editor's picker — picking one fills the fields. */
export const ECHELLES_PRESET: Echelle[] = [
  {
    nom: "Échelle Hooper",
    min: 1,
    max: 7,
    pas: 1,
    etiquettes: libelles(1, SEPT_NIVEAUX),
  },
  {
    nom: "Échelle RPE (Borg CR10)",
    min: 0,
    max: 10,
    pas: 1,
    etiquettes: libelles(0, [
      "Repos - Aucun effort",
      "Très très facile",
      "Facile",
      "Modéré",
      "Un peu difficile",
      "Difficile",
      "Difficile +",
      "Très difficile",
      "Très difficile +",
      "Extrêmement difficile",
      "Effort supra-maximal",
    ]),
  },
  {
    nom: "Qualité du sommeil",
    min: 1,
    max: 5,
    pas: 1,
    etiquettes: libelles(1, [
      "Excellente",
      "Bonne",
      "Moyenne",
      "Mauvaise",
      "Très mauvaise",
    ]),
  },
  {
    nom: "Niveau d'humeur / stress",
    min: 1,
    max: 5,
    pas: 1,
    etiquettes: libelles(1, [
      "Très détendu",
      "Détendu",
      "Normal",
      "Stressé",
      "Très stressé",
    ]),
  },
  { nom: "Note sur 10", min: 0, max: 10, pas: 1, etiquettes: {} },
]

export const echelleVide = (): Echelle => ({
  nom: ECHELLE_PERSONNALISEE,
  min: 1,
  max: 5,
  pas: 1,
  etiquettes: {},
})

const preset = (nom: string): Echelle => {
  const e = ECHELLES_PRESET.find((x) => x.nom === nom)!
  return { ...e, etiquettes: { ...e.etiquettes } }
}

/* ── Derived helpers (used by every screen) ──────────────────────────────── */

/** Every value the échelle allows, min → max by pas. */
export const valeursEchelle = (e: Echelle) => {
  const out: number[] = []
  if (e.pas <= 0 || e.max < e.min) return out
  for (let v = e.min; v <= e.max + 1e-9; v += e.pas) {
    out.push(Math.round(v * 100) / 100)
    if (out.length > 101) break
  }
  return out
}

/** The range a total can land in — n questions × the échelle. */
export const bornesTotal = (m: Pick<ModeleFige, "echelle" | "questions">) => ({
  min: m.questions.length * m.echelle.min,
  max: m.questions.length * m.echelle.max,
})

export const totalReponse = (r: ReponseQuestionnaire) =>
  Object.values(r.valeurs).reduce((s, v) => s + v, 0)

/** The interval a total falls in (bounds inclusive; first match wins). */
export const verdictPour = (intervalles: IntervalleScore[], total: number) =>
  intervalles.find((i) => total >= i.min && total <= i.max) ?? null

/** Where the échelle's midpoint sits — the neutral starting value of a slider. */
export const valeurMilieu = (e: Echelle) => {
  const vs = valeursEchelle(e)
  return vs[Math.floor((vs.length - 1) / 2)] ?? e.min
}

export const figer = (m: ModeleQuestionnaire): ModeleFige =>
  structuredClone({
    nom: m.nom,
    echelle: m.echelle,
    intervalles: m.intervalles,
    questions: m.questions,
  })

/* ── Seed modèles ────────────────────────────────────────────────────────── */

const AUTEUR = "Bilel Boussaid"

export const modelesQuestionnaireSeed: ModeleQuestionnaire[] = [
  {
    id: "modele-hooper",
    nom: "Hooper",
    creeLe: "2025-01-14",
    auteur: AUTEUR,
    echelle: preset("Échelle Hooper"),
    intervalles: [
      { id: "hooper-i1", min: 4, max: 8, libelle: "Excellent", ton: "bon" },
      { id: "hooper-i2", min: 9, max: 13, libelle: "Bon", ton: "bon" },
      { id: "hooper-i3", min: 14, max: 18, libelle: "Moyen", ton: "moyen" },
      { id: "hooper-i4", min: 19, max: 23, libelle: "Mauvais", ton: "mauvais" },
      {
        id: "hooper-i5",
        min: 24,
        max: 28,
        libelle: "Très mauvais",
        ton: "mauvais",
      },
    ],
    questions: [
      { id: "hooper-q1", texte: "Qualité du sommeil" },
      { id: "hooper-q2", texte: "Niveau de fatigue" },
      { id: "hooper-q3", texte: "Niveau de stress" },
      { id: "hooper-q4", texte: "Niveau de courbatures / douleurs" },
    ],
    partage: { ...PARTAGE_PAR_DEFAUT, portee: "partenaires" },
  },
  {
    // Edge case: a modèle whose analyse des scores is still empty — its
    // questionnaires show totals but no verdict.
    id: "modele-index-hooper",
    nom: "Index Hooper",
    creeLe: "2026-04-13",
    auteur: AUTEUR,
    echelle: preset("Échelle Hooper"),
    intervalles: [],
    questions: [
      { id: "ih-q1", texte: "Comment avez-vous dormi cette nuit ?" },
      { id: "ih-q2", texte: "Quel est votre niveau de fatigue ?" },
      { id: "ih-q3", texte: "Quel est votre niveau de stress ?" },
      { id: "ih-q4", texte: "Ressentez-vous des douleurs musculaires ?" },
    ],
    partage: PARTAGE_PAR_DEFAUT,
  },
  {
    id: "modele-rpe",
    nom: "RPE - Perception de l'Effort",
    creeLe: "2026-04-13",
    auteur: AUTEUR,
    echelle: preset("Échelle RPE (Borg CR10)"),
    intervalles: [
      { id: "rpe-i1", min: 0, max: 3, libelle: "Récupération", ton: "bon" },
      { id: "rpe-i2", min: 4, max: 6, libelle: "Charge modérée", ton: "moyen" },
      { id: "rpe-i3", min: 7, max: 10, libelle: "Charge élevée", ton: "mauvais" },
    ],
    questions: [
      {
        id: "rpe-q1",
        texte: "Quelle a été l'intensité de la séance d'aujourd'hui ?",
      },
    ],
    partage: PARTAGE_PAR_DEFAUT,
  },
]

/* ── Seed questionnaires ─────────────────────────────────────────────────── */

/** Deterministic 0…1 from a string — varied but stable answers. */
const hash = (s: string) => {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return ((h >>> 0) % 1000) / 1000
}

/**
 * Answers for a questionnaire: `taux` of the effectif replied, each joueur
 * around a personal level on the échelle (so the same player stays coherent
 * across questions), with `alertes` joueurs pushed to the top of the scale.
 */
function reponses(
  qid: string,
  modele: ModeleQuestionnaire,
  categorieId: string,
  date: string,
  taux: number,
  alertes: string[] = [],
): ReponseQuestionnaire[] {
  const cat = categoriesSeed.find((c) => c.id === categorieId)
  const { min, max } = modele.echelle
  const span = max - min
  return (cat?.joueurs ?? [])
    .filter((j) => alertes.includes(j.id) || hash(qid + j.id) < taux)
    .map((j) => {
      const alerte = alertes.includes(j.id)
      const niveau = alerte ? 0.85 : 0.1 + hash(j.id + "niveau") * 0.5
      const valeurs = Object.fromEntries(
        modele.questions.map((q) => {
          const bruit = (hash(qid + j.id + q.id) - 0.5) * 0.3
          const v = min + Math.round(Math.min(1, Math.max(0, niveau + bruit)) * span)
          return [q.id, v]
        }),
      )
      return {
        id: `${qid}-${j.id}`,
        joueurId: j.id,
        valeurs,
        reponduLe: date,
      }
    })
}

const M = Object.fromEntries(modelesQuestionnaireSeed.map((m) => [m.id, m]))

const lance = (
  q: Omit<Questionnaire, "modele" | "reponses">,
  taux: number,
  alertes?: string[],
): Questionnaire => ({
  ...q,
  modele: figer(M[q.modeleId]),
  reponses: reponses(q.id, M[q.modeleId], q.categorieId, q.lanceLe, taux, alertes),
})

export const questionnairesSeed: Questionnaire[] = [
  lance(
    {
      id: "q-hooper-fff-s24",
      nom: "Hooper — semaine 24",
      saison: "2025 - 2026",
      categorieId: "fff",
      groupeId: null,
      lanceLe: "2026-03-09",
      statut: "ouvert",
      modeleId: "modele-hooper",
    },
    0.7,
    ["fff-j7", "fff-j12"],
  ),
  lance(
    {
      id: "q-rpe-fff-lyon",
      nom: "RPE après le match amical",
      saison: "2025 - 2026",
      categorieId: "fff",
      groupeId: "fff-groupe-a",
      lanceLe: "2026-03-02",
      statut: "clos",
      modeleId: "modele-rpe",
    },
    1,
    ["fff-j3"],
  ),
  lance(
    {
      id: "q-hooper-u17-reprise",
      nom: "Hooper de reprise",
      saison: "2025 - 2026",
      categorieId: "u17",
      groupeId: null,
      lanceLe: "2026-02-16",
      statut: "clos",
      modeleId: "modele-hooper",
    },
    0.85,
  ),
  lance(
    {
      id: "q-index-u15",
      nom: "Bien-être du lundi",
      saison: "2025 - 2026",
      categorieId: "u15",
      groupeId: null,
      lanceLe: "2026-03-10",
      statut: "ouvert",
      modeleId: "modele-index-hooper",
    },
    0.3,
  ),
  lance(
    {
      id: "q-hooper-fff-2425",
      nom: "Hooper fin de saison",
      saison: "2024 - 2025",
      categorieId: "fff",
      groupeId: null,
      lanceLe: "2025-05-26",
      statut: "clos",
      modeleId: "modele-hooper",
    },
    0.9,
  ),
]

/** Today as "AAAA-MM-JJ" — the stamp of a launch or an answer. */
export const aujourdhuiIso = () => {
  const n = new Date()
  const p = (x: number) => String(x).padStart(2, "0")
  return `${n.getFullYear()}-${p(n.getMonth() + 1)}-${p(n.getDate())}`
}

/** A new modèle starts private — sharing is a deliberate step. */
export const PARTAGE_PAR_DEFAUT_MODELE: ProgrammePartage = PARTAGE_PAR_DEFAUT
