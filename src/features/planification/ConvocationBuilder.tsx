import { useMemo, useState } from "react"
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  closestCorners,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core"
import {
  ArrowLeftRight,
  Check,
  CornerUpLeft,
  GripVertical,
  Layers,
  ListChecks,
  MousePointerClick,
  Search,
  Users,
  X,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { useData } from "@/data/useData"
import {
  POSTES,
  POSTE_LABEL,
  type Categorie,
  type CategorieGroupe,
  type CategorieJoueur,
} from "@/data/seed/categories"
import type { SeanceConvocation } from "@/data/seed/convocations"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { Select, inputCls } from "@/features/finance/ui"
import { Segmented, type SegOption } from "@/features/budget/ui"

/**
 * Convocation builder — Séance ▸ Convocation ▸ "Créer la convocation".
 *
 * Built for the real scale of a catégorie: Minime has **neuf groupes de dix
 * joueurs**, so neither mode may rely on seeing everything at once.
 *
 * - **Sélection** — a rail of the groupes (each with its own n/10 counter and a
 *   one-tap "tout le groupe" box) drives a single panel showing the ten joueurs
 *   of the groupe you're on. Convoke a whole groupe, the whole catégorie, or
 *   pick joueur by joueur; the search runs across all nine.
 * - **Déplacements** — for THIS séance only, move a convoqué from one groupe to
 *   another (an éducateur regularly pulls two or three joueurs up). The club
 *   roster is untouched: the groupe is stored on the convocation, never on the
 *   joueur.
 *
 * The board offers both gestures a phone needs (memory: the drop target is
 * usually off-screen): **drag** a card by its grip, or **tap to pick up → tap a
 * destination** in the bar, which lists the nine groupes without scrolling.
 */

type Mode = "selection" | "deplacements"

const MODE_OPTIONS: SegOption<Mode>[] = [
  {
    value: "selection",
    label: (
      <span className="inline-flex items-center gap-1.5">
        <ListChecks size={14} /> Sélection
      </span>
    ),
  },
  {
    value: "deplacements",
    label: (
      <span className="inline-flex items-center gap-1.5">
        <ArrowLeftRight size={14} /> Déplacements
      </span>
    ),
  },
]

/** Draft row: a convoqué joueur and the groupe he plays in for this séance. */
type Draft = Map<string, string>

export function ConvocationBuilder({
  eventId,
  seanceLabel,
  /** Catégorie label written on the séance ("Minime · Minime A") — used to
   *  preselect the right catégorie when it matches one of the club's. */
  categorieHint,
  existing,
  onClose,
  onSaved,
}: {
  eventId: string
  seanceLabel: string
  categorieHint?: string
  existing?: SeanceConvocation
  onClose: () => void
  onSaved: (convocation: SeanceConvocation, message: string) => void
}) {
  const { categories, saveConvocation } = useData()

  // Preselect: the existing convocation's catégorie, else the one whose name
  // appears in the séance's label, else the first with an effectif.
  const initialCategorie =
    existing?.categorieId ??
    categories.find(
      (c) =>
        categorieHint &&
        categorieHint.toLowerCase().includes(c.nom.toLowerCase()) &&
        c.joueurs.length > 0,
    )?.id ??
    categories.find((c) => c.joueurs.length > 0)?.id ??
    ""

  const [categorieId, setCategorieId] = useState(initialCategorie)
  const [mode, setMode] = useState<Mode>("selection")
  const [q, setQ] = useState("")
  const [draft, setDraft] = useState<Draft>(() => {
    const map: Draft = new Map()
    for (const j of existing?.joueurs ?? []) map.set(j.joueurId, j.groupeId)
    return map
  })
  // Tap-to-place: the joueur waiting for a destination groupe.
  const [picked, setPicked] = useState<string | null>(null)
  const [actif, setActif] = useState<CategorieJoueur | null>(null)

  const categorie = categories.find((c) => c.id === categorieId) ?? null
  // The groupe whose joueurs the selection panel shows.
  const [groupeActif, setGroupeActif] = useState(
    () => categorie?.groupes[0]?.id ?? "",
  )

  const sensors = useSensors(
    // A few pixels of travel before a mouse drag starts, so a click stays a click.
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    // A short press before a touch drag starts, so a scroll still scrolls.
    useSensor(TouchSensor, { activationConstraint: { delay: 220, tolerance: 8 } }),
  )

  // Changing catégorie starts a new draft — a convocation belongs to one squad.
  const changeCategorie = (id: string) => {
    const next = categories.find((c) => c.id === id)
    setCategorieId(id)
    setGroupeActif(next?.groupes[0]?.id ?? "")
    setDraft(new Map())
    setPicked(null)
    setMode("selection")
  }

  const joueursOf = (groupeId: string) =>
    sortJoueurs(categorie?.joueurs.filter((j) => j.groupeId === groupeId) ?? [])

  const convoques = useMemo(() => {
    if (!categorie) return []
    return categorie.joueurs.filter((j) => draft.has(j.id))
  }, [categorie, draft])

  const deplaces = useMemo(
    () => convoques.filter((j) => draft.get(j.id) !== j.groupeId),
    [convoques, draft],
  )

  const toggle = (joueur: CategorieJoueur) =>
    setDraft((prev) => {
      const next = new Map(prev)
      if (next.has(joueur.id)) next.delete(joueur.id)
      else next.set(joueur.id, joueur.groupeId)
      return next
    })

  const toggleGroupe = (groupeId: string) =>
    setDraft((prev) => {
      const next = new Map(prev)
      const rows = joueursOf(groupeId)
      const allIn = rows.length > 0 && rows.every((j) => next.has(j.id))
      for (const j of rows) {
        if (allIn) next.delete(j.id)
        else next.set(j.id, j.groupeId)
      }
      return next
    })

  const convoquerTout = () =>
    setDraft(() => {
      const next: Draft = new Map()
      for (const j of categorie?.joueurs ?? []) next.set(j.id, j.groupeId)
      return next
    })

  /** Move a convoqué to another groupe — for this séance only. */
  const place = (joueurId: string, groupeId: string) => {
    setDraft((prev) => {
      if (!prev.has(joueurId)) return prev
      const next = new Map(prev)
      next.set(joueurId, groupeId)
      return next
    })
    setPicked(null)
  }

  const resetPlace = (joueur: CategorieJoueur) => place(joueur.id, joueur.groupeId)

  const onDragEnd = (e: DragEndEvent) => {
    setActif(null)
    const groupeId = e.over?.id as string | undefined
    if (groupeId) place(String(e.active.id), groupeId)
  }

  const save = () => {
    if (!categorie) return
    const groupeIds = categorie.groupes
      .filter((g) => convoques.some((j) => draft.get(j.id) === g.id))
      .map((g) => g.id)
    const convocation: SeanceConvocation = {
      eventId,
      categorieId: categorie.id,
      groupeIds,
      joueurs: convoques.map((j) => ({
        joueurId: j.id,
        groupeId: draft.get(j.id) ?? j.groupeId,
        // An existing réponse survives an edit; a new convoqué starts en attente.
        reponse:
          existing?.joueurs.find((x) => x.joueurId === j.id)?.reponse ?? "attente",
      })),
    }
    saveConvocation(convocation)
    onSaved(
      convocation,
      existing
        ? `Convocation mise à jour — ${convoques.length} joueurs`
        : `Convocation créée — ${convoques.length} joueurs convoqués`,
    )
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="flex max-h-[92svh] flex-col gap-0 overflow-hidden rounded-xl border-border bg-surface p-0 sm:max-w-[66rem]">
        {/* Header */}
        <div className="flex items-start gap-3 border-b border-border px-5 py-4">
          <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-md bg-brand-blue-600/10 text-brand-blue-600">
            <Users size={18} />
          </span>
          <div className="min-w-0 flex-1">
            <DialogTitle className="truncate font-ui text-base font-medium text-ink">
              {existing ? "Modifier la convocation" : "Nouvelle convocation"}
            </DialogTitle>
            <DialogDescription className="mt-0.5 font-body text-[0.8rem] text-ink-muted">
              {seanceLabel} — choisissez les groupes et les joueurs appelés.
            </DialogDescription>
          </div>
        </div>

        {/* Toolbar: catégorie + mode */}
        <div className="flex flex-col gap-3 border-b border-border px-5 py-3.5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 items-center gap-2.5">
            <Layers size={15} className="shrink-0 text-ink-muted" />
            <div className="w-full sm:w-64">
              <Select
                value={categorieId}
                onChange={changeCategorie}
                placeholder="Choisir une catégorie"
                options={categories
                  .filter((c) => c.joueurs.length > 0)
                  .map((c) => ({
                    value: c.id,
                    label: `${c.nom} · ${c.groupes.length} groupes`,
                  }))}
              />
            </div>
          </div>

          <Segmented
            value={mode}
            onChange={(m) => {
              setMode(m)
              setPicked(null)
            }}
            options={MODE_OPTIONS}
          />
        </div>

        {/* Body */}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {!categorie ? (
            <p className="rounded-lg border border-border px-4 py-10 text-center font-body text-[0.85rem] text-ink-disabled">
              Aucune catégorie ne compte de joueurs. Constituez un effectif dans
              le Pôle Technique.
            </p>
          ) : mode === "selection" ? (
            <SelectionMode
              categorie={categorie}
              draft={draft}
              groupeActif={groupeActif}
              onGroupeActif={setGroupeActif}
              q={q}
              onQ={setQ}
              onToggle={toggle}
              onToggleGroupe={toggleGroupe}
              onAll={convoquerTout}
              onClear={() => setDraft(new Map())}
              joueursOf={joueursOf}
            />
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              accessibility={{ announcements: annonces }}
              onDragStart={(e: DragStartEvent) =>
                setActif(
                  categorie.joueurs.find((j) => j.id === e.active.id) ?? null,
                )
              }
              onDragCancel={() => setActif(null)}
              onDragEnd={onDragEnd}
            >
              <DeplacementsMode
                categorie={categorie}
                draft={draft}
                picked={picked}
                onPick={(id) => setPicked((p) => (p === id ? null : id))}
                onPlace={place}
                onReset={resetPlace}
              />
              <DragOverlay dropAnimation={null}>
                {actif ? <JoueurChip joueur={actif} dragging /> : null}
              </DragOverlay>
            </DndContext>
          )}
        </div>

        {/* Footer: the running count + save */}
        <div className="flex flex-col gap-3 border-t border-border px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-body text-[0.82rem] text-ink-muted">
            <span className="font-ui font-medium text-ink tabular-nums">
              {convoques.length}
            </span>
            <span className="tabular-nums">
              /{categorie?.joueurs.length ?? 0}
            </span>{" "}
            convoqué{convoques.length > 1 ? "s" : ""}
            {deplaces.length ? (
              <>
                {" · "}
                <span className="text-info tabular-nums">{deplaces.length}</span>{" "}
                déplacement{deplaces.length > 1 ? "s" : ""} pour cette séance
              </>
            ) : null}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button onClick={save} disabled={convoques.length === 0}>
              <Check size={16} />
              {existing ? "Enregistrer" : "Créer la convocation"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

/* ── Mode 1 — qui vient ─────────────────────────────────────────────────── */

function SelectionMode({
  categorie,
  draft,
  groupeActif,
  onGroupeActif,
  q,
  onQ,
  onToggle,
  onToggleGroupe,
  onAll,
  onClear,
  joueursOf,
}: {
  categorie: Categorie
  draft: Draft
  groupeActif: string
  onGroupeActif: (id: string) => void
  q: string
  onQ: (v: string) => void
  onToggle: (j: CategorieJoueur) => void
  onToggleGroupe: (groupeId: string) => void
  onAll: () => void
  onClear: () => void
  joueursOf: (groupeId: string) => CategorieJoueur[]
}) {
  const query = q.trim().toLowerCase()
  const tousConvoques =
    categorie.joueurs.length > 0 &&
    categorie.joueurs.every((j) => draft.has(j.id))

  const groupe =
    categorie.groupes.find((g) => g.id === groupeActif) ?? categorie.groupes[0]
  const rows = groupe ? joueursOf(groupe.id) : []
  const rowsSelection = rows.filter((j) => draft.has(j.id)).length

  const resultats = query
    ? categorie.joueurs.filter(
        (j) =>
          j.nom.toLowerCase().includes(query) ||
          (POSTE_LABEL[j.poste] ?? j.poste).toLowerCase().includes(query),
      )
    : []

  return (
    <div className="flex flex-col gap-3.5">
      {/* Squad-wide actions + search. */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search
            size={15}
            className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-disabled"
          />
          <input
            value={q}
            onChange={(e) => onQ(e.target.value)}
            placeholder={`Rechercher dans les ${categorie.groupes.length} groupes…`}
            className={cn(inputCls, "pl-9")}
          />
          {q ? (
            <button
              type="button"
              aria-label="Effacer la recherche"
              onClick={() => onQ("")}
              className="absolute top-1/2 right-3 -translate-y-1/2 text-ink-disabled transition-colors hover:text-ink"
            >
              <X size={15} />
            </button>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="outline" size="sm" onClick={onAll}>
            {tousConvoques ? "Tous convoqués" : "Convoquer tous les groupes"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            disabled={draft.size === 0}
          >
            Tout retirer
          </Button>
        </div>
      </div>

      {query ? (
        /* Search cuts across the groupes — the rail would only get in the way. */
        <section className="flex flex-col overflow-hidden rounded-lg border border-border">
          <header className="border-b border-border px-3.5 py-2.5 font-ui text-[0.78rem] font-medium text-ink">
            {resultats.length} résultat{resultats.length > 1 ? "s" : ""} dans
            l'effectif
          </header>
          <ul className="flex max-h-[46svh] flex-col overflow-y-auto">
            {resultats.length ? (
              resultats.map((j, i) => (
                <JoueurLigne
                  key={j.id}
                  joueur={j}
                  on={draft.has(j.id)}
                  onToggle={() => onToggle(j)}
                  first={i === 0}
                  groupeNom={
                    categorie.groupes.find((g) => g.id === j.groupeId)?.nom
                  }
                />
              ))
            ) : (
              <li className="px-3.5 py-8 text-center font-body text-[0.82rem] text-ink-disabled">
                Aucun joueur ne correspond à « {q} ».
              </li>
            )}
          </ul>
        </section>
      ) : (
        <div className="grid gap-3.5 lg:grid-cols-[16rem_minmax(0,1fr)]">
          {/* Rail: one row per groupe — the whole catégorie readable at once. */}
          <div
            className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 lg:mx-0 lg:max-h-[46svh] lg:flex-col lg:gap-1.5 lg:overflow-x-visible lg:overflow-y-auto lg:px-0"
            role="tablist"
            aria-label="Groupes de la catégorie"
          >
            {categorie.groupes.map((g) => {
              const list = joueursOf(g.id)
              const n = list.filter((j) => draft.has(j.id)).length
              const complet = list.length > 0 && n === list.length
              const actif = g.id === groupe?.id
              return (
                <div
                  key={g.id}
                  className={cn(
                    "flex w-[13rem] shrink-0 items-center gap-2 rounded-md border px-2 py-2 transition-colors lg:w-auto",
                    actif
                      ? "border-border-second bg-surface-nested"
                      : "border-border hover:border-border-strong",
                  )}
                >
                  {/* The box convokes / removes the whole groupe in one tap. */}
                  <button
                    type="button"
                    onClick={() => onToggleGroupe(g.id)}
                    aria-label={`${complet ? "Retirer" : "Convoquer"} tout le ${g.nom}`}
                    title={complet ? "Retirer le groupe" : "Convoquer tout le groupe"}
                    className={cn(
                      "flex size-5 shrink-0 items-center justify-center rounded-sm border transition-colors",
                      complet
                        ? "border-info bg-info/15 text-info"
                        : n > 0
                          ? "border-info/60 text-info"
                          : "border-border-strong text-transparent hover:border-ink-muted",
                    )}
                  >
                    {complet ? (
                      <Check size={13} />
                    ) : (
                      <span
                        className={cn(
                          "size-2 rounded-[2px]",
                          n > 0 ? "bg-info" : "bg-transparent",
                        )}
                      />
                    )}
                  </button>

                  <button
                    type="button"
                    role="tab"
                    aria-selected={actif}
                    onClick={() => onGroupeActif(g.id)}
                    className="flex min-w-0 flex-1 items-center gap-2 text-left"
                  >
                    <span className="min-w-0 flex-1">
                      <span
                        className={cn(
                          "block truncate font-ui text-[0.82rem]",
                          actif ? "text-ink" : "text-ink-subtle",
                        )}
                      >
                        {g.nom}
                      </span>
                      <span className="mt-1 block h-1 overflow-hidden rounded-pill bg-surface-nested">
                        <span
                          className="block h-full rounded-pill bg-info transition-[width] duration-200"
                          style={{
                            width: list.length
                              ? `${(n / list.length) * 100}%`
                              : "0%",
                          }}
                        />
                      </span>
                    </span>
                    <span
                      className={cn(
                        "shrink-0 font-ui text-[0.7rem] tabular-nums",
                        n > 0 ? "text-info" : "text-ink-disabled",
                      )}
                    >
                      {n}/{list.length}
                    </span>
                  </button>
                </div>
              )
            })}
          </div>

          {/* Panel: the joueurs of the groupe on the rail. */}
          <section className="flex flex-col overflow-hidden rounded-lg border border-border">
            <header className="flex items-center justify-between gap-2 border-b border-border px-3.5 py-2.5">
              <span className="flex min-w-0 items-center gap-2">
                <span className="truncate font-ui text-[0.85rem] font-medium text-ink">
                  {groupe?.nom ?? "—"}
                </span>
                <span className="shrink-0 rounded-pill bg-surface-nested px-2 py-0.5 font-ui text-[0.66rem] text-ink-muted tabular-nums">
                  {rowsSelection}/{rows.length}
                </span>
              </span>
              <button
                type="button"
                onClick={() => groupe && onToggleGroupe(groupe.id)}
                disabled={rows.length === 0}
                className={cn(
                  "shrink-0 rounded-pill border px-2.5 py-1 font-ui text-[0.7rem] transition-colors",
                  rowsSelection === rows.length && rows.length > 0
                    ? "border-info/40 bg-info/10 text-info"
                    : "border-border-strong text-ink-muted hover:text-ink",
                  rows.length === 0 && "cursor-not-allowed opacity-45",
                )}
              >
                {rowsSelection === rows.length && rows.length > 0
                  ? "Retirer le groupe"
                  : "Tout le groupe"}
              </button>
            </header>

            <ul className="flex max-h-[46svh] flex-col overflow-y-auto">
              {rows.length ? (
                rows.map((j, i) => (
                  <JoueurLigne
                    key={j.id}
                    joueur={j}
                    on={draft.has(j.id)}
                    onToggle={() => onToggle(j)}
                    first={i === 0}
                  />
                ))
              ) : (
                <li className="px-3.5 py-8 text-center font-body text-[0.82rem] text-ink-disabled">
                  Groupe vide.
                </li>
              )}
            </ul>
          </section>
        </div>
      )}
    </div>
  )
}

/** One selectable joueur — used by the panel and by the search results. */
function JoueurLigne({
  joueur,
  on,
  onToggle,
  first,
  groupeNom,
}: {
  joueur: CategorieJoueur
  on: boolean
  onToggle: () => void
  first: boolean
  groupeNom?: string
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={on}
        className={cn(
          "flex w-full items-center gap-3 px-3.5 py-2.5 text-left transition-colors hover:bg-surface-hover",
          !first && "border-t border-border",
        )}
      >
        <span
          className={cn(
            "flex size-5 shrink-0 items-center justify-center rounded-sm border transition-colors",
            on
              ? "border-info bg-info/15 text-info"
              : "border-border-strong text-transparent",
          )}
        >
          <Check size={13} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-ui text-[0.85rem] text-ink">
            {joueur.nom}
          </span>
          <span className="block truncate font-ui text-[0.7rem] text-ink-muted">
            {POSTE_LABEL[joueur.poste] ?? joueur.poste}
            {groupeNom ? ` · ${groupeNom}` : ""}
          </span>
        </span>
      </button>
    </li>
  )
}

/* ── Mode 2 — déplacements (le temps d'une séance) ──────────────────────── */

function DeplacementsMode({
  categorie,
  draft,
  picked,
  onPick,
  onPlace,
  onReset,
}: {
  categorie: Categorie
  draft: Draft
  picked: string | null
  onPick: (id: string) => void
  onPlace: (joueurId: string, groupeId: string) => void
  onReset: (joueur: CategorieJoueur) => void
}) {
  const convoques = categorie.joueurs.filter((j) => draft.has(j.id))
  const pickedJoueur = convoques.find((j) => j.id === picked) ?? null

  if (!convoques.length) {
    return (
      <p className="rounded-lg border border-border px-4 py-10 text-center font-body text-[0.85rem] text-ink-disabled">
        Convoquez d'abord des joueurs dans l'onglet « Sélection » — les
        déplacements ne concernent que les convoqués.
      </p>
    )
  }

  // Only groupes holding a convoqué get a column: nine empty columns would
  // bury the two that matter. Every groupe stays reachable as a destination
  // in the bar above, and appears as a column as soon as it holds someone.
  const colonnes = categorie.groupes.filter((g) =>
    convoques.some((j) => draft.get(j.id) === g.id),
  )
  const pickedGroupe = pickedJoueur ? draft.get(pickedJoueur.id) : null

  return (
    <div className="flex flex-col gap-3">
      {/* Instruction / destination bar. Sticky so the nine groupes stay one tap
          away however far the board is scrolled. */}
      <div
        className={cn(
          "sticky top-0 z-10 flex flex-col gap-2.5 rounded-md border px-3.5 py-2.5 transition-colors",
          pickedJoueur
            ? "border-info/40 bg-info/10"
            : "border-border bg-surface",
        )}
      >
        <div className="flex flex-wrap items-center gap-2.5 font-body text-[0.8rem]">
          <MousePointerClick
            size={15}
            className={cn("shrink-0", pickedJoueur ? "text-info" : "text-ink-muted")}
          />
          {pickedJoueur ? (
            <>
              <span className="text-ink">
                <span className="font-ui font-medium">{pickedJoueur.nom}</span>{" "}
                sélectionné — choisissez son groupe pour cette séance :
              </span>
              <button
                type="button"
                onClick={() => onPick(pickedJoueur.id)}
                className="ml-auto inline-flex items-center gap-1.5 font-ui text-[0.74rem] text-ink-muted transition-colors hover:text-ink"
              >
                <X size={13} /> Annuler
              </button>
            </>
          ) : (
            <span className="text-ink-muted">
              Touchez un joueur pour le déplacer (ou glissez-le par sa poignée).
              Le déplacement ne vaut que pour cette séance.
            </span>
          )}
        </div>

        {pickedJoueur ? (
          <div className="flex flex-wrap gap-1.5">
            {categorie.groupes.map((g) => {
              const ici = g.id === pickedGroupe
              const dOrigine = g.id === pickedJoueur.groupeId
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => onPlace(pickedJoueur.id, g.id)}
                  disabled={ici}
                  className={cn(
                    "rounded-pill border px-3 py-1 font-ui text-[0.74rem] transition-colors",
                    ici
                      ? "cursor-default border-info/40 bg-info/15 text-info"
                      : "border-border-strong text-ink-subtle hover:border-info hover:text-info",
                  )}
                >
                  {g.nom}
                  {ici ? " · ici" : dOrigine ? " · son groupe" : ""}
                </button>
              )
            })}
          </div>
        ) : null}
      </div>

      {/* The board — one column per groupe convoqué, scroll-snap on phone. */}
      <div className="-mx-1 flex snap-x snap-mandatory gap-3 overflow-x-auto px-1 pb-1">
        {colonnes.map((g) => (
          <GroupeColonne
            key={g.id}
            groupe={g}
            joueurs={sortJoueurs(convoques.filter((j) => draft.get(j.id) === g.id))}
            picked={picked}
            onPlace={onPlace}
            onPick={onPick}
            onReset={onReset}
            groupeNomDe={(j) =>
              categorie.groupes.find((x) => x.id === j.groupeId)?.nom ?? "—"
            }
          />
        ))}
      </div>

      <p className="font-body text-[0.74rem] text-ink-disabled">
        {colonnes.length} groupe{colonnes.length > 1 ? "s" : ""} sur{" "}
        {categorie.groupes.length} concerné{colonnes.length > 1 ? "s" : ""} par
        cette séance — les autres apparaissent dès qu'un joueur y est placé.
      </p>
    </div>
  )
}

function GroupeColonne({
  groupe,
  joueurs,
  picked,
  onPlace,
  onPick,
  onReset,
  groupeNomDe,
}: {
  groupe: CategorieGroupe
  joueurs: CategorieJoueur[]
  picked: string | null
  onPlace: (joueurId: string, groupeId: string) => void
  onPick: (id: string) => void
  onReset: (joueur: CategorieJoueur) => void
  groupeNomDe: (j: CategorieJoueur) => string
}) {
  const { setNodeRef, isOver } = useDroppable({ id: groupe.id })

  return (
    <section
      ref={setNodeRef}
      className={cn(
        "flex w-[80vw] max-w-[18rem] shrink-0 snap-start flex-col rounded-lg border transition-colors sm:w-[16rem]",
        isOver
          ? "border-brand-blue-600 bg-brand-blue-600/5"
          : picked
            ? "border-info/40"
            : "border-border",
      )}
    >
      <header className="flex items-center justify-between gap-2 border-b border-border px-3 py-2.5">
        <span className="truncate font-ui text-[0.82rem] font-medium text-ink">
          {groupe.nom}
        </span>
        <span className="shrink-0 rounded-pill bg-surface-nested px-2 py-0.5 font-ui text-[0.68rem] text-ink-muted tabular-nums">
          {joueurs.length}
        </span>
      </header>

      {/* Tap-to-place target: a full-width button so the whole column head is
          hittable with a thumb, not just a drop zone that needs a drag. */}
      {picked ? (
        <button
          type="button"
          onClick={() => onPlace(picked, groupe.id)}
          className="mx-2.5 mt-2.5 rounded-md border border-dashed border-info/50 px-3 py-2 font-ui text-[0.74rem] text-info transition-colors hover:bg-info/10"
        >
          Placer ici
        </button>
      ) : null}

      <div className="flex max-h-[40svh] flex-1 flex-col gap-2 overflow-y-auto p-2.5">
        {joueurs.length ? (
          joueurs.map((j) => {
            const deplace = j.groupeId !== groupe.id
            return (
              <DraggableJoueur
                key={j.id}
                joueur={j}
                picked={picked === j.id}
                deplaceDe={deplace ? groupeNomDe(j) : null}
                onPick={() => onPick(j.id)}
                onReset={() => onReset(j)}
              />
            )
          })
        ) : (
          <p className="px-2 py-6 text-center font-body text-[0.78rem] text-ink-disabled">
            Aucun joueur dans ce groupe pour la séance.
          </p>
        )}
      </div>
    </section>
  )
}

/**
 * A convoqué on the board. Three gestures share one card, so each gets its own
 * surface: **tap** picks him up for tap-to-place, **drag the grip** moves him
 * (the grip is what makes a drag possible inside a horizontal scroller — see
 * the Kanban board for the same reason), and "remettre" undoes a move.
 */
function DraggableJoueur({
  joueur,
  picked,
  deplaceDe,
  onPick,
  onReset,
}: {
  joueur: CategorieJoueur
  picked: boolean
  deplaceDe: string | null
  onPick: () => void
  onReset: () => void
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: joueur.id,
    data: { nom: joueur.nom },
  })

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      onClick={onPick}
      style={{ touchAction: "manipulation" }}
      className={cn(
        "group relative cursor-pointer rounded-md border text-left outline-none transition-colors",
        picked
          ? "border-info bg-info/10"
          : "border-border bg-surface hover:border-border-strong",
        isDragging && "opacity-35",
      )}
    >
      <div className="flex items-center gap-2.5 py-2 pr-8 pl-2.5">
        <span className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-surface-nested font-ui text-[0.58rem] text-ink-muted">
          {joueur.photo ? (
            <img src={joueur.photo} alt="" className="size-full object-cover" />
          ) : (
            joueur.poste
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-ui text-[0.82rem] text-ink">
            {joueur.nom}
          </span>
          <span className="block truncate font-ui text-[0.68rem] text-ink-muted">
            {POSTE_LABEL[joueur.poste] ?? joueur.poste}
          </span>
        </span>
      </div>

      {/* Drag grip — the only surface with touch-action: none. */}
      <button
        type="button"
        {...listeners}
        aria-label={`Déplacer ${joueur.nom}`}
        title="Glisser vers un autre groupe"
        onClick={(e) => e.stopPropagation()}
        style={{ touchAction: "none" }}
        className="absolute top-1.5 right-1 flex size-7 cursor-grab items-center justify-center rounded-sm text-ink-disabled transition-colors hover:bg-surface-hover hover:text-ink active:cursor-grabbing"
      >
        <GripVertical size={15} />
      </button>

      {deplaceDe ? (
        <div className="flex items-center justify-between gap-2 border-t border-border px-2.5 py-1.5">
          <span className="inline-flex min-w-0 items-center gap-1.5 font-ui text-[0.68rem] text-info">
            <ArrowLeftRight size={11} className="shrink-0" />
            <span className="truncate">Depuis {deplaceDe}</span>
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onReset()
            }}
            title="Remettre dans son groupe"
            className="inline-flex shrink-0 items-center gap-1 font-ui text-[0.68rem] text-ink-muted transition-colors hover:text-ink"
          >
            <CornerUpLeft size={11} /> Remettre
          </button>
        </div>
      ) : null}
    </div>
  )
}

/** What the DragOverlay carries under the finger. */
function JoueurChip({
  joueur,
  dragging,
}: {
  joueur: CategorieJoueur
  dragging?: boolean
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2.5 rounded-md border bg-surface px-2.5 py-2",
        dragging ? "border-brand-blue-600 shadow-deep" : "border-border",
      )}
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-border bg-surface-nested font-ui text-[0.58rem] text-ink-muted">
        {joueur.poste}
      </span>
      <span className="font-ui text-[0.82rem] text-ink">{joueur.nom}</span>
    </div>
  )
}

/* ── Bits ───────────────────────────────────────────────────────────────── */

function sortJoueurs(rows: CategorieJoueur[]): CategorieJoueur[] {
  return [...rows].sort((a, b) => {
    const pa = POSTES.indexOf(a.poste)
    const pb = POSTES.indexOf(b.poste)
    return (
      (pa === -1 ? 99 : pa) - (pb === -1 ? 99 : pb) || a.nom.localeCompare(b.nom)
    )
  })
}

/** dnd-kit announces drags in English by default. */
const annonces = {
  onDragStart: ({ active }: { active: { data: { current?: { nom?: string } } } }) =>
    `Déplacement de ${active.data.current?.nom ?? "un joueur"}.`,
  onDragOver: ({ over }: { over: { id: string | number } | null }) =>
    over ? "Au-dessus d'un groupe." : "Hors de tout groupe.",
  onDragEnd: ({ over }: { over: { id: string | number } | null }) =>
    over ? "Joueur placé dans le groupe." : "Déplacement annulé.",
  onDragCancel: () => "Déplacement annulé.",
}
