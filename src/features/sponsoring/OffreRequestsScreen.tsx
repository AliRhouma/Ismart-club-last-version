import { useEffect, useMemo, useRef, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import {
  Check,
  X,
  Mail,
  Phone,
  CalendarClock,
  Bell,
  MessageSquare,
  MessageSquareQuote,
  Users,
  Layers,
  Pencil,
  Inbox,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { useData } from "@/data/useData"
import { SPACE_BY_KEY } from "@/data/seed/sponsoring"
import {
  AUDIENCE_LABEL,
  durationLabel,
  type OfferRequest,
} from "@/data/seed/offerRequests"
import { PageHeader } from "@/components/kit/PageHeader"
import { BackButton } from "@/components/kit/BackButton"
import { Avatar } from "@/components/kit/Avatar"
import { Badge } from "@/components/kit/Badge"
import { EmptyState } from "@/components/kit/EmptyState"
import { Stat } from "@/features/budget/ui"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"

const inputCls =
  "w-full rounded-md border border-input bg-transparent px-3.5 py-2.5 font-body text-sm text-ink outline-none transition-colors placeholder:text-ink-disabled focus:border-border-focus"

const STATUS: Record<
  OfferRequest["status"],
  { label: string; variant: "warning" | "success" | "danger" | "info" }
> = {
  en_attente: { label: "En attente", variant: "warning" },
  acceptee: { label: "Acceptée", variant: "success" },
  refusee: { label: "Refusée", variant: "danger" },
  contre_proposee: { label: "Contre-proposition", variant: "info" },
}

/**
 * Sponsoring ▸ Demandes — the admin's inbox of custom offer requests sent by
 * sponsors from a club's public offers page. Each card carries the sender's
 * contact and the exact visibility asked for; a pending request can be accepted
 * (with a price the admin types in) or refused.
 *
 * Referenced OffresScreen (header actions, toast, card anatomy) and
 * PartnerFormModal (dialog) to stay on-brand.
 */
export function OffreRequestsScreen() {
  const navigate = useNavigate()
  const location = useLocation()
  const { offerRequests, updateOfferRequest } = useData()

  const [accepting, setAccepting] = useState<OfferRequest | null>(null)
  const [refusing, setRefusing] = useState<OfferRequest | null>(null)

  const [toast, setToast] = useState<{ id: number; msg: string } | null>(null)
  const toastId = useRef(0)
  const notify = (msg: string) => setToast({ id: toastId.current++, msg })
  // Toast handed over from the counter-proposal editor via navigation state.
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

  const sorted = useMemo(() => {
    const rank: Record<OfferRequest["status"], number> = {
      en_attente: 0,
      contre_proposee: 1,
      acceptee: 2,
      refusee: 3,
    }
    return [...offerRequests].sort((a, b) => rank[a.status] - rank[b.status])
  }, [offerRequests])

  const pending = offerRequests.filter((r) => r.status === "en_attente").length
  const accepted = offerRequests.filter((r) => r.status === "acceptee").length

  return (
    <>
      <BackButton to="/sponsoring/offres" label="Retour aux offres" />
      <PageHeader
        title="Demandes sur mesure"
        subtitle="Les propositions de sponsoring envoyées par les annonceurs. Acceptez-les en fixant un tarif, ou refusez-les."
      />

      {/* Summary strip */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat label="En attente" value={pending} />
        <Stat label="Acceptées" value={accepted} />
        <Stat label="Total reçues" value={offerRequests.length} />
      </div>

      {offerRequests.length === 0 ? (
        <div className="mt-6 rounded-lg border border-border">
          <EmptyState
            icon={Inbox}
            title="Aucune demande pour le moment"
            description="Les demandes d'offres sur mesure envoyées par les sponsors apparaîtront ici."
          />
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-4">
          {sorted.map((req) => (
            <RequestCard
              key={req.id}
              request={req}
              onAccept={() => setAccepting(req)}
              onModify={() =>
                navigate(`/sponsoring/demandes-sur-mesure/${req.id}/modifier`)
              }
              onRefuse={() => setRefusing(req)}
            />
          ))}
        </div>
      )}

      {/* ── Accept (set price) ────────────────────────────────────────────── */}
      {accepting ? (
        <AcceptModal
          request={accepting}
          onClose={() => setAccepting(null)}
          onConfirm={(price) => {
            updateOfferRequest(accepting.id, { status: "acceptee", price })
            notify(`Demande de « ${accepting.company} » acceptée`)
            setAccepting(null)
          }}
        />
      ) : null}

      {/* ── Refuse (with a justification) ─────────────────────────────────── */}
      {refusing ? (
        <RefuseModal
          request={refusing}
          onClose={() => setRefusing(null)}
          onConfirm={(note) => {
            updateOfferRequest(refusing.id, {
              status: "refusee",
              price: null,
              decisionNote: note,
            })
            notify(`Demande de « ${refusing.company} » refusée`)
            setRefusing(null)
          }}
        />
      ) : null}

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

/* ── Request card ───────────────────────────────────────────────────────── */
function RequestCard({
  request: req,
  onAccept,
  onModify,
  onRefuse,
}: {
  request: OfferRequest
  onAccept: () => void
  onModify: () => void
  onRefuse: () => void
}) {
  const status = STATUS[req.status]
  const pending = req.status === "en_attente"

  return (
    <div className="rounded-lg border border-border transition-colors hover:border-border-strong">
      {/* Header — sender identity + status */}
      <div className="flex flex-wrap items-start justify-between gap-3 px-5 pt-5">
        <div className="flex items-start gap-3">
          <Avatar name={req.company} size="lg" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-ui text-[0.95rem] font-medium text-ink">
                {req.company}
              </h3>
              <Badge autoColor>{req.sector}</Badge>
            </div>
            <div className="mt-1 font-body text-[0.78rem] text-ink-muted">
              {req.contact}
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <Badge variant={status.variant} dot>
            {status.label}
          </Badge>
          <span className="font-body text-[0.72rem] text-ink-disabled">
            Reçue le {req.createdAt}
          </span>
        </div>
      </div>

      {/* Contact line */}
      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1.5 px-5">
        <a
          href={`mailto:${req.email}`}
          className="inline-flex items-center gap-1.5 font-body text-[0.78rem] text-info transition-opacity hover:opacity-80"
        >
          <Mail size={13} /> {req.email}
        </a>
        {req.phone ? (
          <span className="inline-flex items-center gap-1.5 font-body text-[0.78rem] text-ink-muted">
            <Phone size={13} className="text-ink-disabled" />
            <span className="font-mono text-[0.74rem]">{req.phone}</span>
          </span>
        ) : null}
      </div>

      {/* Configuration */}
      <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3.5 border-t border-border px-5 py-4 sm:grid-cols-4">
        <Fact icon={CalendarClock} label="Durée">
          {durationLabel(req.durationMonths)}
        </Fact>
        <Fact icon={Bell} label="Notifications">
          {req.notificationsPerDay > 0
            ? `${req.notificationsPerDay} / jour`
            : "Aucune"}
        </Fact>
        <Fact icon={MessageSquare} label="Messagerie">
          {req.messagesPerDay > 0 ? `${req.messagesPerDay} / jour` : "Aucun"}
        </Fact>
        <Fact icon={Users} label="Audience">
          {AUDIENCE_LABEL[req.audience]}
        </Fact>
      </div>

      {/* Banners + categories */}
      <div className="flex flex-col gap-3 px-5 pb-4">
        <div>
          <FactLabel icon={Layers}>Bannières demandées</FactLabel>
          {req.banners.length === 0 ? (
            <p className="mt-1.5 font-body text-[0.78rem] text-ink-disabled">
              Aucune bannière.
            </p>
          ) : (
            <div className="mt-2 flex flex-wrap gap-2">
              {req.banners.map((b) => (
                <span
                  key={b.key}
                  className="inline-flex items-center gap-1.5 rounded-pill border border-border bg-surface-nested px-2.5 py-1 font-body text-[0.74rem] text-ink-subtle"
                >
                  {SPACE_BY_KEY[b.key].label}
                  <span className="font-ui font-medium text-info tabular-nums">
                    {b.pct} %
                  </span>
                </span>
              ))}
            </div>
          )}
        </div>

        <div>
          <FactLabel icon={Layers}>Catégories ciblées</FactLabel>
          {req.categories.length === 0 ? (
            <p className="mt-1.5 font-body text-[0.78rem] text-ink-disabled">
              Toutes les catégories.
            </p>
          ) : (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {req.categories.map((c) => (
                <span
                  key={c}
                  className="inline-flex items-center rounded-pill border border-brand-blue-600/30 bg-brand-blue-600/10 px-2.5 py-0.5 font-body text-[0.72rem] text-brand-blue-600"
                >
                  {c}
                </span>
              ))}
            </div>
          )}
        </div>

        {req.message ? (
          <p className="rounded-md border border-border bg-surface-nested px-3.5 py-2.5 font-body text-[0.78rem] leading-relaxed text-ink-muted">
            « {req.message} »
          </p>
        ) : null}

        {/* Admin's reply — justification (refusal) or note (counter-proposal) */}
        {req.decisionNote ? (
          <div
            className={cn(
              "flex items-start gap-2.5 rounded-md border px-3.5 py-2.5",
              req.status === "refusee"
                ? "border-danger/25 bg-danger/5"
                : "border-brand-blue-600/25 bg-brand-blue-600/5",
            )}
          >
            <MessageSquareQuote
              size={15}
              className={cn(
                "mt-0.5 shrink-0",
                req.status === "refusee" ? "text-danger" : "text-brand-blue-600",
              )}
            />
            <div className="min-w-0">
              <span className="font-ui text-[0.64rem] font-medium tracking-[0.08em] text-ink-disabled uppercase">
                Réponse du club
              </span>
              <p className="mt-0.5 font-body text-[0.78rem] leading-relaxed text-ink-subtle">
                {req.decisionNote}
              </p>
            </div>
          </div>
        ) : null}
      </div>

      {/* Footer — decision */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-3.5">
        {req.status === "acceptee" ? (
          <span className="font-body text-[0.82rem] text-ink-muted">
            Tarif fixé :{" "}
            <span className="font-ui font-medium text-success tabular-nums">
              {req.price?.toLocaleString("fr-FR")} DT
            </span>
          </span>
        ) : req.status === "refusee" ? (
          <span className="font-body text-[0.82rem] text-ink-disabled">
            Demande refusée
          </span>
        ) : req.status === "contre_proposee" ? (
          <span className="font-body text-[0.82rem] text-ink-muted">
            Contre-proposition envoyée
            {req.price != null ? (
              <>
                {" · "}
                <span className="font-ui font-medium text-brand-blue-600 tabular-nums">
                  {req.price.toLocaleString("fr-FR")} DT
                </span>
              </>
            ) : null}{" "}
            — en attente du sponsor.
          </span>
        ) : (
          <span className="font-body text-[0.82rem] text-ink-muted">
            À traiter — acceptez, ajustez ou refusez la demande.
          </span>
        )}

        {pending ? (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onRefuse}
              className="inline-flex items-center gap-1.5 rounded-md border border-input px-3.5 py-2 font-ui text-[0.82rem] font-medium text-ink transition-colors hover:border-danger/40 hover:bg-danger/5 hover:text-danger"
            >
              <X size={15} /> Refuser
            </button>
            <button
              type="button"
              onClick={onModify}
              className="inline-flex items-center gap-1.5 rounded-md border border-input px-3.5 py-2 font-ui text-[0.82rem] font-medium text-ink transition-colors hover:border-brand-blue-600/40 hover:bg-brand-blue-600/5 hover:text-brand-blue-600"
            >
              <Pencil size={15} /> Modifier la proposition
            </button>
            <button
              type="button"
              onClick={onAccept}
              className="inline-flex items-center gap-1.5 rounded-md bg-brand px-4 py-2 font-ui text-[0.82rem] font-medium text-ink-inverted shadow-glow transition-colors hover:bg-brand-dim"
            >
              <Check size={15} /> Accepter
            </button>
          </div>
        ) : null}
      </div>
    </div>
  )
}

function Fact({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Bell
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1">
      <FactLabel icon={Icon}>{label}</FactLabel>
      <span className="font-body text-[0.84rem] text-ink tabular-nums">
        {children}
      </span>
    </div>
  )
}

function FactLabel({
  icon: Icon,
  children,
}: {
  icon: typeof Bell
  children: React.ReactNode
}) {
  return (
    <span className="inline-flex items-center gap-1.5 font-ui text-[0.64rem] font-medium tracking-[0.08em] text-ink-disabled uppercase">
      <Icon size={12} /> {children}
    </span>
  )
}

/* ── Accept modal — set the price ──────────────────────────────────────────── */
function AcceptModal({
  request,
  onClose,
  onConfirm,
}: {
  request: OfferRequest
  onClose: () => void
  onConfirm: (price: number) => void
}) {
  const [price, setPrice] = useState<string>("")
  const value = Number(price)
  const valid = price.trim() !== "" && Number.isFinite(value) && value > 0

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="flex flex-col gap-0 overflow-hidden rounded-xl border-border bg-surface p-0 sm:max-w-[440px]"
      >
        <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div className="min-w-0">
            <DialogTitle className="font-ui text-base font-medium text-ink">
              Accepter la demande
            </DialogTitle>
            <DialogDescription className="mt-1.5 font-body text-[0.78rem] text-ink-muted">
              Fixez le tarif proposé à {request.company} pour{" "}
              {durationLabel(request.durationMonths).toLowerCase()}.
            </DialogDescription>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="flex size-[30px] shrink-0 items-center justify-center rounded-sm border border-border text-ink-disabled transition-colors hover:border-border-strong hover:text-ink"
          >
            <X size={15} />
          </button>
        </div>

        <div className="flex flex-col gap-2 px-5 py-5">
          <span className="font-ui text-[0.7rem] font-medium tracking-[0.06em] text-ink-muted uppercase">
            Tarif du partenariat
          </span>
          <div className="relative flex items-center">
            <input
              autoFocus
              type="number"
              min={0}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && valid) onConfirm(value)
              }}
              placeholder="0"
              className={cn(inputCls, "pr-14 text-right tabular-nums")}
            />
            <span className="pointer-events-none absolute right-3.5 font-body text-[0.8rem] text-ink-disabled">
              DT
            </span>
          </div>
          <span className="font-body text-[0.72rem] text-ink-disabled">
            Le sponsor sera recontacté avec ce montant.
          </span>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-3.5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-input px-4 py-2 font-ui text-sm font-medium text-ink transition-colors hover:border-border-strong hover:bg-accent"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={() => valid && onConfirm(value)}
            disabled={!valid}
            className="inline-flex items-center gap-1.5 rounded-md bg-brand px-5 py-2 font-ui text-sm font-medium text-ink-inverted shadow-glow transition-colors hover:bg-brand-dim disabled:cursor-not-allowed disabled:opacity-45"
          >
            <Check size={16} /> Accepter la demande
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/* ── Refuse modal — write the justification ────────────────────────────────── */
function RefuseModal({
  request,
  onClose,
  onConfirm,
}: {
  request: OfferRequest
  onClose: () => void
  onConfirm: (note: string) => void
}) {
  const [note, setNote] = useState("")
  const valid = note.trim() !== ""

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="flex flex-col gap-0 overflow-hidden rounded-xl border-border bg-surface p-0 sm:max-w-[460px]"
      >
        <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div className="min-w-0">
            <DialogTitle className="font-ui text-base font-medium text-ink">
              Refuser la demande
            </DialogTitle>
            <DialogDescription className="mt-1.5 font-body text-[0.78rem] text-ink-muted">
              Expliquez à {request.company} pourquoi cette demande ne peut pas
              être retenue.
            </DialogDescription>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="flex size-[30px] shrink-0 items-center justify-center rounded-sm border border-border text-ink-disabled transition-colors hover:border-border-strong hover:text-ink"
          >
            <X size={15} />
          </button>
        </div>

        <div className="flex flex-col gap-2 px-5 py-5">
          <span className="font-ui text-[0.7rem] font-medium tracking-[0.06em] text-ink-muted uppercase">
            Justification
          </span>
          <textarea
            autoFocus
            rows={4}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ex. : les espaces demandés sont déjà réservés cette saison, ou la fréquence de notifications dépasse notre limite pour préserver l'expérience des familles."
            className={cn(inputCls, "resize-none")}
          />
          <span className="font-body text-[0.72rem] text-ink-disabled">
            Ce message sera transmis au sponsor avec le refus.
          </span>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-3.5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-input px-4 py-2 font-ui text-sm font-medium text-ink transition-colors hover:border-border-strong hover:bg-accent"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={() => valid && onConfirm(note.trim())}
            disabled={!valid}
            className="inline-flex items-center gap-1.5 rounded-md bg-danger px-5 py-2 font-ui text-sm font-medium text-white transition-colors hover:bg-danger/90 disabled:cursor-not-allowed disabled:opacity-45"
          >
            <X size={16} /> Refuser la demande
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
