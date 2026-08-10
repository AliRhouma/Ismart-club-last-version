import { forwardRef } from "react"
import { useDraggable, useDroppable } from "@dnd-kit/core"
import { GripHorizontal, GripVertical, X } from "lucide-react"

import { cn } from "@/lib/utils"
import type {
  CompositionJoueur,
  Sport,
  Taille,
  TerrainId,
} from "@/data/seed/compositions"
import stadeFoot from "@/assets/terrain/stade-foot.png"
import stadeHandball from "@/assets/terrain/stade-handball.png"

export type Slot = { poste: string; x: number; y: number }

/**
 * The stadium asset is 1206×802 — every board keeps that exact ratio, the same
 * one the reference editor uses (700×466 ≈ 1.5038), so a slot map lifted from
 * it lands on the same blade of grass here.
 */
export const STADE_W = 1206
export const STADE_H = 802

/** Board width per taille — landscape now, so it can afford to be wider. */
const LARGEUR: Record<Taille, string> = {
  S: "max-w-[380px]",
  M: "max-w-[560px]",
  L: "max-w-[780px]",
}

/** A slot box, as a % of the board — 82×105px on a 700×466 board. */
const CASE_W = 11.7
const CASE_H = 22.6

function stadeDe(sport: Sport) {
  return sport === "Handball" ? stadeHandball : stadeFoot
}

/* ── Pitch surface ──────────────────────────────────────────────────────── */

/**
 * The pitch itself. Three of the four terrains show the stadium PNG (plain,
 * with the thirds drawn over it, or dimmed to sit quietly in the dark UI); the
 * fourth drops the photo for a plain drawn outline.
 */
function Surface({ terrain, sport }: { terrain: TerrainId; sport: Sport }) {
  if (terrain === "sobre") {
    return (
      <div
        aria-hidden
        className="absolute inset-[6%_4%] rounded-md border border-border-second/70"
      >
        {/* Own goal is at the bottom: the box sits there, the halfway line up top. */}
        <div className="absolute top-[6%] right-0 left-0 border-t border-border-second/70" />
        <div className="absolute bottom-0 left-1/2 h-[26%] w-[46%] -translate-x-1/2 border-x border-t border-border-second/70" />
        <div className="absolute bottom-0 left-1/2 h-[11%] w-[22%] -translate-x-1/2 border-x border-t border-border-second/70" />
        <div className="absolute bottom-[26%] left-1/2 h-[10%] w-[20%] -translate-x-1/2 rounded-b-full border-x border-b border-border-second/70" />
      </div>
    )
  }

  return (
    <>
      <img
        src={stadeDe(sport)}
        alt=""
        aria-hidden
        draggable={false}
        className={cn(
          "pointer-events-none absolute inset-0 size-full select-none",
          terrain === "sombre" && "opacity-45 saturate-50",
        )}
      />
      {terrain === "zones" ? (
        <div aria-hidden className="pointer-events-none absolute inset-0">
          {/* Thirds — the way a coach talks about the pitch. */}
          <div className="absolute top-[38%] right-[9%] left-[9%] border-t border-dashed border-white/40" />
          <div className="absolute top-[61%] right-[5%] left-[5%] border-t border-dashed border-white/40" />
        </div>
      ) : null}
    </>
  )
}

/* ── Empty slot ─────────────────────────────────────────────────────────── */

/** The dashed box a joueur drops into — 11.7% × 22.6% of the board, as drawn
    by the reference editor. White-on-grass, so it reads over the stadium. */
function SlotVide({
  index,
  slot,
  cible,
  onPlace,
}: {
  index: number
  slot: Slot
  /** True while a joueur is picked from the sheet and waiting for a poste. */
  cible: boolean
  onPlace: () => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `slot-${index}` })
  return (
    <div
      ref={setNodeRef}
      style={{
        left: `${slot.x}%`,
        top: `${slot.y}%`,
        width: `${CASE_W}%`,
        height: `${CASE_H}%`,
      }}
      className="absolute -translate-x-1/2 -translate-y-1/2"
    >
      <button
        type="button"
        onClick={onPlace}
        aria-label={`Placer au poste ${slot.poste}`}
        className={cn(
          "flex size-full items-center justify-center rounded-xl border-2 border-dashed font-ui text-[0.6rem] tracking-[0.06em] transition-colors",
          isOver || cible
            ? "border-brand-blue-600 bg-brand-blue-600/20 text-white"
            : "border-white/45 text-white/70 hover:border-white/80",
        )}
      >
        {slot.poste}
      </button>
    </div>
  )
}

/* ── Placed player ──────────────────────────────────────────────────────── */

function Marqueur({
  joueur,
  slotIndex,
  onRemove,
  selected,
  onSelect,
  cible,
  onPlace,
}: {
  joueur: CompositionJoueur
  slotIndex: number | null
  onRemove: (id: string) => void
  selected: boolean
  onSelect: (id: string) => void
  /** A joueur is picked from the sheet — this marker is a swap target. */
  cible?: boolean
  onPlace?: () => void
}) {
  // The marker is both a drop target (swap two players) and a drag source.
  const { setNodeRef: dropRef, isOver } = useDroppable({
    id: slotIndex === null ? `marker-${joueur.id}` : `slot-${slotIndex}`,
  })
  const { attributes, listeners, setNodeRef: dragRef, isDragging } = useDraggable({
    id: `terrain-${joueur.id}`,
    data: { joueurId: joueur.id, from: "terrain", nom: joueur.nom },
  })

  return (
    <div
      ref={dropRef}
      style={{
        left: `${joueur.x}%`,
        top: `${joueur.y}%`,
        width: `${CASE_W}%`,
        height: `${CASE_H}%`,
      }}
      className={cn(
        "absolute -translate-x-1/2 -translate-y-1/2",
        isDragging && "opacity-30",
      )}
    >
      <div
        ref={dragRef}
        className="group relative flex size-full flex-col items-center justify-center"
      >
        <button
          type="button"
          {...listeners}
          {...attributes}
          onClick={() => (cible && onPlace ? onPlace() : onSelect(joueur.id))}
          /* The marker is a drag surface: the browser must not claim the
             gesture to scroll the page behind it. */
          style={{ touchAction: "none" }}
          className={cn(
            "flex size-9 cursor-grab items-center justify-center overflow-hidden rounded-full border-2 font-ui text-[0.6rem] text-white transition-colors active:cursor-grabbing",
            isOver || cible
              ? "border-brand-blue-600 bg-brand-blue-600"
              : selected
                ? "border-brand-blue-600 bg-brand-blue-600/70"
                : "border-white/70 bg-black/55 hover:border-white",
          )}
        >
          {joueur.photo ? (
            <img
              src={joueur.photo}
              alt=""
              loading="lazy"
              className="size-full object-cover"
            />
          ) : (
            joueur.poste
          )}
        </button>

        <span className="mt-1 block max-w-full truncate rounded-sm bg-black/55 px-1 font-ui text-[0.58rem] text-white">
          {joueur.nom.split(" ").slice(-1)[0]}
        </span>

        <button
          type="button"
          aria-label={`Retirer ${joueur.nom} du terrain`}
          onClick={(e) => {
            e.stopPropagation()
            onRemove(joueur.id)
          }}
          className="absolute top-0 right-0 flex size-4 items-center justify-center rounded-full border border-white/40 bg-black/70 text-white opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
        >
          <X size={9} />
        </button>
      </div>
    </div>
  )
}

/* ── Board ──────────────────────────────────────────────────────────────── */

/**
 * The editable board. Empty formation slots are drop targets; a placed joueur
 * is both draggable (to another slot, or off the pitch) and droppable (drop
 * someone on him to swap). In placement libre the slots disappear and the whole
 * pitch becomes one drop surface with free x/y.
 */
export const TerrainEditeur = forwardRef<
  HTMLDivElement,
  {
    joueurs: CompositionJoueur[]
    slots: Slot[]
    terrain: TerrainId
    taille: Taille
    placementLibre: boolean
    sport: Sport
    selectedId: string | null
    onSelect: (id: string) => void
    onRemove: (id: string) => void
    /** Id of the joueur picked from the sheet, waiting to be placed. */
    enAttente: string | null
    onPlaceSlot: (slotIndex: number) => void
  }
>(function TerrainEditeur(
  {
    joueurs,
    slots,
    terrain,
    taille,
    placementLibre,
    sport,
    selectedId,
    onSelect,
    onRemove,
    enAttente,
    onPlaceSlot,
  },
  ref,
) {
  const { setNodeRef: pitchRef, isOver } = useDroppable({ id: "terrain" })

  // Which slot each placed joueur occupies, so a marker can double as its slot.
  const parSlot = new Map<number, CompositionJoueur>()
  const libres: CompositionJoueur[] = []
  for (const j of joueurs) {
    if (!placementLibre && typeof j.slot === "number") parSlot.set(j.slot, j)
    else libres.push(j)
  }

  return (
    <div className={cn("mx-auto w-full", LARGEUR[taille])}>
      <div
        ref={(node) => {
          pitchRef(node)
          if (typeof ref === "function") ref(node)
          else if (ref) ref.current = node
        }}
        style={{ aspectRatio: `${STADE_W} / ${STADE_H}` }}
        className={cn(
          "relative w-full overflow-hidden rounded-xl border transition-colors",
          terrain === "sobre" ? "bg-surface-nested" : "bg-transparent",
          isOver && placementLibre ? "border-brand-blue-600" : "border-border",
        )}
      >
        <Surface terrain={terrain} sport={sport} />

        {!placementLibre
          ? slots.map((slot, i) => {
              const j = parSlot.get(i)
              return j ? (
                <Marqueur
                  key={j.id}
                  joueur={{ ...j, x: slot.x, y: slot.y }}
                  slotIndex={i}
                  onRemove={onRemove}
                  selected={j.id === selectedId}
                  onSelect={onSelect}
                  cible={!!enAttente}
                  onPlace={() => onPlaceSlot(i)}
                />
              ) : (
                <SlotVide
                  key={`slot-${i}`}
                  index={i}
                  slot={slot}
                  cible={!!enAttente}
                  onPlace={() => onPlaceSlot(i)}
                />
              )
            })
          : null}

        {libres.map((j) => (
          <Marqueur
            key={j.id}
            joueur={j}
            slotIndex={null}
            onRemove={onRemove}
            selected={j.id === selectedId}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  )
})

/* ── Pool row ───────────────────────────────────────────────────────────── */

/**
 * A joueur waiting on the sheet. The grip is the touch drag surface — the list
 * scrolls vertically, so without a `touch-action: none` handle a finger would
 * scroll instead of drag.
 */
export function JoueurDisponible({
  id,
  nom,
  poste,
  photo,
  selected,
  onSelect,
}: {
  id: string
  nom: string
  poste: string
  photo?: string
  selected: boolean
  onSelect: () => void
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `pool-${id}`,
    data: { joueurId: id, from: "pool", nom },
  })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex items-center gap-2.5 rounded-md border px-2.5 py-2 transition-colors",
        selected
          ? "border-brand-blue-600 bg-brand-blue-600/5"
          : "border-border hover:border-border-strong",
        isDragging && "opacity-30",
      )}
    >
      <span className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-surface-nested font-ui text-[0.58rem] text-ink-muted">
        {photo ? (
          <img src={photo} alt="" loading="lazy" className="size-full object-cover" />
        ) : (
          poste
        )}
      </span>
      {/* Tap to pick, then tap a poste — the path that works when the board is
          a scroll away, which it always is on a phone. */}
      <button
        type="button"
        onClick={onSelect}
        className="min-w-0 flex-1 text-left leading-tight"
      >
        <span className="block truncate font-ui text-[0.82rem] text-ink">{nom}</span>
        <span
          className={cn(
            "block font-body text-[0.68rem]",
            selected ? "text-brand-blue-600" : "text-ink-disabled",
          )}
        >
          {selected ? "Choisissez un poste…" : "Toucher ou glisser vers le terrain"}
        </span>
      </button>
      <button
        type="button"
        {...listeners}
        {...attributes}
        aria-label={`Placer ${nom} sur le terrain`}
        title="Glisser vers le terrain"
        style={{ touchAction: "none" }}
        className="flex size-7 shrink-0 cursor-grab items-center justify-center rounded-sm text-ink-disabled transition-colors hover:bg-surface-hover hover:text-ink active:cursor-grabbing"
      >
        <GripVertical size={15} />
      </button>
    </div>
  )
}

/* ── Mobile strip ───────────────────────────────────────────────────────── */

/**
 * A joueur on the phone's bench, sitting right under the board.
 *
 * Three gestures share one 84px card, so each gets its own surface — the same
 * split the Kanban needed:
 * - **swipe the card** → the bench scrolls (`touch-action: pan-x`)
 * - **tap the card** → picks the joueur, then tap a poste
 * - **drag the grip bar** → carries him up to the board (`touch-action: none`)
 *
 * `pan-x` alone is not enough: it only tells the *compositor* what it may do,
 * while dnd-kit still receives every touchmove and would start a drag on a
 * sideways flick. The grip is what actually separates the two.
 */
export function JoueurBanc({
  id,
  nom,
  poste,
  photo,
  selected,
  onSelect,
}: {
  id: string
  nom: string
  poste: string
  photo?: string
  selected: boolean
  onSelect: () => void
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `banc-${id}`,
    data: { joueurId: id, from: "pool", nom },
  })

  return (
    <div
      ref={setNodeRef}
      style={{ touchAction: "pan-x" }}
      className={cn(
        "relative flex w-[84px] shrink-0 snap-start flex-col items-center gap-1.5 rounded-lg border pt-5 pb-2 transition-colors",
        selected
          ? "border-brand-blue-600 bg-brand-blue-600/10"
          : "border-border hover:border-border-strong",
        isDragging && "opacity-30",
      )}
    >
      {/* Grip bar — the only surface that starts a drag. */}
      <button
        type="button"
        {...listeners}
        {...attributes}
        aria-label={`Glisser ${nom} vers le terrain`}
        title="Glisser vers le terrain"
        style={{ touchAction: "none" }}
        className="absolute inset-x-0 top-0 flex h-5 cursor-grab items-center justify-center rounded-t-lg text-ink-disabled transition-colors hover:bg-surface-hover hover:text-ink active:cursor-grabbing"
      >
        <GripHorizontal size={14} />
      </button>

      <button
        type="button"
        onClick={onSelect}
        className="flex w-full flex-col items-center gap-1.5 px-1.5"
      >
        <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-surface-nested font-ui text-[0.6rem] text-ink-muted">
          {photo ? (
            <img src={photo} alt="" loading="lazy" className="size-full object-cover" />
          ) : (
            poste
          )}
        </span>
        <span className="w-full truncate text-center font-ui text-[0.68rem] leading-tight text-ink">
          {nom.split(" ").slice(-1)[0]}
        </span>
        <span className="font-ui text-[0.58rem] tracking-[0.06em] text-ink-disabled uppercase">
          {poste}
        </span>
      </button>
    </div>
  )
}
