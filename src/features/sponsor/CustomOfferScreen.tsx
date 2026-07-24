import { useMemo, useState, type ReactNode } from "react"
import { useNavigate, useParams } from "react-router-dom"
import {
  Check,
  Send,
  AlertTriangle,
  CalendarClock,
  Bell,
  Inbox,
  MessageSquare,
  Users,
  Sparkles,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { useData } from "@/data/useData"
import { CLUB_LISTINGS } from "@/features/sponsor/mock"
import { SPACE_BY_KEY, type SpaceKey } from "@/data/seed/sponsoring"
import {
  BANNER_SPACES,
  AUDIENCE_LABEL,
  AD_CATEGORIES,
  blankRequest,
  durationLabel,
  type AdAudience,
  type OfferRequest,
} from "@/data/seed/offerRequests"
import { PageHeader } from "@/components/kit/PageHeader"
import { BackButton } from "@/components/kit/BackButton"
import { Avatar } from "@/components/kit/Avatar"
import { Switch, SectionTitle, SPACE_ICON } from "@/features/sponsoring/ui"

const inputCls =
  "w-full rounded-md border border-input bg-transparent px-3.5 py-2.5 font-body text-sm text-ink outline-none transition-colors placeholder:text-ink-disabled focus:border-border-focus"

/** Preset run lengths, in months. "Saison" is the round-year 10. */
const DURATIONS = [1, 3, 6, 10] as const

const AUDIENCES: AdAudience[] = ["tous", "parents", "joueurs"]

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

/** Right-aligned integer input with a unit suffix. */
function Num({
  value,
  onChange,
  min = 0,
  suffix,
}: {
  value: number
  onChange: (v: number) => void
  min?: number
  suffix?: string
}) {
  return (
    <div className="relative flex items-center">
      <input
        type="number"
        min={min}
        value={value}
        onChange={(e) => {
          const raw = e.target.value
          onChange(raw === "" ? min : Math.max(min, Number(raw)))
        }}
        className={cn(inputCls, "pr-24 text-right tabular-nums")}
      />
      {suffix ? (
        <span className="pointer-events-none absolute right-3.5 font-body text-[0.74rem] text-ink-disabled">
          {suffix}
        </span>
      ) : null}
    </div>
  )
}

/**
 * Sponsor space — "Demander une offre sur mesure". Instead of buying a ready
 * tier, the sponsor composes exactly the visibility it wants and sends it to the
 * club; the admin prices it back in Sponsoring ▸ Demandes.
 *
 * The one real interaction of this static section: a live-updating recap on the
 * right. No math is enforced — the percentages and rhythms are the sponsor's
 * ask. Referenced OffreFormScreen (two-column + sticky preview, field styling)
 * and PartnerFormModal (selectable rows) to stay on-brand.
 */
export function CustomOfferScreen() {
  const navigate = useNavigate()
  const { slug } = useParams()
  const { session, sponsorAccounts, addOfferRequest } = useData()

  const club = CLUB_LISTINGS.find((c) => c.slug === slug) ?? CLUB_LISTINGS[0]
  const account =
    sponsorAccounts.find((a) => a.id === session?.accountId) ?? null

  const [draft, setDraft] = useState(() =>
    blankRequest(club, {
      company: account?.company ?? session?.subtitle,
      contact: account?.contact ?? session?.name,
      email: account?.email,
      sector: account?.sector,
    }),
  )
  const [sent, setSent] = useState<OfferRequest["clubName"] | null>(null)

  const set = <K extends keyof typeof draft>(key: K, val: (typeof draft)[K]) =>
    setDraft((d) => ({ ...d, [key]: val }))

  /* ── Banners ──────────────────────────────────────────────────────────── */
  const bannerOf = (key: SpaceKey) => draft.banners.find((b) => b.key === key)
  const toggleBanner = (key: SpaceKey, on: boolean) =>
    setDraft((d) => ({
      ...d,
      banners: on
        ? [...d.banners, { key, pct: 15 }]
        : d.banners.filter((b) => b.key !== key),
    }))
  const setBannerPct = (key: SpaceKey, pct: number) =>
    setDraft((d) => ({
      ...d,
      banners: d.banners.map((b) => (b.key === key ? { ...b, pct } : b)),
    }))

  /* ── Categories ───────────────────────────────────────────────────────── */
  const toggleCategory = (name: string) =>
    setDraft((d) => ({
      ...d,
      categories: d.categories.includes(name)
        ? d.categories.filter((c) => c !== name)
        : [...d.categories, name],
    }))

  // Banners in catalogue order, for a stable recap regardless of pick order.
  const selectedBanners = useMemo(
    () =>
      BANNER_SPACES.map((s) => bannerOf(s.key)).filter(
        (b): b is { key: SpaceKey; pct: number } => Boolean(b),
      ),
    [draft.banners],
  )

  const canSubmit =
    draft.company.trim() !== "" &&
    draft.contact.trim() !== "" &&
    draft.email.trim() !== ""

  const submit = () => {
    if (!canSubmit) return
    addOfferRequest({
      ...draft,
      company: draft.company.trim(),
      contact: draft.contact.trim(),
      email: draft.email.trim(),
      phone: draft.phone.trim(),
    })
    setSent(club.name)
  }

  /* ── Sent confirmation ────────────────────────────────────────────────── */
  if (sent) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="mt-10 flex flex-col items-center rounded-xl border border-border px-6 py-14 text-center">
          <span className="flex size-14 items-center justify-center rounded-full bg-success/12 text-success">
            <Check size={28} strokeWidth={2} />
          </span>
          <h1 className="mt-5 font-ui text-xl font-semibold text-ink">
            Demande envoyée à {sent}
          </h1>
          <p className="mt-2 max-w-md font-body text-sm leading-relaxed text-ink-muted">
            Le club a bien reçu votre proposition sur mesure. Son administrateur
            l'étudie et vous recontactera à{" "}
            <span className="font-mono text-[0.82rem] text-ink-subtle">
              {draft.email}
            </span>{" "}
            avec un tarif.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-2.5">
            <button
              type="button"
              onClick={() => navigate(`/sponsor/explorer/${club.slug}`)}
              className="rounded-md border border-input px-4 py-2 font-ui text-sm font-medium text-ink transition-colors hover:border-border-strong hover:bg-accent"
            >
              Retour aux offres du club
            </button>
            <button
              type="button"
              onClick={() => navigate("/sponsor/demandes")}
              className="inline-flex items-center gap-1.5 rounded-md bg-brand px-4 py-2 font-ui text-sm font-medium text-ink-inverted shadow-glow transition-colors hover:bg-brand-dim"
            >
              <Inbox size={16} /> Suivre ma demande
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl">
      <BackButton
        to={`/sponsor/explorer/${club.slug}`}
        label="Retour aux offres du club"
      />

      <PageHeader
        title="Offre sur mesure"
        subtitle={`Composez la visibilité que vous souhaitez chez ${club.name}. Le club fixera le tarif en retour.`}
      />

      <div className="mt-7 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
        {/* ── LEFT: the form ──────────────────────────────────────────────── */}
        <div className="flex flex-col gap-10">
          {/* 1 — Durée */}
          <section>
            <SectionTitle>Durée du partenariat</SectionTitle>
            <div className="flex flex-wrap items-center gap-2.5">
              {DURATIONS.map((m) => {
                const active = draft.durationMonths === m
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => set("durationMonths", m)}
                    className={cn(
                      "rounded-md border px-4 py-2 font-ui text-[0.82rem] font-medium transition-colors",
                      active
                        ? "border-info/50 bg-info/10 text-info"
                        : "border-input text-ink-muted hover:border-border-strong hover:text-ink",
                    )}
                  >
                    {m >= 10 ? "Saison" : `${m} mois`}
                  </button>
                )
              })}
              <div className="w-[150px]">
                <Num
                  value={draft.durationMonths}
                  onChange={(v) => set("durationMonths", Math.max(1, v))}
                  min={1}
                  suffix="mois"
                />
              </div>
            </div>
          </section>

          {/* 2 — Bannières */}
          <section>
            <SectionTitle hint="Où et à quelle visibilité">
              Bannières publicitaires
            </SectionTitle>
            <div className="overflow-hidden rounded-lg border border-border">
              {BANNER_SPACES.map((space, i) => {
                const b = bannerOf(space.key)
                const Icon = SPACE_ICON[space.key]
                return (
                  <div
                    key={space.key}
                    className={cn(
                      "flex items-start gap-3.5 px-4 py-3.5",
                      i > 0 && "border-t border-border",
                    )}
                  >
                    <div className="pt-0.5">
                      <Switch
                        checked={Boolean(b)}
                        onChange={(on) => toggleBanner(space.key, on)}
                        label={space.label}
                      />
                    </div>
                    <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-surface-nested text-ink-muted">
                      <Icon size={15} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="font-body text-[0.86rem] text-ink">
                        {space.label}
                      </div>
                      <div className="font-body text-[0.75rem] leading-snug text-ink-muted">
                        {space.description}
                      </div>
                    </div>
                    {b ? (
                      <div className="w-[128px] shrink-0">
                        <Num
                          value={b.pct}
                          onChange={(v) =>
                            setBannerPct(space.key, Math.min(100, v))
                          }
                          min={0}
                          suffix="% visib."
                        />
                      </div>
                    ) : null}
                  </div>
                )
              })}
            </div>
            <p className="mt-2.5 font-body text-[0.72rem] leading-snug text-ink-disabled">
              Le pourcentage est la part de rotation que vous demandez sur chaque
              espace. Le club confirmera la visibilité réellement disponible.
            </p>
          </section>

          {/* 3 — Notifications */}
          <section>
            <SectionTitle>Notifications push</SectionTitle>
            <div className="flex flex-col gap-3.5">
              <Field
                label="Envois par jour"
                hint="Nombre de notifications poussées aux utilisateurs chaque jour."
              >
                <Num
                  value={draft.notificationsPerDay}
                  onChange={(v) => set("notificationsPerDay", v)}
                  min={0}
                  suffix="/ jour"
                />
              </Field>
              {draft.notificationsPerDay >= 3 ? (
                <div className="flex items-start gap-2 rounded-md border border-warning/25 bg-warning/5 px-3.5 py-2.5">
                  <AlertTriangle
                    size={14}
                    className="mt-0.5 shrink-0 text-warning"
                  />
                  <p className="font-body text-[0.75rem] leading-snug text-warning">
                    Au-delà de 2 envois par jour, l'espace devient intrusif — le
                    club pourra réduire cette fréquence.
                  </p>
                </div>
              ) : null}
            </div>
          </section>

          {/* 4 — Messagerie */}
          <section>
            <SectionTitle>Messagerie</SectionTitle>
            <Field
              label="Messages par jour"
              hint="Messages sponsorisés reçus dans la messagerie du club, par jour."
            >
              <Num
                value={draft.messagesPerDay}
                onChange={(v) => set("messagesPerDay", v)}
                min={0}
                suffix="/ jour"
              />
            </Field>
          </section>

          {/* 5 — Ciblage avancé */}
          <section>
            <SectionTitle>Ciblage avancé</SectionTitle>
            <div className="flex flex-col gap-5">
              <Field label="Audience">
                <div className="flex flex-wrap gap-2.5">
                  {AUDIENCES.map((a) => {
                    const active = draft.audience === a
                    return (
                      <button
                        key={a}
                        type="button"
                        onClick={() => set("audience", a)}
                        className={cn(
                          "rounded-md border px-4 py-2 font-ui text-[0.82rem] font-medium transition-colors",
                          active
                            ? "border-info/50 bg-info/10 text-info"
                            : "border-input text-ink-muted hover:border-border-strong hover:text-ink",
                        )}
                      >
                        {AUDIENCE_LABEL[a]}
                      </button>
                    )
                  })}
                </div>
              </Field>

              <Field
                label="Catégories ciblées"
                hint="Laissez vide pour diffuser à toutes les catégories du club."
              >
                <div className="flex flex-wrap gap-2">
                  {AD_CATEGORIES.map((name) => {
                    const active = draft.categories.includes(name)
                    return (
                      <button
                        key={name}
                        type="button"
                        onClick={() => toggleCategory(name)}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-pill border px-3 py-1 font-ui text-[0.76rem] font-medium transition-colors",
                          active
                            ? "border-brand-blue-600/40 bg-brand-blue-600/10 text-brand-blue-600"
                            : "border-input text-ink-muted hover:border-border-strong hover:text-ink",
                        )}
                      >
                        {active ? <Check size={12} /> : null}
                        {name}
                      </button>
                    )
                  })}
                </div>
              </Field>
            </div>
          </section>

          {/* 6 — Coordonnées */}
          <section>
            <SectionTitle>Vos coordonnées</SectionTitle>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Entreprise">
                <input
                  className={inputCls}
                  placeholder="Ooredoo Tunisie"
                  value={draft.company}
                  onChange={(e) => set("company", e.target.value)}
                />
              </Field>
              <Field label="Contact">
                <input
                  className={inputCls}
                  placeholder="Karim Mansouri"
                  value={draft.contact}
                  onChange={(e) => set("contact", e.target.value)}
                />
              </Field>
              <Field label="Email">
                <input
                  type="email"
                  className={inputCls}
                  placeholder="contact@entreprise.tn"
                  value={draft.email}
                  onChange={(e) => set("email", e.target.value)}
                />
              </Field>
              <Field label="Téléphone">
                <input
                  className={inputCls}
                  placeholder="+216 71 000 000"
                  value={draft.phone}
                  onChange={(e) => set("phone", e.target.value)}
                />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Message au club" hint="Optionnel.">
                  <textarea
                    rows={3}
                    className={cn(inputCls, "resize-none")}
                    placeholder="Présentez brièvement votre campagne et vos objectifs de visibilité."
                    value={draft.message}
                    onChange={(e) => set("message", e.target.value)}
                  />
                </Field>
              </div>
            </div>
          </section>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 border-t border-border pt-5">
            <button
              type="button"
              onClick={() => navigate(`/sponsor/explorer/${club.slug}`)}
              className="rounded-md border border-input px-4 py-2 font-ui text-sm font-medium text-ink transition-colors hover:border-border-strong hover:bg-accent"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={!canSubmit}
              className="inline-flex items-center gap-1.5 rounded-md bg-brand px-5 py-2 font-ui text-sm font-medium text-ink-inverted shadow-glow transition-colors hover:bg-brand-dim disabled:cursor-not-allowed disabled:opacity-45"
            >
              <Send size={16} /> Envoyer la demande
            </button>
          </div>
        </div>

        {/* ── RIGHT: live recap ───────────────────────────────────────────── */}
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <RecapPanel
            club={club.name}
            duration={durationLabel(draft.durationMonths)}
            banners={selectedBanners}
            notificationsPerDay={draft.notificationsPerDay}
            messagesPerDay={draft.messagesPerDay}
            audience={draft.audience}
            categories={draft.categories}
          />
        </aside>
      </div>
    </div>
  )
}

/* ── Sticky recap ─────────────────────────────────────────────────────────── */
function RecapPanel({
  club,
  duration,
  banners,
  notificationsPerDay,
  messagesPerDay,
  audience,
  categories,
}: {
  club: string
  duration: string
  banners: { key: SpaceKey; pct: number }[]
  notificationsPerDay: number
  messagesPerDay: number
  audience: AdAudience
  categories: string[]
}) {
  return (
    <div className="rounded-xl border border-border">
      <div className="flex items-center gap-2 border-b border-border px-5 py-3">
        <Sparkles size={14} className="text-info" />
        <h2 className="font-ui text-[0.72rem] font-medium tracking-[0.1em] text-ink-muted uppercase">
          Votre demande
        </h2>
      </div>

      <div className="flex flex-col gap-5 px-5 py-5">
        <div className="flex items-center gap-2.5">
          <Avatar name={club} size="md" />
          <div className="min-w-0">
            <div className="truncate font-body text-[0.86rem] text-ink">
              {club}
            </div>
            <div className="font-body text-[0.72rem] text-ink-disabled">
              Offre sur mesure
            </div>
          </div>
        </div>

        <RecapRow icon={CalendarClock} label="Durée" value={duration} />

        {/* Bannières */}
        <div>
          <RecapLabel>Bannières</RecapLabel>
          {banners.length === 0 ? (
            <p className="mt-1.5 font-body text-[0.78rem] text-ink-disabled">
              Aucune bannière sélectionnée.
            </p>
          ) : (
            <div className="mt-2 flex flex-col gap-1.5">
              {banners.map((b) => (
                <div
                  key={b.key}
                  className="flex items-center justify-between font-body text-[0.8rem]"
                >
                  <span className="text-ink-subtle">
                    {SPACE_BY_KEY[b.key].label}
                  </span>
                  <span className="text-ink tabular-nums">{b.pct} %</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <RecapRow
          icon={Bell}
          label="Notifications"
          value={
            notificationsPerDay > 0 ? `${notificationsPerDay} / jour` : "Aucune"
          }
        />
        <RecapRow
          icon={MessageSquare}
          label="Messagerie"
          value={messagesPerDay > 0 ? `${messagesPerDay} / jour` : "Aucun"}
        />
        <RecapRow icon={Users} label="Audience" value={AUDIENCE_LABEL[audience]} />

        <div>
          <RecapLabel>Catégories</RecapLabel>
          <p className="mt-1.5 font-body text-[0.8rem] text-ink-subtle">
            {categories.length === 0
              ? "Toutes les catégories"
              : categories.join(" · ")}
          </p>
        </div>

        <p className="border-t border-border pt-4 font-body text-[0.72rem] leading-snug text-ink-disabled">
          Le tarif est fixé par le club après étude de votre demande.
        </p>
      </div>
    </div>
  )
}

function RecapLabel({ children }: { children: ReactNode }) {
  return (
    <span className="font-ui text-[0.66rem] font-medium tracking-[0.08em] text-ink-disabled uppercase">
      {children}
    </span>
  )
}

function RecapRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Bell
  label: string
  value: string
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="inline-flex items-center gap-2 font-body text-[0.8rem] text-ink-muted">
        <Icon size={14} className="text-ink-disabled" />
        {label}
      </span>
      <span className="font-body text-[0.82rem] text-ink-subtle tabular-nums">
        {value}
      </span>
    </div>
  )
}
