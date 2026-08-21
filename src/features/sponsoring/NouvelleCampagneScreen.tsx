import { useMemo, useState, type ReactNode } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronLeft,
  Handshake,
  ImageIcon,
  Link2,
  MessageSquare,
  Pencil,
  Plus,
  Ruler,
  SlidersHorizontal,
  Target,
  Upload,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { todayISO } from "@/lib/format"
import { useData } from "@/data/useData"
import {
  AUDIENCE_GENDERS,
  AUDIENCE_TYPES,
  SLOT_BY_KEY,
  SLOT_DEFS,
  activeSlots,
  audienceSummary,
  blankCampaignDraft,
  buildCampaign,
  slotIsReady,
  type Audience,
  type CampaignDraft,
  type DraftSlot,
  type Partner,
  type SlotKey,
} from "@/data/seed/sponsoring"
import { BackButton } from "@/components/kit/BackButton"
import { PageHeader } from "@/components/kit/PageHeader"
import { Avatar } from "@/components/kit/Avatar"
import { EmptyState } from "@/components/kit/EmptyState"
import { FormSheet } from "@/components/kit/FormSheet"
import { EmplacementCard } from "@/features/sponsoring/emplacementMocks"
import { SurfacePair } from "@/features/sponsoring/appSurfaces"
import { SectionTitle, Switch } from "@/features/sponsoring/ui"

const inputCls =
  "w-full rounded-md border border-input bg-transparent px-3.5 py-2.5 font-body text-sm text-ink outline-none transition-colors placeholder:text-ink-disabled focus:border-border-focus"

/**
 * Sponsoring ▸ Campagnes ▸ Nouvelle campagne — the club admin creates a
 * campaign himself, from his own account, for one of his partenaires.
 *
 *   1. Le partenaire — a campaign always belongs to one; its offre decides the
 *      colour the creatives wear.
 *   2. La campagne — a name and two dates. "Configuration avancée" is folded
 *      away: a campaign speaks to the whole club until the admin decides
 *      otherwise, so the ciblage fields only exist once he opens them.
 *   3. Les emplacements — the five real surfaces of the app (Accueil,
 *      Planification, Matchs, Messagerie, Notification), each drawn in BOTH
 *      versions, web and mobile, at its own dimension. Every space carries its
 *      own activation switch: a campaign rarely runs everywhere.
 *
 * "Créer la campagne" writes to the store and opens the campaign on its
 * partenaire. References sponsor/CampagneVisuelsScreen (slot modal, dates band)
 * and EmplacementsScreen (surface cards).
 */
export function NouvelleCampagneScreen() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { partners, offers, categories, addCampaign } = useData()

  // Coming from a partenaire's accueil ("Créer une campagne") pre-picks them.
  const preset = params.get("partenaire")
  const presetPartner = partners.find((p) => p.id === preset) ?? null

  const [draft, setDraft] = useState<CampaignDraft>(() =>
    blankCampaignDraft(
      presetPartner?.id ?? "",
      offers.find((o) => o.id === presetPartner?.offerId)?.color,
    ),
  )
  const [step, setStep] = useState<1 | 2 | 3>(presetPartner ? 2 : 1)
  const [editing, setEditing] = useState<SlotKey | null>(null)

  const set = (patch: Partial<CampaignDraft>) =>
    setDraft((d) => ({ ...d, ...patch }))

  const setAudience = (patch: Partial<Audience>) =>
    setDraft((d) => ({ ...d, audience: { ...d.audience, ...patch } }))

  const setSlot = (key: SlotKey, patch: Partial<DraftSlot>) =>
    setDraft((d) => ({
      ...d,
      slots: { ...d.slots, [key]: { ...d.slots[key], ...patch } },
    }))

  const partner = partners.find((p) => p.id === draft.partnerId) ?? null

  const active = useMemo(() => activeSlots(draft), [draft])
  /** Catégorie names as the club writes them — real data, not a made-up list. */
  const categoryNames = useMemo(
    () => categories.map((c) => c.nom).filter((n) => n !== "FFF"),
    [categories],
  )

  const datesOk =
    Boolean(draft.start) &&
    Boolean(draft.end) &&
    Date.parse(draft.end) >= Date.parse(draft.start)
  const periodOk = Boolean(partner) && draft.name.trim() !== "" && datesOk
  const ready = periodOk && active.length > 0

  const create = () => {
    if (!ready || !partner) return
    const id = addCampaign(buildCampaign(draft))
    navigate(`/sponsoring/partenaires/${partner.id}/campagnes/${id}`, {
      state: { toast: `Campagne « ${draft.name.trim()} » créée` },
    })
  }

  const pick = (p: Partner) => {
    // The creatives wear the colour of the offre the partenaire signed.
    const color = offers.find((o) => o.id === p.offerId)?.color
    set({ partnerId: p.id, color: color ?? draft.color })
    setStep(2)
  }

  /* No partenaire yet → a campaign has no one to run for. */
  if (partners.length === 0) {
    return (
      <div className="mx-auto max-w-3xl">
        <BackButton to="/sponsoring/campagnes" label="Retour aux campagnes" />
        <PageHeader title="Nouvelle campagne" />
        <div className="mt-6 rounded-lg border border-border">
          <EmptyState
            icon={Handshake}
            title="Aucun partenaire pour l'instant"
            description="Une campagne se diffuse toujours au nom d'un partenaire. Ajoutez-en un pour pouvoir en créer une."
            action={
              <button
                type="button"
                onClick={() => navigate("/sponsoring/partenaires")}
                className="inline-flex items-center gap-1.5 rounded-md bg-brand px-4 py-2 font-ui text-sm font-medium text-ink-inverted shadow-glow transition-colors hover:bg-brand-dim"
              >
                <Plus size={16} /> Ajouter un partenaire
              </button>
            }
          />
        </div>
      </div>
    )
  }

  return (
    <div className={cn("mx-auto", step === 3 ? "max-w-5xl" : "max-w-3xl")}>
      {step === 3 ? (
        <StepBack label="Retour à la campagne" onClick={() => setStep(2)} />
      ) : (
        <BackButton to="/sponsoring/campagnes" label="Retour aux campagnes" />
      )}

      <PageHeader
        title="Nouvelle campagne"
        subtitle="Lancez une campagne pour l'un de vos partenaires, sans attendre sa demande."
      />

      <Steps step={step} />

      {/* ── 1. Le partenaire ────────────────────────────────────────────── */}
      {step === 1 ? (
        <div className="mt-8">
          <SectionTitle hint={`${partners.length} partenaires`}>
            Pour quel partenaire ?
          </SectionTitle>
          <p className="-mt-2 mb-4 font-body text-[0.8rem] text-ink-muted">
            La campagne sera diffusée en son nom dans les espaces publicitaires
            du club.
          </p>

          <div className="flex flex-col gap-3">
            {partners.map((p) => (
              <PartnerRow key={p.id} partner={p} onSelect={pick} />
            ))}
          </div>
        </div>
      ) : null}

      {/* ── 2. La campagne ──────────────────────────────────────────────── */}
      {step === 2 ? (
        <div className="mt-8 flex flex-col gap-9">
          <PartnerRecap partner={partner} onChange={() => setStep(1)} />

          <div>
            <SectionTitle>La campagne</SectionTitle>
            <div className="flex flex-col gap-5">
              <Field label="Nom de la campagne">
                <input
                  autoFocus
                  value={draft.name}
                  onChange={(e) => set({ name: e.target.value })}
                  placeholder="Campagne Rentrée 2026"
                  className={inputCls}
                />
              </Field>

              <Field
                label="Prix de la campagne"
                hint="Le montant facturé au partenaire. Laissez vide pour un échange ou un partenariat institutionnel."
              >
                <div className="relative flex items-center">
                  <input
                    inputMode="numeric"
                    value={draft.price === null ? "" : String(draft.price)}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, "")
                      set({ price: digits === "" ? null : Number(digits) })
                    }}
                    placeholder="—"
                    className={cn(inputCls, "pr-14 tabular-nums")}
                  />
                  <span className="pointer-events-none absolute right-3.5 font-ui text-[0.76rem] font-medium text-ink-disabled">
                    DT
                  </span>
                </div>
              </Field>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Début" hint="Premier jour de diffusion.">
                  <input
                    type="date"
                    value={draft.start}
                    onChange={(e) => set({ start: e.target.value })}
                    className={cn(inputCls, "[color-scheme:dark]")}
                  />
                </Field>
                <Field
                  label="Fin"
                  hint={
                    draft.start && draft.end && !datesOk
                      ? "La fin doit suivre le début."
                      : "Dernier jour de diffusion."
                  }
                >
                  <input
                    type="date"
                    min={draft.start || todayISO()}
                    value={draft.end}
                    onChange={(e) => set({ end: e.target.value })}
                    className={cn(
                      inputCls,
                      "[color-scheme:dark]",
                      draft.start && draft.end && !datesOk && "border-danger",
                    )}
                  />
                </Field>
              </div>
            </div>
          </div>

          <AdvancedConfig
            audience={draft.audience}
            categories={categoryNames}
            onChange={setAudience}
          />

          <div className="flex items-center justify-between gap-4 border-t border-border pt-5">
            <span className="font-body text-[0.76rem] text-ink-disabled">
              {periodOk
                ? "Étape suivante : choisir les emplacements et leurs visuels."
                : "Renseignez un nom et les deux dates pour continuer."}
            </span>
            <button
              type="button"
              disabled={!periodOk}
              onClick={() => setStep(3)}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-brand px-4 py-2 font-ui text-sm font-medium text-ink-inverted shadow-glow transition-colors hover:bg-brand-dim disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none"
            >
              Continuer <ArrowRight size={16} />
            </button>
          </div>
        </div>
      ) : null}

      {/* ── 3. Où la campagne s'affiche ─────────────────────────────────── */}
      {step === 3 ? (
        <div className="mt-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <h2 className="font-ui text-2xl font-semibold text-ink">
                {draft.name}
              </h2>
              <p className="mt-1.5 font-body text-sm text-ink-muted">
                {partner?.name} · du {draft.start || "—"} au {draft.end || "—"}
                {draft.price !== null
                  ? ` · ${draft.price.toLocaleString("fr-FR")} DT`
                  : " · échange"}
              </p>
              <div className="mt-2.5 inline-flex items-center gap-1.5 rounded-pill border border-border bg-surface-nested px-2.5 py-1">
                <Target size={11} className="text-ink-disabled" />
                <span className="font-body text-[0.7rem] text-ink-muted">
                  {audienceSummary(draft.audience)}
                </span>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-3">
              <span className="font-body text-[0.76rem] text-ink-disabled tabular-nums">
                {active.length}/{SLOT_DEFS.length} emplacements actifs
              </span>
              <button
                type="button"
                disabled={!ready}
                onClick={create}
                className="inline-flex items-center gap-1.5 rounded-md bg-brand px-4 py-2 font-ui text-sm font-medium text-ink-inverted shadow-glow transition-colors hover:bg-brand-dim disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none"
              >
                <Check size={16} /> Créer la campagne
              </button>
            </div>
          </div>

          <p className="mt-6 font-body text-sm text-ink-muted">
            Activez les emplacements que le partenaire a achetés, puis placez le
            visuel de chaque version — web et mobile ont leurs propres
            dimensions. La messagerie et la notification ne prennent pas
            d'image : vous y écrivez le message que le parent lira.
          </p>

          {/* ── The five surfaces of the app ──────────────────────────── */}
          <div className="mt-6 flex flex-col gap-6">
            {SLOT_DEFS.map((def) => {
              const slot = draft.slots[def.key]
              const filled = slotIsReady(def.key, slot)
              const isMessage = def.medium === "message"
              return (
                <EmplacementCard
                  key={def.key}
                  slotKey={def.key}
                  badge={null}
                  headerRight={
                    <div className="flex items-center gap-3">
                      {slot.enabled ? (
                        <button
                          type="button"
                          onClick={() => setEditing(def.key)}
                          className="inline-flex items-center gap-1.5 rounded-sm border border-input px-2.5 py-1.5 font-ui text-[0.72rem] font-medium text-ink transition-colors hover:border-border-strong hover:bg-surface-hover"
                        >
                          {filled ? (
                            <>
                              <Pencil size={12} /> Modifier
                            </>
                          ) : isMessage ? (
                            <>
                              <MessageSquare size={12} /> Écrire
                            </>
                          ) : (
                            <>
                              <Upload size={12} /> Ajouter
                            </>
                          )}
                        </button>
                      ) : null}
                      <Switch
                        checked={slot.enabled}
                        onChange={(v) => setSlot(def.key, { enabled: v })}
                        label={`Activer ${def.label}`}
                      />
                    </div>
                  }
                  footer={
                    slot.enabled ? (
                      <SlotFooter
                        slotKey={def.key}
                        slot={slot}
                        onEdit={() => setEditing(def.key)}
                      />
                    ) : (
                      <p className="rounded-md border border-dashed border-border px-3 py-2.5 text-center font-body text-[0.72rem] text-ink-disabled">
                        Emplacement désactivé — la campagne ne s'y affichera pas.
                      </p>
                    )
                  }
                >
                  <div
                    className={cn(
                      "w-full transition-opacity",
                      !slot.enabled && "pointer-events-none opacity-35",
                    )}
                  >
                    <SurfacePair
                      slotKey={def.key}
                      placed={
                        isMessage
                          ? { web: true, mobile: true }
                          : {
                              web: slot.webImage !== "",
                              mobile: slot.mobileImage !== "",
                            }
                      }
                      ad={
                        slot.enabled && filled
                          ? {
                              sponsor: partner?.name ?? "",
                              color: draft.color,
                              headline: isMessage
                                ? slot.message
                                : draft.name || "Votre campagne",
                            }
                          : null
                      }
                      onEdit={
                        slot.enabled ? () => setEditing(def.key) : undefined
                      }
                    />
                  </div>
                </EmplacementCard>
              )
            })}
          </div>

          {/* ── Footer ────────────────────────────────────────────────── */}
          <div className="mt-9 flex items-center justify-between gap-4 border-t border-border pt-5">
            <span
              className={cn(
                "font-body text-[0.76rem]",
                ready ? "text-ink-disabled" : "text-warning",
              )}
            >
              {ready
                ? `${active.length} emplacement${active.length > 1 ? "s" : ""} · diffusion au nom de ${partner?.name}`
                : "Activez au moins un emplacement : sans emplacement, la campagne n'a nulle part où s'afficher."}
            </span>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => navigate("/sponsoring/campagnes")}
                className="rounded-md border border-input px-4 py-2 font-ui text-sm font-medium text-ink transition-colors hover:border-border-strong hover:bg-accent"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={!ready}
                onClick={create}
                className="inline-flex items-center gap-1.5 rounded-md bg-brand px-5 py-2 font-ui text-sm font-medium text-ink-inverted shadow-glow transition-colors hover:bg-brand-dim disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none"
              >
                <Check size={16} /> Créer la campagne
              </button>
            </div>
          </div>

          {editing ? (
            <SlotModal
              slotKey={editing}
              slot={draft.slots[editing]}
              partnerName={partner?.name ?? ""}
              onClose={() => setEditing(null)}
              onSave={(patch) => {
                setSlot(editing, patch)
                setEditing(null)
              }}
            />
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

/* ── Configuration avancée — folded away until it is asked for ──────────── */
function AdvancedConfig({
  audience,
  categories,
  onChange,
}: {
  audience: Audience
  categories: string[]
  onChange: (patch: Partial<Audience>) => void
}) {
  const isParent = audience.type === "parent"

  const toggleIn = (list: string[], value: string) =>
    list.includes(value) ? list.filter((v) => v !== value) : [...list, value]

  return (
    <div
      className={cn(
        "rounded-lg border transition-colors",
        audience.enabled ? "border-border-second" : "border-border",
      )}
    >
      <div className="flex items-center gap-3 px-4 py-3.5">
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-md border transition-colors",
            audience.enabled
              ? "border-border-second bg-surface-nested text-ink"
              : "border-border text-ink-disabled",
          )}
        >
          <SlidersHorizontal size={16} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-ui text-[0.88rem] font-medium text-ink">
              Configuration avancée
            </span>
            <span className="rounded-pill border border-border bg-accent px-1.5 py-0.5 font-ui text-[0.56rem] font-medium tracking-[0.06em] text-ink-muted uppercase">
              Optionnel
            </span>
          </div>
          <p className="mt-0.5 font-body text-[0.74rem] text-ink-muted">
            {audience.enabled
              ? audienceSummary(audience)
              : "Sans ciblage, la campagne s'adresse à tout le club."}
          </p>
        </div>
        <Switch
          checked={audience.enabled}
          onChange={(v) => onChange({ enabled: v })}
          label="Configuration avancée"
        />
      </div>

      {audience.enabled ? (
        <div className="flex flex-col gap-6 border-t border-border px-4 py-5">
          {/* ── Où ─────────────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Ville" hint="Laissez vide pour tout le club.">
              <input
                value={audience.city}
                onChange={(e) => onChange({ city: e.target.value })}
                placeholder="Tunis"
                className={inputCls}
              />
            </Field>
            <Field label="Adresse / quartier">
              <input
                value={audience.address}
                onChange={(e) => onChange({ address: e.target.value })}
                placeholder="El Menzah, Ariana"
                className={inputCls}
              />
            </Field>
          </div>

          {/* ── Qui ────────────────────────────────────────────────────── */}
          <Group label="Type de membre">
            <Segmented
              options={AUDIENCE_TYPES.map((t) => ({
                key: t.key,
                label: t.label,
              }))}
              value={audience.type}
              onChange={(v) => onChange({ type: v as Audience["type"] })}
            />
          </Group>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Group label="Sexe">
              <Segmented
                options={AUDIENCE_GENDERS.map((g) => ({
                  key: g.key,
                  label: g.label,
                }))}
                value={audience.gender}
                onChange={(v) => onChange({ gender: v as Audience["gender"] })}
              />
            </Group>
            <Group
              label={isParent ? "Âge du parent" : "Âge"}
              hint="En années."
            >
              <RangeInputs
                min={audience.ageMin}
                max={audience.ageMax}
                onMin={(v) => onChange({ ageMin: v })}
                onMax={(v) => onChange({ ageMax: v })}
              />
            </Group>
          </div>

          {!isParent ? (
            <Group
              label="Catégories"
              hint="Aucune sélection = toutes les catégories."
            >
              <Chips
                options={categories}
                selected={audience.categories}
                onToggle={(c) =>
                  onChange({ categories: toggleIn(audience.categories, c) })
                }
              />
            </Group>
          ) : (
            /* A parent is reached through his children — so the ciblage moves
               onto them: their age and their catégories, not his. */
            <div className="flex flex-col gap-5 rounded-md border border-border bg-surface-nested px-4 py-4">
              <p className="font-body text-[0.76rem] text-ink-muted">
                Les parents sont ciblés à travers leurs enfants : choisissez
                l'âge et les catégories des enfants concernés.
              </p>
              <Group label="Âge des enfants" hint="En années.">
                <RangeInputs
                  min={audience.childAgeMin}
                  max={audience.childAgeMax}
                  onMin={(v) => onChange({ childAgeMin: v })}
                  onMax={(v) => onChange({ childAgeMax: v })}
                />
              </Group>
              <Group
                label="Catégories des enfants"
                hint="Aucune sélection = toutes les catégories."
              >
                <Chips
                  options={categories}
                  selected={audience.childCategories}
                  onToggle={(c) =>
                    onChange({
                      childCategories: toggleIn(audience.childCategories, c),
                    })
                  }
                />
              </Group>
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}

/* ── The space editor — two artworks, or a message ──────────────────────── */
function SlotModal({
  slotKey,
  slot,
  partnerName,
  onClose,
  onSave,
}: {
  slotKey: SlotKey
  slot: DraftSlot
  partnerName: string
  onClose: () => void
  onSave: (patch: Partial<DraftSlot>) => void
}) {
  const def = SLOT_BY_KEY[slotKey]
  const [webImage, setWebImage] = useState(slot.webImage)
  const [mobileImage, setMobileImage] = useState(slot.mobileImage)
  const [message, setMessage] = useState(slot.message)
  const [link, setLink] = useState(slot.link)

  const isMessage = def.medium === "message"
  const incomplete = isMessage
    ? message.trim() === ""
    : webImage === "" && mobileImage === ""

  return (
    <FormSheet
      open
      onOpenChange={(next) => !next && onClose()}
      title={def.label}
      description={def.description}
      submitLabel="Enregistrer l'emplacement"
      submitDisabled={incomplete}
      onSubmit={() => onSave({ webImage, mobileImage, message, link })}
    >
      <div className="flex flex-col gap-5">
        {isMessage ? (
          <>
            {/* No artwork here: the app draws the message itself, under the
                partner's own name. */}
            <div className="flex items-center gap-2 rounded-md border border-border bg-surface-nested px-3 py-2.5">
              <MessageSquare size={14} className="shrink-0 text-info" />
              <span className="font-body text-[0.78rem] text-ink-subtle">
                Expéditeur : <span className="text-ink">{partnerName}</span> —
                aucun visuel, {slotKey === "messagerie" ? "la conversation" : "la notification"}{" "}
                reprend la mise en forme de l'app.
              </span>
            </div>

            <ModalField
              label={slotKey === "messagerie" ? "Message" : "Texte de la notification"}
              hint={
                slotKey === "messagerie"
                  ? "Ce que le parent lit dans sa liste de conversations."
                  : "Ce que le parent lit sous la cloche, en une ou deux lignes."
              }
            >
              <textarea
                autoFocus
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Un yaourt offert après chaque victoire"
                className={cn(inputCls, "resize-none leading-relaxed")}
              />
            </ModalField>
          </>
        ) : (
          <>
            <UploadField
              label="Visuel — version web"
              size={def.webSize ?? ""}
              value={webImage}
              onChange={setWebImage}
              file={`${slotKey}-web.png`}
            />
            <UploadField
              label="Visuel — version mobile"
              size={def.mobileSize ?? ""}
              value={mobileImage}
              onChange={setMobileImage}
              file={`${slotKey}-mobile.png`}
            />
          </>
        )}

        <ModalField label="Lien au clic" hint="Où le visiteur arrive après le clic.">
          <div className="relative flex items-center">
            <Link2
              size={14}
              className="pointer-events-none absolute left-3.5 text-ink-disabled"
            />
            <input
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://exemple.tn/campagne"
              className={cn(inputCls, "pl-9 font-mono text-[0.8rem]")}
            />
          </div>
        </ModalField>
      </div>
    </FormSheet>
  )
}

/** One artwork slot in the modal: its dimension, then the upload. */
function UploadField({
  label,
  size,
  value,
  onChange,
  file,
}: {
  label: string
  size: string
  value: string
  onChange: (v: string) => void
  /** The filename "uploading" produces — the prototype has no network. */
  file: string
}) {
  return (
    /* Not a <label>: a wrapping label would steal the upload button's name. */
    <ModalField label={label} plain>
      <div className="flex items-center gap-2 rounded-md border border-border bg-surface-nested px-3 py-2">
        <Ruler size={13} className="shrink-0 text-info" />
        <span className="font-body text-[0.74rem] text-ink-subtle">
          Dimension requise : <span className="text-ink">{size}</span>
        </span>
      </div>
      {value ? (
        <div className="mt-2 flex items-center gap-3 rounded-md border border-border px-3 py-2.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-sm bg-surface-nested text-info">
            <ImageIcon size={14} />
          </span>
          <span className="min-w-0 flex-1 truncate font-body text-[0.8rem] text-ink-subtle">
            {value}
          </span>
          <button
            type="button"
            onClick={() => onChange("")}
            className="shrink-0 rounded-sm px-1.5 py-0.5 font-ui text-[0.7rem] font-medium tracking-[0.04em] text-info uppercase transition-colors hover:bg-surface-hover"
          >
            Retirer
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => onChange(file)}
          className="mt-2 flex w-full flex-col items-center justify-center gap-1.5 rounded-md border border-dashed border-border-strong px-4 py-6 transition-colors hover:border-info hover:bg-info/5"
        >
          <Upload size={17} className="text-ink-muted" />
          <span className="font-ui text-[0.76rem] font-medium text-ink">
            Envoyer un visuel
          </span>
          <span className="font-body text-[0.7rem] text-ink-disabled">
            ou glissez votre fichier ici
          </span>
        </button>
      )}
    </ModalField>
  )
}

/* ── What an active space carries, under its mocks ──────────────────────── */
function SlotFooter({
  slotKey,
  slot,
  onEdit,
}: {
  slotKey: SlotKey
  slot: DraftSlot
  onEdit: () => void
}) {
  const def = SLOT_BY_KEY[slotKey]
  const ready = slotIsReady(slotKey, slot)

  if (!ready) {
    return (
      <button
        type="button"
        onClick={onEdit}
        className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-warning/40 bg-warning/5 px-3 py-2.5 font-body text-[0.74rem] text-warning transition-colors hover:bg-warning/10"
      >
        {def.medium === "message"
          ? "Écrivez le message diffusé dans cet emplacement"
          : "Ajoutez le visuel web et le visuel mobile"}
      </button>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {def.medium === "visuel" ? (
        <>
          <FileChip label="Web" value={slot.webImage} />
          <FileChip label="Mobile" value={slot.mobileImage} />
        </>
      ) : null}
      <div className="flex min-w-[12rem] flex-1 items-center gap-2.5 rounded-md border border-border bg-surface-nested px-3 py-2">
        <Link2 size={13} className="shrink-0 text-ink-disabled" />
        <span className="min-w-0 flex-1 truncate font-mono text-[0.7rem] text-ink-subtle">
          {slot.link || "Aucun lien"}
        </span>
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex shrink-0 items-center gap-1 rounded-sm px-1.5 py-0.5 font-ui text-[0.66rem] font-medium tracking-[0.04em] text-info uppercase transition-colors hover:bg-surface-hover"
        >
          <Pencil size={10} /> Modifier
        </button>
      </div>
    </div>
  )
}

function FileChip({ label, value }: { label: string; value: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm border px-2 py-1.5 font-body text-[0.68rem]",
        value
          ? "border-border bg-surface-nested text-ink-subtle"
          : "border-dashed border-border text-ink-disabled",
      )}
    >
      <ImageIcon size={11} className={value ? "text-info" : undefined} />
      {label} : {value || "manquant"}
    </span>
  )
}

/* ── Step rail ──────────────────────────────────────────────────────────── */
function Steps({ step }: { step: 1 | 2 | 3 }) {
  const items = [
    { n: 1, label: "Le partenaire" },
    { n: 2, label: "La campagne" },
    { n: 3, label: "Les emplacements" },
  ]
  return (
    <div className="mt-6 flex flex-wrap items-center gap-3">
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

/** Back control for an in-page step — BackButton's twin, without a route. */
function StepBack({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="mb-4 inline-flex size-9 items-center justify-center rounded-md border border-border text-ink-muted transition-colors hover:border-[var(--border-hover)] hover:bg-accent hover:text-ink focus:border-border-focus"
    >
      <ArrowLeft size={16} />
    </button>
  )
}

/* ── The partenaire picked in step 1, recapped and reversible ───────────── */
function PartnerRecap({
  partner,
  onChange,
}: {
  partner: Partner | null
  onChange: () => void
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-border px-4 py-3.5">
      <div className="flex min-w-0 items-center gap-3">
        <Avatar name={partner?.name ?? ""} size="lg" />
        <div className="min-w-0">
          <div className="truncate font-body text-[0.88rem] text-ink">
            {partner?.name}
          </div>
          <div className="mt-0.5 font-body text-[0.72rem] text-ink-disabled">
            Campagne diffusée au nom de ce partenaire
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={onChange}
        className="inline-flex shrink-0 items-center gap-1 rounded-sm px-1.5 py-0.5 font-ui text-[0.72rem] font-medium text-info transition-colors hover:bg-surface-hover"
      >
        <ChevronLeft size={12} /> Changer
      </button>
    </div>
  )
}

/* ── Step 1 — one selectable partenaire ─────────────────────────────────── */
function PartnerRow({
  partner,
  onSelect,
}: {
  partner: Partner
  onSelect: (p: Partner) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(partner)}
      className="group relative flex items-center gap-4 overflow-hidden rounded-lg border border-border bg-background px-4 py-3.5 text-left transition-colors hover:border-border-strong"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 origin-top scale-y-0 bg-surface transition-transform duration-[260ms] ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:scale-y-100"
      />

      <div className="relative z-10 flex w-full items-center gap-4">
        <Avatar name={partner.name} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="truncate font-body text-[0.9rem] text-ink transition-colors group-hover:text-brand-blue-600">
            {partner.name}
          </div>
          <div className="mt-0.5 truncate font-body text-[0.74rem] text-ink-disabled">
            {partner.description || "Aucune description"}
          </div>
        </div>
        <ArrowRight
          size={15}
          className="shrink-0 text-ink-disabled transition-colors group-hover:text-info"
        />
      </div>
    </button>
  )
}

/* ── Small form pieces ──────────────────────────────────────────────────── */
function Segmented({
  options,
  value,
  onChange,
}: {
  options: { key: string; label: string }[]
  value: string
  onChange: (key: string) => void
}) {
  return (
    <div className="inline-flex flex-wrap gap-1.5 rounded-md border border-border p-1">
      {options.map((o) => (
        <button
          key={o.key}
          type="button"
          onClick={() => onChange(o.key)}
          className={cn(
            "rounded-sm px-3 py-1.5 font-ui text-[0.76rem] font-medium transition-colors",
            value === o.key
              ? "bg-info text-ink-inverted"
              : "text-ink-muted hover:bg-surface-hover hover:text-ink",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

function Chips({
  options,
  selected,
  onToggle,
}: {
  options: string[]
  selected: string[]
  onToggle: (value: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((o) => {
        const on = selected.includes(o)
        return (
          <button
            key={o}
            type="button"
            onClick={() => onToggle(o)}
            className={cn(
              "rounded-pill border px-2.5 py-1 font-ui text-[0.72rem] font-medium transition-colors",
              on
                ? "border-info bg-info/10 text-info"
                : "border-border text-ink-muted hover:border-border-strong hover:text-ink",
            )}
          >
            {o}
          </button>
        )
      })}
    </div>
  )
}

function RangeInputs({
  min,
  max,
  onMin,
  onMax,
}: {
  min: string
  max: string
  onMin: (v: string) => void
  onMax: (v: string) => void
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        inputMode="numeric"
        value={min}
        onChange={(e) => onMin(e.target.value.replace(/\D/g, ""))}
        placeholder="6"
        className={cn(inputCls, "w-20 text-center tabular-nums")}
      />
      <span className="font-body text-[0.76rem] text-ink-disabled">à</span>
      <input
        inputMode="numeric"
        value={max}
        onChange={(e) => onMax(e.target.value.replace(/\D/g, ""))}
        placeholder="17"
        className={cn(inputCls, "w-20 text-center tabular-nums")}
      />
      <span className="font-body text-[0.76rem] text-ink-disabled">ans</span>
    </div>
  )
}

function Group({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="font-ui text-[0.7rem] font-medium tracking-[0.06em] text-ink-muted uppercase">
        {label}
      </span>
      {children}
      {hint ? (
        <span className="font-body text-[0.72rem] text-ink-disabled">
          {hint}
        </span>
      ) : null}
    </div>
  )
}

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

function ModalField({
  label,
  hint,
  children,
  plain,
}: {
  label: string
  hint?: string
  children: ReactNode
  /** Render a plain group instead of a <label> (for non-input controls). */
  plain?: boolean
}) {
  const Wrap = plain ? "div" : "label"
  return (
    <Wrap className="flex flex-col gap-1.5">
      <span className="font-ui text-[0.7rem] font-medium tracking-[0.06em] text-ink-muted uppercase">
        {label}
      </span>
      {children}
      {hint ? (
        <span className="font-body text-[0.72rem] text-ink-disabled">
          {hint}
        </span>
      ) : null}
    </Wrap>
  )
}
