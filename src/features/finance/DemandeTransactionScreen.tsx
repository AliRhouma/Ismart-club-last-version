import { useEffect, useMemo, useRef, useState } from "react"
import {
  Check,
  Clock,
  FileText,
  MessageSquareQuote,
  Paperclip,
  Plus,
  X,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { fmtShort, fmtFrLong } from "@/lib/format"
import { useData } from "@/data/useData"
import {
  DEMANDE_STATUS_LABEL,
  type DemandeStatus,
  type TransactionRequest,
} from "@/data/seed/transactionRequests"
import { byId } from "@/features/finance/helpers"
import { PageHeader } from "@/components/kit/PageHeader"
import { Badge, type BadgeVariant } from "@/components/kit/Badge"
import { Avatar } from "@/components/kit/Avatar"
import { EmptyState } from "@/components/kit/EmptyState"
import { Kpi } from "@/features/finance/ui"
import { Segmented } from "@/features/budget/ui"
import { DemandeFormModal } from "@/features/finance/DemandeFormModal"

type Filter = "toutes" | DemandeStatus

/** Badge tone + icon per status — the one place the lifecycle is styled. */
const STATUS_STYLE: Record<
  DemandeStatus,
  { variant: BadgeVariant; icon: typeof Check }
> = {
  en_attente: { variant: "warning", icon: Clock },
  approuvee: { variant: "success", icon: Check },
  refusee: { variant: "danger", icon: X },
}

/**
 * Finance ▸ Demander une transaction — the requester's own page: a single
 * primary action (« Nouvelle demande », which opens the form in a modal) sitting
 * above the historique of every demande submitted, each carrying its decision
 * (approuvée / refusée) or still waiting on the admin.
 */
export function DemandeTransactionScreen() {
  const { transactionRequests, groups, subCategories, staff } = useData()

  const [formOpen, setFormOpen] = useState(false)
  const [filter, setFilter] = useState<Filter>("toutes")

  const [toast, setToast] = useState<{ id: number; msg: string } | null>(null)
  const toastId = useRef(0)
  const notify = (msg: string) => setToast({ id: toastId.current++, msg })
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2600)
    return () => clearTimeout(t)
  }, [toast])

  const groupMap = useMemo(() => byId(groups), [groups])
  const subMap = useMemo(() => byId(subCategories), [subCategories])
  const staffMap = useMemo(() => byId(staff), [staff])

  // Most recent first — a historique reads newest-down.
  const ordered = useMemo(
    () =>
      [...transactionRequests].sort((a, b) =>
        b.created_at.localeCompare(a.created_at),
      ),
    [transactionRequests],
  )

  const counts = useMemo(
    () => ({
      toutes: ordered.length,
      en_attente: ordered.filter((d) => d.status === "en_attente").length,
      approuvee: ordered.filter((d) => d.status === "approuvee").length,
      refusee: ordered.filter((d) => d.status === "refusee").length,
    }),
    [ordered],
  )

  // Montant engagé by the approved requests — the number the requester cares about.
  const approvedAmount = useMemo(
    () =>
      ordered
        .filter((d) => d.status === "approuvee")
        .reduce((sum, d) => sum + (d.nature === "Revenu" ? 0 : d.amount), 0),
    [ordered],
  )

  const visible = useMemo(
    () => (filter === "toutes" ? ordered : ordered.filter((d) => d.status === filter)),
    [ordered, filter],
  )

  const newButton = (
    <button
      type="button"
      onClick={() => setFormOpen(true)}
      className="inline-flex items-center gap-1.5 rounded-md bg-brand px-4 py-2 font-ui text-sm font-medium text-ink-inverted shadow-glow transition-colors hover:bg-brand-dim"
    >
      <Plus size={16} /> Nouvelle demande
    </button>
  )

  return (
    <>
      <PageHeader
        title="Demander une transaction"
        subtitle="Soumettez une dépense ou un revenu, puis suivez la décision de l'administration."
        actions={newButton}
      />

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label="Demandes" value={counts.toutes} />
        <Kpi label="En attente" value={counts.en_attente} />
        <Kpi label="Approuvées" value={counts.approuvee} tone="positive" />
        <Kpi
          label="Dépenses approuvées"
          value={`${fmtShort(approvedAmount)} TND`}
        />
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-ui text-base font-medium text-ink">
          Historique des demandes
        </h2>
        <Segmented<Filter>
          value={filter}
          onChange={setFilter}
          options={[
            { value: "toutes", label: "Toutes", badge: counts.toutes },
            { value: "en_attente", label: "En attente", badge: counts.en_attente },
            { value: "approuvee", label: "Approuvées", badge: counts.approuvee },
            { value: "refusee", label: "Refusées", badge: counts.refusee },
          ]}
        />
      </div>

      <div className="mt-4">
        {visible.length === 0 ? (
          <div className="rounded-lg border border-border">
            {counts.toutes === 0 ? (
              <EmptyState
                icon={FileText}
                title="Aucune demande pour le moment"
                description="Vos demandes de dépense et de revenu apparaîtront ici, avec leur décision."
                action={newButton}
              />
            ) : (
              <EmptyState
                icon={FileText}
                title={`Aucune demande ${DEMANDE_STATUS_LABEL[filter as DemandeStatus].toLowerCase()}`}
                description="Changez de filtre pour voir les autres demandes."
              />
            )}
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {visible.map((d) => (
              <DemandeCard
                key={d.id}
                demande={d}
                requester={staffMap.get(d.requester_id)?.full_name ?? "—"}
                role={
                  staffMap.get(d.requester_id)?.role ??
                  staffMap.get(d.requester_id)?.category ??
                  ""
                }
                group={groupMap.get(d.group_id)?.name ?? "—"}
                sub={subMap.get(d.subcategory_id)?.name ?? "—"}
              />
            ))}
          </ul>
        )}
      </div>

      <DemandeFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        onSent={notify}
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

/* ── One historique row ─────────────────────────────────────────────────── */
function DemandeCard({
  demande: d,
  requester,
  role,
  group,
  sub,
}: {
  demande: TransactionRequest
  requester: string
  role: string
  group: string
  sub: string
}) {
  const revenu = d.nature === "Revenu"
  const { variant, icon: StatusIcon } = STATUS_STYLE[d.status]

  return (
    <li className="rounded-lg border border-border p-4 transition-colors hover:border-border-strong">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <Avatar name={requester} size="md" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-body text-[0.9rem] text-ink">{requester}</span>
              {role ? (
                <span className="font-body text-[0.74rem] text-ink-disabled">
                  {role}
                </span>
              ) : null}
            </div>
            <div className="mt-1 truncate font-body text-[0.78rem] text-ink-muted">
              {group} → {sub}
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1.5">
          <Badge variant={variant}>
            <StatusIcon size={11} strokeWidth={2.5} />
            {DEMANDE_STATUS_LABEL[d.status]}
          </Badge>
          <span
            className={cn(
              "font-display text-[1.05rem] font-semibold whitespace-nowrap tabular-nums",
              revenu ? "text-success" : "text-danger",
            )}
          >
            {revenu ? "+" : "−"}
            {fmtShort(d.amount)} TND
          </span>
        </div>
      </div>

      <p className="mt-3 font-body text-[0.82rem] text-ink-subtle">{d.motif}</p>

      <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 font-body text-[0.72rem] text-ink-disabled">
        <span className="tabular-nums">Soumise le {fmtFrLong(d.created_at)}</span>
        <span aria-hidden>·</span>
        <span className="tabular-nums">Souhaitée pour {fmtFrLong(d.date)}</span>
        {d.decided_at ? (
          <>
            <span aria-hidden>·</span>
            <span className="tabular-nums">
              {d.status === "approuvee" ? "Approuvée" : "Refusée"} le{" "}
              {fmtFrLong(d.decided_at)}
            </span>
          </>
        ) : null}
        {d.attachment ? (
          <>
            <span aria-hidden>·</span>
            <span className="inline-flex items-center gap-1 text-info">
              <Paperclip size={12} />
              {d.attachment}
            </span>
          </>
        ) : null}
      </div>

      {d.decision_note ? (
        <div className="mt-3 flex items-start gap-2.5 rounded-md border border-border bg-surface-nested px-3.5 py-2.5">
          <MessageSquareQuote
            size={14}
            className="mt-0.5 shrink-0 text-ink-disabled"
          />
          <div className="min-w-0">
            <div className="font-ui text-[0.66rem] font-medium tracking-[0.08em] text-ink-disabled uppercase">
              Réponse de l'administration
            </div>
            <p className="mt-1 font-body text-[0.8rem] text-ink-subtle">
              {d.decision_note}
            </p>
          </div>
        </div>
      ) : null}
    </li>
  )
}
