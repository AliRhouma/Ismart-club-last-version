import { useState, type ReactNode } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Send, AlertTriangle, Inbox } from "lucide-react"

import { cn } from "@/lib/utils"
import { useData } from "@/data/useData"
import { SPACE_BY_KEY, type SpaceKey } from "@/data/seed/sponsoring"
import {
  BANNER_SPACES,
  AUDIENCE_LABEL,
  AD_CATEGORIES,
  durationLabel,
  type AdAudience,
} from "@/data/seed/offerRequests"
import { PageHeader } from "@/components/kit/PageHeader"
import { BackButton } from "@/components/kit/BackButton"
import { EmptyState } from "@/components/kit/EmptyState"
import { Avatar } from "@/components/kit/Avatar"
import { Switch, SectionTitle, SPACE_ICON } from "@/features/sponsoring/ui"

const inputCls =
  "w-full rounded-md border border-input bg-transparent px-3.5 py-2.5 font-body text-sm text-ink outline-none transition-colors placeholder:text-ink-disabled focus:border-border-focus"

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
 * Sponsoring ▸ Demandes ▸ Modifier — the admin's counter-proposal editor. It
 * opens on the sponsor's original ask, lets the club adjust every parameter
 * (duration, banners & shares, notifications, messagerie, ciblage), set a price,
 * and write a justification, then sends the amended proposition back.
 *
 * Referenced CustomOfferScreen (form structure, field styling) and OffreForm
 * (two-column + sticky recap) to stay on-brand. Distinct from the sponsor form:
 * this one carries a price and a required note, and writes back to the request.
 */
export function RequestEditScreen() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { offerRequests, updateOfferRequest } = useData()

  const request = offerRequests.find((r) => r.id === id) ?? null

  const [draft, setDraft] = useState(() =>
    request
      ? {
          durationMonths: request.durationMonths,
          banners: request.banners.map((b) => ({ ...b })),
          notificationsPerDay: request.notificationsPerDay,
          messagesPerDay: request.messagesPerDay,
          audience: request.audience,
          categories: [...request.categories],
          price: request.price,
          decisionNote: request.decisionNote,
        }
      : null,
  )

  if (!request || !draft) {
    return (
      <div className="mx-auto max-w-3xl">
        <BackButton
          to="/sponsoring/demandes-sur-mesure"
          label="Retour aux demandes"
        />
        <div className="mt-6 rounded-lg border border-border">
          <EmptyState
            icon={Inbox}
            title="Demande introuvable"
            description="Cette demande n'existe plus ou a déjà été traitée."
          />
        </div>
      </div>
    )
  }

  const d = draft // narrowed non-null

  const set = <K extends keyof typeof d>(key: K, val: (typeof d)[K]) =>
    setDraft((prev) => (prev ? { ...prev, [key]: val } : prev))

  const bannerOf = (key: SpaceKey) => d.banners.find((b) => b.key === key)
  const toggleBanner = (key: SpaceKey, on: boolean) =>
    setDraft((prev) =>
      prev
        ? {
            ...prev,
            banners: on
              ? [...prev.banners, { key, pct: 15 }]
              : prev.banners.filter((b) => b.key !== key),
          }
        : prev,
    )
  const setBannerPct = (key: SpaceKey, pct: number) =>
    setDraft((prev) =>
      prev
        ? {
            ...prev,
            banners: prev.banners.map((b) =>
              b.key === key ? { ...b, pct } : b,
            ),
          }
        : prev,
    )
  const toggleCategory = (name: string) =>
    setDraft((prev) =>
      prev
        ? {
            ...prev,
            categories: prev.categories.includes(name)
              ? prev.categories.filter((c) => c !== name)
              : [...prev.categories, name],
          }
        : prev,
    )

  const priceValid = d.price != null && d.price > 0
  const canSend = priceValid && d.decisionNote.trim() !== ""

  const send = () => {
    if (!canSend) return
    updateOfferRequest(request.id, {
      durationMonths: d.durationMonths,
      banners: d.banners,
      notificationsPerDay: d.notificationsPerDay,
      messagesPerDay: d.messagesPerDay,
      audience: d.audience,
      categories: d.categories,
      price: d.price,
      decisionNote: d.decisionNote.trim(),
      status: "contre_proposee",
    })
    navigate("/sponsoring/demandes-sur-mesure", {
      state: { toast: `Contre-proposition envoyée à ${request.company}` },
    })
  }

  return (
    <div className="mx-auto max-w-5xl">
      <BackButton
        to="/sponsoring/demandes-sur-mesure"
        label="Retour aux demandes"
      />
      <PageHeader
        title="Modifier la proposition"
        subtitle={`Ajustez la demande de ${request.company} et renvoyez une contre-proposition tarifée.`}
      />

      {/* Original ask — read-only reference */}
      <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg border border-border bg-surface-nested px-5 py-3.5">
        <span className="font-ui text-[0.64rem] font-medium tracking-[0.08em] text-ink-disabled uppercase">
          Demande initiale
        </span>
        <span className="font-body text-[0.8rem] text-ink-muted">
          {durationLabel(request.durationMonths)} ·{" "}
          {request.banners.length} bannière
          {request.banners.length > 1 ? "s" : ""} ·{" "}
          {request.notificationsPerDay} notif./j · {request.messagesPerDay} msg/j
          · {AUDIENCE_LABEL[request.audience].toLowerCase()}
        </span>
      </div>

      <div className="mt-7 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
        {/* ── LEFT: the editable proposition ──────────────────────────────── */}
        <div className="flex flex-col gap-10">
          {/* Durée */}
          <section>
            <SectionTitle>Durée du partenariat</SectionTitle>
            <div className="flex flex-wrap items-center gap-2.5">
              {DURATIONS.map((m) => {
                const active = d.durationMonths === m
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
                  value={d.durationMonths}
                  onChange={(v) => set("durationMonths", Math.max(1, v))}
                  min={1}
                  suffix="mois"
                />
              </div>
            </div>
          </section>

          {/* Bannières */}
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
          </section>

          {/* Notifications */}
          <section>
            <SectionTitle>Notifications push</SectionTitle>
            <div className="flex flex-col gap-3.5">
              <Field label="Envois par jour">
                <Num
                  value={d.notificationsPerDay}
                  onChange={(v) => set("notificationsPerDay", v)}
                  min={0}
                  suffix="/ jour"
                />
              </Field>
              {d.notificationsPerDay >= 3 ? (
                <div className="flex items-start gap-2 rounded-md border border-warning/25 bg-warning/5 px-3.5 py-2.5">
                  <AlertTriangle
                    size={14}
                    className="mt-0.5 shrink-0 text-warning"
                  />
                  <p className="font-body text-[0.75rem] leading-snug text-warning">
                    Fréquence élevée — pensez à la réduire pour préserver
                    l'expérience des familles.
                  </p>
                </div>
              ) : null}
            </div>
          </section>

          {/* Messagerie */}
          <section>
            <SectionTitle>Messagerie</SectionTitle>
            <Field label="Messages par jour">
              <Num
                value={d.messagesPerDay}
                onChange={(v) => set("messagesPerDay", v)}
                min={0}
                suffix="/ jour"
              />
            </Field>
          </section>

          {/* Ciblage */}
          <section>
            <SectionTitle>Ciblage</SectionTitle>
            <div className="flex flex-col gap-5">
              <Field label="Audience">
                <div className="flex flex-wrap gap-2.5">
                  {AUDIENCES.map((a) => {
                    const active = d.audience === a
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
                    const active = d.categories.includes(name)
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
                        {name}
                      </button>
                    )
                  })}
                </div>
              </Field>
            </div>
          </section>

          {/* Tarif + justification */}
          <section>
            <SectionTitle>Tarif & justification</SectionTitle>
            <div className="flex flex-col gap-4">
              <Field
                label="Tarif proposé"
                hint="Le montant que le club propose pour cette formule ajustée."
              >
                <div className="relative flex items-center">
                  <input
                    type="number"
                    min={0}
                    value={d.price ?? ""}
                    onChange={(e) =>
                      set(
                        "price",
                        e.target.value === "" ? null : Number(e.target.value),
                      )
                    }
                    placeholder="0"
                    className={cn(inputCls, "pr-14 text-right tabular-nums")}
                  />
                  <span className="pointer-events-none absolute right-3.5 font-body text-[0.8rem] text-ink-disabled">
                    DT
                  </span>
                </div>
              </Field>

              <Field
                label="Message au sponsor"
                hint="Expliquez les ajustements apportés à la demande initiale."
              >
                <textarea
                  rows={4}
                  className={cn(inputCls, "resize-none")}
                  placeholder="Ex. : nous avons réduit la fréquence de notifications à 1/jour et proposé la bannière calendrier à 20 %. Voici notre tarif pour cette formule."
                  value={d.decisionNote}
                  onChange={(e) => set("decisionNote", e.target.value)}
                />
              </Field>
            </div>
          </section>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 border-t border-border pt-5">
            <button
              type="button"
              onClick={() => navigate("/sponsoring/demandes-sur-mesure")}
              className="rounded-md border border-input px-4 py-2 font-ui text-sm font-medium text-ink transition-colors hover:border-border-strong hover:bg-accent"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={send}
              disabled={!canSend}
              className="inline-flex items-center gap-1.5 rounded-md bg-brand px-5 py-2 font-ui text-sm font-medium text-ink-inverted shadow-glow transition-colors hover:bg-brand-dim disabled:cursor-not-allowed disabled:opacity-45"
            >
              <Send size={16} /> Renvoyer la proposition
            </button>
          </div>
        </div>

        {/* ── RIGHT: sticky recap ─────────────────────────────────────────── */}
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-xl border border-border">
            <div className="border-b border-border px-5 py-3">
              <h2 className="font-ui text-[0.72rem] font-medium tracking-[0.1em] text-ink-muted uppercase">
                Contre-proposition
              </h2>
            </div>
            <div className="flex flex-col gap-5 px-5 py-5">
              <div className="flex items-center gap-2.5">
                <Avatar name={request.company} size="md" />
                <div className="min-w-0">
                  <div className="truncate font-body text-[0.86rem] text-ink">
                    {request.company}
                  </div>
                  <div className="font-body text-[0.72rem] text-ink-disabled">
                    {request.contact}
                  </div>
                </div>
              </div>

              <Row label="Durée" value={durationLabel(d.durationMonths)} />

              <div>
                <RecapLabel>Bannières</RecapLabel>
                {d.banners.length === 0 ? (
                  <p className="mt-1.5 font-body text-[0.78rem] text-ink-disabled">
                    Aucune bannière.
                  </p>
                ) : (
                  <div className="mt-2 flex flex-col gap-1.5">
                    {BANNER_SPACES.map((s) => bannerOf(s.key))
                      .filter((b): b is { key: SpaceKey; pct: number } =>
                        Boolean(b),
                      )
                      .map((b) => (
                        <div
                          key={b.key}
                          className="flex items-center justify-between font-body text-[0.8rem]"
                        >
                          <span className="text-ink-subtle">
                            {SPACE_BY_KEY[b.key].label}
                          </span>
                          <span className="text-ink tabular-nums">
                            {b.pct} %
                          </span>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              <Row
                label="Notifications"
                value={
                  d.notificationsPerDay > 0
                    ? `${d.notificationsPerDay} / jour`
                    : "Aucune"
                }
              />
              <Row
                label="Messagerie"
                value={d.messagesPerDay > 0 ? `${d.messagesPerDay} / jour` : "Aucun"}
              />
              <Row label="Audience" value={AUDIENCE_LABEL[d.audience]} />

              <div className="flex items-center justify-between border-t border-border pt-4">
                <span className="font-ui text-[0.7rem] font-medium tracking-[0.08em] text-ink-muted uppercase">
                  Tarif proposé
                </span>
                <span className="font-display text-lg font-semibold text-ink tabular-nums">
                  {priceValid ? `${d.price!.toLocaleString("fr-FR")} DT` : "—"}
                </span>
              </div>
            </div>
          </div>
        </aside>
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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="font-body text-[0.8rem] text-ink-muted">{label}</span>
      <span className="font-body text-[0.82rem] text-ink-subtle tabular-nums">
        {value}
      </span>
    </div>
  )
}
