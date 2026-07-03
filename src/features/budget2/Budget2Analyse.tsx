import { useMemo, useState, type ReactNode } from "react"
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Filter,
  Info,
  RotateCcw,
  Scale,
  SlidersHorizontal,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { fmt, fmtShort } from "@/lib/format"
import { signed } from "@/features/budget2/suivi"
import type { Budget2Season } from "@/data/seed/budget2"
import { Segmented } from "@/features/budget/ui"
import { Field, Select } from "@/features/finance/ui"
import { Badge } from "@/components/kit/Badge"

/* ═══════════════════════════════════════════════════════════════════════════
 * Budget 2 — Analyse (analyse d'écart : réel vs plan validé).
 *
 * A UI-only, chart-driven view of the gap between the REALISED transactions
 * (réel) and the VALIDATED budget draft (le brouillon de référence). Where the
 * Dashboard tab lists the operational suivi (tables + alerts), this tab is the
 * treasurer's *visual* variance toolkit: pace over time, écart par rubrique,
 * consumption vs limit, and a detail ledger — surfaced only once a filter is run.
 *
 * NOTE — this screen carries NO business logic. The figures below are
 * illustrative "imagination" data shaped exactly like `buildSuivi()` output
 * (prévu / réel per rubrique), so it could later be fed from the store with no
 * layout change. Colours follow the two-series language already used by the
 * Comparaison screen: Prévu = info (#60a5fa), Réel = brand-blue (#0091ff);
 * favourable/défavorable écarts use genuine status green/red.
 * ═══════════════════════════════════════════════════════════════════════════ */

type SectionKey = "generales" | "staff" | "equipes" | "revenus"
type RowNature = "Dépense" | "Revenu"

type Rubrique = {
  label: string
  nature: RowNature
  section: SectionKey
  prevu: number
  reel: number
}

const SECTION_LABEL: Record<SectionKey, string> = {
  generales: "Générales",
  staff: "Staff",
  equipes: "Équipes",
  revenus: "Revenus",
}

/* ── Illustrative dataset — one validated season, varied on purpose ─────────
   (overruns, savings, a near-limit line, an off-budget line, revenue over- and
   under-performance) so every chart state is represented. */
const RUBRIQUES: Rubrique[] = [
  // Dépenses — générales
  { label: "Équipements sportifs", nature: "Dépense", section: "generales", prevu: 42000, reel: 47800 },
  { label: "Matériel médical", nature: "Dépense", section: "generales", prevu: 5000, reel: 8400 },
  { label: "Déplacements & transport", nature: "Dépense", section: "generales", prevu: 28000, reel: 24300 },
  { label: "Location & terrains", nature: "Dépense", section: "generales", prevu: 36000, reel: 35100 },
  { label: "Arbitrage", nature: "Dépense", section: "generales", prevu: 12000, reel: 13600 },
  { label: "Communication & médias", nature: "Dépense", section: "generales", prevu: 9000, reel: 6200 },
  { label: "Frais administratifs", nature: "Dépense", section: "generales", prevu: 7000, reel: 7050 },
  { label: "Événements & tournois", nature: "Dépense", section: "generales", prevu: 15000, reel: 9800 },
  { label: "Assurances", nature: "Dépense", section: "generales", prevu: 0, reel: 2600 },
  // Dépenses — staff
  { label: "Staff technique", nature: "Dépense", section: "staff", prevu: 60000, reel: 61500 },
  { label: "Staff administratif", nature: "Dépense", section: "staff", prevu: 22000, reel: 20800 },
  // Dépenses — équipes
  { label: "Équipe U15", nature: "Dépense", section: "equipes", prevu: 14000, reel: 15900 },
  { label: "Équipe U17", nature: "Dépense", section: "equipes", prevu: 16000, reel: 14200 },
  { label: "Équipe Senior", nature: "Dépense", section: "equipes", prevu: 24000, reel: 26800 },
  // Revenus
  { label: "Cotisations membres", nature: "Revenu", section: "revenus", prevu: 110000, reel: 112400 },
  { label: "Subventions municipales", nature: "Revenu", section: "revenus", prevu: 72000, reel: 66000 },
  { label: "Sponsoring", nature: "Revenu", section: "revenus", prevu: 64000, reel: 69800 },
  { label: "Billetterie", nature: "Revenu", section: "revenus", prevu: 22000, reel: 18300 },
  { label: "Buvette & boutique", nature: "Revenu", section: "revenus", prevu: 16000, reel: 18100 },
  { label: "Partenariats médias", nature: "Revenu", section: "revenus", prevu: 12000, reel: 9500 },
  { label: "Subvention exceptionnelle", nature: "Revenu", section: "revenus", prevu: 0, reel: 8000 },
]

const SEUIL = 0.8 // alert threshold — 80 % of budget consumed

/* Favourable-signed écart: dépense → prévu − réel ; revenu → réel − prévu. */
const ecartOf = (r: Rubrique) =>
  r.nature === "Dépense" ? r.prevu - r.reel : r.reel - r.prevu
const ratioOf = (r: Rubrique) => (r.prevu > 0 ? r.reel / r.prevu : null)

/* ── Filter model ──────────────────────────────────────────────────────────── */
type NatureFilter = "Tous" | "Dépense" | "Revenu"
type Applied = {
  saison: string
  section: "toutes" | SectionKey
  nature: NatureFilter
}

export function Budget2Analyse({ season }: { season: Budget2Season }) {
  const [saison, setSaison] = useState(season.id)
  const [section, setSection] = useState<"toutes" | SectionKey>("toutes")
  const [nature, setNature] = useState<NatureFilter>("Dépense")
  const [applied, setApplied] = useState<Applied | null>(null)

  const current: Applied = { saison, section, nature }
  const dirty =
    applied !== null &&
    JSON.stringify(applied) !== JSON.stringify(current)

  const run = () => setApplied(current)
  const reset = () => {
    setSection("toutes")
    setNature("Dépense")
    setApplied(null)
  }

  return (
    <div className="mt-6 flex flex-col gap-4 pb-16">
      {/* ── Filter bar — the analysis is gated behind it ─────────────────── */}
      <FilterBar
        saison={saison}
        setSaison={setSaison}
        section={section}
        setSection={setSection}
        nature={nature}
        setNature={setNature}
        seasonLabel={season.label}
        applied={applied}
        dirty={dirty}
        onRun={run}
        onReset={reset}
      />

      {applied === null ? (
        <FilterPrompt />
      ) : (
        <AnalyseResults key={JSON.stringify(applied)} applied={applied} />
      )}
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════════════
 * Filter bar
 * ════════════════════════════════════════════════════════════════════════════ */
function FilterBar({
  saison,
  setSaison,
  section,
  setSection,
  nature,
  setNature,
  seasonLabel,
  applied,
  dirty,
  onRun,
  onReset,
}: {
  saison: string
  setSaison: (v: string) => void
  section: "toutes" | SectionKey
  setSection: (v: "toutes" | SectionKey) => void
  nature: NatureFilter
  setNature: (v: NatureFilter) => void
  seasonLabel: string
  applied: Applied | null
  dirty: boolean
  onRun: () => void
  onReset: () => void
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-border">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <SlidersHorizontal size={15} className="text-ink-muted" />
        <h2 className="font-ui text-[0.78rem] font-medium tracking-[0.06em] text-ink-subtle uppercase">
          Paramètres de l'analyse
        </h2>
        {applied && dirty ? (
          <span className="ml-auto inline-flex items-center gap-1.5 font-body text-[0.72rem] text-warning">
            <Info size={13} /> Filtres modifiés — relancez l'analyse
          </span>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Saison">
          <Select
            value={saison}
            onChange={setSaison}
            options={[{ value: saison, label: seasonLabel }]}
          />
        </Field>
        <Field label="Rubrique">
          <Select
            value={section}
            onChange={(v) => setSection(v as "toutes" | SectionKey)}
            options={[
              { value: "toutes", label: "Toutes les rubriques" },
              { value: "generales", label: "Générales" },
              { value: "staff", label: "Staff" },
              { value: "equipes", label: "Équipes" },
            ]}
          />
        </Field>
        <Field label="Nature">
          <Segmented
            className="w-full"
            value={nature}
            onChange={setNature}
            options={[
              { value: "Tous", label: "Tous" },
              { value: "Dépense", label: "Dépenses" },
              { value: "Revenu", label: "Recettes" },
            ]}
          />
        </Field>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border px-4 py-3">
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1.5 rounded-md border border-input px-3.5 py-2 font-ui text-[0.8rem] font-medium text-ink-subtle transition-colors hover:border-border-strong hover:text-ink"
        >
          <RotateCcw size={14} /> Réinitialiser
        </button>
        <button
          type="button"
          onClick={onRun}
          className="inline-flex items-center gap-2 rounded-md bg-brand px-5 py-2 font-ui text-[0.8rem] font-medium text-ink-inverted shadow-glow transition-colors hover:bg-brand-dim"
        >
          <BarChart3 size={15} /> {applied ? "Actualiser l'analyse" : "Lancer l'analyse"}
        </button>
      </div>
    </section>
  )
}

/* Empty prompt shown before any analysis is run. */
function FilterPrompt() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border-strong px-6 py-16 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-surface-nested text-info">
        <Filter size={20} />
      </span>
      <p className="font-ui text-[1rem] font-medium text-ink">Aucune analyse lancée</p>
      <p className="max-w-md font-body text-[0.85rem] text-ink-muted">
        Choisissez une rubrique et une nature, puis lancez l'analyse pour
        visualiser les écarts entre le réel et le budget de référence.
      </p>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════════════
 * Results
 * ════════════════════════════════════════════════════════════════════════════ */
function AnalyseResults({ applied }: { applied: Applied }) {
  const rows = useMemo(
    () =>
      RUBRIQUES.filter((r) => {
        if (applied.nature !== "Tous" && r.nature !== applied.nature) return false
        if (applied.section !== "toutes" && r.nature === "Dépense" && r.section !== applied.section)
          return false
        return true
      }),
    [applied],
  )

  // Global headline totals (both natures, always — a stable summary).
  const dep = RUBRIQUES.filter((r) => r.nature === "Dépense")
  const rev = RUBRIQUES.filter((r) => r.nature === "Revenu")
  const sum = (arr: Rubrique[], k: "prevu" | "reel") => arr.reduce((s, r) => s + r[k], 0)
  const prevuDep = sum(dep, "prevu")
  const reelDep = sum(dep, "reel")
  const prevuRev = sum(rev, "prevu")
  const reelRev = sum(rev, "reel")
  const ecartDep = prevuDep - reelDep
  const ecartRev = reelRev - prevuRev
  const soldePrevu = prevuRev - prevuDep
  const soldeReel = reelRev - reelDep

  return (
    <div className="animate-fade-up flex flex-col gap-4">
      {/* ── KPI row — the headline gap ─────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiTile
          icon={TrendingDown}
          label="Dépenses réelles"
          value={fmt(reelDep)}
          sub={`sur ${fmtShort(prevuDep)} prévu`}
          delta={`${signed(ecartDep)} TND`}
          deltaTone={ecartDep >= 0 ? "up" : "down"}
        />
        <KpiTile
          icon={TrendingUp}
          label="Recettes réelles"
          value={fmt(reelRev)}
          sub={`sur ${fmtShort(prevuRev)} prévu`}
          delta={`${signed(ecartRev)} TND`}
          deltaTone={ecartRev >= 0 ? "up" : "down"}
        />
        <KpiTile
          icon={Activity}
          label="Taux de réalisation"
          value={`${Math.round((reelDep / prevuDep) * 100)}%`}
          sub="des dépenses prévues"
          delta={reelDep > prevuDep ? "Budget dépassé" : "Sous le budget"}
          deltaTone={reelDep > prevuDep ? "down" : "up"}
        />
        <KpiTile
          icon={Wallet}
          label="Solde réel"
          value={(soldeReel >= 0 ? "+" : "") + fmt(soldeReel)}
          valueTone={soldeReel >= 0 ? "positive" : "negative"}
          sub={`prévu ${signed(soldePrevu)} TND`}
          delta={`${signed(soldeReel - soldePrevu)} TND vs prévu`}
          deltaTone={soldeReel - soldePrevu >= 0 ? "up" : "down"}
        />
      </div>

      {/* ── Écart par rubrique — the gap, ranked ───────────────────────── */}
      <EcartSection rows={rows} natureFilter={applied.nature} />

      {/* ── Taux de consommation — where each budget stands ────────────── */}
      <ConsumptionSection rows={rows} natureFilter={applied.nature} />

      {/* ── Detail ledger ──────────────────────────────────────────────── */}
      <DetailSection rows={rows} natureFilter={applied.nature} />
    </div>
  )
}

/* ── KPI tile ───────────────────────────────────────────────────────────── */
function KpiTile({
  icon: Icon,
  label,
  value,
  valueTone,
  sub,
  delta,
  deltaTone,
}: {
  icon: typeof TrendingUp
  label: string
  value: ReactNode
  valueTone?: "positive" | "negative"
  sub: string
  delta: string
  deltaTone: "up" | "down"
}) {
  return (
    <div className="rounded-lg border border-border px-5 py-[1.1rem]">
      <div className="flex items-center gap-1.5 font-ui text-[0.64rem] font-medium tracking-[0.1em] text-ink-muted uppercase">
        <Icon size={13} className="text-ink-disabled" />
        {label}
      </div>
      <div
        className={cn(
          "mt-2 font-display text-[1.9rem] leading-none font-semibold tabular-nums",
          valueTone === "positive" && "text-success",
          valueTone === "negative" && "text-danger",
          !valueTone && "text-ink",
        )}
      >
        {value}
      </div>
      <div className="mt-1.5 font-body text-[0.76rem] text-ink-muted tabular-nums">{sub}</div>
      <div
        className={cn(
          "mt-2 inline-flex items-center gap-1 font-ui text-[0.76rem] font-medium tabular-nums",
          deltaTone === "up" ? "text-success" : "text-danger",
        )}
      >
        {deltaTone === "up" ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
        {delta}
      </div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════════════
 * Écart par rubrique — diverging bars centred on zero
 * ════════════════════════════════════════════════════════════════════════════ */
function EcartSection({ rows, natureFilter }: { rows: Rubrique[]; natureFilter: NatureFilter }) {
  const ranked = useMemo(() => {
    const withE = rows.map((r) => ({ r, e: ecartOf(r) }))
    // biggest movers first (both directions)
    withE.sort((a, b) => Math.abs(b.e) - Math.abs(a.e))
    return natureFilter === "Tous" ? withE.slice(0, 10) : withE
  }, [rows, natureFilter])

  const maxAbs = Math.max(1, ...ranked.map((x) => Math.abs(x.e)))

  return (
    <Block
      icon={BarChart3}
      title="Écart par rubrique"
      right={
        <div className="flex items-center gap-3">
          <Legend items={[
            { label: "Favorable", cls: "bg-success-600" },
            { label: "Défavorable", cls: "bg-danger" },
          ]} />
          {natureFilter === "Tous" ? (
            <span className="font-body text-[0.7rem] text-ink-disabled">10 écarts les plus marquants</span>
          ) : null}
        </div>
      }
    >
      <div className="flex flex-col">
        {ranked.map(({ r, e }, i) => {
          const fav = e >= 0
          const pct = (Math.abs(e) / maxAbs) * 100
          const pctBudget = r.prevu > 0 ? Math.round((Math.abs(e) / r.prevu) * 100) : null
          return (
            <div
              key={r.label + i}
              className="grid grid-cols-[minmax(120px,1.1fr)_minmax(0,2fr)_minmax(96px,auto)] items-center gap-3 border-b border-border px-4 py-2.5 transition-colors last:border-0 hover:bg-surface-hover"
            >
              <div className="min-w-0">
                <div className="truncate font-body text-[0.84rem] text-ink">{r.label}</div>
                {natureFilter === "Tous" ? (
                  <div className="font-body text-[0.68rem] text-ink-disabled">{r.nature}</div>
                ) : null}
              </div>

              {/* diverging track */}
              <div className="relative h-5">
                <span className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-border-strong" />
                {fav ? (
                  <span
                    className="absolute top-1/2 left-1/2 h-[10px] -translate-y-1/2 rounded-r-[3px] bg-success-600"
                    style={{ width: `${pct / 2}%` }}
                  />
                ) : (
                  <span
                    className="absolute top-1/2 right-1/2 h-[10px] -translate-y-1/2 rounded-l-[3px] bg-danger"
                    style={{ width: `${pct / 2}%` }}
                  />
                )}
              </div>

              <div className="text-right">
                <span
                  className={cn(
                    "font-ui text-[0.82rem] font-medium tabular-nums",
                    fav ? "text-success" : "text-danger",
                  )}
                >
                  {signed(e)}
                </span>
                {pctBudget != null ? (
                  <span className="ml-1 font-body text-[0.68rem] text-ink-disabled">({pctBudget}%)</span>
                ) : null}
              </div>
            </div>
          )
        })}
      </div>
    </Block>
  )
}

/* ════════════════════════════════════════════════════════════════════════════
 * Taux de consommation — meter bars with the 80 % seuil marked
 * ════════════════════════════════════════════════════════════════════════════ */
function ConsumptionSection({ rows, natureFilter }: { rows: Rubrique[]; natureFilter: NatureFilter }) {
  const meterRows = useMemo(() => {
    const src = natureFilter === "Revenu" ? rows : rows.filter((r) => r.nature === "Dépense")
    return [...src].sort((a, b) => {
      const ra = ratioOf(a) ?? Infinity
      const rb = ratioOf(b) ?? Infinity
      return rb - ra
    })
  }, [rows, natureFilter])

  const isRevenu = natureFilter === "Revenu"

  return (
    <Block
      icon={Activity}
      title={isRevenu ? "Taux de réalisation par rubrique" : "Taux de consommation par rubrique"}
      right={
        <span className="font-body text-[0.7rem] text-ink-disabled">
          Seuil d'alerte {Math.round(SEUIL * 100)}%
        </span>
      }
    >
      <div className="flex flex-col">
        {meterRows.map((r) => {
          const ratio = ratioOf(r)
          const pct = ratio == null ? null : Math.round(ratio * 100)
          const noPlan = r.prevu === 0 && r.reel > 0
          return (
            <div
              key={r.label}
              className="grid grid-cols-[minmax(120px,1fr)_minmax(0,1.6fr)_auto] items-center gap-3 border-b border-border px-4 py-2.5 last:border-0 hover:bg-surface-hover"
            >
              <div className="flex min-w-0 items-center gap-2">
                <span className="truncate font-body text-[0.84rem] text-ink">{r.label}</span>
                {noPlan ? (
                  <span className="shrink-0 rounded-sm border border-danger/25 bg-danger/10 px-1.5 py-0.5 font-ui text-[0.54rem] font-medium tracking-[0.04em] text-danger uppercase">
                    Hors budget
                  </span>
                ) : null}
              </div>
              <Meter pct={pct} tone="info" />
              <div className="flex items-center justify-end gap-3">
                <span className="hidden font-body text-[0.74rem] text-ink-muted tabular-nums sm:inline">
                  {fmtShort(r.reel)} / {r.prevu ? fmtShort(r.prevu) : "—"}
                </span>
                <span className="w-11 text-right font-ui text-[0.8rem] font-medium tabular-nums text-ink-subtle">
                  {pct == null ? "—" : `${pct}%`}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </Block>
  )
}

type MeterTone = "info" | "warning" | "danger"
const METER_FILL: Record<MeterTone, string> = {
  info: "bg-info",
  warning: "bg-warning",
  danger: "bg-danger",
}

function Meter({ pct, tone }: { pct: number | null; tone: MeterTone }) {
  const width = pct == null ? 100 : Math.min(pct, 100)
  return (
    <div className="relative h-2 overflow-hidden rounded bg-accent">
      <div
        className={cn("h-full rounded transition-[width] duration-500", METER_FILL[tone])}
        style={{ width: width + "%" }}
      />
      <span
        aria-hidden
        className="absolute inset-y-0 w-px bg-border-strong"
        style={{ left: `${Math.round(SEUIL * 100)}%` }}
      />
    </div>
  )
}

/* ════════════════════════════════════════════════════════════════════════════
 * Detail ledger
 * ════════════════════════════════════════════════════════════════════════════ */
function DetailSection({ rows, natureFilter }: { rows: Rubrique[]; natureFilter: NatureFilter }) {
  const catRows = rows.filter((r) => r.section === "generales" || r.section === "revenus")
  const teamStaffRows = rows.filter((r) => r.section === "equipes" || r.section === "staff")
  return (
    <>
      {catRows.length ? (
        <DetailTable title="Détail par catégorie" rows={catRows} natureFilter={natureFilter} />
      ) : null}
      {teamStaffRows.length ? (
        <DetailTable
          title="Détail par équipe & staff"
          rows={teamStaffRows}
          natureFilter={natureFilter}
        />
      ) : null}
    </>
  )
}

/* One detail table (a slice of rubriques — categories, or équipes & staff). */
function DetailTable({
  title,
  rows,
  natureFilter,
}: {
  title: string
  rows: Rubrique[]
  natureFilter: NatureFilter
}) {
  const sorted = useMemo(
    () => [...rows].sort((a, b) => ecartOf(a) - ecartOf(b)), // worst écarts first
    [rows],
  )
  const totPrevu = rows.reduce((s, r) => s + r.prevu, 0)
  const totReel = rows.reduce((s, r) => s + r.reel, 0)

  return (
    <Block icon={Scale} title={title}>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-border">
              <Th>Rubrique</Th>
              <Th align="right">Prévu</Th>
              <Th align="right">Réel</Th>
              <Th align="right">Écart</Th>
              <Th align="right">Écart %</Th>
              <Th align="right">Statut</Th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => {
              const e = ecartOf(r)
              const fav = e >= 0
              const pctBudget = r.prevu > 0 ? Math.round((Math.abs(e) / r.prevu) * 100) : null
              const st = statusOf(r)
              return (
                <tr key={r.label} className="border-b border-border last:border-0 hover:bg-surface-hover">
                  <td className="px-4 py-2.5">
                    <div className="font-body text-[0.84rem] text-ink">{r.label}</div>
                    {natureFilter === "Tous" ? (
                      <div className="font-body text-[0.68rem] text-ink-disabled">
                        {r.nature} · {SECTION_LABEL[r.section]}
                      </div>
                    ) : (
                      <div className="font-body text-[0.68rem] text-ink-disabled">
                        {SECTION_LABEL[r.section]}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right font-body text-[0.82rem] text-ink-muted tabular-nums">
                    {r.prevu ? fmtShort(r.prevu) : "—"}
                  </td>
                  <td className="px-4 py-2.5 text-right font-body text-[0.82rem] text-ink-subtle tabular-nums">
                    {fmtShort(r.reel)}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {e === 0 ? (
                      <span className="font-body text-[0.82rem] text-ink-disabled">—</span>
                    ) : (
                      <span
                        className={cn(
                          "font-ui text-[0.82rem] font-medium tabular-nums",
                          fav ? "text-success" : "text-danger",
                        )}
                      >
                        {signed(e)}
                      </span>
                    )}
                  </td>
                  <td
                    className={cn(
                      "px-4 py-2.5 text-right font-body text-[0.8rem] tabular-nums",
                      e === 0 ? "text-ink-disabled" : fav ? "text-success/80" : "text-danger/80",
                    )}
                  >
                    {pctBudget == null ? "—" : `${fav ? "+" : "−"}${pctBudget}%`}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <Badge variant={st.variant}>{st.label}</Badge>
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr className="border-t border-border-second">
              <td className="px-4 py-2.5 font-ui text-[0.82rem] font-medium text-ink">Total</td>
              <td className="px-4 py-2.5 text-right font-ui text-[0.82rem] font-medium text-ink-subtle tabular-nums">
                {fmtShort(totPrevu)}
              </td>
              <td className="px-4 py-2.5 text-right font-ui text-[0.82rem] font-medium text-ink-subtle tabular-nums">
                {fmtShort(totReel)}
              </td>
              <td className="px-4 py-2.5 text-right font-ui text-[0.82rem] font-semibold tabular-nums" colSpan={3}>
                <span className={totReel <= totPrevu ? "text-success" : "text-danger"}>
                  {signed(totPrevu - totReel)} TND{" "}
                  <span className="font-normal text-ink-disabled">
                    ({natureFilter === "Revenu" ? "recettes" : "écart"})
                  </span>
                </span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </Block>
  )
}

type StatusMeta = { label: string; variant: "success" | "warning" | "danger" | "info" | "neutral" }
function statusOf(r: Rubrique): StatusMeta {
  const ratio = ratioOf(r)
  if (r.nature === "Dépense") {
    if (r.prevu === 0 && r.reel > 0) return { label: "Hors budget", variant: "danger" }
    if (ratio != null && ratio > 1) return { label: "Dépassement", variant: "danger" }
    if (ratio != null && ratio >= SEUIL) return { label: "Proche du seuil", variant: "warning" }
    return { label: "Maîtrisé", variant: "success" }
  }
  // Revenu
  if (r.prevu === 0 && r.reel > 0) return { label: "Recette imprévue", variant: "info" }
  if (ratio != null && ratio >= 1) return { label: "Objectif atteint", variant: "success" }
  if (ratio != null && ratio >= 0.85) return { label: "Proche de l'objectif", variant: "warning" }
  return { label: "En retrait", variant: "danger" }
}

/* ════════════════════════════════════════════════════════════════════════════
 * Shared bits
 * ════════════════════════════════════════════════════════════════════════════ */
function Block({
  icon: Icon,
  title,
  right,
  children,
}: {
  icon: typeof BarChart3
  title: string
  right?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-border">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Icon size={15} className="text-ink-muted" />
          <h2 className="font-ui text-[0.78rem] font-medium tracking-[0.06em] text-ink-subtle uppercase">
            {title}
          </h2>
        </div>
        {right}
      </div>
      {children}
    </section>
  )
}

function Legend({ items }: { items: { label: string; cls: string }[] }) {
  return (
    <div className="flex items-center gap-3 font-body text-[0.7rem] text-ink-muted">
      {items.map((it) => (
        <span key={it.label} className="inline-flex items-center gap-1.5">
          <span className={cn("size-2.5 rounded-full", it.cls)} />
          {it.label}
        </span>
      ))}
    </div>
  )
}

function Th({ children, align = "left" }: { children?: ReactNode; align?: "left" | "right" }) {
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
