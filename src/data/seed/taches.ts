/**
 * Structuration ▸ Gestion des tâches — data slice.
 *
 * One model, three views. A **projet** (Saison 2026-2027, Tournoi U17…) holds
 * **sous-projets** (Effectifs & licences, Logistique & accueil…), and every
 * **tâche** points at the sous-projet it belongs to. Tâches are kept in one flat
 * list so the kanban, the hierarchy and the project cards are all just filters
 * over the same rows — nothing is duplicated per view.
 *
 * Assignees are the organigramme's membres pool: the same people the club
 * placed on its structure are the ones who carry the work.
 *
 * Seed rows keep readable slug ids; rows added at runtime get crypto UUIDs.
 */

/* ── Vocabulary ─────────────────────────────────────────────────────────── */

/** The kanban columns, in board order. */
export const TACHE_STATUTS = [
  "À faire",
  "En cours",
  "En pause",
  "En revue",
  "Terminée",
] as const
export type TacheStatut = (typeof TACHE_STATUTS)[number]

export const TACHE_PRIORITES = ["Urgente", "Haute", "Moyenne", "Basse"] as const
export type TachePriorite = (typeof TACHE_PRIORITES)[number]

export const PROJET_STATUTS = ["Planification", "En cours", "Terminé"] as const
export type ProjetStatut = (typeof PROJET_STATUTS)[number]

/* ── Shapes ─────────────────────────────────────────────────────────────── */

export type SousTache = {
  id: string
  nom: string
  faite: boolean
  /** Null = pas encore attribuée. */
  assigneId: string | null
}

export type Tache = {
  id: string
  sousProjetId: string
  nom: string
  description: string
  statut: TacheStatut
  priorite: TachePriorite
  assigneId: string | null
  /** Display-ready due date; `enRetard` flags the ones that slipped. */
  echeance: string
  enRetard?: boolean
  sousTaches: SousTache[]
  piecesJointes: number
  commentaires: number
}

export type SousProjet = {
  id: string
  projetId: string
  nom: string
  /** The unité (organigramme) that owns this stream of work. */
  pole: string
}

export type Projet = {
  id: string
  nom: string
  description: string
  statut: ProjetStatut
  priorite: TachePriorite
  /** Pôles involved — shown as chips on the project card. */
  poles: string[]
  echeance: string
}

/* ── Seed ───────────────────────────────────────────────────────────────── */

export const projetsSeed: Projet[] = [
  {
    id: "p-saison-2627",
    nom: "Lancement saison 2026-2027",
    description:
      "Tout ce qui doit être bouclé avant la première journée de championnat.",
    statut: "En cours",
    priorite: "Haute",
    poles: ["Direction sportive", "Pôle technique", "Cellule médicale"],
    echeance: "12 sept. 2026",
  },
  {
    id: "p-tournoi-u17",
    nom: "Tournoi international U17",
    description:
      "Organisation du tournoi de fin d'année : 12 clubs, 3 jours, 2 terrains.",
    statut: "En cours",
    priorite: "Urgente",
    poles: ["Pôle technique", "Logistique & intendance", "Communication"],
    echeance: "20 déc. 2026",
  },
  {
    id: "p-centre-formation",
    nom: "Rénovation du centre de formation",
    description:
      "Vestiaires, salle de musculation et équipements du centre de formation.",
    statut: "Planification",
    priorite: "Moyenne",
    poles: ["Administration & finances", "Logistique & intendance"],
    echeance: "30 juin 2027",
  },
]

export const sousProjetsSeed: SousProjet[] = [
  {
    id: "sp-effectifs",
    projetId: "p-saison-2627",
    nom: "Effectifs & licences",
    pole: "Direction sportive",
  },
  {
    id: "sp-preparation",
    projetId: "p-saison-2627",
    nom: "Préparation physique",
    pole: "Pôle technique",
  },
  {
    id: "sp-medical",
    projetId: "p-saison-2627",
    nom: "Suivi médical",
    pole: "Cellule médicale",
  },
  {
    id: "sp-sportif-u17",
    projetId: "p-tournoi-u17",
    nom: "Organisation sportive",
    pole: "Pôle technique",
  },
  {
    id: "sp-logistique-u17",
    projetId: "p-tournoi-u17",
    nom: "Logistique & accueil",
    pole: "Logistique & intendance",
  },
  {
    id: "sp-communication-u17",
    projetId: "p-tournoi-u17",
    nom: "Communication & sponsors",
    pole: "Communication & sponsoring",
  },
  {
    id: "sp-vestiaires",
    projetId: "p-centre-formation",
    nom: "Travaux vestiaires",
    pole: "Logistique & intendance",
  },
  {
    id: "sp-equipements",
    projetId: "p-centre-formation",
    nom: "Équipements",
    pole: "Administration & finances",
  },
]

const st = (
  id: string,
  nom: string,
  faite: boolean,
  assigneId: string | null = null,
): SousTache => ({ id, nom, faite, assigneId })

/**
 * A deliberately uneven board: every column is populated, a few tâches carry no
 * assignee (the "Non attribuées" filter has something to show), one is overdue,
 * one has a very long name, and "Équipements" is an empty sous-projet.
 */
export const tachesSeed: Tache[] = [
  /* ── Lancement saison — Effectifs & licences ───────────────────────── */
  {
    id: "t-licences",
    sousProjetId: "sp-effectifs",
    nom: "Clôturer les licences 2026-2027",
    description:
      "Rassembler les dossiers, relancer les retardataires et déposer le tout à la ligue.",
    statut: "En cours",
    priorite: "Urgente",
    assigneId: "m-karim-mestiri",
    echeance: "28 juil. 2026",
    enRetard: true,
    piecesJointes: 9,
    commentaires: 14,
    sousTaches: [
      st("st-lic-1", "Collecter les certificats médicaux", true, "m-ines-hamdi"),
      st("st-lic-2", "Vérifier les photos d'identité", true, "m-karim-mestiri"),
      st("st-lic-3", "Relancer les 8 dossiers incomplets", false, "m-karim-mestiri"),
      st("st-lic-4", "Déposer le dossier à la ligue", false, null),
    ],
  },
  {
    id: "t-effectifs-categories",
    sousProjetId: "sp-effectifs",
    nom: "Valider les effectifs par catégorie",
    description: "Arrêter la liste définitive de chaque catégorie avec les éducateurs.",
    statut: "En revue",
    priorite: "Haute",
    assigneId: "m-amine-jelassi",
    echeance: "22 août 2026",
    piecesJointes: 3,
    commentaires: 7,
    sousTaches: [
      st("st-eff-1", "Réunion avec les éducateurs", true, "m-amine-jelassi"),
      st("st-eff-2", "Arbitrer les cas limites", true, "m-amine-jelassi"),
      st("st-eff-3", "Diffuser les listes", false, "m-rim-bouazizi"),
    ],
  },
  {
    id: "t-recrutement",
    sousProjetId: "sp-effectifs",
    nom: "Finaliser le recrutement seniors",
    description: "Deux postes restent à pourvoir : un latéral gauche et un gardien.",
    statut: "À faire",
    priorite: "Moyenne",
    assigneId: null,
    echeance: "05 sept. 2026",
    piecesJointes: 2,
    commentaires: 3,
    sousTaches: [
      st("st-rec-1", "Établir la short-list", false, "m-sofiane-mejri"),
      st("st-rec-2", "Organiser les essais", false, null),
    ],
  },

  /* ── Lancement saison — Préparation physique ───────────────────────── */
  {
    id: "t-cycle-preparation",
    sousProjetId: "sp-preparation",
    nom: "Bâtir le cycle de préparation",
    description: "Six semaines de reprise, du test initial au premier match amical.",
    statut: "En cours",
    priorite: "Haute",
    assigneId: "m-yassine-gharbi",
    echeance: "14 août 2026",
    piecesJointes: 5,
    commentaires: 11,
    sousTaches: [
      st("st-cyc-1", "Tests physiques d'entrée", true, "m-slim-jaziri"),
      st("st-cyc-2", "Planifier les séances double", true, "m-yassine-gharbi"),
      st("st-cyc-3", "Caler les matchs amicaux", false, "m-oussama-trabelsi"),
      st("st-cyc-4", "Points d'étape hebdomadaires", false, "m-slim-jaziri"),
    ],
  },
  {
    id: "t-stage",
    sousProjetId: "sp-preparation",
    nom: "Organiser le stage de présaison",
    description: "Cinq jours à Aïn Draham : hébergement, terrains et transport.",
    statut: "En pause",
    priorite: "Moyenne",
    assigneId: "m-hamza-dridi",
    echeance: "12 août 2026",
    piecesJointes: 4,
    commentaires: 6,
    sousTaches: [
      st("st-stg-1", "Réserver l'hébergement", true, "m-hamza-dridi"),
      st("st-stg-2", "Confirmer le budget", false, "m-nadia-cherif"),
      st("st-stg-3", "Louer le bus", false, null),
    ],
  },
  {
    id: "t-materiel-reprise",
    sousProjetId: "sp-preparation",
    nom: "Commander le matériel de reprise",
    description: "Ballons, chasubles, cônes et matériel de proprioception.",
    statut: "Terminée",
    priorite: "Basse",
    assigneId: "m-hamza-dridi",
    echeance: "18 juil. 2026",
    piecesJointes: 2,
    commentaires: 2,
    sousTaches: [
      st("st-mat-1", "Comparer trois fournisseurs", true, "m-hamza-dridi"),
      st("st-mat-2", "Passer la commande", true, "m-hamza-dridi"),
    ],
  },

  /* ── Lancement saison — Suivi médical ──────────────────────────────── */
  {
    id: "t-visites-medicales",
    sousProjetId: "sp-medical",
    nom: "Programmer les visites médicales",
    description: "Toutes catégories confondues, avant la reprise collective.",
    statut: "Terminée",
    priorite: "Haute",
    assigneId: "m-tarek-loukil",
    echeance: "24 juil. 2026",
    piecesJointes: 6,
    commentaires: 4,
    sousTaches: [
      st("st-vis-1", "Bloquer les créneaux au cabinet", true, "m-tarek-loukil"),
      st("st-vis-2", "Convoquer les joueurs", true, "m-ines-hamdi"),
      st("st-vis-3", "Archiver les certificats", true, "m-ines-hamdi"),
    ],
  },
  {
    id: "t-protocole-blessures",
    sousProjetId: "sp-medical",
    nom: "Écrire le protocole de retour de blessure",
    description:
      "Étapes, critères de reprise et validation partagée entre médical et technique.",
    statut: "En revue",
    priorite: "Moyenne",
    assigneId: "m-ines-hamdi",
    echeance: "30 août 2026",
    piecesJointes: 1,
    commentaires: 9,
    sousTaches: [
      st("st-pro-1", "Rédiger la première version", true, "m-ines-hamdi"),
      st("st-pro-2", "Relecture du pôle technique", false, "m-mohamed-benslimane"),
    ],
  },

  /* ── Tournoi U17 — Organisation sportive ───────────────────────────── */
  {
    id: "t-format-tournoi",
    sousProjetId: "sp-sportif-u17",
    nom: "Arrêter le format du tournoi",
    description: "12 équipes, 4 poules de 3, puis quarts de finale.",
    statut: "Terminée",
    priorite: "Haute",
    assigneId: "m-mohamed-benslimane",
    echeance: "15 juil. 2026",
    piecesJointes: 3,
    commentaires: 5,
    sousTaches: [
      st("st-for-1", "Valider le nombre d'équipes", true, "m-mohamed-benslimane"),
      st("st-for-2", "Écrire le règlement", true, "m-mohamed-benslimane"),
    ],
  },
  {
    id: "t-invitations",
    sousProjetId: "sp-sportif-u17",
    nom: "Inviter les clubs participants",
    description: "Huit clubs tunisiens et quatre clubs étrangers.",
    statut: "En cours",
    priorite: "Urgente",
    assigneId: "m-rim-bouazizi",
    echeance: "10 sept. 2026",
    piecesJointes: 7,
    commentaires: 16,
    sousTaches: [
      st("st-inv-1", "Envoyer les invitations", true, "m-rim-bouazizi"),
      st("st-inv-2", "Suivre les confirmations", false, "m-rim-bouazizi"),
      st("st-inv-3", "Prévoir deux clubs suppléants", false, null),
    ],
  },
  {
    id: "t-arbitrage",
    sousProjetId: "sp-sportif-u17",
    nom: "Constituer le corps arbitral",
    description: "Douze arbitres et quatre délégués sur les trois jours.",
    statut: "À faire",
    priorite: "Moyenne",
    assigneId: null,
    echeance: "15 nov. 2026",
    piecesJointes: 0,
    commentaires: 1,
    sousTaches: [
      st("st-arb-1", "Demander la désignation à la ligue", false, null),
      st("st-arb-2", "Prévoir les indemnités", false, null),
    ],
  },

  /* ── Tournoi U17 — Logistique & accueil ────────────────────────────── */
  {
    id: "t-hebergement-u17",
    sousProjetId: "sp-logistique-u17",
    nom: "Réserver l'hébergement des délégations",
    description: "Environ 220 personnes sur trois nuits, en demi-pension.",
    statut: "En cours",
    priorite: "Haute",
    assigneId: "m-hamza-dridi",
    echeance: "01 oct. 2026",
    piecesJointes: 5,
    commentaires: 8,
    sousTaches: [
      st("st-heb-1", "Consulter quatre hôtels", true, "m-hamza-dridi"),
      st("st-heb-2", "Négocier le tarif groupe", false, "m-nadia-cherif"),
      st("st-heb-3", "Signer la convention", false, null),
    ],
  },
  {
    id: "t-restauration",
    sousProjetId: "sp-logistique-u17",
    nom: "Organiser la restauration sur site",
    description: "Repas d'après-match et buvette pour le public.",
    statut: "À faire",
    priorite: "Basse",
    assigneId: null,
    echeance: "20 nov. 2026",
    piecesJointes: 0,
    commentaires: 0,
    sousTaches: [
      st("st-res-1", "Choisir un traiteur", false, null),
      st("st-res-2", "Estimer les volumes", false, null),
    ],
  },
  {
    id: "t-securite",
    sousProjetId: "sp-logistique-u17",
    nom: "Déposer le dossier de sécurité auprès des autorités",
    description:
      "Plan d'évacuation, effectifs de sécurité, poste de secours et autorisation municipale.",
    statut: "En pause",
    priorite: "Haute",
    assigneId: "m-karim-mestiri",
    echeance: "05 nov. 2026",
    piecesJointes: 4,
    commentaires: 6,
    sousTaches: [
      st("st-sec-1", "Rédiger le plan d'évacuation", true, "m-karim-mestiri"),
      st("st-sec-2", "Réserver le poste de secours", false, "m-tarek-loukil"),
      st("st-sec-3", "Obtenir l'autorisation municipale", false, null),
    ],
  },

  /* ── Tournoi U17 — Communication & sponsors ────────────────────────── */
  {
    id: "t-identite-tournoi",
    sousProjetId: "sp-communication-u17",
    nom: "Créer l'identité visuelle du tournoi",
    description: "Logo, affiche, habillage réseaux et signalétique terrain.",
    statut: "En revue",
    priorite: "Moyenne",
    assigneId: "m-ahmed-khelifi",
    echeance: "25 sept. 2026",
    piecesJointes: 12,
    commentaires: 21,
    sousTaches: [
      st("st-ide-1", "Trois pistes graphiques", true, "m-ahmed-khelifi"),
      st("st-ide-2", "Choix du bureau", true, "m-hichem-ferchichi"),
      st("st-ide-3", "Décliner sur les supports", false, "m-mariem-saidi"),
    ],
  },
  {
    id: "t-sponsors-tournoi",
    sousProjetId: "sp-communication-u17",
    nom: "Boucler les sponsors du tournoi",
    description: "Trois partenaires principaux et six partenaires terrain.",
    statut: "En cours",
    priorite: "Urgente",
    assigneId: "m-nizar-abbes",
    echeance: "15 oct. 2026",
    piecesJointes: 8,
    commentaires: 19,
    sousTaches: [
      st("st-spo-1", "Monter le dossier de partenariat", true, "m-nizar-abbes"),
      st("st-spo-2", "Rendez-vous avec les prospects", false, "m-nizar-abbes"),
      st("st-spo-3", "Signer les contrats", false, null),
    ],
  },
  {
    id: "t-couverture-live",
    sousProjetId: "sp-communication-u17",
    nom: "Assurer la couverture en direct",
    description: "Streaming des demi-finales et de la finale, plus stories quotidiennes.",
    statut: "À faire",
    priorite: "Basse",
    assigneId: "m-mariem-saidi",
    echeance: "10 déc. 2026",
    piecesJointes: 1,
    commentaires: 2,
    sousTaches: [
      st("st-cou-1", "Devis prestataire vidéo", false, "m-mariem-saidi"),
      st("st-cou-2", "Planning des stories", false, "m-mariem-saidi"),
    ],
  },

  /* ── Centre de formation — Travaux vestiaires ──────────────────────── */
  {
    id: "t-devis-vestiaires",
    sousProjetId: "sp-vestiaires",
    nom: "Réunir trois devis pour les vestiaires",
    description: "Plomberie, carrelage et casiers pour deux vestiaires.",
    statut: "En cours",
    priorite: "Moyenne",
    assigneId: "m-nadia-cherif",
    echeance: "30 sept. 2026",
    piecesJointes: 3,
    commentaires: 4,
    sousTaches: [
      st("st-dev-1", "Rédiger le cahier des charges", true, "m-nadia-cherif"),
      st("st-dev-2", "Consulter les entreprises", false, "m-nadia-cherif"),
      st("st-dev-3", "Comparer les offres", false, "m-walid-nasri"),
    ],
  },
  {
    id: "t-financement-travaux",
    sousProjetId: "sp-vestiaires",
    nom: "Monter le dossier de subvention",
    description: "Demande auprès de la fédération et de la municipalité.",
    statut: "À faire",
    priorite: "Haute",
    assigneId: "m-walid-nasri",
    echeance: "31 oct. 2026",
    piecesJointes: 2,
    commentaires: 5,
    sousTaches: [
      st("st-fin-1", "Réunir les pièces justificatives", false, "m-walid-nasri"),
      st("st-fin-2", "Déposer la demande", false, null),
    ],
  },
]
