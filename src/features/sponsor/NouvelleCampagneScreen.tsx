import { useState, type ReactNode } from "react"
import { useNavigate } from "react-router-dom"
import {
  ArrowRight,
  Check,
  MapPin,
  CalendarRange,
  ChevronLeft,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { BackButton } from "@/components/kit/BackButton"
import { PageHeader } from "@/components/kit/PageHeader"
import { Avatar } from "@/components/kit/Avatar"
import { TierBadge, SectionTitle } from "@/features/sponsoring/ui"
import { TIER_COLOR, type Partnership } from "@/features/sponsor/mock"
import {
  blankDraft,
  slotsForTier,
  SELECTABLE_CLUBS,
  TIER_SLOTS,
  type CampaignDraft,
} from "@/features/sponsor/campagneMock"

const inputCls =
  "w-full rounded-md border border-input bg-transparent px-3.5 py-2.5 font-body text-sm text-ink outline-none transition-colors placeholder:text-ink-disabled focus:border-border-focus"

/**
 * Sponsor space — campaign request, in two steps on one page:
 *
 *   1. Le club — you can only run a campaign on a club that granted you an
 *      offer, so the club is picked first: it decides which ad spaces exist.
 *   2. La période — name and diffusion dates.
 *
 * "Continuer" hands the draft to the visuals step through the router's `state`.
 * Nothing is stored and no dates are computed — the fields are literal display
 * text; the sponsor sends the whole thing as a request the club then reviews.
 */
export function NouvelleCampagneScreen() {
  const navigate = useNavigate()
  const [step, setStep] = useState<1 | 2>(1)
  const [draft, setDraft] = useState<CampaignDraft>(blankDraft())

  const set = (patch: Partial<CampaignDraft>) =>
    setDraft((d) => ({ ...d, ...patch }))

  const pickClub = (club: Partnership) => {
    set({
      clubSlug: club.slug,
      club: club.club,
      tier: club.tier,
      slots: slotsForTier(club.tier),
    })
    setStep(2)
  }

  const ready = draft.name.trim() !== "" && draft.startDate && draft.endDate

  const create = () =>
    navigate("/sponsor/campagnes/nouvelle/visuels", { state: { draft } })

  return (
    <div className="mx-auto max-w-3xl">
      <BackButton to="/sponsor/campagnes" label="Retour aux campagnes" />
      <PageHeader
        title="Demande de campagne"
        subtitle="Choisissez le club et la période. Vous placerez vos visuels juste après, puis enverrez la demande au club."
      />

      <Steps step={step} />

      {step === 1 ? (
        <div className="mt-8">
          <SectionTitle hint={`${SELECTABLE_CLUBS.length} clubs`}>
            Sur quel club ?
          </SectionTitle>
          <p className="-mt-2 mb-4 font-body text-[0.8rem] text-ink-muted">
            Seuls les clubs qui vous ont attribué une offre apparaissent ici.
            L'offre détermine les espaces publicitaires disponibles.
          </p>

          <div className="flex flex-col gap-3">
            {SELECTABLE_CLUBS.map((club) => (
              <ClubRow key={club.id} club={club} onSelect={pickClub} />
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-8 flex flex-col gap-8">
          {/* The choice made in step 1, recapped and reversible. */}
          <div className="flex items-center justify-between gap-4 rounded-lg border border-border px-4 py-3.5">
            <div className="flex min-w-0 items-center gap-3">
              <Avatar name={draft.club} size="lg" />
              <div className="min-w-0">
                <div className="truncate font-body text-[0.88rem] text-ink">
                  {draft.club}
                </div>
                <div className="mt-0.5 font-body text-[0.72rem] text-ink-disabled">
                  {TIER_SLOTS[draft.tier].length} espaces publicitaires
                </div>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <TierBadge
                name={draft.tier}
                color={TIER_COLOR[draft.tier]}
                size="sm"
              />
              <button
                type="button"
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 font-ui text-[0.72rem] font-medium text-info transition-colors hover:bg-surface-hover"
              >
                <ChevronLeft size={12} /> Changer
              </button>
            </div>
          </div>

          <div>
            <SectionTitle>La campagne</SectionTitle>
            <div className="flex flex-col gap-5">
              <Field label="Nom de la campagne">
                <input
                  autoFocus
                  value={draft.name}
                  onChange={(e) => set({ name: e.target.value })}
                  placeholder="Campagne Été 2026"
                  className={inputCls}
                />
              </Field>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Début" hint="Premier jour de diffusion.">
                  <input
                    type="date"
                    value={draft.startDate}
                    onChange={(e) => set({ startDate: e.target.value })}
                    className={cn(inputCls, "[color-scheme:dark]")}
                  />
                </Field>
                <Field label="Fin" hint="Dernier jour de diffusion.">
                  <input
                    type="date"
                    value={draft.endDate}
                    onChange={(e) => set({ endDate: e.target.value })}
                    className={cn(inputCls, "[color-scheme:dark]")}
                  />
                </Field>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4 border-t border-border pt-5">
            <span className="font-body text-[0.76rem] text-ink-disabled">
              {ready
                ? "Étape suivante : placer vos visuels dans les espaces du club."
                : "Renseignez un nom et les deux dates pour continuer."}
            </span>
            <button
              type="button"
              disabled={!ready}
              onClick={create}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-brand px-4 py-2 font-ui text-sm font-medium text-ink-inverted shadow-glow transition-colors hover:bg-brand-dim disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none"
            >
              Continuer <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Step rail ──────────────────────────────────────────────────────────── */
function Steps({ step }: { step: 1 | 2 }) {
  const items = [
    { n: 1, label: "Le club" },
    { n: 2, label: "La période" },
    { n: 3, label: "Les visuels" },
  ]
  return (
    <div className="mt-6 flex items-center gap-3">
      {items.map((it, i) => (
        <div key={it.n} className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "flex size-6 items-center justify-center rounded-full border font-ui text-[0.68rem] tabular-nums transition-colors",
                it.n < step
                  ? "border-info/40 bg-info/10 text-info"
                  : it.n === step
                    ? "border-info bg-info text-ink-inverted"
                    : "border-border-strong text-ink-disabled",
              )}
            >
              {it.n < step ? <Check size={12} /> : it.n}
            </span>
            <span
              className={cn(
                "font-ui text-[0.78rem]",
                it.n === step ? "text-ink" : "text-ink-disabled",
              )}
            >
              {it.label}
            </span>
          </div>
          {i < items.length - 1 ? (
            <span className="h-px w-6 bg-border-strong" />
          ) : null}
        </div>
      ))}
    </div>
  )
}

/* ── Step 1 — one selectable club ───────────────────────────────────────── */
function ClubRow({
  club,
  onSelect,
}: {
  club: Partnership
  onSelect: (club: Partnership) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(club)}
      className="group relative flex items-center gap-4 overflow-hidden rounded-lg border border-border bg-background px-4 py-3.5 text-left transition-colors hover:border-border-strong"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 origin-top scale-y-0 bg-surface transition-transform duration-[260ms] ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:scale-y-100"
      />

      <div className="relative z-10 flex w-full items-center gap-4">
        <Avatar name={club.club} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="truncate font-body text-[0.9rem] text-ink transition-colors group-hover:text-brand-blue-600">
            {club.club}
          </div>
          <div className="mt-0.5 flex items-center gap-1.5 font-body text-[0.74rem] text-ink-disabled">
            <MapPin size={12} />
            {club.city}
            <span className="text-border-strong">·</span>
            <CalendarRange size={12} />
            {`jusqu'au ${club.expires}`}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className="hidden font-body text-[0.72rem] text-ink-muted sm:inline">
            {TIER_SLOTS[club.tier].length} espaces
          </span>
          <TierBadge name={club.tier} color={TIER_COLOR[club.tier]} size="sm" />
          <ArrowRight
            size={15}
            className="text-ink-disabled transition-colors group-hover:text-info"
          />
        </div>
      </div>
    </button>
  )
}

/* ── Field ──────────────────────────────────────────────────────────────── */
function Field({
  label,
  children,
  hint,
}: {
  label: string
  children: ReactNode
  hint?: string
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-ui text-[0.7rem] font-medium tracking-[0.06em] text-ink-muted uppercase">
        {label}
      </span>
      {children}
      {hint ? (
        <span className="font-body text-[0.72rem] leading-snug text-ink-disabled">
          {hint}
        </span>
      ) : null}
    </label>
  )
}
