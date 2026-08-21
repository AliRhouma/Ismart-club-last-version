import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  Archive,
  ArrowRight,
  CalendarRange,
  Eye,
  FileDown,
  Inbox,
  Megaphone,
  MousePointerClick,
  Plus,
  Radio,
} from "lucide-react"

import { useData } from "@/data/useData"
import {
  campaignTotals,
  num,
  SLOT_BY_KEY,
  type Campaign,
  type Partner,
} from "@/data/seed/sponsoring"
import { EmptyState } from "@/components/kit/EmptyState"
import { Stat } from "@/features/budget/ui"
import { SponsoringShell } from "@/features/sponsoring/SponsoringShell"
import { SLOT_ICON, Toast } from "@/features/sponsoring/ui"
import { exportCampaignKpisPdf } from "@/features/sponsoring/campaignPdf"
import { CAMPAIGN_REQUESTS } from "@/features/sponsor/campagneMock"

/**
 * Sponsoring ▸ Campagnes (club / admin side). The whole club's campaigns in one
 * place — every partenaire's live and past campaigns, instead of one partner at
 * a time on their accueil.
 *
 * Two bands: "En diffusion" (the campaigns being served right now, the thing an
 * admin scans for) then "Archivées" (history, read for its numbers). A card
 * opens the campaign on its partenaire, so the visuals stay where they live.
 * References PartenaireAccueilScreen (the running/archive cards + section heads)
 * and OffresScreen (the stat strip) to stay in the same family.
 */
export function CampagnesScreen() {
  const navigate = useNavigate()
  const { campaigns, partners } = useData()

  const partnerById = useMemo(
    () => new Map<string, Partner>(partners.map((p) => [p.id, p])),
    [partners],
  )

  const active = campaigns.filter((c) => c.status === "en_cours")
  const archived = campaigns.filter((c) => c.status === "archivee")

  // Cumulative reach — display arithmetic, computed in render (never stored).
  const totalViews = campaigns.reduce(
    (s, c) => s + campaignTotals(c).views,
    0,
  )

  // Static indicator from the demandes seed, so the tab hints at what's waiting.
  const pendingRequests = CAMPAIGN_REQUESTS.filter(
    (r) => r.status === "en_attente",
  ).length

  const open = (c: Campaign) =>
    navigate(`/sponsoring/partenaires/${c.partnerId}/campagnes/${c.id}`)

  // Confirmation after an export — the download itself is silent otherwise.
  const [toast, setToast] = useState<string | null>(null)
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(t)
  }, [toast])

  const exportKpis = (c: Campaign) => {
    const file = exportCampaignKpisPdf(
      c,
      partnerById.get(c.partnerId)?.name ?? "Partenaire",
    )
    setToast(`KPIs exportés — ${file}`)
  }

  return (
    <SponsoringShell
      active="campagnes"
      subtitle="Les campagnes que vos partenaires diffusent dans les espaces du club."
      actions={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate("/sponsoring/demandes")}
            className="inline-flex items-center gap-1.5 rounded-md border border-input px-4 py-2 font-ui text-sm font-medium text-ink transition-colors hover:border-border-strong hover:bg-accent"
          >
            <Inbox size={16} /> Demandes de campagne
            {pendingRequests > 0 ? (
              <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-info/15 px-1.5 py-0.5 font-ui text-[0.68rem] font-medium text-info tabular-nums">
                {pendingRequests}
              </span>
            ) : null}
          </button>
          {/* The club doesn't have to wait for a sponsor's demande — it can
              run a campaign for a partenaire itself. */}
          <button
            type="button"
            onClick={() => navigate("/sponsoring/campagnes/nouvelle")}
            className="inline-flex items-center gap-1.5 rounded-md bg-brand px-4 py-2 font-ui text-sm font-medium text-ink-inverted shadow-glow transition-colors hover:bg-brand-dim"
          >
            <Plus size={16} /> Nouvelle campagne
          </button>
        </div>
      }
    >
      {campaigns.length === 0 ? (
        <div className="mt-6 rounded-lg border border-border">
          <EmptyState
            icon={Megaphone}
            title="Aucune campagne"
            description="Créez la campagne d'un partenaire, ou attendez sa demande. Elle apparaîtra ici — en diffusion, puis archivée avec ses vues et ses clics."
            action={
              <button
                type="button"
                onClick={() => navigate("/sponsoring/campagnes/nouvelle")}
                className="inline-flex items-center gap-1.5 rounded-md bg-brand px-4 py-2 font-ui text-sm font-medium text-ink-inverted shadow-glow transition-colors hover:bg-brand-dim"
              >
                <Plus size={16} /> Nouvelle campagne
              </button>
            }
          />
        </div>
      ) : (
        <>
          {/* Summary strip */}
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Stat label="En diffusion" value={active.length} />
            <Stat label="Archivées" value={archived.length} />
            <Stat label="Vues cumulées" value={num(totalViews)} />
          </div>

          {/* ── En diffusion ────────────────────────────────────────────── */}
          <section className="mt-8">
            <SectionHead
              icon={Radio}
              title="En diffusion"
              hint={active.length ? `${active.length} en cours` : undefined}
            />

            {active.length === 0 ? (
              <div className="mt-4 rounded-lg border border-dashed border-border-strong px-5 py-10 text-center">
                <p className="font-body text-[0.84rem] text-ink-muted">
                  Aucune campagne en cours.
                </p>
                <p className="mt-1 font-body text-[0.76rem] text-ink-disabled">
                  Les campagnes en diffusion de vos partenaires apparaîtront ici.
                </p>
                <button
                  type="button"
                  onClick={() => navigate("/sponsoring/campagnes/nouvelle")}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-sm px-2 py-1 font-ui text-[0.75rem] font-medium tracking-[0.04em] text-info uppercase transition-colors hover:bg-surface-hover"
                >
                  <Plus size={13} /> Créer une campagne
                </button>
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                {active.map((c) => (
                  <RunningCard
                    key={c.id}
                    campaign={c}
                    partner={partnerById.get(c.partnerId) ?? null}
                    onOpen={() => open(c)}
                  />
                ))}
              </div>
            )}
          </section>

          {/* ── Archivées ───────────────────────────────────────────────── */}
          {archived.length > 0 ? (
            <section className="mt-10">
              <SectionHead
                icon={Archive}
                title="Archivées"
                hint={`${archived.length} campagnes`}
              />
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {archived.map((c) => (
                  <ArchiveCard
                    key={c.id}
                    campaign={c}
                    partner={partnerById.get(c.partnerId) ?? null}
                    onOpen={() => open(c)}
                    onExport={() => exportKpis(c)}
                  />
                ))}
              </div>
            </section>
          ) : null}
        </>
      )}

      {toast ? <Toast msg={toast} /> : null}
    </SponsoringShell>
  )
}

/* ── Section heading (matches PartenaireAccueilScreen) ──────────────────── */
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

/* ── A live campaign — navigable card, partner-forward ──────────────────── */
function RunningCard({
  campaign,
  partner,
  onOpen,
}: {
  campaign: Campaign
  partner: Partner | null
  onOpen: () => void
}) {
  return (
    <div className="group relative overflow-hidden rounded-lg border border-border bg-background transition-colors hover:border-border-strong">
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
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-pill border border-success/25 bg-success/10 px-2.5 py-0.5 font-ui text-[0.62rem] font-medium tracking-[0.06em] text-success uppercase">
                <span className="size-1.5 rounded-full bg-success" />
                En diffusion
              </span>
              <span
                className="size-2.5 rounded-full"
                style={{ backgroundColor: campaign.color }}
              />
            </div>
            <h3 className="mt-2.5 font-ui text-lg font-medium text-ink transition-colors group-hover:text-brand-blue-600">
              {campaign.name}
            </h3>
            <p className="mt-1 font-body text-[0.78rem] text-ink-muted">
              {partner?.name ?? "Partenaire"}
            </p>
          </div>
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
          <ArrowRight
            size={15}
            className="ml-auto text-ink-disabled transition-colors group-hover:text-brand-blue-600"
          />
        </div>
      </button>
    </div>
  )
}

/* ── An archived campaign — quieter, stats-forward ──────────────────────── */
function ArchiveCard({
  campaign,
  partner,
  onOpen,
  onExport,
}: {
  campaign: Campaign
  partner: Partner | null
  onOpen: () => void
  onExport: () => void
}) {
  const totals = campaignTotals(campaign)

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-lg border border-border bg-background transition-colors hover:border-border-strong">
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 origin-top scale-y-0 bg-surface transition-transform duration-[260ms] ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:scale-y-100"
      />

      <button
        type="button"
        onClick={onOpen}
        className="relative z-10 flex flex-1 flex-col px-4 pt-4 pb-3 text-left"
      >
        <div className="flex items-start justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-pill border border-border bg-accent px-2.5 py-0.5 font-ui text-[0.6rem] font-medium tracking-[0.06em] text-ink-muted uppercase">
            <Archive size={10} />
            Archivée
          </span>
          <span
            className="mt-1 size-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: campaign.color }}
          />
        </div>

        <h3 className="mt-3 font-ui text-[0.95rem] font-medium text-ink transition-colors group-hover:text-brand-blue-600">
          {campaign.name}
        </h3>
        <p className="mt-1 font-body text-[0.74rem] text-ink-subtle">
          {partner?.name ?? "Partenaire"}
        </p>
        <p className="mt-0.5 font-body text-[0.72rem] text-ink-muted">
          {campaign.startDate} → {campaign.endDate}
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

        <div className="mt-3 flex items-center justify-between">
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
      </button>

      {/* Sortir le bilan sans ouvrir la campagne — l'action qu'on répète en
          fin de saison, une ligne par archive. */}
      <div className="relative z-10 border-t border-border px-4 py-2">
        <button
          type="button"
          onClick={onExport}
          className="inline-flex items-center gap-1.5 rounded-sm px-1.5 py-1 font-ui text-[0.7rem] font-medium tracking-[0.04em] text-info uppercase transition-colors hover:bg-surface-hover"
        >
          <FileDown size={13} /> Exporter les KPIs (PDF)
        </button>
      </div>
    </div>
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
    <div className="rounded-md border border-border px-2.5 py-2">
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
