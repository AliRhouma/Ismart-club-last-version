import { useNavigate } from "react-router-dom"
import { ArrowRight, Lock, Plus } from "lucide-react"

import { cn } from "@/lib/utils"
import { fmt } from "@/lib/format"
import { useData } from "@/data/useData"
import { sumLines } from "@/data/seed/budget"
import { PageHead } from "@/features/budget/ui"

/* ── One realised/forecast figure inside a card ────────────────────────── */
function Figure({
  label,
  value,
  tone,
  big,
}: {
  label: string
  value: string
  tone?: "brand" | "danger"
  big?: boolean
}) {
  return (
    <div className="min-w-0">
      <div
        className={cn(
          "leading-none tabular-nums",
          big ? "font-display text-[1.7rem]" : "font-ui text-[0.95rem] font-bold",
          tone === "brand" && "text-brand",
          tone === "danger" && "text-danger",
          !tone && "text-ink",
        )}
      >
        {value}
      </div>
      <div className="mt-1 font-ui text-[0.6rem] font-bold tracking-[0.08em] text-ink-disabled uppercase">
        {label}
      </div>
    </div>
  )
}

export function SeasonSelectScreen() {
  const navigate = useNavigate()
  const { budget, seasons } = useData()

  // Active season is derived live from the budget store so the figures match
  // the configuration screen exactly (works in both saisie modes).
  const income =
    budget.mode === "percent" ? budget.globalIncome : sumLines(budget.income)
  const expense =
    budget.mode === "percent" ? budget.globalExpense : sumLines(budget.expenses)
  const balance = income - expense

  return (
    <div className="mx-auto max-w-5xl">
      <PageHead
        title="Saisons"
        action={
          <button
            type="button"
            onClick={() => navigate("/budget/nouvelle")}
            className="inline-flex items-center gap-2 rounded-md bg-brand px-5 py-3 font-ui text-sm font-bold text-ink-inverted shadow-glow transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-[0_12px_40px_var(--green-glow)]"
          >
            <Plus size={16} /> Ajouter une saison
          </button>
        }
      />
      <p className="-mt-4 mb-6 max-w-prose font-body text-sm text-ink-muted">
        Ouvrez la saison en cours pour suivre son budget, ou créez une nouvelle
        saison. L’historique des saisons clôturées reste en lecture seule.
      </p>

      {/* ── Active season — the one clickable, hero card → dashboard ──────── */}
      <button
        type="button"
        onClick={() => navigate("/budget/dashboard")}
        className="group block w-full rounded-lg border border-brand/25 p-6 text-left shadow-glow transition-[transform,box-shadow] hover:-translate-y-1 hover:shadow-[0_16px_50px_var(--green-glow)]"
        style={{
          background:
            "linear-gradient(160deg, var(--green-glow), var(--surface))",
        }}
      >
        <div className="flex items-start justify-between gap-4">
          <span className="inline-flex items-center gap-2 rounded-pill border border-brand/25 bg-brand/10 px-2.5 py-1 font-ui text-[0.64rem] font-bold tracking-[0.08em] text-brand uppercase">
            <span className="size-1.5 rounded-full bg-brand shadow-[0_0_8px_var(--green-glow)]" />
            Saison active
          </span>
          <span className="inline-flex items-center gap-1.5 font-ui text-[0.72rem] font-bold tracking-[0.05em] text-brand uppercase">
            Tableau de bord
            <ArrowRight
              size={15}
              className="transition-transform group-hover:translate-x-0.5"
            />
          </span>
        </div>

        <h2 className="mt-3 font-ui text-[1.6rem] font-bold leading-tight tracking-tight text-ink">
          {budget.season}
        </h2>
        <p className="mt-1.5 font-body text-[0.82rem] text-ink-muted">
          {budget.teams.length} équipes · Budget prévisionnel · Devise TND
        </p>

        <div className="mt-5 grid grid-cols-3 gap-4 border-t border-border pt-4">
          <Figure label="Recettes prév." value={fmt(income)} tone="brand" />
          <Figure label="Dépenses prév." value={fmt(expense)} tone="danger" />
          <Figure
            label="Solde prév."
            value={(balance >= 0 ? "+" : "") + fmt(balance)}
            tone={balance >= 0 ? "brand" : "danger"}
            big
          />
        </div>
      </button>

      {/* ── Archived seasons — read-only, non-clickable ───────────────────── */}
      <div className="mt-8 mb-3 flex items-center gap-2 font-ui text-[0.62rem] font-bold tracking-[0.1em] text-ink-disabled uppercase">
        Saisons précédentes
        <span className="rounded-full bg-accent px-1.5 py-0.5 text-[0.6rem] text-ink-muted">
          {seasons.length}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {seasons.map((s) => {
          const solde = s.income - s.expense
          const deficit = solde < 0
          return (
            <article
              key={s.id}
              aria-disabled="true"
              className="flex cursor-default flex-col rounded-lg border border-border bg-surface p-5"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-pill border border-border bg-accent px-2.5 py-1 font-ui text-[0.6rem] font-bold tracking-[0.08em] text-ink-muted uppercase">
                  <Lock size={11} /> Archivée
                </span>
                {deficit ? (
                  <span className="rounded-sm border border-danger/20 bg-danger/10 px-1.5 py-0.5 font-ui text-[0.58rem] font-bold tracking-[0.04em] text-danger uppercase">
                    Déficit
                  </span>
                ) : null}
              </div>

              <h3 className="mt-3 font-ui text-xl font-bold leading-tight tracking-tight text-ink-subtle">
                {s.label}
              </h3>
              <p className="mt-1 font-body text-[0.76rem] text-ink-disabled">
                {s.teamCount} équipes · Clôturée
              </p>

              <div className="mt-4 flex flex-col gap-1 border-t border-border pt-3">
                <Row label="Recettes" value={fmt(s.income)} />
                <Row label="Dépenses" value={fmt(s.expense)} />
                <Row
                  label="Solde final"
                  value={(solde >= 0 ? "+" : "") + fmt(solde)}
                  tone={solde >= 0 ? "brand" : "danger"}
                  strong
                />
              </div>

              <p className="mt-3 font-body text-[0.7rem] text-ink-disabled">
                Lecture seule — saison clôturée
              </p>
            </article>
          )
        })}
      </div>
    </div>
  )
}

/* ── Label / value line for archived cards ─────────────────────────────── */
function Row({
  label,
  value,
  tone,
  strong,
}: {
  label: string
  value: string
  tone?: "brand" | "danger"
  strong?: boolean
}) {
  return (
    <div className="flex items-center justify-between py-0.5 font-body text-[0.82rem]">
      <span className="text-ink-muted">{label}</span>
      <span
        className={cn(
          "font-ui tabular-nums",
          strong ? "text-[0.9rem] font-bold" : "font-semibold",
          tone === "brand" && "text-brand",
          tone === "danger" && "text-danger",
          !tone && "text-ink-subtle",
        )}
      >
        {value}
      </span>
    </div>
  )
}
