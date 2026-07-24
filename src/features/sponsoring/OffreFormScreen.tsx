import { useMemo, useState, type ReactNode } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { Check } from "lucide-react"

import { cn } from "@/lib/utils"
import { useData } from "@/data/useData"
import {
  OFFER_SPACES,
  blankOffer,
  sharePerSponsor,
  shareValue,
  perDayValue,
  pct,
  type Offer,
  type OfferSpace,
  type SpaceKey,
  type SpaceKind,
} from "@/data/seed/sponsoring"
import { BackButton } from "@/components/kit/BackButton"
import { Switch, TierBadge, SectionTitle, SPACE_ICON } from "@/features/sponsoring/ui"
import { OfferSpacePreview } from "@/features/sponsoring/offerSpaceMocks"

const inputCls =
  "w-full rounded-md border border-input bg-transparent px-3.5 py-2.5 font-body text-sm text-ink outline-none transition-colors placeholder:text-ink-disabled focus:border-border-focus"

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

/** Small right-aligned integer input with an optional unit suffix. */
function Num({
  value,
  onChange,
  min,
  suffix,
  placeholder,
  allowEmpty,
}: {
  value: number | null
  onChange: (v: number | null) => void
  min?: number
  suffix?: string
  placeholder?: string
  allowEmpty?: boolean
}) {
  return (
    <div className="relative flex items-center">
      <input
        type="number"
        min={min}
        placeholder={placeholder}
        value={value === null ? "" : value}
        onChange={(e) => {
          const raw = e.target.value
          if (raw === "") return onChange(allowEmpty ? null : (min ?? 0))
          onChange(Number(raw))
        }}
        className={cn(inputCls, "pr-20 text-right tabular-nums")}
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
 * Auto / manual value for one ad space. Shows the computed value by default
 * (the "Auto" pill lit); clicking it hands editing to the club, which can type
 * an override; clicking it again returns to auto. `share` spaces show a %,
 * `perDay` spaces a "/ jour" rhythm.
 */
function ValueControl({
  kind,
  manual,
  autoValue,
  onChange,
}: {
  kind: SpaceKind
  manual: number | null
  autoValue: number
  onChange: (v: number | null) => void
}) {
  const isAuto = manual === null
  const suffix = kind === "share" ? "%" : "/ jour"
  const autoLabel =
    kind === "share"
      ? autoValue.toLocaleString("fr-FR", {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        })
      : String(autoValue)

  return (
    <div className="flex items-center gap-2">
      <div className="relative w-[124px]">
        {isAuto ? (
          <div className="flex items-center justify-end gap-1 rounded-md border border-border bg-surface-nested px-3 py-2 font-body text-sm text-ink-muted tabular-nums">
            <span>{autoLabel}</span>
            <span className="text-[0.72rem] text-ink-disabled">{suffix}</span>
          </div>
        ) : (
          <>
            <input
              type="number"
              min={0}
              value={String(manual)}
              onChange={(e) =>
                onChange(e.target.value === "" ? 0 : Number(e.target.value))
              }
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 pr-14 text-right font-body text-sm text-ink tabular-nums outline-none transition-colors focus:border-border-focus"
            />
            <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 font-body text-[0.72rem] text-ink-disabled">
              {suffix}
            </span>
          </>
        )}
      </div>
      <button
        type="button"
        onClick={() => onChange(isAuto ? autoValue : null)}
        aria-pressed={isAuto}
        title={
          isAuto
            ? "Valeur automatique — cliquez pour saisir une valeur manuelle"
            : "Revenir à la valeur automatique"
        }
        className={cn(
          "rounded-pill border px-2.5 py-1 font-ui text-[0.64rem] font-medium tracking-[0.06em] uppercase transition-colors",
          isAuto
            ? "border-brand-blue-600/30 bg-brand-blue-600/10 text-brand-blue-600"
            : "border-border text-ink-muted hover:border-border-strong hover:text-ink",
        )}
      >
        Auto
      </button>
    </div>
  )
}

/**
 * Screen 3 — offer creation / edit form + sticky live preview.
 *
 * The only real math in the prototype: the rotation share of each sponsor is
 * points / Σ(points × seats) across ALL offers (existing ones plus this draft).
 * It recomputes on every keystroke of `points` or `seats`, and feeds the auto
 * value of every `share` ad space.
 * Referenced the Budget config screen (two-column + sticky) and the Objectif
 * modal (field styling) to stay on-brand.
 */
export function OffreFormScreen() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const editId = params.get("edit")
  const { offers, addOffer, updateOffer } = useData()

  const editing = editId ? offers.find((o) => o.id === editId) ?? null : null

  const [draft, setDraft] = useState<Omit<Offer, "id">>(() =>
    editing ? { ...editing, slots: { ...editing.slots } } : blankOffer(),
  )

  const set = <K extends keyof Omit<Offer, "id">>(
    key: K,
    val: Omit<Offer, "id">[K],
  ) => setDraft((d) => ({ ...d, [key]: val }))

  const setSpace = (key: SpaceKey, patch: Partial<OfferSpace>) =>
    setDraft((d) => ({
      ...d,
      slots: { ...d.slots, [key]: { ...d.slots[key], ...patch } },
    }))

  // Pool = every OTHER offer already in the store + this draft's current values.
  const share = useMemo(() => {
    const others = offers.filter((o) => o.id !== editId)
    const all = [...others, { points: draft.points, seats: draft.seats }]
    return sharePerSponsor({ points: draft.points, seats: draft.seats }, all)
  }, [offers, editId, draft.points, draft.seats])

  const submit = () => {
    const clean: Omit<Offer, "id"> = {
      ...draft,
      name: draft.name.trim() || "Sans nom",
      seats: Math.max(1, draft.seats || 1),
      points: Math.max(1, draft.points || 1),
    }
    if (editing) {
      updateOffer(editing.id, clean)
      navigate("/sponsoring/offres", { state: { toast: "Offre mise à jour" } })
    } else {
      addOffer(clean)
      navigate("/sponsoring/offres", { state: { toast: "Offre créée" } })
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <BackButton to="/sponsoring/offres" label="Retour aux offres" />

      <h1 className="font-ui text-2xl font-semibold text-ink">
        {editing ? "Modifier le pack" : "Nouveau pack"}
      </h1>
      <p className="mt-1.5 font-body text-sm text-ink-muted">
        Une formule de partenariat : ses droits, ses places et sa visibilité.
      </p>

      <div className="mt-7 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_340px]">
        {/* ── LEFT: the form ────────────────────────────────────────────── */}
        <div className="flex flex-col gap-10">
          {/* Identité */}
          <section>
            <SectionTitle>Identité</SectionTitle>
            <div className="flex flex-col gap-4">
              <Field label="Nom du pack" hint="Le nom que verront vos partenaires.">
                <input
                  className={inputCls}
                  placeholder="Or, Argent, Bronze…"
                  value={draft.name}
                  onChange={(e) => set("name", e.target.value)}
                />
              </Field>

              <Field label="Description">
                <textarea
                  rows={3}
                  className={cn(inputCls, "resize-none")}
                  placeholder="Partenaire principal du club, visibilité maximale sur toutes les pages."
                  value={draft.description}
                  onChange={(e) => set("description", e.target.value)}
                />
              </Field>

              <Field
                label="Prix"
                hint="Laissez vide pour un partenariat en échange ou institutionnel."
              >
                <Num
                  value={draft.price}
                  onChange={(v) => set("price", v)}
                  min={0}
                  allowEmpty
                  suffix="DT / saison"
                  placeholder="—"
                />
              </Field>
            </div>
          </section>

          {/* Places disponibles — temporairement masqué (les places gardent
              leur valeur par défaut, utilisée dans le calcul de visibilité). */}
          {/* <section>
            <SectionTitle>Places disponibles</SectionTitle>
            <div className="flex flex-col gap-3.5">
              <Field label="Nombre de places">
                <Num
                  value={draft.seats}
                  onChange={(v) => set("seats", v ?? 1)}
                  min={1}
                  suffix="places"
                />
              </Field>
              <ExplainCard title="À quoi sert le nombre de places ?">
                <p>
                  Il limite combien de partenaires peuvent souscrire cette
                  offre. C'est ce qui rend une offre exclusive — et donc plus
                  chère.
                </p>
                <p>
                  Il détermine aussi la visibilité : plus il y a de places, plus
                  la visibilité de chaque partenaire est diluée.
                </p>
                <p className="italic text-ink-disabled">
                  Exemple : 2 places Or = chaque sponsor Or est deux fois plus
                  visible qu'avec 4 places.
                </p>
              </ExplainCard>
            </div>
          </section> */}

          {/* Espaces publicitaires — one visual card per space */}
          <section>
            <SectionTitle>Espaces publicitaires</SectionTitle>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {OFFER_SPACES.map((space) => {
                const s = draft.slots[space.key]
                const Icon = SPACE_ICON[space.key]
                // Auto value: share % from the rotation, or the space's daily
                // default. Rounded to one decimal so a manual seed reads clean.
                const autoValue =
                  space.kind === "share"
                    ? Math.round(share * 1000) / 10
                    : space.autoPerDay ?? 0
                return (
                  <div
                    key={space.key}
                    className={cn(
                      "flex flex-col rounded-xl border border-border p-4 transition-opacity",
                      !s.enabled && "opacity-55",
                    )}
                  >
                    {/* Header — icon + label/description + enable switch */}
                    <div className="flex items-start gap-2.5">
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-surface-nested text-ink-subtle">
                        <Icon size={15} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="font-body text-[0.86rem] text-ink">
                          {space.label}
                        </div>
                        <div className="font-body text-[0.72rem] leading-snug text-ink-muted">
                          {space.description}
                        </div>
                      </div>
                      <Switch
                        checked={s.enabled}
                        onChange={(v) => setSpace(space.key, { enabled: v })}
                        label={space.label}
                      />
                    </div>

                    {/* Visual mock, like the gallery page */}
                    <div className="mt-4 flex justify-center">
                      <OfferSpacePreview
                        spaceKey={space.key}
                        color={draft.color}
                      />
                    </div>

                    {/* Value control */}
                    <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                      <span className="font-ui text-[0.68rem] font-medium tracking-[0.04em] text-ink-muted uppercase">
                        {space.kind === "share" ? "Visibilité" : "Fréquence"}
                      </span>
                      <ValueControl
                        kind={space.kind}
                        manual={s.manual}
                        autoValue={autoValue}
                        onChange={(v) => setSpace(space.key, { manual: v })}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          {/* Footer actions */}
          <div className="flex items-center justify-end gap-2 border-t border-border pt-5">
            <button
              type="button"
              onClick={() => navigate("/sponsoring/offres")}
              className="rounded-md border border-input px-4 py-2 font-ui text-sm font-medium text-ink transition-colors hover:border-border-strong hover:bg-accent"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={submit}
              className="inline-flex items-center gap-1.5 rounded-md bg-brand px-5 py-2 font-ui text-sm font-medium text-ink-inverted shadow-glow transition-colors hover:bg-brand-dim"
            >
              <Check size={16} />
              {editing ? "Enregistrer" : "Créer le pack"}
            </button>
          </div>
        </div>

        {/* ── RIGHT: sticky live preview ────────────────────────────────── */}
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <PreviewPanel draft={draft} share={share} />
        </aside>
      </div>
    </div>
  )
}

function PreviewPanel({
  draft,
  share,
}: {
  draft: Omit<Offer, "id">
  share: number
}) {
  const shareSpaces = OFFER_SPACES.filter(
    (s) => s.kind === "share" && draft.slots[s.key].enabled,
  )
  const sendSpaces = OFFER_SPACES.filter(
    (s) => s.kind === "perDay" && draft.slots[s.key].enabled,
  )

  return (
    <div className="rounded-xl border border-border">
      <div className="border-b border-border px-5 py-3">
        <h2 className="font-ui text-[0.72rem] font-medium tracking-[0.1em] text-ink-muted uppercase">
          Aperçu
        </h2>
      </div>

      <div className="flex flex-col gap-5 px-5 py-5">
        {/* Tier badge card, as a sponsor would see it */}
        <div className="rounded-lg border border-border px-4 py-4">
          <TierBadge name={draft.name || "Nouveau pack"} color={draft.color} />
          <div className="mt-3 flex items-baseline justify-between">
            <span className="font-display text-xl font-semibold text-ink tabular-nums">
              {draft.price === null
                ? "Échange"
                : `${draft.price.toLocaleString("fr-FR")} DT`}
            </span>
            {draft.price !== null ? (
              <span className="font-body text-[0.72rem] text-ink-disabled">
                / saison
              </span>
            ) : null}
          </div>
          <div className="mt-2 font-body text-[0.76rem] text-ink-muted">
            {draft.seats} place{draft.seats > 1 ? "s" : ""} disponible
            {draft.seats > 1 ? "s" : ""}
          </div>
        </div>

        {/* Visibilité par partenaire (rotated spaces) */}
        <div>
          <h3 className="font-ui text-[0.7rem] font-medium tracking-[0.08em] text-ink-muted uppercase">
            Visibilité par partenaire
          </h3>
          {shareSpaces.length === 0 ? (
            <p className="mt-2.5 font-body text-[0.78rem] text-ink-disabled">
              Activez un espace en rotation (calendrier, matchs, séances) pour
              voir la visibilité par partenaire.
            </p>
          ) : (
            <div className="mt-3 flex flex-col gap-3">
              {shareSpaces.map((s) => {
                const frac = shareValue(draft.slots[s.key], share)
                return (
                  <div key={s.key}>
                    <div className="flex items-center justify-between font-body text-[0.78rem]">
                      <span className="text-ink-subtle">{s.label}</span>
                      <span className="text-ink tabular-nums">{pct(frac)}</span>
                    </div>
                    <div className="mt-1.5 h-[6px] overflow-hidden rounded bg-accent">
                      <div
                        className="h-full rounded bg-info transition-[width] duration-300"
                        style={{ width: `${Math.min(frac * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Fréquence d'envoi (perDay spaces) */}
        {sendSpaces.length > 0 ? (
          <div className="border-t border-border pt-4">
            <h3 className="font-ui text-[0.7rem] font-medium tracking-[0.08em] text-ink-muted uppercase">
              Fréquence d'envoi
            </h3>
            <div className="mt-3 flex flex-col gap-2">
              {sendSpaces.map((s) => (
                <div
                  key={s.key}
                  className="flex items-center justify-between font-body text-[0.78rem]"
                >
                  <span className="text-ink-subtle">{s.label}</span>
                  <span className="text-ink tabular-nums">
                    {perDayValue(draft.slots[s.key], s)} / jour
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <p className="border-t border-border pt-4 font-body text-[0.72rem] text-ink-disabled/70">
          Calculé à partir de vos offres actuelles. Ces valeurs évoluent si vous
          ajoutez d'autres offres ou d'autres places.
        </p>
      </div>
    </div>
  )
}
