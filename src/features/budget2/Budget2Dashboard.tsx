import { useMemo, useState, type ReactNode } from "react"
import { useNavigate } from "react-router-dom"
import {
  AlertTriangle,
  ArrowRight,
  ChevronDown,
  LineChart,
  Receipt,
  Scale,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { fmt, fmtShort, fmtFrDate } from "@/lib/format"
import { useData } from "@/data/useData"
import { draftLines, type Budget2Season } from "@/data/seed/budget2"
import type { FinanceTeam, StaffMember, Transaction } from "@/data/seed/finance"
import { byId } from "@/features/budget2/helpers"
import { categoryPath } from "@/features/finance/helpers"
import {
  buildSuivi,
  buildTeamSuivi,
  pctOf,
  signed,
  SUIVI_SEUIL,
  type SuiviAlert,
  type SuiviNature,
  type SuiviRow,
  type TeamSuiviRow,
} from "@/features/budget2/suivi"
import { NaturePill } from "@/features/finance/ui"
import { Segmented, TeamChip } from "@/features/budget/ui"
import { Badge } from "@/components/kit/Badge"
import { EmptyState } from "@/components/kit/EmptyState"

const SEUIL_PCT = Math.round(SUIVI_SEUIL * 100)
const TX_PAGE = 8

/**
 * Budget 2 — Dashboard (Suivi budgétaire). Compares the season's realised
 * transactions (réel, from Finance) with its validated reference budget (prévu)
 * category by category, surfaces the categories drifting over their limit, and
 * lists the movements that feed the réel.
 *
 * Referenced screens: Budget2CompareScreen (table + delta patterns), the
 * Finance TransactionsScreen (row style, NaturePill/scope), and budget/ui
 * (Stat rhythm, Bar, Segmented). Prévu/réel are joined by referential category
 * since Budget 2 and Finance share the same Groupe ids.
 */
export function Budget2Dashboard({ season }: { season: Budget2Season }) {
  const navigate = useNavigate()
  const {
    budget2,
    transactions,
    groups,
    subCategories,
    financeConfig,
    financeTeams,
    staff,
  } = useData()

  const groupMap = useMemo(() => byId(groups), [groups])
  const subMap = useMemo(() => byId(subCategories), [subCategories])
  const teamMap = useMemo(() => byId(financeTeams), [financeTeams])
  const staffMap = useMemo(() => byId(staff), [staff])

  // The reference = the season's single validated draft.
  const validated = useMemo(
    () =>
      budget2.drafts.find(
        (d) => d.season_id === season.id && d.status === "valide",
      ),
    [budget2.drafts, season.id],
  )

  // Réel = active-season transactions, not soft-deleted. (The prototype holds
  // one active season of movements — the same season as the validated plan.)
  const realTx = useMemo(
    () =>
      transactions.filter(
        (t) => !t.is_deleted && t.season === financeConfig.active_season,
      ),
    [transactions, financeConfig.active_season],
  )

  const planLines = useMemo(
    () => (validated ? draftLines(budget2.lines, validated.id) : []),
    [budget2.lines, validated],
  )

  const suivi = useMemo(
    () => buildSuivi(planLines, realTx, groupMap),
    [planLines, realTx, groupMap],
  )

  const teamSuivi = useMemo(
    () => buildTeamSuivi(planLines, budget2.groups, realTx, teamMap),
    [planLines, budget2.groups, realTx, teamMap],
  )

  const [txNature, setTxNature] = useState<"all" | "Dépense" | "Revenu">("all")
  const [txVisible, setTxVisible] = useState(TX_PAGE)

  const txRows = useMemo(() => {
    const rows = realTx.filter((t) => txNature === "all" || t.nature === txNature)
    return rows.sort((a, b) => b.date.localeCompare(a.date))
  }, [realTx, txNature])

  /* ── No reference budget yet ──────────────────────────────────────────── */
  if (!validated) {
    return (
      <div className="mt-6 rounded-lg border border-border">
        <EmptyState
          icon={LineChart}
          title="Aucun budget validé"
          description="Le suivi compare le réalisé au budget de référence. Validez un brouillon pour cette saison afin de lancer le suivi."
          action={
            <button
              type="button"
              onClick={() => navigate(`/budget2/${season.id}/brouillon`)}
              className="inline-flex items-center gap-1.5 rounded-md bg-brand px-4 py-2 font-ui text-sm font-medium text-ink-inverted shadow-glow transition-colors hover:bg-brand-dim"
            >
              Aller aux brouillons <ArrowRight size={15} />
            </button>
          }
        />
      </div>
    )
  }

  const { totals, alerts, depenses, revenus } = suivi

  return (
    <div className="mt-6 flex flex-col gap-4 pb-16">
      {/* ── KPI cards ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <PlanRealCard
          label="Recettes réelles"
          icon={TrendingUp}
          prevu={totals.prevuRev}
          reel={totals.reelRev}
          nature="Revenu"
        />
        <PlanRealCard
          label="Dépenses réelles"
          icon={TrendingDown}
          prevu={totals.prevuDep}
          reel={totals.reelDep}
          nature="Dépense"
        />
        <SoldeCard reel={totals.soldeReel} prevu={totals.soldePrevu} />
      </div>

      {/* ── Alertes budget — collapsible, closed by default, all red ────── */}
      <AlertsSection alerts={alerts} />

      {/* ── Réel vs prévu par catégorie ────────────────────────────────── */}
      <Section
        title={
          <>
            <Scale size={15} className="text-ink-muted" />
            <span className="font-ui text-[0.78rem] font-medium tracking-[0.06em] text-ink-subtle uppercase">
              Dépenses — réel vs prévu
            </span>
          </>
        }
      >
        <BreakdownTable rows={depenses} nature="Dépense" />
      </Section>

      <Section
        title={
          <>
            <Scale size={15} className="text-ink-muted" />
            <span className="font-ui text-[0.78rem] font-medium tracking-[0.06em] text-ink-subtle uppercase">
              Recettes — réel vs prévu
            </span>
          </>
        }
      >
        <BreakdownTable rows={revenus} nature="Revenu" />
      </Section>

      {/* ── Équipes — réel vs prévu (par équipe & groupe de teams) ──────── */}
      <Section
        title={
          <>
            <Users size={15} className="text-ink-muted" />
            <span className="font-ui text-[0.78rem] font-medium tracking-[0.06em] text-ink-subtle uppercase">
              Équipes — réel vs prévu
            </span>
          </>
        }
        right={
          <span className="font-body text-[0.72rem] text-ink-disabled">
            Dépenses par équipe et groupe d'équipes
          </span>
        }
      >
        <TeamBreakdownTable rows={teamSuivi} />
      </Section>

      {/* ── Transactions réalisées ─────────────────────────────────────── */}
      <Section
        title={
          <>
            <Receipt size={15} className="text-ink-muted" />
            <span className="font-ui text-[0.78rem] font-medium tracking-[0.06em] text-ink-subtle uppercase">
              Transactions réalisées
            </span>
            <span className="rounded-full bg-accent px-1.5 text-[0.66rem] tabular-nums text-ink-muted">
              {txRows.length}
            </span>
          </>
        }
        right={
          <div className="flex items-center gap-2">
            <Segmented
              value={txNature}
              onChange={(v) => {
                setTxNature(v)
                setTxVisible(TX_PAGE)
              }}
              options={[
                { value: "all", label: "Tous" },
                { value: "Dépense", label: "Dépenses" },
                { value: "Revenu", label: "Recettes" },
              ]}
            />
            <button
              type="button"
              onClick={() => navigate("/finance/transactions")}
              className="inline-flex items-center gap-1 font-ui text-[0.7rem] font-medium tracking-[0.05em] text-info uppercase transition-opacity hover:opacity-80"
            >
              Voir tout <ArrowRight size={13} />
            </button>
          </div>
        }
      >
        {txRows.length === 0 ? (
          <p className="px-4 py-10 text-center font-body text-[0.84rem] text-ink-muted">
            Aucune transaction pour ce filtre.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <Th>Date</Th>
                  <Th>Nature</Th>
                  <Th>Catégorie</Th>
                  <Th>Portée</Th>
                  <Th align="right">Montant</Th>
                </tr>
              </thead>
              <tbody>
                {txRows.slice(0, txVisible).map((t) => {
                  const { group, sub } = categoryPath(t, groupMap, subMap)
                  const revenu = t.nature === "Revenu"
                  return (
                    <tr
                      key={t.id}
                      className="border-b border-border transition-colors last:border-0 hover:bg-surface-hover"
                    >
                      <td className="px-4 py-3 font-body text-[0.8rem] whitespace-nowrap text-ink-muted tabular-nums">
                        {fmtFrDate(t.date)}
                      </td>
                      <td className="px-4 py-3">
                        <NaturePill nature={t.nature} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-body text-[0.84rem] text-ink">
                          {t.label ?? sub}
                        </div>
                        <div className="font-body text-[0.72rem] text-ink-disabled">
                          {group}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <ScopeMini tx={t} teamMap={teamMap} staffMap={staffMap} />
                      </td>
                      <td
                        className={cn(
                          "px-4 py-3 text-right font-body text-[0.85rem] whitespace-nowrap tabular-nums",
                          revenu ? "text-success" : "text-danger",
                        )}
                      >
                        {revenu ? "+" : "−"}
                        {fmtShort(t.amount)} TND
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>

            {txRows.length > txVisible ? (
              <div className="flex items-center justify-center border-t border-border py-3">
                <button
                  type="button"
                  onClick={() => setTxVisible((v) => v + TX_PAGE)}
                  className="inline-flex items-center gap-1.5 rounded-md border border-input px-3.5 py-1.5 font-ui text-[0.78rem] font-medium text-ink-subtle transition-colors hover:border-border-strong hover:text-ink"
                >
                  Charger plus ({txRows.length - txVisible})
                </button>
              </div>
            ) : (
              <div className="border-t border-border px-4 py-2.5 text-right font-body text-[0.72rem] text-ink-disabled tabular-nums">
                {txRows.length} transaction{txRows.length > 1 ? "s" : ""}
              </div>
            )}
          </div>
        )}
      </Section>
    </div>
  )
}

/* ── KPI: plan vs real (Recettes / Dépenses) ───────────────────────────────
   Value = réel; below it the prévu, a consumption/collection bar, and a
   context footer (disponible / reste à encaisser / dépassement). Bars stay
   info/warning/danger — never green (green is buttons only). */
function PlanRealCard({
  label,
  icon: Icon,
  prevu,
  reel,
  nature,
}: {
  label: string
  icon: typeof TrendingUp
  prevu: number
  reel: number
  nature: SuiviNature
}) {
  const ratio = prevu > 0 ? reel / prevu : reel > 0 ? 1 : 0
  const pct = Math.round(ratio * 100)
  const reste = prevu - reel
  const isDep = nature === "Dépense"
  const over = isDep && reste < 0

  const barTone: BarTone = !isDep
    ? "info"
    : ratio > 1
      ? "danger"
      : ratio >= SUIVI_SEUIL
        ? "warning"
        : "info"

  // Footer message: dépense → disponible / dépassement ; revenu → reste / dépassé.
  let footer: ReactNode
  if (isDep) {
    footer = over ? (
      <span className="text-danger">
        Dépassement {fmtShort(Math.abs(reste))} TND
      </span>
    ) : (
      <span className="text-success">Disponible {fmtShort(reste)} TND</span>
    )
  } else {
    footer =
      reste > 0 ? (
        <span className="text-ink-muted">
          Reste à encaisser {fmtShort(reste)} TND
        </span>
      ) : (
        <span className="text-success">
          Objectif dépassé de {fmtShort(Math.abs(reste))} TND
        </span>
      )
  }

  return (
    <div className="rounded-lg border border-border px-5 py-[1.1rem]">
      <div className="flex items-center gap-1.5 font-ui text-[0.66rem] font-medium tracking-[0.1em] text-ink-muted uppercase">
        <Icon size={13} className="text-ink-disabled" />
        {label}
      </div>
      <div
        className={cn(
          "mt-2 font-display text-[2.05rem] leading-none font-semibold tabular-nums",
          isDep ? "text-danger" : "text-success",
        )}
      >
        {fmt(reel)}
      </div>
      <div className="mt-1.5 font-body text-[0.78rem] text-ink-muted tabular-nums">
        sur <span className="text-ink-subtle">{fmtShort(prevu)} prévu</span>
      </div>
      <div className="mt-3 flex items-center gap-2.5">
        <div className="min-w-0 flex-1">
          <TrackBar pct={pct} tone={barTone} />
        </div>
        <span className="w-10 shrink-0 text-right font-ui text-[0.78rem] font-medium text-ink tabular-nums">
          {pct}%
        </span>
      </div>
      <div className="mt-2.5 font-body text-[0.78rem] tabular-nums">{footer}</div>
    </div>
  )
}

/* ── KPI: solde réel vs prévu ──────────────────────────────────────────── */
function SoldeCard({ reel, prevu }: { reel: number; prevu: number }) {
  const delta = reel - prevu
  return (
    <div className="rounded-lg border border-border px-5 py-[1.1rem]">
      <div className="flex items-center gap-1.5 font-ui text-[0.66rem] font-medium tracking-[0.1em] text-ink-muted uppercase">
        <Scale size={13} className="text-ink-disabled" />
        Solde réel
      </div>
      <div
        className={cn(
          "mt-2 font-display text-[2.05rem] leading-none font-semibold tabular-nums",
          reel >= 0 ? "text-success" : "text-danger",
        )}
      >
        {(reel >= 0 ? "+" : "") + fmt(reel)}
      </div>
      <div className="mt-1.5 font-body text-[0.78rem] text-ink-muted tabular-nums">
        Prévu <span className="text-ink-subtle">{signed(prevu)} TND</span>
      </div>
      <div className="mt-3 h-[7px]" aria-hidden />
      <div className="mt-2.5 font-body text-[0.78rem] tabular-nums">
        {delta === 0 ? (
          <span className="text-ink-muted">Conforme au prévu</span>
        ) : (
          <span className={delta > 0 ? "text-success" : "text-danger"}>
            {signed(delta)} TND vs prévu
          </span>
        )}
      </div>
    </div>
  )
}

/* ── Alertes — collapsible section, closed by default, every alert red ───
   Header stays visible with the count; the list expands on click. All alerts
   render in the danger (red) tone regardless of level. */
function AlertsSection({ alerts }: { alerts: SuiviAlert[] }) {
  const [open, setOpen] = useState(false)
  const has = alerts.length > 0
  return (
    <section className="overflow-hidden rounded-lg border border-border">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left transition-colors hover:bg-surface-hover"
      >
        <div className="flex items-center gap-2">
          <AlertTriangle
            size={16}
            className={has ? "text-danger" : "text-ink-muted"}
          />
          <span className="font-ui text-[0.78rem] font-medium tracking-[0.06em] text-ink-subtle uppercase">
            Alertes budget
          </span>
          <span
            className={cn(
              "rounded-full px-1.5 text-[0.66rem] tabular-nums",
              has ? "bg-danger/15 text-danger" : "bg-accent text-ink-muted",
            )}
          >
            {alerts.length}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden font-body text-[0.72rem] text-ink-disabled sm:inline">
            Seuil d'alerte {SEUIL_PCT}% du budget
          </span>
          <ChevronDown
            size={16}
            className={cn(
              "text-ink-muted transition-transform duration-200",
              open && "rotate-180",
            )}
          />
        </div>
      </button>

      {open ? (
        has ? (
          <div className="border-t border-border">
            {alerts.map((a) => (
              <AlertRow key={a.groupId} alert={a} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 border-t border-border px-4 py-10 text-center">
            <span className="flex size-10 items-center justify-center rounded-full bg-info/10 text-info">
              <ShieldCheck size={18} />
            </span>
            <p className="font-ui text-[0.9rem] font-medium text-ink">
              Aucune alerte
            </p>
            <p className="max-w-sm font-body text-[0.8rem] text-ink-muted">
              Toutes les catégories de dépenses restent sous le seuil de{" "}
              {SEUIL_PCT}% de leur budget prévu.
            </p>
          </div>
        )
      ) : null}
    </section>
  )
}

/* ── Alert row (one drifting dépense category) — always red ────────────── */
function AlertRow({ alert: a }: { alert: SuiviAlert }) {
  const pct = pctOf(a.ratio)
  return (
    <div className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-0">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-danger/10 text-danger">
        <AlertTriangle size={15} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate font-ui text-[0.88rem] font-medium text-ink">
            {a.label}
          </span>
          <span className="shrink-0 rounded-pill border border-danger/25 bg-danger/10 px-2 py-0.5 font-ui text-[0.58rem] font-medium tracking-[0.06em] text-danger uppercase">
            {a.reason}
          </span>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 font-body text-[0.74rem] text-ink-muted tabular-nums">
          <span>
            Prévu{" "}
            <span className="text-ink-subtle">
              {a.prevu ? fmtShort(a.prevu) : "—"}
            </span>
          </span>
          <span>
            Réel <span className="text-ink">{fmtShort(a.reel)}</span>
          </span>
          <span className="text-danger">
            {pct == null ? "Sans budget prévu" : `${pct}% consommé`}
          </span>
        </div>
      </div>
      <span className="shrink-0 font-ui text-[0.85rem] font-medium text-danger tabular-nums">
        {signed(a.ecart)} TND
      </span>
    </div>
  )
}

/* ── Réel vs prévu breakdown table ─────────────────────────────────────── */
function BreakdownTable({
  rows,
  nature,
}: {
  rows: SuiviRow[]
  nature: SuiviNature
}) {
  if (!rows.length) {
    return (
      <p className="px-4 py-8 text-center font-body text-[0.82rem] text-ink-disabled">
        Aucune catégorie.
      </p>
    )
  }
  const totPrevu = rows.reduce((s, r) => s + r.prevu, 0)
  const totReel = rows.reduce((s, r) => s + r.reel, 0)
  const totEcart = nature === "Dépense" ? totPrevu - totReel : totReel - totPrevu

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-border">
            <Th>Catégorie</Th>
            <Th align="right">Prévu</Th>
            <Th align="right">Réel</Th>
            <Th align="right">Écart</Th>
            <th className="w-[128px] px-4 py-2.5" aria-hidden />
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const pct = pctOf(r.ratio)
            const noPlan = r.prevu === 0 && r.reel > 0
            const over = nature === "Dépense" && r.ratio != null && r.ratio > 1
            const near =
              nature === "Dépense" &&
              r.ratio != null &&
              r.ratio >= SUIVI_SEUIL &&
              r.ratio <= 1
            const barTone: BarTone =
              nature === "Revenu"
                ? "info"
                : over || noPlan
                  ? "danger"
                  : near
                    ? "warning"
                    : "info"
            return (
              <tr
                key={r.groupId}
                className="border-b border-border last:border-0 hover:bg-surface-hover"
              >
                <td className="px-4 py-2.5">
                  <span className="font-body text-[0.84rem] text-ink">
                    {r.label}
                  </span>
                  {noPlan ? (
                    <span className="ml-2 rounded-sm border border-danger/25 bg-danger/10 px-1.5 py-0.5 font-ui text-[0.56rem] font-medium tracking-[0.04em] text-danger uppercase">
                      Hors budget
                    </span>
                  ) : null}
                </td>
                <td className="px-4 py-2.5 text-right font-body text-[0.82rem] text-ink-muted tabular-nums">
                  {r.prevu ? fmtShort(r.prevu) : "—"}
                </td>
                <td className="px-4 py-2.5 text-right font-body text-[0.82rem] text-ink-subtle tabular-nums">
                  {fmtShort(r.reel)}
                </td>
                <td className="px-4 py-2.5 text-right">
                  <EcartText row={r} />
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="min-w-[54px] flex-1">
                      <TrackBar pct={pct ?? 100} tone={barTone} />
                    </div>
                    <span className="w-9 text-right font-body text-[0.7rem] text-ink-disabled tabular-nums">
                      {pct != null ? `${pct}%` : "—"}
                    </span>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
        <tfoot>
          <tr className="border-t border-border-second">
            <td className="px-4 py-2.5 font-ui text-[0.82rem] font-medium text-ink">
              Total
            </td>
            <td className="px-4 py-2.5 text-right font-ui text-[0.82rem] font-medium text-ink-subtle tabular-nums">
              {fmtShort(totPrevu)}
            </td>
            <td className="px-4 py-2.5 text-right font-ui text-[0.82rem] font-medium text-ink-subtle tabular-nums">
              {fmtShort(totReel)}
            </td>
            <td className="px-4 py-2.5 text-right font-ui text-[0.82rem] font-semibold tabular-nums">
              <span className={totEcart >= 0 ? "text-success" : "text-danger"}>
                {signed(totEcart)}
              </span>
            </td>
            <td aria-hidden />
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

function EcartText({ row }: { row: SuiviRow }) {
  if (row.ecart === 0) {
    return <span className="font-body text-[0.82rem] text-ink-disabled">—</span>
  }
  return (
    <span
      className={cn(
        "font-ui text-[0.82rem] font-medium tabular-nums",
        row.favorable ? "text-success" : "text-danger",
      )}
    >
      {signed(row.ecart)}
    </span>
  )
}

/* ── Réel vs prévu by team / team-group ─────────────────────────────────
   Consumption view (dépenses): prévu = validated plan's team-scoped lines,
   réel = équipe-scoped movements. A group row pools its member teams; a team
   spent-against with no plan line is flagged "Hors budget". */
function TeamBreakdownTable({ rows }: { rows: TeamSuiviRow[] }) {
  if (!rows.length) {
    return (
      <p className="px-4 py-8 text-center font-body text-[0.82rem] text-ink-disabled">
        Aucune dépense rattachée à une équipe.
      </p>
    )
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-border">
            <Th>Équipe / Groupe</Th>
            <Th align="right">Prévu</Th>
            <Th align="right">Réel</Th>
            <Th align="right">Écart</Th>
            <th className="w-[128px] px-4 py-2.5" aria-hidden />
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const pct = pctOf(r.ratio)
            const over = r.ratio != null && r.ratio > 1
            const near = r.ratio != null && r.ratio >= SUIVI_SEUIL && r.ratio <= 1
            const barTone: BarTone =
              over || r.noPlan ? "danger" : near ? "warning" : "info"
            return (
              <tr
                key={r.key}
                className="border-b border-border last:border-0 hover:bg-surface-hover"
              >
                <td className="px-4 py-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-body text-[0.84rem] text-ink">
                      {r.label}
                    </span>
                    {r.isGroup ? (
                      <span className="rounded-sm border border-info/25 bg-info/10 px-1.5 py-0.5 font-ui text-[0.56rem] font-medium tracking-[0.04em] text-info uppercase">
                        Groupe
                      </span>
                    ) : null}
                    {r.noPlan ? (
                      <span className="rounded-sm border border-danger/25 bg-danger/10 px-1.5 py-0.5 font-ui text-[0.56rem] font-medium tracking-[0.04em] text-danger uppercase">
                        Hors budget
                      </span>
                    ) : null}
                  </div>
                  {r.memberNames ? (
                    <div className="mt-0.5 font-body text-[0.7rem] text-ink-disabled">
                      {r.memberNames}
                    </div>
                  ) : null}
                </td>
                <td className="px-4 py-2.5 text-right font-body text-[0.82rem] text-ink-muted tabular-nums">
                  {r.prevu ? fmtShort(r.prevu) : "—"}
                </td>
                <td className="px-4 py-2.5 text-right font-body text-[0.82rem] text-ink-subtle tabular-nums">
                  {fmtShort(r.reel)}
                </td>
                <td className="px-4 py-2.5 text-right">
                  {r.ecart === 0 ? (
                    <span className="font-body text-[0.82rem] text-ink-disabled">
                      —
                    </span>
                  ) : (
                    <span
                      className={cn(
                        "font-ui text-[0.82rem] font-medium tabular-nums",
                        r.favorable ? "text-success" : "text-danger",
                      )}
                    >
                      {signed(r.ecart)}
                    </span>
                  )}
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="min-w-[54px] flex-1">
                      <TrackBar pct={pct ?? 100} tone={barTone} />
                    </div>
                    <span className="w-9 text-right font-body text-[0.7rem] text-ink-disabled tabular-nums">
                      {pct != null ? `${pct}%` : "—"}
                    </span>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

/* ── Bars ──────────────────────────────────────────────────────────────── */
type BarTone = "info" | "warning" | "danger"
const BAR_FILL: Record<BarTone, string> = {
  info: "bg-info",
  warning: "bg-warning",
  danger: "bg-danger",
}

function TrackBar({ pct, tone }: { pct: number; tone: BarTone }) {
  return (
    <div className="h-[7px] overflow-hidden rounded bg-accent">
      <div
        className={cn("h-full rounded transition-[width] duration-500", BAR_FILL[tone])}
        style={{ width: Math.min(Math.max(pct, 0), 100) + "%" }}
      />
    </div>
  )
}

/* ── Section shell (bordered card: header + body) ──────────────────────── */
function Section({
  title,
  right,
  children,
}: {
  title: ReactNode
  right?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-border">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">{title}</div>
        {right}
      </div>
      {children}
    </section>
  )
}

/* ── Compact scope cell (mirrors the Finance table) ────────────────────── */
function ScopeMini({
  tx,
  teamMap,
  staffMap,
}: {
  tx: Transaction
  teamMap: Map<string, FinanceTeam>
  staffMap: Map<string, StaffMember>
}) {
  if (tx.scope === "general") return <Badge variant="default">Général</Badge>
  if (tx.scope === "equipe") {
    return (
      <div className="flex flex-wrap gap-1">
        {tx.team_ids.map((id) => (
          <TeamChip key={id} sm>
            {teamMap.get(id)?.name ?? id}
          </TeamChip>
        ))}
      </div>
    )
  }
  const member = tx.staff_member_id ? staffMap.get(tx.staff_member_id) : undefined
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Badge variant="info">Staff</Badge>
      {tx.staff_category ? (
        <span className="font-body text-[0.72rem] text-ink-muted">
          {tx.staff_category}
        </span>
      ) : null}
      {member ? (
        <span className="font-body text-[0.72rem] text-ink-disabled">
          · {member.full_name}
        </span>
      ) : null}
    </div>
  )
}

/* ── Table header cell ─────────────────────────────────────────────────── */
function Th({
  children,
  align = "left",
}: {
  children?: ReactNode
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
