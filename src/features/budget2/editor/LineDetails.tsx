import { Plus, Trash2, Users } from "lucide-react"

import { cn } from "@/lib/utils"
import { fmt } from "@/lib/format"
import type { FinanceTeam } from "@/data/seed/finance"
import { NumInput, Bar } from "@/features/budget/ui"

/* ───────────────────────────────────────────────────────────────────────────
   Local (UI-only) shapes. These are NOT persisted yet — the section shows the
   intended interaction; wiring to the store comes later.
   ─────────────────────────────────────────────────────────────────────────── */

export type SubType = { id: string; name: string; amount: number }
export type RepartPart = { id: string; teamIds: string[]; pct: number }

const uid = () => crypto.randomUUID()

export const newSubType = (): SubType => ({ id: uid(), name: "", amount: 0 })

/** "Autres" pseudo-team so a part can catch every remaining squad. */
export const AUTRES = { id: "autres", name: "Autres" }

/* ── Sous-types — break a line into named sub-items ─────────────────────── */

export function SubTypesField({
  items,
  onChange,
}: {
  items: SubType[]
  onChange: (items: SubType[]) => void
}) {
  const update = (id: string, patch: Partial<SubType>) =>
    onChange(items.map((it) => (it.id === id ? { ...it, ...patch } : it)))
  const remove = (id: string) => onChange(items.filter((it) => it.id !== id))
  const add = () => onChange([...items, newSubType()])

  const total = items.reduce((acc, it) => acc + it.amount, 0)

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <span className="font-ui text-[0.7rem] font-medium tracking-[0.06em] text-ink-muted uppercase">
          Sous-types
        </span>
        {items.length > 0 ? (
          <span className="font-body text-[0.72rem] text-ink-disabled tabular-nums">
            {items.length} · {fmt(total)}
          </span>
        ) : null}
      </div>

      {items.length === 0 ? (
        <p className="font-body text-[0.72rem] text-ink-disabled">
          Détaillez la ligne en sous-types (optionnel).
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((it) => (
            <div key={it.id} className="flex items-center gap-2">
              <input
                value={it.name}
                onChange={(e) => update(it.id, { name: e.target.value })}
                placeholder="Nom du sous-type"
                className="min-w-0 flex-1 rounded-md border border-input bg-transparent px-3 py-2 font-body text-sm text-ink outline-none transition-colors placeholder:text-ink-disabled focus:border-border-focus"
              />
              <div className="w-[130px] shrink-0">
                <NumInput
                  value={it.amount}
                  suffix="TND"
                  onChange={(v) => update(it.id, { amount: v })}
                  small
                />
              </div>
              <button
                type="button"
                aria-label="Supprimer le sous-type"
                onClick={() => remove(it.id)}
                className="flex size-8 shrink-0 items-center justify-center rounded-md border border-border text-ink-disabled transition-colors hover:border-danger/40 hover:text-danger"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={add}
        className="inline-flex items-center gap-1.5 self-start rounded-md border border-dashed border-border-second px-3 py-1.5 font-ui text-[0.76rem] font-medium text-ink-muted transition-colors hover:border-border-strong hover:text-ink"
      >
        <Plus size={14} /> Ajouter un sous-type
      </button>
    </div>
  )
}

/* ── Répartition par équipe (%) ─────────────────────────────────────────── */

function Switch({
  checked,
  onChange,
}: {
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border transition-colors",
        checked
          ? "border-info/40 bg-info/25"
          : "border-border-strong bg-surface-nested",
      )}
    >
      <span
        className={cn(
          "inline-block size-3.5 rounded-full bg-ink transition-transform",
          checked ? "translate-x-4" : "translate-x-0.5",
        )}
      />
    </button>
  )
}

/** Default three-part split that mirrors the classic example. */
export function defaultParts(): RepartPart[] {
  return [
    { id: uid(), teamIds: ["team-seniors"], pct: 40 },
    { id: uid(), teamIds: ["team-u17", "team-u15", "team-u13"], pct: 40 },
    { id: uid(), teamIds: [AUTRES.id], pct: 20 },
  ]
}

export function TeamRepartition({
  teams,
  enabled,
  onToggle,
  parts,
  onChange,
  baseAmount,
}: {
  teams: FinanceTeam[]
  enabled: boolean
  onToggle: (v: boolean) => void
  parts: RepartPart[]
  onChange: (parts: RepartPart[]) => void
  baseAmount: number
}) {
  const chips = [...teams, AUTRES]
  const totalPct = parts.reduce((acc, p) => acc + p.pct, 0)
  const balanced = totalPct === 100

  const update = (id: string, patch: Partial<RepartPart>) =>
    onChange(parts.map((p) => (p.id === id ? { ...p, ...patch } : p)))
  const remove = (id: string) => onChange(parts.filter((p) => p.id !== id))
  const add = () => onChange([...parts, { id: uid(), teamIds: [], pct: 0 }])
  const toggleTeam = (part: RepartPart, teamId: string) =>
    update(part.id, {
      teamIds: part.teamIds.includes(teamId)
        ? part.teamIds.filter((t) => t !== teamId)
        : [...part.teamIds, teamId],
    })

  return (
    <div className="rounded-lg border border-border">
      {/* Header + switch */}
      <div className="flex items-center justify-between gap-3 px-3.5 py-3">
        <div className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-md bg-surface-nested text-ink-muted">
            <Users size={15} />
          </span>
          <div>
            <div className="font-ui text-[0.82rem] font-medium text-ink">
              Répartition par équipe
            </div>
            <div className="font-body text-[0.72rem] text-ink-disabled">
              Ventiler le montant entre les équipes (%)
            </div>
          </div>
        </div>
        <Switch checked={enabled} onChange={onToggle} />
      </div>

      {enabled ? (
        <div className="flex flex-col gap-2.5 border-t border-border px-3.5 py-3">
          {parts.map((part, i) => {
            const amount = Math.round((baseAmount * part.pct) / 100)
            return (
              <div
                key={part.id}
                className="rounded-md border border-border bg-surface-nested p-2.5"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-ui text-[0.66rem] font-medium tracking-[0.06em] text-ink-muted uppercase">
                    Part {i + 1}
                  </span>
                  <button
                    type="button"
                    aria-label="Supprimer la part"
                    onClick={() => remove(part.id)}
                    className="flex size-6 items-center justify-center rounded-md text-ink-disabled transition-colors hover:text-danger"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

                {/* Team chips */}
                <div className="mb-2.5 flex flex-wrap gap-1.5">
                  {chips.map((t) => {
                    const on = part.teamIds.includes(t.id)
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => toggleTeam(part, t.id)}
                        aria-pressed={on}
                        className={cn(
                          "rounded-pill border px-2.5 py-0.5 font-ui text-[0.68rem] font-medium transition-colors",
                          on
                            ? "border-info/30 bg-info/10 text-info"
                            : "border-border text-ink-muted hover:border-border-strong hover:text-ink",
                        )}
                      >
                        {t.name}
                      </button>
                    )
                  })}
                </div>

                {/* Percentage + amount preview */}
                <div className="flex items-center gap-3">
                  <div className="w-[92px] shrink-0">
                    <NumInput
                      value={part.pct}
                      suffix="%"
                      onChange={(v) => update(part.id, { pct: v })}
                      small
                    />
                  </div>
                  <div className="flex-1">
                    <Bar value={part.pct} sm />
                  </div>
                  <span className="w-[92px] shrink-0 text-right font-body text-[0.76rem] text-ink-subtle tabular-nums">
                    {fmt(amount)}
                  </span>
                </div>
              </div>
            )
          })}

          <button
            type="button"
            onClick={add}
            className="inline-flex items-center gap-1.5 self-start rounded-md border border-dashed border-border-second px-3 py-1.5 font-ui text-[0.76rem] font-medium text-ink-muted transition-colors hover:border-border-strong hover:text-ink"
          >
            <Plus size={14} /> Ajouter une part
          </button>

          {/* Total indicator */}
          <div className="mt-1 flex items-center justify-between rounded-md border border-border px-3 py-2">
            <span className="font-ui text-[0.68rem] font-medium tracking-[0.06em] text-ink-muted uppercase">
              Total réparti
            </span>
            <span
              className={cn(
                "font-ui text-sm font-semibold tabular-nums",
                balanced ? "text-success" : "text-warning",
              )}
            >
              {totalPct}%{balanced ? "" : " · doit faire 100%"}
            </span>
          </div>
        </div>
      ) : null}
    </div>
  )
}
