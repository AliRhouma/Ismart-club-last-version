import { useNavigate } from "react-router-dom"
import {
  Calendar,
  Layers,
  CalendarDays,
  PlayCircle,
  Shapes,
  ClipboardList,
  BarChart3,
  MessageSquare,
  Share2,
  UserCog,
  PersonStanding,
  Trophy,
  FileText,
  Handshake,
  type LucideIcon,
} from "lucide-react"

import { PageHeader } from "@/components/kit/PageHeader"
import { AdBanner } from "@/features/planification/AdBanner"

/**
 * Accueil — the landing screen. A quick-access grid of the club's modules,
 * each card a navigable tile (fluid-fill reveal on hover, per the design
 * system's navigable-card anatomy) that routes to the matching screen.
 */
type Module = {
  label: string
  description: string
  icon: LucideIcon
  path: string
}

const MODULES: Module[] = [
  {
    label: "Planification",
    description: "Planifier et gérer les événements",
    icon: Calendar,
    path: "/planification",
  },
  {
    label: "Catégories",
    description: "Gérer les catégories d'équipes",
    icon: Layers,
    path: "/pole-technique/categories",
  },
  {
    label: "Programmation",
    description: "Planifier le programme",
    icon: CalendarDays,
    path: "/pole-technique/programmation",
  },
  {
    label: "Projet de jeu",
    description: "Définir le projet de jeu de l'équipe",
    icon: PlayCircle,
    path: "/pole-technique/projet-de-jeu",
  },
  {
    label: "Procédés",
    description: "Créer et gérer les tactiques",
    icon: Shapes,
    path: "/pole-technique/procedes",
  },
  {
    label: "Séances",
    description: "Gérer les séances d'entraînement",
    icon: ClipboardList,
    path: "/planification",
  },
  {
    label: "Évaluations",
    description: "Évaluer la performance de votre équipe",
    icon: BarChart3,
    path: "/analyse-et-suivi",
  },
  {
    label: "Messagerie",
    description: "Messagerie et discussions",
    icon: MessageSquare,
    path: "/messagerie",
  },
  {
    label: "Communauté",
    description: "Partager et consulter",
    icon: Share2,
    path: "/communaute",
  },
  {
    label: "Éducateurs",
    description: "Gérer le staff et les entraîneurs",
    icon: UserCog,
    path: "/ressources-humaines/educateurs",
  },
  {
    label: "Joueurs",
    description: "Consulter et gérer l'effectif",
    icon: PersonStanding,
    path: "/ressources-humaines/joueurs",
  },
  {
    label: "Résultats",
    description: "Suivre les scores des matchs",
    icon: Trophy,
    path: "/resultats",
  },
  {
    label: "Réunions",
    description: "Organiser et planifier les réunions",
    icon: CalendarDays,
    path: "/structuration/reunions",
  },
  {
    label: "Documents",
    description: "Créer et gérer les documents du club",
    icon: FileText,
    path: "/documents",
  },
  {
    label: "Sponsoring",
    description: "Gérer les offres et partenaires",
    icon: Handshake,
    path: "/sponsoring",
  },
]

export function AccueilScreen() {
  const navigate = useNavigate()

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      <PageHeader
        title="Accès rapide"
        subtitle="Découvrez toutes les fonctionnalités disponibles pour votre profil"
      />

      {/* Sponsor leaderboard — sticky so it stays visible while the modules
          scroll. The page-colored backing (negative margins cancel the shell
          padding) keeps scrolled content from peeking past the banner's
          rounded corners once it's pinned. Full-width on web, copy collapses
          on mobile. Reads the live running campaigns (shared ad pool). */}
      <div className="sticky top-0 z-20 -mx-6 bg-background px-6 py-2 md:-mx-8 md:px-8">
        <AdBanner space="accueil" />
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="font-ui text-[0.72rem] font-medium uppercase tracking-[0.08em] text-ink-muted">
          Modules disponibles
        </h2>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MODULES.map((mod) => (
            <button
              key={mod.label}
              type="button"
              onClick={() => navigate(mod.path)}
              className="group relative flex flex-col overflow-hidden rounded-lg border border-border bg-background text-left transition-colors hover:border-border-strong"
            >
              {/* Fluid fill: surface (#181818) descends top→bottom on hover */}
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 origin-top scale-y-0 bg-surface transition-transform duration-[260ms] ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:scale-y-100"
              />
              <div className="relative z-10 flex flex-1 flex-col p-5">
                <span className="mb-4 flex size-11 items-center justify-center rounded-md bg-surface-nested text-ink-muted transition-colors group-hover:text-brand-blue-600">
                  <mod.icon size={20} strokeWidth={2} />
                </span>
                <h3 className="font-ui text-[0.95rem] font-medium text-ink transition-colors group-hover:text-brand-blue-600">
                  {mod.label}
                </h3>
                <p className="mt-1.5 font-body text-[0.82rem] text-ink-muted">
                  {mod.description}
                </p>
              </div>
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}
