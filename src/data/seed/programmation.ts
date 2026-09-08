/**
 * Programmation & Séances — the club's annual training plan and the séances
 * that realise it (Pôle technique ▸ Programmation, ▸ Séances).
 *
 * One programme annuel per saison × catégorie × groupe — the Programmation
 * screen switches between them with its three selects. A programme holds 3
 * sessions a week over 36 weeks; each session names the principe de jeu to work
 * on (`principeId` → the procédés taxonomy, so the two modules share one
 * referential) or a `special` slot (évaluation, séance récréative, physique).
 * A session that has been turned into a real séance carries its `seanceId`.
 * Shapes follow the backend's `/annual-programs/:id` and
 * `/training-sessions/category/:id`.
 */

import { categoriesSeed } from "@/data/seed/categories"

/** Slots that aren't a principe de jeu but still occupy a séance. */
export type ProgSpecial = string

/** Seasons the programmation screen can be scoped to, most recent last. */
export const SAISONS = ["2024 - 2025", "2025 - 2026", "2026 - 2027"]

/** The season the club is currently running. */
export const SAISON_ACTIVE = "2025 - 2026"

/** Séances that don't work a principe de jeu — the "Autre" family. */
export const PROG_SPECIALS: ProgSpecial[] = [
  "Évaluation",
  "Séance récréative",
  "Préparation physique",
  "Problèmes récurrents",
]

/** Weeks in a programme annuel, and séances held each week. */
export const SEMAINES = 36
export const SEANCES_PAR_SEMAINE = 3

export type ProgSession = {
  id: string
  /** 1 → 36. */
  semaine: number
  /** Séance number across the season, e.g. 96. */
  numero: number
  /** Position within its week (0-based). */
  index: number
  /** Principe travaillé — an id from `procedePrincipesSeed`. */
  principeId?: string
  /** Set instead of `principeId` for évaluation / récréative / physique. */
  special?: ProgSpecial
  installation?: string
  /** Set once the session has been planned as a real séance. */
  seanceId?: string
}

/** Who a shared programme reaches outside the staff. */
export type PartagePortee = "prive" | "partenaires" | "personnalise"

/** The blocks of the programme a share can carry. */
export const PARTAGE_RESSOURCES = [
  "Critères d'évaluation",
  "Étape de projet de jeu",
  "Séances",
] as const

export type ProgrammePartage = {
  /** Which blocks travel with the share. */
  ressources: string[]
  portee: PartagePortee
  /** Only read when `portee` is "personnalise". */
  partenaireIds: string[]
}

/** Who inside the club can open the programme, set from the Réglages tab. */
export type ProgrammeVisibilite = {
  joueurs: boolean
  parents: boolean
  /** Groupes of the catégorie that see it. Empty = every groupe. */
  groupeIds: string[]
}

export const PARTAGE_PAR_DEFAUT: ProgrammePartage = {
  ressources: [],
  portee: "prive",
  partenaireIds: [],
}

export const VISIBILITE_PAR_DEFAUT: ProgrammeVisibilite = {
  joueurs: false,
  parents: false,
  groupeIds: [],
}

export type ProgrammeAnnuel = {
  id: string
  saison: string
  /** Id of the catégorie the programme belongs to (`categoriesSeed`). */
  categorieId: string
  /** Display name of that catégorie, e.g. "FFF". */
  categorie: string
  sessions: ProgSession[]
  /** Community share — unset means the default (privé, nothing shared). */
  partage?: ProgrammePartage
  /** In-club visibility — unset means staff only. */
  visibilite?: ProgrammeVisibilite
  /** Folder the programme was filed into, if any (`dossiersSeed`). */
  dossierId?: string
}

/**
 * The saison × équipe the Programmation screen is looking at. A programme
 * annuel is written once per équipe and run by all of its groupes — the two
 * groupes of a catégorie work the same season — so the groupe is a filter
 * inside the programme, never part of its identity.
 */
export type ProgrammeScope = {
  saison: string
  categorieId: string
}

export type SeanceStatut = "À venir" | "En cours" | "Terminée"

export type SeanceClub = {
  id: string
  numero: number
  /** ISO date-time. */
  date: string
  categorie: string
  groupe: string
  statut: SeanceStatut
  brouillon: boolean
  /** Minutes, plain string. */
  duree: string
  installation?: string
  principeId?: string
  special?: ProgSpecial
  /** Head-count once the séance has run (0 = not recorded). */
  effectif: number
  /** Target RPE 0-10 (0 = not set). */
  rpeCible: number
  materiel: { quantite: number; nom: string }[]
  /** Procédés run in the séance — ids from `procedesSeed`. */
  procedeIds: string[]
  securiteVerifiee: boolean
  hydratationVerifiee: boolean
  /** Free-text "explication" written when the séance is created. */
  notes?: string
  /** Minute marks where the séance breaks for drinks, in order. */
  hydratations?: number[]
  /** Séance debriefed: the éducateur filled in his évaluation of it. */
  evaluationFaite?: boolean
  /** Player performances rated for that séance. */
  performanceFaite?: boolean
}

export const programmeAnnuelSeed: ProgrammeAnnuel = {
  id: "prog-fff",
  saison: SAISON_ACTIVE,
  categorieId: "fff",
  categorie: "FFF",
  sessions: [
    {
      id: "prog-s1",
      semaine: 1,
      numero: 1,
      index: 0,
      special: "Évaluation",
      installation: "Stade de France",
      seanceId: "seance-1",
    },
    {
      id: "prog-s2",
      semaine: 1,
      numero: 2,
      index: 1,
      special: "Évaluation",
      installation: "Stade de France",
      seanceId: "seance-2",
    },
    {
      id: "prog-s3",
      semaine: 1,
      numero: 3,
      index: 2,
      special: "Évaluation",
      installation: "Stade de France",
      seanceId: "seance-3",
    },
    {
      id: "prog-s4",
      semaine: 2,
      numero: 4,
      index: 0,
      special: "Préparation physique",
      installation: "Stade de France",
      seanceId: "seance-4",
    },
    {
      id: "prog-s5",
      semaine: 2,
      numero: 5,
      index: 1,
      special: "Préparation physique",
      installation: "Stade de France",
      seanceId: "seance-5",
    },
    {
      id: "prog-s6",
      semaine: 2,
      numero: 6,
      index: 2,
      special: "Préparation physique",
      installation: "Stade de France",
      seanceId: "seance-6",
    },
    {
      id: "prog-s7",
      semaine: 3,
      numero: 7,
      index: 0,
      principeId: "creer-et-utiliser-des-espaces",
      installation: "Stade de France",
      seanceId: "seance-7",
    },
    {
      id: "prog-s8",
      semaine: 3,
      numero: 8,
      index: 1,
      principeId: "creer-et-utiliser-des-espaces",
      installation: "Stade de France",
      seanceId: "seance-8",
    },
    {
      id: "prog-s9",
      semaine: 3,
      numero: 9,
      index: 2,
      principeId: "creer-et-utiliser-des-espaces",
      installation: "Stade de France",
      seanceId: "seance-9",
    },
    {
      id: "prog-s10",
      semaine: 4,
      numero: 10,
      index: 0,
      principeId: "jouer-dans-les-intervalles-et-entres-les-l",
      installation: "Stade de France",
    },
    {
      id: "prog-s11",
      semaine: 4,
      numero: 11,
      index: 1,
      principeId: "jouer-dans-les-intervalles-et-entres-les-l",
      installation: "Stade de France",
    },
    {
      id: "prog-s12",
      semaine: 4,
      numero: 12,
      index: 2,
      principeId: "jouer-dans-les-intervalles-et-entres-les-l",
      installation: "Stade de France",
    },
    {
      id: "prog-s13",
      semaine: 5,
      numero: 13,
      index: 0,
      principeId: "jouer-a-l-oppose-apres-avoir-fixe-collecti",
      installation: "Stade de France",
    },
    {
      id: "prog-s14",
      semaine: 5,
      numero: 14,
      index: 1,
      principeId: "jouer-a-l-oppose-apres-avoir-fixe-collecti",
      installation: "Stade de France",
    },
    {
      id: "prog-s15",
      semaine: 5,
      numero: 15,
      index: 2,
      principeId: "jouer-a-l-oppose-apres-avoir-fixe-collecti",
      installation: "Stade de France",
    },
    {
      id: "prog-s16",
      semaine: 6,
      numero: 16,
      index: 0,
      principeId: "freiner-la-progression-de-l-adversaire-org",
      installation: "Stade de France",
    },
    {
      id: "prog-s17",
      semaine: 6,
      numero: 17,
      index: 1,
      principeId: "freiner-la-progression-de-l-adversaire-org",
      installation: "Stade de France",
    },
    {
      id: "prog-s18",
      semaine: 6,
      numero: 18,
      index: 2,
      principeId: "freiner-la-progression-de-l-adversaire-org",
      installation: "Stade de France",
    },
    {
      id: "prog-s19",
      semaine: 7,
      numero: 19,
      index: 0,
      principeId: "jouer-combine-pour-creer-un-surnombre",
      installation: "Stade de France",
    },
    {
      id: "prog-s20",
      semaine: 7,
      numero: 20,
      index: 1,
      principeId: "jouer-combine-pour-creer-un-surnombre",
      installation: "Stade de France",
    },
    {
      id: "prog-s21",
      semaine: 7,
      numero: 21,
      index: 2,
      principeId: "jouer-combine-pour-creer-un-surnombre",
      installation: "Stade de France",
    },
    {
      id: "prog-s22",
      semaine: 8,
      numero: 22,
      index: 0,
      principeId: "se-demarquer-pour-fixer-et-eliminer-passer",
      installation: "Stade de France",
    },
    {
      id: "prog-s23",
      semaine: 8,
      numero: 23,
      index: 1,
      principeId: "se-demarquer-pour-fixer-et-eliminer-passer",
      installation: "Stade de France",
    },
    {
      id: "prog-s24",
      semaine: 8,
      numero: 24,
      index: 2,
      principeId: "se-demarquer-pour-fixer-et-eliminer-passer",
      installation: "Stade de France",
    },
    {
      id: "prog-s25",
      semaine: 9,
      numero: 25,
      index: 0,
      principeId: "densifier-et-etre-actif-dans-le-cjd",
      installation: "Stade de France",
    },
    {
      id: "prog-s26",
      semaine: 9,
      numero: 26,
      index: 1,
      principeId: "densifier-et-etre-actif-dans-le-cjd",
      installation: "Stade de France",
    },
    {
      id: "prog-s27",
      semaine: 9,
      numero: 27,
      index: 2,
      principeId: "densifier-et-etre-actif-dans-le-cjd",
      installation: "Stade de France",
    },
    {
      id: "prog-s28",
      semaine: 10,
      numero: 28,
      index: 0,
      principeId: "s-organiser-en-desequilibre",
      installation: "Stade de France",
    },
    {
      id: "prog-s29",
      semaine: 10,
      numero: 29,
      index: 1,
      principeId: "s-organiser-en-desequilibre",
      installation: "Stade de France",
    },
    {
      id: "prog-s30",
      semaine: 10,
      numero: 30,
      index: 2,
      principeId: "s-organiser-en-desequilibre",
      installation: "Stade de France",
    },
    {
      id: "prog-s31",
      semaine: 11,
      numero: 31,
      index: 0,
      principeId: "se-demarquer-pour-fixer-et-eliminer-passer",
      installation: "Stade de France",
    },
    {
      id: "prog-s32",
      semaine: 11,
      numero: 32,
      index: 1,
      principeId: "se-demarquer-pour-fixer-et-eliminer-passer",
      installation: "Stade de France",
    },
    {
      id: "prog-s33",
      semaine: 11,
      numero: 33,
      index: 2,
      principeId: "se-demarquer-pour-fixer-et-eliminer-passer",
      installation: "Stade de France",
    },
    {
      id: "prog-s34",
      semaine: 12,
      numero: 34,
      index: 0,
      special: "Séance récréative",
      installation: "Stade de France",
    },
    {
      id: "prog-s35",
      semaine: 12,
      numero: 35,
      index: 1,
      special: "Séance récréative",
      installation: "Stade de France",
    },
    {
      id: "prog-s36",
      semaine: 12,
      numero: 36,
      index: 2,
      special: "Séance récréative",
      installation: "Stade de France",
    },
    {
      id: "prog-s37",
      semaine: 13,
      numero: 37,
      index: 0,
      principeId: "creer-et-utiliser-des-espaces",
      installation: "Stade de France",
      seanceId: "seance-37",
    },
    {
      id: "prog-s38",
      semaine: 13,
      numero: 38,
      index: 1,
      principeId: "creer-et-utiliser-des-espaces",
      installation: "Stade de France",
      seanceId: "seance-38",
    },
    {
      id: "prog-s39",
      semaine: 13,
      numero: 39,
      index: 2,
      principeId: "creer-et-utiliser-des-espaces",
      installation: "Stade de France",
      seanceId: "seance-39",
    },
    {
      id: "prog-s40",
      semaine: 14,
      numero: 40,
      index: 0,
      principeId: "jouer-dans-les-intervalles-et-entres-les-l",
      installation: "Stade de France",
    },
    {
      id: "prog-s41",
      semaine: 14,
      numero: 41,
      index: 1,
      principeId: "jouer-dans-les-intervalles-et-entres-les-l",
      installation: "Stade de France",
    },
    {
      id: "prog-s42",
      semaine: 14,
      numero: 42,
      index: 2,
      principeId: "jouer-dans-les-intervalles-et-entres-les-l",
      installation: "Stade de France",
    },
    {
      id: "prog-s43",
      semaine: 15,
      numero: 43,
      index: 0,
      principeId: "freiner-la-progression-de-l-adversaire-org",
      installation: "Stade de France",
    },
    {
      id: "prog-s44",
      semaine: 15,
      numero: 44,
      index: 1,
      principeId: "freiner-la-progression-de-l-adversaire-org",
      installation: "Stade de France",
    },
    {
      id: "prog-s45",
      semaine: 15,
      numero: 45,
      index: 2,
      principeId: "freiner-la-progression-de-l-adversaire-org",
      installation: "Stade de France",
    },
    {
      id: "prog-s46",
      semaine: 16,
      numero: 46,
      index: 0,
      special: "Évaluation",
      installation: "Stade de France",
      seanceId: "seance-46",
    },
    {
      id: "prog-s47",
      semaine: 16,
      numero: 47,
      index: 1,
      special: "Évaluation",
      installation: "Stade de France",
      seanceId: "seance-47",
    },
    {
      id: "prog-s48",
      semaine: 16,
      numero: 48,
      index: 2,
      special: "Évaluation",
      installation: "Stade de France",
      seanceId: "seance-48",
    },
    {
      id: "prog-s49",
      semaine: 17,
      numero: 49,
      index: 0,
      principeId: "jouer-a-l-oppose-apres-avoir-fixe-collecti",
      installation: "Stade de France",
    },
    {
      id: "prog-s50",
      semaine: 17,
      numero: 50,
      index: 1,
      principeId: "jouer-a-l-oppose-apres-avoir-fixe-collecti",
      installation: "Stade de France",
    },
    {
      id: "prog-s51",
      semaine: 17,
      numero: 51,
      index: 2,
      principeId: "jouer-a-l-oppose-apres-avoir-fixe-collecti",
      installation: "Stade de France",
    },
    {
      id: "prog-s52",
      semaine: 18,
      numero: 52,
      index: 0,
      principeId: "jouer-combine-pour-creer-un-surnombre",
      installation: "Stade de France",
    },
    {
      id: "prog-s53",
      semaine: 18,
      numero: 53,
      index: 1,
      principeId: "jouer-combine-pour-creer-un-surnombre",
      installation: "Stade de France",
    },
    {
      id: "prog-s54",
      semaine: 18,
      numero: 54,
      index: 2,
      principeId: "jouer-combine-pour-creer-un-surnombre",
      installation: "Stade de France",
      seanceId: "seance-54",
    },
    {
      id: "prog-s55",
      semaine: 19,
      numero: 55,
      index: 0,
      principeId: "se-demarquer-pour-fixer-et-eliminer-passer",
      installation: "Stade de France",
    },
    {
      id: "prog-s56",
      semaine: 19,
      numero: 56,
      index: 1,
      principeId: "se-demarquer-pour-fixer-et-eliminer-passer",
      installation: "Stade de France",
    },
    {
      id: "prog-s57",
      semaine: 19,
      numero: 57,
      index: 2,
      principeId: "se-demarquer-pour-fixer-et-eliminer-passer",
      installation: "Stade de France",
    },
    {
      id: "prog-s58",
      semaine: 20,
      numero: 58,
      index: 0,
      principeId: "densifier-et-etre-actif-dans-le-cjd",
      installation: "Stade de France",
    },
    {
      id: "prog-s59",
      semaine: 20,
      numero: 59,
      index: 1,
      principeId: "densifier-et-etre-actif-dans-le-cjd",
      installation: "Stade de France",
    },
    {
      id: "prog-s60",
      semaine: 20,
      numero: 60,
      index: 2,
      principeId: "densifier-et-etre-actif-dans-le-cjd",
      installation: "Stade de France",
    },
    {
      id: "prog-s61",
      semaine: 21,
      numero: 61,
      index: 0,
      special: "Séance récréative",
      installation: "Stade de France",
    },
    {
      id: "prog-s62",
      semaine: 21,
      numero: 62,
      index: 1,
      special: "Séance récréative",
      installation: "Stade de France",
    },
    {
      id: "prog-s63",
      semaine: 21,
      numero: 63,
      index: 2,
      special: "Séance récréative",
      installation: "Stade de France",
    },
    {
      id: "prog-s64",
      semaine: 22,
      numero: 64,
      index: 0,
      principeId: "creer-et-utiliser-des-espaces",
      installation: "Stade de France",
      seanceId: "seance-64",
    },
    {
      id: "prog-s65",
      semaine: 22,
      numero: 65,
      index: 1,
      principeId: "creer-et-utiliser-des-espaces",
      installation: "Stade de France",
      seanceId: "seance-65",
    },
    {
      id: "prog-s66",
      semaine: 22,
      numero: 66,
      index: 2,
      principeId: "creer-et-utiliser-des-espaces",
      installation: "Stade de France",
      seanceId: "seance-66",
    },
    {
      id: "prog-s67",
      semaine: 23,
      numero: 67,
      index: 0,
      principeId: "jouer-dans-les-intervalles-et-entres-les-l",
      installation: "Stade de France",
    },
    {
      id: "prog-s68",
      semaine: 23,
      numero: 68,
      index: 1,
      principeId: "jouer-dans-les-intervalles-et-entres-les-l",
      installation: "Stade de France",
    },
    {
      id: "prog-s69",
      semaine: 23,
      numero: 69,
      index: 2,
      principeId: "jouer-dans-les-intervalles-et-entres-les-l",
      installation: "Stade de France",
    },
    {
      id: "prog-s70",
      semaine: 24,
      numero: 70,
      index: 0,
      principeId: "s-organiser-en-desequilibre",
      installation: "Stade de France",
    },
    {
      id: "prog-s71",
      semaine: 24,
      numero: 71,
      index: 1,
      principeId: "s-organiser-en-desequilibre",
      installation: "Stade de France",
    },
    {
      id: "prog-s72",
      semaine: 24,
      numero: 72,
      index: 2,
      principeId: "s-organiser-en-desequilibre",
      installation: "Stade de France",
    },
    {
      id: "prog-s73",
      semaine: 25,
      numero: 73,
      index: 0,
      principeId: "defendre-son-but-recuperer-ou-degager-le-b",
      installation: "Stade de France",
    },
    {
      id: "prog-s74",
      semaine: 25,
      numero: 74,
      index: 1,
      principeId: "defendre-son-but-recuperer-ou-degager-le-b",
      installation: "Stade de France",
    },
    {
      id: "prog-s75",
      semaine: 25,
      numero: 75,
      index: 2,
      principeId: "defendre-son-but-recuperer-ou-degager-le-b",
      installation: "Stade de France",
    },
    {
      id: "prog-s76",
      semaine: 26,
      numero: 76,
      index: 0,
      principeId: "jouer-a-l-oppose-apres-avoir-fixe-collecti",
      installation: "Stade de France",
    },
    {
      id: "prog-s77",
      semaine: 26,
      numero: 77,
      index: 1,
      principeId: "jouer-a-l-oppose-apres-avoir-fixe-collecti",
      installation: "Stade de France",
    },
    {
      id: "prog-s78",
      semaine: 26,
      numero: 78,
      index: 2,
      principeId: "jouer-a-l-oppose-apres-avoir-fixe-collecti",
      installation: "Stade de France",
    },
    {
      id: "prog-s79",
      semaine: 27,
      numero: 79,
      index: 0,
      principeId: "jouer-combine-pour-creer-un-surnombre",
      installation: "Stade de France",
    },
    {
      id: "prog-s80",
      semaine: 27,
      numero: 80,
      index: 1,
      principeId: "jouer-combine-pour-creer-un-surnombre",
      installation: "Stade de France",
    },
    {
      id: "prog-s81",
      semaine: 27,
      numero: 81,
      index: 2,
      principeId: "jouer-combine-pour-creer-un-surnombre",
      installation: "Stade de France",
    },
    {
      id: "prog-s82",
      semaine: 28,
      numero: 82,
      index: 0,
      principeId: "se-demarquer-pour-fixer-et-eliminer-passer",
      installation: "Stade de France",
    },
    {
      id: "prog-s83",
      semaine: 28,
      numero: 83,
      index: 1,
      principeId: "se-demarquer-pour-fixer-et-eliminer-passer",
      installation: "Stade de France",
    },
    {
      id: "prog-s84",
      semaine: 28,
      numero: 84,
      index: 2,
      principeId: "se-demarquer-pour-fixer-et-eliminer-passer",
      installation: "Stade de France",
    },
    {
      id: "prog-s85",
      semaine: 29,
      numero: 85,
      index: 0,
      special: "Évaluation",
      installation: "Stade de France",
      seanceId: "seance-85",
    },
    {
      id: "prog-s86",
      semaine: 29,
      numero: 86,
      index: 1,
      special: "Évaluation",
      installation: "Stade de France",
      seanceId: "seance-86",
    },
    {
      id: "prog-s87",
      semaine: 29,
      numero: 87,
      index: 2,
      special: "Évaluation",
      installation: "Stade de France",
      seanceId: "seance-87",
    },
    {
      id: "prog-s88",
      semaine: 30,
      numero: 88,
      index: 0,
      special: "Séance récréative",
      installation: "Stade de France",
    },
    {
      id: "prog-s89",
      semaine: 30,
      numero: 89,
      index: 1,
      special: "Séance récréative",
      installation: "Stade de France",
    },
    {
      id: "prog-s90",
      semaine: 30,
      numero: 90,
      index: 2,
      special: "Séance récréative",
      installation: "Stade de France",
    },
    {
      id: "prog-s91",
      semaine: 31,
      numero: 91,
      index: 0,
      principeId: "creer-et-utiliser-des-espaces",
      installation: "Stade de France",
    },
    {
      id: "prog-s92",
      semaine: 31,
      numero: 92,
      index: 1,
      principeId: "creer-et-utiliser-des-espaces",
      installation: "Stade de France",
      seanceId: "seance-92",
    },
    {
      id: "prog-s93",
      semaine: 31,
      numero: 93,
      index: 2,
      principeId: "creer-et-utiliser-des-espaces",
      installation: "Stade de France",
    },
    {
      id: "prog-s94",
      semaine: 32,
      numero: 94,
      index: 0,
      principeId: "creer-et-utiliser-des-espaces",
      installation: "Stade de France",
      seanceId: "seance-94",
    },
    {
      id: "prog-s95",
      semaine: 32,
      numero: 95,
      index: 1,
      principeId: "creer-et-utiliser-des-espaces",
      installation: "Stade de France",
      seanceId: "seance-95",
    },
    {
      id: "prog-s96",
      semaine: 32,
      numero: 96,
      index: 2,
      principeId: "creer-et-utiliser-des-espaces",
      installation: "Stade de France",
      seanceId: "seance-96",
    },
    {
      id: "prog-s97",
      semaine: 33,
      numero: 97,
      index: 0,
      special: "Séance récréative",
      installation: "Stade de France",
    },
    {
      id: "prog-s98",
      semaine: 33,
      numero: 98,
      index: 1,
      special: "Séance récréative",
      installation: "Stade de France",
    },
    {
      id: "prog-s99",
      semaine: 33,
      numero: 99,
      index: 2,
      special: "Séance récréative",
      installation: "Stade de France",
    },
    {
      id: "prog-s100",
      semaine: 34,
      numero: 100,
      index: 0,
      principeId: "creer-et-utiliser-des-espaces",
    },
    {
      id: "prog-s101",
      semaine: 34,
      numero: 101,
      index: 1,
      principeId: "creer-et-utiliser-des-espaces",
      seanceId: "seance-101",
    },
    {
      id: "prog-s102",
      semaine: 34,
      numero: 102,
      index: 2,
      principeId: "creer-et-utiliser-des-espaces",
      seanceId: "seance-102",
    },
    {
      id: "prog-s103",
      semaine: 35,
      numero: 103,
      index: 0,
      principeId: "creer-et-utiliser-des-espaces",
      seanceId: "seance-103",
    },
    {
      id: "prog-s104",
      semaine: 35,
      numero: 104,
      index: 1,
      principeId: "creer-et-utiliser-des-espaces",
    },
    {
      id: "prog-s105",
      semaine: 35,
      numero: 105,
      index: 2,
      principeId: "creer-et-utiliser-des-espaces",
    },
    {
      id: "prog-s106",
      semaine: 36,
      numero: 106,
      index: 0,
      principeId: "creer-et-utiliser-des-espaces",
    },
    {
      id: "prog-s107",
      semaine: 36,
      numero: 107,
      index: 1,
      principeId: "creer-et-utiliser-des-espaces",
    },
    {
      id: "prog-s108",
      semaine: 36,
      numero: 108,
      index: 2,
      principeId: "creer-et-utiliser-des-espaces",
    },
  ],
}

/* ── The other programmes of the club ─────────────────────────────────────
   FFF ▸ Groupe A is written by hand above (it is the one the séances of the
   season hang off). Every other saison × catégorie × groupe is filled from the
   same rotation so switching scope always lands on a believable plan: one
   theme per week, a special block every sixth week, and the last three weeks
   left "à définir". Nothing here is planned yet — a séance only exists once
   the coach plans it from the screen.                                        */

const ROTATION_PRINCIPES = [
  "creer-et-utiliser-des-espaces",
  "jouer-dans-les-intervalles-et-entres-les-l",
  "jouer-a-l-oppose-apres-avoir-fixe-collecti",
  "jouer-combine-pour-creer-un-surnombre",
  "se-demarquer-pour-fixer-et-eliminer-passer",
  "freiner-la-progression-de-l-adversaire-org",
  "densifier-et-etre-actif-dans-le-cjd",
  "s-organiser-en-desequilibre",
  "defendre-son-but-recuperer-ou-degager-le-b",
]

const INSTALLATIONS = ["Stade de France", "Terrain annexe", "Complexe Nord"]

/** Build a full 36-week programme; `decalage` shifts the rotation per groupe. */
export function programmeGenere(
  id: string,
  scope: ProgrammeScope & { categorie: string },
  decalage = 0,
): ProgrammeAnnuel {
  const sessions: ProgSession[] = []
  for (let semaine = 1; semaine <= SEMAINES; semaine++) {
    const rang = semaine + decalage
    const special =
      rang % 6 === 0
        ? PROG_SPECIALS[Math.floor(rang / 6) % PROG_SPECIALS.length]
        : undefined
    // The tail of the season is left open — a coach fills it in as it comes.
    const principeId =
      special || semaine > SEMAINES - 3
        ? undefined
        : ROTATION_PRINCIPES[rang % ROTATION_PRINCIPES.length]
    for (let index = 0; index < SEANCES_PAR_SEMAINE; index++) {
      const numero = (semaine - 1) * SEANCES_PAR_SEMAINE + index + 1
      sessions.push({
        id: `${id}-s${numero}`,
        semaine,
        numero,
        index,
        principeId,
        special,
        installation: INSTALLATIONS[(semaine + index) % INSTALLATIONS.length],
      })
    }
  }
  return { id, ...scope, sessions }
}

/** An untouched programme — every séance still à définir. */
export function programmeVierge(
  id: string,
  scope: ProgrammeScope & { categorie: string },
): ProgrammeAnnuel {
  const sessions: ProgSession[] = []
  for (let semaine = 1; semaine <= SEMAINES; semaine++) {
    for (let index = 0; index < SEANCES_PAR_SEMAINE; index++) {
      const numero = (semaine - 1) * SEANCES_PAR_SEMAINE + index + 1
      sessions.push({ id: `${id}-s${numero}`, semaine, numero, index })
    }
  }
  return { id, ...scope, sessions }
}

/**
 * Re-number a programme after the coach has added or removed a semaine / a
 * séance in edit mode: semaines stay a dense 1…N, `index` a dense 0…n inside
 * its semaine, and `numero` runs across the whole saison in that order. Weeks
 * are derived from their slots — a semaine exists as long as it holds one.
 */
export function renumeroterSessions(sessions: ProgSession[]): ProgSession[] {
  const ordre = [...sessions].sort(
    (a, b) => a.semaine - b.semaine || a.index - b.index,
  )
  const rangs = new Map<number, number>()
  for (const s of ordre) {
    if (!rangs.has(s.semaine)) rangs.set(s.semaine, rangs.size + 1)
  }
  const remplies = new Map<number, number>()
  return ordre.map((s, i) => {
    const semaine = rangs.get(s.semaine)!
    const index = remplies.get(semaine) ?? 0
    remplies.set(semaine, index + 1)
    return { ...s, semaine, index, numero: i + 1 }
  })
}

const slug = (saison: string) => saison.replace(/\s/g, "")

/**
 * The active saison is covered for every équipe of the club; the previous one
 * only for the two squads that already existed. 2026 - 2027 is deliberately
 * left empty — the screen opens on its "à créer" state there.
 */
export const programmesAnnuelsSeed: ProgrammeAnnuel[] = [
  programmeAnnuelSeed,
  ...categoriesSeed
    .filter((cat) => cat.id !== "fff")
    .map((cat, i) =>
      programmeGenere(
        `prog-${slug(SAISON_ACTIVE)}-${cat.id}`,
        {
          saison: SAISON_ACTIVE,
          categorieId: cat.id,
          categorie: cat.nom,
        },
        i,
      ),
    ),
  ...["fff", "senior"].map((categorieId, i) => {
    const cat = categoriesSeed.find((c) => c.id === categorieId)!
    return programmeGenere(
      `prog-2024-2025-${categorieId}`,
      { saison: "2024 - 2025", categorieId: cat.id, categorie: cat.nom },
      i + 3,
    )
  }),
]

export const seancesClubSeed: SeanceClub[] = [
  {
    id: "seance-4",
    numero: 4,
    date: "2025-09-01T17:00:00.000Z",
    categorie: "FFF",
    groupe: "Groupe A",
    statut: "En cours",
    brouillon: false,
    duree: "44",
    installation: "Stade de France",
    special: "Préparation physique",
    effectif: 25,
    rpeCible: 7,
    materiel: [
      { quantite: 12, nom: "Coupelles" },
      { quantite: 10, nom: "Ballons" },
      { quantite: 16, nom: "Coupelles" },
      { quantite: 10, nom: "Coupelles" },
    ],
    procedeIds: [],
    securiteVerifiee: true,
    hydratationVerifiee: true,
    evaluationFaite: false,
    performanceFaite: false,
  },
  {
    id: "seance-5",
    numero: 5,
    date: "2025-09-03T17:00:00.000Z",
    categorie: "FFF",
    groupe: "Groupe A",
    statut: "Terminée",
    brouillon: false,
    duree: "60",
    installation: "Stade de France",
    special: "Préparation physique",
    effectif: 2,
    rpeCible: 0,
    materiel: [],
    procedeIds: [],
    securiteVerifiee: false,
    hydratationVerifiee: false,
    evaluationFaite: true,
    performanceFaite: true,
  },
  {
    id: "seance-6",
    numero: 6,
    date: "2025-09-05T17:00:00.000Z",
    categorie: "FFF",
    groupe: "Groupe A",
    statut: "Terminée",
    brouillon: false,
    duree: "60",
    installation: "Stade de France",
    special: "Préparation physique",
    effectif: 2,
    rpeCible: 0,
    materiel: [],
    procedeIds: [],
    securiteVerifiee: false,
    hydratationVerifiee: false,
    evaluationFaite: true,
    performanceFaite: false,
  },
  {
    id: "seance-8",
    numero: 8,
    date: "2025-09-10T17:00:00.000Z",
    categorie: "FFF",
    groupe: "Groupe A",
    statut: "Terminée",
    brouillon: false,
    duree: "58",
    installation: "Stade de France",
    principeId: "creer-et-utiliser-des-espaces",
    effectif: 0,
    rpeCible: 0,
    materiel: [
      { quantite: 12, nom: "Coupelles" },
      { quantite: 10, nom: "Ballons" },
      { quantite: 3, nom: "Buts" },
    ],
    procedeIds: [
      "proc-sortie-de-balle-23fd",
      "proc-jeu-de-position-3-3-vs-3-e13b",
      "proc-occupation-des-couloirs-de-jeu-92c1",
      "proc-enchainement-de-passes-double-mw-572d",
    ],
    securiteVerifiee: true,
    hydratationVerifiee: false,
    evaluationFaite: true,
    performanceFaite: false,
  },
  {
    id: "seance-9",
    numero: 9,
    date: "2025-09-12T17:00:00.000Z",
    categorie: "FFF",
    groupe: "Groupe A",
    statut: "Terminée",
    brouillon: false,
    duree: "52",
    installation: "Stade de France",
    principeId: "creer-et-utiliser-des-espaces",
    effectif: 0,
    rpeCible: 0,
    materiel: [
      { quantite: 10, nom: "Coupelles" },
      { quantite: 10, nom: "Ballons" },
    ],
    procedeIds: [
      "proc-occupation-des-couloirs-de-jeu-92c1",
      "proc-enchainement-de-passes-double-mw-572d",
      "proc-sortie-de-balle-23fd",
      "proc-jeu-de-position-3-3-vs-3-e13b",
    ],
    securiteVerifiee: false,
    hydratationVerifiee: false,
    evaluationFaite: false,
    performanceFaite: true,
  },
  {
    id: "seance-3",
    numero: 3,
    date: "2025-10-10T17:00:00.000Z",
    categorie: "FFF",
    groupe: "Groupe A",
    statut: "Terminée",
    brouillon: false,
    duree: "120",
    installation: "Stade de France",
    special: "Évaluation",
    effectif: 0,
    rpeCible: 0,
    materiel: [],
    procedeIds: [],
    securiteVerifiee: false,
    hydratationVerifiee: false,
    evaluationFaite: true,
    performanceFaite: false,
  },
  {
    id: "seance-37",
    numero: 37,
    date: "2026-01-05T18:00:00.000Z",
    categorie: "FFF",
    groupe: "Groupe A",
    statut: "En cours",
    brouillon: false,
    duree: "57",
    installation: "Stade de France",
    principeId: "creer-et-utiliser-des-espaces",
    effectif: 0,
    rpeCible: 0,
    materiel: [
      { quantite: 8, nom: "Coupelles" },
      { quantite: 10, nom: "Ballons" },
      { quantite: 12, nom: "Coupelles" },
      { quantite: 3, nom: "Buts" },
    ],
    procedeIds: [
      "proc-enchainement-de-passes-double-mw-572d",
      "proc-sortie-de-balle-23fd",
      "proc-jeu-de-position-3-3-vs-3-e13b",
      "proc-occupation-des-couloirs-de-jeu-92c1",
    ],
    securiteVerifiee: false,
    hydratationVerifiee: false,
    evaluationFaite: false,
    performanceFaite: false,
  },
  {
    id: "seance-38",
    numero: 38,
    date: "2026-01-07T18:00:00.000Z",
    categorie: "FFF",
    groupe: "Groupe A",
    statut: "En cours",
    brouillon: false,
    duree: "57",
    installation: "Stade de France",
    principeId: "creer-et-utiliser-des-espaces",
    effectif: 0,
    rpeCible: 0,
    materiel: [
      { quantite: 8, nom: "Coupelles" },
      { quantite: 10, nom: "Ballons" },
      { quantite: 12, nom: "Coupelles" },
      { quantite: 3, nom: "Buts" },
    ],
    procedeIds: [
      "proc-occupation-des-couloirs-de-jeu-92c1",
      "proc-enchainement-de-passes-double-mw-572d",
      "proc-sortie-de-balle-23fd",
      "proc-jeu-de-position-3-3-vs-3-e13b",
    ],
    securiteVerifiee: false,
    hydratationVerifiee: false,
    evaluationFaite: false,
    performanceFaite: false,
  },
  {
    id: "seance-39",
    numero: 39,
    date: "2026-01-30T18:00:00.000Z",
    categorie: "FFF",
    groupe: "Groupe A",
    statut: "À venir",
    brouillon: false,
    duree: "59",
    installation: "Stade de France",
    principeId: "creer-et-utiliser-des-espaces",
    effectif: 0,
    rpeCible: 0,
    materiel: [
      { quantite: 2, nom: "Buts" },
      { quantite: 10, nom: "Ballons" },
      { quantite: 12, nom: "Coupelles" },
      { quantite: 8, nom: "Coupelles" },
    ],
    procedeIds: [
      "proc-jeu-de-position-3-3-vs-3-e13b",
      "proc-occupation-des-couloirs-de-jeu-92c1",
    ],
    securiteVerifiee: false,
    hydratationVerifiee: false,
    evaluationFaite: false,
    performanceFaite: false,
  },
  {
    id: "seance-46",
    numero: 46,
    date: "2026-02-02T18:00:00.000Z",
    categorie: "FFF",
    groupe: "Groupe A",
    statut: "Terminée",
    brouillon: false,
    duree: "32",
    installation: "Stade de France",
    special: "Évaluation",
    effectif: 0,
    rpeCible: 0,
    materiel: [{ quantite: 16, nom: "Coupelles" }],
    procedeIds: [],
    securiteVerifiee: false,
    hydratationVerifiee: false,
    evaluationFaite: true,
    performanceFaite: false,
  },
  {
    id: "seance-47",
    numero: 47,
    date: "2026-02-04T18:00:00.000Z",
    categorie: "FFF",
    groupe: "Groupe A",
    statut: "Terminée",
    brouillon: false,
    duree: "45",
    installation: "Stade de France",
    special: "Évaluation",
    effectif: 0,
    rpeCible: 0,
    materiel: [
      { quantite: 4, nom: "Coupelles" },
      { quantite: 2, nom: "Coupelles" },
      { quantite: 10, nom: "Ballons" },
      { quantite: 2, nom: "Buts" },
    ],
    procedeIds: [],
    securiteVerifiee: false,
    hydratationVerifiee: false,
    evaluationFaite: true,
    performanceFaite: true,
  },
  {
    id: "seance-48",
    numero: 48,
    date: "2026-02-20T18:00:00.000Z",
    categorie: "FFF",
    groupe: "Groupe A",
    statut: "Terminée",
    brouillon: false,
    duree: "120",
    installation: "Stade de France",
    special: "Évaluation",
    effectif: 0,
    rpeCible: 0,
    materiel: [],
    procedeIds: [],
    securiteVerifiee: false,
    hydratationVerifiee: false,
    evaluationFaite: false,
    performanceFaite: false,
  },
  {
    id: "seance-7",
    numero: 7,
    date: "2026-02-25T12:25:07.459Z",
    categorie: "FFF",
    groupe: "Groupe A",
    statut: "En cours",
    brouillon: false,
    duree: "12",
    installation: "Stade de France",
    principeId: "creer-et-utiliser-des-espaces",
    effectif: 0,
    rpeCible: 0,
    materiel: [],
    procedeIds: [
      "proc-sortie-de-balle-23fd",
      "proc-jeu-de-position-3-3-vs-3-e13b",
      "proc-occupation-des-couloirs-de-jeu-92c1",
    ],
    securiteVerifiee: false,
    hydratationVerifiee: false,
    evaluationFaite: false,
    performanceFaite: false,
  },
  {
    id: "seance-1",
    numero: 1,
    date: "2026-02-25T12:30:27.427Z",
    categorie: "FFF",
    groupe: "Groupe A",
    statut: "Terminée",
    brouillon: false,
    duree: "32",
    installation: "Stade de France",
    special: "Évaluation",
    effectif: 0,
    rpeCible: 0,
    materiel: [{ quantite: 16, nom: "Coupelles" }],
    procedeIds: [],
    securiteVerifiee: false,
    hydratationVerifiee: false,
    evaluationFaite: true,
    performanceFaite: false,
  },
  {
    id: "seance-2",
    numero: 2,
    date: "2026-02-25T14:22:27.081Z",
    categorie: "FFF",
    groupe: "Groupe A",
    statut: "Terminée",
    brouillon: false,
    duree: "45",
    installation: "Stade de France",
    special: "Évaluation",
    effectif: 0,
    rpeCible: 0,
    materiel: [
      { quantite: 4, nom: "Coupelles" },
      { quantite: 2, nom: "Coupelles" },
      { quantite: 10, nom: "Ballons" },
      { quantite: 2, nom: "Buts" },
    ],
    procedeIds: [],
    securiteVerifiee: false,
    hydratationVerifiee: false,
    evaluationFaite: true,
    performanceFaite: true,
  },
  {
    id: "seance-54",
    numero: 54,
    date: "2026-02-26T18:00:00.000Z",
    categorie: "FFF",
    groupe: "Groupe A",
    statut: "Terminée",
    brouillon: false,
    duree: "60",
    installation: "Stade de France",
    principeId: "jouer-combine-pour-creer-un-surnombre",
    effectif: 2,
    rpeCible: 0,
    materiel: [],
    procedeIds: [
      "proc-3vs3-2-buts-a-attaquer-et-2-buts-a-defendr-336d",
      "proc-4vs4-2-buts-a-attaquer-et-2-buts-a-defendr-2d48",
    ],
    securiteVerifiee: false,
    hydratationVerifiee: false,
    evaluationFaite: true,
    performanceFaite: false,
  },
  {
    id: "seance-64",
    numero: 64,
    date: "2026-04-13T17:00:00.000Z",
    categorie: "FFF",
    groupe: "Groupe A",
    statut: "À venir",
    brouillon: false,
    duree: "58",
    installation: "Stade de France",
    principeId: "creer-et-utiliser-des-espaces",
    effectif: 0,
    rpeCible: 0,
    materiel: [
      { quantite: 12, nom: "Coupelles" },
      { quantite: 10, nom: "Ballons" },
      { quantite: 3, nom: "Buts" },
    ],
    procedeIds: [
      "proc-sortie-de-balle-23fd",
      "proc-jeu-de-position-3-3-vs-3-e13b",
    ],
    securiteVerifiee: false,
    hydratationVerifiee: false,
    evaluationFaite: false,
    performanceFaite: false,
  },
  {
    id: "seance-65",
    numero: 65,
    date: "2026-04-15T17:00:00.000Z",
    categorie: "FFF",
    groupe: "Groupe A",
    statut: "En cours",
    brouillon: false,
    duree: "63",
    installation: "Stade de France",
    principeId: "creer-et-utiliser-des-espaces",
    effectif: 0,
    rpeCible: 0,
    materiel: [
      { quantite: 8, nom: "Coupelles" },
      { quantite: 10, nom: "Ballons" },
      { quantite: 16, nom: "Coupelles" },
      { quantite: 4, nom: "Buts" },
    ],
    procedeIds: [
      "proc-jeu-de-position-3-3-vs-3-e13b",
      "proc-occupation-des-couloirs-de-jeu-92c1",
      "proc-enchainement-de-passes-double-mw-572d",
      "proc-sortie-de-balle-23fd",
    ],
    securiteVerifiee: false,
    hydratationVerifiee: false,
    evaluationFaite: false,
    performanceFaite: false,
  },
  {
    id: "seance-66",
    numero: 66,
    date: "2026-04-17T17:00:00.000Z",
    categorie: "FFF",
    groupe: "Groupe A",
    statut: "En cours",
    brouillon: false,
    duree: "61",
    installation: "Stade de France",
    principeId: "creer-et-utiliser-des-espaces",
    effectif: 0,
    rpeCible: 0,
    materiel: [
      { quantite: 12, nom: "Coupelles" },
      { quantite: 10, nom: "Ballons" },
      { quantite: 3, nom: "Buts" },
    ],
    procedeIds: [
      "proc-enchainement-de-passes-double-mw-572d",
      "proc-sortie-de-balle-23fd",
    ],
    securiteVerifiee: false,
    hydratationVerifiee: false,
    evaluationFaite: false,
    performanceFaite: false,
  },
  {
    id: "seance-87",
    numero: 87,
    date: "2026-06-19T17:00:00.000Z",
    categorie: "FFF",
    groupe: "Groupe A",
    statut: "Terminée",
    brouillon: false,
    duree: "120",
    installation: "Stade de France",
    special: "Évaluation",
    effectif: 0,
    rpeCible: 0,
    materiel: [],
    procedeIds: [],
    securiteVerifiee: false,
    hydratationVerifiee: false,
    evaluationFaite: false,
    performanceFaite: false,
  },
  {
    id: "seance-101",
    numero: 101,
    date: "2026-06-23T17:04:21.710Z",
    categorie: "FFF",
    groupe: "Groupe A",
    statut: "En cours",
    brouillon: false,
    duree: "52",
    installation: "Stade de France",
    principeId: "creer-et-utiliser-des-espaces",
    effectif: 0,
    rpeCible: 0,
    materiel: [
      { quantite: 12, nom: "Coupelles" },
      { quantite: 10, nom: "Ballons" },
      { quantite: 3, nom: "Buts" },
    ],
    procedeIds: [
      "proc-enchainement-de-passes-double-mw-572d",
      "proc-sortie-de-balle-23fd",
    ],
    securiteVerifiee: false,
    hydratationVerifiee: false,
    evaluationFaite: false,
    performanceFaite: false,
  },
  {
    id: "seance-85",
    numero: 85,
    date: "2026-06-26T17:00:00.000Z",
    categorie: "FFF",
    groupe: "Groupe A",
    statut: "Terminée",
    brouillon: false,
    duree: "32",
    installation: "Stade de France",
    special: "Évaluation",
    effectif: 0,
    rpeCible: 0,
    materiel: [{ quantite: 16, nom: "Coupelles" }],
    procedeIds: [],
    securiteVerifiee: false,
    hydratationVerifiee: false,
    evaluationFaite: true,
    performanceFaite: true,
  },
  {
    id: "seance-86",
    numero: 86,
    date: "2026-06-29T17:00:00.000Z",
    categorie: "FFF",
    groupe: "Groupe A",
    statut: "À venir",
    brouillon: false,
    duree: "45",
    installation: "Stade de France",
    special: "Évaluation",
    effectif: 0,
    rpeCible: 0,
    materiel: [
      { quantite: 4, nom: "Coupelles" },
      { quantite: 2, nom: "Coupelles" },
      { quantite: 10, nom: "Ballons" },
      { quantite: 2, nom: "Buts" },
    ],
    procedeIds: [],
    securiteVerifiee: false,
    hydratationVerifiee: false,
    evaluationFaite: false,
    performanceFaite: false,
  },
  {
    id: "seance-102",
    numero: 102,
    date: "2026-07-01T15:32:43.608Z",
    categorie: "FFF",
    groupe: "Groupe A",
    statut: "En cours",
    brouillon: false,
    duree: "63",
    installation: "Stade de France",
    principeId: "creer-et-utiliser-des-espaces",
    effectif: 0,
    rpeCible: 0,
    materiel: [
      { quantite: 12, nom: "Coupelles" },
      { quantite: 10, nom: "Ballons" },
      { quantite: 2, nom: "Buts" },
    ],
    procedeIds: [
      "proc-occupation-des-couloirs-de-jeu-92c1",
      "proc-enchainement-de-passes-double-mw-572d",
    ],
    securiteVerifiee: false,
    hydratationVerifiee: false,
    evaluationFaite: false,
    performanceFaite: false,
  },
  {
    id: "seance-92",
    numero: 92,
    date: "2026-07-01T17:00:00.000Z",
    categorie: "FFF",
    groupe: "Groupe A",
    statut: "En cours",
    brouillon: false,
    duree: "63",
    installation: "Stade de France",
    principeId: "creer-et-utiliser-des-espaces",
    effectif: 0,
    rpeCible: 0,
    materiel: [
      { quantite: 12, nom: "Coupelles" },
      { quantite: 10, nom: "Ballons" },
      { quantite: 2, nom: "Buts" },
    ],
    procedeIds: [
      "proc-enchainement-de-passes-double-mw-572d",
      "proc-sortie-de-balle-23fd",
      "proc-jeu-de-position-3-3-vs-3-e13b",
    ],
    securiteVerifiee: false,
    hydratationVerifiee: false,
    evaluationFaite: false,
    performanceFaite: false,
  },
  {
    id: "seance-103",
    numero: 103,
    date: "2026-07-02T09:19:48.571Z",
    categorie: "FFF",
    groupe: "Groupe A",
    statut: "En cours",
    brouillon: false,
    duree: "64",
    installation: "Stade de France",
    principeId: "creer-et-utiliser-des-espaces",
    effectif: 0,
    rpeCible: 0,
    materiel: [
      { quantite: 3, nom: "Buts" },
      { quantite: 10, nom: "Ballons" },
      { quantite: 12, nom: "Coupelles" },
    ],
    procedeIds: [
      "proc-jeu-de-position-3-3-vs-3-e13b",
      "proc-occupation-des-couloirs-de-jeu-92c1",
    ],
    securiteVerifiee: false,
    hydratationVerifiee: false,
    evaluationFaite: false,
    performanceFaite: false,
  },
  {
    id: "seance-94",
    numero: 94,
    date: "2026-07-06T17:00:00.000Z",
    categorie: "FFF",
    groupe: "Groupe A",
    statut: "En cours",
    brouillon: false,
    duree: "63",
    installation: "Stade de France",
    principeId: "creer-et-utiliser-des-espaces",
    effectif: 0,
    rpeCible: 0,
    materiel: [
      { quantite: 12, nom: "Coupelles" },
      { quantite: 10, nom: "Ballons" },
      { quantite: 2, nom: "Buts" },
    ],
    procedeIds: [
      "proc-occupation-des-couloirs-de-jeu-92c1",
      "proc-enchainement-de-passes-double-mw-572d",
      "proc-sortie-de-balle-23fd",
    ],
    securiteVerifiee: false,
    hydratationVerifiee: false,
    evaluationFaite: false,
    performanceFaite: false,
  },
  {
    id: "seance-95",
    numero: 95,
    date: "2026-07-08T17:00:00.000Z",
    categorie: "FFF",
    groupe: "Groupe A",
    statut: "En cours",
    brouillon: false,
    duree: "43",
    installation: "Stade de France",
    principeId: "creer-et-utiliser-des-espaces",
    effectif: 0,
    rpeCible: 0,
    materiel: [
      { quantite: 12, nom: "Coupelles" },
      { quantite: 10, nom: "Ballons" },
      { quantite: 3, nom: "Buts" },
    ],
    procedeIds: [
      "proc-enchainement-de-passes-double-mw-572d",
      "proc-sortie-de-balle-23fd",
      "proc-jeu-de-position-3-3-vs-3-e13b",
      "proc-occupation-des-couloirs-de-jeu-92c1",
    ],
    securiteVerifiee: false,
    hydratationVerifiee: false,
    evaluationFaite: false,
    performanceFaite: false,
  },
  {
    id: "seance-96",
    numero: 96,
    date: "2026-07-10T17:00:00.000Z",
    categorie: "FFF",
    groupe: "Groupe A",
    statut: "À venir",
    brouillon: false,
    duree: "72",
    installation: "Stade de France",
    principeId: "creer-et-utiliser-des-espaces",
    effectif: 0,
    rpeCible: 0,
    materiel: [
      { quantite: 12, nom: "Coupelles" },
      { quantite: 10, nom: "Ballons" },
      { quantite: 2, nom: "Buts" },
    ],
    procedeIds: [
      "proc-occupation-des-couloirs-de-jeu-92c1",
      "proc-enchainement-de-passes-double-mw-572d",
    ],
    securiteVerifiee: false,
    hydratationVerifiee: false,
    evaluationFaite: false,
    performanceFaite: false,
  },
]
