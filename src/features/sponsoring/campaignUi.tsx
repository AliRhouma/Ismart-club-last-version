import type { ReactNode } from "react"
import { ImageIcon, Link2, Pencil, MousePointerClick, Eye } from "lucide-react"

import { cn } from "@/lib/utils"
import { initials } from "@/lib/tint"
import { num } from "@/data/seed/sponsoring"

/**
 * Shared pieces for the two campaign screens (en cours / archivée).
 *
 * `Creative` stands in for the image a sponsor uploads. It's drawn rather than
 * loaded — the prototype has no network — so it uses the campaign's own colour
 * and a soft tonal wash. That wash is deliberately NOT a design-system gradient:
 * it represents the sponsor's artwork, i.e. product content, not app chrome.
 */

/* ── The sponsor's visual ───────────────────────────────────────────────── */
export function Creative({
  name,
  headline,
  color,
  className,
  compact,
}: {
  /** Partner name — drawn as the creative's logo chip. */
  name: string
  headline: string
  /** Raw hex from the campaign (product data, like the tier colours). */
  color: string
  className?: string
  compact?: boolean
}) {
  return (
    <div
      className={cn(
        "relative flex flex-col justify-between overflow-hidden rounded-lg",
        compact ? "px-2.5 py-2" : "px-3 py-2.5",
        className,
      )}
      style={{
        // Mock artwork, not chrome — see the note at the top of this file.
        backgroundImage: `linear-gradient(135deg, ${color}, ${color}99)`,
      }}
    >
      {/* soft corner wash, as most real ad creatives have */}
      <span
        aria-hidden
        className="pointer-events-none absolute -top-6 -right-6 size-16 rounded-full bg-white/15"
      />

      <div className="relative flex items-center gap-1.5">
        <span
          className="flex size-4 items-center justify-center rounded-[3px] bg-white/90 font-ui text-[0.42rem] font-semibold"
          style={{ color }}
        >
          {initials(name)}
        </span>
        <span className="truncate font-ui text-[0.52rem] font-medium text-white/80">
          {name}
        </span>
      </div>

      <p
        className={cn(
          "relative mt-1 leading-tight font-medium text-white",
          compact ? "font-ui text-[0.58rem]" : "font-ui text-[0.68rem]",
        )}
      >
        {headline}
      </p>
    </div>
  )
}

/**
 * A creative wrapped in its edit affordances: hovering reveals "Visuel" and
 * "Lien" actions over the artwork. Static — the buttons open nothing.
 */
export function EditableCreative({
  children,
  onEditImage,
  onEditLink,
  className,
}: {
  children: ReactNode
  onEditImage?: () => void
  onEditLink?: () => void
  className?: string
}) {
  return (
    <div className={cn("group/edit relative", className)}>
      {children}

      {/* Hover scrim + actions. Opacity only — the artwork never moves. */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center gap-1.5 rounded-lg bg-background/70 opacity-0 transition-opacity duration-[160ms] group-hover/edit:pointer-events-auto group-hover/edit:opacity-100">
        <EditPill icon={ImageIcon} label="Visuel" onClick={onEditImage} />
        <EditPill icon={Link2} label="Lien" onClick={onEditLink} />
      </div>
    </div>
  )
}

function EditPill({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof Pencil
  label: string
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 rounded-sm border border-border-strong bg-surface px-1.5 py-1 font-ui text-[0.55rem] font-medium text-ink transition-colors hover:border-info hover:text-info"
    >
      <Icon size={10} />
      {label}
    </button>
  )
}

/* ── Square edit button (card header) ───────────────────────────────────── */
export function IconButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof Pencil
  label: string
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="inline-flex size-8 items-center justify-center rounded-sm border border-border text-ink-muted transition-colors hover:border-border-strong hover:bg-surface-hover hover:text-ink"
    >
      <Icon size={15} />
    </button>
  )
}

/* ── Link row under a slot's mock (campagne en cours) ───────────────────── */
export function LinkRow({ link, onEdit }: { link: string; onEdit?: () => void }) {
  return (
    <div className="flex items-center gap-2.5 rounded-md border border-border bg-surface-nested px-3 py-2.5">
      <Link2 size={13} className="shrink-0 text-ink-disabled" />
      <span className="min-w-0 flex-1 truncate font-mono text-[0.7rem] text-ink-subtle">
        {link}
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

/* ── Stats row under a slot's mock (campagne archivée) ──────────────────── */
export function SlotStats({
  views,
  clicks,
  ctr,
  extra,
}: {
  views: number
  clicks: number
  ctr: string
  /** e.g. "20 matchs · 6 jours" for booked slots. */
  extra?: string
}) {
  return (
    <div>
      <div className="grid grid-cols-3 overflow-hidden rounded-md border border-border">
        <StatCell icon={Eye} label="Vues" value={num(views)} />
        <StatCell
          icon={MousePointerClick}
          label="Clics"
          value={num(clicks)}
          bordered
        />
        <StatCell label="CTR" value={ctr} bordered />
      </div>
      {extra ? (
        <p className="mt-2 font-body text-[0.7rem] text-ink-disabled">{extra}</p>
      ) : null}
    </div>
  )
}

function StatCell({
  icon: Icon,
  label,
  value,
  bordered,
}: {
  icon?: typeof Eye
  label: string
  value: string
  bordered?: boolean
}) {
  return (
    <div className={cn("px-3 py-2.5", bordered && "border-l border-border")}>
      <div className="flex items-center gap-1.5">
        {Icon ? <Icon size={11} className="text-ink-disabled" /> : null}
        <span className="font-ui text-[0.6rem] font-medium tracking-[0.06em] text-ink-muted uppercase">
          {label}
        </span>
      </div>
      <div className="mt-1 font-display text-[1.05rem] font-semibold text-ink tabular-nums">
        {value}
      </div>
    </div>
  )
}
