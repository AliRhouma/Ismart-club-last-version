import { useEffect, useRef, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import {
  Plus,
  MoreVertical,
  Pencil,
  Copy,
  Trash2,
  Check,
  Sparkles,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { useData } from "@/data/useData"
import {
  OFFER_SPACES,
  pool,
  sharePerTier,
  pct,
  type Offer,
} from "@/data/seed/sponsoring"
import { EmptyState } from "@/components/kit/EmptyState"
import { ConfirmDialog } from "@/components/kit/ConfirmDialog"
import { BackButton } from "@/components/kit/BackButton"
import { PageHeader } from "@/components/kit/PageHeader"
import { Stat } from "@/features/budget/ui"
import { SPACE_ICON } from "@/features/sponsoring/ui"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Handshake } from "lucide-react"

/**
 * Screen 4 — offers list. The module home once the program is joined. Renders
 * the seeded offers sorted by points, each with its computed per-sponsor
 * visibility, and a stacked bar of the whole rotation split by tier.
 */
export function OffresScreen() {
  const navigate = useNavigate()
  const location = useLocation()
  const { offers, partners, offerRequests, removeOffer, duplicateOffer } =
    useData()
  const pendingRequests = offerRequests.filter(
    (r) => r.status === "en_attente",
  ).length

  const [confirm, setConfirm] = useState<Offer | null>(null)

  // Toast is handed over from the form via navigation state; show once, then
  // clear the state so a refresh doesn't replay it.
  const [toast, setToast] = useState<{ id: number; msg: string } | null>(null)
  const toastId = useRef(0)
  const notify = (msg: string) => setToast({ id: toastId.current++, msg })
  useEffect(() => {
    const msg = (location.state as { toast?: string } | null)?.toast
    if (msg) {
      notify(msg)
      navigate(location.pathname, { replace: true, state: null })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2600)
    return () => clearTimeout(t)
  }, [toast])

  const sorted = [...offers].sort((a, b) => b.points - a.points)
  const totalSeats = offers.reduce((s, o) => s + o.seats, 0)
  // Occupancy is derived in render, never stored (CLAUDE.md).
  const takenFor = (offerId: string) =>
    partners.filter((p) => p.offerId === offerId).length

  return (
    <>
      <BackButton
        to="/sponsoring/emplacements"
        label="Retour aux espaces publicitaires"
      />
      <PageHeader
        title="Packs"
        subtitle="Vos formules de partenariat et la visibilité qu'elles donnent."
        actions={
          <>
            <button
              type="button"
              onClick={() => navigate("/sponsoring/demandes-sur-mesure")}
              className="inline-flex items-center gap-1.5 rounded-md border border-input px-4 py-2 font-ui text-sm font-medium text-ink transition-colors hover:border-border-strong hover:bg-accent"
            >
              <Sparkles size={16} /> Sur mesure
              {pendingRequests > 0 ? (
                <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-info/15 px-1.5 py-0.5 font-ui text-[0.68rem] font-medium text-info tabular-nums">
                  {pendingRequests}
                </span>
              ) : null}
            </button>
            <button
              type="button"
              onClick={() => navigate("/sponsoring/offres/nouvelle")}
              className="inline-flex items-center gap-1.5 rounded-md bg-brand px-4 py-2 font-ui text-sm font-medium text-ink-inverted shadow-glow transition-colors hover:bg-brand-dim"
            >
              <Plus size={16} /> Nouveau pack
            </button>
          </>
        }
      />

      {/* Summary strip */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat label="Offres actives" value={offers.length} />
        <Stat label="Places totales" value={totalSeats} />
        <Stat label="Places occupées" value={partners.length} />
      </div>

      {offers.length === 0 ? (
        <div className="mt-6 rounded-lg border border-border">
          <EmptyState
            icon={Handshake}
            title="Aucune offre pour le moment"
            description="Créez votre première formule de partenariat pour commencer."
            action={
              <button
                type="button"
                onClick={() => navigate("/sponsoring/offres/nouvelle")}
                className="inline-flex items-center gap-1.5 rounded-md bg-brand px-4 py-2 font-ui text-sm font-medium text-ink-inverted shadow-glow transition-colors hover:bg-brand-dim"
              >
                <Plus size={16} /> Nouveau pack
              </button>
            }
          />
        </div>
      ) : (
        <>
          {/* Offer grid */}
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {sorted.map((offer) => (
              <OfferCard
                key={offer.id}
                offer={offer}
                onEdit={() =>
                  navigate(`/sponsoring/offres/nouvelle?edit=${offer.id}`)
                }
                onDuplicate={() => {
                  duplicateOffer(offer.id)
                  notify("Offre dupliquée")
                }}
                onDelete={() => setConfirm(offer)}
              />
            ))}

            {/* Dashed "add" placeholder */}
            <button
              type="button"
              onClick={() => navigate("/sponsoring/offres/nouvelle")}
              className="flex min-h-[220px] flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border-strong text-ink-muted transition-colors hover:border-info hover:text-info"
            >
              <span className="flex size-10 items-center justify-center rounded-full border border-current">
                <Plus size={18} />
              </span>
              <span className="font-ui text-[0.82rem] font-medium">
                Nouveau pack
              </span>
            </button>
          </div>

          {/* Répartition de la visibilité */}
          <RepartitionCard offers={offers} />
        </>
      )}

      {/* ── Overlays ──────────────────────────────────────────────────── */}
      <ConfirmDialog
        open={confirm !== null}
        onOpenChange={(o) => !o && setConfirm(null)}
        title="Supprimer cette offre ?"
        description={
          confirm
            ? `« ${confirm.name} » sera retirée de vos offres de sponsoring.${
                takenFor(confirm.id)
                  ? ` Ses ${takenFor(confirm.id)} partenaire${
                      takenFor(confirm.id) > 1 ? "s" : ""
                    } perdront leur place.`
                  : ""
              }`
            : undefined
        }
        confirmLabel="Supprimer"
        onConfirm={() => {
          if (confirm) removeOffer(confirm.id)
          const name = confirm?.name
          setConfirm(null)
          notify(`Offre${name ? ` « ${name} »` : ""} supprimée`)
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

/* ── Offer card ─────────────────────────────────────────────────────────── */
function OfferCard({
  offer,
  onEdit,
  onDuplicate,
  onDelete,
}: {
  offer: Offer
  onEdit: () => void
  onDuplicate: () => void
  onDelete: () => void
}) {
  const enabledSlots = OFFER_SPACES.filter((s) => offer.slots[s.key].enabled)

  return (
    <div className="flex flex-col rounded-lg border border-border transition-colors hover:border-border-strong">
      <div className="flex items-start justify-between gap-2 px-4 pt-4">
        <h3 className="min-w-0 truncate font-ui text-base font-semibold text-ink">
          {offer.name}
        </h3>
        <CardMenu
          onEdit={onEdit}
          onDuplicate={onDuplicate}
          onDelete={onDelete}
        />
      </div>

      <div className="px-4 pt-3">
        <div className="font-display text-lg font-semibold text-ink tabular-nums">
          {offer.price === null
            ? "Échange"
            : `${offer.price.toLocaleString("fr-FR")} DT`}
          {offer.price !== null ? (
            <span className="ml-1 font-body text-[0.72rem] font-normal text-ink-disabled">
              / saison
            </span>
          ) : null}
        </div>
      </div>

      {offer.description ? (
        <p className="mt-3 line-clamp-2 px-4 font-body text-[0.78rem] leading-relaxed text-ink-muted">
          {offer.description}
        </p>
      ) : null}

      {/* Slot icons */}
      <div className="flex flex-wrap items-center gap-1.5 px-4 pb-4 pt-4">
        <TooltipProvider delayDuration={100}>
          {enabledSlots.map((s) => {
            const Icon = SPACE_ICON[s.key]
            return (
              <Tooltip key={s.key}>
                <TooltipTrigger asChild>
                  <span className="flex size-8 items-center justify-center rounded-md border border-border bg-surface-nested text-ink-muted">
                    <Icon size={15} />
                  </span>
                </TooltipTrigger>
                <TooltipContent>{s.label}</TooltipContent>
              </Tooltip>
            )
          })}
        </TooltipProvider>
      </div>
    </div>
  )
}

/* ── Overflow menu (Modifier / Dupliquer / Supprimer) ───────────────────── */
function CardMenu({
  onEdit,
  onDuplicate,
  onDelete,
}: {
  onEdit: () => void
  onDuplicate: () => void
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
    <div ref={ref} className="relative">
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
        <div className="absolute right-0 z-30 mt-1.5 w-[170px] overflow-hidden rounded-lg border border-border bg-surface py-1 shadow-deep">
          <MenuRow icon={Pencil} label="Modifier" onClick={() => run(onEdit)} />
          <MenuRow icon={Copy} label="Dupliquer" onClick={() => run(onDuplicate)} />
          <MenuRow
            icon={Trash2}
            label="Supprimer"
            danger
            onClick={() => run(onDelete)}
          />
        </div>
      ) : null}
    </div>
  )
}

function MenuRow({
  icon: Icon,
  label,
  onClick,
  danger,
}: {
  icon: typeof Pencil
  label: string
  onClick: () => void
  danger?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2.5 px-3.5 py-2 text-left font-body text-[0.82rem] transition-colors hover:bg-surface-hover",
        danger ? "text-danger" : "text-ink-subtle hover:text-ink",
      )}
    >
      <Icon size={15} className="shrink-0" />
      {label}
    </button>
  )
}

/* ── Stacked visibility split by tier ───────────────────────────────────── */
function RepartitionCard({ offers }: { offers: Offer[] }) {
  const total = pool(offers)
  const sorted = [...offers].sort((a, b) => b.points - a.points)

  return (
    <div className="mt-8 rounded-lg border border-border px-5 py-5">
      <h2 className="font-ui text-sm font-medium text-ink">
        Répartition de la visibilité
      </h2>

      {/* Single stacked bar */}
      <div className="mt-4 flex h-3.5 w-full overflow-hidden rounded-pill">
        {sorted.map((o) => {
          const w = total ? (o.points * o.seats) / total : 0
          return (
            <div
              key={o.id}
              title={`${o.name} · ${pct(w)}`}
              style={{ width: `${w * 100}%`, backgroundColor: o.color }}
            />
          )
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
        {sorted.map((o) => (
          <div key={o.id} className="flex items-center gap-2">
            <span
              className="size-2.5 rounded-full"
              style={{ backgroundColor: o.color }}
            />
            <span className="font-body text-[0.8rem] text-ink-subtle">
              {o.name}
            </span>
            <span className="font-body text-[0.8rem] text-ink-muted tabular-nums">
              {pct(sharePerTier(o, offers))}
            </span>
          </div>
        ))}
      </div>

      <p className="mt-4 font-body text-[0.74rem] leading-snug text-ink-disabled">
        Cette répartition s'applique aux espaces en rotation (calendrier, liste
        des matchs, pages de match et de séances). Les notifications et la
        messagerie se règlent séparément, en nombre d'envois par jour.
      </p>
    </div>
  )
}
