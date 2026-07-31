import { useMemo, useState } from "react"
import { Check, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { useData } from "@/data/useData"
import {
  CAMPAIGN_COLORS,
  SLOT_DEFS,
  applyCampaignEdit,
  campaignEditDraft,
  num,
  type Campaign,
  type CampaignEdit,
  type SlotKey,
} from "@/data/seed/sponsoring"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { Creative } from "@/features/sponsoring/campaignUi"
import { SLOT_ICON, Switch } from "@/features/sponsoring/ui"

const inputCls =
  "w-full rounded-md border border-input bg-transparent px-3.5 py-2.5 font-body text-sm text-ink outline-none transition-colors placeholder:text-ink-disabled focus:border-border-focus"

/**
 * Modifier la configuration — one place for everything a campaign *is*: its
 * name, its période, the colour of its artwork, and the ad spaces it runs in
 * with their accroche and destination.
 *
 * It replaces the two narrow header actions ("Modifier les dates" / "Remplacer
 * les visuels"): the admin came here to change the campaign, not to guess which
 * of two buttons owns the field he's after.
 *
 * The figures are deliberately out of reach — a space kept on keeps its vues et
 * clics, a space switched on starts at zero. Referenced PartnerFormModal
 * (header / footer / field styling) and NouvelleCampagneScreen (the space rows).
 */
export function CampagneConfigModal({
  campaign,
  partnerName,
  onClose,
  onSaved,
}: {
  campaign: Campaign
  partnerName: string
  onClose: () => void
  onSaved: (msg: string) => void
}) {
  const { updateCampaign } = useData()

  const [draft, setDraft] = useState<CampaignEdit>(() =>
    campaignEditDraft(campaign),
  )

  const set = (patch: Partial<CampaignEdit>) =>
    setDraft((d) => ({ ...d, ...patch }))

  const setSlot = (key: SlotKey, patch: Partial<CampaignEdit["slots"][SlotKey]>) =>
    setDraft((d) => ({
      ...d,
      slots: { ...d.slots, [key]: { ...d.slots[key], ...patch } },
    }))

  const enabled = useMemo(
    () => SLOT_DEFS.filter((s) => draft.slots[s.key].enabled),
    [draft.slots],
  )

  // Switching a space off drops what it has already served — say so plainly.
  const losing = useMemo(
    () =>
      campaign.slots.filter(
        (s) => !draft.slots[s.key].enabled && s.views > 0,
      ),
    [campaign.slots, draft.slots],
  )

  const datesOk =
    Boolean(draft.start) &&
    Boolean(draft.end) &&
    Date.parse(draft.end) >= Date.parse(draft.start)
  const ready = draft.name.trim() !== "" && datesOk && enabled.length > 0

  const submit = () => {
    if (!ready) return
    updateCampaign(campaign.id, applyCampaignEdit(campaign, draft))
    onSaved(`Configuration de « ${draft.name.trim()} » mise à jour`)
    onClose()
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[88vh] flex-col gap-0 overflow-hidden rounded-xl border-border bg-surface p-0 sm:max-w-[620px]"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div className="min-w-0">
            <DialogTitle className="font-ui text-base font-medium text-ink">
              Modifier la configuration
            </DialogTitle>
            <DialogDescription className="mt-1.5 font-body text-[0.78rem] text-ink-muted">
              {campaign.name} · {partnerName}
            </DialogDescription>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="flex size-[30px] shrink-0 items-center justify-center rounded-sm border border-border text-ink-disabled transition-colors hover:border-border-strong hover:text-ink"
          >
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-5 py-5">
          <label className="flex flex-col gap-1.5">
            <span className="font-ui text-[0.7rem] font-medium tracking-[0.06em] text-ink-muted uppercase">
              Nom de la campagne
            </span>
            <input
              autoFocus
              value={draft.name}
              onChange={(e) => set({ name: e.target.value })}
              placeholder="Campagne Rentrée 2026"
              className={inputCls}
            />
          </label>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="font-ui text-[0.7rem] font-medium tracking-[0.06em] text-ink-muted uppercase">
                Début
              </span>
              <input
                type="date"
                value={draft.start}
                onChange={(e) => set({ start: e.target.value })}
                className={cn(inputCls, "[color-scheme:dark]")}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="font-ui text-[0.7rem] font-medium tracking-[0.06em] text-ink-muted uppercase">
                Fin
              </span>
              <input
                type="date"
                min={draft.start || undefined}
                value={draft.end}
                onChange={(e) => set({ end: e.target.value })}
                className={cn(
                  inputCls,
                  "[color-scheme:dark]",
                  !datesOk && draft.start && draft.end && "border-danger",
                )}
              />
              {!datesOk && draft.start && draft.end ? (
                <span className="font-body text-[0.72rem] text-danger">
                  La fin doit suivre le début.
                </span>
              ) : null}
            </label>
          </div>

          <div className="flex flex-col gap-2">
            <span className="font-ui text-[0.7rem] font-medium tracking-[0.06em] text-ink-muted uppercase">
              Couleur des visuels
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {CAMPAIGN_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={`Couleur ${c}`}
                  onClick={() => set({ color: c })}
                  className={cn(
                    "size-8 rounded-full border-2 transition-colors",
                    draft.color === c
                      ? "border-info"
                      : "border-transparent hover:border-border-strong",
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Les espaces */}
          <div>
            <div className="mb-3.5 flex items-baseline justify-between gap-3 border-b border-border pb-2">
              <h3 className="font-ui text-[0.72rem] font-medium tracking-[0.1em] text-ink-muted uppercase">
                Espaces publicitaires
              </h3>
              <span className="font-body text-[0.72rem] text-ink-disabled">
                {enabled.length} / {SLOT_DEFS.length} activés
              </span>
            </div>
            <div className="flex flex-col gap-3">
              {SLOT_DEFS.map((def) => (
                <SlotRow
                  key={def.key}
                  slotKey={def.key}
                  label={def.label}
                  description={def.description}
                  slot={draft.slots[def.key]}
                  fallback={draft.name}
                  partnerName={partnerName}
                  color={draft.color}
                  onChange={(patch) => setSlot(def.key, patch)}
                />
              ))}
            </div>

            {enabled.length === 0 ? (
              <p className="mt-3 font-body text-[0.76rem] text-warning">
                Activez au moins un espace : sans espace, la campagne n'a nulle
                part où s'afficher.
              </p>
            ) : null}

            {losing.length > 0 ? (
              <p className="mt-3 font-body text-[0.76rem] leading-relaxed text-warning">
                {losing.length === 1
                  ? `« ${losing[0].headline} » sera retiré : ses ${num(losing[0].views)} vues ne seront plus comptées.`
                  : `${losing.length} espaces seront retirés : leurs vues ne seront plus comptées.`}
              </p>
            ) : null}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-border px-5 py-3.5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-input px-4 py-2 font-ui text-sm font-medium text-ink transition-colors hover:border-border-strong hover:bg-accent"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!ready}
            className="inline-flex items-center gap-1.5 rounded-md bg-brand px-5 py-2 font-ui text-sm font-medium text-ink-inverted shadow-glow transition-colors hover:bg-brand-dim disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none"
          >
            <Check size={16} /> Enregistrer
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/* ── One ad space: toggle, then its accroche, son lien et son visuel ─────── */
function SlotRow({
  slotKey,
  label,
  description,
  slot,
  fallback,
  partnerName,
  color,
  onChange,
}: {
  slotKey: SlotKey
  label: string
  description: string
  slot: { enabled: boolean; headline: string; link: string }
  /** Campaign name — what an empty accroche falls back to. */
  fallback: string
  partnerName: string
  color: string
  onChange: (patch: Partial<{ enabled: boolean; headline: string; link: string }>) => void
}) {
  const Icon = SLOT_ICON[slotKey]

  return (
    <div
      className={cn(
        "rounded-lg border px-4 py-3.5 transition-colors",
        slot.enabled ? "border-border-second" : "border-border",
      )}
    >
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-md border transition-colors",
            slot.enabled
              ? "border-border-second bg-surface-nested text-ink"
              : "border-border text-ink-disabled",
          )}
        >
          <Icon size={16} />
        </span>
        <div className="min-w-0 flex-1">
          <div
            className={cn(
              "font-ui text-[0.86rem] font-medium",
              slot.enabled ? "text-ink" : "text-ink-muted",
            )}
          >
            {label}
          </div>
          <div className="truncate font-body text-[0.74rem] text-ink-disabled">
            {description}
          </div>
        </div>
        <Switch
          checked={slot.enabled}
          onChange={(v) => onChange({ enabled: v })}
          label={label}
        />
      </div>

      {slot.enabled ? (
        <div className="mt-3.5 flex items-end gap-3 border-t border-border pt-3.5">
          <div className="flex min-w-0 flex-1 flex-col gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="font-ui text-[0.66rem] font-medium tracking-[0.06em] text-ink-muted uppercase">
                Accroche
              </span>
              <input
                value={slot.headline}
                onChange={(e) => onChange({ headline: e.target.value })}
                placeholder={fallback || "Bien grandir, bien jouer"}
                className={cn(inputCls, "py-2 text-[0.82rem]")}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="font-ui text-[0.66rem] font-medium tracking-[0.06em] text-ink-muted uppercase">
                Lien
              </span>
              <input
                value={slot.link}
                onChange={(e) => onChange({ link: e.target.value })}
                placeholder="https://exemple.tn"
                className={cn(inputCls, "py-2 font-mono text-[0.78rem]")}
              />
            </label>
          </div>
          {/* Live creative — the admin sees the artwork as he types. */}
          <Creative
            name={partnerName}
            headline={slot.headline || fallback || "Accroche"}
            color={color}
            className="h-[66px] w-[146px] shrink-0"
            compact
          />
        </div>
      ) : null}
    </div>
  )
}
