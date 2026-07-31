import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { ChevronLeft, ChevronRight, ListOrdered, PlayCircle } from "lucide-react"

import { cn } from "@/lib/utils"
import { useData } from "@/data/useData"
import type { ProjetEtape } from "@/data/seed/projetsDeJeu"
import { PageHeader } from "@/components/kit/PageHeader"
import { EmptyState } from "@/components/kit/EmptyState"
import { BackButton } from "@/components/kit/BackButton"
import { Badge } from "@/components/kit/Badge"
import { Button } from "@/components/ui/button"

const LIST = "/pole-technique/projet-de-jeu"
const SANS_PHASE = "Autres étapes"

export function ProjetDeJeuDetailScreen() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { projetsDeJeu } = useData()

  const projet = projetsDeJeu.find((p) => p.id === id)

  /** Phases in the order they first appear — the club's own reading order. */
  const parPhase = useMemo(() => {
    const map = new Map<string, ProjetEtape[]>()
    for (const e of projet?.etapes ?? []) {
      const k = e.phase || SANS_PHASE
      const arr = map.get(k) ?? map.set(k, []).get(k)!
      arr.push(e)
    }
    return [...map.entries()]
  }, [projet])

  const [phaseActive, setPhaseActive] = useState<string | null>(null)

  const phases = parPhase.map(([nom]) => nom)
  const active = phaseActive && phases.includes(phaseActive) ? phaseActive : phases[0]
  const etapes = parPhase.find(([nom]) => nom === active)?.[1]

  // --- Étape navigation -----------------------------------------------------
  // Every étape registers its node here so the sommaire, the stepper and the
  // scroll-spy all point at the same elements.
  const nodes = useRef(new Map<string, HTMLLIElement>())
  const registre = useCallback((etapeId: string, el: HTMLLIElement | null) => {
    if (el) nodes.current.set(etapeId, el)
    else nodes.current.delete(etapeId)
  }, [])

  /** Étape currently being read — drives the sommaire highlight + the counter. */
  const [courantId, setCourantId] = useState<string | null>(null)
  /** Set when a jump lands in another phase: scroll once the tab has switched. */
  const [enAttente, setEnAttente] = useState<string | null>(null)

  /** True while a jump is in flight, so the scroll-spy can't steal the target.
      Released by the spy once the scrolling has actually settled. */
  const verrou = useRef(false)

  const scrollTo = useCallback((etapeId: string) => {
    const el = nodes.current.get(etapeId)
    if (!el) return
    verrou.current = true
    setCourantId(etapeId)
    el.scrollIntoView({ behavior: "smooth", block: "start" })
    // Anything loading above the target can push it down mid-scroll — re-aim
    // once, then let go if no scroll ever happens (target already in place).
    window.setTimeout(() => {
      nodes.current
        .get(etapeId)
        ?.scrollIntoView({ behavior: "smooth", block: "start" })
    }, 400)
    window.setTimeout(() => {
      verrou.current = false
    }, 1600)
  }, [])

  const allerA = useCallback(
    (etape: ProjetEtape) => {
      const phase = etape.phase || SANS_PHASE
      if (phase === active) scrollTo(etape.id)
      else {
        setPhaseActive(phase)
        setEnAttente(etape.id)
      }
    },
    [active, scrollTo],
  )

  useEffect(() => {
    if (!enAttente) return
    scrollTo(enAttente)
    setEnAttente(null)
  }, [enAttente, scrollTo])

  // Switching phase by hand resets the reading position to its first étape;
  // an étape reached by a cross-phase jump stays the current one.
  useEffect(() => {
    if (enAttente) return
    setCourantId((prev) =>
      prev && etapes?.some((e) => e.id === prev)
        ? prev
        : (etapes?.[0]?.id ?? null),
    )
  }, [etapes, enAttente])

  // Scroll-spy: the last étape whose top has passed under the sticky pilot is
  // the one being read. The listener is captured from the shell's scroll
  // container (scroll events don't bubble, but they can be captured).
  useEffect(() => {
    if (!etapes?.length) return
    /** Just below the sticky pilot — matches the étapes' scroll-margin. */
    const ancre = 200
    let raf = 0

    // Which element actually scrolls: the shell wraps the page in an
    // `overflow-auto` div, but depending on the layout the document itself may
    // be the one scrolling — keep whichever really has overflow.
    let cadre = nodes.current.get(etapes[0].id)?.parentElement ?? null
    while (cadre) {
      const flow = getComputedStyle(cadre).overflowY
      if (flow === "auto" || flow === "scroll") break
      cadre = cadre.parentElement
    }

    const maj = () => {
      raf = 0
      if (verrou.current) return
      const sc =
        cadre && cadre.scrollHeight > cadre.clientHeight
          ? cadre
          : document.scrollingElement
      // At the very bottom the last étapes can never reach the anchor —
      // whoever scrolled that far is reading the last one.
      const fin =
        sc && sc.scrollTop > 0 && sc.scrollTop + sc.clientHeight >= sc.scrollHeight - 8
      if (fin) {
        setCourantId(etapes[etapes.length - 1].id)
        return
      }
      let choisi = etapes[0].id
      for (const e of etapes) {
        const el = nodes.current.get(e.id)
        if (!el) continue
        if (el.getBoundingClientRect().top > ancre) break
        choisi = e.id
      }
      setCourantId(choisi)
    }
    // A jump holds the lock until the scrolling it triggered has stopped —
    // a fixed delay either cuts a long smooth scroll short or lags behind it.
    let repos = 0
    const onScroll = () => {
      window.clearTimeout(repos)
      repos = window.setTimeout(() => {
        verrou.current = false
        maj()
      }, 180)
      if (!raf) raf = requestAnimationFrame(maj)
    }

    window.addEventListener("scroll", onScroll, true)
    maj()
    return () => {
      window.removeEventListener("scroll", onScroll, true)
      window.clearTimeout(repos)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [etapes])

  if (!projet) {
    return (
      <div className="mx-auto w-full max-w-5xl">
        <BackButton to={LIST} label="Retour aux projets de jeu" />
        <div className="rounded-lg border border-border">
          <EmptyState
            icon={PlayCircle}
            title="Projet introuvable"
            description="Ce projet de jeu a été supprimé ou n'existe plus."
            action={
              <Button variant="outline" onClick={() => navigate(LIST)}>
                Retour aux projets
              </Button>
            }
          />
        </div>
      </div>
    )
  }

  const liste = etapes ?? []
  /** Étape numbering runs across the whole projet, not per phase. */
  const numeroDe = (e: ProjetEtape) =>
    projet.etapes.findIndex((x) => x.id === e.id) + 1

  // Prev / next walk the whole projet, crossing phases — the tab follows.
  const indexCourant = courantId
    ? projet.etapes.findIndex((e) => e.id === courantId)
    : -1
  const precedente = indexCourant > 0 ? projet.etapes[indexCourant - 1] : null
  const suivante =
    indexCourant >= 0 && indexCourant < projet.etapes.length - 1
      ? projet.etapes[indexCourant + 1]
      : null

  return (
    <div className="mx-auto w-full max-w-5xl">
      <BackButton to={LIST} label="Retour aux projets de jeu" />

      <div className="flex flex-col gap-6">
        <PageHeader
          title={projet.nom}
          subtitle={
            <span className="flex flex-wrap items-center gap-2">
              {projet.actif ? (
                <Badge variant="success">Actif</Badge>
              ) : (
                <Badge>Modèle</Badge>
              )}
              <span className="inline-flex items-center gap-1.5 font-ui text-[0.75rem] text-ink-muted">
                <ListOrdered size={12} /> {projet.etapes.length} étapes
              </span>
            </span>
          }
        />

        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-6">
          {/* Sticky rail: the projet's identity + the sommaire that jumps into
              any étape without losing the reading position. */}
          <div className="flex flex-col gap-4 lg:sticky lg:top-4 lg:w-[20rem] lg:shrink-0">
            {liste.length ? (
              <nav
                aria-label="Sommaire des étapes"
                className="rounded-lg border border-border p-2"
              >
                <h2 className="px-2 py-1.5 font-ui text-[0.66rem] font-medium tracking-[0.1em] text-ink-disabled uppercase">
                  Sommaire
                </h2>
                <ol className="flex max-h-[46vh] flex-col overflow-y-auto">
                  {liste.map((e) => {
                    const courante = e.id === courantId
                    return (
                      <li key={e.id}>
                        <button
                          type="button"
                          onClick={() => allerA(e)}
                          aria-current={courante ? "true" : undefined}
                          className={cn(
                            "flex w-full items-start gap-2.5 rounded-md px-2 py-2 text-left transition-colors",
                            courante
                              ? "bg-surface-nested text-ink"
                              : "text-ink-muted hover:bg-surface-hover hover:text-ink",
                          )}
                        >
                          <span
                            className={cn(
                              "inline-flex size-5 shrink-0 items-center justify-center rounded-full font-ui text-[0.64rem] tabular-nums transition-colors",
                              courante
                                ? "bg-brand-blue-600/15 text-brand-blue-600"
                                : "bg-surface-nested text-ink-disabled",
                            )}
                          >
                            {numeroDe(e)}
                          </span>
                          <span className="line-clamp-2 font-body text-[0.8rem] leading-snug">
                            {e.titre}
                          </span>
                        </button>
                      </li>
                    )
                  })}
                </ol>
              </nav>
            ) : null}

            {projet.image ? (
              <figure className="overflow-hidden rounded-lg border border-border bg-surface-nested">
                <img
                  src={projet.image}
                  alt={`Illustration du projet ${projet.nom}`}
                  loading="lazy"
                  className="w-full object-cover"
                />
              </figure>
            ) : null}

            {projet.description ? (
              <section className="rounded-lg border border-border p-4">
                <h2 className="mb-2 font-ui text-[0.66rem] font-medium tracking-[0.1em] text-ink-disabled uppercase">
                  Description
                </h2>
                <p className="font-body text-[0.86rem] leading-relaxed text-ink-subtle">
                  {projet.description}
                </p>
              </section>
            ) : null}

            <section className="rounded-lg border border-border p-4">
              <h2 className="mb-3 font-ui text-[0.66rem] font-medium tracking-[0.1em] text-ink-disabled uppercase">
                Catégories
              </h2>
              {projet.categories.length ? (
                <div className="flex flex-wrap gap-1.5">
                  {projet.categories.map((c) => (
                    <span
                      key={c}
                      className="rounded-pill border border-brand-blue-600/30 bg-brand-blue-600/10 px-2.5 py-0.5 font-ui text-[0.7rem] text-brand-blue-600"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="font-body text-[0.84rem] text-ink-disabled">
                  Pas encore appliqué à une catégorie.
                </p>
              )}
            </section>
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-4">
            {/* Sticky pilot: phase tabs + the étape stepper stay reachable
                however deep the coach has scrolled. */}
            {/* The -top/-mt/pt trio pins the pilot flush with the top of the
                scroll area, whose 24px padding would otherwise let the list
                slide visibly above it. */}
            <div className="sticky -top-6 z-10 -mt-6 flex flex-col gap-3 bg-background pt-6 pb-3">
              {/* Phases as tabs — 240 étapes at once is unreadable; a phase is
                  the unit a coach actually works through. */}
              <div className="flex flex-wrap gap-1.5">
                {parPhase.map(([nom, list]) => (
                  <button
                    key={nom}
                    type="button"
                    onClick={() => setPhaseActive(nom)}
                    aria-current={nom === active ? "true" : undefined}
                    className={cn(
                      "flex shrink-0 items-center gap-2 rounded-pill border px-3.5 py-1.5 font-ui text-[0.76rem] font-medium transition-colors",
                      nom === active
                        ? "border-border-second bg-surface-nested text-ink"
                        : "border-border text-ink-muted hover:border-border-strong hover:text-ink",
                    )}
                  >
                    {nom}
                    <span className="font-ui text-[0.68rem] text-ink-disabled tabular-nums">
                      {list.length}
                    </span>
                  </button>
                ))}
              </div>

              {indexCourant >= 0 ? (
                <div className="flex items-center gap-2 rounded-pill border border-border py-1 pr-1 pl-1">
                  <StepBtn
                    icon={ChevronLeft}
                    label="Étape précédente"
                    hint={precedente?.titre}
                    onClick={() => precedente && allerA(precedente)}
                    disabled={!precedente}
                  />
                  <p className="min-w-0 flex-1 truncate text-center font-ui text-[0.76rem] text-ink-muted">
                    <span className="text-ink tabular-nums">
                      {indexCourant + 1}
                    </span>
                    <span className="tabular-nums">
                      /{projet.etapes.length}
                    </span>
                    <span className="text-ink-disabled"> · </span>
                    {projet.etapes[indexCourant].titre}
                  </p>
                  <StepBtn
                    icon={ChevronRight}
                    label="Étape suivante"
                    hint={suivante?.titre}
                    onClick={() => suivante && allerA(suivante)}
                    disabled={!suivante}
                  />
                </div>
              ) : null}
            </div>

            {liste.length ? (
              <ol className="flex flex-col gap-4">
                {liste.map((e) => (
                  <li
                    key={e.id}
                    ref={(el) => registre(e.id, el)}
                    data-etape={e.id}
                    className="flex scroll-mt-[8.5rem] flex-col gap-3 rounded-lg border border-border p-4"
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-surface-nested font-ui text-[0.72rem] text-ink-muted tabular-nums">
                        {numeroDe(e)}
                      </span>
                      <h3 className="font-ui text-[0.95rem] font-medium text-ink">
                        {e.titre}
                      </h3>
                    </div>

                    {/* Fixed box: the diagrams load lazily, and a reserved
                        slot keeps the list (and any jump) from shifting. */}
                    {e.image ? (
                      <figure className="aspect-[16/10] overflow-hidden rounded-md border border-border bg-surface-nested">
                        <img
                          src={e.image}
                          alt={`Schéma — ${e.titre}`}
                          loading="lazy"
                          className="size-full object-contain"
                        />
                      </figure>
                    ) : null}

                    {e.contenu.length ? (
                      <div className="flex flex-col gap-2">
                        {e.contenu.map((t, i) => (
                          <p
                            key={i}
                            className="font-body text-[0.88rem] leading-relaxed text-ink-subtle"
                          >
                            {t}
                          </p>
                        ))}
                      </div>
                    ) : null}
                  </li>
                ))}
              </ol>
            ) : (
              <div className="rounded-lg border border-border">
                <EmptyState
                  icon={ListOrdered}
                  title="Aucune étape"
                  description="Ce projet de jeu n'a pas encore d'étape à dérouler."
                />
              </div>
            )}

            {/* End of a phase — the natural next move, right where the coach
                finishes reading. */}
            {suivante && (suivante.phase || SANS_PHASE) !== active ? (
              <button
                type="button"
                onClick={() => allerA(suivante)}
                className="group flex items-center justify-between gap-3 rounded-lg border border-border px-4 py-3.5 text-left transition-colors hover:border-border-strong"
              >
                <span className="min-w-0">
                  <span className="block font-ui text-[0.66rem] font-medium tracking-[0.1em] text-ink-disabled uppercase">
                    Phase suivante
                  </span>
                  <span className="mt-0.5 block truncate font-ui text-[0.88rem] text-ink transition-colors group-hover:text-brand-blue-600">
                    {suivante.phase || SANS_PHASE}
                  </span>
                </span>
                <ChevronRight
                  size={16}
                  className="shrink-0 text-ink-muted transition-colors group-hover:text-brand-blue-600"
                />
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}

/** Prev / next control inside the étape stepper. */
function StepBtn({
  icon: Icon,
  label,
  hint,
  onClick,
  disabled,
}: {
  icon: typeof ChevronLeft
  label: string
  hint?: string
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={hint ? `${label} — ${hint}` : label}
      className="inline-flex size-7 shrink-0 items-center justify-center rounded-full border border-border text-ink-muted transition-colors hover:border-border-strong hover:text-ink disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:border-border disabled:hover:text-ink-muted"
    >
      <Icon size={15} />
    </button>
  )
}
