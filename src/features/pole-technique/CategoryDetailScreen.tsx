import { Link, useParams } from "react-router-dom"
import {
  BarChart3,
  CalendarDays,
  Layers,
  Network,
  PersonStanding,
  PlayCircle,
  TrendingUp,
  Trophy,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { BackButton } from "@/components/kit/BackButton"
import { EmptyState } from "@/components/kit/EmptyState"
import { Crumbs } from "@/features/budget2/ui"
import {
  CATEGORY_SEASON,
  CATEGORY_TABS,
  findCategory,
  type Category,
  type CategoryTab,
} from "@/features/pole-technique/categories"

/**
 * Pôle Technique → Catégories → a single category's detail page. Reached by
 * clicking a card in CategoriesScreen. Three parts (per product spec):
 *   1. header — a welcome banner + the group's key member counts,
 *   2. tabs   — Résultats / Groupes / Séances / Analyse / Progression /
 *               Programme annuel (route-linked, neutral active à la Budget2Tabs),
 *   3. content — each tab's panel (empty states for now; wired later).
 *
 * Static UI-only (no store): reads from features/pole-technique/categories.
 * References: budget2/Budget2SeasonScreen (header + route tabs) and the
 * budget Stat rhythm for the info tiles.
 */
export function CategoryDetailScreen() {
  const { slug, tab } = useParams()
  const category = findCategory(slug)

  const activeTab: CategoryTab = CATEGORY_TABS.some((t) => t.value === tab)
    ? (tab as CategoryTab)
    : "resultats"

  if (!category) {
    return (
      <div className="mx-auto max-w-6xl">
        <BackButton to="/pole-technique/categories" label="Retour aux catégories" />
        <EmptyState
          icon={Layers}
          title="Catégorie introuvable"
          description="Cette catégorie n'existe pas ou a été supprimée."
        />
      </div>
    )
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div>
        <BackButton to="/pole-technique/categories" label="Retour aux catégories" />
        <Crumbs
          items={[
            { label: "Catégories", to: "/pole-technique/categories" },
            { label: category.name },
          ]}
        />
      </div>

      {/* ── Part 1 — header ─────────────────────────────────────────────── */}
      <CategoryHeader category={category} />

      {/* ── Part 2 — tabs ───────────────────────────────────────────────── */}
      <CategoryTabs slug={category.slug} active={activeTab} />

      {/* ── Part 3 — tab content ────────────────────────────────────────── */}
      <TabContent tab={activeTab} category={category} />
    </div>
  )
}

/* ── Part 1 ──────────────────────────────────────────────────────────────── */

function CategoryHeader({ category }: { category: Category }) {
  return (
    <header className="flex flex-col gap-5 rounded-lg border border-border p-6">
      <div className="flex items-start gap-4">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-md bg-surface-nested text-ink-subtle">
          <Layers size={22} strokeWidth={2} />
        </span>
        <div className="min-w-0">
          <p className="font-ui text-[0.7rem] font-medium tracking-[0.1em] text-ink-disabled uppercase">
            Bienvenue à la page de
          </p>
          <h1 className="mt-1 font-ui text-2xl font-semibold tracking-normal text-ink">
            {category.name}{" "}
            <span className="font-normal text-ink-muted">
              ({CATEGORY_SEASON})
            </span>
          </h1>
        </div>
      </div>

      <div className="border-t border-border pt-5">
        <p className="mb-3 font-ui text-sm font-medium text-ink-subtle">
          Informations du groupe
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <InfoTile icon={PersonStanding} label="Joueurs" value={category.joueurs} />
          <InfoTile icon={UserCog} label="Educateurs" value={category.educateurs} />
          <InfoTile icon={Network} label="Groupes" value={category.groupes} />
        </div>
      </div>
    </header>
  )
}

function InfoTile({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon
  label: string
  value: number
}) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-border px-4 py-3.5">
      <span className="flex size-9 items-center justify-center rounded-md bg-surface-nested text-ink-muted">
        <Icon size={17} strokeWidth={2} />
      </span>
      <div className="min-w-0">
        <div className="font-display text-xl font-semibold tabular-nums text-ink">
          {value}
        </div>
        <div className="font-ui text-[0.72rem] text-ink-muted">{label}</div>
      </div>
    </div>
  )
}

/* ── Part 2 ──────────────────────────────────────────────────────────────── */

function CategoryTabs({
  slug,
  active,
}: {
  slug: string
  active: CategoryTab
}) {
  return (
    <div className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
      <div className="inline-flex gap-1 rounded-pill border border-border p-1">
        {CATEGORY_TABS.map((t) => {
          const on = t.value === active
          return (
            <Link
              key={t.value}
              to={`/pole-technique/categories/${slug}/${t.value}`}
              aria-current={on ? "page" : undefined}
              className={cn(
                "inline-flex shrink-0 items-center rounded-pill px-4 py-1.5 font-ui text-[0.78rem] font-medium whitespace-nowrap transition-colors",
                on
                  ? "border border-border-second bg-surface-nested text-ink"
                  : "border border-transparent text-ink-muted hover:text-ink",
              )}
            >
              {t.label}
            </Link>
          )
        })}
      </div>
    </div>
  )
}

/* ── Part 3 — per-tab content (empty states until wired) ─────────────────── */

const TAB_EMPTY: Record<
  CategoryTab,
  { icon: LucideIcon; title: string; description: string }
> = {
  resultats: {
    icon: Trophy,
    title: "Aucun résultat pour l'instant",
    description:
      "Les résultats des matchs de cette catégorie s'afficheront ici une fois les rencontres jouées.",
  },
  groupes: {
    icon: Users,
    title: "Aucun groupe défini",
    description:
      "Répartissez les joueurs de la catégorie en sous-groupes pour organiser l'entraînement.",
  },
  seances: {
    icon: PlayCircle,
    title: "Aucune séance planifiée",
    description:
      "Les séances d'entraînement programmées pour cette catégorie apparaîtront ici.",
  },
  analyse: {
    icon: BarChart3,
    title: "Analyse indisponible",
    description:
      "Les indicateurs de performance de la catégorie seront calculés dès qu'il y aura des données.",
  },
  progression: {
    icon: TrendingUp,
    title: "Aucune donnée de progression",
    description:
      "Suivez l'évolution des joueurs de la catégorie au fil de la saison.",
  },
  "programme-annuel": {
    icon: CalendarDays,
    title: "Programme annuel non défini",
    description:
      "Construisez le programme de la saison — périodes, objectifs et charges de travail.",
  },
}

function TabContent({
  tab,
  category,
}: {
  tab: CategoryTab
  category: Category
}) {
  const meta = TAB_EMPTY[tab]
  return (
    <section className="rounded-lg border border-border">
      <EmptyState
        icon={meta.icon}
        title={meta.title}
        description={`${meta.description} — ${category.name}, saison ${CATEGORY_SEASON}.`}
      />
    </section>
  )
}
