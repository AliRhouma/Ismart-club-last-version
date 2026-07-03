import {
  Home,
  Users,
  UserCog,
  PersonStanding,
  UserCheck,
  ShieldCheck,
  Calendar,
  Upload,
  Database,
  Gauge,
  Layers,
  CalendarDays,
  PlayCircle,
  Trophy,
  Network,
  Gamepad2,
  Target,
  Briefcase,
  Wallet,
  WalletCards,
  FileText,
  Landmark,
  ArrowLeftRight,
  Send,
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
  { type: "item", label: "Importer des données", path: "/importer", icon: Upload },
  { type: "item", label: "Données Ouvertes", path: "/donnees-ouvertes", icon: Database },

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
    ],
  },

  {
    type: "group",
    label: "Finance",
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
    type: "group",
    label: "Gestion",
    icon: Briefcase,
    key: "gestion",
    children: [
      { type: "item", label: "Documents", path: "/documents", icon: FileText },
    ],
  },
]

/** Flattened list of every leaf route — consumed by the router. */
export const navLeaves: NavLeaf[] = navTree.flatMap((node) =>
  node.type === "group" ? node.children : [node],
)
