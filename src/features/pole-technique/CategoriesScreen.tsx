import { Layers, PersonStanding, UserCog, Users, Plus, Search } from "lucide-react"
import { useNavigate } from "react-router-dom"

import { PageHeader } from "@/components/kit/PageHeader"
import { Button } from "@/components/ui/button"
import { CATEGORIES } from "@/features/pole-technique/categories"

/**
 * Pôle Technique → Catégories. Static UI-only screen (no store, no logic) —
 * a grid of navigable category cards showing each category's member counts.
 * Each card routes to the category's detail page. Follows the navigable-card
 * anatomy from documents/DocumentsScreen (fluid vertical fill on hover) and the
 * Stat/metric rhythm of the budget feature. Purpose: at a glance, see how many
 * joueurs / éducateurs / staff sit in each category, then drill in.
 */

/** A single count line inside a card. Renders nothing when the value is zero. */
function Metric({
  icon: Icon,
  singular,
  plural,
  value,
}: {
  icon: typeof PersonStanding
  singular: string
  plural: string
  value?: number
}) {
  if (!value) return null
  return (
    <div className="flex items-center justify-between gap-2 py-1.5">
      <span className="flex items-center gap-2 font-body text-[0.82rem] text-ink-muted">
        <Icon size={15} strokeWidth={2} className="text-ink-disabled" />
        {value > 1 ? plural : singular}
      </span>
      <span className="font-ui text-sm font-medium tabular-nums text-ink">
        {value}
      </span>
    </div>
  )
}

export function CategoriesScreen() {
  const navigate = useNavigate()
  const totalJoueurs = CATEGORIES.reduce((s, c) => s + c.joueurs, 0)

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      <PageHeader
        title="Catégories"
        subtitle={`${CATEGORIES.length} catégories · ${totalJoueurs} joueurs répartis`}
        actions={
          <>
            <div className="relative hidden sm:block">
              <Search
                size={15}
                className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-disabled"
              />
              <input
                placeholder="Rechercher…"
                className="h-9 w-56 rounded-md border border-input bg-input-bg pr-3 pl-9 font-body text-sm text-ink outline-none transition-colors placeholder:text-ink-disabled focus:border-border-focus"
              />
            </div>
            <Button>
              <Plus /> Nouvelle catégorie
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CATEGORIES.map((cat) => {
          const members = cat.joueurs + cat.educateurs + cat.staff
          return (
            <div
              key={cat.slug}
              className="group relative flex flex-col overflow-hidden rounded-lg border border-border bg-background transition-colors hover:border-border-strong"
            >
              {/* Fluid fill: surface (#181818) descends from top to bottom on hover */}
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 origin-top scale-y-0 bg-surface transition-transform duration-[260ms] ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:scale-y-100"
              />

              <button
                type="button"
                onClick={() =>
                  navigate(`/pole-technique/categories/${cat.slug}`)
                }
                className="relative z-10 flex flex-1 flex-col p-5 text-left"
              >
                <div className="mb-4 flex items-start justify-between gap-2">
                  <span className="flex size-10 items-center justify-center rounded-md bg-surface-nested text-ink-muted transition-colors group-hover:text-brand-blue-600">
                    <Layers size={18} strokeWidth={2} />
                  </span>
                  <span className="font-ui text-[0.7rem] font-medium tracking-[0.06em] text-ink-disabled uppercase">
                    {members} membre{members > 1 ? "s" : ""}
                  </span>
                </div>

                <h3 className="font-ui text-[0.95rem] font-medium text-ink transition-colors group-hover:text-brand-blue-600">
                  {cat.name}
                </h3>

                <div className="mt-3 flex flex-col divide-y divide-border border-t border-border pt-1">
                  <Metric
                    icon={PersonStanding}
                    singular="Joueur"
                    plural="Joueurs"
                    value={cat.joueurs}
                  />
                  <Metric
                    icon={UserCog}
                    singular="Éducateur"
                    plural="Éducateurs"
                    value={cat.educateurs}
                  />
                  <Metric
                    icon={Users}
                    singular="Staff de l'équipe"
                    plural="Staff de l'équipe"
                    value={cat.staff}
                  />
                </div>
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
