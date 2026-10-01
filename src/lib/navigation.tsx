import {
  Activity,
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
  Dumbbell,
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
  IdCard,
  Landmark,
  ArrowLeftRight,
  Send,
  Building2,
  Megaphone,
  Inbox,
  Swords,
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
  /** Active only on an exact match (a space root that owns sub-routes). */
  exact?: boolean
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
      { type: "item", label: "Performances", path: "/pole-technique/performances", icon: Activity },
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
      { type: "item", label: "Fiche de poste", path: "/structuration/fiches-poste", icon: IdCard },
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

/**
 * The parent space — the narrowest of the three. `/parent` is the family
 * accueil (the children); everything below it belongs to ONE child and carries
 * his id in the URL (`/parent/u10-j7/planification`), so "se connecter en tant
 * que…" is a plain link and the space keeps no active-child state.
 */
export function parentNavTreeFor(enfantId: string): NavNode[] {
  const base = `/parent/${enfantId}`
  return [
    { type: "item", label: "Mes enfants", path: "/parent", icon: Home, exact: true },
    {
      type: "item",
      label: "Planification",
      path: `${base}/planification`,
      icon: Calendar,
    },
    {
      type: "item",
      label: "Séances",
      path: `${base}/seances`,
      icon: Dumbbell,
    },
    { type: "item", label: "Matchs", path: `${base}/matchs`, icon: Swords },
    // Familiale, pas scopée à un enfant : la boîte réunit les conversations
    // des trois enfants (l'enfant sert de filtre, pas de compte).
    {
      type: "item",
      label: "Messagerie",
      path: "/parent/messagerie",
      icon: MessageSquare,
    },
  ]
}

/** Static shape of the tree — the top bar reads it to title the current page. */
export const parentNavTree: NavNode[] = [
  { type: "item", label: "Mes enfants", path: "/parent", icon: Home, exact: true },
  {
    type: "item",
    label: "Planification",
    path: "/parent/planification",
    icon: Calendar,
  },
  { type: "item", label: "Séances", path: "/parent/seances", icon: Dumbbell },
  { type: "item", label: "Matchs", path: "/parent/matchs", icon: Swords },
  {
    type: "item",
    label: "Messagerie",
    path: "/parent/messagerie",
    icon: MessageSquare,
  },
]

/** Sections of the parent space — never mistaken for a child's id. */
const PARENT_SECTIONS = ["planification", "seances", "matchs", "messagerie"]

/**
 * "/parent/u10-j7/planification/seance/x" → "/parent/planification/seance/x",
 * so a child-scoped URL still resolves against the static leaves above. A URL
 * that already names a section ("/parent/seances") is left untouched.
 */
export function normalizeParentPath(pathname: string): string {
  // La messagerie est familiale : son éventuel second segment n'est qu'un
  // filtre par enfant, pas un compte — elle se replie sur sa propre feuille.
  if (pathname.startsWith("/parent/messagerie")) return "/parent/messagerie"
  const m = pathname.match(/^\/parent\/([^/]+)(\/.*)?$/)
  if (!m || PARENT_SECTIONS.includes(m[1])) return pathname
  return `/parent${m[2] ?? ""}`
}

export const parentNavLeaves: NavLeaf[] = parentNavTree.flatMap((node) =>
  node.type === "group" ? node.children : [node],
)

/** Where each role lands after signing in. */
export const HOME_PATH: Record<"admin" | "sponsor" | "parent", string> = {
  admin: "/",
  sponsor: "/sponsor/partenaires",
  parent: "/parent",
}

/** The nav tree each space renders in the sidebar. */
export const NAV_TREE: Record<"admin" | "sponsor" | "parent", NavNode[]> = {
  admin: navTree,
  sponsor: sponsorNavTree,
  parent: parentNavTree,
}

/** Flat leaves per space — the top bar reads them to title the current page. */
export const NAV_LEAVES: Record<"admin" | "sponsor" | "parent", NavLeaf[]> = {
  admin: navLeaves,
  sponsor: sponsorNavLeaves,
  parent: parentNavLeaves,
}

/** Sidebar wordmark subtitle per space. */
export const SPACE_SUBTITLE: Record<"admin" | "sponsor" | "parent", string> = {
  admin: "Plateforme club",
  sponsor: "Espace sponsor",
  parent: "Espace parent",
}
