import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  pointerWithin,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core"
import {
  ChevronDown,
  Crown,
  Eraser,
  LayoutGrid,
  Minus,
  Network,
  Plus,
  Save,
  Shuffle,
  Trash2,
  Users,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { useData } from "@/data/useData"
import {
  FORMATIONS,
  SPORTS,
  TAILLES,
  TERRAINS,
  rolesVides,
  slotsDe,
  type CompositionJoueur,
  type CompositionRoles,
  type Sport,
  type Taille,
  type TerrainId,
} from "@/data/seed/compositions"
import { PageHeader } from "@/components/kit/PageHeader"
import { EmptyState } from "@/components/kit/EmptyState"
import { BackButton } from "@/components/kit/BackButton"
import { ConfirmDialog } from "@/components/kit/ConfirmDialog"
import { Button } from "@/components/ui/button"
import { Toast } from "@/features/sponsoring/ui"
import { inputCls } from "@/features/finance/ui"

import {
  JoueurBanc,
  JoueurDisponible,
  TerrainEditeur,
} from "@/features/pole-technique/composition/TerrainEditeur"
import { RolesModal } from "@/features/pole-technique/composition/RolesModal"

const LIST = "/pole-technique/composition"

/** dnd-kit announces drags to screen readers in English by default. */
const annonces = {
  onDragStart: ({ active }: { active: { data: { current?: { nom?: string } } } }) =>
    `Déplacement de ${active.data.current?.nom ?? "un joueur"}.`,
  onDragOver: ({ over }: { over: { id: string | number } | null }) =>
    over ? "Au-dessus du terrain." : "Hors du terrain.",
  onDragEnd: ({ over }: { over: { id: string | number } | null }) =>
    over ? "Joueur placé." : "Joueur retiré du terrain.",
  onDragCancel: () => "Déplacement annulé.",
}

/** Toolbar chip — the shared shape for every control above the board. */
function Chip({
  active,
  onClick,
  children,
  title,
}: {
  active?: boolean
  onClick?: () => void
  children: React.ReactNode
  title?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-pressed={active}
      className={cn(
        "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-md border px-3 font-ui text-[0.76rem] font-medium transition-colors",
        active
          ? "border-border-second bg-surface-nested text-ink"
          : "border-border text-ink-muted hover:border-border-strong hover:text-ink",
      )}
    >
      {children}
    </button>
  )
}

/**
 * Pôle technique ▸ Composition — the line-up editor.
 *
 * Left: the sheet (titre, description) and the joueurs still available in the
 * catégorie's groupe. Right: the board. Drag a joueur onto a formation slot,
 * from one slot to another (they swap), or off the pitch to send him back to
 * the list. "Placement libre" drops the slots and lets you put anyone anywhere.
 */
export function CompositionDetailScreen() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { compositions, categories, updateComposition, removeComposition } = useData()

  const compo = compositions.find((c) => c.id === id)

  /* Draft — the board is edited locally and committed on "Enregistrer", so a
     half-built line-up never overwrites the saved one. */
  const [titre, setTitre] = useState(compo?.titre ?? "")
  const [description, setDescription] = useState(compo?.description ?? "")
  const [sport, setSport] = useState<Sport>(compo?.sport ?? "Foot")
  const [formation, setFormation] = useState(compo?.formation ?? "4-3-3")
  const [placementLibre, setPlacementLibre] = useState(!!compo?.placementLibre)
  const [terrain, setTerrain] = useState<TerrainId>(compo?.terrain ?? "stade")
  const [taille, setTaille] = useState<Taille>(compo?.taille ?? "M")
  /* Seed rows carry pitch coordinates but no slot index (they predate the
     editor), so on first load we sit them into the formation's slots in order —
     otherwise a saved line-up would open as loose markers with every slot
     showing empty. */
  const [joueurs, setJoueurs] = useState<CompositionJoueur[]>(() => {
    const source = compo?.joueurs ?? []
    if (compo?.placementLibre) return source
    const spots = slotsDe(compo?.sport ?? "Foot", compo?.formation ?? "")
    if (spots.length === 0) return source
    let i = 0
    return source.map((j) => {
      if (typeof j.slot === "number" || j.remplacant || i >= spots.length) return j
      const s = spots[i++]
      return { ...j, slot: i - 1, poste: s.poste, x: s.x, y: s.y }
    })
  })
  const [roles, setRoles] = useState<CompositionRoles>(compo?.roles ?? rolesVides())

  const [selected, setSelected] = useState<string | null>(null)
  /** Joueur picked from the sheet, waiting for a poste (the tap-to-place path). */
  const [enAttente, setEnAttente] = useState<string | null>(null)
  const [ouvert, setOuvert] = useState<"formation" | "terrain" | null>(null)
  const [rolesOpen, setRolesOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [viderOpen, setViderOpen] = useState(false)
  const [actif, setActif] = useState<CompositionJoueur | null>(null)

  const pitchRef = useRef<HTMLDivElement | null>(null)
  const [toast, setToast] = useState<{ id: number; msg: string } | null>(null)
  const toastId = useRef(0)
  const notify = (msg: string) => setToast({ id: toastId.current++, msg })
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2600)
    return () => clearTimeout(t)
  }, [toast])

  /*
   * Mouse and touch are split on purpose, and touch activates on distance —
   * never on a delay. A delay makes dnd-kit hold the gesture and preventDefault
   * its moves, which killed the phone bench's sideways scroll. With a plain
   * distance constraint the browser arbitrates instead: the bench cards are
   * `touch-action: pan-x`, so a horizontal flick is consumed by the compositor
   * (dnd-kit gets a cancel and stands down) while a vertical drag — the one
   * that carries a joueur up to the board — reaches JS untouched.
   */
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { distance: 8 } }),
  )

  const formationsDuSport = Object.keys(FORMATIONS[sport] ?? {})
  const slots = useMemo(
    () => (placementLibre ? [] : slotsDe(sport, formation)),
    [sport, formation, placementLibre],
  )

  /** The squad this composition draws from — its catégorie × groupe. */
  const effectif = useMemo(() => {
    if (!compo) return []
    const cat = categories.find(
      (c) => c.nom === compo.categorie || c.id === compo.categorie,
    )
    if (!cat) return []
    const groupe = cat.groupes.find((g) => g.nom === compo.groupe)
    return cat.joueurs.filter((j) => !groupe || j.groupeId === groupe.id)
  }, [compo, categories])

  const surLeTerrain = new Set(joueurs.map((j) => j.id))
  const disponibles = effectif.filter((j) => !surLeTerrain.has(j.id))

  if (!compo) {
    return (
      <div className="mx-auto w-full max-w-5xl">
        <BackButton to={LIST} label="Retour aux compositions" />
        <div className="rounded-lg border border-border">
          <EmptyState
            icon={Network}
            title="Composition introuvable"
            description="Cette composition a été supprimée ou n'existe plus."
            action={
              <Button variant="outline" onClick={() => navigate(LIST)}>
                Retour aux compositions
              </Button>
            }
          />
        </div>
      </div>
    )
  }

  /* ── Board mutations ──────────────────────────────────────────────────── */

  const placer = (joueurId: string, slotIndex: number) => {
    const slot = slots[slotIndex]
    if (!slot) return
    const depuisPool = effectif.find((j) => j.id === joueurId)
    setJoueurs((prev) => {
      const occupant = prev.find((j) => j.slot === slotIndex && j.id !== joueurId)
      const courant = prev.find((j) => j.id === joueurId)
      const ancienSlot = courant?.slot ?? null

      const next = prev.map((j) => {
        // The two swap places when the target slot is taken.
        if (occupant && j.id === occupant.id) {
          if (typeof ancienSlot === "number") {
            const s = slots[ancienSlot]
            return { ...j, slot: ancienSlot, poste: s.poste, x: s.x, y: s.y }
          }
          return null as unknown as CompositionJoueur
        }
        if (j.id === joueurId)
          return { ...j, slot: slotIndex, poste: slot.poste, x: slot.x, y: slot.y }
        return j
      })

      const nettoye = next.filter(Boolean)
      if (courant) return nettoye
      if (!depuisPool) return nettoye
      return [
        ...nettoye,
        {
          id: depuisPool.id,
          nom: depuisPool.nom,
          poste: slot.poste,
          photo: depuisPool.photo,
          remplacant: false,
          slot: slotIndex,
          x: slot.x,
          y: slot.y,
        },
      ]
    })
  }

  const placerLibre = (joueurId: string, x: number, y: number) => {
    const clamp = (v: number) => Math.round(Math.min(Math.max(v, 4), 96) * 10) / 10
    const depuisPool = effectif.find((j) => j.id === joueurId)
    setJoueurs((prev) => {
      if (prev.some((j) => j.id === joueurId))
        return prev.map((j) =>
          j.id === joueurId ? { ...j, slot: null, x: clamp(x), y: clamp(y) } : j,
        )
      if (!depuisPool) return prev
      return [
        ...prev,
        {
          id: depuisPool.id,
          nom: depuisPool.nom,
          poste: depuisPool.poste,
          photo: depuisPool.photo,
          remplacant: false,
          slot: null,
          x: clamp(x),
          y: clamp(y),
        },
      ]
    })
  }

  /**
   * Pick a joueur from the sheet. On a phone the board is a scroll away, so we
   * bring it into view — otherwise you'd tap a name and see nothing happen.
   */
  const choisir = (joueurId: string) => {
    const next = enAttente === joueurId ? null : joueurId
    setEnAttente(next)
    if (next && window.innerWidth < 1024) {
      pitchRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
    }
  }

  const retirer = (joueurId: string) => {
    setJoueurs((prev) => prev.filter((j) => j.id !== joueurId))
    setRoles((r) => ({
      capitaine: r.capitaine === joueurId ? null : r.capitaine,
      viceCapitaine: r.viceCapitaine === joueurId ? null : r.viceCapitaine,
      penaltys: r.penaltys.filter((x) => x !== joueurId),
      coupsFrancsDirects: r.coupsFrancsDirects.filter((x) => x !== joueurId),
      coupsFrancsIndirects: r.coupsFrancsIndirects.filter((x) => x !== joueurId),
      corners: r.corners.filter((x) => x !== joueurId),
      listeAlternative: r.listeAlternative.filter((x) => x !== joueurId),
    }))
  }

  const onDragStart = (e: DragStartEvent) => {
    const jid = e.active.data.current?.joueurId as string | undefined
    const place = joueurs.find((j) => j.id === jid)
    const dispo = effectif.find((j) => j.id === jid)
    setActif(
      place ??
        (dispo
          ? {
              id: dispo.id,
              nom: dispo.nom,
              poste: dispo.poste,
              photo: dispo.photo,
              remplacant: false,
              x: 0,
              y: 0,
            }
          : null),
    )
  }

  const onDragEnd = (e: DragEndEvent) => {
    setActif(null)
    const joueurId = e.active.data.current?.joueurId as string | undefined
    if (!joueurId) return

    const over = e.over?.id?.toString()
    const rect = pitchRef.current?.getBoundingClientRect()
    const src = e.activatorEvent as PointerEvent | undefined
    const px = (src?.clientX ?? 0) + e.delta.x
    const py = (src?.clientY ?? 0) + e.delta.y
    const dansLeTerrain =
      !!rect && px >= rect.left && px <= rect.right && py >= rect.top && py <= rect.bottom

    if (!placementLibre && over?.startsWith("slot-")) {
      placer(joueurId, Number(over.slice(5)))
      return
    }
    if (placementLibre && (over === "terrain" || dansLeTerrain) && rect) {
      placerLibre(
        joueurId,
        ((px - rect.left) / rect.width) * 100,
        ((py - rect.top) / rect.height) * 100,
      )
      return
    }
    // Dropped outside the pitch → back to the sheet.
    if (!dansLeTerrain && joueurs.some((j) => j.id === joueurId)) retirer(joueurId)
  }

  const enregistrer = () => {
    updateComposition(compo.id, {
      titre: titre.trim() || "Composition sans titre",
      description: description.trim(),
      sport,
      formation: placementLibre ? "" : formation,
      placementLibre,
      terrain,
      taille,
      joueurs,
      roles,
    })
    notify("Composition enregistrée.")
  }

  const changerSport = (s: Sport) => {
    setSport(s)
    const dispos = Object.keys(FORMATIONS[s] ?? {})
    if (dispos.length === 0) {
      setPlacementLibre(true)
      notify(`${s} — placement libre.`)
      return
    }
    setFormation(dispos.includes(formation) ? formation : dispos[0])
    setJoueurs((prev) => prev.map((j) => ({ ...j, slot: null })))
    notify(`${s} — ${dispos.includes(formation) ? formation : dispos[0]}.`)
  }

  const changerFormation = (f: string) => {
    const nouveaux = slotsDe(sport, f)
    // Keep who plays where in slot order; anyone beyond the new shape is unplaced.
    setJoueurs((prev) => {
      const places = prev
        .filter((j) => typeof j.slot === "number")
        .sort((a, b) => (a.slot as number) - (b.slot as number))
      const autres = prev.filter((j) => typeof j.slot !== "number")
      return [
        ...places.slice(0, nouveaux.length).map((j, i) => ({
          ...j,
          slot: i,
          poste: nouveaux[i].poste,
          x: nouveaux[i].x,
          y: nouveaux[i].y,
        })),
        ...autres,
      ]
    })
    setFormation(f)
    setOuvert(null)
    notify(`Formation ${f}.`)
  }

  const titulaires = joueurs.length
  const roleDe = (jid: string) =>
    roles.capitaine === jid ? "C" : roles.viceCapitaine === jid ? "VC" : null

  return (
    <div className="mx-auto w-full max-w-[1400px]">
      <BackButton to={LIST} label="Retour aux compositions" />

      <PageHeader
        title="Composition"
        subtitle={
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>
              {compo.categorie} · {compo.groupe}
            </span>
            <span className="inline-flex items-center gap-1.5 font-ui text-[0.75rem] text-ink-muted">
              <Users size={12} /> {titulaires} sur le terrain · {disponibles.length}{" "}
              disponibles
            </span>
          </span>
        }
        actions={
          <>
            <Button variant="outline" onClick={() => setDeleteOpen(true)}>
              <Trash2 size={15} /> Supprimer
            </Button>
            <Button onClick={enregistrer}>
              <Save size={16} /> Enregistrer
            </Button>
          </>
        }
      />

      <DndContext
        sensors={sensors}
        accessibility={{ announcements: annonces }}
        collisionDetection={pointerWithin}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onDragCancel={() => setActif(null)}
      >
        <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-start">
          {/* Sheet + squad */}
          <aside className="order-2 flex w-full flex-col gap-4 lg:order-1 lg:w-[330px] lg:shrink-0">
            <section className="flex flex-col gap-3 rounded-lg border border-border p-4">
              <label className="flex flex-col gap-1.5">
                <span className="font-ui text-[0.62rem] font-medium tracking-[0.1em] text-ink-muted uppercase">
                  Titre
                </span>
                <input
                  className={inputCls}
                  value={titre}
                  placeholder="Ex : Match vs Marseille — J12"
                  onChange={(e) => setTitre(e.target.value)}
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="font-ui text-[0.62rem] font-medium tracking-[0.1em] text-ink-muted uppercase">
                  Description
                </span>
                <textarea
                  rows={2}
                  className={cn(inputCls, "resize-none")}
                  value={description}
                  placeholder="Notes, consignes tactiques…"
                  onChange={(e) => setDescription(e.target.value)}
                />
              </label>
            </section>

            {/* The vertical sheet is the desktop reading of the squad — on a
                phone the bench under the board says the same thing, closer. */}
            <section className="hidden flex-col rounded-lg border border-border lg:flex">
              <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
                <h2 className="font-ui text-[0.66rem] font-medium tracking-[0.1em] text-ink-muted uppercase">
                  Joueurs disponibles
                </h2>
                <span className="rounded-pill border border-brand-blue-600/30 bg-brand-blue-600/10 px-2 py-0.5 font-ui text-[0.66rem] text-brand-blue-600 tabular-nums">
                  {disponibles.length}
                </span>
              </div>

              <div className="flex max-h-[52svh] flex-col gap-1.5 overflow-y-auto p-3 lg:max-h-[60svh]">
                {effectif.length === 0 ? (
                  <p className="px-2 py-6 text-center font-body text-[0.78rem] text-ink-disabled">
                    Aucun effectif rattaché à {compo.categorie} · {compo.groupe}.
                  </p>
                ) : disponibles.length === 0 ? (
                  <p className="px-2 py-6 text-center font-body text-[0.78rem] text-ink-disabled">
                    Tout le groupe est sur le terrain.
                  </p>
                ) : (
                  <>
                    <span className="px-1 pb-1 font-ui text-[0.6rem] font-medium tracking-[0.1em] text-brand-blue-600 uppercase">
                      — {compo.groupe}
                    </span>
                    {disponibles.map((j) => (
                      <JoueurDisponible
                        key={j.id}
                        id={j.id}
                        nom={j.nom}
                        poste={j.poste}
                        photo={j.photo}
                        selected={enAttente === j.id}
                        onSelect={() => choisir(j.id)}
                      />
                    ))}
                  </>
                )}
              </div>
            </section>
          </aside>

          {/* Board */}
          <div className="order-1 flex min-w-0 flex-1 flex-col gap-4 lg:order-2">
            {/* Sports */}
            <div className="-mx-1 flex gap-1 overflow-x-auto px-1">
              {SPORTS.map((s) => (
                <Chip key={s} active={s === sport} onClick={() => changerSport(s)}>
                  {s}
                </Chip>
              ))}
            </div>

            {/* Board controls */}
            <div className="flex flex-wrap items-center gap-2">
              {formationsDuSport.length > 0 ? (
                <div className="relative">
                  <Chip
                    active={ouvert === "formation"}
                    onClick={() =>
                      setOuvert(ouvert === "formation" ? null : "formation")
                    }
                  >
                    <span className="font-ui text-[0.6rem] tracking-[0.1em] text-ink-muted uppercase">
                      Formation
                    </span>
                    <span className="tabular-nums">
                      {placementLibre ? "—" : formation}
                    </span>
                    <ChevronDown size={13} />
                  </Chip>
                  {ouvert === "formation" ? (
                    <div className="absolute top-full left-0 z-30 mt-1.5 max-h-[280px] w-[160px] overflow-y-auto rounded-md border border-border bg-background p-1 shadow-deep">
                      {formationsDuSport.map((f) => (
                        <button
                          key={f}
                          type="button"
                          onClick={() => {
                            setPlacementLibre(false)
                            changerFormation(f)
                          }}
                          className={cn(
                            "block w-full rounded-sm px-3 py-1.5 text-left font-ui text-[0.8rem] tabular-nums transition-colors",
                            f === formation && !placementLibre
                              ? "bg-surface-nested text-ink"
                              : "text-ink-muted hover:bg-surface-hover hover:text-ink",
                          )}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}

              <Chip
                active={placementLibre}
                onClick={() => {
                  const next = !placementLibre
                  setPlacementLibre(next)
                  if (!next) setJoueurs((prev) => prev.map((j) => ({ ...j, slot: null })))
                  notify(next ? "Placement libre activé." : "Retour aux postes.")
                }}
              >
                <Shuffle size={14} /> Placement libre
              </Chip>

              <div className="inline-flex h-9 items-center gap-1 rounded-md border border-border px-1.5">
                <span className="px-1 font-ui text-[0.6rem] tracking-[0.1em] text-ink-muted uppercase">
                  Taille
                </span>
                <button
                  type="button"
                  aria-label="Réduire le terrain"
                  disabled={taille === "S"}
                  onClick={() => setTaille(TAILLES[TAILLES.indexOf(taille) - 1])}
                  className="flex size-6 items-center justify-center rounded-sm text-ink-muted transition-colors enabled:hover:bg-surface-hover enabled:hover:text-ink disabled:opacity-30"
                >
                  <Minus size={13} />
                </button>
                <span className="w-4 text-center font-ui text-[0.76rem] text-ink">
                  {taille}
                </span>
                <button
                  type="button"
                  aria-label="Agrandir le terrain"
                  disabled={taille === "L"}
                  onClick={() => setTaille(TAILLES[TAILLES.indexOf(taille) + 1])}
                  className="flex size-6 items-center justify-center rounded-sm text-ink-muted transition-colors enabled:hover:bg-surface-hover enabled:hover:text-ink disabled:opacity-30"
                >
                  <Plus size={13} />
                </button>
              </div>

              <div className="relative">
                <Chip
                  active={ouvert === "terrain"}
                  title="Changer le terrain"
                  onClick={() => setOuvert(ouvert === "terrain" ? null : "terrain")}
                >
                  <LayoutGrid size={14} />
                  {TERRAINS.find((t) => t.id === terrain)?.label}
                </Chip>
                {ouvert === "terrain" ? (
                  <div className="absolute top-full left-0 z-30 mt-1.5 flex w-[230px] flex-col gap-1 rounded-md border border-border bg-background p-1 shadow-deep">
                    {TERRAINS.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          setTerrain(t.id)
                          setOuvert(null)
                        }}
                        className={cn(
                          "flex items-center justify-between gap-2 rounded-sm px-3 py-2 text-left transition-colors",
                          t.id === terrain
                            ? "bg-surface-nested"
                            : "hover:bg-surface-hover",
                        )}
                      >
                        <span className="font-ui text-[0.8rem] text-ink">
                          {t.label}
                        </span>
                        <span className="font-body text-[0.68rem] text-ink-disabled">
                          {t.hint}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              <Chip onClick={() => setRolesOpen(true)}>
                <Crown size={14} /> Rôles & tireurs
              </Chip>

              <Chip onClick={() => setViderOpen(true)}>
                <Eraser size={14} /> Vider
              </Chip>
            </div>

            {enAttente ? (
              <div className="flex items-center gap-3 rounded-lg border border-brand-blue-600/30 bg-brand-blue-600/5 px-3.5 py-2.5">
                <p className="min-w-0 flex-1 font-body text-[0.8rem] text-ink">
                  Choisissez un poste pour{" "}
                  <span className="text-brand-blue-600">
                    {effectif.find((j) => j.id === enAttente)?.nom}
                  </span>
                  .
                </p>
                <Button variant="ghost" size="sm" onClick={() => setEnAttente(null)}>
                  Annuler
                </Button>
              </div>
            ) : null}

            <TerrainEditeur
              ref={pitchRef}
              joueurs={joueurs}
              slots={slots}
              terrain={terrain}
              taille={taille}
              placementLibre={placementLibre}
              sport={sport}
              selectedId={selected}
              onSelect={(jid) => setSelected(jid === selected ? null : jid)}
              onRemove={retirer}
              enAttente={enAttente}
              onPlaceSlot={(i) => {
                if (!enAttente) return
                placer(enAttente, i)
                setEnAttente(null)
              }}
            />

            {/* Phone bench — the joueurs still out, right under the board so the
                drag is a short vertical flick instead of a cross-page journey.
                It replaces the roster below, which needs a wide screen to read. */}
            <section className="rounded-lg border border-border p-3 lg:hidden">
              <div className="mb-2 flex items-center justify-between gap-2">
                <h2 className="font-ui text-[0.62rem] font-medium tracking-[0.1em] text-ink-muted uppercase">
                  Joueurs disponibles
                </h2>
                <span className="rounded-pill border border-brand-blue-600/30 bg-brand-blue-600/10 px-2 py-0.5 font-ui text-[0.64rem] text-brand-blue-600 tabular-nums">
                  {disponibles.length}
                </span>
              </div>

              {disponibles.length === 0 ? (
                <p className="py-4 text-center font-body text-[0.76rem] text-ink-disabled">
                  Tout le groupe est sur le terrain.
                </p>
              ) : (
                <>
                  <div className="-mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-1">
                    {disponibles.map((j) => (
                      <JoueurBanc
                        key={j.id}
                        id={j.id}
                        nom={j.nom}
                        poste={j.poste}
                        photo={j.photo}
                        selected={enAttente === j.id}
                        onSelect={() => choisir(j.id)}
                      />
                    ))}
                  </div>
                  <p className="mt-1.5 font-body text-[0.68rem] text-ink-disabled">
                    Glissez par la poignée vers le terrain, ou touchez un joueur
                    puis un poste. Balayez pour faire défiler.
                  </p>
                </>
              )}
            </section>

            {/* On-pitch roster — the readable form of the board, desktop only */}
            {joueurs.length > 0 ? (
              <section className="hidden rounded-lg border border-border p-3 lg:block">
                <h2 className="mb-2 font-ui text-[0.62rem] font-medium tracking-[0.1em] text-ink-muted uppercase">
                  Sur le terrain · {joueurs.length}
                </h2>
                <div className="flex flex-wrap gap-1.5">
                  {joueurs.map((j) => {
                    const tag = roleDe(j.id)
                    return (
                      <button
                        key={j.id}
                        type="button"
                        onClick={() => setSelected(j.id === selected ? null : j.id)}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-pill border px-2.5 py-1 font-ui text-[0.74rem] transition-colors",
                          j.id === selected
                            ? "border-brand-blue-600/40 bg-brand-blue-600/10 text-brand-blue-600"
                            : "border-border text-ink-muted hover:border-border-strong hover:text-ink",
                        )}
                      >
                        <span className="font-ui text-[0.62rem] text-ink-disabled">
                          {j.poste}
                        </span>
                        {j.nom}
                        {tag ? (
                          <span className="rounded-pill bg-warning/15 px-1.5 font-ui text-[0.58rem] text-warning">
                            {tag}
                          </span>
                        ) : null}
                      </button>
                    )
                  })}
                </div>
              </section>
            ) : null}
          </div>
        </div>

        {/* What follows the pointer while dragging */}
        <DragOverlay dropAnimation={null}>
          {actif ? (
            <span className="flex size-9 items-center justify-center overflow-hidden rounded-full border border-brand-blue-600 bg-background font-ui text-[0.62rem] text-ink shadow-deep">
              {actif.photo ? (
                <img src={actif.photo} alt="" className="size-full object-cover" />
              ) : (
                actif.poste
              )}
            </span>
          ) : null}
        </DragOverlay>
      </DndContext>

      {rolesOpen ? (
        <RolesModal
          roles={roles}
          joueurs={joueurs}
          onChange={setRoles}
          onClose={() => setRolesOpen(false)}
        />
      ) : null}

      <ConfirmDialog
        open={viderOpen}
        onOpenChange={setViderOpen}
        title="Vider le terrain ?"
        description="Tous les joueurs placés retournent dans la liste des disponibles."
        confirmLabel="Vider"
        onConfirm={() => {
          setJoueurs([])
          setRoles(rolesVides())
          setViderOpen(false)
          notify("Terrain vidé.")
        }}
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Supprimer cette composition ?"
        description={`« ${compo.titre} » sera retirée des compositions du club.`}
        confirmLabel="Supprimer"
        onConfirm={() => {
          removeComposition(compo.id)
          navigate(LIST)
        }}
      />

      {toast ? <Toast msg={toast.msg} id={toast.id} /> : null}
    </div>
  )
}
