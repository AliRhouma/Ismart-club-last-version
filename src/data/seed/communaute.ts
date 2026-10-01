/**
 * Communauté — the network of clubs that share their technical work.
 *
 * The club is linked to **partenaires** (other clubs, after a demande one side
 * sends and the other accepts). Each club shares **ressources** (procédés,
 * projets de jeu, programmes annuels, modèles d'évaluation…) with its
 * partenaires; a partenaire can preview one and **import** it into its own
 * library. What is shared, and with whom, is set per resource type in the
 * paramètres de partage.
 *
 * Counts (partenaires, fichiers partagés / importés, distributions) are derived
 * in render — only the raw links and the per-resource vues/imports are stored.
 */

export const MOI = "moi"

/** Our club, as the network sees it. */
export const monClub = {
  nom: "iSmart Club",
  ville: "Tunis",
  identifiant: "91ff00f1",
}

export const RESSOURCE_TYPES = [
  "Procédé",
  "Projet de jeu",
  "Programme annuel",
  "Modèle d'évaluation",
  "Séance",
  "Questionnaire",
  "Défi",
  "Organigramme",
] as const

export type RessourceType = (typeof RESSOURCE_TYPES)[number]

/** Plural labels for filters and distributions. */
export const TYPE_PLURIEL: Record<RessourceType, string> = {
  Procédé: "Procédés",
  "Projet de jeu": "Projets de jeu",
  "Programme annuel": "Programmes annuels",
  "Modèle d'évaluation": "Modèles d'évaluation",
  Séance: "Séances",
  Questionnaire: "Questionnaires",
  Défi: "Défis",
  Organigramme: "Organigrammes",
}

export type ClubCommunaute = {
  id: string
  nom: string
  ville: string
  /** 8-char code a club gives out so others can find it. */
  identifiant: string
}

export type Partenariat = {
  clubId: string
  /** "AAAA-MM-JJ". */
  depuis: string
}

export type DemandePartenaire = {
  id: string
  clubId: string
  /** Reçue = they asked us; envoyée = we asked them. */
  sens: "recue" | "envoyee"
  le: string
}

export type Ressource = {
  id: string
  /** Owner — `MOI` for our own shared resources. */
  clubId: string
  type: RessourceType
  titre: string
  /** Catégories it's written for ("U9", "FFF"…). */
  categories: string[]
  le: string
  vues: number
  /** How many partenaires imported it. */
  imports: number
  /** Average rating from partenaires (1–5), null when nobody rated it. */
  note: number | null
  /** Ours only — who can see it. */
  visibilite?: "Tous les partenaires" | "Partenaires choisis"
}

export type Importation = { ressourceId: string; le: string }

export type PorteePartage = "prive" | "partenaires" | "personnalise"

export type ParametresPartage = {
  /** Publique = other clubs can find us by name; privée = only by identifiant. */
  visibiliteEquipe: "publique" | "privee"
  parType: Record<RessourceType, { portee: PorteePartage; clubIds: string[] }>
  /** What a shared programme annuel carries with it. */
  programmeInclut: {
    criteres: boolean
    etapesProjet: boolean
    seances: boolean
  }
}

/* ── Clubs of the network ───────────────────────────────────────────────── */

export const clubsSeed: ClubCommunaute[] = [
  { id: "club-usda", nom: "USDA", ville: "Saint-Denis", identifiant: "a4c21e07" },
  { id: "club-vincennois", nom: "Vincennois C.O", ville: "Vincennes", identifiant: "7be0d3f2" },
  { id: "club-montreuil", nom: "Montreuil FC", ville: "Montreuil", identifiant: "0220fabc" },
  { id: "club-asnieres", nom: "Asnières F.C", ville: "Asnières-sur-Seine", identifiant: "c93d11a8" },
  { id: "club-clairefontaine", nom: "INF Clairefontaine", ville: "Clairefontaine", identifiant: "5f7a2b90" },
  { id: "club-fc93", nom: "F.C. 93", ville: "Bobigny", identifiant: "e11b64cd" },
  // Not partenaires (yet) — a pending demande each way, and clubs to find.
  { id: "club-bondy", nom: "AS Bondy", ville: "Bondy", identifiant: "3d8e90aa" },
  { id: "club-redstar", nom: "Red Star FC", ville: "Saint-Ouen", identifiant: "b62f0c14" },
  { id: "club-creteil", nom: "US Créteil-Lusitanos", ville: "Créteil", identifiant: "9ac4e5d1" },
  { id: "club-paris13", nom: "Paris 13 Atletico", ville: "Paris", identifiant: "42f1d8be" },
  { id: "club-racing92", nom: "Racing Club de France Football", ville: "Colombes", identifiant: "d05c7e33" },
]

export const partenariatsSeed: Partenariat[] = [
  { clubId: "club-usda", depuis: "2025-02-13" },
  { clubId: "club-vincennois", depuis: "2025-09-02" },
  { clubId: "club-montreuil", depuis: "2025-10-20" },
  { clubId: "club-asnieres", depuis: "2025-10-16" },
  { clubId: "club-clairefontaine", depuis: "2026-01-08" },
  { clubId: "club-fc93", depuis: "2026-05-04" },
]

export const demandesSeed: DemandePartenaire[] = [
  { id: "dem-bondy", clubId: "club-bondy", sens: "recue", le: "2026-09-18" },
  { id: "dem-redstar", clubId: "club-redstar", sens: "envoyee", le: "2026-09-12" },
]

/* ── Ressources ─────────────────────────────────────────────────────────── */

const r = (
  id: string,
  clubId: string,
  type: RessourceType,
  titre: string,
  le: string,
  vues: number,
  imports: number,
  note: number | null = null,
  categories: string[] = [],
): Ressource => ({
  id,
  clubId,
  type,
  titre,
  categories,
  le,
  vues,
  imports,
  note,
  visibilite: clubId === MOI ? "Tous les partenaires" : undefined,
})

export const ressourcesSeed: Ressource[] = [
  // Ours — what the club shares.
  r("res-banide", MOI, "Procédé", "Jeu Banide - 5vs5 + 4 appuis & 1 joker", "2026-09-01", 4, 0),
  r("res-enchainement", MOI, "Procédé", "Enchaînement : appui, remise, centre et finition", "2025-10-10", 38, 6, 5, ["U15", "U17"]),
  r("res-renversement", MOI, "Procédé", "Jeu à 3 - Renversement - Finition", "2025-07-21", 27, 4, 5, ["U13"]),
  r("res-fixer", MOI, "Procédé", "Fixer et Renverser - 10 vs 10", "2025-10-24", 22, 3, 5, ["Senior"]),
  r("res-position", MOI, "Procédé", "Jeu de position 3+3 vs 3", "2026-03-02", 15, 2, 4, ["U17"]),
  r("res-sortie", MOI, "Procédé", "Sortie de balle à 3 derrière", "2026-04-11", 9, 1, 4, ["FFF"]),
  r("res-jeu-direct", MOI, "Projet de jeu", "Modèle de jeu direct", "2025-06-22", 12, 0, null, ["Senior"]),
  r("res-foot5", MOI, "Projet de jeu", "Projet de jeu - Foot à 5", "2025-06-22", 17, 1, 3, ["U9", "U10"]),
  r("res-eval-scolaire", MOI, "Modèle d'évaluation", "Évaluation scolaire", "2026-08-13", 6, 0, null, ["FFF"]),
  r("res-eval-poids", MOI, "Modèle d'évaluation", "Poids", "2026-06-02", 11, 2, 4, ["U8", "U9", "U10", "U11", "U12", "U13", "U14", "U15", "U16", "U17", "Senior"]),
  r("res-prog-u9", MOI, "Programme annuel", "Programme annuel U9", "2026-05-04", 8, 1, null, ["U9"]),
  r("res-prog-u11", MOI, "Programme annuel", "Programme annuel U11", "2026-05-04", 5, 0, null, ["U11"]),
  r("res-prog-u13", MOI, "Programme annuel", "Programme annuel U13", "2026-05-04", 7, 1, 4, ["U13"]),
  r("res-hooper", MOI, "Questionnaire", "Hooper — bien-être quotidien", "2026-04-13", 3, 0, null, ["FFF"]),

  // USDA — one procédé.
  r("res-usda-jacer", "club-usda", "Procédé", "Exercice Jacer", "2026-02-13", 1, 0),
  // Vincennois & Clairefontaine share nothing yet (empty states).
  // Montreuil — a procédé library.
  r("res-mtr-evasion", "club-montreuil", "Procédé", "Jeu de l'évasion", "2026-05-04", 0, 0, null, ["U11"]),
  r("res-mtr-vague", "club-montreuil", "Procédé", "3vs3 par vague", "2026-05-04", 1, 0, null, ["U11", "U13"]),
  r("res-mtr-match3", "club-montreuil", "Procédé", "Match 3vs3", "2026-05-04", 0, 0),
  r("res-mtr-funino3", "club-montreuil", "Procédé", "3vs3 - 2 buts à attaquer et 2 buts à défendre (Funino)", "2026-05-04", 0, 0, null, ["U9"]),
  r("res-mtr-funino2", "club-montreuil", "Procédé", "2vs2 - 2 buts à attaquer et 2 buts à défendre (Funino)", "2026-05-04", 0, 0, null, ["U8"]),
  r("res-mtr-demi", "club-montreuil", "Procédé", "Finition - Demi-espace", "2026-05-04", 2, 1, 4, ["U15"]),
  r("res-mtr-circuit", "club-montreuil", "Procédé", "Échauffement circuit appuis + prises de balle", "2026-05-04", 0, 0),
  // Asnières — a programme.
  r("res-asn-u9", "club-asnieres", "Programme annuel", "Programme annuel U9", "2025-10-16", 1, 0, null, ["U9"]),
  // F.C. 93 — programmes, a procédé, a modèle d'évaluation, a projet de jeu.
  r("res-fc93-u10", "club-fc93", "Programme annuel", "Programme annuel U10", "2026-05-04", 0, 0, null, ["U10"]),
  r("res-fc93-u12", "club-fc93", "Programme annuel", "Programme annuel U12", "2026-05-04", 0, 0, null, ["U12"]),
  r("res-fc93-u14", "club-fc93", "Programme annuel", "Programme annuel U14", "2026-05-04", 0, 0, null, ["U14"]),
  r("res-fc93-8vs8", "club-fc93", "Procédé", "8vs8 – Buts inversés", "2026-05-04", 3, 1, 5, ["U13"]),
  r("res-fc93-vma", "club-fc93", "Modèle d'évaluation", "Test VMA — 45/15", "2026-06-10", 2, 0, null, ["U15", "U17"]),
  r("res-fc93-pressing", "club-fc93", "Projet de jeu", "Pressing haut 4-3-3", "2026-06-18", 4, 0),
  // A whole organigramme — imported through its own mapping flow.
  r("res-fc93-organigramme", "club-fc93", "Organigramme", "Organigramme du club 2025-2026", "2026-08-20", 6, 1, 5),
]

/** Partner resources we already imported into our library. */
export const importeesSeed: Importation[] = [
  { ressourceId: "res-mtr-demi", le: "2026-05-06" },
  { ressourceId: "res-fc93-8vs8", le: "2026-05-09" },
]

/* ── Paramètres de partage ─────────────────────────────────────────────── */

const p = (portee: PorteePartage, clubIds: string[] = []) => ({ portee, clubIds })

export const parametresPartageSeed: ParametresPartage = {
  visibiliteEquipe: "publique",
  parType: {
    Procédé: p("partenaires"),
    "Projet de jeu": p("partenaires"),
    "Programme annuel": p("personnalise", ["club-montreuil", "club-fc93"]),
    "Modèle d'évaluation": p("partenaires"),
    Séance: p("prive"),
    Questionnaire: p("partenaires"),
    Défi: p("prive"),
    Organigramme: p("prive"),
  },
  programmeInclut: { criteres: true, etapesProjet: true, seances: false },
}

/** What a shared organigramme can carry beyond its structure. */
export const ORG_PARTAGE_RESSOURCES = [
  "Noms des membres",
  "Rôles",
  "Fiches de poste",
  "Chartes & règlement",
  "Tâches",
] as const

/** Our organigramme starts private; if shared, it carries roles and documents. */
export const orgPartageSeed = {
  ressources: ["Rôles", "Fiches de poste", "Chartes & règlement"],
  portee: "prive" as PorteePartage,
  partenaireIds: [] as string[],
}
