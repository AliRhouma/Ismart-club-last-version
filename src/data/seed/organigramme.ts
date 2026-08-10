/**
 * Structuration ▸ Organigramme — data slice.
 *
 * The club's structure is a tree of **unités** (Présidence, Direction sportive,
 * Pôle technique…). Each unité sits at a free x/y on a canvas, points at its
 * parent (that's the hierarchy — the edges are derived, never stored), and holds
 * the **membres** affected to it with the **tâches** each one carries.
 *
 * Beyond the tree, two unités can be tied by a **relation transverse** (a
 * dotted, named link: "Reporting hebdomadaire", "Validation budgétaire"…) that
 * doesn't follow the hierarchy.
 *
 * Seed rows keep readable slug ids; rows added at runtime get crypto UUIDs.
 */

/* ── Tâches ─────────────────────────────────────────────────────────────── */

export const TACHE_STATUTS = ["À faire", "En cours", "Terminée"] as const
export type OrgTacheStatut = (typeof TACHE_STATUTS)[number]

export const TACHE_PRIORITES = ["Haute", "Moyenne", "Basse"] as const
export type OrgTachePriorite = (typeof TACHE_PRIORITES)[number]

export type OrgTache = {
  id: string
  titre: string
  statut: OrgTacheStatut
  priorite: OrgTachePriorite
  /** Display-ready due date. `enRetard` flags the one that slipped. */
  echeance: string
  enRetard?: boolean
}

/* ── Membres (the club-wide pool a unité picks from) ────────────────────── */

export type OrgMembre = {
  id: string
  nom: string
  role: string
}

/**
 * Everyone the club can place on the organigramme. Deliberately varied: a
 * président, salaried staff, coaches, a very long name, and a few people with
 * no tâche at all.
 */
export const membresPool: OrgMembre[] = [
  { id: "m-hichem-ferchichi", nom: "Hichem Ferchichi", role: "Président" },
  { id: "m-sonia-belhadj", nom: "Sonia Belhadj", role: "Vice-présidente" },
  { id: "m-karim-mestiri", nom: "Karim Mestiri", role: "Secrétaire général" },
  { id: "m-amine-jelassi", nom: "Amine Jelassi", role: "Directeur sportif" },
  { id: "m-nadia-cherif", nom: "Nadia Cherif", role: "Directrice administrative" },
  { id: "m-mohamed-benslimane", nom: "Mohamed Amine Ben Slimane", role: "Responsable technique" },
  { id: "m-yassine-gharbi", nom: "Yassine Gharbi", role: "Entraîneur équipe première" },
  { id: "m-oussama-trabelsi", nom: "Oussama Trabelsi", role: "Entraîneur adjoint" },
  { id: "m-rim-bouazizi", nom: "Rim Bouazizi", role: "Coordinatrice jeunes" },
  { id: "m-slim-jaziri", nom: "Slim Jaziri", role: "Préparateur physique" },
  { id: "m-ines-hamdi", nom: "Inès Hamdi", role: "Kinésithérapeute" },
  { id: "m-tarek-loukil", nom: "Tarek Loukil", role: "Médecin du club" },
  { id: "m-fatma-zouari", nom: "Fatma Zouari", role: "Comptable" },
  { id: "m-walid-nasri", nom: "Walid Nasri", role: "Trésorier" },
  { id: "m-ahmed-khelifi", nom: "Ahmed Khelifi", role: "Responsable communication" },
  { id: "m-mariem-saidi", nom: "Mariem Saïdi", role: "Community manager" },
  { id: "m-nizar-abbes", nom: "Nizar Abbès", role: "Responsable sponsoring" },
  { id: "m-hamza-dridi", nom: "Hamza Dridi", role: "Intendant" },
  { id: "m-leila-arfaoui", nom: "Leïla Arfaoui", role: "Responsable scolarité" },
  { id: "m-sofiane-mejri", nom: "Sofiane Mejri", role: "Recruteur" },
]

/* ── Unités ─────────────────────────────────────────────────────────────── */

/** A member placed on a unité, with the tâches they carry there. */
export type OrgAffectation = {
  membreId: string
  taches: OrgTache[]
}

export type OrgUnite = {
  id: string
  nom: string
  /** Parent unité — `null` for a racine. The tree edges are derived from this. */
  parentId: string | null
  membres: OrgAffectation[]
  /** Canvas position (persisted so a drag survives navigation). */
  x: number
  y: number
}

/** A named, non-hierarchical link between two unités. */
export type OrgRelation = {
  id: string
  sourceId: string
  targetId: string
  libelle: string
}

const t = (
  id: string,
  titre: string,
  statut: OrgTacheStatut,
  priorite: OrgTachePriorite,
  echeance: string,
  enRetard?: boolean,
): OrgTache => ({ id, titre, statut, priorite, echeance, enRetard })

/**
 * The club as it stands for the saison 2026-2027: a présidence, three
 * directions, and the pôle technique's two squads. Populated unevenly on
 * purpose — some unités are full and busy, "Logistique & intendance" carries a
 * single member, and "Cellule médicale" has no tâche at all.
 */
export const unitesSeed: OrgUnite[] = [
  {
    id: "u-presidence",
    nom: "Présidence",
    parentId: null,
    x: 520,
    y: 0,
    membres: [
      {
        membreId: "m-hichem-ferchichi",
        taches: [
          t("t-ag-ordinaire", "Préparer l'assemblée générale", "En cours", "Haute", "18 sept. 2026"),
          t("t-partenaires-2027", "Rencontrer les partenaires historiques", "À faire", "Moyenne", "02 oct. 2026"),
        ],
      },
      { membreId: "m-sonia-belhadj", taches: [] },
    ],
  },
  {
    id: "u-bureau",
    nom: "Bureau directeur",
    parentId: "u-presidence",
    x: 520,
    y: 260,
    membres: [
      {
        membreId: "m-karim-mestiri",
        taches: [
          t("t-pv-bureau", "Diffuser le PV du dernier bureau", "Terminée", "Basse", "24 juil. 2026"),
          t("t-licences", "Clôturer les licences 2026-2027", "À faire", "Haute", "28 juil. 2026", true),
        ],
      },
    ],
  },
  {
    id: "u-direction-sportive",
    nom: "Direction sportive",
    parentId: "u-bureau",
    x: 180,
    y: 520,
    membres: [
      {
        membreId: "m-amine-jelassi",
        taches: [
          t("t-effectifs", "Valider les effectifs par catégorie", "En cours", "Haute", "22 août 2026"),
          t("t-stage-preparation", "Caler le stage de présaison", "En cours", "Moyenne", "12 août 2026"),
          t("t-recrutement", "Arbitrer les dossiers de recrutement", "À faire", "Moyenne", "05 sept. 2026"),
        ],
      },
      { membreId: "m-sofiane-mejri", taches: [] },
    ],
  },
  {
    id: "u-administration",
    nom: "Administration & finances",
    parentId: "u-bureau",
    x: 620,
    y: 520,
    membres: [
      {
        membreId: "m-nadia-cherif",
        taches: [
          t("t-budget-previsionnel", "Boucler le budget prévisionnel", "En cours", "Haute", "30 août 2026"),
        ],
      },
      {
        membreId: "m-fatma-zouari",
        taches: [
          t("t-cotisations", "Relancer les cotisations impayées", "À faire", "Moyenne", "31 août 2026"),
          t("t-bilan-trimestre", "Éditer le bilan du trimestre", "Terminée", "Basse", "10 juil. 2026"),
        ],
      },
      { membreId: "m-walid-nasri", taches: [] },
    ],
  },
  {
    id: "u-communication",
    nom: "Communication & sponsoring",
    parentId: "u-bureau",
    x: 1060,
    y: 520,
    membres: [
      {
        membreId: "m-ahmed-khelifi",
        taches: [
          t("t-charte", "Mettre à jour la charte graphique", "Terminée", "Basse", "02 juil. 2026"),
          t("t-dossier-sponsors", "Finaliser le dossier sponsors", "En cours", "Haute", "20 août 2026"),
        ],
      },
      { membreId: "m-mariem-saidi", taches: [] },
      { membreId: "m-nizar-abbes", taches: [] },
    ],
  },
  {
    id: "u-pole-technique",
    nom: "Pôle technique",
    parentId: "u-direction-sportive",
    x: 0,
    y: 800,
    membres: [
      {
        membreId: "m-mohamed-benslimane",
        taches: [
          t("t-programme-annuel", "Écrire le programme annuel", "En cours", "Haute", "25 août 2026"),
          t("t-evaluation-educateurs", "Évaluer les éducateurs", "À faire", "Moyenne", "15 oct. 2026"),
        ],
      },
      { membreId: "m-rim-bouazizi", taches: [] },
    ],
  },
  {
    id: "u-cellule-medicale",
    nom: "Cellule médicale",
    parentId: "u-direction-sportive",
    x: 420,
    y: 800,
    membres: [
      { membreId: "m-tarek-loukil", taches: [] },
      { membreId: "m-ines-hamdi", taches: [] },
    ],
  },
  {
    id: "u-logistique",
    nom: "Logistique & intendance",
    parentId: "u-direction-sportive",
    x: 800,
    y: 1080,
    membres: [
      {
        membreId: "m-hamza-dridi",
        taches: [
          t("t-equipements", "Commander les équipements", "En cours", "Moyenne", "26 août 2026"),
        ],
      },
    ],
  },
  {
    id: "u-equipe-premiere",
    nom: "Équipe première",
    parentId: "u-pole-technique",
    x: -180,
    y: 1080,
    membres: [
      {
        membreId: "m-yassine-gharbi",
        taches: [
          t("t-cycle-preparation", "Bâtir le cycle de préparation", "En cours", "Haute", "14 août 2026"),
        ],
      },
      { membreId: "m-oussama-trabelsi", taches: [] },
      { membreId: "m-slim-jaziri", taches: [] },
    ],
  },
  {
    id: "u-categories-jeunes",
    nom: "Catégories jeunes",
    parentId: "u-pole-technique",
    x: 260,
    y: 1080,
    membres: [
      {
        membreId: "m-leila-arfaoui",
        taches: [
          t("t-suivi-scolaire", "Collecter les bulletins scolaires", "À faire", "Basse", "20 sept. 2026"),
        ],
      },
    ],
  },
]

/** Two transverse links the tree can't express. */
export const relationsSeed: OrgRelation[] = [
  {
    id: "r-suivi-blessures",
    sourceId: "u-pole-technique",
    targetId: "u-cellule-medicale",
    libelle: "Suivi des blessures",
  },
  {
    id: "r-validation-budget",
    sourceId: "u-direction-sportive",
    targetId: "u-administration",
    libelle: "Validation budgétaire",
  },
]
