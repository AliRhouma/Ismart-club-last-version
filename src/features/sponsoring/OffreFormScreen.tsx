import { useMemo, useState, type ReactNode } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { Check, AlertTriangle, ExternalLink } from "lucide-react"

import { cn } from "@/lib/utils"
import { useData } from "@/data/useData"
import {
  SLOT_DEFS,
  PRESET_COLORS,
  blankOffer,
  sharePerSponsor,
  pct,
  type Offer,
  type OfferSlot,
  type SlotKey,
} from "@/data/seed/sponsoring"
import { BackButton } from "@/components/kit/BackButton"
import { Switch, TierBadge, ExplainCard, SectionTitle } from "@/features/sponsoring/ui"

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
 * Screen 3 — offer creation / edit form + sticky live preview.
 *
 * The only real math in the prototype: the rotation share of each sponsor is
 * points / Σ(points × seats) across ALL offers (existing ones plus this draft).
 * It recomputes on every keystroke of `points` or `seats`.
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

  const setSlot = (key: SlotKey, patch: Partial<OfferSlot>) =>
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
        {editing ? "Modifier l'offre" : "Nouvelle offre"}
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
              <Field
                label="Nom de l'offre"
                hint="Le nom que verront vos partenaires."
              >
                <input
                  className={inputCls}
                  placeholder="Or"
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

              <Field label="Couleur du badge">
                <div className="flex items-center gap-2.5">
                  {PRESET_COLORS.map((c) => {
                    const active = draft.color === c
                    return (
                      <button
                        key={c}
                        type="button"
                        aria-label={`Couleur ${c}`}
                        onClick={() => set("color", c)}
                        className={cn(
                          "size-8 rounded-full transition-transform",
                          active
                            ? "ring-2 ring-ink ring-offset-2 ring-offset-background"
                            : "hover:scale-110",
                        )}
                        style={{ backgroundColor: c }}
                      />
                    )
                  })}
                </div>
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

          {/* Places disponibles */}
          <section>
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
          </section>

          {/* Points de priorité */}
          <section>
            <SectionTitle>Points de priorité</SectionTitle>
            <div className="flex flex-col gap-3.5">
              <Field label="Points de priorité">
                <Num
                  value={draft.points}
                  onChange={(v) => set("points", v ?? 1)}
                  min={1}
                  suffix="points"
                />
              </Field>
              <ExplainCard title="À quoi servent les points ?">
                <p>
                  Les points définissent le poids d'un partenaire dans la
                  rotation des espaces publicitaires. Ils ne sont pas un
                  pourcentage : c'est le rapport entre les offres qui compte.
                </p>
                <p>
                  Une offre à 100 points est vue 10 fois plus souvent qu'une
                  offre à 10 points.
                </p>
                <p>
                  Le pourcentage exact est calculé automatiquement en fonction
                  de toutes vos offres et de leurs places. Il apparaît dans
                  l'aperçu à droite.
                </p>
                <p className="italic text-ink-disabled">
                  Repère : Or 100 · Argent 40 · Bronze 10.
                </p>
              </ExplainCard>
            </div>
          </section>

          {/* Espaces publicitaires */}
          <section>
            <SectionTitle
              hint={
                /* New tab: keeps the in-progress draft intact. */
                <a
                  href="/sponsoring/emplacements"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 font-ui text-[0.72rem] font-medium text-info normal-case transition-opacity hover:opacity-80"
                >
                  <ExternalLink size={12} /> Voir les espaces
                </a>
              }
            >
              Espaces publicitaires
            </SectionTitle>
            <div className="overflow-hidden rounded-lg border border-border">
              {SLOT_DEFS.map((slot, i) => {
                const s = draft.slots[slot.key]
                return (
                  <div key={slot.key}>
                    <div
                      className={cn(
                        "flex items-start gap-3.5 px-4 py-3.5",
                        i > 0 && "border-t border-border",
                      )}
                    >
                      <div className="pt-0.5">
                        <Switch
                          checked={s.enabled}
                          onChange={(v) => setSlot(slot.key, { enabled: v })}
                          label={slot.label}
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-body text-[0.86rem] text-ink">
                          {slot.label}
                        </div>
                        <div className="font-body text-[0.75rem] leading-snug text-ink-muted">
                          {slot.description}
                        </div>
                      </div>

                      {/* Right control, only when enabled */}
                      {s.enabled ? (
                        <div className="shrink-0 pt-0.5">
                          {slot.allocation === "cumulative" ? (
                            <span className="inline-flex items-center rounded-pill border border-border bg-accent px-2.5 py-1 font-ui text-[0.66rem] font-medium tracking-[0.04em] text-ink-muted uppercase">
                              Toujours visible
                            </span>
                          ) : slot.allocation === "rotational" ? (
                            <span className="inline-flex items-center rounded-pill border border-brand-blue-600/30 bg-brand-blue-600/10 px-2.5 py-1 font-ui text-[0.72rem] font-medium text-brand-blue-600 tabular-nums">
                              {pct(share)}
                            </span>
                          ) : (
                            <div className="w-[150px]">
                              <Num
                                value={s.qty}
                                onChange={(v) =>
                                  setSlot(slot.key, { qty: v ?? 0 })
                                }
                                min={0}
                                suffix={slot.unit}
                              />
                            </div>
                          )}
                        </div>
                      ) : null}
                    </div>

                    {slot.key === "notification" && s.enabled ? (
                      <div className="flex items-start gap-2 border-t border-border bg-warning/5 px-4 py-2.5">
                        <AlertTriangle
                          size={14}
                          className="mt-0.5 shrink-0 text-warning"
                        />
                        <p className="font-body text-[0.75rem] leading-snug text-warning">
                          Les notifications sont l'espace le plus intrusif.
                          Limitez-les pour préserver l'expérience des familles.
                        </p>
                      </div>
                    ) : null}
                  </div>
                )
              })}
            </div>
          </section>

          {/* Règles */}
          <section>
            <SectionTitle>Règles</SectionTitle>
            <div className="flex flex-col gap-4">
              <div className="rounded-lg border border-border px-4 py-3.5">
                <div className="flex items-start gap-3.5">
                  <div className="pt-0.5">
                    <Switch
                      checked={draft.exclusive}
                      onChange={(v) => set("exclusive", v)}
                      label="Exclusivité de catégorie"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-body text-[0.86rem] text-ink">
                      Exclusivité de catégorie
                    </div>
                    <div className="font-body text-[0.75rem] leading-snug text-ink-muted">
                      Aucun autre sponsor de cette catégorie ne pourra signer
                      tant que ce contrat est actif.
                    </div>
                  </div>
                </div>
                {draft.exclusive ? (
                  <div className="mt-3.5 pl-[52px]">
                    <Field label="Catégorie">
                      <input
                        className={inputCls}
                        placeholder="Équipementier"
                        value={draft.exclusiveCategory}
                        onChange={(e) =>
                          set("exclusiveCategory", e.target.value)
                        }
                      />
                    </Field>
                  </div>
                ) : null}
              </div>

              <div className="flex items-start gap-3.5 rounded-lg border border-border px-4 py-3.5">
                <div className="pt-0.5">
                  <Switch
                    checked={draft.appearsInDirectory}
                    onChange={(v) => set("appearsInDirectory", v)}
                    label="Afficher dans la page partenaires"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-body text-[0.86rem] text-ink">
                    Afficher dans la page partenaires
                  </div>
                  <div className="font-body text-[0.75rem] leading-snug text-ink-muted">
                    Désactivez pour les annonceurs ponctuels qui ne sont pas des
                    partenaires du club.
                  </div>
                </div>
              </div>
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
              {editing ? "Enregistrer" : "Créer l'offre"}
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
  const rotational = SLOT_DEFS.filter(
    (s) => s.allocation === "rotational" && draft.slots[s.key].enabled,
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
          <TierBadge name={draft.name || "Nom de l'offre"} color={draft.color} />
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

        {/* Visibilité par partenaire */}
        <div>
          <h3 className="font-ui text-[0.7rem] font-medium tracking-[0.08em] text-ink-muted uppercase">
            Visibilité par partenaire
          </h3>
          {rotational.length === 0 ? (
            <p className="mt-2.5 font-body text-[0.78rem] text-ink-disabled">
              Activez un espace en rotation (bannière calendrier, fil d'accueil)
              pour voir la visibilité par partenaire.
            </p>
          ) : (
            <div className="mt-3 flex flex-col gap-3">
              {rotational.map((s) => (
                <div key={s.key}>
                  <div className="flex items-center justify-between font-body text-[0.78rem]">
                    <span className="text-ink-subtle">{s.label}</span>
                    <span className="text-ink tabular-nums">{pct(share)}</span>
                  </div>
                  <div className="mt-1.5 h-[6px] overflow-hidden rounded bg-accent">
                    <div
                      className="h-full rounded bg-info transition-[width] duration-300"
                      style={{ width: `${Math.min(share * 100, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
          <p className="mt-3 font-body text-[0.72rem] leading-snug text-ink-disabled">
            Calculé à partir de vos offres actuelles. Ce pourcentage évolue si
            vous ajoutez d'autres offres ou d'autres places.
          </p>
        </div>

        <p className="border-t border-border pt-4 font-body text-[0.72rem] text-ink-disabled/70">
          Garantie contractuelle : {pct(share)} minimum par partenaire{" "}
          {draft.name || "Or"}.
        </p>
      </div>
    </div>
  )
}
