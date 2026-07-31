import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  ArrowRight,
  Check,
  ChevronDown,
  Handshake,
  MoreVertical,
  Pencil,
  Plus,
  Sparkles,
  Trash2,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { fmtFrLong } from "@/lib/format"
import { useData } from "@/data/useData"
import { contractSpan, type Offer, type Partner } from "@/data/seed/sponsoring"
import { SponsoringShell } from "@/features/sponsoring/SponsoringShell"
import { EmptyState } from "@/components/kit/EmptyState"
import { ConfirmDialog } from "@/components/kit/ConfirmDialog"
import { Avatar } from "@/components/kit/Avatar"
import { DataTable, type Column } from "@/components/kit/DataTable"
import { Stat } from "@/features/budget/ui"
import { PartnerFormModal } from "@/features/sponsoring/PartnerFormModal"

/** One flat row of the partners table — a partenaire joined to its pack + account. */
type Row = {
  partner: Partner
  offer: Offer | null
  packName: string
  accountName: string | null
}

/**
 * Screen 5 — partenaires, as one flat table.
 *
 * Every partenaire on a single list; the pack it signed shows as plain text (no
 * colour, no tier badge). References EducateursScreen (roster rows) and the
 * DataTable kit.
 */
export function PartenairesScreen() {
  const navigate = useNavigate()
  const { offers, partners, sponsorAccounts, removePartner } = useData()

  const [form, setForm] = useState<{ offer: Offer; editing: Partner | null } | null>(
    null,
  )
  const [confirm, setConfirm] = useState<Partner | null>(null)

  const [toast, setToast] = useState<{ id: number; msg: string } | null>(null)
  const toastId = useRef(0)
  const notify = (msg: string) => setToast({ id: toastId.current++, msg })
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2600)
    return () => clearTimeout(t)
  }, [toast])

  const offerById = useMemo(
    () => new Map(offers.map((o) => [o.id, o])),
    [offers],
  )
  const accountById = useMemo(
    () => new Map(sponsorAccounts.map((a) => [a.id, a])),
    [sponsorAccounts],
  )

  const totalSeats = offers.reduce((s, o) => s + o.seats, 0)
  const linked = partners.filter((p) => p.accountId).length

  // Flat rows, ordered by pack rank then partner name.
  const rows = useMemo<Row[]>(() => {
    return partners
      .map((partner) => {
        const offer = offerById.get(partner.offerId) ?? null
        const account = partner.accountId
          ? accountById.get(partner.accountId) ?? null
          : null
        return {
          partner,
          offer,
          packName: offer?.name ?? "—",
          accountName: account?.company ?? null,
        }
      })
      .sort(
        (a, b) =>
          (b.offer?.points ?? 0) - (a.offer?.points ?? 0) ||
          a.partner.name.localeCompare(b.partner.name),
      )
  }, [partners, offerById, accountById])

  const columns: Column<Row>[] = [
    {
      id: "partner",
      header: "Partenaire",
      cell: (row) => (
        <div className="flex items-start gap-3">
          <Avatar name={row.partner.name} size="md" />
          <div className="min-w-0">
            <button
              type="button"
              onClick={() =>
                navigate(`/sponsoring/partenaires/${row.partner.id}`)
              }
              className="group/name inline-flex items-center gap-1.5 text-left font-body text-[0.88rem] text-ink transition-colors hover:text-brand-blue-600"
            >
              {row.partner.name}
              <ArrowRight
                size={13}
                className="opacity-0 transition-opacity group-hover/name:opacity-100"
              />
            </button>
            {row.partner.description ? (
              <p className="mt-0.5 line-clamp-1 font-body text-[0.76rem] text-ink-muted">
                {row.partner.description}
              </p>
            ) : (
              <p className="mt-0.5 font-body text-[0.76rem] text-ink-disabled italic">
                Pas encore de description
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      id: "pack",
      header: "Pack",
      // Plain text — no colour, no tier badge.
      cell: (row) => <span className="text-ink-subtle">{row.packName}</span>,
    },
    {
      id: "periode",
      header: "Période",
      // Un contrat qui expire est le vrai signal de cette table : la date reste
      // neutre, c'est l'échéance qui prend la couleur.
      cell: (row) => {
        const span = contractSpan(row.partner.startDate, row.partner.endDate)
        if (!span) return <span className="text-ink-disabled">Non définie</span>
        return (
          <div className="min-w-0">
            <div className="text-ink-subtle">
              Jusqu'au {fmtFrLong(row.partner.endDate)}
            </div>
            <div
              className={cn(
                "mt-0.5 font-body text-[0.74rem]",
                span.tone === "over" && "text-danger",
                span.tone === "soon" && "text-warning",
                (span.tone === "ok" || span.tone === "future") &&
                  "text-ink-disabled",
              )}
            >
              {span.status}
            </div>
          </div>
        )
      },
    },
    {
      id: "account",
      header: "Compte rattaché",
      cell: (row) =>
        row.accountName ? (
          <span className="text-ink-subtle">{row.accountName}</span>
        ) : (
          <span className="text-ink-disabled">Aucun compte</span>
        ),
    },
    {
      id: "actions",
      header: "",
      align: "right",
      width: "56px",
      cell: (row) =>
        row.offer ? (
          <RowMenu
            onEdit={() => setForm({ offer: row.offer!, editing: row.partner })}
            onDelete={() => setConfirm(row.partner)}
          />
        ) : null,
    },
  ]

  // No offers at all → the module isn't set up yet; send the admin there first.
  if (offers.length === 0) {
    return (
      <SponsoringShell
        active="partenaires"
        subtitle="Les entreprises qui soutiennent le club."
      >
        <div className="mt-6 rounded-lg border border-border">
          <EmptyState
            icon={Handshake}
            title="Créez d'abord une offre"
            description="Un partenaire signe toujours sur une offre de sponsoring. Créez une formule pour commencer."
            action={
              <button
                type="button"
                onClick={() => navigate("/sponsoring/offres/nouvelle")}
                className="inline-flex items-center gap-1.5 rounded-md bg-brand px-4 py-2 font-ui text-sm font-medium text-ink-inverted shadow-glow transition-colors hover:bg-brand-dim"
              >
                <Plus size={16} /> Nouvelle offre
              </button>
            }
          />
        </div>
      </SponsoringShell>
    )
  }

  return (
    <SponsoringShell
      active="partenaires"
      subtitle="Les entreprises qui soutiennent le club."
      actions={
        <AddPartnerMenu
          offers={offers}
          partners={partners}
          onPick={(offer) => setForm({ offer, editing: null })}
          onSurMesure={() => navigate("/sponsoring/demandes-sur-mesure")}
        />
      }
    >
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat label="Partenaires" value={partners.length} />
        <Stat label="Places occupées" value={`${partners.length} / ${totalSeats}`} />
        <Stat label="Comptes rattachés" value={`${linked} / ${partners.length}`} />
      </div>

      <div className="mt-8">
        <DataTable
          columns={columns}
          data={rows}
          getRowId={(row) => row.partner.id}
          empty={{
            icon: Handshake,
            title: "Aucun partenaire",
            description: "Ajoutez le premier partenaire du club.",
          }}
        />
      </div>

      {/* ── Overlays ──────────────────────────────────────────────────── */}
      {form ? (
        <PartnerFormModal
          offer={form.offer}
          editing={form.editing}
          onClose={() => setForm(null)}
          onSaved={notify}
        />
      ) : null}

      <ConfirmDialog
        open={confirm !== null}
        onOpenChange={(o) => !o && setConfirm(null)}
        title="Retirer ce partenaire ?"
        description={
          confirm
            ? `« ${confirm.name} » libérera sa place sur l'offre.`
            : undefined
        }
        confirmLabel="Retirer"
        onConfirm={() => {
          if (confirm) removePartner(confirm.id)
          const name = confirm?.name
          setConfirm(null)
          notify(`Partenaire${name ? ` « ${name} »` : ""} retiré`)
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
    </SponsoringShell>
  )
}

/* ── "Ajouter un partenaire" → pick which pack (plain text menu) ─────────── */
function AddPartnerMenu({
  offers,
  partners,
  onPick,
  onSurMesure,
}: {
  offers: Offer[]
  partners: Partner[]
  onPick: (offer: Offer) => void
  onSurMesure: () => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false)
    document.addEventListener("mousedown", onDown)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onDown)
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  const sorted = [...offers].sort((a, b) => b.points - a.points)

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 rounded-md bg-brand px-4 py-2 font-ui text-sm font-medium text-ink-inverted shadow-glow transition-colors hover:bg-brand-dim"
      >
        <Plus size={16} /> Ajouter un partenaire
        <ChevronDown size={14} className={cn("transition-transform", open && "rotate-180")} />
      </button>

      {open ? (
        <div className="absolute right-0 z-30 mt-1.5 w-[240px] overflow-hidden rounded-lg border border-border bg-surface py-1 shadow-deep">
          <div className="px-3.5 py-2 font-ui text-[0.66rem] font-medium tracking-[0.08em] text-ink-disabled uppercase">
            Choisir un pack
          </div>
          {sorted.map((offer) => {
            const taken = partners.filter((p) => p.offerId === offer.id).length
            const free = offer.seats - taken
            return (
              <button
                key={offer.id}
                type="button"
                disabled={free <= 0}
                onClick={() => {
                  setOpen(false)
                  onPick(offer)
                }}
                className="flex w-full items-center justify-between gap-3 px-3.5 py-2 text-left font-body text-[0.84rem] text-ink-subtle transition-colors hover:bg-surface-hover hover:text-ink disabled:cursor-not-allowed disabled:text-ink-disabled disabled:hover:bg-transparent"
              >
                <span className="truncate">{offer.name}</span>
                <span className="shrink-0 font-body text-[0.72rem] text-ink-muted tabular-nums">
                  {free > 0 ? `${free} place${free > 1 ? "s" : ""}` : "Complet"}
                </span>
              </button>
            )
          })}

          {/* Sur mesure — a partenaire outside the standard packs; opens the
              custom-request flow. */}
          <div className="mt-1 border-t border-border pt-1">
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                onSurMesure()
              }}
              className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left font-body text-[0.84rem] text-info transition-colors hover:bg-surface-hover"
            >
              <Sparkles size={15} className="shrink-0" />
              Sur mesure
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

/* ── Row overflow menu (Modifier / Retirer) ─────────────────────────────── */
function RowMenu({
  onEdit,
  onDelete,
}: {
  onEdit: () => void
  onDelete: () => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false)
    document.addEventListener("mousedown", onDown)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onDown)
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  const run = (fn: () => void) => {
    setOpen(false)
    fn()
  }

  return (
    <div ref={ref} className="relative inline-block shrink-0 text-left">
      <button
        type="button"
        aria-label="Actions"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "inline-flex size-8 items-center justify-center rounded-sm border text-ink-muted transition-colors",
          open
            ? "border-border-strong bg-surface-hover text-ink"
            : "border-transparent hover:border-border hover:bg-surface-hover hover:text-ink",
        )}
      >
        <MoreVertical size={16} />
      </button>
      {open ? (
        <div className="absolute right-0 z-30 mt-1.5 w-[160px] overflow-hidden rounded-lg border border-border bg-surface py-1 shadow-deep">
          <button
            type="button"
            onClick={() => run(onEdit)}
            className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left font-body text-[0.82rem] text-ink-subtle transition-colors hover:bg-surface-hover hover:text-ink"
          >
            <Pencil size={15} className="shrink-0" /> Modifier
          </button>
          <button
            type="button"
            onClick={() => run(onDelete)}
            className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left font-body text-[0.82rem] text-danger transition-colors hover:bg-surface-hover"
          >
            <Trash2 size={15} className="shrink-0" /> Retirer
          </button>
        </div>
      ) : null}
    </div>
  )
}
