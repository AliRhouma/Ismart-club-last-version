/**
 * Fiches & Documents — the club's written referential: fiches de poste,
 * chartes, règlements and listes des rôles, each one tied to the members it
 * concerns (the titulaires of a poste, the signataires of a charte, the people
 * a liste des rôles assigns…).
 *
 * Every member here is a person of the **organigramme** (same ids as
 * `seed/organigramme.ts`), so the organigramme can show, for anyone on it,
 * their rôles, their fiche de poste and the chartes they signed.
 *
 * Distinct from `seed/documents.ts`: that one is the free-form document
 * catalogue (rapports, comptes rendus) with an editor behind it.
 *
 * Seed rows keep readable slug ids; rows added at runtime get crypto UUIDs.
 */

import { membresPool, unitesSeed } from "@/data/seed/organigramme"

/** The four document families (empty string = "Sans type"). */
export type FicheType =
  | ""
  | "Fiche de Poste"
  | "Charte"
  | "Règlement"
  | "Liste des Rôles"

export const FICHE_TYPES: { value: FicheType; label: string }[] = [
  { value: "", label: "Sans type" },
  { value: "Fiche de Poste", label: "Fiche de Poste" },
  { value: "Charte", label: "Charte" },
  { value: "Règlement", label: "Règlement" },
  { value: "Liste des Rôles", label: "Liste des Rôles" },
]

/** Types a filter chip can point at, in display order. */
export const FICHE_TYPE_FILTERS = [
  "Fiche de Poste",
  "Charte",
  "Règlement",
  "Liste des Rôles",
] as const

/** Actif = in force; Brouillon = still being written. */
export type FicheStatut = "Actif" | "Brouillon"

/**
 * How a member is bound to a document — a fiche de poste has titulaires, a
 * charte is signed, a règlement is validated, a liste des rôles assigns, and
 * everything else simply concerns people.
 */
export type MembreLieStatut =
  | "Titulaire"
  | "Signataire"
  | "Validé"
  | "Assigné"
  | "Concerné"

/** One person as shown in a document's "Membres concernés" table. */
export type MembreLie = {
  /** The organigramme membre id. */
  id: string
  nom: string
  /** For a liste des rôles: the rôle this person holds in it. */
  role: string
  groupe: string
  /** Month they joined that role, e.g. "sept. 2022". */
  depuis: string
  statut: MembreLieStatut
  /** Sent but not yet accepted / signed by the member. */
  enAttente?: boolean
}

/** What the document says — shown on its page and in a member's sheet. */
export type FicheContenu = {
  objectif?: string
  /** Fiche de poste: who the poste reports to. */
  rattachement?: string
  sections: { titre: string; points: string[] }[]
}

export type Fiche = {
  id: string
  titre: string
  type: FicheType
  /** Poste / périmètre the document covers ("Président", "Tous les membres"…). */
  perimetre: string
  /** Display date, e.g. "13 août 2026". */
  majLe: string
  auteur: string
  statut: FicheStatut
  /** Revision label, e.g. "v2.1". */
  version: string
  membres: MembreLie[]
  contenu?: FicheContenu
}

/* ── Member picker referential (derived from the organigramme) ─────────── */

export type SelectableGroup = { id: string; label: string; count: number }

/** Groupe Staff tab — the unités of the organigramme. */
export const staffGroupes: SelectableGroup[] = unitesSeed.map((u) => ({
  id: u.id,
  label: u.nom,
  count: u.membres.length,
}))

/** Par Poste tab — job families, cutting across the unités. */
export const posteGroupes: SelectableGroup[] = [
  { id: "pg-dirigeants", label: "Dirigeants", count: 5 },
  { id: "pg-entraineurs", label: "Entraîneurs", count: 2 },
  { id: "pg-prep", label: "Préparateurs physiques", count: 1 },
  { id: "pg-medical", label: "Médical", count: 2 },
  { id: "pg-com", label: "Communication", count: 3 },
  { id: "pg-admin", label: "Administratifs", count: 3 },
]

export type AnnuaireMembre = {
  id: string
  nom: string
  poste: string
  /** First unité the member sits in (display grouping). */
  groupe: string
  uniteIds: string[]
}

/** Individuel tab — everyone on the organigramme, grouped by unité on screen. */
export const annuaire: AnnuaireMembre[] = membresPool.map((m) => {
  const unites = unitesSeed.filter((u) =>
    u.membres.some((a) => a.membreId === m.id),
  )
  return {
    id: m.id,
    nom: m.nom,
    poste: m.role,
    groupe: unites[0]?.nom ?? "Non affecté",
    uniteIds: unites.map((u) => u.id),
  }
})

/** An organigramme membre as a document row. */
const lie = (
  id: string,
  statut: MembreLieStatut,
  opts: { role?: string; depuis?: string; enAttente?: boolean } = {},
): MembreLie => {
  const a = annuaire.find((m) => m.id === id)
  return {
    id,
    nom: a?.nom ?? id,
    role: opts.role ?? a?.poste ?? "—",
    groupe: a?.groupe ?? "—",
    depuis: opts.depuis ?? "sept. 2025",
    statut,
    enAttente: opts.enAttente,
  }
}

const TOUS = annuaire.map((m) => m.id)

/* ── Seed ─────────────────────────────────────────────────────────────────── */

const fichesDePoste: Fiche[] = [
  {
    id: "fiche-president",
    titre: "Fiche de poste — Président",
    type: "Fiche de Poste",
    perimetre: "Président",
    majLe: "13 août 2026",
    auteur: "Secrétariat",
    statut: "Actif",
    version: "v2.0",
    membres: [lie("m-hichem-ferchichi", "Titulaire", { depuis: "juin 2021" })],
    contenu: {
      objectif:
        "Représenter le club, fixer ses orientations et garantir le respect de ses statuts et de ses valeurs.",
      rattachement: "Assemblée générale",
      sections: [
        {
          titre: "Représentation",
          points: [
            "Représenter le club auprès de la fédération, de la ligue et des collectivités",
            "Signer les conventions et les contrats de partenariat",
          ],
        },
        {
          titre: "Pilotage",
          points: [
            "Présider le bureau directeur et l'assemblée générale",
            "Valider le budget annuel avec le trésorier",
            "Arbitrer les décisions sportives majeures avec le directeur technique",
          ],
        },
      ],
    },
  },
  {
    id: "fiche-vice-president",
    titre: "Fiche de poste — Vice-président",
    type: "Fiche de Poste",
    perimetre: "Vice-président",
    majLe: "13 août 2026",
    auteur: "Secrétariat",
    statut: "Actif",
    version: "v1.1",
    membres: [lie("m-sonia-belhadj", "Titulaire", { depuis: "juin 2021" })],
    contenu: {
      objectif:
        "Seconder le président et le remplacer en cas d'absence ; piloter la discipline et l'éthique du club.",
      rattachement: "Président",
      sections: [
        {
          titre: "Missions",
          points: [
            "Assurer l'intérim de la présidence",
            "Présider la commission discipline & éthique",
            "Suivre l'application des chartes du club",
          ],
        },
      ],
    },
  },
  {
    id: "fiche-secretaire-general",
    titre: "Fiche de poste — Secrétaire général",
    type: "Fiche de Poste",
    perimetre: "Secrétaire général",
    majLe: "13 août 2026",
    auteur: "Secrétariat",
    statut: "Actif",
    version: "v1.3",
    membres: [lie("m-karim-mestiri", "Titulaire", { depuis: "sept. 2022" })],
    contenu: {
      objectif:
        "Assurer le fonctionnement administratif du club et la mémoire de ses décisions.",
      rattachement: "Président",
      sections: [
        {
          titre: "Administration",
          points: [
            "Rédiger et diffuser les procès-verbaux du bureau",
            "Tenir à jour les licences et les dossiers des membres",
            "Gérer le courrier entrant et sortant",
          ],
        },
        {
          titre: "Assemblée générale",
          points: [
            "Préparer les convocations et l'ordre du jour",
            "Archiver les rapports moral et financier",
          ],
        },
      ],
    },
  },
  {
    id: "fiche-tresorier",
    titre: "Fiche de poste — Trésorier",
    type: "Fiche de Poste",
    perimetre: "Trésorier",
    majLe: "13 août 2026",
    auteur: "Secrétariat",
    statut: "Actif",
    version: "v1.2",
    membres: [lie("m-walid-nasri", "Titulaire", { depuis: "sept. 2023" })],
    contenu: {
      objectif: "Garantir la bonne gestion financière du club.",
      rattachement: "Président",
      sections: [
        {
          titre: "Finances",
          points: [
            "Préparer le budget prévisionnel avec le bureau",
            "Valider les dépenses et suivre les encaissements",
            "Présenter le rapport financier en assemblée générale",
          ],
        },
      ],
    },
  },
  {
    id: "fiche-directeur-technique",
    titre: "Fiche de poste — Directeur technique / Responsable sportif",
    type: "Fiche de Poste",
    perimetre: "Directeur technique",
    majLe: "13 août 2026",
    auteur: "Direction sportive",
    statut: "Actif",
    version: "v2.1",
    membres: [lie("m-amine-jelassi", "Titulaire", { depuis: "juil. 2022" })],
    contenu: {
      objectif:
        "Définir la politique technique et sportive du club et veiller au respect du projet sportif.",
      rattachement: "Président / Vice-président",
      sections: [
        {
          titre: "Projet sportif",
          points: [
            "Définir une politique technique pour la formation des jeunes joueurs",
            "Établir les organigrammes techniques de la saison et par section",
            "Élaborer la programmation annuelle et le contenu des cycles par catégorie",
          ],
        },
        {
          titre: "Encadrement",
          points: [
            "Superviser les séances d'entraînement et le contenu des matchs",
            "Travailler avec les référents école de foot, formation et éducateurs",
            "Organiser l'occupation des terrains et les conditions d'entraînement",
          ],
        },
      ],
    },
  },
  {
    id: "fiche-commission-technique",
    titre: "Fiche de poste — Commission technique",
    type: "Fiche de Poste",
    perimetre: "Commission technique",
    majLe: "13 août 2026",
    auteur: "Direction sportive",
    statut: "Actif",
    version: "v1.4",
    membres: [
      lie("m-mohamed-benslimane", "Titulaire", { depuis: "sept. 2022" }),
      lie("m-yassine-gharbi", "Titulaire", { depuis: "juil. 2024" }),
      lie("m-oussama-trabelsi", "Titulaire", { depuis: "juil. 2024" }),
      lie("m-slim-jaziri", "Titulaire", { depuis: "sept. 2023" }),
      lie("m-sofiane-mejri", "Titulaire", { depuis: "janv. 2026", enAttente: true }),
    ],
    contenu: {
      objectif:
        "Mettre en œuvre la politique technique du club dans toutes les catégories.",
      rattachement: "Directeur technique",
      sections: [
        {
          titre: "Équipes",
          points: [
            "Gérer les effectifs et le suivi des convocations",
            "Organiser les matchs, rassemblements et tournois",
          ],
        },
        {
          titre: "Éducateurs",
          points: [
            "Animer des réunions techniques et d'aide aux éducateurs",
            "Établir un plan de formation des éducateurs",
          ],
        },
        {
          titre: "Recrutement",
          points: [
            "Organiser des journées de détection et portes ouvertes",
            "Repérer les jeunes joueurs à potentiel",
          ],
        },
      ],
    },
  },
  {
    id: "fiche-commission-jeunes",
    titre: "Fiche de poste — Commission jeunes / École de football",
    type: "Fiche de Poste",
    perimetre: "Commission jeunes / École de football",
    majLe: "14 août 2026",
    auteur: "Direction sportive",
    statut: "Actif",
    version: "v1.0",
    membres: [lie("m-rim-bouazizi", "Titulaire", { depuis: "sept. 2024" })],
    contenu: {
      objectif:
        "Accueillir et faire progresser les jeunes joueurs, de l'école de football aux U13.",
      rattachement: "Directeur technique",
      sections: [
        {
          titre: "Missions",
          points: [
            "Coordonner les éducateurs des catégories jeunes",
            "Organiser les plateaux et tournois jeunes",
            "Assurer le lien avec les parents",
          ],
        },
      ],
    },
  },
  {
    id: "fiche-commission-educative",
    titre: "Fiche de poste — Commission éducative",
    type: "Fiche de Poste",
    perimetre: "Commission éducative",
    majLe: "14 août 2026",
    auteur: "Secrétariat",
    statut: "Actif",
    version: "v1.0",
    membres: [lie("m-leila-arfaoui", "Titulaire", { depuis: "sept. 2024" })],
    contenu: {
      objectif:
        "Assurer le développement humain, scolaire et citoyen des jeunes membres du club, en complémentarité avec le projet sportif.",
      rattachement: "Vice-président / Président",
      sections: [
        {
          titre: "Suivi scolaire et personnel",
          points: [
            "Mettre en place un suivi scolaire des jeunes licenciés (bulletins, résultats, comportement)",
            "Alerter les familles et la direction en cas de difficultés scolaires",
            "Proposer des solutions d'accompagnement (tutorat, orientation)",
            "Valoriser les réussites scolaires (tableau d'honneur, récompenses de fin de saison)",
          ],
        },
        {
          titre: "Éducation aux valeurs",
          points: [
            "Organiser des ateliers sur les valeurs du sport (fair-play, respect, solidarité, citoyenneté)",
            "Animer des séances de sensibilisation : racisme, violences, dopage, réseaux sociaux",
          ],
        },
        {
          titre: "Lien avec les familles",
          points: [
            "Organiser des réunions parents-club au moins 2 fois par saison",
            "Recueillir les retours des familles sur le fonctionnement éducatif",
          ],
        },
      ],
    },
  },
  {
    id: "fiche-commission-communication",
    titre: "Fiche de poste — Commission communication & événementiel",
    type: "Fiche de Poste",
    perimetre: "Commission communication & événementiel",
    majLe: "13 août 2026",
    auteur: "Communication",
    statut: "Actif",
    version: "v1.1",
    membres: [
      lie("m-ahmed-khelifi", "Titulaire", { depuis: "sept. 2023" }),
      lie("m-mariem-saidi", "Titulaire", { depuis: "févr. 2025" }),
    ],
    contenu: {
      objectif: "Faire connaître le club et animer sa vie autour des matchs.",
      rattachement: "Secrétaire général",
      sections: [
        {
          titre: "Communication",
          points: [
            "Tenir les réseaux sociaux et le site du club",
            "Publier les résultats et les convocations publiques",
          ],
        },
        {
          titre: "Événementiel",
          points: [
            "Organiser la journée des familles et la fête de fin de saison",
            "Préparer les supports des partenaires les jours de match",
          ],
        },
      ],
    },
  },
  {
    id: "fiche-commission-finances",
    titre: "Fiche de poste — Commission finances & sponsoring",
    type: "Fiche de Poste",
    perimetre: "Commission finances & sponsoring",
    majLe: "14 août 2026",
    auteur: "Trésorerie",
    statut: "Actif",
    version: "v1.0",
    membres: [
      lie("m-nizar-abbes", "Titulaire", { depuis: "sept. 2024" }),
      lie("m-fatma-zouari", "Titulaire", { depuis: "sept. 2022" }),
    ],
    contenu: {
      objectif: "Assurer les ressources du club et en suivre l'utilisation.",
      rattachement: "Trésorier",
      sections: [
        {
          titre: "Sponsoring",
          points: [
            "Prospecter de nouveaux partenaires",
            "Suivre les contreparties promises aux sponsors",
          ],
        },
        {
          titre: "Comptabilité",
          points: [
            "Saisir les recettes et dépenses",
            "Préparer les rapprochements bancaires mensuels",
          ],
        },
      ],
    },
  },
  {
    id: "fiche-commission-administrative",
    titre: "Fiche de poste — Commission administrative & secrétariat",
    type: "Fiche de Poste",
    perimetre: "Commission administrative & secrétariat",
    majLe: "13 août 2026",
    auteur: "Secrétariat",
    statut: "Actif",
    version: "v1.0",
    membres: [lie("m-nadia-cherif", "Titulaire", { depuis: "janv. 2023" })],
    contenu: {
      objectif: "Gérer le quotidien administratif du club.",
      rattachement: "Secrétaire général",
      sections: [
        {
          titre: "Missions",
          points: [
            "Suivre les licences, certificats médicaux et assurances",
            "Accueillir les familles et répondre aux demandes",
            "Tenir les plannings de salles et de terrains",
          ],
        },
      ],
    },
  },
  {
    id: "fiche-commission-medicale",
    titre: "Fiche de poste — Commission médicale & bien-être",
    type: "Fiche de Poste",
    perimetre: "Commission médicale & bien-être",
    majLe: "13 août 2026",
    auteur: "Direction sportive",
    statut: "Actif",
    version: "v1.0",
    membres: [
      lie("m-tarek-loukil", "Titulaire", { depuis: "sept. 2021" }),
      lie("m-ines-hamdi", "Titulaire", { depuis: "sept. 2023" }),
    ],
    contenu: {
      objectif: "Protéger la santé des joueurs et accompagner leur retour au jeu.",
      rattachement: "Directeur technique",
      sections: [
        {
          titre: "Missions",
          points: [
            "Assurer les visites médicales de début de saison",
            "Suivre les blessures et les protocoles de reprise",
            "Sensibiliser à la nutrition, au sommeil et à la récupération",
          ],
        },
      ],
    },
  },
  {
    id: "fiche-commission-materiel",
    titre: "Fiche de poste — Commission matériel & équipement",
    type: "Fiche de Poste",
    perimetre: "Commission matériel & équipement",
    majLe: "13 août 2026",
    auteur: "Logistique",
    statut: "Actif",
    version: "v1.0",
    membres: [lie("m-hamza-dridi", "Titulaire", { depuis: "sept. 2020" })],
    contenu: {
      objectif: "Garantir que chaque équipe dispose du matériel dont elle a besoin.",
      rattachement: "Directeur technique",
      sections: [
        {
          titre: "Missions",
          points: [
            "Tenir l'inventaire du matériel et des équipements",
            "Distribuer et récupérer les dotations en début et fin de saison",
            "Signaler le matériel à remplacer",
          ],
        },
      ],
    },
  },
  {
    // Edge case: a poste written but not filled yet — no titulaire.
    id: "fiche-commission-discipline",
    titre: "Fiche de poste — Commission discipline & éthique",
    type: "Fiche de Poste",
    perimetre: "Commission discipline & éthique",
    majLe: "13 août 2026",
    auteur: "Secrétariat",
    statut: "Brouillon",
    version: "v0.3",
    membres: [],
    contenu: {
      objectif:
        "Instruire les incidents disciplinaires et faire respecter les chartes du club.",
      rattachement: "Vice-président",
      sections: [
        {
          titre: "Missions",
          points: [
            "Instruire les incidents signalés en match ou à l'entraînement",
            "Proposer des sanctions au bureau",
            "Animer des actions de prévention",
          ],
        },
      ],
    },
  },
]

const listesDesRoles: Fiche[] = [
  {
    id: "roles-bureau",
    titre: "Rôles du bureau directeur",
    type: "Liste des Rôles",
    perimetre: "Bureau directeur",
    majLe: "13 août 2026",
    auteur: "Secrétariat",
    statut: "Actif",
    version: "v1.2",
    membres: [
      lie("m-hichem-ferchichi", "Assigné", { role: "Président — représentation & pilotage" }),
      lie("m-sonia-belhadj", "Assigné", { role: "Vice-présidente — discipline & éthique" }),
      lie("m-karim-mestiri", "Assigné", { role: "Secrétaire général — PV & courrier" }),
      lie("m-walid-nasri", "Assigné", { role: "Trésorier — budget & dépenses" }),
      lie("m-nadia-cherif", "Assigné", { role: "Référente administrative" }),
    ],
    contenu: {
      sections: [
        {
          titre: "Principe",
          points: [
            "Chaque membre du bureau porte un domaine et en rend compte à chaque réunion",
            "Une décision engageant le club est signée par le président et le trésorier",
          ],
        },
      ],
    },
  },
  {
    id: "roles-commission-technique",
    titre: "Rôles de la commission technique",
    type: "Liste des Rôles",
    perimetre: "Commission technique",
    majLe: "13 août 2026",
    auteur: "Direction sportive",
    statut: "Actif",
    version: "v1.3",
    membres: [
      lie("m-amine-jelassi", "Assigné", { role: "Directeur technique" }),
      lie("m-mohamed-benslimane", "Assigné", { role: "Responsable de la commission" }),
      lie("m-yassine-gharbi", "Assigné", { role: "Référent équipe première" }),
      lie("m-oussama-trabelsi", "Assigné", { role: "Référent vidéo & adversaires" }),
      lie("m-slim-jaziri", "Assigné", { role: "Référent préparation physique" }),
      lie("m-sofiane-mejri", "Assigné", { role: "Référent recrutement", enAttente: true }),
      lie("m-rim-bouazizi", "Assigné", { role: "Référente école de football" }),
    ],
    contenu: {
      sections: [
        {
          titre: "Rôles",
          points: [
            "Effectuer un suivi de la politique technique mise en place",
            "Gérer l'ensemble des équipes du club (matchs, rassemblements…)",
            "Veiller à l'application des chartes",
            "Suivre et soutenir les éducateurs du club",
          ],
        },
      ],
    },
  },
  {
    id: "roles-commission-communication",
    titre: "Rôles de la commission communication & événementiel",
    type: "Liste des Rôles",
    perimetre: "Commission communication",
    majLe: "13 août 2026",
    auteur: "Communication",
    statut: "Actif",
    version: "v1.0",
    membres: [
      lie("m-ahmed-khelifi", "Assigné", { role: "Responsable de la commission" }),
      lie("m-mariem-saidi", "Assigné", { role: "Réseaux sociaux & contenus" }),
      lie("m-nizar-abbes", "Assigné", { role: "Partenaires & jours de match" }),
    ],
    contenu: {
      sections: [
        {
          titre: "Rôles",
          points: [
            "Publier au moins un contenu par match",
            "Préparer les visuels partenaires",
          ],
        },
      ],
    },
  },
  {
    id: "roles-commission-educative",
    titre: "Rôles de la commission éducative",
    type: "Liste des Rôles",
    perimetre: "Commission éducative",
    majLe: "14 août 2026",
    auteur: "Secrétariat",
    statut: "Brouillon",
    version: "v0.2",
    membres: [
      lie("m-leila-arfaoui", "Assigné", { role: "Responsable de la commission" }),
      lie("m-rim-bouazizi", "Assigné", { role: "Lien avec les familles" }),
    ],
    contenu: {
      sections: [
        {
          titre: "Rôles",
          points: [
            "Suivre les résultats scolaires des jeunes licenciés",
            "Organiser les ateliers valeurs & citoyenneté",
          ],
        },
      ],
    },
  },
  {
    id: "roles-commission-medicale-logistique",
    titre: "Rôles des commissions médicale & matériel",
    type: "Liste des Rôles",
    perimetre: "Médical & logistique",
    majLe: "13 août 2026",
    auteur: "Direction sportive",
    statut: "Actif",
    version: "v1.0",
    membres: [
      lie("m-tarek-loukil", "Assigné", { role: "Responsable médical" }),
      lie("m-ines-hamdi", "Assigné", { role: "Suivi des blessures & reprises" }),
      lie("m-hamza-dridi", "Assigné", { role: "Matériel & équipements" }),
      lie("m-fatma-zouari", "Assigné", { role: "Suivi des achats de matériel" }),
    ],
  },
]

/** Staff who signed a charte, with the few still pending. */
const signataires = (ids: string[], enAttente: string[], statut: MembreLieStatut = "Signataire") =>
  ids.map((id) => lie(id, statut, { enAttente: enAttente.includes(id) }))

const chartes: Fiche[] = [
  {
    id: "charte-ethique",
    titre: "Charte éthique et valeurs du club",
    type: "Charte",
    perimetre: "Tous les membres",
    majLe: "13 août 2026",
    auteur: "Bureau directeur",
    statut: "Actif",
    version: "v3.0",
    membres: signataires(TOUS, ["m-sofiane-mejri", "m-mariem-saidi", "m-hamza-dridi"]),
    contenu: {
      objectif: "Notre club est fondé sur les valeurs suivantes :",
      sections: [
        {
          titre: "Nos valeurs",
          points: [
            "Respect — de chaque personne, sans distinction d'origine, de genre, de religion ou de niveau sportif",
            "Fair-play — dans la victoire comme dans la défaite, sur le terrain comme en dehors",
            "Solidarité — l'équipe avant l'individu, nous progressons ensemble",
            "Engagement — chaque membre donne le meilleur de lui-même pour le collectif",
            "Intégrité — nous agissons avec honnêteté et transparence",
            "Bienveillance — nous encourageons, nous soutenons, nous ne dénigrons pas",
            "Citoyenneté — le club est un espace d'éducation et de vie sociale positive",
          ],
        },
      ],
    },
  },
  {
    id: "charte-dirigeant",
    titre: "Charte du dirigeant / bénévole",
    type: "Charte",
    perimetre: "Dirigeants & bénévoles",
    majLe: "13 août 2026",
    auteur: "Bureau directeur",
    statut: "Actif",
    version: "v1.1",
    membres: signataires(
      [
        "m-hichem-ferchichi",
        "m-sonia-belhadj",
        "m-karim-mestiri",
        "m-walid-nasri",
        "m-nadia-cherif",
        "m-ahmed-khelifi",
        "m-nizar-abbes",
        "m-leila-arfaoui",
      ],
      ["m-nizar-abbes"],
    ),
    contenu: {
      sections: [
        {
          titre: "Je m'engage à",
          points: [
            "Agir dans l'intérêt du club et non dans un intérêt personnel",
            "Respecter la confidentialité des décisions du bureau",
            "Être présent aux réunions ou prévenir de mon absence",
            "Montrer l'exemple au bord du terrain",
          ],
        },
      ],
    },
  },
  {
    id: "charte-educateur",
    titre: "Charte de l'éducateur / entraîneur",
    type: "Charte",
    perimetre: "Éducateurs / entraîneurs",
    majLe: "13 août 2026",
    auteur: "Direction sportive",
    statut: "Actif",
    version: "v2.0",
    membres: signataires(
      [
        "m-amine-jelassi",
        "m-mohamed-benslimane",
        "m-yassine-gharbi",
        "m-oussama-trabelsi",
        "m-slim-jaziri",
        "m-rim-bouazizi",
        "m-sofiane-mejri",
      ],
      ["m-sofiane-mejri"],
    ),
    contenu: {
      sections: [
        {
          titre: "L'éducateur s'engage à",
          points: [
            "Être ponctuel et préparer chacune de ses séances",
            "Faire jouer tous les joueurs selon le projet du club",
            "Proscrire toute forme de violence, verbale ou physique",
            "Protéger les mineurs dont il a la charge",
            "Se former chaque saison",
          ],
        },
      ],
    },
  },
  {
    id: "charte-joueur",
    titre: "Charte du joueur",
    type: "Charte",
    perimetre: "Joueurs",
    majLe: "13 août 2026",
    auteur: "Direction sportive",
    statut: "Actif",
    version: "v2.0",
    // Signed by the joueurs themselves — none of them sit on the organigramme.
    membres: [],
    contenu: {
      sections: [
        {
          titre: "Le joueur s'engage à",
          points: [
            "Être assidu et ponctuel aux entraînements et aux matchs",
            "Respecter ses coéquipiers, ses adversaires, l'arbitre et ses éducateurs",
            "Prendre soin du matériel et des installations",
            "Concilier football et réussite scolaire",
          ],
        },
      ],
    },
  },
  {
    id: "charte-parent",
    titre: "Charte du parent / accompagnateur",
    type: "Charte",
    perimetre: "Parents",
    majLe: "13 août 2026",
    auteur: "Commission éducative",
    statut: "Brouillon",
    version: "v0.4",
    membres: [],
    contenu: {
      sections: [
        {
          titre: "Le parent s'engage à",
          points: [
            "Encourager sans crier de consignes depuis le bord du terrain",
            "Respecter les choix sportifs des éducateurs",
            "Prévenir en cas d'absence de son enfant",
          ],
        },
      ],
    },
  },
  {
    id: "reglement-interieur",
    titre: "Règlement intérieur",
    type: "Règlement",
    perimetre: "Tous les membres",
    majLe: "13 août 2026",
    auteur: "Bureau directeur",
    statut: "Actif",
    version: "v4.1",
    membres: signataires(TOUS, ["m-oussama-trabelsi", "m-fatma-zouari"], "Validé"),
    contenu: {
      sections: [
        {
          titre: "Adhésion",
          points: [
            "La licence est obligatoire pour participer aux activités",
            "La cotisation est due en début de saison",
          ],
        },
        {
          titre: "Installations",
          points: [
            "L'accès aux vestiaires est réservé aux joueurs et à l'encadrement",
            "Tout dégât volontaire est à la charge de son auteur",
          ],
        },
        {
          titre: "Sanctions",
          points: [
            "Tout manquement peut être examiné par la commission discipline & éthique",
          ],
        },
      ],
    },
  },
]

export const fichesSeed: Fiche[] = [...chartes, ...fichesDePoste, ...listesDesRoles]
