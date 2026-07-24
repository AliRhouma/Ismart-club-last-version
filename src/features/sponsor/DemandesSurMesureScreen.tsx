import { useEffect, useMemo, useRef, useState } from "react"
import { Link } from "react-router-dom"
import {
  Bell,
  CalendarClock,
  Check,
  Clock,
  Inbox,
  Layers,
  MessageSquare,
  MessageSquareQuote,
  Search,
  Users,
  X,
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
import { Avatar } from "@/components/kit/Avatar"
import { Badge } from "@/components/kit/Badge"
import { EmptyState } from "@/components/kit/EmptyState"
import { Stat } from "@/features/budget/ui"

/**
 * Sponsor space — "Mes demandes". After sending an offre sur mesure to a club,
 * the sponsor follows it here: the club can accept it (a price appears), refuse
 * it (with a reason), or send back an adjusted counter-proposal the sponsor then
 * accepts or declines.
 *
 * Reads the same offerRequests store the admin writes to, filtered to the
 * signed-in sponsor's company — so a decision made on the club side shows up
 * here live. Referenced the admin OffreRequestsScreen (card anatomy, status map,
 * config facts) so both sides of the deal read the same.
 */
const STATUS: Record<
  OfferRequest["status"],
  { label: string; variant: "warning" | "success" | "danger" | "info" }
> = {
  en_attente: { label: "En attente de réponse", variant: "warning" },
  acceptee: { label: "Acceptée", variant: "success" },
  refusee: { label: "Refusée", variant: "danger" },
  contre_proposee: { label: "Mise à jour proposée", variant: "info" },
}

export function DemandesSurMesureScreen() {
  const { offerRequests, updateOfferRequest, session, sponsorAccounts } =
    useData()

  const company = useMemo(() => {
    const account = sponsorAccounts.find((a) => a.id === session?.accountId)
    return account?.company ?? session?.subtitle ?? ""
  }, [sponsorAccounts, session])

  const mine = useMemo(
    () => offerRequests.filter((r) => r.company === company),
    [offerRequests, company],
  )

  const [toast, setToast] = useState<{ id: number; msg: string } | null>(null)
  const toastId = useRef(0)
  const notify = (msg: string) => setToast({ id: toastId.current++, msg })
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2600)
    return () => clearTimeout(t)
  }, [toast])

  const sorted = useMemo(() => {
    const rank: Record<OfferRequest["status"], number> = {
      contre_proposee: 0,
      en_attente: 1,
      acceptee: 2,
      refusee: 3,
    }
    return [...mine].sort((a, b) => rank[a.status] - rank[b.status])
  }, [mine])

  const waiting = mine.filter(
    (r) => r.status === "en_attente" || r.status === "contre_proposee",
  ).length
  const accepted = mine.filter((r) => r.status === "acceptee").length

  return (
    <>
      <PageHeader
        title="Mes demandes"
        subtitle="Le suivi de vos offres sur mesure : acceptées, refusées ou ajustées par le club."
        actions={
          <Link
            to="/sponsor/explorer"
            className="inline-flex items-center gap-1.5 rounded-md border border-input px-4 py-2 font-ui text-sm font-medium text-ink transition-colors hover:border-border-strong hover:bg-accent"
          >
            <Search size={16} /> Trouver un partenaire
          </Link>
        }
      />

      {/* Summary strip */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Stat label="En cours" value={waiting} />
        <Stat label="Acceptées" value={accepted} />
        <Stat label="Total envoyées" value={mine.length} />
      </div>

      {mine.length === 0 ? (
        <div className="mt-6 rounded-lg border border-border">
          <EmptyState
            icon={Inbox}
            title="Aucune demande sur mesure"
            description="Composez une offre sur mesure depuis la page d'un club pour la suivre ici."
            action={
              <Link
                to="/sponsor/explorer"
                className="inline-flex items-center gap-1.5 rounded-md bg-brand px-4 py-2 font-ui text-sm font-medium text-ink-inverted shadow-glow transition-colors hover:bg-brand-dim"
              >
                <Search size={16} /> Trouver un partenaire
              </Link>
            }
          />
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-4">
          {sorted.map((req) => (
            <RequestCard
              key={req.id}
              request={req}
              onAcceptCounter={() => {
                updateOfferRequest(req.id, { status: "acceptee" })
                notify(`Proposition de ${req.clubName} acceptée`)
              }}
              onDeclineCounter={() => {
                updateOfferRequest(req.id, {
                  status: "refusee",
                  price: null,
                  decisionNote:
                    "Proposition déclinée par le sponsor.",
                })
                notify(`Proposition de ${req.clubName} déclinée`)
              }}
            />
          ))}
        </div>
      )}

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
  onAcceptCounter,
  onDeclineCounter,
}: {
  request: OfferRequest
  onAcceptCounter: () => void
  onDeclineCounter: () => void
}) {
  const status = STATUS[req.status]
  const counter = req.status === "contre_proposee"

  return (
    <div className="rounded-lg border border-border transition-colors hover:border-border-strong">
      {/* Header — club + status */}
      <div className="flex flex-wrap items-start justify-between gap-3 px-5 pt-5">
        <div className="flex items-start gap-3">
          <Avatar name={req.clubName} size="lg" />
          <div className="min-w-0">
            <h3 className="font-ui text-[0.95rem] font-medium text-ink">
              {req.clubName}
            </h3>
            <div className="mt-1 font-body text-[0.78rem] text-ink-muted">
              Offre sur mesure · {durationLabel(req.durationMonths)}
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <Badge variant={status.variant} dot>
            {status.label}
          </Badge>
          <span className="inline-flex items-center gap-1.5 font-body text-[0.72rem] text-ink-disabled">
            <Clock size={11} /> Envoyée le {req.createdAt}
          </span>
        </div>
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

      {/* Banners */}
      <div className="px-5 pb-4">
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

        {/* Club's reply — reason (refusal) or note (counter-proposal) */}
        {req.decisionNote ? (
          <div
            className={cn(
              "mt-4 flex items-start gap-2.5 rounded-md border px-3.5 py-2.5",
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

      {/* Footer — outcome + (for a counter-proposal) the sponsor's decision */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-3.5">
        {req.status === "acceptee" ? (
          <span className="font-body text-[0.82rem] text-ink-muted">
            Tarif accepté :{" "}
            <span className="font-ui font-medium text-success tabular-nums">
              {req.price?.toLocaleString("fr-FR")} DT
            </span>
          </span>
        ) : req.status === "refusee" ? (
          <span className="font-body text-[0.82rem] text-ink-disabled">
            Demande refusée par le club
          </span>
        ) : counter ? (
          <span className="font-body text-[0.82rem] text-ink-muted">
            Nouveau tarif proposé
            {req.price != null ? (
              <>
                {" · "}
                <span className="font-ui font-medium text-brand-blue-600 tabular-nums">
                  {req.price.toLocaleString("fr-FR")} DT
                </span>
              </>
            ) : null}
          </span>
        ) : (
          <span className="font-body text-[0.82rem] text-ink-muted">
            En attente de la réponse du club.
          </span>
        )}

        {counter ? (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onDeclineCounter}
              className="inline-flex items-center gap-1.5 rounded-md border border-input px-3.5 py-2 font-ui text-[0.82rem] font-medium text-ink transition-colors hover:border-danger/40 hover:bg-danger/5 hover:text-danger"
            >
              <X size={15} /> Décliner
            </button>
            <button
              type="button"
              onClick={onAcceptCounter}
              className="inline-flex items-center gap-1.5 rounded-md bg-brand px-4 py-2 font-ui text-[0.82rem] font-medium text-ink-inverted shadow-glow transition-colors hover:bg-brand-dim"
            >
              <Check size={15} /> Accepter la proposition
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
