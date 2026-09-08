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
  ArrowRight,
  CalendarCheck2,
  CalendarDays,
  CalendarPlus,
  Check,
  ChevronLeft,
  ChevronRight,
  GripVertical,
  Pencil,
  Plus,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react"

import { cn } from "@/lib/utils"
import {
  JOURS_FR,
  JOURS_MIN_FR,
  MOIS_FR,
  grilleDuMois,
  jourDeIso,
  libelleJourCourt,
  versIso,
} from "@/lib/calendrier"
import { useData } from "@/data/useData"
import type { ProgSession, SeanceClub } from "@/data/seed/programmation"
import type { SeanceConvocation } from "@/data/seed/convocations"
import type { ConvocationStatut } from "@/data/seed/seances"
import type { Categorie } from "@/data/seed/categories"
import { EmptyState } from "@/components/kit/EmptyState"
import { ConfirmDialog } from "@/components/kit/ConfirmDialog"
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
import { ConvocationBuilder } from "@/features/planification/ConvocationBuilder"
import { Toast } from "@/features/sponsoring/ui"
import { cleDe, couleurDe, encreSur } from "@/features/pole-technique/programmeCouleurs"
import { useProgramme } from "@/features/pole-technique/useProgramme"

/** A scope on the calendar: one catégorie × groupe, by the names séances carry. */
type Lorgnette = { id: string; categorie: string; groupe: string }

const cleLorgnette = (categorie: string, groupe: string) =>
  `${categorie}::${groupe}`

/**
 * When the season's séances actually happen. The programme belongs to the whole
 * équipe, so its groupes are all on the calendar and each can be switched off;
 * groupes from other équipes can be laid over the top, because the real question
 * here is "does this clash with the U15s on Wednesday?".
 */
export function ProgrammePlanificationTab() {
  const navigate = useNavigate()
  const { categorie, groupes, programme } = useProgramme()
  const {
    categories,
    seancesClub,
    procedePrincipes,
    convocations,
    planifierSeance,
    removeConvocation,
  } = useData()

  // Open on the month the season actually starts in — today's month is usually
  // empty, and an empty grid reads as a broken screen rather than an early one.
  const [mois, setMois] = useState(() => {
    const premiere = seancesClub
      .filter((s) => s.categorie === categorie?.nom)
      .map((s) => s.date)
      .sort()[0]
    const d = premiere ? new Date(premiere) : new Date()
    return { annee: d.getFullYear(), mois: d.getMonth() }
  })
  const [comparees, setComparees] = useState<Lorgnette[]>([])
  /** Groupes of this équipe currently drawn — all of them until one is hidden. */
  const [caches, setCaches] = useState<string[]>([])
  /** "calendrier" reads the season; "placement" fills it in. */
  const [mode, setMode] = useState<"calendrier" | "placement">("calendrier")
  /** Groupe the placed séances are created for. */
  const [pourGroupe, setPourGroupe] = useState("")
  /** Picked-up slot — tap it, then tap a day. Paired with the drag on purpose:
   *  on a phone the target day is often off-screen while dragging. */
  const [enMain, setEnMain] = useState<string | null>(null)
  const [drag, setDrag] = useState<ProgSession | null>(null)
  const [jourActif, setJourActif] = useState<string | null>(null)
  /** The séance whose two-way choice modal is open. */
  const [seanceChoisie, setSeanceChoisie] = useState<SeanceClub | null>(null)
  const [convocationPour, setConvocationPour] = useState<SeanceClub | null>(null)
  /** The séance whose saved convocation is being read. */
  const [convocationVue, setConvocationVue] = useState<SeanceClub | null>(null)
  const [annulerConvocation, setAnnulerConvocation] = useState<string | null>(
    null,
  )
  const [toast, setToast] = useState<{ id: number; msg: string } | null>(null)
  const toastId = useRef(0)
  const notify = (msg: string) =>
    setToast({ id: toastId.current++, msg })
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 2600)
    return () => clearTimeout(t)
  }, [toast])

  const principeById = useMemo(
    () => new Map(procedePrincipes.map((p) => [p.id, p])),
    [procedePrincipes],
  )

  // Mouse drags start on a small move; touch drags after a short press, so the
  // list and the page can still be scrolled with a finger.
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 180, tolerance: 8 },
    }),
  )

  /** The équipe's own groupes, plus whatever the coach laid over them. */
  const propres: Lorgnette[] = groupes.map((g) => ({
    id: cleLorgnette(categorie?.nom ?? "", g.nom),
    categorie: categorie?.nom ?? "",
    groupe: g.nom,
  }))
  const lorgnettes = [...propres, ...comparees]

  const vues = new Set(
    lorgnettes.filter((l) => !caches.includes(l.id)).map((l) => l.id),
  )
  const seances = seancesClub.filter((s) =>
    vues.has(cleLorgnette(s.categorie, s.groupe)),
  )

  const parJour = new Map<string, SeanceClub[]>()
  for (const s of seances) {
    const jour = jourDeIso(s.date)
    const arr = parJour.get(jour) ?? parJour.set(jour, []).get(jour)!
    arr.push(s)
  }

  const cellules = useMemo(
    () => grilleDuMois(mois.annee, mois.mois),
    [mois.annee, mois.mois],
  )
  const aujourdhui = versIso(new Date())

  const aProgrammer = (programme?.sessions ?? []).filter((s) => !s.seanceId)
  const planifiees = (programme?.sessions ?? []).length - aProgrammer.length

  /** The principe a programme line works, or its séance spéciale. */
  const nomDeSlot = (s: ProgSession) =>
    s.principeId
      ? (principeById.get(s.principeId)?.nom ?? "À définir")
      : (s.special ?? "À définir")

  const nomDe = (s: SeanceClub) =>
    s.principeId ? (principeById.get(s.principeId)?.nom ?? "Séance") : (s.special ?? "Séance")

  const pas = (n: number) =>
    setMois(({ annee, mois }) => {
      const d = new Date(annee, mois + n, 1)
      return { annee: d.getFullYear(), mois: d.getMonth() }
    })

  const ajouterLorgnette = (valeur: string) => {
    const [catNom, grpNom] = valeur.split("::")
    if (lorgnettes.some((l) => l.id === valeur)) return
    setComparees((prev) => [
      ...prev,
      { id: valeur, categorie: catNom, groupe: grpNom },
    ])
  }

  const basculerCache = (id: string) =>
    setCaches((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )

  if (!programme)
    return (
      <div className="rounded-lg border border-border">
        <EmptyState
          icon={CalendarDays}
          title="Rien à planifier"
          description="Créez d'abord le programme annuel : la planification place ses séances dans le calendrier."
        />
      </div>
    )

  const jourSeances = jourActif ? (parJour.get(jourActif) ?? []) : []

  const groupeChoisi = pourGroupe || groupes[0]?.nom || ""

  /** Turn one programme line into a real séance on that day. */
  const placer = (session: ProgSession, iso: string) => {
    planifierSeance(session.id, groupeChoisi, {
      date: `${iso}T18:00:00.000Z`,
    })
    setEnMain(null)
    notify(
      `Séance ${session.numero} · ${groupeChoisi} — ${libelleJourCourt(iso)}`,
    )
  }

  /** A convocation is keyed by the séance it calls players to. */
  const convocationDe = (seance: SeanceClub | null) =>
    seance ? (convocations.find((c) => c.eventId === seance.id) ?? null) : null

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      // The rail sits beside the grid: a wide auto-scroll band would yank the
      // month away the moment a line is picked up.
      autoScroll={{ threshold: { x: 0, y: 0.06 }, acceleration: 6 }}
      onDragStart={(e: DragStartEvent) =>
        setDrag(aProgrammer.find((x) => x.id === e.active.id) ?? null)
      }
      onDragCancel={() => setDrag(null)}
      onDragEnd={(e: DragEndEvent) => {
        setDrag(null)
        const iso = e.over?.id
        const slot = aProgrammer.find((x) => x.id === e.active.id)
        if (typeof iso === "string" && slot) placer(slot, iso)
      }}
    >
    <div className="flex flex-col gap-5">
      {/* What the calendar is showing — the programme's groupe, plus overlays. */}
      <div className="flex flex-wrap items-center gap-2">
        {/* The équipe's own groupes: click one to take it off the grid. */}
        {propres.map((l) => (
          <button
            key={l.id}
            type="button"
            aria-pressed={!caches.includes(l.id)}
            onClick={() => basculerCache(l.id)}
            className={cn(
              "inline-flex items-center gap-2 rounded-pill border px-3 py-1.5 font-ui text-[0.74rem] transition-colors",
              caches.includes(l.id)
                ? "border-border text-ink-disabled hover:text-ink-muted"
                : "border-brand-blue-600/30 bg-brand-blue-600/10 text-brand-blue-600",
            )}
          >
            {l.groupe}
          </button>
        ))}

        {/* Groupes borrowed from another équipe, purely to spot clashes. */}
        {comparees.map((l) => (
          <span
            key={l.id}
            className="inline-flex items-center gap-2 rounded-pill border border-border-strong px-3 py-1.5 font-ui text-[0.74rem] text-ink-subtle"
          >
            {l.categorie} · {l.groupe}
            <button
              type="button"
              aria-label={`Retirer ${l.categorie} ${l.groupe}`}
              onClick={() =>
                setComparees((prev) => prev.filter((c) => c.id !== l.id))
              }
              className="text-ink-disabled transition-colors hover:text-danger"
            >
              <X size={12} />
            </button>
          </span>
        ))}

        <Select value="" onValueChange={ajouterLorgnette}>
          <SelectTrigger
            aria-label="Superposer un autre groupe"
            className="w-auto gap-2 rounded-pill border-dashed px-3 py-1.5 text-[0.74rem] text-ink-muted"
          >
            <span className="inline-flex items-center gap-1.5">
              <Plus size={12} /> Superposer un groupe
            </span>
          </SelectTrigger>
          <SelectContent className="w-[16rem]">
            {categories.map((c) => (
              <SelectGroup key={c.id}>
                <SelectLabel>{c.nom}</SelectLabel>
                {c.groupes.map((g) => (
                  <SelectItem
                    key={g.id}
                    value={cleLorgnette(c.nom, g.nom)}
                    disabled={lorgnettes.some(
                      (l) => l.id === cleLorgnette(c.nom, g.nom),
                    )}
                  >
                    {g.nom}
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Month nav + the one action this tab exists for. */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex shrink-0 items-center rounded-md border border-border">
          <button
            type="button"
            aria-label="Mois précédent"
            onClick={() => pas(-1)}
            className="flex size-9 items-center justify-center rounded-l-md text-ink-muted transition-colors hover:bg-surface-hover hover:text-ink"
          >
            <ChevronLeft size={17} />
          </button>
          <span className="w-px self-stretch bg-border" aria-hidden />
          <button
            type="button"
            aria-label="Mois suivant"
            onClick={() => pas(1)}
            className="flex size-9 items-center justify-center rounded-r-md text-ink-muted transition-colors hover:bg-surface-hover hover:text-ink"
          >
            <ChevronRight size={17} />
          </button>
        </div>
        <h2 className="font-ui text-lg font-medium text-ink">
          {MOIS_FR[mois.mois]} {mois.annee}
        </h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const d = new Date()
            setMois({ annee: d.getFullYear(), mois: d.getMonth() })
          }}
        >
          Aujourd'hui
        </Button>

        <p className="font-body text-sm text-ink-muted">
          <span className="text-ink">{planifiees}</span> planifiées ·{" "}
          <span className={aProgrammer.length ? "text-warning" : "text-ink"}>
            {aProgrammer.length}
          </span>{" "}
          à placer
        </p>

        {mode === "calendrier" ? (
          <Button
            className="ml-auto"
            onClick={() => setMode("placement")}
            disabled={!aProgrammer.length}
          >
            <CalendarPlus /> Planifier
          </Button>
        ) : (
          <Button
            className="ml-auto"
            onClick={() => {
              setMode("calendrier")
              setEnMain(null)
            }}
          >
            <Check /> Terminer
          </Button>
        )}
      </div>

      {/* Placement: the season's unplaced lines on the left, the month on the
          right. Everything else on this tab stays put. */}
      <div
        className={cn(
          "grid gap-4",
          mode === "placement" && "lg:grid-cols-[19rem_minmax(0,1fr)]",
        )}
      >
        {mode === "placement" ? (
          <RailAPlacer
            sessions={aProgrammer}
            groupes={groupes.map((g) => g.nom)}
            groupeChoisi={groupeChoisi}
            onGroupe={setPourGroupe}
            enMain={enMain}
            onPrendre={(id) => setEnMain((p) => (p === id ? null : id))}
            nomDeSlot={nomDeSlot}
          />
        ) : null}

      {/* Calendar grid — static card: transparent + border. */}
      <div className="h-fit overflow-hidden rounded-lg border border-border">
        <div className="grid grid-cols-7 border-b border-border">
          {JOURS_FR.map((j, i) => (
            <div
              key={j}
              className="px-1 py-2 text-center font-ui text-[0.7rem] font-medium tracking-[0.06em] text-ink-muted uppercase sm:px-2 sm:py-2.5"
            >
              <span className="sm:hidden">{JOURS_MIN_FR[i]}</span>
              <span className="hidden sm:inline">{j}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {cellules.map((cell, i) => {
            const duJour = parJour.get(cell.iso) ?? []
            const estAujourdhui = cell.iso === aujourdhui
            return (
              <CelluleJour
                key={cell.iso}
                iso={cell.iso}
                placement={mode === "placement"}
                enMain={!!enMain}
                onClick={() => {
                  if (mode !== "placement")
                    return setJourActif(duJour.length ? cell.iso : null)
                  // Tap-to-place: a slot held in hand lands on the day tapped.
                  const slot = aProgrammer.find((x) => x.id === enMain)
                  if (slot) placer(slot, cell.iso)
                }}
                className={cn(
                  "flex min-h-[3.5rem] flex-col gap-1 border-border p-1 text-left transition-colors sm:min-h-[7rem] sm:p-1.5",
                  (i + 1) % 7 !== 0 && "border-r",
                  i < 35 && "border-b",
                  !cell.dansLeMois && "bg-surface-hover",
                  duJour.length && "hover:bg-surface-hover",
                )}
              >
                <span
                  className={cn(
                    "flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 font-ui text-[0.76rem]",
                    estAujourdhui
                      ? "bg-brand-blue-600 font-medium text-white"
                      : cell.dansLeMois
                        ? "text-ink-subtle"
                        : "text-ink-disabled",
                  )}
                >
                  {cell.jour}
                </span>

                {/* Desktop: a chip per séance, in its principe's colour. */}
                <span className="hidden flex-col gap-1 sm:flex">
                  {duJour.slice(0, 3).map((s) => {
                    const couleur = couleurDe(cleDe(s))
                    return (
                      <span
                        key={s.id}
                        className="truncate rounded-sm border px-1.5 py-1 font-ui text-[0.68rem]"
                        style={
                          couleur
                            ? {
                                backgroundColor: couleur,
                                borderColor: couleur,
                                color: encreSur(couleur),
                              }
                            : undefined
                        }
                      >
                        {s.groupe} · {nomDe(s)}
                      </span>
                    )
                  })}
                  {duJour.length > 3 ? (
                    <span className="font-body text-[0.66rem] text-ink-muted">
                      +{duJour.length - 3}
                    </span>
                  ) : null}
                </span>

                {/* Mobile: coloured dots only. */}
                {duJour.length ? (
                  <span className="mt-auto flex flex-wrap items-center gap-1 sm:hidden">
                    {duJour.slice(0, 4).map((s) => (
                      <span
                        key={s.id}
                        aria-hidden
                        className="size-1.5 rounded-full bg-ink-muted"
                        style={{
                          backgroundColor: couleurDe(cleDe(s)) ?? undefined,
                        }}
                      />
                    ))}
                  </span>
                ) : null}
              </CelluleJour>
            )
          })}
        </div>
      </div>
      </div>

      {/* One day's séances. */}
      <Dialog open={!!jourActif} onOpenChange={(o) => !o && setJourActif(null)}>
        <DialogContent className="rounded-xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {jourActif ? libelleJourCourt(jourActif) : ""}
            </DialogTitle>
            <DialogDescription>
              {jourSeances.length} séance{jourSeances.length > 1 ? "s" : ""} ce
              jour-là.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            {jourSeances.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setJourActif(null)
                  setSeanceChoisie(s)
                }}
                className="flex items-center gap-3 rounded-lg border border-border p-3 text-left transition-colors hover:border-border-strong"
              >
                <span
                  aria-hidden
                  className="size-2.5 shrink-0 rounded-full bg-ink-disabled"
                  style={{ backgroundColor: couleurDe(cleDe(s)) ?? undefined }}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-ui text-[0.86rem] text-ink">
                    {nomDe(s)}
                  </span>
                  <span className="block font-body text-[0.74rem] text-ink-muted">
                    {s.categorie} · {s.groupe} · {s.duree} min
                  </span>
                </span>
                <ChevronRight size={15} className="shrink-0 text-ink-disabled" />
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Planning the rest of the season — one row per unplanned slot. */}

      {/* One séance, two ways in: open it, or call the players to it. */}
      <Dialog
        open={!!seanceChoisie}
        onOpenChange={(o) => !o && setSeanceChoisie(null)}
      >
        <DialogContent className="rounded-xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {seanceChoisie ? `Séance ${seanceChoisie.numero}` : ""}
            </DialogTitle>
            <DialogDescription>
              {seanceChoisie
                ? `${seanceChoisie.categorie} · ${seanceChoisie.groupe} · ${libelleJourCourt(jourDeIso(seanceChoisie.date))} · ${seanceChoisie.duree} min`
                : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2.5 sm:flex-row">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() =>
                seanceChoisie &&
                navigate(`/planification/seance/${seanceChoisie.id}/procede`)
              }
            >
              <ArrowRight /> Accéder à la séance
            </Button>
            {/* Once the séance has a convocation there is nothing to create:
                the same slot opens the list, which is where it gets edited. */}
            {convocationDe(seanceChoisie) ? (
              <Button
                className="flex-1"
                onClick={() => {
                  setConvocationVue(seanceChoisie)
                  setSeanceChoisie(null)
                }}
              >
                <Users /> Voir la convocation
              </Button>
            ) : (
              <Button
                className="flex-1"
                onClick={() => {
                  setConvocationPour(seanceChoisie)
                  setSeanceChoisie(null)
                }}
              >
                <UserPlus /> Créer la convocation
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {convocationPour ? (
        <ConvocationBuilder
          eventId={convocationPour.id}
          seanceLabel={`Séance ${convocationPour.numero}`}
          categorieHint={convocationPour.categorie}
          existing={convocationDe(convocationPour) ?? undefined}
          onClose={() => setConvocationPour(null)}
          onSaved={(_, message) => {
            // Saving drops you into the list you just built, not back to nothing.
            setConvocationVue(convocationPour)
            setConvocationPour(null)
            notify(message)
          }}
        />
      ) : null}

      {/* The saved convocation, read groupe by groupe — and edited from here. */}
      <ConvocationModal
        seance={convocationVue}
        convocation={convocationDe(convocationVue)}
        categories={categories}
        onOpenChange={(o) => !o && setConvocationVue(null)}
        onModifier={() => {
          setConvocationPour(convocationVue)
          setConvocationVue(null)
        }}
        onAnnuler={() => setAnnulerConvocation(convocationVue?.id ?? null)}
      />

      <ConfirmDialog
        open={!!annulerConvocation}
        onOpenChange={(o) => !o && setAnnulerConvocation(null)}
        title="Annuler la convocation ?"
        description="Les joueurs appelés seront retirés. La séance revient à l'état « aucune convocation »."
        confirmLabel="Annuler la convocation"
        onConfirm={() => {
          if (annulerConvocation) removeConvocation(annulerConvocation)
          setAnnulerConvocation(null)
          setConvocationVue(null)
          notify("Convocation annulée.")
        }}
      />

      {toast ? <Toast key={toast.id} id={toast.id} msg={toast.msg} /> : null}
    </div>

      {/* What the finger / cursor carries. */}
      <DragOverlay dropAnimation={null}>
        {drag ? (
          <span className="inline-flex items-center gap-2 rounded-md border border-border-strong bg-surface px-3 py-2 font-ui text-[0.78rem] text-ink shadow-deep">
            S{drag.numero} · {nomDeSlot(drag)}
          </span>
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}

/* ── Convocation ──────────────────────────────────────────────────────────── */

const REPONSES: Record<ConvocationStatut, { label: string; dot: string }> = {
  accepte: { label: "Accepté", dot: "bg-success" },
  refuse: { label: "Refusé", dot: "bg-danger" },
  attente: { label: "En attente", dot: "bg-ink-disabled" },
}

/**
 * A convocation already saved for a séance: how many were called and what they
 * answered, then the names groupe by groupe. Names and postes are read from the
 * catégorie — the convocation only stores ids.
 */
function ConvocationModal({
  seance,
  convocation,
  categories,
  onOpenChange,
  onModifier,
  onAnnuler,
}: {
  seance: SeanceClub | null
  convocation: SeanceConvocation | null
  categories: Categorie[]
  onOpenChange: (open: boolean) => void
  onModifier: () => void
  onAnnuler: () => void
}) {
  const categorie = categories.find((c) => c.id === convocation?.categorieId)

  const lignes = (convocation?.joueurs ?? [])
    .map((c) => {
      const joueur = categorie?.joueurs.find((j) => j.id === c.joueurId)
      return joueur ? { ...c, joueur } : null
    })
    .filter((r) => !!r)

  const groupes = (categorie?.groupes ?? []).filter((g) =>
    lignes.some((r) => r.groupeId === g.id),
  )
  const compte = (r: ConvocationStatut) =>
    lignes.filter((l) => l.reponse === r).length

  return (
    <Dialog open={!!seance && !!convocation} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto rounded-xl sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            Convocation · {seance ? `Séance ${seance.numero}` : ""}
          </DialogTitle>
          <DialogDescription>
            {seance
              ? `${seance.categorie} · ${seance.groupe} · ${libelleJourCourt(jourDeIso(seance.date))}`
              : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 font-ui text-[0.8rem] text-ink-subtle">
            <Users size={14} className="text-ink-muted" />
            <span className="font-medium text-ink tabular-nums">
              {lignes.length}
            </span>
            convoqués
          </span>
          {(Object.keys(REPONSES) as ConvocationStatut[]).map((r) => (
            <span
              key={r}
              className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 font-ui text-[0.8rem] text-ink-subtle"
            >
              <span className={cn("size-2 rounded-full", REPONSES[r].dot)} aria-hidden />
              <span className="font-medium text-ink tabular-nums">
                {compte(r)}
              </span>
              {REPONSES[r].label}
            </span>
          ))}
        </div>

        {lignes.length === 0 ? (
          <div className="rounded-lg border border-border">
            <EmptyState
              icon={Users}
              title="Convocation vide"
              description="Personne n'est appelé à cette séance."
            />
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {groupes.map((g) => {
              const duGroupe = lignes.filter((l) => l.groupeId === g.id)
              return (
                <section key={g.id} className="flex flex-col gap-1.5">
                  <h3 className="font-ui text-[0.62rem] font-medium tracking-[0.1em] text-ink-disabled uppercase">
                    {g.nom} · {duGroupe.length}
                  </h3>
                  {duGroupe.map((l) => (
                    <div
                      key={l.joueurId}
                      className="flex items-center gap-3 rounded-lg border border-border px-3 py-2"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-ui text-[0.84rem] text-ink">
                          {l.joueur.nom}
                        </span>
                        <span className="block font-body text-[0.72rem] text-ink-muted">
                          {l.joueur.poste}
                          {/* A joueur borrowed from another groupe for this
                              séance only — worth flagging on the list. */}
                          {l.groupeId !== l.joueur.groupeId ? " · déplacé" : ""}
                        </span>
                      </span>
                      <span className="inline-flex shrink-0 items-center gap-1.5 font-ui text-[0.72rem] text-ink-muted">
                        <span
                          aria-hidden
                          className={cn(
                            "size-2 rounded-full",
                            REPONSES[l.reponse].dot,
                          )}
                        />
                        {REPONSES[l.reponse].label}
                      </span>
                    </div>
                  ))}
                </section>
              )
            })}
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={onAnnuler}>
            <Trash2 /> Annuler la convocation
          </Button>
          <Button onClick={onModifier}>
            <Pencil /> Modifier
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


/* ── Placement — the rail and the drop targets ────────────────────────────── */

/**
 * The season's unplaced lines, week by week. Each one can be dragged onto a day
 * or — on a phone, where the target day is usually off-screen mid-drag — tapped
 * to pick up and then dropped by tapping the day.
 */
function RailAPlacer({
  sessions,
  groupes,
  groupeChoisi,
  onGroupe,
  enMain,
  onPrendre,
  nomDeSlot,
}: {
  sessions: ProgSession[]
  groupes: string[]
  groupeChoisi: string
  onGroupe: (groupe: string) => void
  enMain: string | null
  onPrendre: (id: string) => void
  nomDeSlot: (s: ProgSession) => string
}) {
  return (
    <aside className="flex h-fit flex-col gap-3 rounded-lg border border-border p-4 lg:sticky lg:top-4">
      <div>
        <h2 className="font-ui text-[0.95rem] font-medium text-ink">
          À placer · {sessions.length}
        </h2>
        <p className="font-body text-[0.78rem] text-ink-muted">
          Glissez une séance sur un jour — ou touchez-la, puis touchez le jour.
        </p>
      </div>

      {/* The programme serves the équipe, so the placed séance needs a groupe. */}
      {groupes.length > 1 ? (
        <label className="flex flex-col gap-1.5">
          <span className="font-ui text-[0.62rem] font-medium tracking-[0.1em] text-ink-disabled uppercase">
            Placer pour
          </span>
          <Select value={groupeChoisi} onValueChange={onGroupe}>
            <SelectTrigger aria-label="Groupe qui joue la séance">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {groupes.map((g) => (
                <SelectItem key={g} value={g}>
                  {g}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
      ) : null}

      {sessions.length === 0 ? (
        <div className="rounded-lg border border-border">
          <EmptyState
            icon={CalendarCheck2}
            title="Tout est placé"
            description="Chaque séance du programme a sa date."
          />
        </div>
      ) : (
        <div className="flex max-h-[32rem] flex-col gap-1.5 overflow-y-auto pr-0.5">
          {sessions.map((s) => (
            <CarteAPlacer
              key={s.id}
              session={s}
              nom={nomDeSlot(s)}
              enMain={enMain === s.id}
              onPrendre={() => onPrendre(s.id)}
            />
          ))}
        </div>
      )}
    </aside>
  )
}

function CarteAPlacer({
  session,
  nom,
  enMain,
  onPrendre,
}: {
  session: ProgSession
  nom: string
  enMain: boolean
  onPrendre: () => void
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: session.id,
  })
  const couleur = couleurDe(cleDe(session))

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex items-center gap-2 rounded-md border px-2 py-2 transition-colors",
        enMain
          ? "border-info bg-info/5"
          : "border-border hover:border-border-strong",
        isDragging && "opacity-40",
      )}
    >
      {/* The grip owns the drag; the rest of the card is the tap target, so a
          finger can still scroll the list. */}
      <span
        ref={undefined}
        {...listeners}
        {...attributes}
        aria-label={`Déplacer la séance ${session.numero}`}
        className="shrink-0 cursor-grab touch-none text-ink-disabled transition-colors hover:text-ink-muted active:cursor-grabbing"
      >
        <GripVertical size={14} />
      </span>
      <span
        aria-hidden
        className="size-2 shrink-0 rounded-full bg-ink-disabled"
        style={{ backgroundColor: couleur ?? undefined }}
      />
      <button
        type="button"
        onClick={onPrendre}
        aria-pressed={enMain}
        className="min-w-0 flex-1 text-left"
      >
        <span className="block truncate font-ui text-[0.8rem] text-ink">
          S{session.numero} · {nom}
        </span>
        <span className="block font-body text-[0.7rem] text-ink-muted">
          Semaine {session.semaine}
        </span>
      </button>
    </div>
  )
}

/**
 * A day of the month. Plain button while reading the season; a drop target that
 * lights up while placing.
 */
function CelluleJour({
  iso,
  placement,
  enMain,
  onClick,
  className,
  children,
}: {
  iso: string
  placement: boolean
  enMain: boolean
  onClick: () => void
  className?: string
  children: React.ReactNode
}) {
  const { setNodeRef, isOver } = useDroppable({ id: iso, disabled: !placement })
  return (
    <button
      ref={setNodeRef}
      type="button"
      onClick={onClick}
      className={cn(
        className,
        placement && "cursor-copy",
        placement && enMain && "hover:bg-info/10",
        isOver && "bg-info/15 ring-1 ring-info ring-inset",
      )}
    >
      {children}
    </button>
  )
}
