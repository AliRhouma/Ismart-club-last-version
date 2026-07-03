import { useMemo, useState, type ReactNode } from "react"
import { Check, ChevronDown, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { fmt, fmtFrDate, todayISO } from "@/lib/format"
import { useData } from "@/data/useData"
import type { EntryKind } from "@/data/seed/entries"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { NumInput } from "@/features/budget/ui"

const inputCls =
  "w-full rounded-md border border-input bg-input-bg px-3.5 py-2.5 font-body text-sm text-ink outline-none transition-colors placeholder:text-ink-disabled focus:border-border-focus"

const TEAM_FALLBACK = "Club"

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-ui text-[0.7rem] font-medium tracking-[0.06em] text-ink-muted uppercase">
        {label}
      </span>
      {children}
    </label>
  )
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string
  onChange: (v: string) => void
  options: string[]
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(inputCls, "cursor-pointer appearance-none pr-9")}
      >
        {options.length === 0 ? <option value="">—</option> : null}
        {options.map((o) => (
          <option key={o} value={o} className="bg-surface text-ink">
            {o}
          </option>
        ))}
      </select>
      <ChevronDown
        size={15}
        className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-ink-disabled"
      />
    </div>
  )
}

/**
 * Saisie d'une recette / dépense. `kind === "in"` records a revenue source,
 * `kind === "out"` a categorised expense. Categories and teams are read live
 * from the config so they always match. A dépense can target several équipes —
 * its amount is then split equally between them.
 */
export function EntryModal({
  kind,
  onClose,
  onAdded,
}: {
  kind: EntryKind
  onClose: () => void
  onAdded: (message: string) => void
}) {
  const { budget, addEntry } = useData()
  const isIncome = kind === "in"

  const cats = useMemo(
    () =>
      (isIncome ? budget.income : budget.expenses)
        .map((l) => l.label)
        .filter(Boolean),
    [budget.income, budget.expenses, isIncome],
  )
  const teamOptions = useMemo(
    () => [TEAM_FALLBACK, ...budget.teams.map((t) => t.label).filter(Boolean)],
    [budget.teams],
  )

  const [label, setLabel] = useState("")
  const [cat, setCat] = useState(cats[0] ?? "")
  const [teams, setTeams] = useState<string[]>([TEAM_FALLBACK])
  const [amount, setAmount] = useState(0)
  const [dateIso, setDateIso] = useState(todayISO())

  const title = isIncome ? "Saisie d'une recette" : "Saisie d'une dépense"
  const verb = isIncome ? "Recette" : "Dépense"

  const toggleTeam = (name: string) =>
    setTeams((prev) =>
      prev.includes(name) ? prev.filter((t) => t !== name) : [...prev, name],
    )

  const canSubmit =
    label.trim().length > 0 && amount > 0 && cat.length > 0 && teams.length > 0

  const submit = () => {
    if (!canSubmit) return
    addEntry({
      date: fmtFrDate(dateIso),
      label: label.trim(),
      cat,
      teams,
      amount,
      kind,
    })
    onAdded(`${verb} enregistrée — ${fmt(amount)}`)
    onClose()
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="gap-0 overflow-hidden rounded-xl border-border bg-surface p-0 sm:max-w-[560px]"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div className="min-w-0">
            <DialogTitle className="font-ui text-base font-medium text-ink">
              {title}
            </DialogTitle>
            <DialogDescription className="mt-0.5 font-body text-[0.8rem] text-ink-muted">
              {isIncome
                ? "Enregistrez une nouvelle source de revenu du club."
                : "Catégorisez une dépense et affectez-la à une ou plusieurs équipes."}
            </DialogDescription>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="flex size-[30px] shrink-0 items-center justify-center rounded-sm border border-border text-ink-disabled transition-colors hover:border-[var(--border-hover)] hover:text-ink"
          >
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col gap-3.5 px-5 py-4">
          <Field label="Libellé">
            <input
              className={inputCls}
              value={label}
              autoFocus
              placeholder={
                isIncome
                  ? "Ex. Sponsor Délice — T2"
                  : "Ex. Maillots domicile — Decathlon"
              }
              onChange={(e) => setLabel(e.target.value)}
            />
          </Field>

          <Field label={isIncome ? "Source" : "Catégorie"}>
            <Select value={cat} onChange={setCat} options={cats} />
          </Field>

          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <Field label="Montant">
              <NumInput value={amount} suffix="TND" onChange={setAmount} />
            </Field>
            <Field label="Date">
              <input
                type="date"
                className={cn(inputCls, "[color-scheme:dark]")}
                value={dateIso}
                onChange={(e) => setDateIso(e.target.value)}
              />
            </Field>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="font-ui text-[0.7rem] font-medium tracking-[0.06em] text-ink-muted uppercase">
              Équipes concernées
            </span>
            <div className="flex flex-wrap gap-1.5">
              {teamOptions.map((name) => {
                const on = teams.includes(name)
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => toggleTeam(name)}
                    aria-pressed={on}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-pill border px-2.5 py-1 font-ui text-[0.68rem] font-medium tracking-[0.04em] uppercase transition-colors",
                      on
                        ? "border-info/30 bg-info/10 text-info"
                        : "border-border text-ink-muted hover:border-[var(--border-hover)] hover:text-ink",
                    )}
                  >
                    {on ? <Check size={12} /> : null}
                    {name}
                  </button>
                )
              })}
            </div>
            <p className="font-body text-[0.72rem] text-ink-disabled">
              {teams.length > 1
                ? `Montant réparti à parts égales entre ${teams.length} équipes.`
                : "Sélectionnez une ou plusieurs équipes concernées."}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-3.5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-input px-4 py-2 font-ui text-sm font-medium text-ink transition-colors hover:border-[var(--border-hover)] hover:bg-accent"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!canSubmit}
            className="inline-flex items-center gap-1.5 rounded-md bg-brand px-5 py-2 font-ui text-sm font-medium text-ink-inverted shadow-glow transition-[colors,opacity] hover:bg-brand-dim disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Check size={16} /> Enregistrer
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
