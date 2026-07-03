import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  ArrowRight,
  CalendarRange,
  CheckCircle2,
  CircleDashed,
  Plus,
  Scale,
  WalletCards,
} from "lucide-react"

import { fmt } from "@/lib/format"
import { useData } from "@/data/useData"
import { draftTotals } from "@/data/seed/budget2"
import { fmtDateRange } from "@/features/budget2/helpers"
import { CreateSeasonModal } from "@/features/budget2/CreateSeasonModal"
import { PageHeader } from "@/components/kit/PageHeader"

/**
 * Level 1 — Budget home. A grid of season cards (navigable) plus "Créer une
 * nouvelle saison". Each card shows the season name, its date range and whether
 * it already has a validated reference budget. Budget is prepared upstream, so
 * the tool is multi-season (unlike Transactions, which stays on the active one).
 */
export function Budget2SeasonsScreen() {
  const navigate = useNavigate()
  const { budget2 } = useData()
  const { seasons, drafts, lines } = budget2

  const [createOpen, setCreateOpen] = useState(false)

  const cards = useMemo(
    () =>
      seasons.map((season) => {
        const seasonDrafts = drafts.filter((d) => d.season_id === season.id)
        const validated = seasonDrafts.find((d) => d.status === "valide")
        const totals = validated ? draftTotals(lines, validated.id) : null
        return { season, count: seasonDrafts.length, validated, totals }
      }),
    [seasons, drafts, lines],
  )

  const open = (seasonId: string) => navigate(`/budget2/${seasonId}/brouillon`)

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Budget"
        subtitle="Préparez le budget prévisionnel de chaque saison — un brouillon à la fois, validé en référence."
        actions={
          <>
            <button
              type="button"
              onClick={() => navigate("/budget2/comparaison")}
              className="inline-flex items-center gap-2 rounded-md border border-input px-3.5 py-2 font-ui text-sm font-medium text-ink-subtle transition-colors hover:border-border-strong hover:text-ink"
            >
              <Scale size={16} /> Comparer
            </button>
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="inline-flex items-center gap-2 rounded-md bg-brand px-4 py-2 font-ui text-sm font-medium text-ink-inverted shadow-glow transition-colors hover:bg-brand-dim"
            >
              <Plus size={16} /> Créer une nouvelle saison
            </button>
          </>
        }
      />

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map(({ season, count, validated, totals }) => (
          <div
            key={season.id}
            className="group relative flex flex-col overflow-hidden rounded-lg border border-border bg-background transition-colors hover:border-border-strong"
          >
            {/* Fluid fill: surface descends top→bottom on hover */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 origin-top scale-y-0 bg-surface transition-transform duration-[260ms] ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:scale-y-100"
            />
            <button
              type="button"
              onClick={() => open(season.id)}
              className="relative z-10 flex flex-1 flex-col p-5 text-left"
            >
              <div className="mb-4 flex items-start justify-between gap-2">
                <span className="flex size-10 items-center justify-center rounded-md bg-surface-nested text-ink-muted transition-colors group-hover:text-brand-blue-600">
                  <WalletCards size={18} strokeWidth={2} />
                </span>
                {validated ? (
                  <span className="inline-flex items-center gap-1.5 rounded-pill border border-success/25 bg-success/10 px-2.5 py-1 font-ui text-[0.62rem] font-medium tracking-[0.06em] text-success uppercase">
                    <CheckCircle2 size={12} /> Budget validé
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-pill border border-border bg-accent px-2.5 py-1 font-ui text-[0.62rem] font-medium tracking-[0.06em] text-ink-muted uppercase">
                    <CircleDashed size={12} /> À préparer
                  </span>
                )}
              </div>

              <h3 className="font-ui text-[1.15rem] font-medium leading-tight text-ink transition-colors group-hover:text-brand-blue-600">
                {season.label}
              </h3>
              <div className="mt-1.5 flex items-center gap-1.5 font-body text-[0.78rem] text-ink-muted">
                <CalendarRange size={13} />
                {fmtDateRange(season.start_date, season.end_date)}
              </div>

              <div className="mt-auto flex items-end justify-between gap-3 pt-5">
                <div>
                  <div className="font-ui text-[0.95rem] font-medium tabular-nums text-ink">
                    {count}
                  </div>
                  <div className="font-ui text-[0.58rem] font-medium tracking-[0.1em] text-ink-disabled uppercase">
                    {count > 1 ? "Brouillons" : "Brouillon"}
                  </div>
                </div>
                {totals ? (
                  <div className="text-right">
                    <div
                      className={
                        "font-ui text-[0.95rem] font-medium tabular-nums " +
                        (totals.solde >= 0 ? "text-success" : "text-danger")
                      }
                    >
                      {(totals.solde >= 0 ? "+" : "") + fmt(totals.solde)}
                    </div>
                    <div className="font-ui text-[0.58rem] font-medium tracking-[0.1em] text-ink-disabled uppercase">
                      Solde prév.
                    </div>
                  </div>
                ) : (
                  <span className="inline-flex items-center gap-1 font-ui text-[0.72rem] font-medium tracking-[0.04em] text-info uppercase">
                    Ouvrir <ArrowRight size={13} />
                  </span>
                )}
              </div>
            </button>
          </div>
        ))}

        {/* Create card — dashed affordance at the end of the grid */}
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="flex min-h-[188px] flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border-strong text-ink-muted transition-colors hover:border-border-focus hover:bg-surface-hover hover:text-ink"
        >
          <span className="flex size-10 items-center justify-center rounded-md bg-surface-nested">
            <Plus size={18} />
          </span>
          <span className="font-ui text-[0.82rem] font-medium">
            Nouvelle saison
          </span>
        </button>
      </div>

      <CreateSeasonModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(id) => open(id)}
      />
    </div>
  )
}
