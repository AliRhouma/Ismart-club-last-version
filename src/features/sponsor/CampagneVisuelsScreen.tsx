import { useState, type ReactNode } from "react"
import { Navigate, useLocation, useNavigate, useParams } from "react-router-dom"
import {
  Check,
  ImageIcon,
  Link2,
  Pencil,
  Rocket,
  Upload,
  Smartphone,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { SLOT_BY_KEY, type SlotKey } from "@/data/seed/sponsoring"
import { BackButton } from "@/components/kit/BackButton"
import { FormSheet } from "@/components/kit/FormSheet"
import { TierBadge } from "@/features/sponsoring/ui"
import { TIER_COLOR } from "@/features/sponsor/mock"
import {
  AdSlot,
  AnnuaireMock,
  CalendarMock,
  EmplacementCard,
  FeedMock,
  MatchMock,
  NotificationMock,
  PhoneFrame,
  SplashMock,
  WebFrame,
  Line,
} from "@/features/sponsoring/emplacementMocks"
import { Creative, EditableCreative, IconButton } from "@/features/sponsoring/campaignUi"
import {
  CAMPAIGN_HEADLINES,
  draftFromCampaign,
  OBJECTIFS,
  SPONSOR_CAMPAIGNS,
  type CampaignDraft,
  type DraftSlot,
} from "@/features/sponsor/campagneMock"

const inputCls =
  "w-full rounded-md border border-input bg-transparent px-3.5 py-2.5 font-body text-sm text-ink outline-none transition-colors placeholder:text-ink-disabled focus:border-border-focus"

/**
 * Sponsor space — step 3: place a visual in each ad space the club's offer
 * grants, exactly as "Espaces publicitaires" shows them. Empty slots read
 * "Espace disponible"; filling one draws the creative in the real surface.
 *
 * The draft arrives through the router's `state` (no store — see campagneMock).
 * Editing a slot opens the centered modal: visuel + accroche + lien.
 */
export function CampagneVisuelsScreen() {
  const navigate = useNavigate()
  const location = useLocation() as { state?: { draft?: CampaignDraft } }
  const { id } = useParams<{ id: string }>()

  /* Two entries into the same editor: a fresh draft handed over by the wizard,
     or an existing campaign opened from the list. */
  const existing = id ? SPONSOR_CAMPAIGNS.find((c) => c.id === id) : undefined
  const [draft, setDraft] = useState<CampaignDraft | null>(
    location.state?.draft ??
      (existing
        ? draftFromCampaign(existing, CAMPAIGN_HEADLINES[existing.id] ?? [])
        : null),
  )
  const [editing, setEditing] = useState<SlotKey | null>(null)
  const [done, setDone] = useState(false)

  // Landed here without walking the wizard (a refresh) — start it over.
  if (!draft) return <Navigate to="/sponsor/campagnes/nouvelle" replace />

  const isNew = !existing

  const filled = draft.slots.filter((s) => s.image !== "").length
  const objectif = OBJECTIFS.find((o) => o.key === draft.objectif)!

  const saveSlot = (key: SlotKey, patch: Partial<DraftSlot>) =>
    setDraft((d) =>
      d
        ? {
            ...d,
            slots: d.slots.map((s) => (s.key === key ? { ...s, ...patch } : s)),
          }
        : d,
    )

  return (
    <div className="mx-auto max-w-5xl">
      <BackButton
        to={isNew ? "/sponsor/campagnes/nouvelle" : "/sponsor/campagnes"}
        label={isNew ? "Retour à la campagne" : "Retour aux campagnes"}
      />

      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <TierBadge
              name={draft.tier}
              color={TIER_COLOR[draft.tier]}
              size="sm"
            />
            <span
              className="size-2.5 rounded-full"
              style={{ backgroundColor: draft.color }}
            />
          </div>
          <h1 className="mt-2.5 font-ui text-2xl font-semibold text-ink">
            {draft.name}
          </h1>
          <p className="mt-1.5 font-body text-sm text-ink-muted">
            {draft.club} · {objectif.label} · {draft.slots.length} espaces
            publicitaires
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span className="font-body text-[0.76rem] text-ink-disabled tabular-nums">
            {filled}/{draft.slots.length} espaces remplis
          </span>
          <button
            type="button"
            onClick={() => setDone(true)}
            className="inline-flex items-center gap-1.5 rounded-md bg-brand px-4 py-2 font-ui text-sm font-medium text-ink-inverted shadow-glow transition-colors hover:bg-brand-dim"
          >
            {isNew ? (
              <>
                <Rocket size={16} /> Lancer la campagne
              </>
            ) : (
              <>
                <Check size={16} /> Enregistrer
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Dates band ────────────────────────────────────────────────── */}
      <div className="mt-7 flex flex-wrap items-end justify-between gap-4 rounded-lg border border-border px-5 py-5">
        <DateBlock label="Début" value={draft.startDate || "—"} />
        <div className="font-body text-[0.76rem] text-ink-disabled">
          Période de diffusion
        </div>
        <DateBlock label="Fin" value={draft.endDate || "—"} align="right" />
      </div>

      <p className="mt-6 font-body text-sm text-ink-muted">
        Cliquez sur un espace pour y placer votre visuel et le lien ouvert au
        clic. Les espaces laissés vides ne diffuseront rien.
      </p>

      {/* ── The surfaces the tier grants ──────────────────────────────── */}
      <div className="mt-5 grid grid-cols-1 gap-8 lg:grid-cols-2">
        {draft.slots.map((slot) => (
          <EmplacementCard
            key={slot.key}
            slotKey={slot.key}
            headerRight={
              slot.image ? (
                <IconButton
                  icon={Pencil}
                  label="Modifier cet espace"
                  onClick={() => setEditing(slot.key)}
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setEditing(slot.key)}
                  className="inline-flex items-center gap-1.5 rounded-sm border border-input px-2.5 py-1.5 font-ui text-[0.72rem] font-medium text-ink transition-colors hover:border-border-strong hover:bg-surface-hover"
                >
                  <Upload size={12} /> Ajouter
                </button>
              )
            }
            footer={
              slot.image ? (
                <SlotSummary slot={slot} onEdit={() => setEditing(slot.key)} />
              ) : (
                <p className="font-body text-[0.72rem] text-ink-disabled">
                  Aucun visuel — cet espace restera vide.
                </p>
              )
            }
          >
            <SlotMock
              slot={slot}
              sponsor="Délice Danone"
              color={draft.color}
              onEdit={() => setEditing(slot.key)}
            />
          </EmplacementCard>
        ))}
      </div>

      {/* ── Slot editor ───────────────────────────────────────────────── */}
      {editing ? (
        <SlotModal
          slot={draft.slots.find((s) => s.key === editing)!}
          onClose={() => setEditing(null)}
          onSave={(patch) => {
            saveSlot(editing, patch)
            setEditing(null)
          }}
        />
      ) : null}

      {/* ── Launch confirmation ───────────────────────────────────────── */}
      <FormSheet
        open={done}
        onOpenChange={setDone}
        title={isNew ? "Campagne lancée" : "Modifications enregistrées"}
        description={`${draft.name} sera diffusée sur ${draft.club} du ${draft.startDate || "—"} au ${draft.endDate || "—"}.`}
        submitLabel="Voir mes campagnes"
        cancelLabel="Continuer à éditer"
        onSubmit={() => navigate("/sponsor/campagnes")}
      >
        <div className="flex items-start gap-3 rounded-md border border-border bg-surface-nested px-4 py-3.5">
          <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-success/10 text-success">
            <Check size={14} />
          </span>
          <p className="font-body text-[0.8rem] leading-relaxed text-ink-muted">
            {filled} espace{filled > 1 ? "s" : ""} sur {draft.slots.length}{" "}
            porte{filled > 1 ? "nt" : ""} un visuel. Le club validera vos
            créations avant la mise en ligne.
          </p>
        </div>
      </FormSheet>
    </div>
  )
}

/* ── The slot editor modal ──────────────────────────────────────────────── */
function SlotModal({
  slot,
  onClose,
  onSave,
}: {
  slot: DraftSlot
  onClose: () => void
  onSave: (patch: Partial<DraftSlot>) => void
}) {
  const def = SLOT_BY_KEY[slot.key]
  const [image, setImage] = useState(slot.image)
  const [headline, setHeadline] = useState(slot.headline)
  const [link, setLink] = useState(slot.link)

  return (
    <FormSheet
      open
      onOpenChange={(next) => !next && onClose()}
      title={def.label}
      description={def.description}
      submitLabel="Enregistrer l'espace"
      submitDisabled={image === ""}
      onSubmit={() => onSave({ image, headline, link })}
    >
      <div className="flex flex-col gap-5">
        {/* Not a <label>: a wrapping label would steal the upload button's
            accessible name. */}
        <ModalField label="Visuel" hint="PNG ou JPG, 2 Mo maximum." plain>
          {image ? (
            <div className="flex items-center gap-3 rounded-md border border-border bg-surface-nested px-3 py-2.5">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-sm bg-surface text-info">
                <ImageIcon size={14} />
              </span>
              <span className="min-w-0 flex-1 truncate font-body text-[0.8rem] text-ink-subtle">
                {image}
              </span>
              <button
                type="button"
                onClick={() => setImage("")}
                className="shrink-0 rounded-sm px-1.5 py-0.5 font-ui text-[0.7rem] font-medium tracking-[0.04em] text-info uppercase transition-colors hover:bg-surface-hover"
              >
                Retirer
              </button>
            </div>
          ) : (
            /* No network in the prototype: "uploading" just names a file. */
            <button
              type="button"
              onClick={() => setImage(`${slot.key}-visuel.png`)}
              className="flex w-full flex-col items-center justify-center gap-1.5 rounded-md border border-dashed border-border-strong px-4 py-7 transition-colors hover:border-info hover:bg-info/5"
            >
              <Upload size={18} className="text-ink-muted" />
              <span className="font-ui text-[0.78rem] font-medium text-ink">
                Envoyer un visuel
              </span>
              <span className="font-body text-[0.72rem] text-ink-disabled">
                ou glissez votre fichier ici
              </span>
            </button>
          )}
        </ModalField>

        <ModalField label="Accroche" hint="Texte affiché sur le visuel.">
          <input
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            placeholder="Bien grandir, bien jouer"
            className={inputCls}
          />
        </ModalField>

        <ModalField label="Lien au clic" hint="Où le visiteur arrive après le clic.">
          <div className="relative flex items-center">
            <Link2
              size={14}
              className="pointer-events-none absolute left-3.5 text-ink-disabled"
            />
            <input
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://votre-site.tn/campagne"
              className={cn(inputCls, "pl-9 font-mono text-[0.8rem]")}
            />
          </div>
        </ModalField>
      </div>
    </FormSheet>
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

/* ── Under-mock summary of a filled slot ────────────────────────────────── */
function SlotSummary({ slot, onEdit }: { slot: DraftSlot; onEdit: () => void }) {
  return (
    <div className="flex items-center gap-2.5 rounded-md border border-border bg-surface-nested px-3 py-2.5">
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
  )
}

/* ── Header piece ───────────────────────────────────────────────────────── */
function DateBlock({
  label,
  value,
  align,
}: {
  label: string
  value: string
  align?: "right"
}) {
  return (
    <div className={align === "right" ? "text-right" : undefined}>
      <div className="font-ui text-[0.62rem] font-medium tracking-[0.08em] text-ink-muted uppercase">
        {label}
      </div>
      <div className="mt-1 font-display text-lg font-semibold text-ink">
        {value}
      </div>
    </div>
  )
}

/* ── The slot, drawn in its real surface: empty or carrying the creative ── */
function SlotMock({
  slot,
  sponsor,
  color,
  onEdit,
}: {
  slot: DraftSlot
  sponsor: string
  color: string
  onEdit: () => void
}) {
  const empty = slot.image === ""

  /** A filled creative gets the hover edit affordances. */
  const creative = (className: string, compact?: boolean) => (
    <EditableCreative onEditImage={onEdit} onEditLink={onEdit}>
      <Creative
        name={sponsor}
        headline={slot.headline || slot.image}
        color={color}
        className={className}
        compact={compact}
      />
    </EditableCreative>
  )

  switch (slot.key) {
    case "partners_page":
      return (
        <WebFrame title="ismartclub.tn — Nos partenaires">
          <AnnuaireMock
            slot={
              empty ? (
                <button
                  type="button"
                  onClick={onEdit}
                  className="flex size-full flex-col items-center justify-center gap-1 rounded-md border border-dashed border-info/40 bg-info/5 text-info transition-colors hover:bg-info/10"
                >
                  <span className="font-ui text-[0.6rem] font-medium">
                    Disponible
                  </span>
                </button>
              ) : (
                creative("size-full", true)
              )
            }
          />
        </WebFrame>
      )

    case "calendar_banner":
      return (
        <PhoneFrame>
          <CalendarMock
            slot={
              empty ? (
                <EmptySlot onEdit={onEdit} sub="Bannière · 320×80" />
              ) : (
                creative("h-[54px]", true)
              )
            }
          />
        </PhoneFrame>
      )

    case "home_feed":
      return (
        <PhoneFrame>
          <FeedMock
            slot={
              empty ? (
                <EmptySlot onEdit={onEdit} label="Carte sponsorisée" />
              ) : (
                creative("h-[86px]")
              )
            }
          />
        </PhoneFrame>
      )

    case "match_detail":
      return (
        <PhoneFrame>
          <MatchMock
            slot={
              empty ? (
                <EmptySlot onEdit={onEdit} label="Match présenté par…" />
              ) : (
                creative("h-[52px]", true)
              )
            }
          />
        </PhoneFrame>
      )

    case "splash":
      return (
        <PhoneFrame dark>
          <SplashMock
            slot={
              empty ? (
                <EmptySlot
                  onEdit={onEdit}
                  icon={Smartphone}
                  label="Écran d'ouverture"
                  sub="Plein écran · 3 s"
                  tall
                />
              ) : (
                creative("h-[240px] w-full")
              )
            }
          />
        </PhoneFrame>
      )

    case "notification":
      return (
        <PhoneFrame dark>
          <NotificationMock
            slot={
              empty ? (
                <EmptySlot onEdit={onEdit} label="Notification sponsor" />
              ) : (
                <EditableCreative onEditImage={onEdit} onEditLink={onEdit}>
                  <div className="rounded-xl border border-border-strong bg-surface px-3 py-2.5">
                    <div className="flex items-center gap-2">
                      <span
                        className="flex size-5 items-center justify-center rounded-[4px] font-ui text-[0.45rem] font-semibold text-white"
                        style={{ backgroundColor: color }}
                      >
                        {sponsor.slice(0, 2).toUpperCase()}
                      </span>
                      <span className="truncate font-ui text-[0.6rem] font-medium text-ink">
                        {sponsor}
                      </span>
                      <span className="ml-auto font-body text-[0.5rem] text-ink-disabled">
                        maintenant
                      </span>
                    </div>
                    <p className="mt-1.5 font-body text-[0.6rem] leading-snug text-ink-subtle">
                      {slot.headline || slot.image}
                    </p>
                  </div>
                </EditableCreative>
              )
            }
          />
        </PhoneFrame>
      )

    default:
      return <Line />
  }
}

/** The empty "Espace disponible" placeholder, made clickable. */
function EmptySlot({
  onEdit,
  icon,
  label,
  sub,
  tall,
}: {
  onEdit: () => void
  icon?: typeof Smartphone
  label?: string
  sub?: string
  tall?: boolean
}) {
  return (
    <button type="button" onClick={onEdit} className="w-full">
      <AdSlot
        icon={icon}
        label={label}
        sub={sub ?? "Espace disponible"}
        tall={tall}
        className="w-full transition-colors hover:bg-info/10"
      />
    </button>
  )
}
