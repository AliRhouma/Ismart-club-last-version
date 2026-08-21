import { Navigate, useNavigate, useParams } from "react-router-dom"
import {
  Archive,
  ArrowRight,
  CalendarRange,
  Eye,
  Link2,
  Link2Off,
  Megaphone,
  MousePointerClick,
  Plus,
  Radio,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { fmtFrLong } from "@/lib/format"
import { useData } from "@/data/useData"
import {
  campaignTotals,
  contractSpan,
  num,
  SLOT_BY_KEY,
  type Campaign,
} from "@/data/seed/sponsoring"
import { EmptyState } from "@/components/kit/EmptyState"
import { BackButton } from "@/components/kit/BackButton"
import { Avatar } from "@/components/kit/Avatar"
import { SLOT_ICON } from "@/features/sponsoring/ui"

/**
 * Screen — a partenaire's accueil. The one question it answers: what is this
 * sponsor running right now, and what did the past campaigns do?
 *
 * So the live campaign gets a single wide card at the top (the primary object on
 * the page), and the archives sit below as a quieter grid of navigable cards —
 * they're history, and history is read, not acted on.
 * References OffresScreen (cards/stats) and DocumentsScreen (navigable card with
 * the fluid hover fill).
 */
export function PartenaireAccueilScreen() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { partners, offers, sponsorAccounts, campaigns } = useData()

  const partner = partners.find((p) => p.id === id) ?? null
  if (!partner) return <Navigate to="/sponsoring/partenaires" replace />

  const offer = offers.find((o) => o.id === partner.offerId) ?? null
  const account = partner.accountId
    ? sponsorAccounts.find((a) => a.id === partner.accountId) ?? null
    : null

  const contract = contractSpan(partner.startDate, partner.endDate)

  const mine = campaigns.filter((c) => c.partnerId === partner.id)
  const running = mine.find((c) => c.status === "en_cours") ?? null
  const archived = mine.filter((c) => c.status === "archivee")

  return (
    <div className="mx-auto max-w-5xl">
      <BackButton to="/sponsoring/partenaires" label="Retour aux partenaires" />

      {/* ── Identity header ───────────────────────────────────────────── */}
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          {/* Même pastille que dans la table : la couleur cercle l'avatar. */}
          <span
            className="shrink-0 rounded-pill border-2 p-[3px]"
            style={{ borderColor: partner.color }}
          >
            <Avatar name={partner.name} size="lg" />
          </span>
          <div className="min-w-0">
            <h1 className="font-ui text-2xl font-semibold text-ink">
              {partner.name}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {offer ? (
                <span className="font-body text-[0.78rem] text-ink-muted">
                  {offer.name}
                </span>
              ) : null}
              {account ? (
                <span className="inline-flex items-center gap-1.5 rounded-pill border border-brand-blue-600/30 bg-brand-blue-600/10 px-2.5 py-1 font-ui text-[0.7rem] font-medium text-brand-blue-600">
                  <Link2 size={12} />
                  Compte {account.company}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-pill border border-border px-2.5 py-1 font-ui text-[0.7rem] font-medium text-ink-disabled">
                  <Link2Off size={12} />
                  Aucun compte rattaché
                </span>
              )}
            </div>
            {/* Le contrat : la date en neutre, l'échéance en couleur. */}
            {contract ? (
              <p className="mt-2.5 flex flex-wrap items-center gap-1.5 font-body text-[0.78rem] text-ink-muted">
                <CalendarRange size={13} className="text-ink-disabled" />
                Du {fmtFrLong(partner.startDate)} au{" "}
                {fmtFrLong(partner.endDate)}
                <span
                  className={cn(
                    "text-ink-disabled",
                    contract.tone === "over" && "text-danger",
                    contract.tone === "soon" && "text-warning",
                  )}
                >
                  · {contract.status}
                </span>
              </p>
            ) : null}

            {partner.description ? (
              <p className="mt-3 max-w-xl font-body text-sm leading-relaxed text-ink-muted">
                {partner.description}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      {/* ── Campagne en cours ─────────────────────────────────────────── */}
      <section className="mt-9">
        <SectionHead
          icon={Radio}
          title="Campagne en cours"
          hint={running ? running.remaining : undefined}
        />

        {running ? (
          <RunningCard
            campaign={running}
            partnerName={partner.name}
            onOpen={() =>
              navigate(`/sponsoring/partenaires/${partner.id}/campagnes/${running.id}`)
            }
          />
        ) : (
          <div className="mt-4 rounded-lg border border-border">
            <EmptyState
              icon={Megaphone}
              title="Aucune campagne en cours"
              description={`${partner.name} n'a rien en diffusion. Ses espaces publicitaires restent vides tant qu'une campagne n'est pas lancée.`}
              action={
                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      `/sponsoring/campagnes/nouvelle?partenaire=${partner.id}`,
                    )
                  }
                  className="inline-flex items-center gap-1.5 rounded-md bg-brand px-4 py-2 font-ui text-sm font-medium text-ink-inverted shadow-glow transition-colors hover:bg-brand-dim"
                >
                  <Plus size={16} /> Créer une campagne
                </button>
              }
            />
          </div>
        )}
      </section>

      {/* ── Archives ──────────────────────────────────────────────────── */}
      <section className="mt-10">
        <SectionHead
          icon={Archive}
          title="Campagnes archivées"
          hint={archived.length ? `${archived.length} campagnes` : undefined}
        />

        {archived.length === 0 ? (
          <div className="mt-4 rounded-lg border border-dashed border-border-strong px-5 py-10 text-center">
            <p className="font-body text-[0.84rem] text-ink-muted">
              Pas encore d'archive.
            </p>
            <p className="mt-1 font-body text-[0.76rem] text-ink-disabled">
              Les campagnes terminées viendront ici avec leurs vues et leurs clics.
            </p>
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {archived.map((c) => (
              <ArchiveCard
                key={c.id}
                campaign={c}
                onOpen={() =>
                  navigate(`/sponsoring/partenaires/${partner.id}/campagnes/${c.id}`)
                }
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

/* ── Section heading ────────────────────────────────────────────────────── */
function SectionHead({
  icon: Icon,
  title,
  hint,
}: {
  icon: typeof Radio
  title: string
  hint?: string
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border pb-2.5">
      <div className="flex items-center gap-2">
        <Icon size={14} className="text-ink-muted" />
        <h2 className="font-ui text-[0.72rem] font-medium tracking-[0.1em] text-ink-muted uppercase">
          {title}
        </h2>
      </div>
      {hint ? (
        <span className="font-body text-[0.74rem] text-ink-disabled">{hint}</span>
      ) : null}
    </div>
  )
}

/* ── The live campaign — one wide card, the page's primary object ───────── */
function RunningCard({
  campaign,
  partnerName,
  onOpen,
}: {
  campaign: Campaign
  partnerName: string
  onOpen: () => void
}) {
  return (
    <div className="group relative mt-4 overflow-hidden rounded-lg border border-border bg-background transition-colors hover:border-border-strong">
      {/* fluid fill: surface descends top→bottom on hover (design-system) */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 origin-top scale-y-0 bg-surface transition-transform duration-[260ms] ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:scale-y-100"
      />

      <button
        type="button"
        onClick={onOpen}
        className="relative z-10 w-full px-5 py-5 text-left"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-ui text-lg font-medium text-ink transition-colors group-hover:text-brand-blue-600">
              {campaign.name}
            </h3>
          </div>

          <span className="inline-flex items-center gap-1.5 font-ui text-[0.78rem] font-medium text-info">
            Gérer les visuels
            <ArrowRight size={14} />
          </span>
        </div>

        {/* Dates + progress */}
        <div className="mt-5">
          <div className="flex items-center justify-between font-body text-[0.76rem] text-ink-muted">
            <span className="inline-flex items-center gap-1.5">
              <CalendarRange size={13} className="text-ink-disabled" />
              {campaign.startDate} → {campaign.endDate}
            </span>
            <span className="tabular-nums">{campaign.remaining}</span>
          </div>
          <div className="mt-2 h-[6px] overflow-hidden rounded bg-accent">
            <div
              className="h-full rounded bg-info"
              style={{ width: `${campaign.progress}%` }}
            />
          </div>
          <div className="mt-1.5 font-body text-[0.7rem] text-ink-disabled">
            {campaign.duration}
          </div>
        </div>

        {/* Slots in play */}
        <div className="mt-5 flex flex-wrap items-center gap-1.5 border-t border-border pt-4">
          <span className="mr-1 font-body text-[0.74rem] text-ink-muted">
            {campaign.slots.length} espaces actifs
            {campaign.price !== null
              ? ` · ${campaign.price.toLocaleString("fr-FR")} DT`
              : ""}
          </span>
          {campaign.slots.map((s) => {
            const Icon = SLOT_ICON[s.key]
            return (
              <span
                key={s.key}
                title={SLOT_BY_KEY[s.key].label}
                className="flex size-7 items-center justify-center rounded-md border border-border bg-surface-nested text-ink-muted"
              >
                <Icon size={13} />
              </span>
            )
          })}
        </div>
      </button>

      <span className="sr-only">Campagne de {partnerName}</span>
    </div>
  )
}

/* ── An archived campaign — quieter, stats-forward, navigable ───────────── */
function ArchiveCard({
  campaign,
  onOpen,
}: {
  campaign: Campaign
  onOpen: () => void
}) {
  const totals = campaignTotals(campaign)

  return (
    <button
      type="button"
      onClick={onOpen}
      className="group relative flex flex-col overflow-hidden rounded-lg border border-border bg-background text-left transition-colors hover:border-border-strong"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 origin-top scale-y-0 bg-surface transition-transform duration-[260ms] ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:scale-y-100"
      />

      <div className="relative z-10 flex flex-1 flex-col px-4 py-4">
        <h3 className="font-ui text-[0.95rem] font-medium text-ink transition-colors group-hover:text-brand-blue-600">
          {campaign.name}
        </h3>
        <p className="mt-1 font-body text-[0.72rem] text-ink-muted">
          {campaign.startDate} → {campaign.endDate}
        </p>
        <p className="mt-0.5 font-body text-[0.7rem] text-ink-disabled">
          {campaign.duration}
        </p>

        {/* Numbers — the reason you open an archive */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <MiniStat icon={Eye} label="Vues" value={num(totals.views)} />
          <MiniStat
            icon={MousePointerClick}
            label="Clics"
            value={num(totals.clicks)}
          />
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
          <span className="font-body text-[0.72rem] text-ink-muted">
            {campaign.slots.length} espaces · CTR {totals.ctr}
            {campaign.price !== null
              ? ` · ${campaign.price.toLocaleString("fr-FR")} DT`
              : ""}
          </span>
          <ArrowRight
            size={14}
            className="text-ink-disabled transition-colors group-hover:text-brand-blue-600"
          />
        </div>
      </div>
    </button>
  )
}

function MiniStat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Eye
  label: string
  value: string
}) {
  return (
    <div className={cn("rounded-md border border-border px-2.5 py-2")}>
      <div className="flex items-center gap-1.5">
        <Icon size={10} className="text-ink-disabled" />
        <span className="font-ui text-[0.58rem] font-medium tracking-[0.06em] text-ink-muted uppercase">
          {label}
        </span>
      </div>
      <div className="mt-0.5 font-display text-[1rem] font-semibold text-ink tabular-nums">
        {value}
      </div>
    </div>
  )
}
