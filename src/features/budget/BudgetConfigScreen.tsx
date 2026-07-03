import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { ArrowRight, Check, ChevronRight, Plus, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { fmt, fmtShort, r } from "@/lib/format"
import { useData } from "@/data/useData"
import { sumLines, type Line, type LineList } from "@/data/seed/budget"
import { BackButton } from "@/components/kit/BackButton"
import { Bar, LinkBtn, NumInput, PageHead, Panel, Segmented } from "@/features/budget/ui"

const textInputCls =
  "w-full rounded-md border border-input bg-input-bg px-3.5 py-2.5 font-body text-sm text-ink outline-none transition-colors placeholder:text-ink-disabled focus:border-border-focus"
const derivedCls =
  "flex items-center justify-end rounded-md border border-border bg-input-bg px-3.5 py-2.5 font-body text-[0.84rem] text-ink-muted tabular-nums whitespace-nowrap"
const btnXCls =
  "flex h-[30px] w-[30px] items-center justify-center rounded-sm border border-border text-ink-disabled transition-colors hover:border-team-away/30 hover:bg-team-away/10 hover:text-team-away"

const sumPct = (lines: Line[]) => lines.reduce((s, i) => s + (i.pct ?? 0), 0)

function SumPctTag({ sum }: { sum: number }) {
  const ok = sum >= 99 && sum <= 101
  return (
    <span
      className={cn(
        "rounded-pill px-2 py-1 font-ui text-[0.66rem] font-medium whitespace-nowrap",
        ok ? "bg-success/10 text-success" : "bg-warning/10 text-warning",
      )}
    >
      Σ {sum}%
    </span>
  )
}

function GlobalRow({
  label,
  value,
  onChange,
  sum,
}: {
  label: string
  value: number
  onChange: (v: number) => void
  sum: number
}) {
  return (
    <div className="mb-3.5 grid grid-cols-[1fr_170px_auto] items-center gap-2.5 rounded-md border border-border bg-surface-nested px-3.5 py-2.5">
      <div className="font-ui text-[0.74rem] font-medium tracking-[0.04em] text-ink-subtle uppercase">
        {label}
      </div>
      <NumInput value={value} suffix="TND" onChange={onChange} />
      <SumPctTag sum={sum} />
    </div>
  )
}

function LineRow({
  item,
  isPercent,
  gridClass,
  placeholder,
  withThreshold,
  onLabel,
  onAmount,
  onPct,
  onThreshold,
  onRemove,
}: {
  item: Line
  isPercent: boolean
  gridClass: string
  placeholder: string
  withThreshold?: boolean
  onLabel: (v: string) => void
  onAmount: (v: number) => void
  onPct: (v: number) => void
  onThreshold?: (v: number) => void
  onRemove: () => void
}) {
  return (
    <div className={cn("mb-2 grid items-center gap-2.5", gridClass)}>
      <input
        className={textInputCls}
        value={item.label}
        placeholder={placeholder}
        onChange={(e) => onLabel(e.target.value)}
      />
      {isPercent ? (
        <>
          <NumInput value={item.pct ?? 0} suffix="%" small onChange={onPct} />
          <div className={derivedCls}>{fmt(item.amount)}</div>
        </>
      ) : (
        <NumInput value={item.amount} suffix="TND" onChange={onAmount} />
      )}
      {withThreshold ? (
        <NumInput
          value={item.threshold ?? 0}
          suffix="%"
          small
          onChange={(v) => onThreshold?.(v)}
        />
      ) : null}
      <button
        type="button"
        onClick={onRemove}
        className={btnXCls}
        aria-label="Supprimer la ligne"
      >
        <X size={14} />
      </button>
    </div>
  )
}

function HeadRow({ gridClass, cols }: { gridClass: string; cols: string[] }) {
  return (
    <div
      className={cn(
        "grid gap-2.5 px-0.5 pb-1.5 font-ui text-[0.6rem] font-medium tracking-[0.06em] text-ink-disabled uppercase",
        gridClass,
      )}
    >
      {cols.map((c, i) => (
        <span key={i} className={i === 0 ? "" : "text-right"}>
          {c}
        </span>
      ))}
      <span />
    </div>
  )
}

/* ── Sous-postes (sub-titles + sub-budgets under a line) ─────────────────
   Prototype-only: local state, seeded with examples, NOT wired into the line
   amount or the totals — just to show how a breakdown could look. */
type Sub = { id: string; label: string; amount: number }

const SEED_SUBS: Record<string, { label: string; amount: number }[]> = {
  "inc-cotisations": [
    { label: "Séniors", amount: 40000 },
    { label: "Jeunes (U13–U17)", amount: 34000 },
    { label: "Féminines", amount: 22000 },
  ],
  "inc-subventions": [
    { label: "Municipalité", amount: 38000 },
    { label: "Fédération", amount: 22000 },
  ],
  "inc-sponsors": [
    { label: "Sponsor principal", amount: 35000 },
    { label: "Équipementier", amount: 12000 },
    { label: "Sponsors locaux", amount: 8000 },
  ],
  "exp-salaires": [
    { label: "Staff technique", amount: 70000 },
    { label: "Personnel administratif", amount: 28000 },
    { label: "Primes & indemnités", amount: 12000 },
  ],
  "exp-equipement": [
    { label: "Maillots & tenues", amount: 16000 },
    { label: "Ballons & matériel", amount: 8000 },
    { label: "Matériel médical", amount: 4000 },
  ],
  "exp-deplacements": [
    { label: "Transport", amount: 14000 },
    { label: "Hébergement", amount: 6000 },
    { label: "Restauration", amount: 4000 },
  ],
}

const subInputCls =
  "w-full rounded-md border border-input bg-input-bg px-3 py-2 font-body text-[0.82rem] text-ink-subtle outline-none transition-colors placeholder:text-ink-disabled focus:border-border-focus"

function SubBudgets({ lineId }: { lineId: string }) {
  const seeded = SEED_SUBS[lineId]
  const [items, setItems] = useState<Sub[]>(() =>
    (seeded ?? []).map((s, i) => ({ id: `${lineId}-sub-${i}`, ...s })),
  )
  const [open, setOpen] = useState(Boolean(seeded))

  const subtotal = items.reduce((s, x) => s + (x.amount || 0), 0)

  const add = () =>
    setItems((p) => [...p, { id: crypto.randomUUID(), label: "", amount: 0 }])
  const remove = (id: string) => setItems((p) => p.filter((x) => x.id !== id))
  const setLabel = (id: string, v: string) =>
    setItems((p) => p.map((x) => (x.id === id ? { ...x, label: v } : x)))
  const setAmount = (id: string, v: number) =>
    setItems((p) => p.map((x) => (x.id === id ? { ...x, amount: v } : x)))

  return (
    <div className="mt-1 mb-2.5 ml-1 pl-2">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1 font-ui text-[0.62rem] font-medium tracking-[0.05em] text-ink-disabled uppercase transition-colors hover:text-ink-muted"
      >
        <ChevronRight
          size={12}
          className={cn("transition-transform", open && "rotate-90")}
        />
        Sous-postes
        {items.length ? (
          <span className="rounded-full bg-accent px-1.5 text-[0.6rem] text-ink-muted">
            {items.length}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="mt-1.5 ml-1.5 border-l border-border pl-3">
          {items.map((s) => (
            <div
              key={s.id}
              className="mb-1.5 grid grid-cols-[1fr_120px_28px] items-center gap-2"
            >
              <input
                className={subInputCls}
                value={s.label}
                placeholder="Sous-titre"
                onChange={(e) => setLabel(s.id, e.target.value)}
              />
              <NumInput
                value={s.amount}
                suffix="TND"
                onChange={(v) => setAmount(s.id, v)}
              />
              <button
                type="button"
                onClick={() => remove(s.id)}
                aria-label="Supprimer le sous-poste"
                className="flex h-[28px] w-[28px] items-center justify-center rounded-sm border border-border text-ink-disabled transition-colors hover:border-team-away/30 hover:bg-team-away/10 hover:text-team-away"
              >
                <X size={13} />
              </button>
            </div>
          ))}

          <div className="flex items-center justify-between pt-0.5">
            <button
              type="button"
              onClick={add}
              className="inline-flex items-center gap-1 font-ui text-[0.64rem] font-medium tracking-[0.04em] text-info uppercase transition-opacity hover:opacity-80"
            >
              <Plus size={12} /> Sous-poste
            </button>
            {items.length ? (
              <span className="font-body text-[0.7rem] text-ink-disabled tabular-nums">
                Σ {fmtShort(subtotal)} TND
              </span>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}

export function BudgetConfigScreen() {
  const navigate = useNavigate()
  const {
    budget,
    setSeason,
    setMode,
    setGlobalIncome,
    setGlobalExpense,
    updateLine,
    addLine,
    removeLine,
  } = useData()
  const { season, mode, globalIncome, globalExpense, income, expenses, teams } = budget
  const isPercent = mode === "percent"

  const totalIncome = isPercent ? globalIncome : sumLines(income)
  const totalExpense = isPercent ? globalExpense : sumLines(expenses)
  const balance = totalIncome - totalExpense
  const teamTotal = sumLines(teams)
  const teamDiff = teamTotal - totalExpense
  const balanced = Math.abs(teamDiff) < Math.max(1, totalExpense * 0.01)

  const topCats = [...expenses]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5)

  // grid templates per list / mode (mirrors the source prototype)
  const incGrid = isPercent
    ? "grid-cols-[1fr_84px_120px_30px]"
    : "grid-cols-[1fr_150px_30px]"
  const expGrid = isPercent
    ? "grid-cols-[1fr_78px_112px_70px_30px]"
    : "grid-cols-[1fr_130px_74px_30px]"

  const lineProps = (list: LineList) => (item: Line) => ({
    item,
    isPercent,
    onLabel: (v: string) => updateLine(list, item.id, { label: v }),
    onAmount: (v: number) => updateLine(list, item.id, { amount: v }),
    onPct: (v: number) => updateLine(list, item.id, { pct: v }),
    onRemove: () => removeLine(list, item.id),
  })

  return (
    <>
      <BackButton to="/budget" label="Saisons" />

      <PageHead
        title="Nouvelle saison"
        action={
          <div className="flex flex-col gap-1.5 sm:items-end">
            <span className="font-ui text-[0.62rem] font-medium tracking-[0.08em] text-ink-disabled uppercase">
              Mode de saisie
            </span>
            <Segmented
              value={mode}
              onChange={setMode}
              options={[
                { value: "amount", label: "Montants (TND)" },
                { value: "percent", label: "Pourcentages (%)" },
              ]}
            />
          </div>
        }
      />

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[1fr_320px]">
        {/* ── Forms ── */}
        <div className="min-w-0">
          <Panel title="Informations">
            <div className="flex flex-col gap-4 sm:flex-row">
              <label className="flex flex-1 flex-col gap-1.5">
                <span className="font-ui text-[0.7rem] font-medium tracking-[0.06em] text-ink-muted uppercase">
                  Nom de la saison
                </span>
                <input
                  className={textInputCls}
                  value={season}
                  onChange={(e) => setSeason(e.target.value)}
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="font-ui text-[0.7rem] font-medium tracking-[0.06em] text-ink-muted uppercase">
                  Devise
                </span>
                <input
                  className={cn(textInputCls, "w-28")}
                  value="TND"
                  readOnly
                />
              </label>
            </div>
          </Panel>

          {/* RECETTES */}
          <Panel
            title="Recettes prévisionnelles"
            action={
              <LinkBtn onClick={() => addLine("income")}>
                <Plus size={13} /> Ligne
              </LinkBtn>
            }
          >
            {isPercent ? (
              <GlobalRow
                label="Recette globale prévue"
                value={globalIncome}
                onChange={setGlobalIncome}
                sum={sumPct(income)}
              />
            ) : null}
            <HeadRow
              gridClass={incGrid}
              cols={isPercent ? ["Source", "Part", "Montant"] : ["Source", "Montant annuel"]}
            />
            {income.map((it) => (
              <div key={it.id}>
                <LineRow
                  {...lineProps("income")(it)}
                  gridClass={incGrid}
                  placeholder="Source de revenu"
                />
                <SubBudgets lineId={it.id} />
              </div>
            ))}
            <div className="mt-3 flex items-center justify-between border-t border-border pt-3 font-ui text-[0.82rem] font-medium">
              <span>Total recettes</span>
              <b className="text-[0.95rem] text-success">{fmt(totalIncome)}</b>
            </div>
          </Panel>

          {/* DEPENSES */}
          <Panel
            title="Dépenses prévisionnelles"
            action={
              <LinkBtn onClick={() => addLine("expenses", { threshold: 90 })}>
                <Plus size={13} /> Ligne
              </LinkBtn>
            }
          >
            {isPercent ? (
              <GlobalRow
                label="Dépense globale prévue"
                value={globalExpense}
                onChange={setGlobalExpense}
                sum={sumPct(expenses)}
              />
            ) : null}
            <HeadRow
              gridClass={expGrid}
              cols={
                isPercent
                  ? ["Catégorie", "Part", "Montant", "Seuil"]
                  : ["Catégorie", "Montant", "Seuil"]
              }
            />
            {expenses.map((it) => (
              <div key={it.id}>
                <LineRow
                  {...lineProps("expenses")(it)}
                  gridClass={expGrid}
                  placeholder="Catégorie de dépense"
                  withThreshold
                  onThreshold={(v) =>
                    updateLine("expenses", it.id, { threshold: v })
                  }
                />
                <SubBudgets lineId={it.id} />
              </div>
            ))}
            <div className="mt-3 flex items-center justify-between border-t border-border pt-3 font-ui text-[0.82rem] font-medium">
              <span>Total dépenses</span>
              <b className="text-[0.95rem] text-danger">{fmt(totalExpense)}</b>
            </div>
            <p className="mt-3.5 font-body text-[0.76rem] leading-relaxed text-ink-disabled">
              Le <b className="text-ink-muted">seuil</b> déclenche une alerte
              quand la catégorie atteint ce&nbsp;% de consommation.
            </p>
          </Panel>

          {/* EQUIPES */}
          <Panel
            title="Répartition par équipe"
            action={
              <LinkBtn onClick={() => addLine("teams")}>
                <Plus size={13} /> Équipe
              </LinkBtn>
            }
          >
            {isPercent ? (
              <div className="mb-3.5 grid grid-cols-[1fr_170px_auto] items-center gap-2.5 rounded-md border border-border bg-surface-nested px-3.5 py-2.5">
                <div className="font-ui text-[0.74rem] font-medium tracking-[0.04em] text-ink-subtle uppercase">
                  Budget total à répartir
                </div>
                <div className="text-right font-ui text-sm font-medium text-ink tabular-nums">
                  {fmt(globalExpense)}
                </div>
                <SumPctTag sum={sumPct(teams)} />
              </div>
            ) : null}
            <HeadRow
              gridClass={incGrid}
              cols={isPercent ? ["Équipe", "Part", "Budget"] : ["Équipe", "Budget alloué"]}
            />
            {teams.map((it) => (
              <LineRow
                key={it.id}
                {...lineProps("teams")(it)}
                gridClass={incGrid}
                placeholder="Catégorie d'équipe"
              />
            ))}
            <div
              className={cn(
                "mt-3 flex items-center gap-1.5 rounded-md border px-3 py-2.5 font-body text-[0.78rem]",
                balanced
                  ? "border-success/25 bg-success/[0.06] text-success"
                  : "border-warning/25 bg-warning/[0.07] text-warning",
              )}
            >
              {balanced ? (
                <>
                  <Check size={14} /> Équilibré avec le total des dépenses (
                  {fmt(teamTotal)})
                </>
              ) : (
                <>
                  ⚠ Écart de {fmt(Math.abs(teamDiff))}{" "}
                  {teamDiff > 0 ? "au-dessus" : "en-dessous"} du total des
                  dépenses ({fmt(totalExpense)})
                </>
              )}
            </div>
          </Panel>
        </div>

        {/* ── Summary ── */}
        <aside className="lg:sticky lg:top-0">
          <div className="rounded-lg border border-border p-5">
            <div className="mb-4 font-ui text-[0.78rem] font-medium tracking-[0.06em] text-ink uppercase">
              Résumé prévisionnel
            </div>
            <div className="flex items-center justify-between py-1.5 font-body text-[0.86rem] text-ink-muted">
              <span>Recettes</span>
              <b className="font-ui text-[0.92rem] text-success">{fmt(totalIncome)}</b>
            </div>
            <div className="flex items-center justify-between py-1.5 font-body text-[0.86rem] text-ink-muted">
              <span>Dépenses</span>
              <b className="font-ui text-[0.92rem] text-danger">{fmt(totalExpense)}</b>
            </div>
            <div className="my-2.5 h-px bg-border" />
            <div className="flex items-center justify-between py-1.5 text-[0.95rem] text-ink">
              <span>Solde prévisionnel</span>
              <b
                className={cn(
                  "font-display text-[1.7rem] font-semibold leading-none",
                  balance >= 0 ? "text-success" : "text-danger",
                )}
              >
                {balance >= 0 ? "+" : ""}
                {fmt(balance)}
              </b>
            </div>
            <div
              className={cn(
                "my-2.5 rounded-sm p-1.5 text-center font-ui text-[0.64rem] font-medium tracking-[0.07em] uppercase",
                balance >= 0 ? "bg-success/10 text-success" : "bg-danger/10 text-danger",
              )}
            >
              {balance >= 0 ? "Excédent projeté" : "Déficit projeté"}
            </div>

            <div className="mt-2 mb-3 font-ui text-[0.64rem] font-medium tracking-[0.08em] text-ink-disabled uppercase">
              Top catégories de dépense
            </div>
            {topCats.map((c) => {
              const pct = totalExpense ? r((c.amount / totalExpense) * 100) : 0
              return (
                <div className="mb-2.5" key={c.id}>
                  <div className="mb-1 flex justify-between font-body text-[0.76rem] text-ink-subtle">
                    <span className="truncate">{c.label || "—"}</span>
                    <span className="font-ui font-medium text-info">{pct}%</span>
                  </div>
                  <Bar value={pct} sm />
                </div>
              )
            })}

            <button
              type="button"
              onClick={() => navigate("/budget/dashboard")}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md bg-brand px-5 py-3 font-ui text-sm font-medium text-ink-inverted transition-colors hover:bg-brand-dim"
            >
              Enregistrer &amp; voir le dashboard <ArrowRight size={16} />
            </button>
            <p className="mt-3 text-center font-body text-[0.72rem] leading-relaxed text-ink-disabled">
              Valeurs pré-remplies. Enregistrez directement ou ajustez en
              montants ou en pourcentages.
            </p>
          </div>
        </aside>
      </div>
    </>
  )
}
