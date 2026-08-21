import { useState } from "react"
import { History, ImageIcon, Link2, Ruler, Upload } from "lucide-react"

import { cn } from "@/lib/utils"
import { useData } from "@/data/useData"
import {
  applySlotEdit,
  SLOT_BY_KEY,
  creativeLabel,
  slotCreatives,
  type Campaign,
  type EditSlot,
  type SlotKey,
} from "@/data/seed/sponsoring"
import { FormSheet } from "@/components/kit/FormSheet"

const inputCls =
  "w-full rounded-md border border-input bg-transparent px-3.5 py-2.5 font-body text-sm text-ink outline-none transition-colors placeholder:text-ink-disabled focus:border-border-focus"

/**
 * What one ad space carries — the fields, alone, so the two places that edit a
 * space stay identical: the pen on a campaign card (this file's modal) and the
 * "Espaces publicitaires" list inside "Modifier la configuration".
 *
 * There is no accroche and no colour here: a `visuel` space carries the two
 * artworks (web + mobile, each at its own dimension) and the link behind them;
 * a `message` space carries the text the parent reads, since the app draws the
 * conversation / notification itself.
 */
export type SlotContent = Pick<
  EditSlot,
  "headline" | "webImage" | "mobileImage" | "link"
>

export function SlotFields({
  slotKey,
  value,
  onChange,
  partnerName,
  compact,
}: {
  slotKey: SlotKey
  value: SlotContent
  onChange: (patch: Partial<SlotContent>) => void
  partnerName: string
  /** Denser spacing, for the row-in-a-list use. */
  compact?: boolean
}) {
  const def = SLOT_BY_KEY[slotKey]
  const isMessage = def.medium === "message"

  return (
    <div className={cn("flex flex-col", compact ? "gap-3" : "gap-5")}>
      {isMessage ? (
        <Field
          label={slotKey === "messagerie" ? "Message" : "Texte de la notification"}
          hint={`Envoyé sous le nom de ${partnerName} — aucun visuel, l'app dessine ${
            slotKey === "messagerie" ? "la conversation" : "la notification"
          } elle-même.`}
        >
          <textarea
            rows={compact ? 2 : 3}
            value={value.headline}
            onChange={(e) => onChange({ headline: e.target.value })}
            placeholder="Un yaourt offert après chaque victoire"
            className={cn(inputCls, "resize-none leading-relaxed")}
          />
        </Field>
      ) : (
        <div className={cn("grid gap-3", compact && "sm:grid-cols-2")}>
          <UploadField
            label="Visuel — version web"
            size={def.webSize ?? ""}
            value={value.webImage}
            onChange={(v) => onChange({ webImage: v })}
            file={`${slotKey}-web.png`}
            compact={compact}
          />
          <UploadField
            label="Visuel — version mobile"
            size={def.mobileSize ?? ""}
            value={value.mobileImage}
            onChange={(v) => onChange({ mobileImage: v })}
            file={`${slotKey}-mobile.png`}
            compact={compact}
          />
        </div>
      )}

      <Field label="Lien au clic" hint="Où le visiteur arrive après le clic.">
        <div className="relative flex items-center">
          <Link2
            size={14}
            className="pointer-events-none absolute left-3.5 text-ink-disabled"
          />
          <input
            value={value.link}
            onChange={(e) => onChange({ link: e.target.value })}
            placeholder="https://exemple.tn/campagne"
            className={cn(inputCls, "pl-9 font-mono text-[0.8rem]")}
          />
        </div>
      </Field>
    </div>
  )
}

/* ── The pen on a campaign card: this space, and nothing else ───────────── */
export function EmplacementModal({
  campaign,
  slotKey,
  partnerName,
  onClose,
  onSaved,
}: {
  campaign: Campaign
  slotKey: SlotKey
  partnerName: string
  onClose: () => void
  onSaved: (msg: string) => void
}) {
  const { updateCampaign } = useData()
  const def = SLOT_BY_KEY[slotKey]
  const slot = campaign.slots.find((s) => s.key === slotKey)
  const history = slot ? slotCreatives(slot, campaign) : []
  /** What is on air right now in this space — what the form starts from. */
  const current = history[history.length - 1]

  const [value, setValue] = useState<SlotContent>({
    headline: current?.headline ?? "",
    webImage: current?.webImage ?? "",
    mobileImage: current?.mobileImage ?? "",
    link: current?.link ?? "",
  })

  const isMessage = def.medium === "message"

  /**
   * Replacing the artwork of a campaign that is ON AIR opens a new visual
   * rather than erasing the old one: the previous creative keeps its vues et
   * clics, and the space's stats gain a second entry to compare.
   */
  const swaps =
    campaign.status === "en_cours" &&
    (isMessage
      ? value.headline.trim() !== (current?.headline ?? "")
      : value.webImage !== (current?.webImage ?? "") ||
        value.mobileImage !== (current?.mobileImage ?? ""))

  const submit = () => {
    updateCampaign(
      campaign.id,
      applySlotEdit(campaign, slotKey, {
        // A visuel keeps the campaign's line; a message space is its text.
        headline: isMessage
          ? value.headline.trim() || campaign.name
          : (current?.headline ?? campaign.name),
        link: value.link,
        webImage: value.webImage,
        mobileImage: value.mobileImage,
      }),
    )
    onSaved(
      swaps
        ? `Nouveau visuel en ligne — ${def.label}`
        : `${def.label} mis à jour`,
    )
    onClose()
  }

  return (
    <FormSheet
      open
      onOpenChange={(next) => !next && onClose()}
      title={def.label}
      description={def.description}
      submitLabel="Enregistrer l'emplacement"
      onSubmit={submit}
    >
      <div className="flex flex-col gap-5">
        {/* No preview here: the card behind the modal already draws this exact
            space, in both versions — repeating it would only crowd the form. */}
        {history.length > 1 ? (
          <p className="rounded-md border border-border bg-surface-nested px-3 py-2.5 font-body text-[0.76rem] text-ink-muted">
            {history.length} visuels se sont déjà succédé dans cet emplacement.
            Chacun garde ses vues et ses clics.
          </p>
        ) : null}

        {swaps ? (
          <p className="flex items-start gap-2 rounded-md border border-info/30 bg-info/5 px-3 py-2.5 font-body text-[0.76rem] leading-relaxed text-info">
            <History size={14} className="mt-px shrink-0" />
            En enregistrant, {isMessage ? "ce message" : "ce visuel"} devient
            le {creativeLabel(history.length)} de cet emplacement. Le précédent
            s'arrête aujourd'hui et conserve ses statistiques.
          </p>
        ) : null}

        <SlotFields
          slotKey={slotKey}
          value={value}
          onChange={(patch) => setValue((v) => ({ ...v, ...patch }))}
          partnerName={partnerName}
        />
      </div>
    </FormSheet>
  )
}

/* ── One artwork: its dimension, then the upload ────────────────────────── */
function UploadField({
  label,
  size,
  value,
  onChange,
  file,
  compact,
}: {
  label: string
  size: string
  value: string
  onChange: (v: string) => void
  /** The filename "uploading" produces — the prototype has no network. */
  file: string
  compact?: boolean
}) {
  return (
    /* Not a <label>: a wrapping label would steal the upload button's name. */
    <Field label={label} plain>
      <div className="flex items-center gap-2 rounded-md border border-border bg-surface-nested px-3 py-2">
        <Ruler size={13} className="shrink-0 text-info" />
        <span className="font-body text-[0.72rem] text-ink-subtle">{size}</span>
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
          className={cn(
            "mt-2 flex w-full flex-col items-center justify-center gap-1.5 rounded-md border border-dashed border-border-strong px-4 transition-colors hover:border-info hover:bg-info/5",
            compact ? "py-4" : "py-6",
          )}
        >
          <Upload size={16} className="text-ink-muted" />
          <span className="font-ui text-[0.74rem] font-medium text-ink">
            Envoyer un visuel
          </span>
        </button>
      )}
    </Field>
  )
}

function Field({
  label,
  hint,
  children,
  plain,
}: {
  label: string
  hint?: string
  children: React.ReactNode
  /** Render a plain group instead of a <label> (for non-input controls). */
  plain?: boolean
}) {
  const Wrap = plain ? "div" : "label"
  return (
    <Wrap className="flex flex-col gap-1.5">
      <span className="font-ui text-[0.68rem] font-medium tracking-[0.06em] text-ink-muted uppercase">
        {label}
      </span>
      {children}
      {hint ? (
        <span className="font-body text-[0.72rem] leading-snug text-ink-disabled">
          {hint}
        </span>
      ) : null}
    </Wrap>
  )
}
