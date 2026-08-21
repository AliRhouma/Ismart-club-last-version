import { useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { MapPin, Trophy } from "lucide-react"

import { cn } from "@/lib/utils"
import { useData } from "@/data/useData"
import type { MatchDetail } from "@/data/seed/matches"
import { PageHeader } from "@/components/kit/PageHeader"
import { Badge } from "@/components/kit/Badge"
import { EmptyState } from "@/components/kit/EmptyState"
import { AdBanner } from "@/features/planification/AdBanner"

/** Full French month names, indexed by (month - 1). */
const FR_MONTHS = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
]

/** "2026-06-21" → "21 juin 2026". */
function frDate(iso: string) {
  const [y, m, d] = iso.split("-").map(Number)
  if (!y || !m || !d) return iso
  return `${d} ${FR_MONTHS[m - 1] ?? ""} ${y}`
}

const ALL = "Toutes"

export function ResultatsScreen() {
  const { matchDetails } = useData()
  const [comp, setComp] = useState<string>(ALL)
  const [cat, setCat] = useState<string>(ALL)

  // Played matches only, newest first.
  const played = useMemo(
    () =>
      matchDetails
        .filter((m) => m.statut === "termine")
        .sort((a, b) => b.dateIso.localeCompare(a.dateIso)),
    [matchDetails],
  )

  // Filter values, in the order they first appear.
  const competitions = useMemo(() => distinct(played, (m) => m.competition), [played])
  const categories = useMemo(() => distinct(played, (m) => m.categorie), [played])

  const rows = useMemo(
    () =>
      played.filter(
        (m) =>
          (comp === ALL || m.competition === comp) &&
          (cat === ALL || m.categorie === cat),
      ),
    [played, comp, cat],
  )

  const resetFilters = () => {
    setComp(ALL)
    setCat(ALL)
  }

  return (
    <>
      <PageHeader
        title="Résultats"
        subtitle="Matchs joués et leurs scores, par compétition et par catégorie."
      />

      {/* Sponsor banner — the planification ad slot, wired to running campaigns. */}
      <div className="mt-6">
        <AdBanner space="match_detail" />
      </div>

      {played.length === 0 ? (
        <div className="mt-8 rounded-lg border border-border">
          <EmptyState
            icon={Trophy}
            title="Aucun résultat"
            description="Les scores des matchs joués apparaîtront ici une fois les rencontres terminées."
          />
        </div>
      ) : (
        <>
          {/* Filters — compétition then catégorie */}
          <div className="mt-6 flex flex-col gap-2.5">
            <FilterRow
              label="Compétition"
              options={competitions}
              value={comp}
              onChange={setComp}
              trailing={
                <span className="ml-auto shrink-0 font-body text-[0.78rem] text-ink-disabled tabular-nums">
                  {rows.length} match{rows.length > 1 ? "s" : ""}
                </span>
              }
            />
            <FilterRow
              label="Catégorie"
              options={categories}
              value={cat}
              onChange={setCat}
            />
          </div>

          {/* Result list */}
          {rows.length === 0 ? (
            <div className="mt-5 rounded-lg border border-border px-4 py-12 text-center">
              <p className="font-body text-sm text-ink-muted">
                Aucun match pour ces filtres.
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="mt-1.5 font-ui text-[0.74rem] font-medium text-info transition-opacity hover:opacity-80"
              >
                Réinitialiser les filtres
              </button>
            </div>
          ) : (
            <div className="mt-5 flex flex-col gap-3">
              {rows.map((m) => (
                <ResultCard key={m.eventId} match={m} />
              ))}
            </div>
          )}
        </>
      )}
    </>
  )
}

/** Distinct non-empty values of a field, first-seen order. */
function distinct(rows: MatchDetail[], pick: (m: MatchDetail) => string | undefined) {
  const seen: string[] = []
  for (const m of rows) {
    const v = pick(m)
    if (v && !seen.includes(v)) seen.push(v)
  }
  return [ALL, ...seen]
}

/** A labelled row of chip filters with an "Toutes" reset option. */
function FilterRow({
  label,
  options,
  value,
  onChange,
  trailing,
}: {
  label: string
  options: string[]
  value: string
  onChange: (v: string) => void
  trailing?: React.ReactNode
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
      <span className="w-20 shrink-0 font-ui text-[0.68rem] tracking-[0.08em] text-ink-disabled uppercase">
        {label}
      </span>
      <div className="flex flex-wrap items-center gap-1.5">
        {options.map((o) => {
          const active = o === value
          return (
            <button
              key={o}
              type="button"
              onClick={() => onChange(o)}
              className={cn(
                "rounded-pill border px-3 py-1 font-ui text-[0.78rem] transition-colors",
                active
                  ? "border-border-second bg-surface-nested text-ink"
                  : "border-border text-ink-muted hover:border-border-strong hover:text-ink",
              )}
            >
              {o}
            </button>
          )
        })}
      </div>
      {trailing}
    </div>
  )
}

/**
 * One played match. A navigable card (fluid `bg-surface` fill reveals on hover)
 * that opens the shared match page — the same detail screen every match uses.
 */
function ResultCard({ match }: { match: MatchDetail }) {
  return (
    <Link
      to={`/planification/match/${match.eventId}`}
      className="group relative block w-full overflow-hidden rounded-lg border border-border bg-background text-left transition-colors hover:border-border-strong"
    >
      {/* Fluid fill: surface (#181818) descends top→bottom on hover. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 origin-top scale-y-0 bg-surface transition-transform duration-[260ms] ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:scale-y-100"
      />

      <div className="relative z-10 flex flex-col gap-4 p-4 sm:p-5">
        {/* Meta row: compétition — right: date & lieu */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {match.competition ? (
            <span className="inline-flex items-center gap-1.5 font-ui text-[0.7rem] tracking-[0.06em] text-ink-subtle uppercase">
              <Trophy size={13} className="text-ink-muted" />
              {match.competition}
            </span>
          ) : null}
          <div className="ml-auto flex items-center gap-3 font-body text-[0.76rem] text-ink-disabled">
            <span className="tabular-nums">{frDate(match.dateIso)}</span>
            {match.location ? (
              <span className="hidden items-center gap-1 sm:inline-flex">
                <MapPin size={13} /> {match.location}
              </span>
            ) : null}
          </div>
        </div>

        {/* Scoreboard: our team (green) — score — opponent (red) */}
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-6">
          <span className="truncate text-right font-ui text-sm text-ink sm:text-base">
            {match.homeTeam}
          </span>

          <div className="flex items-center gap-2 sm:gap-3">
            <span className="font-display text-2xl font-semibold tabular-nums text-team-home sm:text-3xl">
              {match.homeScore}
            </span>
            <span className="text-ink-disabled">–</span>
            <span className="font-display text-2xl font-semibold tabular-nums text-team-away sm:text-3xl">
              {match.awayScore}
            </span>
          </div>

          <span className="truncate text-left font-ui text-sm text-ink-muted sm:text-base">
            {match.awayTeam}
          </span>
        </div>

        {/* Catégorie · poule */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Badge variant="default">{match.categorie}</Badge>
          <span className="rounded-pill border border-brand-blue-600/30 bg-brand-blue-600/10 px-2.5 py-0.5 font-ui text-[0.68rem] whitespace-nowrap text-brand-blue-600">
            {match.groupe}
          </span>
        </div>
      </div>
    </Link>
  )
}
