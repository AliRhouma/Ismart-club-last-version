/**
 * The nine modules shown on the landing page — card content AND the content of
 * each module's own detail page (/landing/modules/:slug).
 *
 * One source of truth: the grid on the landing page and the detail page read
 * the same records, so a module never says two different things.
 */
import {
  Activity,
  BarChart3,
  Bell,
  Calendar,
  CalendarClock,
  ClipboardCheck,
  ClipboardList,
  Compass,
  Dumbbell,
  FileText,
  FolderTree,
  GraduationCap,
  HandCoins,
  Layers,
  Library,
  LineChart,
  ListChecks,
  ListTodo,
  MessageSquare,
  Network,
  PiggyBank,
  Receipt,
  Repeat,
  RefreshCw,
  Route,
  Send,
  Shield,
  Target,
  Timer,
  Trophy,
  Users,
  Vote,
  Wallet,
  type LucideIcon,
} from "lucide-react"

export type ModuleHighlight = {
  icon: LucideIcon
  title: string
  text: string
}

export type ModuleCapability = {
  title: string
  items: string[]
}

export type ModuleStep = {
  title: string
  text: string
}

export type LandingModule = {
  /** URL segment — /landing/modules/<slug>. */
  slug: string
  icon: LucideIcon
  name: string
  /** Card blurb (grid on the landing page). */
  desc: string
  tags: string[]

  /* ── Detail page ── */
  /** Eyebrow: which pôle the module belongs to. */
  pole: string
  /** The one-sentence promise, under the title. */
  tagline: string
  intro: string
  /** Who works in this module day to day. */
  roles: string[]
  highlights: ModuleHighlight[]
  capabilities: ModuleCapability[]
  steps: ModuleStep[]
  outcomes: { value: string; label: string }[]
}

export const MODULES: LandingModule[] = [
  /* ─────────────────────────────────────────────────────────────────── */
  {
    slug: "ressources-humaines",
    icon: Users,
    name: "Ressources humaines",
    desc: "Joueurs, éducateurs, membres et parents dans un seul annuaire, avec des profils et des permissions par rôle.",
    tags: ["Joueurs", "Éducateurs", "Parents", "Profils"],

    pole: "Pôle administratif",
    tagline: "Un seul annuaire pour toutes les personnes du club.",
    intro:
      "Joueurs, éducateurs, dirigeants et parents ont une fiche unique, rattachée à une catégorie et à un rôle. Plus de liste qui circule en tableur et que personne n'a jamais à jour au bon moment.",
    roles: ["Secrétariat", "Dirigeants", "Éducateurs", "Parents"],
    highlights: [
      {
        icon: Users,
        title: "Une fiche par personne",
        text: "Identité, contacts, licence, catégorie, rôle et documents réunis sur une seule fiche, visible par ceux qui en ont besoin.",
      },
      {
        icon: Shield,
        title: "Des permissions par rôle",
        text: "Un éducateur voit sa catégorie, un dirigeant voit le club, un parent voit son enfant. Chacun accède à ce qui le concerne, et rien d'autre.",
      },
      {
        icon: FileText,
        title: "Les documents rattachés",
        text: "Licence, certificat médical, autorisation parentale : les pièces vivent sur la fiche du licencié, pas dans une boîte mail.",
      },
      {
        icon: RefreshCw,
        title: "Des mouvements propres",
        text: "Un joueur qui monte de catégorie, un éducateur qui quitte le club : l'annuaire suit et l'historique de saison reste.",
      },
    ],
    capabilities: [
      {
        title: "Les personnes",
        items: [
          "Fiches joueurs : poste, pied fort, catégorie, groupe",
          "Fiches éducateurs : diplômes, catégories encadrées",
          "Dirigeants, membres du bureau et bénévoles",
          "Parents rattachés à un ou plusieurs joueurs",
        ],
      },
      {
        title: "Les accès",
        items: [
          "Rôles et permissions par pôle",
          "Invitation par email à rejoindre l'espace du club",
          "Vue restreinte pour les parents et les joueurs",
          "Historique des rattachements, saison par saison",
        ],
      },
      {
        title: "Les documents",
        items: [
          "Licence et numéro d'affiliation",
          "Certificat médical et date de validité",
          "Autorisations, décharges et droit à l'image",
          "Repérage des pièces manquantes avant la reprise",
        ],
      },
    ],
    steps: [
      {
        title: "Importez vos licenciés",
        text: "Un fichier de licence suffit à créer l'annuaire complet du club en une seule fois.",
      },
      {
        title: "Rattachez chacun à sa catégorie",
        text: "La catégorie et le rôle déclenchent automatiquement les bons accès dans toute la plateforme.",
      },
      {
        title: "Faites vivre les fiches",
        text: "Contacts, documents, changements de groupe : la fiche évolue avec la saison, sans ressaisie ailleurs.",
      },
    ],
    outcomes: [
      { value: "1", label: "annuaire pour tout le club" },
      { value: "4", label: "types de profils" },
      { value: "0", label: "tableur à maintenir" },
    ],
  },

  /* ─────────────────────────────────────────────────────────────────── */
  {
    slug: "categories-groupes",
    icon: Layers,
    name: "Catégories & groupes",
    desc: "Chaque catégorie a son effectif, ses groupes, son staff, ses résultats et son taux de présence, saison après saison.",
    tags: ["Effectif", "Groupes", "Résultats"],

    pole: "Pôle technique",
    tagline: "Chaque catégorie devient un espace de travail complet.",
    intro:
      "U9, U13, U17, séniors : chaque catégorie a sa page, avec son effectif, ses groupes de travail, son staff, ses matchs et son assiduité. Le club voit d'un coup d'œil où ça tourne bien et où il faut aller voir.",
    roles: ["Responsable technique", "Éducateurs", "Dirigeants"],
    highlights: [
      {
        icon: Users,
        title: "L'effectif, toujours juste",
        text: "L'effectif d'une catégorie se construit depuis l'annuaire : un joueur ajouté au club apparaît là où il joue, pas ailleurs.",
      },
      {
        icon: Layers,
        title: "Des groupes de travail",
        text: "Une catégorie peut être découpée en groupes — niveau, poste, équipe A / B — pour que les séances collent au terrain.",
      },
      {
        icon: Trophy,
        title: "Les résultats rattachés",
        text: "Matchs joués, scores et classement de poule vivent sur la catégorie, à côté de l'effectif qui les a produits.",
      },
      {
        icon: Activity,
        title: "Le taux de présence",
        text: "L'assiduité de la catégorie se lit sur la page, séance après séance : c'est souvent le premier signal d'alerte.",
      },
    ],
    capabilities: [
      {
        title: "La structure",
        items: [
          "Une page par catégorie, saison par saison",
          "Groupes et sous-groupes internes",
          "Staff rattaché : éducateur principal, adjoints",
          "Équipes engagées et compétitions suivies",
        ],
      },
      {
        title: "Le suivi",
        items: [
          "Effectif complet avec postes et statuts",
          "Taux de présence de la catégorie",
          "Résultats et calendrier de l'équipe",
          "Évaluations rattachées aux joueurs du groupe",
        ],
      },
      {
        title: "La saison",
        items: [
          "Passage d'une catégorie à l'autre entre saisons",
          "Historique conservé pour chaque joueur",
          "Comparaison d'une saison à la précédente",
          "Vue club : toutes les catégories côte à côte",
        ],
      },
    ],
    steps: [
      {
        title: "Créez vos catégories",
        text: "Reprenez la structure réelle du club — âge, niveau, équipes engagées.",
      },
      {
        title: "Composez les effectifs",
        text: "Les joueurs de l'annuaire rejoignent leur catégorie, puis leurs groupes de travail.",
      },
      {
        title: "Suivez la saison",
        text: "Présences, résultats et évaluations s'accumulent sur la catégorie sans travail supplémentaire.",
      },
    ],
    outcomes: [
      { value: "1", label: "page par catégorie" },
      { value: "100 %", label: "de l'effectif visible" },
      { value: "∞", label: "saisons conservées" },
    ],
  },

  /* ─────────────────────────────────────────────────────────────────── */
  {
    slug: "projet-de-jeu",
    icon: Target,
    name: "Projet de jeu",
    desc: "Le modèle de jeu du club, décliné en étapes par phase, et appliqué aux catégories concernées.",
    tags: ["Modèle de jeu", "Étapes", "Par catégorie"],

    pole: "Pôle technique",
    tagline: "Le modèle de jeu du club, écrit une fois et partagé par tous.",
    intro:
      "Le projet de jeu cesse d'être un document PDF que personne ne rouvre. Il se décline en phases, en principes et en étapes, et chaque catégorie sait quelle partie du modèle la concerne cette saison.",
    roles: ["Responsable technique", "Éducateurs"],
    highlights: [
      {
        icon: Compass,
        title: "Une identité de jeu claire",
        text: "Le club décrit sa façon de jouer par phase : possession, transitions, pressing, jeu sans ballon.",
      },
      {
        icon: Route,
        title: "Décliné en étapes",
        text: "Chaque phase se découpe en principes puis en étapes progressives — de l'initiation U9 à l'application séniors.",
      },
      {
        icon: Layers,
        title: "Appliqué par catégorie",
        text: "Une étape est rattachée aux catégories concernées : les U11 ne travaillent pas le même niveau d'exigence que les U17.",
      },
      {
        icon: Repeat,
        title: "Réutilisé partout",
        text: "Les principes du projet alimentent la programmation annuelle et le classement des procédés. Un seul vocabulaire, partout.",
      },
    ],
    capabilities: [
      {
        title: "Le modèle",
        items: [
          "Phases de jeu et sous-phases",
          "Principes et sous-principes par phase",
          "Étapes de progression, de l'initiation à la maîtrise",
          "Description, intention et critères de réussite",
        ],
      },
      {
        title: "L'application",
        items: [
          "Rattachement des étapes aux catégories",
          "Plusieurs projets de jeu coexistants (école de foot / préformation)",
          "Version de la saison en cours et archives",
          "Import d'un projet depuis le module Communauté",
        ],
      },
      {
        title: "La continuité",
        items: [
          "Le même langage du U9 aux séniors",
          "Un éducateur qui arrive reprend le modèle en place",
          "Les procédés sont classés par principe du projet",
          "Les séances savent quel principe elles travaillent",
        ],
      },
    ],
    steps: [
      {
        title: "Écrivez le modèle",
        text: "Phase par phase, décrivez comment le club veut jouer — ou partez d'un projet importé du réseau.",
      },
      {
        title: "Découpez en étapes",
        text: "Chaque principe devient une progression, du geste simple à l'exigence de compétition.",
      },
      {
        title: "Affectez aux catégories",
        text: "Chaque catégorie récupère les étapes qui la concernent, et la programmation s'appuie dessus.",
      },
    ],
    outcomes: [
      { value: "1", label: "modèle pour tout le club" },
      { value: "4", label: "phases de jeu couvertes" },
      { value: "U9 → séniors", label: "une seule progression" },
    ],
  },

  /* ─────────────────────────────────────────────────────────────────── */
  {
    slug: "programmation-annuelle",
    icon: Calendar,
    name: "Programmation annuelle",
    desc: "La saison entière planifiée : chaque séance sait quel principe de jeu elle doit travailler, semaine après semaine.",
    tags: ["36 semaines", "Cycles", "Principes"],

    pole: "Pôle technique",
    tagline: "Toute la saison programmée, semaine après semaine.",
    intro:
      "La programmation annuelle relie le projet de jeu au calendrier réel : 36 semaines, des cycles, et pour chaque créneau le principe à travailler. L'éducateur n'improvise plus le dimanche soir.",
    roles: ["Responsable technique", "Éducateurs"],
    highlights: [
      {
        icon: CalendarClock,
        title: "36 semaines devant soi",
        text: "La saison entière est posée : périodes de travail, vacances, trêve, phases de compétition.",
      },
      {
        icon: Repeat,
        title: "Des cycles cohérents",
        text: "Les semaines se regroupent en cycles thématiques, chacun rattaché à un principe du projet de jeu.",
      },
      {
        icon: Target,
        title: "Chaque séance a une intention",
        text: "Un créneau de la programmation n'est pas une case vide : il porte le principe que la séance doit travailler.",
      },
      {
        icon: ClipboardList,
        title: "Du plan à la séance",
        text: "Planifier un créneau crée la séance correspondante, déjà orientée sur le bon principe.",
      },
    ],
    capabilities: [
      {
        title: "Le calendrier",
        items: [
          "Saison découpée en semaines et en périodes",
          "Cycles de travail thématiques",
          "Créneaux par catégorie et par groupe",
          "Vacances, trêves et coupures intégrées",
        ],
      },
      {
        title: "Le contenu",
        items: [
          "Principe de jeu associé à chaque créneau",
          "Objectifs de cycle et volumes de travail",
          "Séances générées depuis la programmation",
          "Écart entre le prévu et le réalisé",
        ],
      },
      {
        title: "Le partage",
        items: [
          "Une programmation par catégorie",
          "Duplication d'une catégorie à l'autre",
          "Programmation importée depuis la Communauté",
          "Consultation par tout le staff technique",
        ],
      },
    ],
    steps: [
      {
        title: "Posez le calendrier",
        text: "Dates de reprise, vacances, trêve : la trame des 36 semaines est en place en quelques minutes.",
      },
      {
        title: "Construisez les cycles",
        text: "Chaque cycle reçoit les principes du projet de jeu qu'il doit faire progresser.",
      },
      {
        title: "Déroulez la saison",
        text: "Semaine après semaine, chaque créneau devient une séance déjà orientée, prête à être remplie.",
      },
    ],
    outcomes: [
      { value: "36", label: "semaines programmées" },
      { value: "108", label: "séances par équipe" },
      { value: "0", label: "séance sans intention" },
    ],
  },

  /* ─────────────────────────────────────────────────────────────────── */
  {
    slug: "procedes-seances",
    icon: ClipboardList,
    name: "Procédés & séances",
    desc: "Une bibliothèque de procédés classée par principe, et des séances construites à partir d'elle en quelques clics.",
    tags: ["Bibliothèque", "Séances", "Matériel"],

    pole: "Pôle technique",
    tagline: "La bibliothèque du club, et des séances prêtes en quelques clics.",
    intro:
      "Tous les procédés du club vivent au même endroit, classés par principe de jeu. Construire une séance revient à choisir dans la bibliothèque : durée, matériel, consignes et variantes suivent automatiquement.",
    roles: ["Éducateurs", "Responsable technique"],
    highlights: [
      {
        icon: Library,
        title: "Une bibliothèque commune",
        text: "Les procédés appartiennent au club. Quand un éducateur part, son travail reste dans la bibliothèque.",
      },
      {
        icon: Target,
        title: "Classés par principe",
        text: "Chaque procédé est rattaché au principe du projet de jeu qu'il travaille : on trouve en dix secondes, pas en dix minutes.",
      },
      {
        icon: Dumbbell,
        title: "Des fiches complètes",
        text: "Schéma, espace, effectif, matériel, durée, consignes, critères de réussite et variantes — la fiche se suffit à elle-même.",
      },
      {
        icon: Timer,
        title: "Une séance en quelques clics",
        text: "On empile les procédés, la durée totale et la liste de matériel se calculent toutes seules.",
      },
    ],
    capabilities: [
      {
        title: "La bibliothèque",
        items: [
          "Fiches procédés avec schéma et consignes",
          "Classement par principe, phase et catégorie d'âge",
          "Recherche et filtres (thème, effectif, durée)",
          "Import de procédés depuis la Communauté",
        ],
      },
      {
        title: "Les séances",
        items: [
          "Construction par blocs : échauffement, situations, jeu",
          "Durée totale et matériel calculés",
          "Objectif de séance issu de la programmation",
          "Consultation sur mobile au bord du terrain",
        ],
      },
      {
        title: "L'après-séance",
        items: [
          "Feuille de présence rattachée",
          "Bilan et observations de l'éducateur",
          "Séance archivée dans l'historique de la catégorie",
          "Réutilisation d'une séance d'une saison à l'autre",
        ],
      },
    ],
    steps: [
      {
        title: "Constituez la bibliothèque",
        text: "Saisissez vos procédés, ou importez ceux du réseau, et rattachez-les aux principes du club.",
      },
      {
        title: "Montez la séance",
        text: "Le créneau donne l'intention ; il ne reste qu'à choisir les procédés qui la servent.",
      },
      {
        title: "Emmenez-la sur le terrain",
        text: "La séance s'ouvre sur téléphone : matériel, temps et consignes sous les yeux.",
      },
    ],
    outcomes: [
      { value: "544", label: "fiches procédés dans le réseau" },
      { value: "< 5 min", label: "pour monter une séance" },
      { value: "1", label: "bibliothèque pour tout le club" },
    ],
  },

  /* ─────────────────────────────────────────────────────────────────── */
  {
    slug: "analyse-suivi",
    icon: BarChart3,
    name: "Analyse & suivi",
    desc: "Présences, évaluations individuelles et de groupe, notes de match et tests physiques rattachés à chaque joueur.",
    tags: ["Présences", "Évaluations", "Tests"],

    pole: "Pôle technique",
    tagline: "Ce que chaque joueur a réellement fait cette saison.",
    intro:
      "Présences, évaluations, notes de match et tests physiques se rattachent au joueur et à sa catégorie. Le club arrête de décider au ressenti : les chiffres existent déjà, ils sont enfin au même endroit.",
    roles: ["Éducateurs", "Responsable technique", "Dirigeants"],
    highlights: [
      {
        icon: ClipboardCheck,
        title: "Les présences, en un geste",
        text: "L'appel se fait depuis la séance, sur mobile. Le taux d'assiduité se met à jour pour le joueur, le groupe et la catégorie.",
      },
      {
        icon: ListChecks,
        title: "Des évaluations cadrées",
        text: "Les critères d'évaluation sont ceux du club, pas ceux de chaque éducateur — les bilans deviennent comparables.",
      },
      {
        icon: LineChart,
        title: "Une progression lisible",
        text: "Chaque joueur a sa courbe : évaluations successives, temps de jeu, notes de match, tests physiques.",
      },
      {
        icon: Activity,
        title: "Des signaux tôt",
        text: "Une assiduité qui décroche ou un groupe entier en retard se voient avant la fin de la phase, pas après.",
      },
    ],
    capabilities: [
      {
        title: "Les présences",
        items: [
          "Appel par séance et par match",
          "Motifs d'absence (blessure, école, non justifiée)",
          "Taux par joueur, par groupe et par catégorie",
          "Historique complet sur la saison",
        ],
      },
      {
        title: "Les évaluations",
        items: [
          "Grilles de critères définies par le club",
          "Évaluation individuelle et de groupe",
          "Notes de match et temps de jeu",
          "Bilans de fin de cycle et de fin de saison",
        ],
      },
      {
        title: "Le physique",
        items: [
          "Batteries de tests et campagnes de mesure",
          "Comparaison entre deux passages",
          "Suivi des blessures et des retours",
          "Vue catégorie : le groupe situé d'un coup d'œil",
        ],
      },
    ],
    steps: [
      {
        title: "Faites l'appel",
        text: "Chaque séance et chaque match remontent leur présence sans saisie supplémentaire.",
      },
      {
        title: "Évaluez sur vos critères",
        text: "Les grilles du club s'appliquent à toutes les catégories, ce qui rend les bilans comparables.",
      },
      {
        title: "Lisez les tendances",
        text: "Assiduité, progression et résultats se croisent sur la fiche du joueur et sur celle de la catégorie.",
      },
    ],
    outcomes: [
      { value: "3", label: "sources croisées par joueur" },
      { value: "1 geste", label: "pour faire l'appel" },
      { value: "Saison", label: "d'historique conservé" },
    ],
  },

  /* ─────────────────────────────────────────────────────────────────── */
  {
    slug: "structuration",
    icon: FolderTree,
    name: "Structuration",
    desc: "Organigramme, tâches, réunions, formations, qualifications et documents — le fonctionnement du club, écrit.",
    tags: ["Organigramme", "Tâches", "Documents"],

    pole: "Pôle administratif",
    tagline: "Le fonctionnement du club, écrit noir sur blanc.",
    intro:
      "Qui fait quoi, avec qui, et pour quand. L'organigramme, les fiches de poste, les tâches, les réunions et les documents forment la mémoire d'organisation du club — celle qui manque toujours quand quelqu'un s'en va.",
    roles: ["Président", "Bureau", "Responsables de pôle"],
    highlights: [
      {
        icon: Network,
        title: "Un organigramme vivant",
        text: "Les unités du club sur un plan clair, avec leurs membres, leurs missions et les liens transverses entre pôles.",
      },
      {
        icon: FileText,
        title: "Des fiches de poste",
        text: "Chaque rôle a ses missions et ses responsabilités écrites : un bénévole qui arrive sait exactement ce qu'on attend de lui.",
      },
      {
        icon: ListTodo,
        title: "Des tâches suivies",
        text: "Hiérarchie, projets ou kanban : trois façons de lire la même liste de tâches, avec responsable et échéance.",
      },
      {
        icon: GraduationCap,
        title: "Formations et qualifications",
        text: "Diplômes des éducateurs, formations en cours, échéances de recyclage : le club sait où il en est de ses obligations.",
      },
    ],
    capabilities: [
      {
        title: "L'organisation",
        items: [
          "Organigramme des unités et des pôles",
          "Fiches de poste et missions rattachées",
          "Membres et responsables par unité",
          "Relations transverses entre pôles",
        ],
      },
      {
        title: "Le pilotage",
        items: [
          "Tâches avec responsable, échéance et statut",
          "Vues hiérarchie / projets / kanban",
          "Objectifs techniques revus périodiquement",
          "Réunions, ordres du jour et comptes rendus",
        ],
      },
      {
        title: "La mémoire",
        items: [
          "Bibliothèque de documents du club",
          "Règlements intérieurs et procédures",
          "Qualifications et échéances de formation",
          "Archives par saison",
        ],
      },
    ],
    steps: [
      {
        title: "Dessinez l'organigramme",
        text: "Posez les unités du club et rattachez-y les personnes de l'annuaire.",
      },
      {
        title: "Écrivez les rôles",
        text: "Chaque poste reçoit ses missions ; les tâches récurrentes en découlent naturellement.",
      },
      {
        title: "Faites tourner",
        text: "Tâches, réunions et comptes rendus s'accumulent, et l'organisation cesse de dépendre des personnes.",
      },
    ],
    outcomes: [
      { value: "3", label: "vues sur les tâches" },
      { value: "1", label: "organigramme partagé" },
      { value: "0", label: "procédure perdue" },
    ],
  },

  /* ─────────────────────────────────────────────────────────────────── */
  {
    slug: "finances",
    icon: Wallet,
    name: "Finances",
    desc: "Budget prévisionnel, transactions réelles et collectes, avec la comparaison prévu / réel mois par mois.",
    tags: ["Budget", "Transactions", "Collectes"],

    pole: "Bureau",
    tagline: "Le budget prévu, le budget réel, et l'écart entre les deux.",
    intro:
      "Le club construit son budget prévisionnel, saisit ses transactions réelles et suit ses collectes. La comparaison prévu / réel se fait mois par mois, poste par poste — de quoi présenter des chiffres solides en assemblée générale.",
    roles: ["Trésorier", "Président", "Bureau"],
    highlights: [
      {
        icon: PiggyBank,
        title: "Un budget prévisionnel construit",
        text: "Recettes et dépenses par poste, réparties sur les mois de la saison, avec plusieurs brouillons avant validation.",
      },
      {
        icon: Receipt,
        title: "Les transactions réelles",
        text: "Chaque entrée et chaque sortie est enregistrée, catégorisée et rattachée au poste budgétaire correspondant.",
      },
      {
        icon: BarChart3,
        title: "Prévu / réel, mois par mois",
        text: "L'écart se lit immédiatement : quel poste dérape, quel mois pèse, où le club a de la marge.",
      },
      {
        icon: HandCoins,
        title: "Les collectes suivies",
        text: "Cotisations, tournois, buvette, actions ponctuelles : ce qui est encaissé, ce qui reste à recouvrer.",
      },
    ],
    capabilities: [
      {
        title: "Le prévisionnel",
        items: [
          "Postes de recettes et de dépenses",
          "Répartition mensuelle sur la saison",
          "Brouillons multiples et version validée",
          "Comparaison entre deux saisons",
        ],
      },
      {
        title: "Le réel",
        items: [
          "Saisie des transactions avec justificatif",
          "Demandes de transaction et validation",
          "Historique des décisions (accord / refus)",
          "Rattachement au poste budgétaire",
        ],
      },
      {
        title: "Le pilotage",
        items: [
          "Tableau de bord prévu / réel",
          "Suivi mensuel et cumul saison",
          "Collectes et restes à encaisser",
          "Exports pour l'assemblée générale",
        ],
      },
    ],
    steps: [
      {
        title: "Construisez le prévisionnel",
        text: "Postes, montants et répartition mensuelle — en brouillon, jusqu'à validation par le bureau.",
      },
      {
        title: "Enregistrez le réel",
        text: "Les transactions arrivent au fil de l'eau, avec demande et validation quand c'est nécessaire.",
      },
      {
        title: "Suivez l'écart",
        text: "Chaque mois, le club voit où il en est par rapport à ce qu'il avait prévu.",
      },
    ],
    outcomes: [
      { value: "12", label: "mois suivis" },
      { value: "2", label: "vues : prévu et réel" },
      { value: "AG", label: "chiffres prêts à présenter" },
    ],
  },

  /* ─────────────────────────────────────────────────────────────────── */
  {
    slug: "communication",
    icon: MessageSquare,
    name: "Communication",
    desc: "Messagerie par groupe, sondages, convocations et courrier sortant vers les joueurs, le staff et les parents.",
    tags: ["Messagerie", "Sondages", "Convocations"],

    pole: "Pôle administratif",
    tagline: "Parler à la bonne personne, au bon moment, au bon endroit.",
    intro:
      "La communication du club quitte les groupes de messagerie personnels. Les conversations suivent les catégories, les séances et les matchs ; les convocations, les sondages et le courrier partent depuis la plateforme, à qui de droit.",
    roles: ["Éducateurs", "Secrétariat", "Dirigeants", "Parents"],
    highlights: [
      {
        icon: MessageSquare,
        title: "Une messagerie structurée",
        text: "Les conversations sont rattachées à un groupe, une séance ou un match — plus de fil unique où tout se mélange.",
      },
      {
        icon: Send,
        title: "Des convocations propres",
        text: "Convocation de match envoyée au groupe concerné, avec lieu, heure et rendez-vous. Les réponses reviennent au même endroit.",
      },
      {
        icon: Vote,
        title: "Des sondages rapides",
        text: "Disponibilités, participation à un tournoi, choix d'une date : la réponse se collecte en un clic, le résultat se lit tout de suite.",
      },
      {
        icon: Bell,
        title: "Le courrier sortant",
        text: "Informations officielles vers les licenciés et les parents, avec la trace de ce qui a été envoyé et à qui.",
      },
    ],
    capabilities: [
      {
        title: "Les échanges",
        items: [
          "Conversations par groupe et par catégorie",
          "Fils rattachés à une séance ou à un match",
          "Messages du staff entre eux",
          "Historique consultable",
        ],
      },
      {
        title: "Les demandes",
        items: [
          "Convocations de match et de séance",
          "Sondages de disponibilité",
          "Réponses centralisées, sans relance manuelle",
          "Rappels automatiques avant échéance",
        ],
      },
      {
        title: "Le club vers l'extérieur",
        items: [
          "Courrier sortant vers les licenciés et les parents",
          "Diffusion ciblée par catégorie ou par rôle",
          "Traçabilité des envois",
          "Informations officielles et documents joints",
        ],
      },
    ],
    steps: [
      {
        title: "Les groupes existent déjà",
        text: "Catégories, staffs et équipes viennent de l'annuaire : rien à recréer pour commencer à écrire.",
      },
      {
        title: "Envoyez au bon cercle",
        text: "Message, convocation ou sondage partent vers la catégorie, le groupe ou le rôle concerné.",
      },
      {
        title: "Récupérez les réponses",
        text: "Disponibilités et confirmations reviennent au même endroit — la liste se fait toute seule.",
      },
    ],
    outcomes: [
      { value: "3", label: "types de conversations" },
      { value: "1 clic", label: "pour répondre à un sondage" },
      { value: "0", label: "groupe de messagerie perso" },
    ],
  },
]

export function findModule(slug: string | undefined): LandingModule | undefined {
  return MODULES.find((m) => m.slug === slug)
}

/** The module before / after in the grid — used by the detail page footer.
 *  Wraps around, so there is never a dead end. */
export function siblingModules(slug: string) {
  const i = MODULES.findIndex((m) => m.slug === slug)
  if (i < 0) return { prev: undefined, next: undefined }
  return {
    prev: MODULES[(i - 1 + MODULES.length) % MODULES.length],
    next: MODULES[(i + 1) % MODULES.length],
  }
}
