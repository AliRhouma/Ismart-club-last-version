import { useMemo, useState, type ReactNode } from "react"
import {
  Activity,
  BarChart3,
  GitCompareArrows,
  Home,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  Plane,
  Scale,
  TrendingUp,
  Trophy,
  Users,
  Wallet,
} from "lucide-react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { cn } from "@/lib/utils"
import { fmt, fmtShort } from "@/lib/format"
import { signed } from "@/features/budget2/suivi"
import type { Budget2Season } from "@/data/seed/budget2"

/* ═══════════════════════════════════════════════════════════════════════════
 * Budget 2 — Analyse (tableau de bord visuel du trésorier).
 *
 * A UI-ONLY, chart-driven analysis surface. Every figure below is illustrative
 * ("imagination") fake data — there is NO business logic here, only local
 * filters that re-slice the same seeded datasets. It answers the questions a
 * treasurer actually asks:
 *   · Comparer le coût de deux équipes, poste par poste.
 *   · Suivre les dépenses mensuelles, filtrées par équipe.
 *   · Comparer les trajectoires de dépense de chaque équipe.
 *   · Comparer le coût moyen d'un match à domicile vs à l'extérieur.
 *   · Analyser la répartition des dépenses par catégorie.
 *   · Confronter le prévu au réel, catégorie par catégorie.
 *
 * Charts are drawn with Recharts. Colours follow the design-system data-viz
 * language: a validated categorical palette for team series (fixed per team,
 * never re-assigned when a filter hides one), neutral grey for the "prévu"
 * reference and brand-blue for the "réel", genuine status green/red for écarts.
 * ═══════════════════════════════════════════════════════════════════════════ */

/* ── Data-viz chrome (design tokens, as hex for the SVG layer) ─────────────── */
const AXIS = "#a3a3a3" // --ink-muted
const GRID = "#252525" // --border
const PREVU = "#737373" // neutral-400 — the plan / reference
const REEL = "#0091ff" // --brand-blue-600 — the realised
const HOME_C = "#3987e5" // domicile
const AWAY_C = "#c98500" // extérieur
/* Group A / Group B series — a group aggregates several teams, so it takes its
   own fixed colour rather than any single team's. */
const A_C = "#60a5fa" // --info
const B_C = "#0091ff" // --brand-blue-600

/* Validated categorical palette (dark surface #181818 — see dataviz validator).
   Assigned to teams in fixed order; a hidden team never repaints the others. */
const SERIES = ["#3987e5", "#199e70", "#c98500", "#9085e9", "#e66767", "#d95926"]
/* Category slots — the validated 8-hue dark set (labels carry identity). */
const CAT_COLORS = [
  "#3987e5", "#199e70", "#c98500", "#9085e9",
  "#e66767", "#d95926", "#d55181", "#4f9d3a",
]

/* ── Referentials ──────────────────────────────────────────────────────────── */
type Team = { id: string; name: string; base: number; color: string }
const TEAMS: Team[] = [
  { id: "seniors", name: "Séniors", base: 92000, color: SERIES[0] },
  { id: "u19", name: "U19", base: 58000, color: SERIES[1] },
  { id: "u17", name: "U17", base: 49000, color: SERIES[2] },
  { id: "u15", name: "U15", base: 39000, color: SERIES[3] },
  { id: "u13", name: "U13", base: 27000, color: SERIES[4] },
  { id: "u11", name: "U11", base: 20000, color: SERIES[5] },
]
const teamById = new Map(TEAMS.map((t) => [t.id, t]))

const MONTHS = [
  "Août", "Sept", "Oct", "Nov", "Déc", "Janv",
  "Févr", "Mars", "Avr", "Mai", "Juin",
]
/* Season spend shape — pre-season équipement spike, spring tournament bump. */
const MONTH_SHAPE = [0.14, 0.1, 0.075, 0.07, 0.06, 0.07, 0.08, 0.095, 0.11, 0.1, 0.1]

const CATEGORIES = [
  "Équipements", "Déplacements", "Arbitrage", "Stages & tournois",
  "Médical", "Restauration", "Hébergement", "Matériel",
]
const CAT_SHAPE = [0.22, 0.2, 0.09, 0.15, 0.08, 0.1, 0.1, 0.06]

/* ── Derived fake matrices (pure shaping of the bases — no business logic) ──── */
const round50 = (n: number) => Math.round(n / 50) * 50

/** team → month → dépense réelle. */
const teamMonth: Record<string, number[]> = {}
/** team → category → dépense réelle. */
const teamCat: Record<string, number[]> = {}
TEAMS.forEach((t, ti) => {
  teamMonth[t.id] = MONTH_SHAPE.map((w, mi) =>
    round50(t.base * w * (1 + 0.18 * Math.sin((mi + ti * 1.6) * 0.9))),
  )
  teamCat[t.id] = CAT_SHAPE.map((w, ci) =>
    round50(t.base * w * (1 + 0.16 * Math.sin((ci + 1) * (ti + 1) * 0.7))),
  )
})

const teamTotal = (id: string) => teamCat[id].reduce((s, v) => s + v, 0)
const grandTotal = TEAMS.reduce((s, t) => s + teamTotal(t.id), 0)

/* Prévu par catégorie — derived from réel with a per-category drift so the
   comparison shows a believable mix of savings and overruns. */
const reelByCat = CATEGORIES.map((_, ci) =>
  TEAMS.reduce((s, t) => s + teamCat[t.id][ci], 0),
)
const PREVU_FACTOR = [0.92, 1.06, 1.0, 0.86, 1.12, 0.95, 0.9, 1.14]
const prevuByCat = reelByCat.map((v, ci) => round50(v * PREVU_FACTOR[ci]))
const prevuTotal = prevuByCat.reduce((s, v) => s + v, 0)

/* Coût moyen par match — domicile vs extérieur (extérieur = déplacement +
   hébergement, donc plus cher). Base costs scaled by the team's weight. */
const MATCH_TYPES = ["Transport", "Arbitrage", "Repas", "Hébergement", "Divers"]
const HOME_COST = [45, 190, 110, 0, 70]
const AWAY_COST = [340, 190, 210, 260, 95]

/* ════════════════════════════════════════════════════════════════════════════
 * Page
 * ════════════════════════════════════════════════════════════════════════════ */
export function Budget2Analyse({ season }: { season: Budget2Season }) {
  const topTeam = [...TEAMS].sort((a, b) => teamTotal(b.id) - teamTotal(a.id))[0]
  const tauxReal = Math.round((grandTotal / prevuTotal) * 100)

  return (
    <div className="mt-6 flex flex-col gap-4 pb-16">
      {/* ── Intro ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-ui text-[1.05rem] font-medium text-ink">
            Analyse des dépenses
          </h2>
          <p className="mt-1 max-w-xl font-body text-[0.82rem] text-ink-muted">
            Lecture visuelle du coût des équipes, de la répartition par catégorie
            et de l'écart prévu / réel — saison {season.label}.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-pill border border-border px-3 py-1.5 font-ui text-[0.72rem] text-ink-muted">
          <Activity size={13} className="text-info" /> Données de démonstration
        </span>
      </div>

      {/* ── KPI row ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          icon={Wallet}
          label="Dépenses réelles"
          value={fmt(grandTotal)}
          sub={`sur ${fmtShort(prevuTotal)} prévu`}
        />
        <Kpi
          icon={Users}
          label="Coût moyen / équipe"
          value={fmt(Math.round(grandTotal / TEAMS.length))}
          sub={`${TEAMS.length} équipes`}
        />
        <Kpi
          icon={Trophy}
          label="Équipe la plus coûteuse"
          value={topTeam.name}
          sub={`${fmtShort(teamTotal(topTeam.id))} TND`}
          accent={topTeam.color}
        />
        <Kpi
          icon={Activity}
          label="Taux de réalisation"
          value={`${tauxReal}%`}
          sub={grandTotal > prevuTotal ? "budget dépassé" : "sous le budget"}
          tone={grandTotal > prevuTotal ? "negative" : "positive"}
        />
      </div>

      {/* ── Sections ──────────────────────────────────────────────────────── */}
      <TeamCompareSection />
      <MonthlyByTeamSection />
      <TeamLinesSection />
      <HomeAwaySection />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <CategoryBreakdownSection />
        <PlanVsRealSection />
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════════════
 * 1 — Comparaison de groupes d'équipes (grouped horizontal bars, par catégorie)
 *
 * Each side is a MULTI-selection, so any split works — 1 vs 3, 2 vs 2, 1 vs 5.
 * Because a raw total would flatter the smaller group, a Total / Moyenne par
 * équipe toggle makes uneven splits comparable.
 * ════════════════════════════════════════════════════════════════════════════ */
function TeamCompareSection() {
  const [groupA, setGroupA] = useState<string[]>(["seniors"])
  const [groupB, setGroupB] = useState<string[]>(["u17", "u15", "u13"])
  const [mode, setMode] = useState<"total" | "moyenne">("total")

  /* A team belongs to at most one group; each group keeps at least one team. */
  const assign = (id: string, target: "A" | "B") => {
    const [sel, setSel, other, setOther] =
      target === "A"
        ? ([groupA, setGroupA, groupB, setGroupB] as const)
        : ([groupB, setGroupB, groupA, setGroupA] as const)
    if (sel.includes(id)) {
      if (sel.length > 1) setSel(sel.filter((x) => x !== id))
      return
    }
    if (other.includes(id) && other.length <= 1) return // the other group would empty
    setOther(other.filter((x) => x !== id))
    setSel([...sel, id])
  }

  const data = useMemo(() => {
    const valueOf = (ids: string[], ci: number) => {
      const sum = ids.reduce((s, id) => s + teamCat[id][ci], 0)
      return mode === "moyenne" ? Math.round(sum / ids.length) : sum
    }
    return CATEGORIES.map((cat, ci) => ({
      cat,
      a: valueOf(groupA, ci),
      b: valueOf(groupB, ci),
    }))
  }, [groupA, groupB, mode])

  const totA = data.reduce((s, r) => s + r.a, 0)
  const totB = data.reduce((s, r) => s + r.b, 0)
  const diff = totA - totB
  const nameOf = (ids: string[]) => ids.map((id) => teamById.get(id)!.name).join(" · ")
  const labelA = nameOf(groupA)
  const labelB = nameOf(groupB)

  return (
    <Block
      icon={GitCompareArrows}
      title="Comparaison d'équipes"
      subtitle="Composez deux groupes — 1 vs 3, 2 vs 2…"
      right={
        <Segmented2
          value={mode}
          onChange={(v) => setMode(v as "total" | "moyenne")}
          options={[
            { value: "total", label: "Total" },
            { value: "moyenne", label: "Moyenne / équipe" },
          ]}
        />
      }
    >
      {/* Group composers */}
      <div className="grid grid-cols-1 gap-3 border-b border-border p-4 sm:grid-cols-2">
        <GroupPicker label="Groupe A" color={A_C} sel={groupA} onToggle={(id) => assign(id, "A")} />
        <GroupPicker label="Groupe B" color={B_C} sel={groupB} onToggle={(id) => assign(id, "B")} />
      </div>

      <div className="grid grid-cols-1 gap-4 p-4 lg:grid-cols-[1fr_260px]">
        <div className="h-[340px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 4, right: 12, bottom: 4, left: 8 }}
              barGap={2}
              barCategoryGap="26%"
            >
              <CartesianGrid horizontal={false} stroke={GRID} />
              <XAxis
                type="number"
                tickFormatter={kFmt}
                tick={{ fill: AXIS, fontSize: 11 }}
                axisLine={{ stroke: GRID }}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="cat"
                width={116}
                tick={{ fill: AXIS, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: "rgba(255,255,255,0.04)" }}
                content={<ChartTooltip />}
              />
              <Bar dataKey="a" name={`A · ${labelA}`} fill={A_C} radius={[0, 3, 3, 0]} maxBarSize={13} />
              <Bar dataKey="b" name={`B · ${labelB}`} fill={B_C} radius={[0, 3, 3, 0]} maxBarSize={13} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Face-à-face summary */}
        <div className="flex flex-col justify-center gap-3">
          <FaceRow color={A_C} name={labelA} count={groupA.length} value={totA} />
          <FaceRow color={B_C} name={labelB} count={groupB.length} value={totB} />
          <div className="mt-1 rounded-lg border border-border px-4 py-3">
            <div className="font-ui text-[0.62rem] font-medium tracking-[0.1em] text-ink-muted uppercase">
              Différence {mode === "moyenne" ? "(moyenne)" : "(total)"}
            </div>
            <div
              className={cn(
                "mt-1 font-display text-[1.5rem] leading-none font-semibold tabular-nums",
                diff === 0 ? "text-ink" : diff > 0 ? "text-danger" : "text-success",
              )}
            >
              {signed(diff)} TND
            </div>
            <div className="mt-1 font-body text-[0.72rem] text-ink-disabled">
              {diff === 0
                ? "coût identique"
                : `Le groupe A ${diff > 0 ? "dépense plus" : "dépense moins"} que le groupe B`}
            </div>
          </div>
        </div>
      </div>
    </Block>
  )
}

/** One side of the comparison — chips that add/remove a team from the group. */
function GroupPicker({
  label,
  color,
  sel,
  onToggle,
}: {
  label: string
  color: string
  sel: string[]
  onToggle: (id: string) => void
}) {
  return (
    <div className="rounded-md border border-border p-3">
      <div className="mb-2 flex items-center gap-1.5">
        <span className="size-2.5 rounded-full" style={{ background: color }} />
        <span
          className="font-ui text-[0.62rem] font-medium tracking-[0.08em] uppercase"
          style={{ color }}
        >
          {label}
        </span>
        <span className="ml-auto font-body text-[0.68rem] text-ink-disabled">
          {sel.length} équipe{sel.length > 1 ? "s" : ""}
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {TEAMS.map((t) => {
          const on = sel.includes(t.id)
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onToggle(t.id)}
              aria-pressed={on}
              className={cn(
                "rounded-pill border px-2.5 py-1 font-ui text-[0.72rem] font-medium transition-colors",
                on ? "text-ink" : "border-border text-ink-disabled hover:text-ink-muted",
              )}
              style={on ? { borderColor: color, background: `${color}1a` } : undefined}
            >
              {t.name}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function FaceRow({
  color,
  name,
  count,
  value,
}: {
  color: string
  name: string
  count: number
  value: number
}) {
  return (
    <div className="flex items-center gap-2.5 rounded-md border border-border px-3.5 py-2.5">
      <span className="size-2.5 shrink-0 rounded-full" style={{ background: color }} />
      <div className="min-w-0">
        <div className="truncate font-body text-[0.86rem] text-ink">{name}</div>
        <div className="font-body text-[0.66rem] text-ink-disabled">
          {count} équipe{count > 1 ? "s" : ""}
        </div>
      </div>
      <span className="ml-auto shrink-0 font-ui text-[0.9rem] font-medium tabular-nums text-ink-subtle">
        {fmtShort(value)}
      </span>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════════════
 * 2 — Dépenses mensuelles par équipe (grouped bars, filtrable par équipe)
 * ════════════════════════════════════════════════════════════════════════════ */
function MonthlyByTeamSection() {
  const [sel, setSel] = useState<string[]>(["seniors", "u19", "u17"])
  const teams = TEAMS.filter((t) => sel.includes(t.id))

  const data = useMemo(
    () =>
      MONTHS.map((month, mi) => {
        const row: Record<string, number | string> = { month }
        for (const t of TEAMS) row[t.id] = teamMonth[t.id][mi]
        return row
      }),
    [],
  )

  return (
    <Block
      icon={BarChart3}
      title="Dépenses mensuelles par équipe"
      subtitle="Filtrez les équipes à comparer"
      right={<TeamToggle sel={sel} onToggle={(id) => setSel((s) => toggle(s, id))} />}
    >
      <div className="h-[320px] p-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 8, bottom: 4, left: 4 }} barGap={2} barCategoryGap="22%">
            <CartesianGrid vertical={false} stroke={GRID} />
            <XAxis dataKey="month" tick={{ fill: AXIS, fontSize: 11 }} axisLine={{ stroke: GRID }} tickLine={false} />
            <YAxis tickFormatter={kFmt} tick={{ fill: AXIS, fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
            <Tooltip cursor={{ fill: "rgba(255,255,255,0.04)" }} content={<ChartTooltip />} />
            {teams.map((t) => (
              <Bar key={t.id} dataKey={t.id} name={t.name} fill={t.color} radius={[3, 3, 0, 0]} maxBarSize={22} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Block>
  )
}

/* ════════════════════════════════════════════════════════════════════════════
 * 3 — Trajectoires comparées (line chart, une courbe par équipe)
 * ════════════════════════════════════════════════════════════════════════════ */
function TeamLinesSection() {
  const [sel, setSel] = useState<string[]>(["seniors", "u19", "u17", "u15"])
  const [mode, setMode] = useState<"mensuel" | "cumule">("mensuel")
  const teams = TEAMS.filter((t) => sel.includes(t.id))

  const data = useMemo(
    () =>
      MONTHS.map((month, mi) => {
        const row: Record<string, number | string> = { month }
        for (const t of TEAMS) {
          row[t.id] =
            mode === "mensuel"
              ? teamMonth[t.id][mi]
              : teamMonth[t.id].slice(0, mi + 1).reduce((s, v) => s + v, 0)
        }
        return row
      }),
    [mode],
  )

  return (
    <Block
      icon={LineChartIcon}
      title="Trajectoires comparées des équipes"
      subtitle={mode === "cumule" ? "Dépense cumulée sur la saison" : "Dépense mensuelle"}
      right={
        <div className="flex flex-wrap items-center gap-3">
          <Segmented2
            value={mode}
            onChange={(v) => setMode(v as "mensuel" | "cumule")}
            options={[
              { value: "mensuel", label: "Mensuel" },
              { value: "cumule", label: "Cumulé" },
            ]}
          />
          <TeamToggle sel={sel} onToggle={(id) => setSel((s) => toggle(s, id))} />
        </div>
      }
    >
      <div className="h-[320px] p-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 6, right: 12, bottom: 4, left: 4 }}>
            <CartesianGrid vertical={false} stroke={GRID} />
            <XAxis dataKey="month" tick={{ fill: AXIS, fontSize: 11 }} axisLine={{ stroke: GRID }} tickLine={false} />
            <YAxis tickFormatter={kFmt} tick={{ fill: AXIS, fontSize: 11 }} axisLine={false} tickLine={false} width={40} />
            <Tooltip cursor={{ stroke: GRID, strokeWidth: 1 }} content={<ChartTooltip />} />
            {teams.map((t) => (
              <Line
                key={t.id}
                type="monotone"
                dataKey={t.id}
                name={t.name}
                stroke={t.color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Block>
  )
}

/* ════════════════════════════════════════════════════════════════════════════
 * 4 — Coût moyen par match : domicile vs extérieur (par équipe)
 * ════════════════════════════════════════════════════════════════════════════ */
function HomeAwaySection() {
  const [sel, setSel] = useState<string[]>(["seniors"])
  /* Several teams selected → the average match costs across them. */
  const scale =
    sel.reduce((s, id) => s + teamById.get(id)!.base, 0) / (sel.length * 49000)

  const data = useMemo(
    () =>
      MATCH_TYPES.map((type, i) => ({
        type,
        domicile: round50(HOME_COST[i] * scale),
        exterieur: round50(AWAY_COST[i] * scale),
      })),
    [scale],
  )
  const avgHome = data.reduce((s, r) => s + r.domicile, 0)
  const avgAway = data.reduce((s, r) => s + r.exterieur, 0)

  return (
    <Block
      icon={Scale}
      title="Coût moyen par match — domicile vs extérieur"
      subtitle={
        sel.length > 1
          ? `Moyenne par rencontre sur ${sel.length} équipes`
          : "Poste de dépense moyen par rencontre"
      }
      right={<TeamToggle sel={sel} onToggle={(id) => setSel((s) => toggle(s, id))} />}
    >
      <div className="grid grid-cols-1 gap-4 p-4 lg:grid-cols-[240px_1fr]">
        {/* KPI pair */}
        <div className="flex flex-col justify-center gap-3">
          <AvgCard icon={Home} color={HOME_C} label="Match à domicile" value={avgHome} />
          <AvgCard icon={Plane} color={AWAY_C} label="Match à l'extérieur" value={avgAway} />
          <div className="rounded-md border border-border px-3.5 py-2.5">
            <div className="font-body text-[0.72rem] text-ink-muted">
              Un déplacement coûte{" "}
              <span className="font-medium text-ink">
                {avgHome > 0 ? `${(avgAway / avgHome).toFixed(1)}×` : "—"}
              </span>{" "}
              un match à domicile.
            </div>
          </div>
        </div>

        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 4, right: 8, bottom: 4, left: 4 }} barGap={2} barCategoryGap="30%">
              <CartesianGrid vertical={false} stroke={GRID} />
              <XAxis dataKey="type" tick={{ fill: AXIS, fontSize: 11 }} axisLine={{ stroke: GRID }} tickLine={false} />
              <YAxis tickFormatter={kFmt} tick={{ fill: AXIS, fontSize: 11 }} axisLine={false} tickLine={false} width={44} />
              <Tooltip cursor={{ fill: "rgba(255,255,255,0.04)" }} content={<ChartTooltip />} />
              <Bar dataKey="domicile" name="Domicile" fill={HOME_C} radius={[3, 3, 0, 0]} maxBarSize={26} />
              <Bar dataKey="exterieur" name="Extérieur" fill={AWAY_C} radius={[3, 3, 0, 0]} maxBarSize={26} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Block>
  )
}

function AvgCard({
  icon: Icon,
  color,
  label,
  value,
}: {
  icon: typeof Home
  color: string
  label: string
  value: number
}) {
  return (
    <div className="rounded-lg border border-border px-4 py-3.5">
      <div className="flex items-center gap-1.5 font-ui text-[0.62rem] font-medium tracking-[0.08em] text-ink-muted uppercase">
        <Icon size={13} style={{ color }} /> {label}
      </div>
      <div className="mt-1.5 font-display text-[1.5rem] leading-none font-semibold tabular-nums text-ink">
        {fmtShort(value)} <span className="text-[0.9rem] font-normal text-ink-disabled">TND</span>
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════════════
 * 5 — Répartition des dépenses par catégorie (donut + liste)
 * ════════════════════════════════════════════════════════════════════════════ */
function CategoryBreakdownSection() {
  const [sel, setSel] = useState<string[]>(TEAMS.map((t) => t.id))

  const data = useMemo(() => {
    const vals = CATEGORIES.map((_, ci) =>
      sel.reduce((s, id) => s + teamCat[id][ci], 0),
    )
    const total = vals.reduce((s, v) => s + v, 0)
    return CATEGORIES.map((name, ci) => ({
      name,
      value: vals[ci],
      color: CAT_COLORS[ci],
      pct: total ? Math.round((vals[ci] / total) * 100) : 0,
    })).sort((x, y) => y.value - x.value)
  }, [sel])
  const total = data.reduce((s, d) => s + d.value, 0)

  return (
    <Block
      icon={PieChartIcon}
      title="Répartition par catégorie"
      subtitle={
        sel.length === TEAMS.length
          ? "Part de chaque poste — toutes les équipes"
          : `Part de chaque poste — ${sel.length} équipe${sel.length > 1 ? "s" : ""}`
      }
      right={<TeamToggle sel={sel} onToggle={(id) => setSel((s) => toggle(s, id))} />}
    >
      <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-[190px_1fr]">
        <div className="relative h-[190px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                innerRadius={54}
                outerRadius={82}
                paddingAngle={2}
                stroke="#181818"
                strokeWidth={2}
                startAngle={90}
                endAngle={-270}
              >
                {data.map((d) => (
                  <Cell key={d.name} fill={d.color} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display text-[1.15rem] font-semibold tabular-nums text-ink">
              {kFmt(total)}
            </span>
            <span className="font-ui text-[0.58rem] tracking-[0.1em] text-ink-disabled uppercase">
              TND total
            </span>
          </div>
        </div>

        <ul className="flex flex-col justify-center gap-1.5">
          {data.map((d) => (
            <li key={d.name} className="flex items-center gap-2.5">
              <span className="size-2.5 shrink-0 rounded-[3px]" style={{ background: d.color }} />
              <span className="truncate font-body text-[0.82rem] text-ink-subtle">{d.name}</span>
              <span className="ml-auto font-ui text-[0.78rem] tabular-nums text-ink-muted">
                {fmtShort(d.value)}
              </span>
              <span className="w-9 text-right font-body text-[0.72rem] tabular-nums text-ink-disabled">
                {d.pct}%
              </span>
            </li>
          ))}
        </ul>
      </div>
    </Block>
  )
}

/* ════════════════════════════════════════════════════════════════════════════
 * 6 — Prévu vs Réel par catégorie (grouped horizontal bars)
 * ════════════════════════════════════════════════════════════════════════════ */
function PlanVsRealSection() {
  const [sel, setSel] = useState<string[]>(TEAMS.map((t) => t.id))

  const { data, totReel, totPrevu } = useMemo(() => {
    const reel = CATEGORIES.map((_, ci) =>
      sel.reduce((s, id) => s + teamCat[id][ci], 0),
    )
    const prevu = reel.map((v, ci) => round50(v * PREVU_FACTOR[ci]))
    return {
      data: CATEGORIES.map((cat, ci) => ({ cat, prevu: prevu[ci], reel: reel[ci] })).sort(
        (a, b) => b.reel - a.reel,
      ),
      totReel: reel.reduce((s, v) => s + v, 0),
      totPrevu: prevu.reduce((s, v) => s + v, 0),
    }
  }, [sel])
  const ecart = totPrevu - totReel

  return (
    <Block
      icon={TrendingUp}
      title="Prévu vs Réel"
      subtitle="Par catégorie de dépense"
      right={<TeamToggle sel={sel} onToggle={(id) => setSel((s) => toggle(s, id))} />}
    >
      <div className="flex items-center gap-3 px-4 pt-3">
        <LegendDot color={PREVU} label="Prévu" />
        <LegendDot color={REEL} label="Réel" />
      </div>
      <div className="flex flex-col gap-3 p-4 pt-2">
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 4, right: 12, bottom: 4, left: 8 }}
              barGap={2}
              barCategoryGap="26%"
            >
              <CartesianGrid horizontal={false} stroke={GRID} />
              <XAxis type="number" tickFormatter={kFmt} tick={{ fill: AXIS, fontSize: 11 }} axisLine={{ stroke: GRID }} tickLine={false} />
              <YAxis type="category" dataKey="cat" width={116} tick={{ fill: AXIS, fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip cursor={{ fill: "rgba(255,255,255,0.04)" }} content={<ChartTooltip />} />
              <Bar dataKey="prevu" name="Prévu" fill={PREVU} radius={[0, 3, 3, 0]} maxBarSize={12} />
              <Bar dataKey="reel" name="Réel" fill={REEL} radius={[0, 3, 3, 0]} maxBarSize={12} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border px-4 py-3">
          <span className="font-body text-[0.8rem] text-ink-muted">
            Total réel <span className="tabular-nums text-ink-subtle">{fmtShort(totReel)}</span> sur{" "}
            <span className="tabular-nums text-ink-subtle">{fmtShort(totPrevu)}</span> prévu
          </span>
          <span
            className={cn(
              "font-ui text-[0.85rem] font-medium tabular-nums",
              ecart >= 0 ? "text-success" : "text-danger",
            )}
          >
            {signed(ecart)} TND {ecart >= 0 ? "d'économie" : "de dépassement"}
          </span>
        </div>
      </div>
    </Block>
  )
}

/* ════════════════════════════════════════════════════════════════════════════
 * Shared bits
 * ════════════════════════════════════════════════════════════════════════════ */
function Kpi({
  icon: Icon,
  label,
  value,
  sub,
  tone,
  accent,
}: {
  icon: typeof Wallet
  label: string
  value: ReactNode
  sub: string
  tone?: "positive" | "negative"
  accent?: string
}) {
  return (
    <div className="rounded-lg border border-border px-5 py-[1.1rem]">
      <div className="flex items-center gap-1.5 font-ui text-[0.62rem] font-medium tracking-[0.1em] text-ink-muted uppercase">
        <Icon size={13} style={accent ? { color: accent } : undefined} className={accent ? "" : "text-ink-disabled"} />
        {label}
      </div>
      <div
        className={cn(
          "mt-2 font-display text-[1.7rem] leading-none font-semibold tabular-nums",
          tone === "positive" && "text-success",
          tone === "negative" && "text-danger",
          !tone && "text-ink",
        )}
      >
        {value}
      </div>
      <div className="mt-1.5 font-body text-[0.74rem] text-ink-muted tabular-nums">{sub}</div>
    </div>
  )
}

function Block({
  icon: Icon,
  title,
  subtitle,
  right,
  children,
}: {
  icon: typeof BarChart3
  title: string
  subtitle?: string
  right?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-border">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-md bg-surface-nested text-ink-muted">
            <Icon size={15} />
          </span>
          <div>
            <h3 className="font-ui text-[0.9rem] font-medium text-ink">{title}</h3>
            {subtitle ? (
              <p className="font-body text-[0.72rem] text-ink-disabled">{subtitle}</p>
            ) : null}
          </div>
        </div>
        {right}
      </div>
      {children}
    </section>
  )
}

/** Recharts custom tooltip — design-system popover. */
function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean
  payload?: { name?: string; value?: number; color?: string; payload?: Record<string, unknown> }[]
  label?: string | number
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="min-w-[140px] rounded-md border border-border-strong bg-surface px-3 py-2 shadow-deep">
      {label != null ? (
        <div className="mb-1.5 font-ui text-[0.72rem] font-medium text-ink">{label}</div>
      ) : null}
      <div className="flex flex-col gap-1">
        {payload.map((p, i) => (
          <div key={i} className="flex items-center gap-2 font-body text-[0.76rem]">
            <span className="size-2 rounded-[2px]" style={{ background: p.color }} />
            <span className="text-ink-muted">
              {p.name ?? (p.payload?.name as string) ?? ""}
            </span>
            <span className="ml-auto pl-3 font-ui tabular-nums text-ink">
              {fmtShort(Number(p.value ?? 0))} TND
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

/** Team on/off filter chips (double as the chart legend). */
function TeamToggle({ sel, onToggle }: { sel: string[]; onToggle: (id: string) => void }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {TEAMS.map((t) => {
        const on = sel.includes(t.id)
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onToggle(t.id)}
            aria-pressed={on}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-pill border px-2.5 py-1 font-ui text-[0.72rem] font-medium transition-colors",
              on
                ? "border-border-strong text-ink"
                : "border-border text-ink-disabled hover:text-ink-muted",
            )}
          >
            <span
              className="size-2 rounded-full transition-opacity"
              style={{ background: t.color, opacity: on ? 1 : 0.3 }}
            />
            {t.name}
          </button>
        )
      })}
    </div>
  )
}

/** Small neutral segmented control (mensuel / cumulé, total / moyenne). */
function Segmented2({
  value,
  onChange,
  options,
}: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div className="inline-flex rounded-md border border-border p-0.5">
      {options.map((o) => {
        const on = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={cn(
              "rounded-[5px] px-3 py-1 font-ui text-[0.72rem] font-medium transition-colors",
              on ? "bg-surface-nested text-ink" : "text-ink-muted hover:text-ink",
            )}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 font-body text-[0.72rem] text-ink-muted">
      <span className="size-2.5 rounded-[3px]" style={{ background: color }} />
      {label}
    </span>
  )
}

/* ── helpers ─────────────────────────────────────────────────────────────── */
/** Toggle a team id in/out of the selection, keeping at least one active. */
function toggle(sel: string[], id: string): string[] {
  if (sel.includes(id)) return sel.length > 1 ? sel.filter((x) => x !== id) : sel
  return [...sel, id]
}

/** Compact axis formatter — 12000 → "12k", 15900 → "15,9k". */
function kFmt(v: number): string {
  if (v >= 1000) {
    const k = Math.round(v / 100) / 10
    return `${k.toLocaleString("fr-FR")}k`
  }
  return String(v)
}
