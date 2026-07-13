import { useMemo, useState, type ReactNode } from "react"
import { useSearchParams } from "react-router-dom"
import {
  ArrowDown,
  ArrowLeftRight,
  ArrowUp,
  BarChart3,
  Check,
  ChevronDown,
  GitCompareArrows,
  Radar as RadarIcon,
  Scale,
} from "lucide-react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { cn } from "@/lib/utils"
import { fmt, fmtShort } from "@/lib/format"
import { useData } from "@/data/useData"
import {
  draftLines,
  draftTotals,
  STATUS_META,
  type Budget2Draft,
} from "@/data/seed/budget2"
import {
  compareCategories,
  favorable,
  sectionSplit,
  signed,
  type CompareRow,
} from "@/features/budget2/compare"
import { byId } from "@/features/budget2/helpers"
import { Select } from "@/features/finance/ui"
import { BackButton } from "@/components/kit/BackButton"
import { EmptyState } from "@/components/kit/EmptyState"
import { PageHeader } from "@/components/kit/PageHeader"

/* A = lighter blue (info), B = brighter brand blue — the two comparison series. */
const A_BAR = "bg-info"
const B_BAR = "bg-brand-blue-600"

/**
 * Illustrative past seasons for the pickers. The prototype has no historical
 * budget data, so each entry simply ALIASES an existing draft — picking one
 * yields the same comparison as the budget it points to. Demo-only, no state.
 */
type PastSeason = { label: string; optionLabel: string; draftId: string }

function buildPastSeasons(drafts: Budget2Draft[]): PastSeason[] {
  const ref = drafts.find((d) => d.status === "valide") ?? drafts[0]
  if (!ref) return []
  const pru = drafts.find((d) => d.status === "brouillon") ?? ref
  const opt = drafts.find((d) => d.status === "archive") ?? pru
  return [
    { label: "Saison 2024 / 2025", optionLabel: "Référence", draftId: pru.id },
    { label: "Saison 2023 / 2024", optionLabel: "Référence", draftId: opt.id },
    { label: "Saison 2022 / 2023", optionLabel: "Référence", draftId: ref.id },
  ]
}

export function Budget2CompareScreen() {
  const [params] = useSearchParams()
  const { budget2, groups: refGroups } = useData()
  const { seasons, drafts, lines } = budget2

  const groupMap = useMemo(() => byId(refGroups), [refGroups])
  const seasonMap = useMemo(() => byId(seasons), [seasons])
  const draftMap = useMemo(() => byId(drafts), [drafts])
  const pastSeasons = useMemo(() => buildPastSeasons(drafts), [drafts])

  // Sensible defaults: the reference vs a brouillon (a real, useful comparison).
  const defaults = useMemo(() => {
    const validated = drafts.find((d) => d.status === "valide")
    const a = params.get("a") ?? validated?.id ?? drafts[0]?.id ?? ""
    const b =
      params.get("b") ??
      drafts.find((d) => d.status === "brouillon" && d.id !== a)?.id ??
      drafts.find((d) => d.id !== a)?.id ??
      ""
    return { a, b }
  }, [drafts, params])

  const [aId, setAId] = useState(defaults.a)
  const [bId, setBId] = useState(defaults.b)
  const [onlyDiff, setOnlyDiff] = useState(false)

  const a = draftMap.get(aId)
  const b = draftMap.get(bId)

  const linesA = useMemo(() => draftLines(lines, aId), [lines, aId])
  const linesB = useMemo(() => draftLines(lines, bId), [lines, bId])
  const totalsA = draftTotals(lines, aId)
  const totalsB = draftTotals(lines, bId)
  const secA = sectionSplit(linesA)
  const secB = sectionSplit(linesB)

  const depRows = useMemo(
    () => compareCategories(linesA, linesB, "Dépense", groupMap),
    [linesA, linesB, groupMap],
  )
  const revRows = useMemo(
    () => compareCategories(linesA, linesB, "Revenu", groupMap),
    [linesA, linesB, groupMap],
  )

  const swap = () => {
    setAId(bId)
    setBId(aId)
  }

  const sameBudget = aId === bId

  return (
    <div className="mx-auto max-w-6xl pb-16">
      <BackButton to="/budget2" label="Retour au budget" />
      <PageHeader
        title="Comparaison des budgets"
        subtitle="Comparez deux budgets — deux saisons, ou une saison et un brouillon — poste par poste, pour arbitrer en toute clarté."
      />

      {/* ── Pickers ─────────────────────────────────────────────────────── */}
      <div className="mt-6 grid grid-cols-1 items-stretch gap-3 sm:grid-cols-[1fr_auto_1fr]">
        <BudgetPicker
          side="A"
          accent="info"
          value={aId}
          onChange={setAId}
          seasons={seasons}
          drafts={drafts}
          draft={a}
          seasonMap={seasonMap}
          extraSeasons={pastSeasons}
        />
        <div className="flex items-center justify-center">
          <button
            type="button"
            onClick={swap}
            aria-label="Inverser A et B"
            title="Inverser A et B"
            className="inline-flex size-9 items-center justify-center rounded-full border border-border text-ink-muted transition-colors hover:border-border-strong hover:bg-surface-hover hover:text-ink"
          >
            <ArrowLeftRight size={16} />
          </button>
        </div>
        <BudgetPicker
          side="B"
          accent="brand"
          value={bId}
          onChange={setBId}
          seasons={seasons}
          drafts={drafts}
          draft={b}
          seasonMap={seasonMap}
          extraSeasons={pastSeasons}
        />
      </div>

      {!a || !b ? (
        <div className="mt-6 rounded-lg border border-border">
          <EmptyState
            icon={Scale}
            title="Sélectionnez deux budgets"
            description="Choisissez un budget à gauche et un à droite pour lancer la comparaison."
          />
        </div>
      ) : sameBudget ? (
        <div className="mt-6 rounded-lg border border-border">
          <EmptyState
            icon={Scale}
            title="Choisissez deux budgets différents"
            description="A et B pointent sur le même budget — sélectionnez-en un autre d'un côté."
          />
        </div>
      ) : (
        <>
          {/* ── Scoreboard (headline metrics) ───────────────────────────── */}
          <Scoreboard
            aLabel={a.label}
            bLabel={b.label}
            metrics={[
              { key: "rev", label: "Revenus", nature: "Revenu", av: totalsA.revenus, bv: totalsB.revenus },
              { key: "dep", label: "Dépenses", nature: "Dépense", av: totalsA.depenses, bv: totalsB.depenses },
              { key: "sol", label: "Solde prévisionnel", nature: "Solde", av: totalsA.solde, bv: totalsB.solde, strong: true },
            ]}
          />

          {/* ── Vue graphique — stats visuelles pour arbitrer ───────────── */}
          <CompareCharts />

          {/* ── Par section ─────────────────────────────────────────────── */}
          <CompareBlock title="Répartition par section" a={a.label} b={b.label}>
            <SectionCompare
              rows={[
                { key: "gen", label: "Dépenses générales", nature: "Dépense", a: secA.generales, b: secB.generales },
                { key: "staff", label: "Staff", nature: "Dépense", a: secA.staff, b: secB.staff },
                { key: "equipes", label: "Équipes", nature: "Dépense", a: secA.equipes, b: secB.equipes },
                { key: "rev", label: "Revenus", nature: "Revenu", a: secA.revenus, b: secB.revenus },
              ]}
            />
          </CompareBlock>

          {/* ── Détail par catégorie ────────────────────────────────────── */}
          <div className="mt-2 flex items-center justify-end">
            <button
              type="button"
              onClick={() => setOnlyDiff((v) => !v)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 font-ui text-[0.74rem] font-medium transition-colors",
                onlyDiff
                  ? "border-info/40 bg-info/10 text-info"
                  : "border-input text-ink-subtle hover:border-border-strong hover:text-ink",
              )}
            >
              <span
                className={cn(
                  "flex size-4 items-center justify-center rounded-sm border",
                  onlyDiff ? "border-info bg-info text-ink-inverted" : "border-border-strong",
                )}
              >
                {onlyDiff ? <span className="text-[0.6rem] leading-none">✓</span> : null}
              </span>
              Afficher uniquement les écarts
            </button>
          </div>

          <CompareBlock title="Dépenses par catégorie" a={a.label} b={b.label}>
            <CategoryTable rows={depRows} nature="Dépense" onlyDiff={onlyDiff} />
          </CompareBlock>

          <CompareBlock title="Revenus par catégorie" a={a.label} b={b.label}>
            <CategoryTable rows={revRows} nature="Revenu" onlyDiff={onlyDiff} />
          </CompareBlock>
        </>
      )}
    </div>
  )
}

/* ── Budget picker (grouped by season) ──────────────────────────────────── */
function BudgetPicker({
  side,
  accent,
  value,
  onChange,
  seasons,
  drafts,
  draft,
  seasonMap,
  extraSeasons = [],
}: {
  side: "A" | "B"
  accent: "info" | "brand"
  value: string
  onChange: (v: string) => void
  seasons: { id: string; label: string }[]
  drafts: Budget2Draft[]
  draft?: Budget2Draft
  seasonMap: Map<string, { id: string; label: string }>
  extraSeasons?: PastSeason[]
}) {
  const [open, setOpen] = useState(false)
  return (
    <div
      className={cn(
        "rounded-lg border p-4",
        accent === "info" ? "border-info/40" : "border-brand-blue-600/40",
      )}
    >
      <div className="mb-2.5 flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 font-ui text-[0.66rem] font-medium tracking-[0.08em] uppercase">
          <span
            className={cn(
              "size-2 rounded-full",
              accent === "info" ? "bg-info" : "bg-brand-blue-600",
            )}
          />
          <span className={accent === "info" ? "text-info" : "text-brand-blue-600"}>
            Budget {side}
          </span>
        </span>
      </div>

      {/* Themed dropdown (custom, so the list matches the dark tokens) */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="listbox"
          aria-expanded={open}
          className={cn(
            "flex w-full items-center justify-between gap-2 rounded-md border bg-input-bg px-3.5 py-2.5 text-left font-ui text-sm font-medium outline-none transition-colors",
            open ? "border-border-focus" : "border-input hover:border-border-strong",
            draft ? "text-ink" : "text-ink-muted",
          )}
        >
          <span className="truncate">
            {draft
              ? `${draft.label} — ${STATUS_META[draft.status].label}`
              : "Choisir un budget…"}
          </span>
          <ChevronDown
            size={15}
            className={cn(
              "shrink-0 text-ink-disabled transition-transform",
              open && "rotate-180",
            )}
          />
        </button>

        {open ? (
          <>
            <button
              type="button"
              aria-hidden
              tabIndex={-1}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40 cursor-default"
            />
            <div
              role="listbox"
              className="absolute inset-x-0 z-50 mt-1 max-h-72 overflow-y-auto rounded-md border border-border bg-background py-1 shadow-deep"
            >
              {seasons.map((s) => {
                const seasonDrafts = drafts.filter((d) => d.season_id === s.id)
                if (!seasonDrafts.length) return null
                return (
                  <div key={s.id} className="mb-1 last:mb-0">
                    <div className="px-3 pt-1.5 pb-1 font-ui text-[0.58rem] font-medium tracking-[0.1em] text-ink-disabled uppercase">
                      {s.label}
                    </div>
                    {seasonDrafts.map((d) => {
                      const sel = d.id === value
                      return (
                        <button
                          key={d.id}
                          type="button"
                          role="option"
                          aria-selected={sel}
                          onClick={() => {
                            onChange(d.id)
                            setOpen(false)
                          }}
                          className={cn(
                            "flex w-full items-center gap-2 px-3 py-2 text-left font-body text-[0.82rem] transition-colors",
                            sel
                              ? "bg-surface-hover text-info"
                              : "text-ink-subtle hover:bg-surface-hover hover:text-ink",
                          )}
                        >
                          <span className="min-w-0 flex-1 truncate">{d.label}</span>
                          <span className="shrink-0 font-ui text-[0.62rem] tracking-[0.04em] text-ink-disabled uppercase">
                            {STATUS_META[d.status].label}
                          </span>
                          {sel ? (
                            <Check size={14} className="shrink-0 text-info" />
                          ) : null}
                        </button>
                      )
                    })}
                  </div>
                )
              })}

              {/* Illustrative past seasons — alias existing budgets (demo). */}
              {extraSeasons.length ? (
                <div className="mt-1 border-t border-border pt-1">
                  {extraSeasons.map((ps) => (
                    <div key={ps.label} className="mb-1 last:mb-0">
                      <div className="px-3 pt-1.5 pb-1 font-ui text-[0.58rem] font-medium tracking-[0.1em] text-ink-disabled uppercase">
                        {ps.label}
                      </div>
                      <button
                        type="button"
                        role="option"
                        aria-selected={false}
                        onClick={() => {
                          onChange(ps.draftId)
                          setOpen(false)
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left font-body text-[0.82rem] text-ink-subtle transition-colors hover:bg-surface-hover hover:text-ink"
                      >
                        <span className="min-w-0 flex-1 truncate">
                          {ps.optionLabel}
                        </span>
                        <span className="shrink-0 font-ui text-[0.62rem] tracking-[0.04em] text-ink-disabled uppercase">
                          Historique
                        </span>
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </>
        ) : null}
      </div>

      {draft ? (
        <div className="mt-2 font-body text-[0.76rem] text-ink-muted">
          {seasonMap.get(draft.season_id)?.label ?? "—"}
        </div>
      ) : null}
    </div>
  )
}

/* ── Delta cell (arrow + signed amount, coloured by favourability) ──────── */
function Delta({
  delta,
  nature,
  base,
  className,
}: {
  delta: number
  nature: "Revenu" | "Dépense" | "Solde"
  base?: number
  className?: string
}) {
  if (delta === 0) {
    return <span className={cn("text-ink-disabled tabular-nums", className)}>—</span>
  }
  const fav = favorable(nature, delta)
  const Icon = delta > 0 ? ArrowUp : ArrowDown
  const pct = base ? Math.round((Math.abs(delta) / base) * 100) : null
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 tabular-nums",
        fav ? "text-success" : "text-danger",
        className,
      )}
    >
      <Icon size={13} />
      {signed(delta)}
      {pct != null ? (
        <span className="text-ink-disabled">({pct}%)</span>
      ) : null}
    </span>
  )
}

/* ── Two thin bars (A over B) scaled to a shared max ────────────────────── */
function PairBar({ a, b, max }: { a: number; b: number; max: number }) {
  const w = (v: number) => (max ? Math.min((v / max) * 100, 100) : 0)
  return (
    <div className="flex min-w-[70px] flex-col gap-1">
      <div className="h-[5px] overflow-hidden rounded bg-accent">
        <div className={cn("h-full rounded", A_BAR)} style={{ width: w(a) + "%" }} />
      </div>
      <div className="h-[5px] overflow-hidden rounded bg-accent">
        <div className={cn("h-full rounded", B_BAR)} style={{ width: w(b) + "%" }} />
      </div>
    </div>
  )
}

/* ── Scoreboard ─────────────────────────────────────────────────────────── */
type Metric = {
  key: string
  label: string
  nature: "Revenu" | "Dépense" | "Solde"
  av: number
  bv: number
  strong?: boolean
}

function Scoreboard({
  aLabel,
  bLabel,
  metrics,
}: {
  aLabel: string
  bLabel: string
  metrics: Metric[]
}) {
  const money = (n: number, nature: string) => {
    const cls =
      nature === "Revenu"
        ? "text-success"
        : nature === "Dépense"
          ? "text-danger"
          : n >= 0
            ? "text-success"
            : "text-danger"
    const val = nature === "Solde" ? (n >= 0 ? "+" : "") + fmt(n) : fmt(n)
    return <span className={cn("tabular-nums", cls)}>{val}</span>
  }
  return (
    <div className="mt-6 overflow-hidden rounded-lg border border-border">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-border">
              <Th>Indicateur</Th>
              <Th align="right">
                <span className="inline-block max-w-[9rem] truncate align-bottom">{aLabel}</span>
              </Th>
              <Th align="right">
                <span className="inline-block max-w-[9rem] truncate align-bottom">{bLabel}</span>
              </Th>
              <Th align="right">Écart (B − A)</Th>
            </tr>
          </thead>
          <tbody>
            {metrics.map((m) => (
              <tr
                key={m.key}
                className={cn(
                  "border-b border-border last:border-0",
                  m.strong && "bg-surface-hover",
                )}
              >
                <td className="px-4 py-3 font-body text-[0.86rem] text-ink-subtle">
                  {m.label}
                </td>
                <td
                  className={cn(
                    "px-4 py-3 text-right font-ui",
                    m.strong ? "text-[1.05rem] font-semibold" : "text-[0.9rem] font-medium",
                  )}
                >
                  {money(m.av, m.nature)}
                </td>
                <td
                  className={cn(
                    "px-4 py-3 text-right font-ui",
                    m.strong ? "text-[1.05rem] font-semibold" : "text-[0.9rem] font-medium",
                  )}
                >
                  {money(m.bv, m.nature)}
                </td>
                <td className="px-4 py-3 text-right font-ui text-[0.9rem] font-medium">
                  <Delta
                    delta={m.bv - m.av}
                    nature={m.nature}
                    base={m.nature !== "Solde" ? m.av : undefined}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ── Section comparison ─────────────────────────────────────────────────── */
function SectionCompare({
  rows,
}: {
  rows: { key: string; label: string; nature: "Revenu" | "Dépense"; a: number; b: number }[]
}) {
  const max = Math.max(1, ...rows.flatMap((r) => [r.a, r.b]))
  return (
    <div>
      {rows.map((r) => (
        <div
          key={r.key}
          className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 border-b border-border px-4 py-3 last:border-0 sm:grid-cols-[1.4fr_1.4fr_0.9fr_0.9fr_0.9fr]"
        >
          <span className="font-body text-[0.86rem] text-ink">{r.label}</span>
          <div className="order-last col-span-2 sm:order-none sm:col-span-1">
            <PairBar a={r.a} b={r.b} max={max} />
          </div>
          <span className="hidden text-right font-body text-[0.82rem] tabular-nums text-ink-muted sm:block">
            {fmtShort(r.a)}
          </span>
          <span className="hidden text-right font-body text-[0.82rem] tabular-nums text-ink-subtle sm:block">
            {fmtShort(r.b)}
          </span>
          <span className="text-right font-ui text-[0.82rem] font-medium">
            <Delta delta={r.b - r.a} nature={r.nature} />
          </span>
        </div>
      ))}
    </div>
  )
}

/* ── Category comparison table ──────────────────────────────────────────── */
function CategoryTable({
  rows,
  nature,
  onlyDiff,
}: {
  rows: CompareRow[]
  nature: "Revenu" | "Dépense"
  onlyDiff: boolean
}) {
  const shown = onlyDiff ? rows.filter((r) => r.delta !== 0) : rows
  const max = Math.max(1, ...rows.flatMap((r) => [r.a, r.b]))
  const totA = rows.reduce((s, r) => s + r.a, 0)
  const totB = rows.reduce((s, r) => s + r.b, 0)

  if (!shown.length) {
    return (
      <p className="px-4 py-6 text-center font-body text-[0.82rem] text-ink-disabled">
        {rows.length ? "Aucun écart entre les deux budgets." : "Aucune ligne."}
      </p>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-border">
            <Th>Catégorie</Th>
            <Th align="right">A</Th>
            <Th align="right">B</Th>
            <Th align="right">Écart</Th>
            <th className="w-[110px] px-4 py-2.5" aria-hidden />
          </tr>
        </thead>
        <tbody>
          {shown.map((r) => (
            <tr key={r.key} className="border-b border-border hover:bg-surface-hover">
              <td className="px-4 py-2.5 font-body text-[0.84rem] text-ink">{r.label}</td>
              <td className="px-4 py-2.5 text-right font-body text-[0.82rem] tabular-nums text-ink-muted">
                {fmtShort(r.a)}
              </td>
              <td className="px-4 py-2.5 text-right font-body text-[0.82rem] tabular-nums text-ink-subtle">
                {fmtShort(r.b)}
              </td>
              <td className="px-4 py-2.5 text-right font-ui text-[0.82rem] font-medium">
                <Delta delta={r.delta} nature={nature} />
              </td>
              <td className="px-4 py-2.5">
                <PairBar a={r.a} b={r.b} max={max} />
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t border-border-second">
            <td className="px-4 py-2.5 font-ui text-[0.82rem] font-medium text-ink">Total</td>
            <td className="px-4 py-2.5 text-right font-ui text-[0.82rem] font-medium tabular-nums text-ink-subtle">
              {fmtShort(totA)}
            </td>
            <td className="px-4 py-2.5 text-right font-ui text-[0.82rem] font-medium tabular-nums text-ink-subtle">
              {fmtShort(totB)}
            </td>
            <td className="px-4 py-2.5 text-right font-ui text-[0.82rem] font-semibold">
              <Delta delta={totB - totA} nature={nature} />
            </td>
            <td aria-hidden />
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

/* ── Section wrapper with a small A/B legend ────────────────────────────── */
function CompareBlock({
  title,
  a,
  b,
  children,
}: {
  title: string
  a: string
  b: string
  children: React.ReactNode
}) {
  return (
    <section className="mt-4 overflow-hidden rounded-lg border border-border">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
        <h2 className="font-ui text-[0.78rem] font-medium tracking-[0.06em] text-ink-subtle uppercase">
          {title}
        </h2>
        <div className="flex items-center gap-3 font-body text-[0.7rem] text-ink-muted">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-info" />
            <span className="max-w-[8rem] truncate">A · {a}</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-brand-blue-600" />
            <span className="max-w-[8rem] truncate">B · {b}</span>
          </span>
        </div>
      </div>
      {children}
    </section>
  )
}

/* ════════════════════════════════════════════════════════════════════════════
 * Vue graphique — comparison stats
 * --------------------------------------------------------------------------
 * Charts that make the A/B comparison legible at a glance. The first three
 * VISUALISE the real selected budgets (same figures as the tables — display
 * arithmetic only, no engine); the multi-season trend uses illustrative data
 * (the prototype has no budget history). All are UI-only with local filters.
 * ══════════════════════════════════════════════════════════════════════════ */

/* A = info blue, B = brand-blue — the two series already used across the page. */
const A_C = "#60a5fa"
const B_C = "#0091ff"
const AXIS = "#a3a3a3" // --ink-muted
const GRID = "#252525" // --border
const FAV = "#46a758" // favourable move (success-600)
const UNFAV = "#e5484d" // unfavourable move (--danger)

/* ── Illustrative seasons — self-contained, richer than the live drafts ──────
   The charts below run on their own imaginary multi-season dataset (more
   categories = fuller radar & écart bars) with A/B season pickers, so the
   comparison reads at season scale. Pure data shaping — no engine. */
const DEP_CATS = [
  "Équipements", "Déplacements", "Arbitrage", "Stages & tournois", "Médical",
  "Restauration", "Hébergement", "Matériel", "Formation", "Communication",
]
const REV_CATS = ["Cotisations", "Subventions", "Sponsoring", "Billetterie", "Buvette", "Partenariats"]
const DEP_BASE = [46000, 42000, 20000, 32000, 17000, 21000, 19000, 13000, 11000, 9000]
const REV_BASE = [120000, 74000, 66000, 24000, 17000, 13000]

type SeasonDef = { id: string; label: string; short: string; g: number }
const SEASONS: SeasonDef[] = [
  { id: "s2122", label: "Saison 2021/2022", short: "21/22", g: 0.84 },
  { id: "s2223", label: "Saison 2022/2023", short: "22/23", g: 0.91 },
  { id: "s2324", label: "Saison 2023/2024", short: "23/24", g: 0.99 },
  { id: "s2425", label: "Saison 2024/2025", short: "24/25", g: 1.06 },
  { id: "s2526", label: "Saison 2025/2026", short: "25/26", g: 1.13 },
]

const round50 = (n: number) => Math.round(n / 50) * 50
type SeasonData = { dep: number[]; rev: number[]; totDep: number; totRev: number; solde: number }
const SEASON_DATA: Record<string, SeasonData> = {}
SEASONS.forEach((s, si) => {
  const dep = DEP_BASE.map((b, ci) =>
    round50(b * s.g * (1 + 0.14 * Math.sin((ci + 1) * (si + 2) * 0.7))),
  )
  const rev = REV_BASE.map((b, ci) =>
    round50(b * s.g * (1 + 0.1 * Math.sin((ci + 2) * (si + 1) * 0.6))),
  )
  const totDep = dep.reduce((a, b) => a + b, 0)
  const totRev = rev.reduce((a, b) => a + b, 0)
  SEASON_DATA[s.id] = { dep, rev, totDep, totRev, solde: totRev - totDep }
})

/** CompareRow[] between two seasons for one nature. */
function seasonRows(aId: string, bId: string, nature: "Dépense" | "Revenu"): CompareRow[] {
  const cats = nature === "Dépense" ? DEP_CATS : REV_CATS
  const A = SEASON_DATA[aId]
  const B = SEASON_DATA[bId]
  const av = nature === "Dépense" ? A.dep : A.rev
  const bv = nature === "Dépense" ? B.dep : B.rev
  return cats.map((label, i) => ({ key: label, label, a: av[i], b: bv[i], delta: bv[i] - av[i] }))
}

type Totals = { revenus: number; depenses: number; solde: number }
const totalsOf = (d: SeasonData): Totals => ({
  revenus: d.totRev,
  depenses: d.totDep,
  solde: d.solde,
})

function CompareCharts() {
  const [aId, setAId] = useState("s2526")
  const [bId, setBId] = useState("s2324")
  const A = SEASON_DATA[aId]
  const B = SEASON_DATA[bId]
  const aLabel = SEASONS.find((s) => s.id === aId)!.label
  const bLabel = SEASONS.find((s) => s.id === bId)!.label
  const depRows = useMemo(() => seasonRows(aId, bId, "Dépense"), [aId, bId])
  const revRows = useMemo(() => seasonRows(aId, bId, "Revenu"), [aId, bId])

  return (
    <div className="mt-6">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-ui text-[1.05rem] font-medium text-ink">Vue graphique</h2>
          <p className="mt-0.5 font-body text-[0.8rem] text-ink-muted">
            Analyse comparative des saisons — données illustratives.
          </p>
        </div>
        <div className="flex items-end gap-2">
          <SeasonSelect label="Saison A" dot={A_C} value={aId} onChange={setAId} />
          <span className="pb-2.5 font-body text-[0.72rem] text-ink-disabled">vs</span>
          <SeasonSelect label="Saison B" dot={B_C} value={bId} onChange={setBId} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <FaceToFaceChart aLabel={aLabel} bLabel={bLabel} totalsA={totalsOf(A)} totalsB={totalsOf(B)} />
        <ProfileRadarChart aLabel={aLabel} bLabel={bLabel} depRows={depRows} />
        <DivergingChart depRows={depRows} revRows={revRows} />
      </div>
    </div>
  )
}

/** Labelled season picker with a colour dot (A / B). */
function SeasonSelect({
  label,
  dot,
  value,
  onChange,
}: {
  label: string
  dot: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="font-ui text-[0.58rem] font-medium tracking-[0.08em] text-ink-disabled uppercase">
        {label}
      </span>
      <div className="flex items-center gap-2">
        <span className="size-2.5 shrink-0 rounded-full" style={{ background: dot }} />
        <div className="w-[170px]">
          <Select
            value={value}
            onChange={onChange}
            options={SEASONS.map((s) => ({ value: s.id, label: s.label }))}
          />
        </div>
      </div>
    </div>
  )
}

/* ── 1 · Face-à-face — grouped bars (Revenus / Dépenses / Solde) ─────────── */
function FaceToFaceChart({
  aLabel,
  bLabel,
  totalsA,
  totalsB,
}: {
  aLabel: string
  bLabel: string
  totalsA: Totals
  totalsB: Totals
}) {
  const data = [
    { metric: "Revenus", A: totalsA.revenus, B: totalsB.revenus },
    { metric: "Dépenses", A: totalsA.depenses, B: totalsB.depenses },
    { metric: "Solde", A: totalsA.solde, B: totalsB.solde },
  ]
  return (
    <ChartCard
      icon={GitCompareArrows}
      title="Face-à-face"
      subtitle="Indicateurs clés, A vs B"
      legend={[
        { color: A_C, label: `A · ${aLabel}` },
        { color: B_C, label: `B · ${bLabel}` },
      ]}
    >
      <div className="h-[260px] p-4">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 8, bottom: 4, left: 4 }} barGap={3} barCategoryGap="34%">
            <CartesianGrid vertical={false} stroke={GRID} />
            <XAxis dataKey="metric" tick={{ fill: AXIS, fontSize: 11 }} axisLine={{ stroke: GRID }} tickLine={false} />
            <YAxis tickFormatter={kFmt} tick={{ fill: AXIS, fontSize: 11 }} axisLine={false} tickLine={false} width={44} />
            <ReferenceLine y={0} stroke="#404040" />
            <Tooltip cursor={{ fill: "rgba(255,255,255,0.04)" }} content={<MoneyTooltip />} />
            <Bar dataKey="A" name={`A · ${aLabel}`} fill={A_C} radius={[3, 3, 0, 0]} maxBarSize={30} />
            <Bar dataKey="B" name={`B · ${bLabel}`} fill={B_C} radius={[3, 3, 0, 0]} maxBarSize={30} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  )
}

/* ── 2 · Profil de dépenses — radar (share of dépenses per category) ─────── */
function ProfileRadarChart({
  aLabel,
  bLabel,
  depRows,
}: {
  aLabel: string
  bLabel: string
  depRows: CompareRow[]
}) {
  const totA = depRows.reduce((s, r) => s + r.a, 0) || 1
  const totB = depRows.reduce((s, r) => s + r.b, 0) || 1
  // Top categories by combined weight → structure profile (share of dépenses).
  const data = [...depRows]
    .sort((x, y) => y.a + y.b - (x.a + x.b))
    .slice(0, 7)
    .map((r) => ({
      axis: r.label,
      A: Math.round((r.a / totA) * 100),
      B: Math.round((r.b / totB) * 100),
    }))

  const hasData = data.some((d) => d.A > 0 || d.B > 0)

  return (
    <ChartCard
      icon={RadarIcon}
      title="Profil de dépenses"
      subtitle="Répartition en % des dépenses"
      legend={[
        { color: A_C, label: `A · ${aLabel}` },
        { color: B_C, label: `B · ${bLabel}` },
      ]}
    >
      <div className="h-[260px] p-4">
        {hasData ? (
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={data} outerRadius="72%">
              <PolarGrid stroke={GRID} />
              <PolarAngleAxis dataKey="axis" tick={{ fill: AXIS, fontSize: 10 }} />
              <PolarRadiusAxis tick={false} axisLine={false} tickCount={4} />
              <Radar name={`A · ${aLabel}`} dataKey="A" stroke={A_C} fill={A_C} fillOpacity={0.14} strokeWidth={2} />
              <Radar name={`B · ${bLabel}`} dataKey="B" stroke={B_C} fill={B_C} fillOpacity={0.14} strokeWidth={2} />
              <Tooltip content={<PctTooltip />} />
            </RadarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart label="Aucune dépense à profiler." />
        )}
      </div>
    </ChartCard>
  )
}

/* ── 3 · Écart par catégorie — diverging bars (B − A), metric-filtered ───── */
function DivergingChart({
  depRows,
  revRows,
}: {
  depRows: CompareRow[]
  revRows: CompareRow[]
}) {
  const [nature, setNature] = useState<"Dépense" | "Revenu">("Dépense")
  const rows = nature === "Dépense" ? depRows : revRows
  const data = rows.filter((r) => r.delta !== 0).slice(0, 8)

  return (
    <ChartCard
      icon={BarChart3}
      title="Écart par catégorie (B − A)"
      subtitle="Où les deux budgets divergent"
      right={
        <Segmented
          value={nature}
          onChange={(v) => setNature(v as "Dépense" | "Revenu")}
          options={[
            { value: "Dépense", label: "Dépenses" },
            { value: "Revenu", label: "Revenus" },
          ]}
        />
      }
    >
      <div className="flex items-center gap-3 px-4 pt-3 font-body text-[0.7rem] text-ink-muted">
        <LegendDot color={FAV} label="Favorable à B" />
        <LegendDot color={UNFAV} label="Défavorable à B" />
      </div>
      <div className="h-[260px] p-4 pt-2">
        {data.length ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, bottom: 4, left: 8 }}>
              <CartesianGrid horizontal={false} stroke={GRID} />
              <XAxis type="number" tickFormatter={(v) => kFmt(Math.abs(v))} tick={{ fill: AXIS, fontSize: 11 }} axisLine={{ stroke: GRID }} tickLine={false} />
              <YAxis type="category" dataKey="label" width={110} tick={{ fill: AXIS, fontSize: 10 }} axisLine={false} tickLine={false} />
              <ReferenceLine x={0} stroke="#404040" />
              <Tooltip cursor={{ fill: "rgba(255,255,255,0.04)" }} content={<DeltaTooltip nature={nature} />} />
              <Bar dataKey="delta" radius={2} maxBarSize={16}>
                {data.map((r) => (
                  <Cell key={r.key} fill={favorable(nature, r.delta) ? FAV : UNFAV} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <EmptyChart label="Aucun écart entre les deux budgets." />
        )}
      </div>
    </ChartCard>
  )
}

/* ── Chart chrome ───────────────────────────────────────────────────────── */
function ChartCard({
  icon: Icon,
  title,
  subtitle,
  legend,
  right,
  children,
}: {
  icon: typeof BarChart3
  title: string
  subtitle?: string
  legend?: { color: string; label: string }[]
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
            {subtitle ? <p className="font-body text-[0.72rem] text-ink-disabled">{subtitle}</p> : null}
          </div>
        </div>
        {right ?? (legend ? (
          <div className="flex flex-wrap items-center gap-3">
            {legend.map((l) => (
              <LegendDot key={l.label} color={l.color} label={l.label} />
            ))}
          </div>
        ) : null)}
      </div>
      {children}
    </section>
  )
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 font-body text-[0.7rem] text-ink-muted">
      <span className="size-2.5 shrink-0 rounded-[3px]" style={{ background: color }} />
      <span className="max-w-[9rem] truncate">{label}</span>
    </span>
  )
}

function Segmented({
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

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="flex h-full items-center justify-center text-center font-body text-[0.82rem] text-ink-disabled">
      {label}
    </div>
  )
}

/* ── Tooltips ────────────────────────────────────────────────────────────── */
type TipItem = { name?: string; value?: number; color?: string; payload?: Record<string, unknown> }

function TipShell({ label, children }: { label?: ReactNode; children: ReactNode }) {
  return (
    <div className="min-w-[150px] rounded-md border border-border-strong bg-surface px-3 py-2 shadow-deep">
      {label != null ? <div className="mb-1.5 font-ui text-[0.72rem] font-medium text-ink">{label}</div> : null}
      <div className="flex flex-col gap-1">{children}</div>
    </div>
  )
}

function TipRow({ color, name, value }: { color?: string; name: ReactNode; value: ReactNode }) {
  return (
    <div className="flex items-center gap-2 font-body text-[0.76rem]">
      {color ? <span className="size-2 rounded-[2px]" style={{ background: color }} /> : null}
      <span className="text-ink-muted">{name}</span>
      <span className="ml-auto pl-3 font-ui tabular-nums text-ink">{value}</span>
    </div>
  )
}

function MoneyTooltip({ active, payload, label }: { active?: boolean; payload?: TipItem[]; label?: string | number }) {
  if (!active || !payload?.length) return null
  return (
    <TipShell label={label}>
      {payload.map((p, i) => (
        <TipRow key={i} color={p.color} name={p.name} value={`${signed(Number(p.value ?? 0))} TND`} />
      ))}
    </TipShell>
  )
}

function PctTooltip({ active, payload, label }: { active?: boolean; payload?: TipItem[]; label?: string | number }) {
  if (!active || !payload?.length) return null
  return (
    <TipShell label={label}>
      {payload.map((p, i) => (
        <TipRow key={i} color={p.color} name={p.name} value={`${Number(p.value ?? 0)}%`} />
      ))}
    </TipShell>
  )
}

function DeltaTooltip({
  active,
  payload,
  nature,
}: {
  active?: boolean
  payload?: TipItem[]
  nature: "Dépense" | "Revenu"
}) {
  if (!active || !payload?.length) return null
  const row = payload[0]?.payload as unknown as CompareRow | undefined
  if (!row) return null
  const fav = favorable(nature, row.delta)
  return (
    <TipShell label={row.label}>
      <TipRow color={A_C} name="A" value={`${fmtShort(row.a)} TND`} />
      <TipRow color={B_C} name="B" value={`${fmtShort(row.b)} TND`} />
      <div className="mt-0.5 flex items-center gap-2 border-t border-border pt-1 font-body text-[0.76rem]">
        <span className="text-ink-muted">Écart</span>
        <span className={cn("ml-auto pl-3 font-ui tabular-nums", fav ? "text-success" : "text-danger")}>
          {signed(row.delta)} TND
        </span>
      </div>
    </TipShell>
  )
}

/** Compact axis formatter — 12000 → "12k", 15900 → "15,9k". */
function kFmt(v: number): string {
  const abs = Math.abs(v)
  if (abs >= 1000) {
    const k = Math.round(abs / 100) / 10
    return `${v < 0 ? "−" : ""}${k.toLocaleString("fr-FR")}k`
  }
  return String(v)
}

/* ── Table header cell ──────────────────────────────────────────────────── */
function Th({
  children,
  align = "left",
}: {
  children?: React.ReactNode
  align?: "left" | "right"
}) {
  return (
    <th
      className={cn(
        "px-4 py-2.5 font-ui text-[0.66rem] font-medium tracking-[0.08em] whitespace-nowrap text-ink-disabled uppercase",
        align === "right" ? "text-right" : "text-left",
      )}
    >
      {children}
    </th>
  )
}
