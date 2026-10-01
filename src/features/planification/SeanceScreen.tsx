import { Fragment, useMemo, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import {
  AlertTriangle,
  ArrowDown,
  ArrowLeftRight,
  ArrowUp,
  CalendarDays,
  Check,
  CheckCheck,
  ClipboardList,
  Copy,
  Clock,
  Droplets,
  Dumbbell,
  Eraser,
  FileCheck,
  FilePlus2,
  Flag,
  Gauge,
  HeartPulse,
  Layers,
  ListChecks,
  Package,
  MapPin,
  Pencil,
  Play,
  Plus,
  RotateCcw,
  Trash2,
  RefreshCw,
  Repeat,
  ShieldCheck,
  Shirt,
  Timer,
  UserCog,
  Users,
  X,
  type LucideIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { useData } from "@/data/useData"
import {
  isSeanceStarted,
  type ConvocationStatut,
  type PresenceStatut,
  type ModeGroupesProcede,
  type Procede,
  type SeanceDetail,
  type SeanceParticipant,
} from "@/data/seed/seances"
import { Avatar } from "@/components/kit/Avatar"
import { BackButton } from "@/components/kit/BackButton"
import { EmptyState } from "@/components/kit/EmptyState"
import { ConfirmDialog } from "@/components/kit/ConfirmDialog"
import { Toast, useToast } from "@/components/kit/Toast"
import { Button } from "@/components/ui/button"
import { POSTE_LABEL, type CategorieJoueur } from "@/data/seed/categories"
import {
  materiauParNom,
  materielSeance,
  totalPieces,
  type LigneMateriel,
} from "@/data/seed/materiaux"
import type { PlanEvent } from "@/data/seed/events"
import type { SeanceConvocation } from "@/data/seed/convocations"
import { ConvocationBuilder } from "@/features/planification/ConvocationBuilder"
import { EvaluationTab } from "@/features/planification/EvaluationTab"
import { ProcedeAteliers } from "@/features/planification/ProcedeAteliers"
import { GroupesProcedesDialog } from "@/features/planification/GroupesProcedesDialog"
import {
  groupesDuProcede,
  groupesManquants,
} from "@/features/planification/groupesProcede"
import { hexCouleur } from "@/features/planification/atelierCouleurs"
import { ProcedePicker } from "@/features/planification/ProcedePicker"
import { SeanceFormModal } from "@/features/planification/SeanceFormModal"

/* ── Tabs (route-linked, à la CategoryDetailScreen) ───────────────────────── */
//
// The tab set depends on whether the séance has started:
//   • not started (Planifiée) → Procédé · Convocation (who's invited + RSVP)
//   • started / terminée      → Procédé · Présence (attendance) · Évaluation

type SeanceTab = "procede" | "convocation" | "presence" | "evaluation"

const TAB_LABEL: Record<SeanceTab, string> = {
  procede: "Procédé",
  convocation: "Convocation",
  presence: "Présence",
  evaluation: "Évaluation",
}

/**
 * Tabs in the order the séance is lived: what is planned, who is called, who
 * turned up, how it went. Convocation stays available once the séance has
 * started — it is the list the présence is pointed against, and a coach still
 * needs to read (or fix) who was called after the fact.
 */
function tabsFor(detail: SeanceDetail): SeanceTab[] {
  return isSeanceStarted(detail.statut)
    ? ["procede", "convocation", "presence", "evaluation"]
    : ["procede", "convocation"]
}

/* ── Screen ───────────────────────────────────────────────────────────────── */

export function SeanceScreen() {
  const { id, tab } = useParams()
  const navigate = useNavigate()
  const { events, seanceDetailPour } = useData()
  // One toast for the whole page: every tab confirms in the same place.
  const { toast, notify } = useToast()

  // Prefer a seeded detail; otherwise derive one from the calendar event so any
  // séance card still opens a coherent page (with an empty procédé state).
  // Seeded detail, calendar event, or a séance planned from a programme —
  // the store knows which, and edits go back through the same resolver.
  const detail: SeanceDetail | null = useMemo(
    () => (id ? seanceDetailPour(id) : null),
    [seanceDetailPour, id],
  )

  if (!detail) {
    return (
      <div className="mx-auto max-w-6xl">
        <BackButton to="/planification" label="Retour à la planification" />
        <EmptyState
          icon={Dumbbell}
          title="Séance introuvable"
          description="Cette séance n'existe pas ou a été retirée du planning."
        />
      </div>
    )
  }

  const tabs = tabsFor(detail)
  // Only tabs valid for this séance's state are reachable; anything else (e.g.
  // /presence on a not-started séance) falls back to Procédé.
  const activeTab: SeanceTab = tabs.includes(tab as SeanceTab)
    ? (tab as SeanceTab)
    : "procede"

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5 sm:gap-6">
      <BackButton to="/planification" label="Retour à la planification" />

      <SeanceHeader
        detail={detail}
        event={events.find((e) => e.id === detail.eventId) ?? null}
        notify={notify}
        // Démarrer la séance ouvre le pointage : on y emmène directement.
        onStarted={() =>
          navigate(`/planification/seance/${detail.eventId}/presence`)
        }
      />


      <SeanceTabs eventId={detail.eventId} tabs={tabs} active={activeTab} />

      {activeTab === "procede" ? (
        <ProcedeTab detail={detail} notify={notify} />
      ) : activeTab === "convocation" ? (
        <ConvocationTab detail={detail} notify={notify} />
      ) : activeTab === "presence" ? (
        <PresenceTab detail={detail} notify={notify} />
      ) : (
        <EvaluationTab detail={detail} notify={notify} />
      )}

      <Toast toast={toast} />
    </div>
  )
}

/* ── Header ───────────────────────────────────────────────────────────────── */

const STATUT_PILL: Record<SeanceDetail["statut"], string> = {
  Terminé: "border-success/30 bg-success/10 text-success",
  "En cours": "border-brand-blue-600/30 bg-brand-blue-600/10 text-brand-blue-600",
  Planifiée: "border-border-second bg-surface-nested text-ink-muted",
}

/**
 * Header — the séance's identity, plus the one action that matters at this
 * moment of its life: démarrer (which opens the pointage), terminer, rouvrir.
 */
function SeanceHeader({
  detail,
  event,
  notify,
  onStarted,
}: {
  detail: SeanceDetail
  event: PlanEvent | null
  notify: (msg: string) => void
  onStarted: () => void
}) {
  const { setSeanceStatut, toggleSeanceCheck } = useData()
  const [edition, setEdition] = useState(false)

  const demarrer = () => {
    setSeanceStatut(detail.eventId, "En cours")
    notify(`${detail.numero} démarrée — pointage ouvert`)
    onStarted()
  }

  return (
    <header className="flex flex-col gap-5 rounded-lg border border-border p-4 sm:p-6">
      {/* Title row: icon + numéro + type · statut pill. */}
      <div className="flex flex-wrap items-start justify-between gap-3 sm:gap-4">
        <div className="flex items-start gap-3 sm:gap-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-md bg-surface-nested text-ink-subtle sm:size-12">
            <Dumbbell size={22} strokeWidth={2} />
          </span>
          <div className="min-w-0">
            <p className="font-ui text-[0.7rem] font-medium tracking-[0.1em] text-ink-disabled uppercase">
              Séance d'entraînement
            </p>
            <h1 className="mt-1 flex flex-wrap items-center gap-2 font-ui text-xl font-semibold tracking-normal text-ink sm:gap-2.5 sm:text-2xl">
              {detail.numero}
              <span className="rounded-pill border border-brand-blue-600/30 bg-brand-blue-600/10 px-2.5 py-0.5 font-ui text-[0.72rem] font-medium text-brand-blue-600">
                {detail.type}
              </span>
            </h1>
            {event?.detail ? (
              <p className="mt-1.5 max-w-xl font-body text-[0.85rem] leading-relaxed text-ink-muted">
                {event.detail}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2.5">
          <span
            className={cn(
              "shrink-0 rounded-pill border px-3 py-1 font-ui text-[0.72rem] font-medium",
              STATUT_PILL[detail.statut],
            )}
          >
            {detail.statut}
          </span>

          <button
            type="button"
            onClick={() => setEdition(true)}
            aria-label="Modifier la séance"
            title="Modifier la séance"
            className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border text-ink-muted transition-colors hover:border-border-strong hover:text-ink"
          >
            <Pencil size={15} />
          </button>

          {detail.statut === "Planifiée" ? (
            <Button size="sm" onClick={demarrer}>
              <Play size={15} /> Démarrer la séance
            </Button>
          ) : detail.statut === "En cours" ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSeanceStatut(detail.eventId, "Terminé")
                notify(`${detail.numero} terminée`)
              }}
            >
              <Flag size={15} /> Terminer la séance
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSeanceStatut(detail.eventId, "En cours")
                notify(`${detail.numero} rouverte`)
              }}
            >
              <RotateCcw size={15} /> Rouvrir
            </Button>
          )}
        </div>
      </div>

      {/* Info grid — the séance's descriptive fields. */}
      <div className="grid grid-cols-2 gap-3 border-t border-border pt-4 sm:grid-cols-3 sm:pt-5 lg:grid-cols-4">
        <InfoField icon={Layers} label="Catégorie" value={detail.categorie} />
        <InfoField icon={Users} label="Groupe" value={detail.groupe} />
        <InfoField icon={Users} label="Effectif" value={detail.effectif} />
        <InfoField icon={CalendarDays} label="Date" value={detail.date} />
        <InfoField
          icon={Clock}
          label="Horaire"
          value={
            event
              ? event.start + (event.end ? " – " + event.end : "")
              : "N/A"
          }
        />
        <InfoField
          icon={MapPin}
          label="Lieu"
          value={event?.location ?? detail.lieu ?? "N/A"}
        />
        <InfoField icon={Timer} label="Durée" value={detail.duree + " min"} />
        <InfoField icon={Gauge} label="Intensité" value={detail.intensite} />
        <InfoField icon={CalendarDays} label="Saison" value={detail.saison} />
      </div>

      {/* Le matériel de la séance, référence par référence. */}
      <MaterielSeance lignes={materielSeance(detail)} />

      {/* Pre-session safety checks. */}
      <div className="flex flex-wrap gap-2.5 border-t border-border pt-4 sm:gap-3 sm:pt-5">
        <CheckChip
          icon={ShieldCheck}
          label="Sécurité vérifiée"
          done={detail.securiteVerifiee}
          onToggle={() => toggleSeanceCheck(detail.eventId, "securite")}
        />
        <CheckChip
          icon={Droplets}
          label="Hydratation vérifiée"
          done={detail.hydratationVerifiee}
          onToggle={() => toggleSeanceCheck(detail.eventId, "hydratation")}
        />
      </div>

      {edition ? (
        <SeanceFormModal
          detail={detail}
          event={event}
          onClose={() => setEdition(false)}
          onSaved={notify}
        />
      ) : null}
    </header>
  )
}

function InfoField({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-surface-nested text-ink-muted">
        <Icon size={15} strokeWidth={2} />
      </span>
      <div className="min-w-0">
        <div className="font-ui text-[0.66rem] font-medium tracking-[0.08em] text-ink-disabled uppercase">
          {label}
        </div>
        <div className="mt-0.5 truncate font-ui text-sm text-ink-subtle">
          {value}
        </div>
      </div>
    </div>
  )
}

/** A pre-session check — cochée sur place, comme sur le terrain. */
function CheckChip({
  icon: Icon,
  label,
  done,
  onToggle,
}: {
  icon: LucideIcon
  label: string
  done: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={done}
      title={done ? `Décocher « ${label} »` : `Cocher « ${label} »`}
      className={cn(
        "inline-flex items-center gap-2 rounded-md border px-3 py-2 font-ui text-[0.8rem] transition-colors",
        done
          ? "border-success/30 bg-success/10 text-success hover:border-success/50"
          : "border-border text-ink-muted hover:border-border-strong hover:text-ink",
      )}
    >
      <Icon size={15} className="shrink-0" />
      {label}
      <span
        className={cn(
          "ml-1 rounded-pill px-1.5 py-0.5 font-ui text-[0.68rem] font-medium",
          done ? "bg-success/15 text-success" : "bg-surface-nested text-ink-muted",
        )}
      >
        {done ? "Oui" : "Non"}
      </span>
    </button>
  )
}

/* ── Tabs ─────────────────────────────────────────────────────────────────── */

function SeanceTabs({
  eventId,
  tabs,
  active,
}: {
  eventId: string
  tabs: SeanceTab[]
  active: SeanceTab
}) {
  return (
    <div className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
      <div className="inline-flex gap-1 rounded-pill border border-border p-1">
        {tabs.map((value) => {
          const on = value === active
          return (
            <Link
              key={value}
              to={`/planification/seance/${eventId}/${value}`}
              aria-current={on ? "page" : undefined}
              className={cn(
                "inline-flex shrink-0 items-center rounded-pill px-4 py-1.5 font-ui text-[0.78rem] font-medium whitespace-nowrap transition-colors",
                on
                  ? "border border-border-second bg-surface-nested text-ink"
                  : "border border-transparent text-ink-muted hover:text-ink",
              )}
            >
              {TAB_LABEL[value]}
            </Link>
          )
        })}
      </div>
    </div>
  )
}

/* ── Procédé tab — left nav (titles) + main content ───────────────────────── */

/** Total programmé — "20 minutes" / "9 minutes" → 29. Derived, never stored. */
function dureeTotale(procedes: Procede[]): number {
  return procedes.reduce((total, p) => total + (parseInt(p.duree, 10) || 0), 0)
}

/**
 * Le déroulé de la séance. En lecture, le rail sert à sauter d'un procédé à
 * l'autre ; en mode « Modifier », les mêmes lignes portent l'ordre et la
 * suppression — l'éducateur construit sa séance là où il la lit, sans changer
 * d'écran. « Ajouter » reste accessible en permanence : c'est l'action qui
 * remplit une séance vide.
 */
function ProcedeTab({
  detail,
  notify,
}: {
  detail: SeanceDetail
  notify: (msg: string) => void
}) {
  const {
    addSeanceProcedes,
    removeSeanceProcede,
    moveSeanceProcede,
    duplicateSeanceProcede,
    setSeanceHydratation,
  } = useData()
  const procedes = detail.procedes

  const [activeId, setActiveId] = useState(procedes[0]?.id ?? "")
  const [edition, setEdition] = useState(false)
  const [picker, setPicker] = useState(false)
  const [aSupprimer, setASupprimer] = useState<Procede | null>(null)
  /** Middle column: the exercise itself, or how the squad is split for it. */
  const [onglet, setOnglet] = useState<"procede" | "groupes">("procede")
  /** Procédés picked in the library, waiting for « quels groupes ? ». */
  const [enAttente, setEnAttente] = useState<Procede[]>([])

  // Procédé retiré / séance vidée : on retombe sur le premier restant.
  const active = procedes.find((p) => p.id === activeId) ?? procedes[0] ?? null

  /**
   * Last step of the add: each picked procédé runs with the séance's groups or
   * with its own. A personalised one opens on its Groupes tab, empty — that is
   * where its groups are made.
   */
  const ajouter = (choix: Record<string, ModeGroupesProcede>) => {
    const nouveaux = enAttente.map((p) => ({
      ...p,
      modeGroupes: choix[p.id],
      ateliers: choix[p.id] === "personnalises" ? [] : undefined,
    }))
    addSeanceProcedes(detail.eventId, nouveaux)
    setEnAttente([])
    const perso = nouveaux.find((p) => p.modeGroupes === "personnalises")
    setActiveId((perso ?? nouveaux[0])?.id ?? activeId)
    setOnglet(perso ? "groupes" : "procede")
    notify(
      perso
        ? `Ajoutez les groupes de « ${perso.titre} »`
        : nouveaux.length > 1
          ? nouveaux.length + " procédés ajoutés à " + detail.numero
          : "« " + nouveaux[0].titre + " » ajouté à " + detail.numero,
    )
  }

  const supprimer = (procede: Procede) => {
    removeSeanceProcede(detail.eventId, procede.id)
    setASupprimer(null)
    notify("« " + procede.titre + " » retiré de la séance")
  }

  /* Les deux surfaces flottantes du tab, montées dans les deux états. */
  const overlays = (
    <>
      {picker ? (
        <ProcedePicker
          seanceLabel={detail.numero}
          dejaProgrammes={procedes
            .map((p) => p.procedeId)
            .filter((id): id is string => Boolean(id))}
          onClose={() => setPicker(false)}
          onAdd={(choisis) => {
            setPicker(false)
            setEnAttente(choisis)
          }}
        />
      ) : null}

      {enAttente.length ? (
        <GroupesProcedesDialog
          procedes={enAttente.map((p) => ({
            id: p.id,
            titre: p.titre,
            detail: [p.type ?? p.fifaCard, p.duree].filter(Boolean).join(" · "),
          }))}
          groupesSeance={detail.groupesSeance ?? []}
          onAnnuler={() => setEnAttente([])}
          onValider={ajouter}
        />
      ) : null}

      <ConfirmDialog
        open={aSupprimer !== null}
        title="Retirer ce procédé ?"
        description={
          "« " +
          (aSupprimer?.titre ?? "") +
          " » sera retiré du déroulé de " +
          detail.numero +
          ". La bibliothèque du club n'est pas touchée."
        }
        confirmLabel="Retirer"
        destructive
        onOpenChange={(o) => !o && setASupprimer(null)}
        onConfirm={() => {
          if (aSupprimer) supprimer(aSupprimer)
        }}
      />
    </>
  )

  if (procedes.length === 0) {
    return (
      <>
        <section className="rounded-lg border border-border">
          <EmptyState
            icon={ClipboardList}
            title="Aucun procédé pour cette séance"
            description="Construisez le déroulé en piochant les exercices dans la bibliothèque du club."
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <Button onClick={() => setPicker(true)}>
                  <Plus size={16} /> Ajouter un procédé
                </Button>
                <Button variant="outline">
                  <FilePlus2 size={16} /> Créer un procédé
                </Button>
              </div>
            }
          />
        </section>
        {overlays}
      </>
    )
  }

  const pauses = (detail.hydratations ?? [])
    .filter((h) => h.apres < procedes.length - 1)
    .reduce((t, h) => t + h.duree, 0)
  const total = dureeTotale(procedes) + pauses

  return (
    // Trois colonnes à partir de xl : rail · procédé · matériel. Entre lg et xl
    // la place manque : le matériel passe au-dessus du procédé, dans sa colonne.
    <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-6 xl:grid-cols-[15rem_minmax(0,1fr)_17rem]">
      {/* Left nav — the ordered procédé titles, for quick jumping. */}
      <nav className="lg:sticky lg:top-3 lg:row-span-2 xl:row-span-1">
        <div className="mb-2 flex items-center justify-between gap-2 px-1">
          <p className="font-ui text-[0.66rem] font-medium tracking-[0.1em] text-ink-disabled uppercase">
            Procédés · {procedes.length}
            {total > 0 ? (
              <>
                {" · "}
                <span className="tabular-nums">{total}</span> min
              </>
            ) : null}
          </p>
          <button
            type="button"
            onClick={() => setEdition((e) => !e)}
            aria-pressed={edition}
            // Le header porte déjà « Modifier la séance » : on précise la portée.
            aria-label={
              edition ? "Terminer la modification du déroulé" : "Modifier le déroulé"
            }
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 font-ui text-[0.68rem] font-medium tracking-[0.06em] uppercase transition-colors",
              edition ? "text-ink" : "text-info hover:text-ink",
            )}
          >
            {edition ? <Check size={12} /> : <Pencil size={12} />}
            {edition ? "Terminer" : "Modifier"}
          </button>
        </div>

        {/* Horizontal scroller on mobile, vertical list from lg up. */}
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 lg:mx-0 lg:flex-col lg:gap-1 lg:px-0 lg:pb-0">
          {procedes.map((p, i) => {
            const on = p.id === active?.id
            const pause = detail.hydratations?.find((h) => h.apres === i)
            return (
              <Fragment key={p.id}>
              <div
                className={cn(
                  "flex w-[15rem] shrink-0 flex-col rounded-md border transition-colors lg:w-full",
                  on
                    ? "border-border-strong bg-surface-nested"
                    : "border-border hover:border-border-strong",
                )}
              >
                <button
                  type="button"
                  onClick={() => setActiveId(p.id)}
                  aria-current={on ? "true" : undefined}
                  className="flex min-w-0 items-center gap-2.5 px-2.5 py-2.5 text-left"
                >
                  <span
                    className={cn(
                      "flex size-6 shrink-0 items-center justify-center rounded-full font-ui text-[0.72rem] font-medium tabular-nums",
                      on
                        ? "bg-brand-blue-600/15 text-brand-blue-600"
                        : "bg-surface-nested text-ink-muted",
                    )}
                  >
                    {i + 1}
                  </span>
                  <span className="min-w-0">
                    <span
                      className={cn(
                        "block truncate font-ui text-[0.85rem]",
                        on ? "font-medium text-ink" : "text-ink-muted",
                      )}
                    >
                      {p.titre}
                    </span>
                    {groupesManquants(detail, p) ? (
                      <span className="flex items-center gap-1 truncate font-ui text-[0.68rem] text-danger">
                        <AlertTriangle size={11} className="shrink-0" />
                        Groupes à définir
                      </span>
                    ) : p.fifaCard || p.type ? (
                      <span className="block truncate font-ui text-[0.68rem] text-ink-disabled">
                        {p.fifaCard ? "FIFA CARD · " + p.fifaCard : p.type}
                      </span>
                    ) : null}
                  </span>
                </button>

                {/* Actions seulement en mode « Modifier » : un appui de trop ne
                    doit pas casser la séance qu'on est en train de lire. Sur
                    leur propre ligne, pour laisser le titre lisible. */}
                {edition ? (
                  <span className="flex items-center justify-between border-t border-border px-1.5 py-1">
                    <span className="flex items-center">
                      <RailAction
                        icon={ArrowUp}
                        label={"Remonter " + p.titre}
                        disabled={i === 0}
                        onClick={() => moveSeanceProcede(detail.eventId, p.id, -1)}
                      />
                      <RailAction
                        icon={ArrowDown}
                        label={"Descendre " + p.titre}
                        disabled={i === procedes.length - 1}
                        onClick={() => moveSeanceProcede(detail.eventId, p.id, 1)}
                      />
                    </span>
                    <span className="flex items-center">
                      <RailAction
                        icon={Pencil}
                        label={"Modifier " + p.titre}
                        onClick={() => {}}
                      />
                      <RailAction
                        icon={Copy}
                        label={"Dupliquer " + p.titre}
                        onClick={() => {
                          const id = duplicateSeanceProcede(detail.eventId, p.id)
                          setActiveId(id)
                          notify("« " + p.titre + " » dupliqué")
                        }}
                      />
                      <RailAction
                        icon={Trash2}
                        label={"Retirer " + p.titre}
                        danger
                        onClick={() => setASupprimer(p)}
                      />
                    </span>
                  </span>
                ) : null}
              </div>

              {/* Période d'hydratation entre deux procédés — jamais après le
                  dernier. Ajoutée et réglée en mode « Modifier ». */}
              {i < procedes.length - 1 ? (
                <PauseHydratation
                  duree={pause?.duree}
                  edition={edition}
                  apres={p.titre}
                  onChange={(duree) =>
                    setSeanceHydratation(detail.eventId, i, duree)
                  }
                />
              ) : null}
              </Fragment>
            )
          })}

          {/* Ajouter / créer — au bout du rail, comme on ajoute une colonne. */}
          <button
            type="button"
            onClick={() => setPicker(true)}
            className="flex w-[15rem] shrink-0 items-center justify-center gap-2 rounded-md border border-dashed border-border-strong px-3 py-2.5 font-ui text-[0.8rem] text-ink-muted transition-colors hover:border-info hover:text-info lg:w-full"
          >
            <Plus size={15} /> Ajouter un procédé
          </button>
          <button
            type="button"
            className="flex w-[15rem] shrink-0 items-center justify-center gap-2 rounded-md border border-border px-3 py-2.5 font-ui text-[0.8rem] text-ink-muted transition-colors hover:border-border-strong hover:text-ink lg:w-full"
          >
            <FilePlus2 size={15} /> Créer un procédé
          </button>
        </div>
      </nav>

      {/* Right — what the selected procédé takes out of the caisse. */}
      {active ? (
        <MaterielProcede
          procede={active}
          seance={materielSeance(detail)}
          className="lg:col-start-2 lg:row-start-1 xl:sticky xl:top-3 xl:col-start-3"
        />
      ) : null}

      {/* Main — the selected procédé's content. */}
      {/* Les onglets collent sous la barre du haut ; le contenu du procédé
          défile dessous. Pas de second ascenseur : la molette fait toujours
          défiler la page, où que soit la souris. */}
      <div className="flex min-w-0 flex-col pt-2 lg:col-start-2 lg:row-start-2 lg:pt-0 xl:row-start-1">
        {active ? (
          <>
            {/* -top-6 / pt-6 : the scroll area has 24px of padding, which sticky
                respects — the bar climbs into it and its background covers it,
                so nothing shows through above the tabs. -mt-6 keeps its place
                in the flow unchanged (it sits in the 24px gap above). */}
            <div className="sticky -top-6 z-10 -mt-6 shrink-0 bg-background pt-6 pb-4">
              <OngletsProcede
                actif={onglet}
                onChange={setOnglet}
                groupes={groupesDuProcede(detail, active).groupes}
                sansGroupe={groupesDuProcede(detail, active).mode === "aucun"}
                manquants={groupesManquants(detail, active)}
              />
            </div>
            <div
              key={active.id + onglet}
              className="min-w-0"
            >
              {onglet === "procede" ? (
                <ProcedeContent procede={active} />
              ) : (
                // How the squad is split for this exercise — per procédé, so it
                // can differ from one exercise to the next.
                <ProcedeAteliers
                  detail={detail}
                  procede={active}
                  notify={notify}
                />
              )}
            </div>
          </>
        ) : null}
      </div>

      {overlays}
    </div>
  )
}

/** The middle column's two faces: the exercise, or its chasubles. */
function OngletsProcede({
  actif,
  onChange,
  groupes,
  manquants,
  sansGroupe,
}: {
  actif: "procede" | "groupes"
  onChange: (o: "procede" | "groupes") => void
  groupes: NonNullable<Procede["ateliers"]>
  /** Personalised groups not made yet — flagged in red on the tab. */
  manquants: boolean
  sansGroupe: boolean
}) {
  const onglets = [
    { id: "procede", label: "Procédé", icon: ClipboardList },
    { id: "groupes", label: "Groupes de joueurs", icon: Users },
  ] as const
  return (
    <div role="tablist" className="flex gap-1 border-b border-border">
      {onglets.map(({ id, label, icon: Icon }) => {
        const on = actif === id
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(id)}
            className={cn(
              "-mb-px inline-flex items-center gap-2 border-b-2 px-3 py-2.5 font-ui text-[0.82rem] font-medium transition-colors",
              on
                ? "border-brand-blue-600 text-ink"
                : "border-transparent text-ink-muted hover:text-ink",
            )}
          >
            <Icon size={15} />
            {label}
            {id === "groupes" ? (
              manquants ? (
                <span className="inline-flex items-center gap-1 rounded-pill border border-danger/40 bg-danger/10 px-1.5 py-0.5 font-ui text-[0.66rem] font-medium text-danger">
                  <AlertTriangle size={11} /> À définir
                </span>
              ) : sansGroupe ? (
                <span className="font-ui text-[0.7rem] font-normal text-ink-disabled">
                  Sans groupe
                </span>
              ) : groupes.length ? (
                <span aria-hidden className="flex items-center gap-0.5">
                  {groupes.map((g) => (
                    <span
                      key={g.id}
                      className="size-2 rounded-full ring-1 ring-white/15"
                      style={{ backgroundColor: hexCouleur(g.couleur) }}
                    />
                  ))}
                </span>
              ) : (
                <span className="font-ui text-[0.7rem] font-normal text-ink-disabled">
                  Ensemble
                </span>
              )
            ) : null}
          </button>
        )
      })}
    </div>
  )
}

/**
 * A drinks break between two procédés of the rail. Read-only outside
 * « Modifier » (shown only if there is one); in « Modifier », added with one
 * click and its length typed in place.
 */
function PauseHydratation({
  duree,
  edition,
  apres,
  onChange,
}: {
  duree?: number
  edition: boolean
  apres: string
  onChange: (duree: number | null) => void
}) {
  const cls =
    "flex w-[15rem] shrink-0 items-center justify-center gap-1.5 rounded-md border border-dashed px-2 py-1 font-ui text-[0.72rem] lg:w-full"
  if (duree === undefined)
    return edition ? (
      <button
        type="button"
        onClick={() => onChange(3)}
        className={cn(
          cls,
          "border-transparent text-ink-disabled transition-colors hover:border-info/30 hover:text-info",
        )}
      >
        <Droplets size={12} /> Ajouter une hydratation
      </button>
    ) : null

  if (!edition)
    return (
      <span className={cn(cls, "border-info/30 text-info")}>
        <Droplets size={12} />
        Hydratation · <span className="tabular-nums">{duree}</span> min
      </span>
    )

  return (
    <span className={cn(cls, "border-info/30 text-info")}>
      <Droplets size={12} />
      Hydratation
      <input
        type="number"
        min={1}
        max={30}
        value={duree}
        aria-label={`Durée de l'hydratation après ${apres}, en minutes`}
        onFocus={(e) => e.currentTarget.select()}
        onChange={(e) =>
          onChange(Math.min(30, Math.max(1, Number(e.target.value) || 1)))
        }
        className="w-11 rounded-sm border border-info/30 bg-transparent px-1 py-0.5 text-center font-ui text-[0.72rem] tabular-nums outline-none transition-colors focus:border-border-focus"
      />
      min
      <button
        type="button"
        aria-label={`Retirer l'hydratation après ${apres}`}
        onClick={() => onChange(null)}
        className="opacity-60 transition-opacity hover:opacity-100"
      >
        <X size={12} />
      </button>
    </span>
  )
}

/** Bouton icône du rail (ordre, suppression) — discret jusqu'au survol. */
function RailAction({
  icon: Icon,
  label,
  onClick,
  disabled,
  danger,
}: {
  icon: LucideIcon
  label: string
  onClick: () => void
  disabled?: boolean
  danger?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cn(
        "flex size-7 items-center justify-center rounded-sm text-ink-disabled transition-colors",
        danger
          ? "hover:bg-danger/10 hover:text-danger"
          : "hover:bg-surface-hover hover:text-ink",
        disabled &&
          "cursor-not-allowed opacity-45 hover:bg-transparent hover:text-ink-disabled",
      )}
    >
      <Icon size={14} />
    </button>
  )
}

/**
 * Header row: what comes out of the caisse for the whole séance, one chip per
 * référence (visuel · nom · quantité), the total at the end.
 */
function MaterielSeance({ lignes }: { lignes: LigneMateriel[] }) {
  const pieces = totalPieces(lignes)
  return (
    <div className="flex items-start gap-2.5 border-t border-border pt-4 sm:pt-5">
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-surface-nested text-ink-muted">
        <Package size={15} strokeWidth={2} />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className="font-ui text-[0.66rem] font-medium tracking-[0.08em] text-ink-disabled uppercase">
            Matériaux
          </span>
          {lignes.length ? (
            <span className="font-ui text-[0.72rem] text-ink-muted tabular-nums">
              {pieces} pièce{pieces > 1 ? "s" : ""} · {lignes.length} réf.
            </span>
          ) : null}
        </div>
        {lignes.length === 0 ? (
          <span className="font-ui text-sm text-ink-disabled">Aucun matériel</span>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {lignes.map((m) => {
              const ref = materiauParNom(m.nom)
              return (
                <li
                  key={m.nom}
                  className="inline-flex items-center gap-2 rounded-pill border border-border py-1 pr-3 pl-1"
                >
                  <span className="flex size-6 items-center justify-center rounded-full bg-surface-nested">
                    {ref ? (
                      <img src={ref.svg} alt="" aria-hidden className="max-h-4 max-w-[70%] object-contain" />
                    ) : (
                      <Package size={12} className="text-ink-disabled" />
                    )}
                  </span>
                  <span className="font-ui text-[0.8rem] text-ink-subtle">{m.nom}</span>
                  <span className="font-ui text-[0.8rem] font-medium text-ink tabular-nums">
                    ×{m.quantite}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}

/** "12 pièces · 2 réf." — a short read of the matériel. */
function resumeMateriel(lignes: LigneMateriel[]): string {
  if (lignes.length === 0) return "Aucun"
  const pieces = totalPieces(lignes)
  return `${pieces} pièce${pieces > 1 ? "s" : ""} · ${lignes.length} réf.`
}

/**
 * The third column: the matériel of the selected procédé, with the séance's
 * total under it — the coach preparing the caisse reads both side by side.
 */
function MaterielProcede({
  procede,
  seance,
  className,
}: {
  procede: Procede
  seance: LigneMateriel[]
  className?: string
}) {
  const lignes = procede.materiel ?? []
  const pieces = totalPieces(lignes)
  return (
    <aside
      className={cn(
        "flex flex-col gap-3 rounded-lg border border-border p-4",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-ui text-[0.66rem] font-medium tracking-[0.1em] text-ink-disabled uppercase">
          Matériel du procédé
        </h3>
        {pieces ? (
          <span className="font-ui text-[0.72rem] text-ink-muted tabular-nums">
            {pieces} pièce{pieces > 1 ? "s" : ""}
          </span>
        ) : null}
      </div>

      {lignes.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-md border border-dashed border-border px-3 py-6 text-center">
          <Package size={18} className="text-ink-disabled" />
          <p className="font-body text-[0.78rem] text-ink-muted">
            Ce procédé ne demande pas de matériel.
          </p>
        </div>
      ) : (
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(10.5rem,1fr))] gap-2 xl:grid-cols-1">
          {lignes.map((m) => {
            const ref = materiauParNom(m.nom)
            return (
              <li
                key={m.nom}
                className="flex items-center gap-3 rounded-md border border-border p-2.5"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-md border border-border bg-surface-nested">
                  {ref ? (
                    <img
                      src={ref.svg}
                      alt=""
                      aria-hidden
                      className="max-h-7 max-w-[70%] object-contain"
                    />
                  ) : (
                    <Package size={15} className="text-ink-disabled" />
                  )}
                </span>
                <span className="min-w-0 flex-1 truncate font-ui text-[0.82rem] text-ink">
                  {m.nom}
                </span>
                <span className="shrink-0 font-ui text-sm font-medium text-ink tabular-nums">
                  ×{m.quantite}
                </span>
              </li>
            )
          })}
        </ul>
      )}

      {/* Le total de la séance — ce qu'on sort réellement de la caisse. */}
      <div className="flex items-center justify-between gap-2 border-t border-border pt-3 font-ui text-[0.75rem]">
        <span className="text-ink-muted">Toute la séance</span>
        <span className="text-ink-subtle tabular-nums">
          {resumeMateriel(seance)}
        </span>
      </div>
    </aside>
  )
}

export function ProcedeContent({ procede }: { procede: Procede }) {
  return (
    <article className="flex flex-col gap-6 rounded-lg border border-border p-4 sm:p-6">
      {/* Procédé header: title + FIFA card, then the timing meta tiles. */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2.5">
          <h2 className="font-ui text-xl font-medium text-ink">{procede.titre}</h2>
          {procede.fifaCard ? (
            <span className="rounded-pill border border-brand-blue-600/30 bg-brand-blue-600/10 px-2.5 py-0.5 font-ui text-[0.7rem] font-medium tracking-wide text-brand-blue-600">
              FIFA CARD · {procede.fifaCard}
            </span>
          ) : null}
          {procede.type ? (
            <span className="rounded-pill border border-brand-blue-600/30 bg-brand-blue-600/10 px-2.5 py-0.5 font-ui text-[0.7rem] font-medium tracking-wide text-brand-blue-600">
              {procede.type}
            </span>
          ) : null}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <MetaTile icon={Clock} label="Durée" value={procede.duree} />
          <MetaTile icon={Repeat} label="Séquence" value={procede.sequence} />
          <MetaTile
            icon={RefreshCw}
            label="Récupération"
            value={`${procede.recuperation} s`}
          />
          {procede.surface ? (
            <MetaTile icon={Layers} label="Surface" value={procede.surface} />
          ) : null}
          {procede.effectif ? (
            <MetaTile icon={Users} label="Effectif" value={procede.effectif} />
          ) : null}
        </div>
      </div>

      {/* Illustration. */}
      {procede.image ? (
        <figure className="overflow-hidden rounded-lg border border-border bg-surface-nested">
          <img
            src={procede.image}
            alt={`Schéma du procédé ${procede.titre}`}
            loading="lazy"
            className="mx-auto max-h-[420px] w-full object-contain"
          />
        </figure>
      ) : null}

      {/* Rich content blocks. */}
      <div className="flex flex-col gap-6">
        {procede.blocks.map((block, i) => (
          <BlockView key={i} block={block} />
        ))}
      </div>
    </article>
  )
}

function MetaTile({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-border px-3.5 py-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-surface-nested text-ink-muted">
        <Icon size={16} strokeWidth={2} />
      </span>
      <div className="min-w-0">
        <div className="font-ui text-[0.64rem] font-medium tracking-[0.08em] text-ink-disabled uppercase">
          {label}
        </div>
        <div className="mt-0.5 truncate font-ui text-sm text-ink">{value}</div>
      </div>
    </div>
  )
}

/* ── One rich-content block ───────────────────────────────────────────────── */

function BlockView({ block }: { block: Procede["blocks"][number] }) {
  return (
    <section className="flex flex-col gap-2.5">
      <h3 className="flex items-center gap-2 font-ui text-[0.8rem] font-medium tracking-[0.04em] text-ink-subtle uppercase">
        <span className="h-3.5 w-1 rounded-full bg-brand-blue-600" aria-hidden />
        {block.heading}
      </h3>

      {block.kind === "paragraph" ? (
        <p className="font-body text-[0.9rem] leading-relaxed text-ink-muted">
          {block.text}
        </p>
      ) : null}

      {block.kind === "list" ? (
        <ul className="flex flex-col gap-1.5">
          {block.items.map((item, i) => (
            <li
              key={i}
              className="flex items-start gap-2.5 font-body text-[0.9rem] leading-relaxed text-ink-muted"
            >
              <ListChecks
                size={15}
                className="mt-0.5 shrink-0 text-ink-disabled"
              />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {block.kind === "table" ? (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-border">
                {block.head.map((h, i) => (
                  <th
                    key={i}
                    className={cn(
                      "px-3.5 py-2.5 font-ui text-[0.68rem] font-medium tracking-[0.06em] text-ink-muted uppercase whitespace-nowrap",
                      i === 0 ? "text-left" : "text-right tabular-nums",
                    )}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, ri) => (
                <tr
                  key={ri}
                  className="border-b border-border last:border-b-0 transition-colors hover:bg-surface-hover"
                >
                  {row.map((cell, ci) => (
                    <td
                      key={ci}
                      className={cn(
                        "px-3.5 py-2.5 font-body text-[0.85rem] whitespace-nowrap",
                        ci === 0
                          ? "font-ui font-medium text-ink"
                          : "text-right tabular-nums text-ink-muted",
                      )}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  )
}

/* ── Attendance: shared list of convoqués (Convocation + Présence tabs) ────── */

type StatusMeta = {
  label: string
  icon: LucideIcon
  /** badge/dot classes (semantic status colours). */
  chip: string
  dot: string
}

const CONVOCATION_META: Record<ConvocationStatut, StatusMeta> = {
  accepte: {
    label: "Accepté",
    icon: Check,
    chip: "border-success/30 bg-success/10 text-success",
    dot: "bg-success",
  },
  refuse: {
    label: "Refusé",
    icon: X,
    chip: "border-danger/30 bg-danger/10 text-danger",
    dot: "bg-danger",
  },
  attente: {
    label: "En attente",
    icon: Clock,
    chip: "border-border-strong text-ink-muted",
    dot: "bg-ink-disabled",
  },
}

/**
 * Le pointage d'une séance a cinq états — plus « non pointé », qui n'est pas un
 * statut mais l'absence de saisie : tant que l'éducateur n'a pas appelé
 * quelqu'un, on ne le déclare pas absent.
 *
 * Couleurs : vert = il s'est entraîné, or = partiellement, rouge = pas
 * d'entraînement, neutre = excusé (ce n'est pas une faute). Blessé et absent
 * partagent le rouge mais jamais l'icône ni le libellé.
 */
type PresenceCell = PresenceStatut | "nonPointe"

type PresenceMeta = StatusMeta & {
  /** Classes du bouton quand ce statut est celui retenu. */
  active: string
}

const PRESENCE_META: Record<PresenceCell, PresenceMeta> = {
  present: {
    label: "Présent",
    icon: Check,
    chip: "border-success/30 bg-success/10 text-success",
    dot: "bg-success",
    active: "bg-success/15 text-success",
  },
  retard: {
    label: "En retard",
    icon: Timer,
    chip: "border-warning/30 bg-warning/10 text-warning",
    dot: "bg-warning",
    active: "bg-warning/15 text-warning",
  },
  blesse: {
    label: "Blessé",
    icon: HeartPulse,
    chip: "border-danger/30 text-danger",
    dot: "bg-danger",
    active: "bg-danger/10 text-danger",
  },
  absentJustifie: {
    label: "Absent justifié",
    icon: FileCheck,
    chip: "border-border-strong text-ink-muted",
    dot: "bg-ink-disabled",
    active: "bg-surface-hover text-ink-subtle",
  },
  absent: {
    label: "Absent",
    icon: X,
    chip: "border-danger/30 bg-danger/10 text-danger",
    dot: "bg-danger",
    active: "bg-danger/15 text-danger",
  },
  nonPointe: {
    label: "Non pointé",
    icon: Clock,
    chip: "border-border text-ink-disabled",
    dot: "bg-border-strong",
    active: "",
  },
}

/** Ordered status keys so the summary chips read consistently. */
const CONVOCATION_ORDER: ConvocationStatut[] = ["accepte", "refuse", "attente"]
const PRESENCE_ORDER: PresenceStatut[] = [
  "present",
  "retard",
  "blesse",
  "absentJustifie",
  "absent",
]

/**
 * Convocation — who is called to this séance.
 *
 * Three states: a convocation built here (grouped by groupe, with the joueurs
 * borrowed from another groupe flagged), the seeded list of an older séance
 * (read-only), or nothing at all — where the builder starts from.
 */
function ConvocationTab({
  detail,
  notify,
}: {
  detail: SeanceDetail
  notify: (msg: string) => void
}) {
  const { convocations, categories, removeConvocation } = useData()
  const [builder, setBuilder] = useState(false)
  const [confirmAnnuler, setConfirmAnnuler] = useState(false)

  const convocation = convocations.find((c) => c.eventId === detail.eventId)
  const categorie = categories.find((c) => c.id === convocation?.categorieId)
  const staff = detail.participants.filter((p) => p.kind === "staff")

  const openBuilder = () => setBuilder(true)

  return (
    <div className="flex flex-col gap-5">
      {convocation && categorie ? (
        <ConvocationView
          convocation={convocation}
          categorie={categorie}
          staff={staff}
          onEdit={openBuilder}
          onAnnuler={() => setConfirmAnnuler(true)}
        />
      ) : detail.participants.length > 0 ? (
        <>
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={openBuilder}>
              <Pencil size={15} /> Refaire la convocation
            </Button>
          </div>
          <AttendanceList
            participants={detail.participants}
            statusOf={(p) => p.convocation}
            meta={CONVOCATION_META}
            order={CONVOCATION_ORDER}
            emptyTitle="Aucun convoqué"
            emptyDescription="Les membres du staff et les joueurs convoqués à cette séance apparaîtront ici."
            showNotes
          />
        </>
      ) : (
        <section className="rounded-lg border border-border">
          <EmptyState
            icon={Users}
            title="Aucune convocation"
            description={`Personne n'est encore appelé à ${detail.numero}. Convoquez un groupe entier, ou choisissez les joueurs groupe par groupe.`}
            action={
              <Button onClick={openBuilder}>
                <Plus size={16} /> Créer la convocation
              </Button>
            }
          />
        </section>
      )}

      {builder ? (
        <ConvocationBuilder
          eventId={detail.eventId}
          seanceLabel={detail.numero}
          categorieHint={detail.categorie}
          existing={convocation}
          onClose={() => setBuilder(false)}
          onSaved={(_, message) => {
            setBuilder(false)
            notify(message)
          }}
        />
      ) : null}

      <ConfirmDialog
        open={confirmAnnuler}
        title="Annuler la convocation ?"
        description={`Les joueurs appelés à ${detail.numero} seront retirés. La séance reviendra à l'état « aucune convocation ».`}
        confirmLabel="Annuler la convocation"
        destructive
        onOpenChange={(o) => !o && setConfirmAnnuler(false)}
        onConfirm={() => {
          removeConvocation(detail.eventId)
          setConfirmAnnuler(false)
          notify("Convocation annulée")
        }}
      />
    </div>
  )
}

/** A saved convocation, read groupe by groupe. */
function ConvocationView({
  convocation,
  categorie,
  staff,
  onEdit,
  onAnnuler,
}: {
  convocation: SeanceConvocation
  categorie: {
    id: string
    nom: string
    groupes: { id: string; nom: string }[]
    joueurs: CategorieJoueur[]
  }
  staff: SeanceParticipant[]
  onEdit: () => void
  onAnnuler: () => void
}) {
  type Row = {
    joueurId: string
    groupeId: string
    reponse: ConvocationStatut
    joueur: CategorieJoueur
  }

  const rows = convocation.joueurs
    .map((c) => {
      const joueur = categorie.joueurs.find((j) => j.id === c.joueurId)
      return joueur ? { ...c, joueur } : null
    })
    .filter((r): r is Row => r !== null)

  const counts = CONVOCATION_ORDER.map((key) => ({
    key,
    meta: CONVOCATION_META[key],
    n: rows.filter((r) => r.reponse === key).length,
  }))
  const deplaces = rows.filter((r) => r.groupeId !== r.joueur.groupeId).length
  const groupes = categorie.groupes.filter((g) =>
    rows.some((r) => r.groupeId === g.id),
  )
  // A catégorie can carry nine groupes: when several are convoked, a chip row
  // scopes the list to one so the page stays readable.
  const [filtre, setFiltre] = useState("")
  const visibles = filtre ? groupes.filter((g) => g.id === filtre) : groupes

  return (
    <div className="flex flex-col gap-5">
      {/* Summary + actions. */}
      <div className="flex flex-wrap items-center gap-2.5">
        <span className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 font-ui text-[0.8rem] text-ink-subtle">
          <Users size={14} className="text-ink-muted" />
          <span className="font-medium text-ink tabular-nums">{rows.length}</span>
          convoqués · {categorie.nom}
        </span>
        {counts.map(({ key, meta: m, n }) => (
          <span
            key={key}
            className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 font-ui text-[0.8rem] text-ink-subtle"
          >
            <span className={cn("size-2 rounded-full", m.dot)} aria-hidden />
            <span className="font-medium text-ink tabular-nums">{n}</span>
            {m.label}
          </span>
        ))}
        {deplaces > 0 ? (
          <span className="inline-flex items-center gap-2 rounded-md border border-info/30 bg-info/10 px-3 py-2 font-ui text-[0.8rem] text-info">
            <ArrowLeftRight size={14} />
            <span className="font-medium tabular-nums">{deplaces}</span>
            déplacé{deplaces > 1 ? "s" : ""} pour la séance
          </span>
        ) : null}

        <span className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Pencil size={15} /> Modifier
          </Button>
          <Button variant="ghost" size="sm" onClick={onAnnuler}>
            <Trash2 size={15} /> Annuler
          </Button>
        </span>
      </div>

      {/* Groupe filter — only worth showing past two groupes. */}
      {groupes.length > 2 ? (
        <div className="flex flex-wrap items-center gap-2">
          <GroupeChip active={filtre === ""} onClick={() => setFiltre("")}>
            Tous les groupes · {rows.length}
          </GroupeChip>
          {groupes.map((g) => (
            <GroupeChip
              key={g.id}
              active={filtre === g.id}
              onClick={() => setFiltre(g.id)}
            >
              {g.nom} · {rows.filter((r) => r.groupeId === g.id).length}
            </GroupeChip>
          ))}
        </div>
      ) : null}

      {staff.length > 0 ? (
        <AttendanceGroup
          icon={UserCog}
          title="Staff"
          people={staff}
          statusOf={(p) => p.convocation}
          meta={CONVOCATION_META}
          showNotes
        />
      ) : null}

      {visibles.map((g) => {
        const list = rows.filter((r) => r.groupeId === g.id)
        return (
          <section key={g.id} className="flex flex-col gap-2.5">
            <h3 className="flex items-center gap-2 font-ui text-[0.78rem] font-medium tracking-[0.06em] text-ink-muted uppercase">
              <Shirt size={15} className="text-ink-disabled" />
              {g.nom}
              <span className="font-normal text-ink-disabled">· {list.length}</span>
            </h3>
            <ul className="overflow-hidden rounded-lg border border-border">
              {list.map((r, i) => {
                const m = CONVOCATION_META[r.reponse]
                const StatusIcon = m.icon
                const origine =
                  r.groupeId !== r.joueur.groupeId
                    ? (categorie.groupes.find((x) => x.id === r.joueur.groupeId)
                        ?.nom ?? "un autre groupe")
                    : null
                return (
                  <li
                    key={r.joueurId}
                    className={cn(
                      "flex items-center gap-3 px-3.5 py-3 transition-colors hover:bg-surface-hover sm:px-4",
                      i > 0 && "border-t border-border",
                    )}
                  >
                    <Avatar name={r.joueur.nom} src={r.joueur.photo} size="md" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="truncate font-ui text-[0.9rem] font-medium text-ink">
                          {r.joueur.nom}
                        </span>
                        {origine ? (
                          <span className="inline-flex items-center gap-1 rounded-pill border border-info/30 bg-info/10 px-2 py-0.5 font-ui text-[0.66rem] text-info">
                            <ArrowLeftRight size={10} /> Depuis {origine}
                          </span>
                        ) : null}
                      </div>
                      <div className="truncate font-body text-[0.78rem] text-ink-muted">
                        {POSTE_LABEL[r.joueur.poste] ?? r.joueur.poste}
                      </div>
                    </div>
                    <span
                      className={cn(
                        "inline-flex shrink-0 items-center gap-1.5 rounded-pill border px-2.5 py-1 font-ui text-[0.72rem] font-medium",
                        m.chip,
                      )}
                    >
                      <StatusIcon size={13} className="shrink-0" />
                      {m.label}
                    </span>
                  </li>
                )
              })}
            </ul>
          </section>
        )
      })}
    </div>
  )
}

/* ── Présence — le pointage du jour ───────────────────────────────────────── */

/**
 * Pointage de la séance : staff et joueurs, cinq états, un appui chacun.
 *
 * L'écran est fait pour être tenu d'une main au bord du terrain — d'où les cinq
 * boutons icône alignés sur chaque ligne (aucun menu à ouvrir), la légende en
 * tête, et « Tout présent » qui fait le gros du travail avant de corriger les
 * trois exceptions. Ré-appuyer sur l'état retenu le remet à « non pointé » :
 * la liste ne ment jamais sur ce qui n'a pas encore été appelé.
 *
 * La liste vient de la séance ; si elle n'en porte pas, elle est reconstruite
 * depuis la convocation — on pointe ceux qu'on a appelés.
 */
function PresenceTab({
  detail,
  notify,
}: {
  detail: SeanceDetail
  notify: (msg: string) => void
}) {
  const {
    convocations,
    categories,
    setSeancePresence,
    setSeancePresenceAll,
  } = useData()

  const participants = useMemo<SeanceParticipant[]>(() => {
    if (detail.participants.length > 0) return detail.participants
    const convocation = convocations.find((c) => c.eventId === detail.eventId)
    const categorie = categories.find((c) => c.id === convocation?.categorieId)
    if (!convocation || !categorie) return []
    return convocation.joueurs
      .map<SeanceParticipant | null>((c) => {
        const joueur = categorie.joueurs.find((j) => j.id === c.joueurId)
        if (!joueur) return null
        return {
          id: joueur.id,
          name: joueur.nom,
          role: POSTE_LABEL[joueur.poste] ?? joueur.poste,
          kind: "joueur",
          convocation: c.reponse,
        }
      })
      .filter((p): p is SeanceParticipant => p !== null)
  }, [detail.participants, detail.eventId, convocations, categories])

  if (participants.length === 0) {
    return (
      <section className="rounded-lg border border-border">
        <EmptyState
          icon={Users}
          title="Personne à pointer"
          description="Aucun staff ni joueur n'est rattaché à cette séance. Faites la convocation avant de démarrer pour retrouver ici la liste à appeler."
        />
      </section>
    )
  }

  const ids = participants.map((p) => p.id)
  const statutOf = (p: SeanceParticipant): PresenceCell =>
    detail.presence[p.id] ?? "nonPointe"

  const pointes = participants.filter((p) => statutOf(p) !== "nonPointe").length
  const counts = PRESENCE_ORDER.map((key) => ({
    key,
    meta: PRESENCE_META[key],
    n: participants.filter((p) => statutOf(p) === key).length,
  }))

  const staff = participants.filter((p) => p.kind === "staff")
  const joueurs = participants.filter((p) => p.kind === "joueur")

  const marquer = (p: SeanceParticipant, statut: PresenceCell) => {
    const next = statut === "nonPointe" ? null : statut
    setSeancePresence(detail.eventId, p.id, next)
    notify(
      next === null
        ? p.name + " remis à pointer"
        : p.name + " · " + PRESENCE_META[statut].label,
    )
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Avancement du pointage + actions de masse. */}
      <section className="flex flex-col gap-3.5 rounded-lg border border-border p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="font-ui text-sm text-ink">
              <span className="font-medium tabular-nums">{pointes}</span>
              <span className="text-ink-muted tabular-nums">
                /{participants.length}
              </span>{" "}
              <span className="text-ink-muted">pointés</span>
            </p>
            <p className="mt-0.5 font-body text-[0.78rem] text-ink-disabled">
              {pointes === participants.length
                ? "Appel terminé — modifiable à tout moment."
                : participants.length - pointes + " restant(s) à appeler."}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSeancePresenceAll(detail.eventId, ids, "present")
                notify("Tout le monde marqué présent")
              }}
            >
              <CheckCheck size={15} /> Tout présent
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={pointes === 0}
              onClick={() => {
                setSeancePresenceAll(detail.eventId, ids, null)
                notify("Pointage effacé")
              }}
            >
              <Eraser size={15} /> Effacer
            </Button>
          </div>
        </div>

        {/* Barre d'avancement — bleue : c'est de la progression, pas un statut. */}
        <span className="block h-1 overflow-hidden rounded-pill bg-surface-nested">
          <span
            className="block h-full rounded-pill bg-info transition-[width] duration-200"
            style={{ width: (pointes / participants.length) * 100 + "%" }}
          />
        </span>

        {/* Le compte par état, dans l'ordre de la ligne de boutons. */}
        <div className="flex flex-wrap gap-2.5 border-t border-border pt-3.5">
          {counts.map(({ key, meta: m, n }) => {
            const Icon = m.icon
            return (
              <span
                key={key}
                className={cn(
                  "inline-flex items-center gap-2 rounded-md border px-3 py-2 font-ui text-[0.78rem]",
                  n > 0 ? m.chip : "border-border text-ink-disabled",
                )}
              >
                <Icon size={14} className="shrink-0" />
                <span className="font-medium tabular-nums">{n}</span>
                {m.label}
              </span>
            )
          })}
          {participants.length - pointes > 0 ? (
            <span className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 font-ui text-[0.78rem] text-ink-muted">
              <Clock size={14} className="shrink-0 text-ink-disabled" />
              <span className="font-medium tabular-nums text-ink">
                {participants.length - pointes}
              </span>
              À pointer
            </span>
          ) : null}
        </div>
      </section>

      {staff.length > 0 ? (
        <PointageGroup
          icon={UserCog}
          title="Staff"
          people={staff}
          statutOf={statutOf}
          onMarquer={marquer}
        />
      ) : null}

      {joueurs.length > 0 ? (
        <PointageGroup
          icon={Shirt}
          title="Joueurs"
          people={joueurs}
          statutOf={statutOf}
          onMarquer={marquer}
        />
      ) : null}
    </div>
  )
}

function PointageGroup({
  icon: Icon,
  title,
  people,
  statutOf,
  onMarquer,
}: {
  icon: LucideIcon
  title: string
  people: SeanceParticipant[]
  statutOf: (p: SeanceParticipant) => PresenceCell
  onMarquer: (p: SeanceParticipant, statut: PresenceCell) => void
}) {
  const pointes = people.filter((p) => statutOf(p) !== "nonPointe").length
  return (
    <section className="flex flex-col gap-2.5">
      <h3 className="flex items-center gap-2 font-ui text-[0.78rem] font-medium tracking-[0.06em] text-ink-muted uppercase">
        <Icon size={15} className="text-ink-disabled" />
        {title}
        <span className="font-normal text-ink-disabled tabular-nums">
          · {pointes}/{people.length}
        </span>
      </h3>
      <ul className="overflow-hidden rounded-lg border border-border">
        {people.map((p, i) => {
          const statut = statutOf(p)
          const m = PRESENCE_META[statut]
          return (
            <li
              key={p.id}
              className={cn(
                "flex flex-wrap items-center gap-x-3 gap-y-2.5 px-3.5 py-3 transition-colors hover:bg-surface-hover sm:px-4",
                i > 0 && "border-t border-border",
              )}
            >
              <Avatar name={p.name} size="md" />
              <div className="min-w-0 flex-1 basis-[11rem]">
                <div className="flex items-center gap-2">
                  {p.numero != null ? (
                    <span className="font-ui text-[0.72rem] tabular-nums text-ink-disabled">
                      #{p.numero}
                    </span>
                  ) : null}
                  <span className="truncate font-ui text-[0.9rem] font-medium text-ink">
                    {p.name}
                  </span>
                </div>
                <div className="truncate font-body text-[0.78rem] text-ink-muted">
                  {p.role}
                  {" · "}
                  <span
                    className={cn(
                      statut === "nonPointe"
                        ? "text-ink-disabled"
                        : m.chip.split(" ").find((c) => c.startsWith("text-")),
                    )}
                  >
                    {m.label}
                  </span>
                </div>
              </div>

              <PointageSelector
                nom={p.name}
                statut={statut}
                onChange={(next) => onMarquer(p, next)}
              />
            </li>
          )
        })}
      </ul>
    </section>
  )
}

/**
 * Les cinq états sur une ligne : un appui suffit, ré-appuyer sur l'état retenu
 * le retire. Icônes seules (la ligne doit tenir sur un téléphone), chacune avec
 * son libellé en title / aria-label, et le libellé complet répété sous le nom.
 */
function PointageSelector({
  nom,
  statut,
  onChange,
}: {
  nom: string
  statut: PresenceCell
  onChange: (statut: PresenceCell) => void
}) {
  return (
    <div
      role="group"
      aria-label={"Présence de " + nom}
      className="flex w-full shrink-0 items-center justify-between gap-0.5 rounded-pill border border-border p-1 sm:ml-auto sm:w-auto sm:justify-start"
    >
      {PRESENCE_ORDER.map((key) => {
        const m = PRESENCE_META[key]
        const Icon = m.icon
        const on = statut === key
        return (
          <button
            key={key}
            type="button"
            aria-pressed={on}
            aria-label={m.label}
            title={on ? m.label + " — appuyer pour retirer" : m.label}
            onClick={() => onChange(on ? "nonPointe" : key)}
            className={cn(
              "flex size-8 items-center justify-center rounded-full transition-colors",
              on
                ? m.active
                : "text-ink-disabled hover:bg-surface-hover hover:text-ink",
            )}
          >
            <Icon size={15} />
          </button>
        )
      })}
    </div>
  )
}

function AttendanceList<S extends string>({
  participants,
  statusOf,
  meta,
  order,
  emptyTitle,
  emptyDescription,
  showNotes = false,
}: {
  participants: SeanceParticipant[]
  statusOf: (p: SeanceParticipant) => S
  meta: Record<S, StatusMeta>
  order: S[]
  emptyTitle: string
  emptyDescription: string
  showNotes?: boolean
}) {
  if (participants.length === 0) {
    return (
      <section className="rounded-lg border border-border">
        <EmptyState icon={Users} title={emptyTitle} description={emptyDescription} />
      </section>
    )
  }

  const counts = order.map((key) => ({
    key,
    meta: meta[key],
    n: participants.filter((p) => statusOf(p) === key).length,
  }))

  const staff = participants.filter((p) => p.kind === "staff")
  const joueurs = participants.filter((p) => p.kind === "joueur")

  return (
    <div className="flex flex-col gap-5">
      {/* Summary — one count chip per status. */}
      <div className="flex flex-wrap gap-2.5">
        {counts.map(({ key, meta: m, n }) => (
          <span
            key={key}
            className="inline-flex items-center gap-2 rounded-md border border-border px-3 py-2 font-ui text-[0.8rem] text-ink-subtle"
          >
            <span className={cn("size-2 rounded-full", m.dot)} aria-hidden />
            <span className="font-medium tabular-nums text-ink">{n}</span>
            {m.label}
          </span>
        ))}
      </div>

      {staff.length > 0 ? (
        <AttendanceGroup
          icon={UserCog}
          title="Staff"
          people={staff}
          statusOf={statusOf}
          meta={meta}
          showNotes={showNotes}
        />
      ) : null}

      {joueurs.length > 0 ? (
        <AttendanceGroup
          icon={Shirt}
          title="Joueurs"
          people={joueurs}
          statusOf={statusOf}
          meta={meta}
          showNotes={showNotes}
        />
      ) : null}
    </div>
  )
}

function AttendanceGroup<S extends string>({
  icon: Icon,
  title,
  people,
  statusOf,
  meta,
  showNotes,
}: {
  icon: LucideIcon
  title: string
  people: SeanceParticipant[]
  statusOf: (p: SeanceParticipant) => S
  meta: Record<S, StatusMeta>
  showNotes: boolean
}) {
  return (
    <section className="flex flex-col gap-2.5">
      <h3 className="flex items-center gap-2 font-ui text-[0.78rem] font-medium tracking-[0.06em] text-ink-muted uppercase">
        <Icon size={15} className="text-ink-disabled" />
        {title}
        <span className="font-normal text-ink-disabled">· {people.length}</span>
      </h3>
      <ul className="overflow-hidden rounded-lg border border-border">
        {people.map((p, i) => {
          const m = meta[statusOf(p)]
          const StatusIcon = m.icon
          return (
            <li
              key={p.id}
              className={cn(
                "flex items-center gap-3 px-3.5 py-3 transition-colors hover:bg-surface-hover sm:px-4",
                i > 0 && "border-t border-border",
              )}
            >
              <Avatar name={p.name} size="md" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  {p.numero != null ? (
                    <span className="font-ui text-[0.72rem] tabular-nums text-ink-disabled">
                      #{p.numero}
                    </span>
                  ) : null}
                  <span className="truncate font-ui text-[0.9rem] font-medium text-ink">
                    {p.name}
                  </span>
                </div>
                <div className="truncate font-body text-[0.78rem] text-ink-muted">
                  {p.role}
                  {showNotes && p.note ? (
                    <span className="text-ink-disabled"> · {p.note}</span>
                  ) : null}
                </div>
              </div>
              <span
                className={cn(
                  "inline-flex shrink-0 items-center gap-1.5 rounded-pill border px-2.5 py-1 font-ui text-[0.72rem] font-medium",
                  m.chip,
                )}
              >
                <StatusIcon size={13} className="shrink-0" />
                {m.label}
              </span>
            </li>
          )
        })}
      </ul>
    </section>
  )
}

function GroupeChip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-pill border px-3.5 py-1.5 font-ui text-[0.76rem] transition-colors",
        active
          ? "border-border-second bg-surface-nested text-ink"
          : "border-border text-ink-muted hover:border-border-strong hover:text-ink",
      )}
    >
      {children}
    </button>
  )
}

/* ── Évaluation — empty until the debrief is wired ────────────────────────── */

