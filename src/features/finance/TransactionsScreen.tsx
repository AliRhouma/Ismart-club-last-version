import { useEffect, useMemo, useRef, useState } from "react"
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronDown,
  Copy,
  Download,
  History,
  Inbox,
  Info,
  LayoutList,
  Paperclip,
  Pencil,
  Plus,
  Rows3,
  Search,
  SlidersHorizontal,
  Trash2,
  Wallet,
  X,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { fmt, fmtShort, fmtAmount, fmtFrDate, fmtMonthYear, fmtDayLong } from "@/lib/format"
import { useData } from "@/data/useData"
import type {
  FinanceTeam,
  Nature,
  PaymentMethod,
  Scope,
  StaffMember,
  Transaction,
} from "@/data/seed/finance"
import { byId, categoryPath } from "@/features/finance/helpers"
import { exportTransactionsCsv } from "@/features/finance/export"
import { Field, Kpi, NaturePill, Select } from "@/features/finance/ui"
import { TransactionDrawer, type DrawerMode } from "@/features/finance/TransactionDrawer"
import { HistoriquePanel } from "@/features/finance/HistoriquePanel"
import { DemandesModal } from "@/features/finance/DemandesModal"
import { Badge } from "@/components/kit/Badge"
import { TeamChip } from "@/features/budget/ui"
import { Segmented } from "@/features/budget/ui"
import { PageHeader } from "@/components/kit/PageHeader"
import { EmptyState } from "@/components/kit/EmptyState"
import { ConfirmDialog } from "@/components/kit/ConfirmDialog"

type ViewMode = "ledger" | "table"
type SortKey = "date" | "amount"
type Filters = {
  nature: string
  groupId: string
  subId: string
  scope: string
  teamId: string
  payment: string
  from: string
  to: string
}
const EMPTY_FILTERS: Filters = {
  nature: "",
  groupId: "",
  subId: "",
  scope: "",
  teamId: "",
  payment: "",
  from: "",
  to: "",
}
const PAGE = 12
const PAYMENTS: PaymentMethod[] = ["Espèces", "Virement", "Chèque", "Carte"]
const SCOPES: { value: Scope; label: string }[] = [
  { value: "general", label: "Général" },
  { value: "equipe", label: "Équipe" },
  { value: "staff", label: "Staff" },
]
/** Single treasurer records every entry in this club (matches the ledger design). */
const RECORDED_BY = "Foued Ben Jemaa"

export function TransactionsScreen() {
  const {
    financeConfig,
    transactions,
    transactionRequests,
    groups,
    subCategories,
    financeTeams,
    staff,
    deleteTransaction,
  } = useData()

  const groupMap = useMemo(() => byId(groups), [groups])
  const subMap = useMemo(() => byId(subCategories), [subCategories])
  const teamMap = useMemo(() => byId(financeTeams), [financeTeams])
  const staffMap = useMemo(() => byId(staff), [staff])

  const [view, setView] = useState<ViewMode>("ledger")
  const [query, setQuery] = useState("")
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS)
  const [showFilters, setShowFilters] = useState(false)
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({
    key: "date",
    dir: "desc",
  })
  const [visible, setVisible] = useState(PAGE)

  const [drawer, setDrawer] = useState<{ mode: DrawerMode; source: Transaction | null } | null>(null)
  const [confirm, setConfirm] = useState<Transaction | null>(null)
  const [historique, setHistorique] = useState(false)
  const [demandes, setDemandes] = useState(false)
  const [menu, setMenu] = useState<{ tx: Transaction; top: number; right: number } | null>(null)
  const [exportOpen, setExportOpen] = useState(false)

  const [toast, setToast] = useState<{ id: number; msg: string } | null>(null)
  const toastId = useRef(0)
  const notify = (msg: string) => setToast({ id: toastId.current++, msg })
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2600)
    return () => clearTimeout(t)
  }, [toast])

  // Active season, not soft-deleted (docs §7.4).
  const seasonTx = useMemo(
    () =>
      transactions.filter(
        (t) => !t.is_deleted && t.season === financeConfig.active_season,
      ),
    [transactions, financeConfig.active_season],
  )
  const deletedCount = useMemo(
    () => transactions.filter((t) => t.is_deleted).length,
    [transactions],
  )
  // Requests still waiting on a decision — drives the Demandes badge.
  const pendingDemandes = useMemo(
    () => transactionRequests.filter((d) => d.status === "en_attente").length,
    [transactionRequests],
  )

  // Apply search + filters.
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return seasonTx.filter((t) => {
      if (filters.nature && t.nature !== filters.nature) return false
      if (filters.groupId && t.group_id !== filters.groupId) return false
      if (filters.subId && t.subcategory_id !== filters.subId) return false
      if (filters.scope && t.scope !== filters.scope) return false
      if (filters.teamId && !t.team_ids.includes(filters.teamId)) return false
      if (filters.payment && t.payment_method !== filters.payment) return false
      if (filters.from && t.date < filters.from) return false
      if (filters.to && t.date > filters.to) return false
      if (q && !(t.label ?? "").toLowerCase().includes(q)) return false
      return true
    })
  }, [seasonTx, filters, query])

  // Ledger ordering — chronological, newest first (also used for export).
  const ordered = useMemo(() => {
    return [...filtered].sort((a, b) => {
      if (a.date !== b.date) return a.date < b.date ? 1 : -1
      // within a day: revenus first, then each side by amount desc (largest first)
      const na = a.nature === "Revenu" ? 0 : 1
      const nb = b.nature === "Revenu" ? 0 : 1
      if (na !== nb) return na - nb
      return b.amount - a.amount
    })
  }, [filtered])

  // Ledger grouping — months → days, each level carrying its own subtotals.
  const months = useMemo(() => groupLedger(ordered), [ordered])

  // Table ordering — respects the sortable column headers.
  const sorted = useMemo(() => {
    const rows = [...filtered]
    rows.sort((a, b) => {
      const cmp =
        sort.key === "amount" ? a.amount - b.amount : a.date.localeCompare(b.date)
      return sort.dir === "asc" ? cmp : -cmp
    })
    return rows
  }, [filtered, sort])

  // KPIs — reactive to the filtered set (docs §4.2).
  const kpi = useMemo(() => {
    let revenus = 0
    let depenses = 0
    for (const t of filtered) {
      if (t.nature === "Revenu") revenus += t.amount
      else depenses += t.amount
    }
    return { revenus, depenses, solde: revenus - depenses, count: filtered.length }
  }, [filtered])

  const filterCount = Object.values(filters).filter(Boolean).length
  const searching = query.trim().length > 0
  const anyFilter = filterCount > 0 || searching
  const resetAll = () => {
    setFilters(EMPTY_FILTERS)
    setQuery("")
  }

  const patch = (p: Partial<Filters>) => {
    setVisible(PAGE)
    setFilters((f) => ({ ...f, ...p }))
  }

  const toggleSort = (key: SortKey) =>
    setSort((s) =>
      s.key === key
        ? { key, dir: s.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "desc" },
    )

  const doExport = (mode: "filtered" | "season") => {
    const rows = mode === "filtered" ? (view === "table" ? sorted : ordered) : seasonTx
    const slug = financeConfig.active_season.replace(/\s*\/\s*/, "-")
    exportTransactionsCsv(
      rows,
      { groups: groupMap, subs: subMap, teams: teamMap, staff: staffMap },
      `transactions-${slug}${mode === "filtered" ? "-filtre" : ""}.csv`,
    )
    setExportOpen(false)
    notify(`Export CSV — ${rows.length} transaction${rows.length > 1 ? "s" : ""}`)
  }

  // Filter option lists (cascade: groupe filtered by nature, sous-cat by groupe).
  const groupOpts = useMemo(
    () =>
      groups
        .filter((g) => !filters.nature || g.nature === (filters.nature as Nature))
        .map((g) => ({ value: g.id, label: g.name })),
    [groups, filters.nature],
  )
  const subOpts = useMemo(
    () =>
      subCategories
        .filter((s) => !filters.groupId || s.group_id === filters.groupId)
        .map((s) => ({ value: s.id, label: s.name })),
    [subCategories, filters.groupId],
  )

  const openDrawer = (mode: DrawerMode, source: Transaction | null = null) => {
    setMenu(null)
    setDrawer({ mode, source })
  }
  const openMenu = (tx: Transaction, e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setMenu((m) =>
      m?.tx.id === tx.id
        ? null
        : { tx, top: rect.bottom + 4, right: window.innerWidth - rect.right },
    )
  }

  /** Plain scope names for a transaction's ledger meta line. */
  const scopeNames = (tx: Transaction): string => {
    if (tx.scope === "general") return financeTeams.map((t) => t.name).join(", ")
    if (tx.scope === "equipe")
      return tx.team_ids.map((id) => teamMap.get(id)?.name ?? id).join(", ")
    const parts = [tx.staff_category ?? "Staff"]
    const member = tx.staff_member_id ? staffMap.get(tx.staff_member_id) : undefined
    if (member) parts.push(member.full_name)
    return parts.join(" · ")
  }

  const seasonEmpty = seasonTx.length === 0

  return (
    <>
      {/* 1 — Context header */}
      <PageHeader
        title="Transactions"
        subtitle="Suivi des mouvements financiers du club."
        actions={
          <span
            title="La saison active se change dans les réglages généraux."
            className="inline-flex cursor-default items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 font-ui text-[0.78rem] text-ink-subtle"
          >
            <Wallet size={14} className="text-info" />
            Saison&nbsp;: <span className="font-medium text-ink">{financeConfig.active_season}</span>
            <span className="text-ink-disabled">· {financeConfig.currency}</span>
          </span>
        }
      />

      {seasonEmpty ? (
        <div className="mt-8 rounded-lg border border-border">
          <EmptyState
            icon={Wallet}
            title="Aucune transaction pour cette saison"
            description="Enregistrez le premier mouvement financier de la saison pour lancer le suivi."
            action={
              <button
                type="button"
                onClick={() => openDrawer("create")}
                className="inline-flex items-center gap-1.5 rounded-md bg-brand px-4 py-2 font-ui text-sm font-medium text-ink-inverted shadow-glow transition-colors hover:bg-brand-dim"
              >
                <Plus size={16} /> Ajouter une transaction
              </button>
            }
          />
        </div>
      ) : (
        <>
          {/* 2 — Reactive KPI bar */}
          <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Kpi label="Total Revenus" value={fmt(kpi.revenus)} tone="positive" />
            <Kpi label="Total Dépenses" value={fmt(kpi.depenses)} tone="negative" />
            <Kpi
              label="Solde"
              value={(kpi.solde >= 0 ? "+" : "") + fmt(kpi.solde)}
              tone={kpi.solde < 0 ? "negative" : undefined}
            />
            <Kpi label="Nb transactions" value={kpi.count} />
          </div>
          {anyFilter ? (
            <p className="mt-2 flex items-center gap-1.5 font-body text-[0.72rem] text-ink-disabled">
              <Info size={12} /> Indicateurs calculés sur la vue filtrée
              ({kpi.count} sur {seasonTx.length}).
            </p>
          ) : null}

          {/* 3 — Toolbar */}
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <div className="relative min-w-0 flex-1 sm:max-w-xs">
              <Search
                size={15}
                className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-disabled"
              />
              <input
                value={query}
                onChange={(e) => {
                  setVisible(PAGE)
                  setQuery(e.target.value)
                }}
                placeholder="Rechercher un libellé…"
                className="w-full rounded-md border border-input bg-input-bg py-2 pr-3 pl-9 font-body text-sm text-ink outline-none transition-colors placeholder:text-ink-disabled focus:border-border-focus"
              />
            </div>

            {/* View switch — ledger ⇄ table */}
            <Segmented
              value={view}
              onChange={setView}
              options={[
                { value: "ledger", label: <span className="inline-flex items-center gap-1.5"><Rows3 size={14} /> Relevé</span> },
                { value: "table", label: <span className="inline-flex items-center gap-1.5"><LayoutList size={14} /> Tableau</span> },
              ]}
            />

            <button
              type="button"
              onClick={() => setShowFilters((v) => !v)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md border px-3 py-2 font-ui text-sm font-medium transition-colors",
                showFilters || filterCount
                  ? "border-info/40 bg-info/10 text-info"
                  : "border-input text-ink-subtle hover:border-[var(--border-hover)] hover:text-ink",
              )}
            >
              <SlidersHorizontal size={15} /> Filtres
              {filterCount ? (
                <span className="rounded-full bg-info/20 px-1.5 text-[0.68rem] tabular-nums">
                  {filterCount}
                </span>
              ) : null}
            </button>

            {/* Export dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setExportOpen((v) => !v)}
                className="inline-flex items-center gap-1.5 rounded-md border border-input px-3 py-2 font-ui text-sm font-medium text-ink-subtle transition-colors hover:border-[var(--border-hover)] hover:text-ink"
              >
                <Download size={15} /> Exporter
                <ChevronDown size={14} className="text-ink-disabled" />
              </button>
              {exportOpen ? (
                <>
                  <button
                    type="button"
                    aria-hidden
                    tabIndex={-1}
                    onClick={() => setExportOpen(false)}
                    className="fixed inset-0 z-40 cursor-default"
                  />
                  <div className="absolute right-0 z-50 mt-1 w-56 overflow-hidden rounded-md border border-border bg-background py-1 shadow-deep">
                    <MenuItem onClick={() => doExport("filtered")}>
                      Vue filtrée actuelle
                      <span className="ml-auto text-ink-disabled tabular-nums">{ordered.length}</span>
                    </MenuItem>
                    <MenuItem onClick={() => doExport("season")}>
                      Toute la saison
                      <span className="ml-auto text-ink-disabled tabular-nums">{seasonTx.length}</span>
                    </MenuItem>
                  </div>
                </>
              ) : null}
            </div>

            <button
              type="button"
              onClick={() => setDemandes(true)}
              className="inline-flex items-center gap-1.5 rounded-md border border-input px-3 py-2 font-ui text-sm font-medium text-ink-subtle transition-colors hover:border-[var(--border-hover)] hover:text-ink"
            >
              <Inbox size={15} /> Demandes
              {pendingDemandes ? (
                <span className="rounded-full bg-warning/20 px-1.5 text-[0.68rem] text-warning tabular-nums">
                  {pendingDemandes}
                </span>
              ) : null}
            </button>

            <button
              type="button"
              onClick={() => setHistorique(true)}
              className="inline-flex items-center gap-1.5 rounded-md border border-input px-3 py-2 font-ui text-sm font-medium text-ink-subtle transition-colors hover:border-[var(--border-hover)] hover:text-ink"
            >
              <History size={15} /> Historique
              {deletedCount ? (
                <span className="rounded-full bg-accent px-1.5 text-[0.68rem] tabular-nums">
                  {deletedCount}
                </span>
              ) : null}
            </button>

            <button
              type="button"
              onClick={() => openDrawer("create")}
              className="ml-auto inline-flex items-center gap-1.5 rounded-md bg-brand px-4 py-2 font-ui text-sm font-medium text-ink-inverted shadow-glow transition-colors hover:bg-brand-dim"
            >
              <Plus size={16} /> Ajouter une transaction
            </button>
          </div>

          {/* Filters panel */}
          {showFilters ? (
            <div className="mt-3 rounded-lg border border-border p-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Field label="Nature">
                  <Select
                    value={filters.nature}
                    onChange={(v) => patch({ nature: v, groupId: "", subId: "" })}
                    options={[
                      { value: "Dépense", label: "Dépense" },
                      { value: "Revenu", label: "Revenu" },
                    ]}
                    placeholder="Toutes"
                  />
                </Field>
                <Field label="Groupe">
                  <Select
                    value={filters.groupId}
                    onChange={(v) => patch({ groupId: v, subId: "" })}
                    options={groupOpts}
                    placeholder="Tous"
                  />
                </Field>
                <Field label="Sous-catégorie">
                  <Select
                    value={filters.subId}
                    onChange={(v) => patch({ subId: v })}
                    options={subOpts}
                    placeholder="Toutes"
                    disabled={!filters.groupId}
                  />
                </Field>
                <Field label="Portée">
                  <Select
                    value={filters.scope}
                    onChange={(v) => patch({ scope: v, teamId: "" })}
                    options={SCOPES}
                    placeholder="Toutes"
                  />
                </Field>
                <Field label="Équipe">
                  <Select
                    value={filters.teamId}
                    onChange={(v) => patch({ teamId: v })}
                    options={financeTeams.map((t) => ({ value: t.id, label: t.name }))}
                    placeholder="Toutes"
                  />
                </Field>
                <Field label="Mode de paiement">
                  <Select
                    value={filters.payment}
                    onChange={(v) => patch({ payment: v })}
                    options={PAYMENTS.map((p) => ({ value: p, label: p }))}
                    placeholder="Tous"
                  />
                </Field>
                <Field label="Du">
                  <input
                    type="date"
                    value={filters.from}
                    onChange={(e) => patch({ from: e.target.value })}
                    className="w-full rounded-md border border-input bg-input-bg px-3 py-2.5 font-body text-sm text-ink outline-none transition-colors [color-scheme:dark] focus:border-border-focus"
                  />
                </Field>
                <Field label="Au">
                  <input
                    type="date"
                    value={filters.to}
                    onChange={(e) => patch({ to: e.target.value })}
                    className="w-full rounded-md border border-input bg-input-bg px-3 py-2.5 font-body text-sm text-ink outline-none transition-colors [color-scheme:dark] focus:border-border-focus"
                  />
                </Field>
              </div>
              {filterCount ? (
                <button
                  type="button"
                  onClick={() => setFilters(EMPTY_FILTERS)}
                  className="mt-3 inline-flex items-center gap-1 font-ui text-[0.72rem] font-medium tracking-[0.04em] text-info uppercase transition-opacity hover:opacity-80"
                >
                  <X size={12} /> Réinitialiser les filtres
                </button>
              ) : null}
            </div>
          ) : null}

          {/* 4 — Data view: relevé (grouped ledger) or tableau */}
          {view === "ledger" ? (
            months.length === 0 ? (
              <NoResults onReset={resetAll} />
            ) : (
              <div className="mt-6 flex flex-col gap-8">
                {months.map((month) => (
                  <section key={month.key}>
                    {/* Month header — title + count on the left, subtotals on the right */}
                    <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2 border-b border-border pb-2.5">
                      <div className="flex items-baseline gap-2.5">
                        <h2 className="font-display text-[1.1rem] font-medium text-ink">
                          {fmtMonthYear(month.key)}
                        </h2>
                        <span className="font-body text-[0.76rem] text-ink-muted">
                          {month.rows} transaction{month.rows > 1 ? "s" : ""}
                        </span>
                      </div>
                      <Totals sums={month} size="month" />
                    </div>

                    {/* Days card */}
                    <div className="mt-3 overflow-hidden rounded-lg border border-border">
                      {month.days.map((day) => (
                        <div key={day.key} className="border-b border-border last:border-0">
                          {/* Day header strip — single allowed nested fill */}
                          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 bg-surface-nested px-4 py-2">
                            <h3 className="font-body text-[0.8rem] text-ink-subtle">
                              {fmtDayLong(day.key)}
                            </h3>
                            <Totals sums={day} size="day" />
                          </div>

                          {/* Rows */}
                          <ul>
                            {day.rows.map((t) => {
                              const { group, sub } = categoryPath(t, groupMap, subMap)
                              const revenu = t.nature === "Revenu"
                              return (
                                <li
                                  key={t.id}
                                  className="group flex items-start justify-between gap-4 border-t border-border px-4 py-3 transition-colors hover:bg-surface-hover"
                                >
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5">
                                      <span className="truncate font-body text-[0.9rem] text-ink">
                                        {sub}
                                      </span>
                                      {t.attachment ? (
                                        <span title={t.attachment} className="shrink-0">
                                          <Paperclip size={12} className="text-info" />
                                        </span>
                                      ) : null}
                                    </div>
                                    <div className="mt-1 truncate font-body text-[0.75rem] text-ink-muted">
                                      {RECORDED_BY}
                                      <span className="text-ink-disabled"> · {group} · {scopeNames(t)}</span>
                                    </div>
                                    {t.label ? (
                                      <div className="mt-0.5 truncate font-body text-[0.78rem] text-ink-subtle">
                                        {t.label}
                                      </div>
                                    ) : null}
                                  </div>

                                  <div className="flex shrink-0 items-start gap-1">
                                    <span
                                      className={cn(
                                        "font-body text-[0.9rem] whitespace-nowrap tabular-nums",
                                        revenu ? "text-success" : "text-danger",
                                      )}
                                    >
                                      {revenu ? "+" : "−"}
                                      {fmtAmount(t.amount)} DT
                                    </span>
                                    <button
                                      type="button"
                                      onClick={(e) => openMenu(t, e)}
                                      aria-label="Actions"
                                      className="-mr-1 inline-flex size-6 items-center justify-center rounded-sm border border-transparent text-ink-muted opacity-0 transition-all group-hover:opacity-100 hover:border-border hover:bg-surface hover:text-ink"
                                    >
                                      <span className="text-lg leading-none">⋯</span>
                                    </button>
                                  </div>
                                </li>
                              )
                            })}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </section>
                ))}

                <p className="text-right font-body text-[0.72rem] text-ink-disabled tabular-nums">
                  {ordered.length} transaction{ordered.length > 1 ? "s" : ""} · {months.length} mois
                </p>
              </div>
            )
          ) : (
            /* Table view */
            <div className="mt-4 overflow-hidden rounded-lg border border-border">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-border">
                      <SortHeader label="Date" active={sort.key === "date"} dir={sort.dir} onClick={() => toggleSort("date")} />
                      <Th>Nature</Th>
                      <Th>Catégorie</Th>
                      <Th>Portée</Th>
                      <SortHeader label="Montant" align="right" active={sort.key === "amount"} dir={sort.dir} onClick={() => toggleSort("amount")} />
                      <Th>Paiement</Th>
                      <Th align="center">
                        <Paperclip size={13} className="inline" />
                      </Th>
                      <th className="w-10 border-b-0" aria-hidden />
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-12 text-center">
                          <p className="font-body text-sm text-ink-muted">Aucun résultat</p>
                          <button
                            type="button"
                            onClick={resetAll}
                            className="mt-1.5 font-ui text-[0.74rem] font-medium text-info transition-opacity hover:opacity-80"
                          >
                            Réinitialiser les filtres
                          </button>
                        </td>
                      </tr>
                    ) : (
                      sorted.slice(0, visible).map((t) => {
                        const { group, sub } = categoryPath(t, groupMap, subMap)
                        const revenu = t.nature === "Revenu"
                        return (
                          <tr key={t.id} className="border-b border-border transition-colors last:border-0 hover:bg-accent">
                            <td className="px-3.5 py-3 font-body text-[0.82rem] whitespace-nowrap text-ink-muted tabular-nums">
                              {fmtFrDate(t.date)}
                            </td>
                            <td className="px-3.5 py-3">
                              <NaturePill nature={t.nature} />
                            </td>
                            <td className="px-3.5 py-3">
                              <div className="font-body text-[0.85rem] text-ink">{sub}</div>
                              <div className="font-body text-[0.72rem] text-ink-disabled">{group}</div>
                            </td>
                            <td className="px-3.5 py-3">
                              <ScopeCell tx={t} teamMap={teamMap} staffMap={staffMap} />
                            </td>
                            <td
                              className={cn(
                                "px-3.5 py-3 text-right font-body text-[0.85rem] whitespace-nowrap tabular-nums",
                                revenu ? "text-success" : "text-danger",
                              )}
                            >
                              {revenu ? "+" : "−"}
                              {fmtShort(t.amount)} TND
                            </td>
                            <td className="px-3.5 py-3 font-body text-[0.8rem] whitespace-nowrap text-ink-muted">
                              {t.payment_method ?? "—"}
                            </td>
                            <td className="px-3.5 py-3 text-center">
                              {t.attachment ? (
                                <span title={t.attachment}>
                                  <Paperclip size={14} className="inline text-info" />
                                </span>
                              ) : (
                                <span className="text-ink-disabled">—</span>
                              )}
                            </td>
                            <td className="px-2 py-3 text-right">
                              <button
                                type="button"
                                onClick={(e) => openMenu(t, e)}
                                aria-label="Actions"
                                className="inline-flex size-7 items-center justify-center rounded-sm border border-transparent text-ink-muted transition-colors hover:border-border hover:bg-surface-hover hover:text-ink"
                              >
                                <span className="text-lg leading-none">⋯</span>
                              </button>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {sorted.length > visible ? (
                <div className="flex items-center justify-center border-t border-border py-3">
                  <button
                    type="button"
                    onClick={() => setVisible((v) => v + PAGE)}
                    className="inline-flex items-center gap-1.5 rounded-md border border-input px-3.5 py-1.5 font-ui text-[0.78rem] font-medium text-ink-subtle transition-colors hover:border-[var(--border-hover)] hover:text-ink"
                  >
                    Charger plus ({sorted.length - visible})
                  </button>
                </div>
              ) : sorted.length > 0 ? (
                <div className="border-t border-border px-4 py-2.5 text-right font-body text-[0.72rem] text-ink-disabled tabular-nums">
                  {sorted.length} transaction{sorted.length > 1 ? "s" : ""}
                </div>
              ) : null}
            </div>
          )}
        </>
      )}

      {/* Row actions menu (fixed — escapes any overflow clipping) */}
      {menu ? (
        <>
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            onClick={() => setMenu(null)}
            className="fixed inset-0 z-[110] cursor-default"
          />
          <div
            style={{ top: menu.top, right: menu.right }}
            className="fixed z-[111] w-44 overflow-hidden rounded-md border border-border bg-background py-1 text-left shadow-deep"
          >
            <MenuItem onClick={() => openDrawer("edit", menu.tx)}>
              <Pencil size={14} /> Modifier
            </MenuItem>
            <MenuItem onClick={() => openDrawer("duplicate", menu.tx)}>
              <Copy size={14} /> Dupliquer
            </MenuItem>
            <MenuItem
              danger
              onClick={() => {
                const tx = menu.tx
                setMenu(null)
                setConfirm(tx)
              }}
            >
              <Trash2 size={14} /> Supprimer
            </MenuItem>
          </div>
        </>
      ) : null}

      {/* Overlays */}
      <TransactionDrawer
        open={drawer !== null}
        mode={drawer?.mode ?? "create"}
        source={drawer?.source ?? null}
        onOpenChange={(o) => !o && setDrawer(null)}
        onSaved={notify}
      />

      <HistoriquePanel
        open={historique}
        onOpenChange={setHistorique}
        onRestored={notify}
      />

      <DemandesModal
        open={demandes}
        onOpenChange={setDemandes}
        onDecided={notify}
      />

      <ConfirmDialog
        open={confirm !== null}
        onOpenChange={(o) => !o && setConfirm(null)}
        title="Supprimer cette transaction ?"
        description="Cette transaction sera retirée du tableau et des analyses, mais conservée dans l'historique."
        confirmLabel="Supprimer"
        onConfirm={() => {
          if (confirm) deleteTransaction(confirm.id)
          setConfirm(null)
          notify("Transaction supprimée — conservée dans l'historique")
        }}
      />

      {toast ? (
        <div
          key={toast.id}
          role="status"
          className="animate-toast-in fixed right-5 bottom-5 z-[120] flex items-center gap-2.5 rounded-md border border-success/30 bg-surface px-4 py-3 shadow-deep"
        >
          <span className="flex size-6 items-center justify-center rounded-full bg-success/15 text-success">
            <Check size={14} />
          </span>
          <span className="font-body text-[0.84rem] text-ink">{toast.msg}</span>
        </div>
      ) : null}
    </>
  )
}

/* ── Ledger grouping ────────────────────────────────────────────────────── */
type DayLevel = { key: string; revenus: number; depenses: number; net: number; rows: Transaction[] }
type MonthLevel = {
  key: string
  revenus: number
  depenses: number
  net: number
  rows: number
  days: DayLevel[]
}

function tally(target: { revenus: number; depenses: number }, t: Transaction) {
  if (t.nature === "Revenu") target.revenus += t.amount
  else target.depenses += t.amount
}

/** ordered (date-desc) rows → months → days, subtotals accumulated per level. */
function groupLedger(ordered: Transaction[]): MonthLevel[] {
  const months: MonthLevel[] = []
  const monthIndex = new Map<string, number>()
  const dayIndex = new Map<string, number>()

  for (const t of ordered) {
    const mKey = t.date.slice(0, 7)
    let mi = monthIndex.get(mKey)
    if (mi === undefined) {
      mi = months.length
      monthIndex.set(mKey, mi)
      months.push({ key: mKey, revenus: 0, depenses: 0, net: 0, rows: 0, days: [] })
    }
    const month = months[mi]
    tally(month, t)
    month.rows += 1

    const dKey = t.date
    let di = dayIndex.get(dKey)
    if (di === undefined) {
      di = month.days.length
      dayIndex.set(dKey, di)
      month.days.push({ key: dKey, revenus: 0, depenses: 0, net: 0, rows: [] })
    }
    const day = month.days[di]
    tally(day, t)
    day.rows.push(t)
  }

  for (const m of months) {
    m.net = m.revenus - m.depenses
    for (const d of m.days) d.net = d.revenus - d.depenses
  }
  return months
}

/* ── Small building blocks ──────────────────────────────────────────────── */
function NoResults({ onReset }: { onReset: () => void }) {
  return (
    <div className="mt-4 rounded-lg border border-border px-4 py-12 text-center">
      <p className="font-body text-sm text-ink-muted">Aucun résultat</p>
      <button
        type="button"
        onClick={onReset}
        className="mt-1.5 font-ui text-[0.74rem] font-medium text-info transition-opacity hover:opacity-80"
      >
        Réinitialiser les filtres
      </button>
    </div>
  )
}

/** Revenus / Dépenses / Solde figures for a month or day header. */
function Totals({
  sums,
  size,
}: {
  sums: { revenus: number; depenses: number; net: number }
  size: "month" | "day"
}) {
  const month = size === "month"
  return (
    <div className={cn("flex items-center", month ? "gap-5" : "gap-4")}>
      <Figure label="Revenus" value={sums.revenus} tone="pos" month={month} />
      <Figure label="Dépenses" value={sums.depenses} tone="neg" month={month} />
      <Figure
        label="Solde"
        value={sums.net}
        tone={sums.net < 0 ? "neg" : sums.net > 0 ? "pos" : "none"}
        month={month}
        signed
        strong
      />
    </div>
  )
}

function Figure({
  label,
  value,
  tone,
  month,
  signed,
  strong,
}: {
  label: string
  value: number
  tone: "pos" | "neg" | "none"
  month: boolean
  signed?: boolean
  strong?: boolean
}) {
  const color =
    tone === "pos" ? "text-success" : tone === "neg" ? "text-danger" : "text-ink-muted"
  const sign = signed && value !== 0 ? (value > 0 ? "+" : "−") : ""
  const text = `${sign}${fmtAmount(Math.abs(value))} DT`

  if (month) {
    return (
      <div className="text-right">
        <div className="font-ui text-[0.58rem] font-medium tracking-[0.09em] text-ink-disabled uppercase">
          {label}
        </div>
        <div className={cn("mt-0.5 font-body text-[0.92rem] tabular-nums", color, strong && "font-medium")}>
          {text}
        </div>
      </div>
    )
  }
  return (
    <span className="flex items-baseline gap-1.5">
      <span className="font-ui text-[0.58rem] font-medium tracking-[0.08em] text-ink-disabled uppercase">
        {label}
      </span>
      <span className={cn("font-body text-[0.76rem] tabular-nums", color, strong && "font-medium")}>
        {text}
      </span>
    </span>
  )
}

/* ── Table building blocks ──────────────────────────────────────────────── */
function Th({
  children,
  align = "left",
}: {
  children?: React.ReactNode
  align?: "left" | "right" | "center"
}) {
  return (
    <th
      className={cn(
        "px-3.5 py-2.5 font-ui text-[0.7rem] font-medium tracking-[0.08em] whitespace-nowrap text-ink-disabled uppercase",
        align === "right" && "text-right",
        align === "center" && "text-center",
        align === "left" && "text-left",
      )}
    >
      {children}
    </th>
  )
}

function SortHeader({
  label,
  active,
  dir,
  align = "left",
  onClick,
}: {
  label: string
  active: boolean
  dir: "asc" | "desc"
  align?: "left" | "right"
  onClick: () => void
}) {
  return (
    <th
      className={cn(
        "px-3.5 py-2.5 font-ui text-[0.7rem] font-medium tracking-[0.08em] whitespace-nowrap text-ink-disabled uppercase",
        align === "right" ? "text-right" : "text-left",
      )}
    >
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "inline-flex items-center gap-1 transition-colors hover:text-ink-muted",
          align === "right" && "flex-row-reverse",
          active && "text-ink-muted",
        )}
      >
        {label}
        {active ? (
          dir === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} />
        ) : null}
      </button>
    </th>
  )
}

function MenuItem({
  children,
  onClick,
  danger,
}: {
  children: React.ReactNode
  onClick: () => void
  danger?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 px-3 py-2 text-left font-body text-[0.82rem] transition-colors hover:bg-surface-hover",
        danger ? "text-danger hover:bg-danger/10" : "text-ink-subtle hover:text-ink",
      )}
    >
      {children}
    </button>
  )
}

function ScopeCell({
  tx,
  teamMap,
  staffMap,
}: {
  tx: Transaction
  teamMap: Map<string, FinanceTeam>
  staffMap: Map<string, StaffMember>
}) {
  if (tx.scope === "general") {
    return <Badge variant="default">Général</Badge>
  }
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
        <span className="font-body text-[0.74rem] text-ink-muted">{tx.staff_category}</span>
      ) : null}
      {member ? (
        <span className="font-body text-[0.74rem] text-ink-disabled">· {member.full_name}</span>
      ) : null}
    </div>
  )
}
