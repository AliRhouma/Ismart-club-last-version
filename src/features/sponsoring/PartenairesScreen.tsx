import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  ArrowRight,
  Check,
  Handshake,
  LayoutTemplate,
  Link2,
  Link2Off,
  MoreVertical,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { useData } from "@/data/useData"
import type { Offer, Partner } from "@/data/seed/sponsoring"
import { PageHeader } from "@/components/kit/PageHeader"
import { EmptyState } from "@/components/kit/EmptyState"
import { ConfirmDialog } from "@/components/kit/ConfirmDialog"
import { Avatar } from "@/components/kit/Avatar"
import { Stat } from "@/features/budget/ui"
import { TierBadge } from "@/features/sponsoring/ui"
import { PartnerFormModal } from "@/features/sponsoring/PartnerFormModal"

/**
 * Screen 5 — partenaires, grouped by the offer they signed.
 *
 * The grouping is the point: an admin reads this page to answer "which tiers are
 * full and which still have seats to sell", so every tier shows even when empty,
 * with its remaining seats as the call to action.
 * References OffresScreen (cards, menu, toast) and EducateursScreen (roster rows).
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

  const accountById = useMemo(
    () => new Map(sponsorAccounts.map((a) => [a.id, a])),
    [sponsorAccounts],
  )

  const sortedOffers = [...offers].sort((a, b) => b.points - a.points)
  const totalSeats = offers.reduce((s, o) => s + o.seats, 0)
  const linked = partners.filter((p) => p.accountId).length

  // No offers at all → the module isn't set up yet; send the admin there first.
  if (offers.length === 0) {
    return (
      <>
        <PageHeader
          title="Partenaires"
          subtitle="Les entreprises qui soutiennent le club."
        />
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
      </>
    )
  }

  return (
    <>
      <PageHeader
        title="Partenaires"
        subtitle="Les entreprises qui soutiennent le club, par offre signée."
        actions={
          <button
            type="button"
            onClick={() => navigate("/sponsoring/offres")}
            className="inline-flex items-center gap-1.5 rounded-md border border-input px-4 py-2 font-ui text-sm font-medium text-ink transition-colors hover:border-border-strong hover:bg-accent"
          >
            <LayoutTemplate size={16} /> Offres de sponsoring
          </button>
        }
      />

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat label="Partenaires" value={partners.length} />
        <Stat label="Places occupées" value={`${partners.length} / ${totalSeats}`} />
        <Stat label="Comptes rattachés" value={`${linked} / ${partners.length}`} />
      </div>

      <div className="mt-8 flex flex-col gap-8">
        {sortedOffers.map((offer) => {
          const rows = partners.filter((p) => p.offerId === offer.id)
          const free = offer.seats - rows.length

          return (
            <section key={offer.id}>
              <div className="flex items-center justify-between gap-3 border-b border-border pb-2.5">
                <div className="flex items-center gap-3">
                  <TierBadge name={offer.name} color={offer.color} size="sm" />
                  <span className="font-body text-[0.78rem] text-ink-muted tabular-nums">
                    {rows.length} / {offer.seats} places occupées
                  </span>
                </div>
                <button
                  type="button"
                  disabled={free <= 0}
                  onClick={() => setForm({ offer, editing: null })}
                  className="inline-flex items-center gap-1.5 rounded-sm px-2 py-1 font-ui text-[0.75rem] font-medium tracking-[0.04em] text-info uppercase transition-colors hover:bg-surface-hover disabled:cursor-not-allowed disabled:text-ink-disabled disabled:hover:bg-transparent"
                >
                  <Plus size={13} />
                  {free > 0 ? "Ajouter un partenaire" : "Complet"}
                </button>
              </div>

              {rows.length === 0 ? (
                <button
                  type="button"
                  onClick={() => setForm({ offer, editing: null })}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border-strong px-4 py-8 font-body text-[0.8rem] text-ink-muted transition-colors hover:border-info hover:text-info"
                >
                  <Plus size={15} />
                  Aucun partenaire sur cette offre — {offer.seats} place
                  {offer.seats > 1 ? "s" : ""} à vendre
                </button>
              ) : (
                <div className="mt-3 overflow-hidden rounded-lg border border-border">
                  {rows.map((partner, i) => {
                    const account = partner.accountId
                      ? accountById.get(partner.accountId) ?? null
                      : null
                    return (
                      <div
                        key={partner.id}
                        className={cn(
                          "flex items-start gap-3.5 px-4 py-3.5 transition-colors hover:bg-surface-hover",
                          i > 0 && "border-t border-border",
                        )}
                      >
                        <Avatar name={partner.name} size="md" />

                        <div className="min-w-0 flex-1">
                          <button
                            type="button"
                            onClick={() =>
                              navigate(`/sponsoring/partenaires/${partner.id}`)
                            }
                            className="group/name inline-flex items-center gap-1.5 text-left font-body text-[0.88rem] text-ink transition-colors hover:text-brand-blue-600"
                          >
                            {partner.name}
                            <ArrowRight
                              size={13}
                              className="opacity-0 transition-opacity group-hover/name:opacity-100"
                            />
                          </button>
                          {partner.description ? (
                            <p className="mt-0.5 line-clamp-2 font-body text-[0.76rem] leading-snug text-ink-muted">
                              {partner.description}
                            </p>
                          ) : (
                            <p className="mt-0.5 font-body text-[0.76rem] text-ink-disabled italic">
                              Pas encore de description
                            </p>
                          )}
                        </div>

                        <div className="hidden shrink-0 sm:block">
                          {account ? (
                            <span className="inline-flex items-center gap-1.5 rounded-pill border border-brand-blue-600/30 bg-brand-blue-600/10 px-2.5 py-1 font-ui text-[0.7rem] font-medium text-brand-blue-600">
                              <Link2 size={12} />
                              {account.company}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-pill border border-border px-2.5 py-1 font-ui text-[0.7rem] font-medium text-ink-disabled">
                              <Link2Off size={12} />
                              Aucun compte
                            </span>
                          )}
                        </div>

                        <RowMenu
                          onEdit={() => setForm({ offer, editing: partner })}
                          onDelete={() => setConfirm(partner)}
                        />
                      </div>
                    )
                  })}
                </div>
              )}
            </section>
          )
        })}
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
    </>
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
    <div ref={ref} className="relative shrink-0">
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
