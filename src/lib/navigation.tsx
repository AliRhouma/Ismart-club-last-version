import {
  ClipboardList,
  Shapes,
  Home,
  Users,
  UserCog,
  PersonStanding,
  UserCheck,
  ShieldCheck,
  Calendar,
  Gauge,
  Layers,
  CalendarDays,
  PlayCircle,
  Trophy,
  Network,
  Gamepad2,
  Target,
  SquarePen,
  MessageSquare,
  Share2,
  Boxes,
  Handshake,
  ListTodo,
  BookOpen,
  GraduationCap,
  Flag,
  Wallet,
  WalletCards,
  FileText,
  Landmark,
  ArrowLeftRight,
  Send,
  Building2,
  Megaphone,
  Inbox,
  Component,
  type LucideIcon,
} from "lucide-react"

/**
 * Single source of truth for the app's left-sidebar navigation.
 * Both the sidebar (src/components/AppSidebar.tsx) and the router
 * (src/App.tsx) read from this tree, so a route and its nav entry can
 * never drift apart. UI language: French (product language).
 */

export type NavLeaf = {
  type: "item"
  label: string
  path: string
  icon: LucideIcon
}

export type NavGroup = {
  type: "group"
  label: string
  icon: LucideIcon
  /** stable key used for collapsible state */
  key: string
  children: NavLeaf[]
}

export type NavNode = NavLeaf | NavGroup

export const navTree: NavNode[] = [
  { type: "item", label: "Accueil", path: "/", icon: Home },

  {
    type: "group",
    label: "Ressources humaines",
    icon: Users,
    key: "ressources-humaines",
    children: [
      { type: "item", label: "Éducateurs", path: "/ressources-humaines/educateurs", icon: UserCog },
      { type: "item", label: "Joueurs", path: "/ressources-humaines/joueurs", icon: PersonStanding },
      { type: "item", label: "Membres", path: "/ressources-humaines/membres", icon: UserCheck },
      { type: "item", label: "Parents", path: "/ressources-humaines/parents", icon: Users },
      { type: "item", label: "Profils", path: "/ressources-humaines/profils", icon: ShieldCheck },
    ],
  },

  { type: "item", label: "Planification", path: "/planification", icon: Calendar },
  { type: "item", label: "Résultats", path: "/resultats", icon: Trophy },

  {
    type: "group",
    label: "Pôle Technique",
    icon: Gauge,
    key: "pole-technique",
    children: [
      { type: "item", label: "Catégories", path: "/pole-technique/categories", icon: Layers },
      { type: "item", label: "Programmation", path: "/pole-technique/programmation", icon: CalendarDays },
      { type: "item", label: "Projet de jeu", path: "/pole-technique/projet-de-jeu", icon: PlayCircle },
      { type: "item", label: "Compétitions", path: "/pole-technique/competitions", icon: Trophy },
      { type: "item", label: "Composition", path: "/pole-technique/composition", icon: Network },
      { type: "item", label: "Consignes", path: "/pole-technique/consignes", icon: Gamepad2 },
      { type: "item", label: "Défis", path: "/pole-technique/defis", icon: Target },
      { type: "item", label: "Procédés", path: "/pole-technique/procedes", icon: Shapes },
      { type: "item", label: "Séances", path: "/pole-technique/seances", icon: ClipboardList },
    ],
  },

  { type: "item", label: "Analyse et Suivi", path: "/analyse-et-suivi", icon: SquarePen },
  { type: "item", label: "Messagerie", path: "/messagerie", icon: MessageSquare },
  { type: "item", label: "Communauté", path: "/communaute", icon: Share2 },
  { type: "item", label: "Sponsoring", path: "/sponsoring", icon: Handshake },

  {
    type: "group",
    label: "Structuration",
    icon: Boxes,
    key: "structuration",
    children: [
      { type: "item", label: "Organigramme", path: "/structuration/organigramme", icon: Network },
      { type: "item", label: "Gestion des tâches", path: "/structuration/taches", icon: ListTodo },
      { type: "item", label: "Réunions", path: "/structuration/reunions", icon: CalendarDays },
      { type: "item", label: "Formations", path: "/structuration/formations", icon: BookOpen },
      { type: "item", label: "Qualifications", path: "/structuration/qualifications", icon: GraduationCap },
      { type: "item", label: "Fiches & Documents", path: "/documents", icon: FileText },
      { type: "item", label: "Projet du club", path: "/structuration/projet-du-club", icon: Flag },
      { type: "item", label: "Objectifs techniques", path: "/structuration/objectifs-techniques", icon: Target },
    ],
  },

  {
    type: "group",
    label: "Finances",
    icon: Landmark,
    key: "finance",
    children: [
      { type: "item", label: "Transactions", path: "/finance/transactions", icon: ArrowLeftRight },
      { type: "item", label: "Demander une transaction", path: "/finance/demande", icon: Send },
      { type: "item", label: "Budget", path: "/budget", icon: Wallet },
      { type: "item", label: "Budget 2", path: "/budget2", icon: WalletCards },
    ],
  },

  {
    type: "item",
    label: "Design System",
    path: "/design-system",
    icon: Component,
  },
]

/** Flattened list of every leaf route — consumed by the router. */
export const navLeaves: NavLeaf[] = navTree.flatMap((node) =>
  node.type === "group" ? node.children : [node],
)

/**
 * The sponsor space — same shell, its own (much shorter) nav. A sponsor signs
 * in to follow the clubs it partners with and the campaigns it runs for them.
 * Kept under /sponsor/* so it never collides with the club's /sponsoring/*.
 */
export const sponsorNavTree: NavNode[] = [
  {
    type: "item",
    label: "Liste des partenaires",
    path: "/sponsor/partenaires",
    icon: Building2,
  },
  {
    type: "item",
    label: "Gérer les campagnes",
    path: "/sponsor/campagnes",
    icon: Megaphone,
  },
  {
    type: "item",
    label: "Mes demandes",
    path: "/sponsor/demandes",
    icon: Inbox,
  },
]

export const sponsorNavLeaves: NavLeaf[] = sponsorNavTree.flatMap((node) =>
  node.type === "group" ? node.children : [node],
)

/** Where each role lands after signing in. */
export const HOME_PATH: Record<"admin" | "sponsor", string> = {
  admin: "/",
  sponsor: "/sponsor/partenaires",
}
