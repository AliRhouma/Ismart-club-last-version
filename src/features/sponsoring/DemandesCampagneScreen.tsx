import { useState, type ReactNode } from "react"
import { useNavigate } from "react-router-dom"
import {
  ArrowLeft,
  Ban,
  Check,
  ChevronRight,
  Clock,
  Inbox,
  Layers,
  Link2,
  ImageIcon,
  Ruler,
  Send,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { type SlotKey } from "@/data/seed/sponsoring"
import { PageHeader } from "@/components/kit/PageHeader"
import { EmptyState } from "@/components/kit/EmptyState"
import { Avatar } from "@/components/kit/Avatar"
import { FormSheet } from "@/components/kit/FormSheet"
import { EmplacementCard } from "@/features/sponsoring/emplacementMocks"
import { SurfacePair } from "@/features/sponsoring/appSurfaces"
import {
  CAMPAIGN_REQUESTS,
  SLOT_DIMENSIONS,
  SLOT_SHARE,
  type CampaignRequest,
  type RequestSlot,
  type RequestStatus,
} from "@/features/sponsor/campagneMock"

/**
 * Sponsoring — "Demandes de campagne" (club / admin side).
 *
 * The inbox of campaigns sponsors have requested. The club opens a request,
 * reviews every visual and its resources across the six ad surfaces, then
 * approves or refuses it — a refusal carries a justification sent back to the
 * sponsor.
 *
 * Self-contained, like the rest of the sponsor mock: the requests live in local
 * state (seeded from CAMPAIGN_REQUESTS), so approving / refusing updates the
 * status live without a store. A drill-in `selected` view stands in for a
 * detail route so those local mutations stay reactive between list and detail.
 */
export function DemandesCampagneScreen() {
  const navigate = useNavigate()
  const [requests, setRequests] = useState<CampaignRequest[]>(CAMPAIGN_REQUESTS)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ id: number; msg: string } | null>(null)

  const notify = (msg: string) =>
    setToast({ id: (toast?.id ?? 0) + 1, msg })

  const selected = requests.find((r) => r.id === selectedId) ?? null

  const setStatus = (id: string, status: RequestStatus, justification?: string) =>
    setRequests((rs) =>
      rs.map((r) => (r.id === id ? { ...r, status, justification } : r)),
    )

  if (selected) {
    return (
      <RequestDetail
        request={selected}
        onBack={() => setSelectedId(null)}
        onApprove={() => {
          setStatus(selected.id, "approuvee")
          notify(`Demande de ${selected.sponsor} approuvée`)
        }}
        onRefuse={(justification) => {
          setStatus(selected.id, "refusee", justification)
          notify(`Demande de ${selected.sponsor} refusée`)
        }}
        toast={toast}
      />
    )
  }

  const pending = requests.filter((r) => r.status === "en_attente")
  const handled = requests.filter((r) => r.status !== "en_attente")

  return (
    <>
      <PageHeader
        title="Demandes de campagne"
        subtitle="Les campagnes que vos sponsors demandent à diffuser. Examinez leurs visuels, puis approuvez ou refusez."
        actions={
          <button
            type="button"
            onClick={() => navigate("/sponsoring/partenaires")}
            className="inline-flex items-center gap-1.5 rounded-md border border-input px-4 py-2 font-ui text-sm font-medium text-ink transition-colors hover:border-border-strong hover:bg-accent"
          >
            Partenaires
          </button>
        }
      />

      {requests.length === 0 ? (
        <div className="mt-6 rounded-lg border border-border">
          <EmptyState
            icon={Inbox}
            title="Aucune demande"
            description="Quand un sponsor demande une campagne, elle apparaît ici pour validation."
          />
        </div>
      ) : (
        <div className="mt-6 flex flex-col gap-8">
          <section>
            <SectionLabel
              icon={Clock}
              title="À examiner"
              count={pending.length}
            />
            {pending.length === 0 ? (
              <p className="mt-3 rounded-lg border border-dashed border-border px-4 py-6 text-center font-body text-[0.82rem] text-ink-disabled">
                Aucune demande en attente. Tout est traité.
              </p>
            ) : (
              <div className="mt-3 flex flex-col gap-3">
                {pending.map((r) => (
                  <RequestRow
                    key={r.id}
                    request={r}
                    onOpen={() => setSelectedId(r.id)}
                  />
                ))}
              </div>
            )}
          </section>

          {handled.length > 0 ? (
            <section>
              <SectionLabel
                icon={Check}
                title="Traitées"
                count={handled.length}
              />
              <div className="mt-3 flex flex-col gap-3">
                {handled.map((r) => (
                  <RequestRow
                    key={r.id}
                    request={r}
                    onOpen={() => setSelectedId(r.id)}
                  />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      )}

      {toast ? <Toast key={toast.id} msg={toast.msg} /> : null}
    </>
  )
}

/* ── List row ───────────────────────────────────────────────────────────── */
function RequestRow({
  request,
  onOpen,
}: {
  request: CampaignRequest
  onOpen: () => void
}) {
  const filled = request.slots.filter((s) => s.image !== "").length

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group relative flex items-center gap-4 overflow-hidden rounded-lg border border-border bg-background px-4 py-3.5 text-left transition-colors hover:border-border-strong"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 origin-top scale-y-0 bg-surface transition-transform duration-[260ms] ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:scale-y-100"
      />
      <div className="relative z-10 flex w-full items-center gap-4">
        <Avatar name={request.sponsor} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate font-body text-[0.9rem] text-ink transition-colors group-hover:text-brand-blue-600">
              {request.sponsor}
            </span>
            {/* The "en attente" state is already the section header — only the
                handled outcomes (approuvée / refusée) carry a pill here. */}
            {request.status !== "en_attente" ? (
              <StatusPill status={request.status} />
            ) : null}
          </div>
          <div className="mt-0.5 font-body text-[0.74rem] text-ink-subtle">
            Type de pack : {request.tier}
          </div>
          <div className="mt-0.5 truncate font-body text-[0.76rem] text-ink-muted">
            {request.name} · {request.period}
          </div>
          <div className="mt-1 flex items-center gap-2 font-body text-[0.72rem] text-ink-disabled">
            <Clock size={11} /> Envoyée le {request.submittedAt}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className="hidden items-center gap-1.5 font-body text-[0.72rem] text-ink-disabled sm:inline-flex">
            <Layers size={12} />
            {filled}/{request.slots.length} visuels
          </span>
          <ChevronRight
            size={16}
            className="text-ink-disabled transition-colors group-hover:text-info"
          />
        </div>
      </div>
    </button>
  )
}

/* ── Detail (review one request) ────────────────────────────────────────── */
function RequestDetail({
  request,
  onBack,
  onApprove,
  onRefuse,
  toast,
}: {
  request: CampaignRequest
  onBack: () => void
  onApprove: () => void
  onRefuse: (justification: string) => void
  toast: { id: number; msg: string } | null
}) {
  const [declining, setDeclining] = useState(false)
  const pending = request.status === "en_attente"
  const filled = request.slots.filter((s) => s.image !== "").length

  return (
    <div className="mx-auto max-w-5xl">
      <button
        type="button"
        onClick={onBack}
        aria-label="Retour aux demandes"
        title="Retour aux demandes"
        className="mb-4 inline-flex size-9 items-center justify-center rounded-md border border-border text-ink-muted transition-colors hover:border-[var(--border-hover)] hover:bg-accent hover:text-ink focus:border-border-focus"
      >
        <ArrowLeft size={16} />
      </button>

      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3.5">
          <Avatar name={request.sponsor} size="lg" />
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <span className="font-body text-[0.82rem] text-ink-subtle">
                Type de pack : <span className="text-ink">{request.tier}</span>
              </span>
              {request.status !== "en_attente" ? (
                <StatusPill status={request.status} />
              ) : null}
            </div>
            <h1 className="mt-2 font-ui text-2xl font-semibold text-ink">
              {request.name}
            </h1>
            <p className="mt-1 font-body text-sm text-ink-muted">
              {request.sponsor} · {request.sector}
            </p>
          </div>
        </div>

        {pending ? (
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => setDeclining(true)}
              className="inline-flex items-center gap-1.5 rounded-md border border-input px-4 py-2 font-ui text-sm font-medium text-danger transition-colors hover:border-danger/50 hover:bg-danger/5"
            >
              <Ban size={16} /> Refuser
            </button>
            <button
              type="button"
              onClick={onApprove}
              className="inline-flex items-center gap-1.5 rounded-md bg-brand px-4 py-2 font-ui text-sm font-medium text-ink-inverted shadow-glow transition-colors hover:bg-brand-dim"
            >
              <Check size={16} /> Approuver
            </button>
          </div>
        ) : null}
      </div>

      {/* ── Meta band ─────────────────────────────────────────────────── */}
      <div className="mt-7 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Meta label="Club">{request.club}</Meta>
        <Meta label="Période">{request.period}</Meta>
        <Meta label="Envoyée le">{request.submittedAt}</Meta>
        <Meta label="Visuels fournis">
          {filled}/{request.slots.length} espaces
        </Meta>
      </div>

      {/* ── Refusal justification (once refused) ──────────────────────── */}
      {request.status === "refusee" && request.justification ? (
        <div className="mt-6 flex items-start gap-3 rounded-lg border border-danger/30 bg-danger/5 px-4 py-3.5">
          <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-danger/10 text-danger">
            <Ban size={14} />
          </span>
          <div>
            <p className="font-ui text-[0.78rem] font-medium text-danger">
              Demande refusée — motif envoyé au sponsor
            </p>
            <p className="mt-1 font-body text-[0.82rem] leading-relaxed text-ink-subtle">
              {request.justification}
            </p>
          </div>
        </div>
      ) : null}

      {request.status === "approuvee" ? (
        <div className="mt-6 flex items-center gap-3 rounded-lg border border-success/30 bg-success/5 px-4 py-3.5">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-success/10 text-success">
            <Check size={14} />
          </span>
          <p className="font-body text-[0.82rem] text-ink-subtle">
            Demande approuvée — la campagne pourra être diffusée sur la période
            indiquée.
          </p>
        </div>
      ) : null}

      <p className="mt-7 font-body text-sm text-ink-muted">
        Chaque espace ci-dessous montre le visuel envoyé par le sponsor, sa
        ressource (fichier, lien) et la dimension attendue.
      </p>

      {/* ── The surfaces, read-only, in both versions ─────────────────── */}
      <div className="mt-5 flex flex-col gap-6">
        {request.slots.map((slot) => (
          <EmplacementCard
            key={slot.key}
            slotKey={slot.key}
            badge={<ShareBadge slotKey={slot.key} />}
            headerRight={<DimensionChip slotKey={slot.key} />}
            footer={<ResourceRow slot={slot} />}
          >
            <SurfacePair
              slotKey={slot.key}
              ad={
                slot.image || slot.headline
                  ? {
                      sponsor: request.sponsor,
                      color: request.color,
                      headline: slot.headline || slot.image,
                    }
                  : null
              }
            />
          </EmplacementCard>
        ))}
      </div>

      {/* ── Refusal justification modal ───────────────────────────────── */}
      <RefuseModal
        open={declining}
        onOpenChange={setDeclining}
        sponsor={request.sponsor}
        onRefuse={(justification) => {
          setDeclining(false)
          onRefuse(justification)
        }}
      />

      {toast ? <Toast key={toast.id} msg={toast.msg} /> : null}
    </div>
  )
}

/* ── Refusal modal — justification is required ──────────────────────────── */
function RefuseModal({
  open,
  onOpenChange,
  sponsor,
  onRefuse,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  sponsor: string
  onRefuse: (justification: string) => void
}) {
  const [reason, setReason] = useState("")

  return (
    <FormSheet
      open={open}
      onOpenChange={(next) => {
        if (!next) setReason("")
        onOpenChange(next)
      }}
      title="Refuser la demande"
      description={`Expliquez à ${sponsor} pourquoi la campagne ne peut pas être diffusée en l'état.`}
      submitLabel="Envoyer le refus"
      cancelLabel="Annuler"
      submitDisabled={reason.trim() === ""}
      onSubmit={() => {
        onRefuse(reason.trim())
        setReason("")
      }}
    >
      <label className="flex flex-col gap-1.5">
        <span className="font-ui text-[0.7rem] font-medium tracking-[0.06em] text-ink-muted uppercase">
          Motif du refus
        </span>
        <textarea
          autoFocus
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={4}
          placeholder="Ex. le visuel de la bannière calendrier ne respecte pas le format 1200 × 300 px."
          className="w-full resize-none rounded-md border border-input bg-transparent px-3.5 py-2.5 font-body text-sm text-ink outline-none transition-colors placeholder:text-ink-disabled focus:border-border-focus"
        />
        <span className="font-body text-[0.72rem] text-ink-disabled">
          Ce motif est envoyé au sponsor avec le refus.
        </span>
      </label>
    </FormSheet>
  )
}

/* ── Resource row under a slot's mock ───────────────────────────────────── */
function ResourceRow({ slot }: { slot: RequestSlot }) {
  if (slot.image === "") {
    return (
      <p className="font-body text-[0.72rem] text-ink-disabled">
        Espace laissé vide — aucun visuel fourni.
      </p>
    )
  }
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2.5 rounded-md border border-border bg-surface-nested px-3 py-2">
        <ImageIcon size={13} className="shrink-0 text-ink-disabled" />
        <span className="min-w-0 flex-1 truncate font-body text-[0.74rem] text-ink-subtle">
          {slot.image}
        </span>
      </div>
      <div className="flex items-center gap-2.5 rounded-md border border-border bg-surface-nested px-3 py-2">
        <Link2 size={13} className="shrink-0 text-ink-disabled" />
        <span className="min-w-0 flex-1 truncate font-mono text-[0.7rem] text-ink-subtle">
          {slot.link || "Aucun lien"}
        </span>
      </div>
    </div>
  )
}

/* ── Visibility percentage badge (replaces the allocation label) ────────── */
function ShareBadge({ slotKey }: { slotKey: SlotKey }) {
  return (
    <span
      title="Part de visibilité sur cet espace"
      className="inline-flex shrink-0 items-center rounded-pill border border-brand-blue-600/30 bg-brand-blue-600/10 px-2 py-0.5 font-ui text-[0.62rem] font-medium tracking-[0.04em] text-brand-blue-600 tabular-nums"
    >
      {SLOT_SHARE[slotKey]}
    </span>
  )
}

/* ── The dimension rule chip (card header) ──────────────────────────────── */
function DimensionChip({ slotKey }: { slotKey: SlotKey }) {
  return (
    <span
      title={`Dimension attendue : ${SLOT_DIMENSIONS[slotKey]}`}
      className="inline-flex items-center gap-1.5 rounded-sm border border-border bg-surface-nested px-2 py-1 font-body text-[0.68rem] whitespace-nowrap text-ink-muted"
    >
      <Ruler size={11} className="shrink-0 text-ink-disabled" />
      {SLOT_DIMENSIONS[slotKey]}
    </span>
  )
}

/* ── Section label ──────────────────────────────────────────────────────── */
function SectionLabel({
  icon: Icon,
  title,
  count,
}: {
  icon: typeof Clock
  title: string
  count: number
}) {
  return (
    <div className="flex items-center gap-2 border-b border-border pb-2">
      <Icon size={14} className="text-ink-muted" />
      <h2 className="font-ui text-[0.72rem] font-medium tracking-[0.1em] text-ink-muted uppercase">
        {title}
      </h2>
      <span className="rounded-pill bg-accent px-2 py-0.5 font-ui text-[0.66rem] font-medium text-ink-muted tabular-nums">
        {count}
      </span>
    </div>
  )
}

function Meta({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-border px-4 py-3">
      <div className="font-ui text-[0.6rem] font-medium tracking-[0.08em] text-ink-muted uppercase">
        {label}
      </div>
      <div className="mt-1 font-body text-[0.84rem] text-ink">{children}</div>
    </div>
  )
}

/* ── Status pill ────────────────────────────────────────────────────────── */
function StatusPill({ status }: { status: RequestStatus }) {
  const map = {
    en_attente: {
      label: "En attente",
      cls: "border-brand-blue-600/30 bg-brand-blue-600/10 text-brand-blue-600",
    },
    approuvee: {
      label: "Approuvée",
      cls: "border-success/25 bg-success/10 text-success",
    },
    refusee: {
      label: "Refusée",
      cls: "border-danger/30 bg-danger/10 text-danger",
    },
  }[status]

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-pill border px-2.5 py-0.5 font-ui text-[0.6rem] font-medium tracking-[0.06em] uppercase",
        map.cls,
      )}
    >
      {map.label}
    </span>
  )
}

/* ── Toast ──────────────────────────────────────────────────────────────── */
function Toast({ msg }: { msg: string }) {
  return (
    <div
      role="status"
      className="animate-toast-in fixed right-5 bottom-5 z-[120] flex items-center gap-2.5 rounded-md border border-success/30 bg-surface px-4 py-3 shadow-deep"
    >
      <span className="flex size-6 items-center justify-center rounded-full bg-success/15 text-success">
        <Send size={13} />
      </span>
      <span className="font-body text-[0.84rem] text-ink">{msg}</span>
    </div>
  )
}
