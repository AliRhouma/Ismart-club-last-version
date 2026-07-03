import { useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"
import {
  ArrowDown,
  ArrowLeftRight,
  ArrowUp,
  Check,
  ChevronDown,
  Scale,
} from "lucide-react"

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
