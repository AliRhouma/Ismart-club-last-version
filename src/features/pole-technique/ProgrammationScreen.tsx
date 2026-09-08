import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  pointerWithin,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core"
import {
  CalendarDays,
  CalendarPlus,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  CircleDashed,
  Eraser,
  GripVertical,
  MapPin,
  Pencil,
  Plus,
  TrafficCone,
  Trash2,
  X,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { useData } from "@/data/useData"
import { PROG_SPECIALS, type ProgSession } from "@/data/seed/programmation"
import { EmptyState } from "@/components/kit/EmptyState"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useProgramme } from "@/features/pole-technique/useProgramme"
import { Segmented } from "@/features/budget/ui"
import { Toast } from "@/features/sponsoring/ui"
import {
  cleDe,
  cleSpeciale,
  couleurDe,
  encreSur,
} from "@/features/pole-technique/programmeCouleurs"

/* Radix Select reserves "" for "no value", so the unset row needs a sentinel. */
const PRINCIPE_A_DEFINIR = "a-definir"

type Filtre = "Toutes" | "Planifiées" | "À programmer"
type Vue = "planning" | "liste"

/** One legend entry — a colour, what it means, and how often it's programmed. */
type LegendeItem = { cle: string; nom: string; couleur: string; total: number }
type LegendeColonne = {
  titre: string
  blocs: { titre: string; items: LegendeItem[] }[]
}

/** The one "principe" that isn't one: dropping it empties a slot again. */
const VIDE = "__vide"

/** What dropping a legend key on a slot writes. */
const patchDe = (cle: string): Partial<ProgSession> =>
  cle === VIDE
    ? { principeId: undefined, special: undefined }
    : cle.startsWith("special:")
      ? { principeId: undefined, special: cle.slice(8) }
      : { principeId: cle, special: undefined }

export function ProgrammationScreen() {
  const navigate = useNavigate()
  const { categorie, programme: programmeAnnuel } = useProgramme()
  const {
    creerProgrammeAnnuel,
    seancesClub,
    procedeGroupes,
    procedePrincipes,
    procedePhases,
    updateProgSession,
    addProgSemaine,
    addProgSession,
    removeProgSession,
    removeProgSemaine,
  } = useData()

  const [vue, setVue] = useState<Vue>("planning")
  const [filtre, setFiltre] = useState<Filtre>("Toutes")
  /** Legend selection — isolates one principe across the whole season. */
  const [cleActive, setCleActive] = useState<string | null>(null)
  const [openId, setOpenId] = useState<string | null>(null)
  /** Edit mode: shape the season itself (semaines, séances, principes). */
  const [edition, setEdition] = useState(false)
  /** Picked-up principe — tap it, then tap the séances it applies to. */
  const [pinceau, setPinceau] = useState<string | null>(null)
  /** The chip currently under the finger / cursor, for the drag overlay. */
  const [drag, setDrag] = useState<{ nom: string; couleur: string | null } | null>(
    null,
  )
  const [toast, setToast] = useState<{ id: number; msg: string } | null>(null)
  const toastId = useRef(0)
  const notify = (msg: string) => setToast({ id: toastId.current++, msg })
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2600)
    return () => clearTimeout(t)
  }, [toast])

  // Mouse drags start on a small move; touch drags after a short press, so the
  // dock and the page can still be scrolled with a finger.
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 180, tolerance: 8 },
    }),
  )

  const principeById = useMemo(
    () => new Map(procedePrincipes.map((p) => [p.id, p])),
    [procedePrincipes],
  )
  const phaseById = useMemo(
    () => new Map(procedePhases.map((p) => [p.id, p])),
    [procedePhases],
  )
  /** The label a slot shows: its principe, its special slot, or nothing yet. */
  const labelOf = (s: ProgSession) =>
    s.principeId ? (principeById.get(s.principeId)?.nom ?? "") : (s.special ?? "")
  const phaseOf = (s: ProgSession) => {
    const pr = s.principeId ? principeById.get(s.principeId) : null
    return pr ? (phaseById.get(pr.phaseId)?.nom ?? "") : ""
  }
  const nomDeCle = (cle: string) =>
    cle === VIDE
      ? "À définir"
      : cle.startsWith("special:")
        ? cle.slice(8)
        : (principeById.get(cle)?.nom ?? "Principe")

  const sessions = useMemo(
    () => programmeAnnuel?.sessions ?? [],
    [programmeAnnuel],
  )

  /** A slot is live when it passes the filter AND the legend selection. */
  const visible = useMemo(
    () =>
      sessions.filter(
        (s) =>
          (filtre === "Toutes"
            ? true
            : filtre === "Planifiées"
              ? !!s.seanceId
              : !s.seanceId) &&
          (!cleActive || cleDe(s) === cleActive),
      ),
    [sessions, filtre, cleActive],
  )
  const actifs = useMemo(() => new Set(visible.map((s) => s.id)), [visible])

  /** Weeks in order — the planning keeps every slot, the list only matches. */
  const semainesGrille = useMemo(() => {
    const map = new Map<number, ProgSession[]>()
    for (const s of vue === "planning" ? sessions : visible) {
      const arr = map.get(s.semaine) ?? map.set(s.semaine, []).get(s.semaine)!
      arr.push(s)
    }
    return [...map.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([semaine, slots]) => ({
        semaine,
        slots: slots.sort((a, b) => a.index - b.index),
      }))
  }, [sessions, visible, vue])

  /** Legend: the taxonomy's own families, plus the séances spéciales. */
  const legende = useMemo<LegendeColonne[]>(() => {
    const total = (cle: string) =>
      sessions.filter((s) => cleDe(s) === cle).length

    const item = (cle: string, nom: string): LegendeItem => ({
      cle,
      nom,
      couleur: couleurDe(cle)!,
      total: total(cle),
    })

    const familles = procedeGroupes
      .filter((g) => g.kind === "principe")
      .map((g) => ({
        titre: g.nom,
        blocs: procedePhases
          .filter((ph) => ph.groupeId === g.id)
          .map((ph) => ({
            titre: ph.nom,
            items: procedePrincipes
              .filter((pr) => pr.phaseId === ph.id)
              .map((pr) => item(pr.id, pr.nom)),
          })),
      }))

    // "Autre" holds the séances spéciales, plus any complementary procédé the
    // plan actually programmes (they'd otherwise be a colour with no key).
    const dansFamilles = new Set(
      familles.flatMap((f) => f.blocs.flatMap((b) => b.items.map((i) => i.cle))),
    )
    const complementaires = procedePrincipes.filter(
      (pr) => !dansFamilles.has(pr.id) && total(pr.id) > 0,
    )
    const autre: LegendeColonne = {
      titre: "Autre",
      blocs: [
        {
          titre: "Séances spéciales",
          items: PROG_SPECIALS.map((sp) => item(cleSpeciale(sp), sp)),
        },
        ...(complementaires.length
          ? [
              {
                titre: "Procédés complémentaires",
                items: complementaires.map((pr) => item(pr.id, pr.nom)),
              },
            ]
          : []),
      ],
    }
    return [...familles, autre]
  }, [sessions, procedeGroupes, procedePhases, procedePrincipes])

  /** The same legend, flattened per family — what the mobile dock scrolls. */
  const familles = useMemo(
    () =>
      legende.map((col) => ({
        titre: col.titre,
        items: col.blocs.flatMap((b) => b.items),
      })),
    [legende],
  )

  const openSlot = sessions.find((s) => s.id === openId) ?? null
  const openSeance = openSlot?.seanceId
    ? (seancesClub.find((s) => s.id === openSlot.seanceId) ?? null)
    : null

  /* ── Édition ─────────────────────────────────────────────────────────── */

  const basculerEdition = () => {
    setPinceau(null)
    if (!edition) {
      // Editing happens on the planning: no filter, no isolation, no list.
      setVue("planning")
      setFiltre("Toutes")
      setCleActive(null)
    }
    setEdition((e) => !e)
  }

  // One séance repaints in place — no toast, the colour says it. A whole week
  // and every structural change do get one.
  const appliquerSurSlot = (cle: string, slotId: string) =>
    updateProgSession(slotId, patchDe(cle))
  const appliquerSurSemaine = (cle: string, semaine: number) => {
    const slots = sessions.filter((s) => s.semaine === semaine)
    slots.forEach((s) => updateProgSession(s.id, patchDe(cle)))
    notify(`${nomDeCle(cle)} · semaine ${semaine} (${slots.length} séances).`)
  }

  const onDragStart = (e: DragStartEvent) => {
    const d = e.active.data.current
    if (d) setDrag({ nom: String(d.nom), couleur: d.couleur ?? null })
  }
  const onDragEnd = (e: DragEndEvent) => {
    setDrag(null)
    const cle = e.active.data.current?.cle as string | undefined
    const cible = e.over?.data.current as
      | { type: "slot"; slotId: string }
      | { type: "semaine"; semaine: number }
      | undefined
    if (!cle || !cible) return
    if (cible.type === "slot") appliquerSurSlot(cle, cible.slotId)
    else appliquerSurSemaine(cle, cible.semaine)
  }

  /** Tapping a séance in edit mode paints it when a principe is held. */
  const ouvrirOuPeindre = (slot: ProgSession) => {
    if (edition && pinceau) appliquerSurSlot(pinceau, slot.id)
    else setOpenId(slot.id)
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      // The palettes sit at the bottom of the page: a wide auto-scroll zone
      // would yank the planning away the moment a principe is picked up.
      autoScroll={{ threshold: { x: 0, y: 0.06 }, acceleration: 6 }}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragCancel={() => setDrag(null)}
    >
      <div
        className={cn(
          "flex w-full flex-col gap-6",
          // Room for the principes dock that stays docked on mobile.
          edition && "pb-48 lg:pb-0",
        )}
      >
        {!programmeAnnuel ? (
          <div className="rounded-lg border border-border">
            <EmptyState
              icon={CalendarDays}
              title="Aucun programme annuel"
              description={`${categorie?.nom ?? "Cette équipe"} n'a pas encore de programme pour cette saison. Il servira à tous ses groupes.`}
              action={
                <Button
                  onClick={() => {
                    creerProgrammeAnnuel()
                    notify("Programme annuel créé.")
                  }}
                >
                  <CalendarPlus /> Créer le programme annuel
                </Button>
              }
            />
          </div>
        ) : (
          <>
            {edition ? (
              /* Edit toolbar — says what a drag does, and what's held. */
              <div className="flex flex-wrap items-center gap-3 border-b border-border pb-3">
                <span className="inline-flex items-center gap-1.5 rounded-pill border border-info/30 bg-info/10 px-3 py-1.5 font-ui text-[0.72rem] text-info">
                  <Pencil size={12} /> Mode édition
                </span>
                <p className="hidden font-body text-sm text-ink-muted sm:block">
                  Glissez un principe sur une séance — ou sur « Sem N » pour
                  toute la semaine.
                </p>
                <div className="ml-auto flex items-center gap-2">
                  {pinceau ? (
                    <button
                      type="button"
                      onClick={() => setPinceau(null)}
                      className="inline-flex items-center gap-1.5 rounded-pill border border-border-strong px-3 py-1.5 font-ui text-[0.72rem] text-ink transition-colors hover:border-danger hover:text-danger"
                      title="Reposer le principe"
                    >
                      <span
                        aria-hidden
                        className="size-2 rounded-full"
                        style={{
                          backgroundColor:
                            couleurDe(pinceau === VIDE ? null : pinceau) ??
                            "#525252",
                        }}
                      />
                      {nomDeCle(pinceau)} <X size={12} />
                    </button>
                  ) : null}
                  <ChipPrincipe
                    source="barre"
                    cle={VIDE}
                    nom="À définir"
                    couleur={null}
                    edition
                    actif={pinceau === VIDE}
                    onPick={() =>
                      setPinceau((p) => (p === VIDE ? null : VIDE))
                    }
                  />
                  <Button size="sm" onClick={basculerEdition}>
                    <Check /> Terminer
                  </Button>
                </div>
              </div>
            ) : (
              /* View + the one question a coach asks: what's left to plan? */
              <div className="flex flex-wrap items-center gap-3 border-b border-border pb-3">
                <Segmented
                  value={vue}
                  onChange={setVue}
                  options={[
                    { value: "planning", label: "Planning" },
                    { value: "liste", label: "Liste" },
                  ]}
                />
                <div className="flex gap-1 rounded-pill border border-border p-1">
                  {(["Toutes", "Planifiées", "À programmer"] as const).map(
                    (f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setFiltre(f)}
                        className={cn(
                          "rounded-pill border px-3.5 py-1.5 font-ui text-[0.76rem] font-medium transition-colors",
                          f === filtre
                            ? "border-border-second bg-surface-nested text-ink"
                            : "border-transparent text-ink-muted hover:text-ink",
                        )}
                      >
                        {f}
                      </button>
                    ),
                  )}
                </div>

                {cleActive ? (
                  <button
                    type="button"
                    onClick={() => setCleActive(null)}
                    className="inline-flex items-center gap-1.5 font-ui text-[0.72rem] font-medium tracking-[0.04em] text-info uppercase transition-colors hover:text-ink"
                  >
                    <X size={13} /> Tout afficher
                  </button>
                ) : null}

                <p className="ml-auto font-body text-sm text-ink-muted">
                  <span className="text-ink">{visible.length}</span> séance
                  {visible.length > 1 ? "s" : ""}
                </p>

                {/* Editing shapes the programme below, so its switch sits with
                    the filters that scope it — not up in the section header. */}
                <Button variant="outline" size="sm" onClick={basculerEdition}>
                  <Pencil /> Modifier
                </Button>
              </div>
            )}

            {vue === "planning" ? (
              <div className="flex flex-col gap-7">
                <div className="grid grid-cols-[repeat(auto-fill,minmax(112px,1fr))] gap-x-3 gap-y-4">
                  {semainesGrille.map(({ semaine, slots }) => (
                    <div
                      key={semaine}
                      className="group/semaine flex flex-col gap-1.5"
                    >
                      <SemaineEntete
                        semaine={semaine}
                        edition={edition}
                        pinceau={pinceau}
                        planifiee={slots.some((s) => s.seanceId)}
                        onPeindre={() =>
                          pinceau && appliquerSurSemaine(pinceau, semaine)
                        }
                        onSupprimer={() => {
                          removeProgSemaine(programmeAnnuel.id, semaine)
                          notify(`Semaine ${semaine} supprimée.`)
                        }}
                      />
                      <div className="flex gap-1">
                        {slots.map((s) => (
                          <Tuile
                            key={s.id}
                            slot={s}
                            label={labelOf(s)}
                            actif={actifs.has(s.id)}
                            edition={edition}
                            onOpen={() => ouvrirOuPeindre(s)}
                            onSupprimer={() => {
                              removeProgSession(s.id)
                              notify("Séance retirée du programme.")
                            }}
                          />
                        ))}
                        {edition ? (
                          <button
                            type="button"
                            title="Ajouter une séance à cette semaine"
                            onClick={() => {
                              addProgSession(programmeAnnuel.id, semaine)
                              notify(`Séance ajoutée · semaine ${semaine}.`)
                            }}
                            className="flex w-5 shrink-0 items-center justify-center rounded-sm border border-dashed border-border-strong text-ink-disabled transition-[color,border-color,opacity] hover:border-info hover:text-info lg:opacity-0 lg:group-hover/semaine:opacity-100 lg:focus-visible:opacity-100"
                          >
                            <Plus size={11} />
                          </button>
                        ) : null}
                      </div>
                    </div>
                  ))}

                  {edition ? (
                    <button
                      type="button"
                      onClick={() => {
                        addProgSemaine(programmeAnnuel.id)
                        notify("Semaine ajoutée au programme.")
                      }}
                      className="group flex flex-col gap-1.5 text-left"
                    >
                      <span className="font-ui text-[0.6rem] font-medium tracking-[0.1em] text-ink-disabled uppercase">
                        Nouvelle
                      </span>
                      <span className="flex min-h-[3.4rem] flex-1 items-center justify-center gap-1.5 rounded-sm border border-dashed border-border-strong font-ui text-[0.62rem] text-ink-muted transition-colors group-hover:border-info group-hover:text-info">
                        <Plus size={13} /> Semaine
                      </span>
                    </button>
                  ) : null}
                </div>

                <Legende
                  colonnes={legende}
                  cleActive={cleActive}
                  edition={edition}
                  pinceau={pinceau}
                  onPick={(cle) =>
                    edition
                      ? setPinceau((p) => (p === cle ? null : cle))
                      : setCleActive((prev) => (prev === cle ? null : cle))
                  }
                />
              </div>
            ) : semainesGrille.length === 0 ? (
              <div className="rounded-lg border border-border">
                <EmptyState
                  icon={CalendarDays}
                  title="Rien à afficher"
                  description="Aucune séance du programme ne correspond à ce filtre."
                  action={
                    <Button
                      variant="outline"
                      onClick={() => {
                        setFiltre("Toutes")
                        setCleActive(null)
                      }}
                    >
                      <X /> Voir tout le programme
                    </Button>
                  }
                />
              </div>
            ) : (
              <div className="flex flex-col gap-5">
                {semainesGrille.map(({ semaine, slots }) => (
                  <section key={semaine} className="flex flex-col gap-2.5">
                    <h2 className="font-ui text-[0.66rem] font-medium tracking-[0.1em] text-ink-disabled uppercase">
                      Semaine {semaine}
                    </h2>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {slots.map((s) => (
                        <SlotCard
                          key={s.id}
                          slot={s}
                          label={labelOf(s)}
                          phase={phaseOf(s)}
                          onOpen={() => setOpenId(s.id)}
                        />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </>
        )}

        {/* One slot — retarget its principe, or turn it into a real séance. */}
        <Dialog open={!!openSlot} onOpenChange={(o) => !o && setOpenId(null)}>
          <DialogContent className="max-h-[85vh] overflow-y-auto rounded-xl sm:max-w-md">
            {openSlot && programmeAnnuel ? (
              <>
                <DialogHeader>
                  <DialogTitle>Séance {openSlot.numero}</DialogTitle>
                  <DialogDescription>
                    Semaine {openSlot.semaine} · {programmeAnnuel.categorie} ·{" "}
                    {programmeAnnuel.saison}
                  </DialogDescription>
                </DialogHeader>

                <div className="flex flex-col gap-5">
                  <label className="flex flex-col gap-2">
                    <span className="block font-ui text-[0.72rem] font-medium text-ink">
                      Principe travaillé
                    </span>
                    <Select
                      value={cleDe(openSlot) ?? PRINCIPE_A_DEFINIR}
                      onValueChange={(v) =>
                        updateProgSession(
                          openSlot.id,
                          v.startsWith("special:")
                            ? { principeId: undefined, special: v.slice(8) }
                            : {
                                principeId:
                                  v === PRINCIPE_A_DEFINIR ? undefined : v,
                                special: undefined,
                              },
                        )
                      }
                    >
                      <SelectTrigger aria-label="Principe travaillé">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={PRINCIPE_A_DEFINIR}>
                          À définir
                        </SelectItem>
                        {procedePhases.map((ph) => {
                          const principes = procedePrincipes.filter(
                            (pr) => pr.phaseId === ph.id,
                          )
                          if (!principes.length) return null
                          return (
                            <SelectGroup key={ph.id}>
                              <SelectLabel>{ph.nom}</SelectLabel>
                              {principes.map((pr) => (
                                <SelectItem key={pr.id} value={pr.id}>
                                  {pr.nom}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          )
                        })}
                        <SelectGroup>
                          <SelectLabel>Autre</SelectLabel>
                          {PROG_SPECIALS.map((sp) => (
                            <SelectItem key={sp} value={cleSpeciale(sp)}>
                              {sp}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </label>

                  {openSlot.installation ? (
                    <p className="flex items-center gap-2 font-body text-[0.84rem] text-ink-muted">
                      <MapPin size={13} /> {openSlot.installation}
                    </p>
                  ) : null}

                  <div className="rounded-lg border border-border p-4">
                    {openSeance ? (
                      <div className="flex flex-col gap-3">
                        <p className="font-body text-[0.84rem] text-ink-muted">
                          Cette ligne du programme est déjà planifiée.
                        </p>
                        <Button
                          variant="outline"
                          onClick={() =>
                            navigate(`/pole-technique/seances/${openSeance.id}`)
                          }
                        >
                          Ouvrir la séance <ChevronRight />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3">
                        <p className="font-body text-[0.84rem] text-ink-muted">
                          Pas encore de séance. La fiche de création reprend le
                          principe, la semaine et le lieu de cette ligne.
                        </p>
                        <Button
                          onClick={() =>
                            navigate(
                              `/pole-technique/seances/nouvelle/${openSlot.id}`,
                            )
                          }
                        >
                          <CalendarPlus /> Créer la séance
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpenId(null)}>
                    Fermer
                  </Button>
                </DialogFooter>
              </>
            ) : null}
          </DialogContent>
        </Dialog>

        {toast ? (
          <Toast
            msg={toast.msg}
            id={toast.id}
            // Above the principes dock while editing on a phone.
            className={cn(edition && "bottom-44 lg:bottom-5")}
          />
        ) : null}
      </div>

      {/* Mobile: the principes stay docked under the planning while editing —
          the legend sits far below the grid, too far to drag from on a phone. */}
      {edition && programmeAnnuel ? (
        <PrincipesDock
          familles={familles}
          pinceau={pinceau}
          onPick={(cle) => setPinceau((p) => (p === cle ? null : cle))}
        />
      ) : null}

      {/* What the finger / cursor carries while dragging. */}
      <DragOverlay dropAnimation={null}>
        {drag ? (
          <span
            className="inline-flex items-center gap-2 rounded-pill border bg-surface px-3 py-1.5 font-ui text-[0.72rem] text-ink shadow-deep"
            style={{ borderColor: drag.couleur ?? undefined }}
          >
            {drag.couleur ? (
              <span
                aria-hidden
                className="size-2 rounded-full"
                style={{ backgroundColor: drag.couleur }}
              />
            ) : (
              <Eraser size={12} />
            )}
            {drag.nom}
          </span>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

/* ── Planning ─────────────────────────────────────────────────────────────── */

/** Week header — also the drop zone that themes a whole week at once. */
function SemaineEntete({
  semaine,
  edition,
  pinceau,
  planifiee,
  onPeindre,
  onSupprimer,
}: {
  semaine: number
  edition: boolean
  pinceau: string | null
  /** A week holding a real séance can't be dropped from the programme. */
  planifiee: boolean
  onPeindre: () => void
  onSupprimer: () => void
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `sem:${semaine}`,
    disabled: !edition,
    data: { type: "semaine", semaine },
  })
  return (
    <div className="flex items-center gap-1">
      <button
        ref={setNodeRef}
        type="button"
        disabled={!edition || !pinceau}
        onClick={onPeindre}
        title={edition ? `Appliquer à toute la semaine ${semaine}` : undefined}
        className={cn(
          "rounded-sm px-1 py-0.5 font-ui text-[0.6rem] font-medium tracking-[0.1em] uppercase transition-colors",
          isOver ? "bg-info/15 text-info" : "text-ink-disabled",
          edition && pinceau && !isOver && "hover:bg-surface-hover hover:text-ink",
        )}
      >
        Sem {semaine}
      </button>
      {edition ? (
        <button
          type="button"
          onClick={onSupprimer}
          disabled={planifiee}
          title={
            planifiee
              ? "Semaine planifiée — supprimez d'abord ses séances"
              : "Supprimer la semaine"
          }
          className="ml-auto inline-flex size-4 items-center justify-center rounded-sm text-ink-disabled transition-[color,opacity] hover:text-danger disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:text-ink-disabled lg:opacity-0 lg:group-hover/semaine:opacity-100 lg:focus-visible:opacity-100 lg:disabled:opacity-0 lg:group-hover/semaine:disabled:opacity-40"
        >
          <Trash2 size={11} />
        </button>
      ) : null}
    </div>
  )
}

function Tuile({
  slot,
  label,
  actif,
  edition,
  onOpen,
  onSupprimer,
}: {
  slot: ProgSession
  label: string
  actif: boolean
  edition: boolean
  onOpen: () => void
  onSupprimer: () => void
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `slot:${slot.id}`,
    disabled: !edition,
    data: { type: "slot", slotId: slot.id },
  })
  const couleur = couleurDe(cleDe(slot))
  const encre = couleur ? encreSur(couleur) : undefined
  const planifiee = !!slot.seanceId
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "relative flex flex-1 rounded-sm transition-shadow",
        isOver && "ring-2 ring-info",
      )}
    >
      <button
        type="button"
        onClick={onOpen}
        title={`Séance ${slot.numero} · ${label || "À définir"}${
          planifiee ? " · planifiée" : ""
        }`}
        className={cn(
          "group flex flex-1 flex-col gap-px transition-opacity",
          actif ? "opacity-100" : "opacity-15",
        )}
      >
        <span
          className={cn(
            "relative flex h-10 items-center justify-center rounded-t-sm border transition-[filter,border-color] group-hover:brightness-125",
            couleur
              ? "border-transparent"
              : "border-dashed border-border-strong text-ink-disabled group-hover:border-ink-muted",
          )}
          style={couleur ? { backgroundColor: couleur, color: encre } : undefined}
        >
          <TrafficCone size={14} />
          {planifiee ? (
            <CheckCircle2
              size={9}
              className="absolute top-1 right-1 opacity-80"
            />
          ) : null}
        </span>
        <span
          className={cn(
            "rounded-b-sm border py-0.5 text-center font-ui text-[0.58rem] tabular-nums transition-[filter,border-color] group-hover:brightness-125",
            couleur
              ? "border-transparent"
              : "border-dashed border-border-strong text-ink-disabled group-hover:border-ink-muted",
          )}
          style={couleur ? { backgroundColor: couleur, color: encre } : undefined}
        >
          S{slot.numero}
        </span>
      </button>

      {/* Editing: drop the séance placeholder. A planned one keeps its séance. */}
      {edition && !planifiee ? (
        <button
          type="button"
          onClick={onSupprimer}
          title={`Retirer la séance ${slot.numero}`}
          className="absolute top-0.5 right-0.5 z-10 inline-flex size-4 items-center justify-center rounded-sm bg-background/70 text-ink-muted transition-[color,background-color,opacity] hover:bg-background hover:text-danger lg:opacity-0 lg:group-hover/semaine:opacity-100 lg:focus-visible:opacity-100"
        >
          <X size={10} />
        </button>
      ) : null}
    </div>
  )
}

/* ── Principes : légende, puce déplaçable, dock mobile ────────────────────── */

/** A principe as a draggable pill — the dock and the toolbar both use it. */
function ChipPrincipe({
  source,
  cle,
  nom,
  couleur,
  actif,
  edition,
  onPick,
}: {
  /** Namespaces the drag id — the same principe exists in several palettes. */
  source: string
  cle: string
  nom: string
  couleur: string | null
  actif: boolean
  edition: boolean
  onPick: () => void
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `${source}:${cle}`,
    disabled: !edition,
    data: { cle, nom, couleur },
  })
  return (
    <button
      ref={setNodeRef}
      type="button"
      onClick={onPick}
      {...listeners}
      {...attributes}
      style={{
        borderColor: couleur ?? undefined,
        backgroundColor: actif && couleur ? `${couleur}26` : undefined,
        touchAction: "manipulation",
      }}
      className={cn(
        "inline-flex shrink-0 cursor-grab items-center gap-2 rounded-pill border px-3 py-1.5 font-ui text-[0.72rem] transition-colors active:cursor-grabbing",
        couleur ? "" : "border-dashed border-border-strong",
        actif ? "text-ink" : "text-ink-subtle hover:text-ink",
        !couleur && actif && "bg-surface-nested",
        isDragging && "opacity-40",
      )}
    >
      {couleur ? (
        <span
          aria-hidden
          className="size-2 shrink-0 rounded-full"
          style={{ backgroundColor: couleur }}
        />
      ) : (
        <Eraser size={12} aria-hidden />
      )}
      <span className="whitespace-nowrap">{nom}</span>
    </button>
  )
}

function Legende({
  colonnes,
  cleActive,
  edition,
  pinceau,
  onPick,
}: {
  colonnes: LegendeColonne[]
  cleActive: string | null
  edition: boolean
  pinceau: string | null
  onPick: (cle: string) => void
}) {
  return (
    <div className="grid gap-x-6 gap-y-6 border-t border-border pt-6 lg:grid-cols-3">
      {colonnes.map((col) => (
        <div key={col.titre} className="flex flex-col gap-3.5">
          <h3 className="font-ui text-[0.9rem] font-medium text-ink">
            {col.titre}
          </h3>
          {col.blocs.map((bloc) => (
            <div key={bloc.titre} className="flex flex-col gap-1.5">
              <span className="font-ui text-[0.68rem] text-ink-muted">
                {bloc.titre}
              </span>
              {bloc.items.map((it) => (
                <LegendeLigne
                  key={it.cle}
                  item={it}
                  on={edition ? pinceau === it.cle : cleActive === it.cle}
                  edition={edition}
                  onPick={() => onPick(it.cle)}
                />
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

/** One legend row — a filter when reading, a drag handle when editing. */
function LegendeLigne({
  item,
  on,
  edition,
  onPick,
}: {
  item: LegendeItem
  on: boolean
  edition: boolean
  onPick: () => void
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `legende:${item.cle}`,
    disabled: !edition,
    data: { cle: item.cle, nom: item.nom, couleur: item.couleur },
  })
  return (
    <button
      ref={setNodeRef}
      type="button"
      onClick={onPick}
      {...listeners}
      {...attributes}
      style={{
        borderColor: item.couleur,
        backgroundColor: on ? `${item.couleur}26` : undefined,
        touchAction: "manipulation",
      }}
      className={cn(
        "flex items-center gap-2.5 rounded-md border px-3 py-2 text-left font-ui text-[0.74rem] transition-colors",
        on ? "text-ink" : "text-ink-subtle hover:text-ink",
        edition && "cursor-grab active:cursor-grabbing",
        isDragging && "opacity-40",
      )}
    >
      {edition ? (
        <GripVertical size={12} className="shrink-0 text-ink-disabled" />
      ) : null}
      <span className="flex-1">{item.nom}</span>
      <span className="shrink-0 font-ui text-[0.66rem] text-ink-muted tabular-nums">
        {item.total}
      </span>
    </button>
  )
}

/**
 * Mobile-only palette pinned under the planning while editing: pick a family,
 * then drag a principe onto a séance — or tap it and tap the séances it fills.
 */
function PrincipesDock({
  familles,
  pinceau,
  onPick,
}: {
  familles: { titre: string; items: LegendeItem[] }[]
  pinceau: string | null
  onPick: (cle: string) => void
}) {
  const [ouvert, setOuvert] = useState(true)
  const [onglet, setOnglet] = useState(familles[0]?.titre ?? "")
  const famille =
    familles.find((f) => f.titre === onglet) ?? familles[0] ?? null

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface shadow-deep lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-center gap-2 px-4 py-2">
        <span className="font-ui text-[0.62rem] font-medium tracking-[0.1em] text-ink-disabled uppercase">
          Principes
        </span>
        <span className="truncate font-body text-[0.72rem] text-ink-muted">
          {pinceau
            ? "Touchez une séance pour l'appliquer"
            : "Glissez-en un sur une séance"}
        </span>
        <button
          type="button"
          onClick={() => setOuvert((o) => !o)}
          aria-label={ouvert ? "Réduire la palette" : "Ouvrir la palette"}
          className="ml-auto inline-flex size-7 shrink-0 items-center justify-center rounded-sm border border-border text-ink-muted transition-colors hover:text-ink"
        >
          {ouvert ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </button>
      </div>

      {ouvert ? (
        <>
          <div className="flex gap-1 overflow-x-auto px-4 pb-2">
            {familles.map((f) => (
              <button
                key={f.titre}
                type="button"
                onClick={() => setOnglet(f.titre)}
                className={cn(
                  "shrink-0 rounded-pill border px-3 py-1 font-ui text-[0.68rem] font-medium transition-colors",
                  f.titre === famille?.titre
                    ? "border-border-second bg-surface-nested text-ink"
                    : "border-transparent text-ink-muted",
                )}
              >
                {f.titre}
              </button>
            ))}
          </div>

          <div className="flex gap-2 overflow-x-auto px-4 pb-3">
            <ChipPrincipe
              source="dock"
              cle={VIDE}
              nom="À définir"
              couleur={null}
              edition
              actif={pinceau === VIDE}
              onPick={() => onPick(VIDE)}
            />
            {famille?.items.map((it) => (
              <ChipPrincipe
                key={it.cle}
                source="dock"
                cle={it.cle}
                nom={it.nom}
                couleur={it.couleur}
                edition
                actif={pinceau === it.cle}
                onPick={() => onPick(it.cle)}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  )
}

/* ── Liste ────────────────────────────────────────────────────────────────── */

function SlotCard({
  slot,
  label,
  phase,
  onOpen,
}: {
  slot: ProgSession
  label: string
  phase: string
  onOpen: () => void
}) {
  const planifiee = !!slot.seanceId
  const couleur = couleurDe(cleDe(slot))
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group relative flex flex-col overflow-hidden rounded-lg border border-border bg-background p-4 text-left transition-colors hover:border-border-strong"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 origin-top scale-y-0 bg-surface transition-transform duration-[260ms] ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:scale-y-100"
      />
      <span className="relative z-10 flex flex-col gap-2.5">
        <span className="flex items-center justify-between gap-2">
          <span className="font-ui text-[0.7rem] text-ink-disabled tabular-nums">
            Séance {slot.numero}
          </span>
          {/* Planned vs. still to plan — the only status this screen tracks. */}
          <span
            className={cn(
              "inline-flex items-center gap-1.5 font-ui text-[0.66rem]",
              planifiee ? "text-info" : "text-ink-disabled",
            )}
          >
            {planifiee ? (
              <>
                <CheckCircle2 size={12} /> Planifiée
              </>
            ) : (
              <>
                <CircleDashed size={12} /> À programmer
              </>
            )}
          </span>
        </span>

        <span className="flex items-center gap-2">
          {/* Same colour key as the planning grid. */}
          <span
            aria-hidden
            className={cn(
              "size-2 shrink-0 rounded-full",
              couleur ? "" : "border border-dashed border-border-strong",
            )}
            style={couleur ? { backgroundColor: couleur } : undefined}
          />
          <span className="font-ui text-[0.9rem] text-ink transition-colors group-hover:text-brand-blue-600">
            {label || "À définir"}
          </span>
        </span>

        {phase ? (
          <span className="font-ui text-[0.7rem] text-ink-muted">{phase}</span>
        ) : null}
      </span>
    </button>
  )
}
