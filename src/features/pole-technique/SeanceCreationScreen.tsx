import { useState, type ReactNode } from "react"
import { Navigate, useNavigate, useParams } from "react-router-dom"
import {
  CalendarPlus,
  ChevronDown,
  Dumbbell,
  Layers,
  Loader2,
  NotebookPen,
  RotateCcw,
  Users,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { versIso } from "@/lib/calendrier"
import { useData } from "@/data/useData"
import type { ProcedeAtelier } from "@/data/seed/seances"
import { BackButton } from "@/components/kit/BackButton"
import { RichTextEditor } from "@/components/kit/RichTextEditor"
import { Toast, useToast } from "@/components/kit/Toast"
import { Button } from "@/components/ui/button"
import { GroupesJoueurs } from "@/features/planification/GroupesJoueurs"
import { cheminProgramme } from "@/features/pole-technique/programmationRoutes"

const labelCls =
  "font-ui text-[0.62rem] font-medium tracking-[0.1em] text-ink-disabled uppercase"
const fieldCls =
  "w-full rounded-md border border-input bg-transparent px-3.5 py-2.5 font-body text-sm text-ink outline-none transition-colors focus:border-border-focus"

/**
 * Fiche de création séance — what the coach decides before the séance exists:
 * who plays it, when, how hard, and the chasubles the squad will wear. Those
 * groups are the séance's own; each procédé added afterwards uses them unless
 * the coach personalises it. Procédés and matériel come after, on the séance.
 */
export function SeanceCreationScreen() {
  const navigate = useNavigate()
  const { sessionId } = useParams()
  const {
    programmesAnnuels,
    categories,
    procedePhases,
    procedePrincipes,
    planifierSeance,
  } = useData()
  const { toast, notify } = useToast()

  const programme = programmesAnnuels.find((p) =>
    p.sessions.some((s) => s.id === sessionId),
  )
  const session = programme?.sessions.find((s) => s.id === sessionId)
  const categorie = categories.find((c) => c.id === programme?.categorieId)
  const principe = session?.principeId
    ? procedePrincipes.find((p) => p.id === session.principeId)
    : undefined
  const phase = principe
    ? procedePhases.find((p) => p.id === principe.phaseId)
    : undefined

  const [groupeId, setGroupeId] = useState(categorie?.groupes[0]?.id ?? "")
  const [date, setDate] = useState(versIso(new Date()))
  const [duree, setDuree] = useState("60")
  const [rpe, setRpe] = useState("")
  /** null = suit le groupe choisi ; une valeur = saisie à la main. */
  const [effectifSaisi, setEffectifSaisi] = useState<string | null>(null)
  const [installation, setInstallation] = useState(session?.installation ?? "")
  const [brouillon, setBrouillon] = useState(true)
  const [groupes, setGroupes] = useState<ProcedeAtelier[]>([])
  const [creation, setCreation] = useState(false)
  /** Explication de la séance — HTML du petit éditeur de texte. */
  const [notes, setNotes] = useState("")
  const [explicationOuverte, setExplicationOuverte] = useState(true)

  if (!programme || !session || !categorie)
    return <Navigate to="/pole-technique/programmation" replace />
  // La ligne a déjà sa séance : on l'ouvre au lieu d'en créer une seconde.
  if (session.seanceId && !creation)
    return <Navigate to={`/planification/seance/${session.seanceId}/procede`} replace />

  const retour = cheminProgramme(programme.saison, programme.categorieId)
  const groupe = categorie.groupes.find((g) => g.id === groupeId)
  const roster = categorie.joueurs
    .filter((j) => j.groupeId === groupeId)
    .map((j) => ({ id: j.id, nom: j.nom, poste: j.poste, photo: j.photo }))
  const effectif = effectifSaisi ?? String(roster.length)
  const places = new Set(groupes.flatMap((g) => g.joueurIds)).size

  const changerGroupe = (id: string) => {
    if (id === groupeId) return
    setGroupeId(id)
    // Les chasubles restent, mais vidées : les joueurs de l'autre groupe ne
    // jouent pas cette séance.
    const vivier = new Set(
      categorie.joueurs.filter((j) => j.groupeId === id).map((j) => j.id),
    )
    setGroupes((prev) =>
      prev.map((g) => ({ ...g, joueurIds: g.joueurIds.filter((x) => vivier.has(x)) })),
    )
  }

  const creer = () => {
    if (!groupe || creation) return
    setCreation(true)
    const id = planifierSeance(session.id, groupe.nom, {
      date: `${date}T18:00:00.000Z`,
      duree: duree || "60",
      effectif: Number(effectif) || 0,
      rpeCible: Number(rpe) || 0,
      installation: installation.trim() || undefined,
      brouillon,
      groupesSeance: groupes.length ? groupes : undefined,
      // Une note vide garde quand même des balises : on ne garde que du texte réel.
      notes: notes.replace(/<[^>]*>|&nbsp;/g, "").trim() ? notes : undefined,
    })
    // Un temps pour lire « Création… », puis la séance, prête pour ses procédés.
    setTimeout(
      () => navigate(`/planification/seance/${id}/procede`, { replace: true }),
      700,
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-5 sm:gap-6">
      <BackButton to={retour} label={`Programme · ${categorie.nom}`} />

      {/* Header — the séance as the programme already describes it. */}
      <header className="flex flex-wrap items-start justify-between gap-4 rounded-lg border border-border p-4 sm:p-6">
        <div className="flex items-start gap-3 sm:gap-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-md bg-surface-nested text-ink-subtle sm:size-12">
            <Dumbbell size={22} />
          </span>
          <div className="min-w-0">
            <p className="font-ui text-[0.7rem] font-medium tracking-[0.1em] text-ink-disabled uppercase">
              Nouvelle séance · {categorie.nom} · semaine {session.semaine}
            </p>
            <h1 className="mt-1 flex flex-wrap items-center gap-2 font-ui text-xl font-semibold text-ink sm:text-2xl">
              Séance {session.numero}
              <span className="rounded-pill border border-brand-blue-600/30 bg-brand-blue-600/10 px-2.5 py-0.5 font-ui text-[0.72rem] font-medium text-brand-blue-600">
                {principe?.nom ?? session.special ?? "Principe à définir"}
              </span>
            </h1>
            {phase ? (
              <p className="mt-1.5 font-body text-[0.85rem] text-ink-muted">
                {phase.nom} · {programme.saison}
              </p>
            ) : null}
          </div>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={brouillon}
          onClick={() => setBrouillon((b) => !b)}
          title="Un brouillon reste modifiable et n'est pas annoncé aux joueurs."
          className={cn(
            "inline-flex shrink-0 items-center gap-2.5 rounded-pill border px-3 py-1.5 font-ui text-[0.75rem] transition-colors",
            brouillon ? "border-info/40 text-info" : "border-border text-ink-muted hover:text-ink",
          )}
        >
          Brouillon
          <span
            aria-hidden
            className={cn(
              "flex h-4 w-7 items-center rounded-full p-0.5 transition-colors",
              brouillon ? "bg-info" : "bg-surface-nested",
            )}
          >
            <span
              className={cn(
                "size-3 rounded-full bg-ink transition-transform",
                brouillon && "translate-x-3",
              )}
            />
          </span>
        </button>
      </header>

      {/* ── Informations générales ── */}
      <Section titre="Informations générales">
        <div className="flex flex-col gap-2">
          <span className={labelCls}>Groupe</span>
          {categorie.groupes.length === 0 ? (
            <p className="font-body text-[0.8rem] text-ink-disabled">
              {categorie.nom} n'a pas encore de groupe.
            </p>
          ) : (
            <div role="radiogroup" className="flex flex-wrap items-center gap-2">
              {categorie.groupes.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  role="radio"
                  aria-checked={g.id === groupeId}
                  onClick={() => changerGroupe(g.id)}
                  className={cn(
                    "rounded-pill border px-3.5 py-1.5 font-ui text-[0.78rem] transition-colors",
                    g.id === groupeId
                      ? "border-brand-blue-600/30 bg-brand-blue-600/10 text-brand-blue-600"
                      : "border-border-strong text-ink-muted hover:text-ink",
                  )}
                >
                  {g.nom}
                </button>
              ))}
              <span className="font-body text-[0.75rem] text-ink-disabled">
                {roster.length} joueurs
              </span>
            </div>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Champ label="Date">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={cn(fieldCls, "[color-scheme:dark]")}
            />
          </Champ>
          <Champ label="Durée" unite="minutes">
            <input
              type="number"
              min={0}
              value={duree}
              onChange={(e) => setDuree(e.target.value)}
              className={cn(fieldCls, "pr-20")}
            />
          </Champ>
          <Champ
            label="Intensité prévue"
            unite="/ 10"
            aide="Effort cible selon l'échelle RPE, de 0 à 10."
          >
            <input
              type="number"
              min={0}
              max={10}
              value={rpe}
              placeholder="—"
              onChange={(e) => setRpe(e.target.value)}
              className={cn(fieldCls, "pr-14")}
            />
          </Champ>
          <Champ
            label="Effectif"
            unite="joueurs"
            aide={
              effectifSaisi === null ? (
                `Les joueurs de ${groupe?.nom ?? "ce groupe"}.`
              ) : (
                <button
                  type="button"
                  onClick={() => setEffectifSaisi(null)}
                  className="inline-flex items-center gap-1 text-info hover:text-ink"
                >
                  <RotateCcw size={11} /> Revenir à {roster.length}
                </button>
              )
            }
          >
            <input
              type="number"
              min={0}
              value={effectif}
              onChange={(e) => setEffectifSaisi(e.target.value)}
              className={cn(fieldCls, "pr-20")}
            />
          </Champ>
          <div className="sm:col-span-2">
            <Champ label="Installation">
              <input
                value={installation}
                onChange={(e) => setInstallation(e.target.value)}
                placeholder="Stade de France, Terrain B…"
                className={fieldCls}
              />
            </Champ>
          </div>
        </div>
      </Section>

      {/* ── Groupes de joueurs de la séance ── */}
      <Section titre="Groupes de joueurs de la séance" icon={Layers}>
        {roster.length === 0 ? (
          <p className="font-body text-[0.8rem] text-ink-disabled">
            Choisissez un groupe qui a des joueurs pour les répartir.
          </p>
        ) : (
          <GroupesJoueurs
            key={groupeId}
            roster={roster}
            groupes={groupes}
            onChange={setGroupes}
            notify={notify}
            aide="pour toute la séance"
            vide={{ titre: "Pas encore de groupe" }}
          />
        )}
      </Section>

      {/* ── Notes ── */}
      <section className="overflow-hidden rounded-lg border border-border">
        <div className="flex items-center gap-2.5 border-b border-border px-4 py-3 sm:px-6">
          <NotebookPen size={16} className="text-ink-muted" />
          <h2 className="font-ui text-[0.8rem] font-semibold tracking-[0.06em] text-ink-muted uppercase">
            Notes
          </h2>
        </div>
        <div className="flex flex-col gap-3 p-4 sm:p-6">
          <button
            type="button"
            aria-expanded={explicationOuverte}
            onClick={() => setExplicationOuverte((o) => !o)}
            className="flex items-center justify-between gap-3 text-left"
          >
            <span className="font-ui text-[0.95rem] font-semibold text-ink">
              Explication
            </span>
            <ChevronDown
              size={16}
              className={cn(
                "text-ink-muted transition-transform",
                explicationOuverte && "rotate-180",
              )}
            />
          </button>
          {explicationOuverte ? (
            <RichTextEditor
              value={notes}
              onChange={setNotes}
              placeholder="Décrivez l'objectif et le déroulement de la séance d'entraînement en détail…"
            />
          ) : null}
        </div>
      </section>

      {/* ── Barre d'action ── */}
      <div className="sticky bottom-0 z-10 flex flex-wrap items-center gap-3 rounded-lg border border-border bg-surface p-4">
        <p className="flex min-w-0 basis-full flex-wrap items-center gap-x-3 gap-y-1 font-body text-[0.8rem] text-ink-muted sm:flex-1 sm:basis-0">
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
            <Users size={13} className="text-ink-disabled" />
            {groupe?.nom ?? "—"} · {effectif} joueurs
          </span>
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
            <Layers size={13} className="text-ink-disabled" />
            {groupes.length
              ? `${groupes.length} groupe${groupes.length > 1 ? "s" : ""} · ${places}/${roster.length} placés`
              : "Tout le monde ensemble"}
          </span>
        </p>
        <Button
          variant="ghost"
          className="ml-auto sm:ml-0"
          onClick={() => navigate(retour)}
          disabled={creation}
        >
          Annuler
        </Button>
        <Button onClick={creer} disabled={!groupe || !date || creation}>
          {creation ? <Loader2 className="animate-spin" /> : <CalendarPlus />}
          {creation ? "Création…" : "Créer la séance"}
        </Button>
      </div>

      <Toast toast={toast} />
    </div>
  )
}

/* ── Bits ─────────────────────────────────────────────────────────────────── */

function Section({
  titre,
  sousTitre,
  icon: Icon,
  children,
}: {
  titre: string
  sousTitre?: string
  icon?: typeof Layers
  children: ReactNode
}) {
  return (
    <section className="flex flex-col gap-4 rounded-lg border border-border p-4 sm:p-6">
      <div className="flex items-start gap-3">
        {Icon ? (
          <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-surface-nested text-ink-muted">
            <Icon size={15} />
          </span>
        ) : null}
        <div className="min-w-0">
          <h2 className="font-ui text-[0.95rem] font-medium text-ink">{titre}</h2>
          {sousTitre ? (
            <p className="mt-0.5 font-body text-[0.78rem] text-ink-muted">{sousTitre}</p>
          ) : null}
        </div>
      </div>
      {children}
    </section>
  )
}

function Champ({
  label,
  unite,
  aide,
  children,
}: {
  label: string
  unite?: string
  aide?: ReactNode
  children: ReactNode
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className={labelCls}>{label}</span>
      <span className="relative flex items-center">
        {children}
        {unite ? (
          <span
            aria-hidden
            className="pointer-events-none absolute right-3.5 font-body text-[0.78rem] text-ink-disabled"
          >
            {unite}
          </span>
        ) : null}
      </span>
      {aide ? (
        <span className="font-body text-[0.75rem] text-ink-disabled">{aide}</span>
      ) : null}
    </label>
  )
}
