import { Link, useParams } from "react-router-dom"
import {
  CalendarDays,
  Clock,
  Goal,
  ListChecks,
  MapPin,
  MessageSquareQuote,
  Percent,
  RefreshCw,
  Shield,
  Square,
  Star,
  Swords,
  Target,
  Timer,
  Trophy,
  Users,
  type LucideIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { useData } from "@/data/useData"
import type {
  ParentEnfant,
  ParentEvent,
  ParentFaitDeMatch,
  ParentFaitKind,
} from "@/data/seed/parent"
import { Avatar } from "@/components/kit/Avatar"
import { BackButton } from "@/components/kit/BackButton"
import { EmptyState } from "@/components/kit/EmptyState"
import { Toast, useToast } from "@/components/kit/Toast"
import { AdBanner } from "@/features/planification/AdBanner"
import { EvaluationGrille } from "@/features/parent/EvaluationGrille"
import {
  EnfantBanner,
  ISSUE_META,
  ReponseControl,
  issueOf,
  longDay,
  parentPlanningPath,
} from "@/features/parent/shared"

/**
 * Espace parent — fiche d'un match.
 *
 * Modelled on the club's MatchScreen (scoreline header + pill tabs that differ
 * before and after the game), rewritten for the family: before kick-off it
 * answers "où, quand, avec quoi, et est-il attendu ?"; after, it answers "comment
 * ça s'est passé — pour l'équipe, et pour mon enfant ?".
 */

type Tab = { value: string; label: string }

export function ParentMatchScreen() {
  const { id, tab } = useParams()
  const { parentEvents, parentEnfants } = useData()
  const { toast, notify } = useToast()

  const event = parentEvents.find((e) => e.id === id)
  const enfant = event
    ? parentEnfants.find((c) => c.id === event.enfantId)
    : undefined

  if (!event || !enfant || event.type !== "match" || !event.match) {
    return (
      <div className="mx-auto max-w-5xl">
        <BackButton to="/parent" label="Retour à mes enfants" />
        <EmptyState
          icon={Swords}
          title="Match introuvable"
          description="Ce match n'existe pas ou a été retiré du calendrier du club."
        />
      </div>
    )
  }

  const finished = !!event.match.termine
  const tabs: Tab[] = finished
    ? [
        { value: "details", label: "Détails du match" },
        { value: "stats", label: "Stats de mon fils" },
        { value: "evaluation", label: "Évaluation" },
        { value: "consignes", label: "Consignes" },
      ]
    : // Avant le match, l'en-tête porte déjà la convocation (rendez-vous,
      // lieu, et le bouton Présent / Absent) : la fiche n'a donc qu'un onglet.
      [{ value: "consignes", label: "Consignes" }]
  const active = tabs.some((t) => t.value === tab) ? tab! : tabs[0].value

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <BackButton
        to={parentPlanningPath(enfant.id)}
        label={`Retour au calendrier de ${enfant.nom.split(" ")[0]}`}
      />

      <EnfantBanner enfant={enfant} sub="planification" />

      <MatchHeader
        event={event}
        enfant={enfant}
        finished={finished}
        onAnswer={(r) =>
          notify(
            r === "present"
              ? `Présence confirmée — ${event.match?.adversaire}`
              : `Absence signalée — ${event.match?.adversaire}`,
          )
        }
      />

      <AdBanner space="match_detail" />

      <TabBar event={event} tabs={tabs} active={active} />

      {active === "details" ? (
        <Resume event={event} enfant={enfant} />
      ) : active === "stats" ? (
        <Performance event={event} enfant={enfant} />
      ) : active === "evaluation" ? (
        <Evaluation
          event={event}
          enfant={enfant}
          onDocument={(nom) => notify(`Pièce jointe — ${nom}`)}
        />
      ) : (
        <Consignes event={event} />
      )}

      <Toast toast={toast} />
    </div>
  )
}

/* ── Header ─────────────────────────────────────────────────────────────── */

/** "iSmart U13" — the club's side of the fixture, as the family reads it. */
function nousLabel(enfant: ParentEnfant) {
  return `iSmart ${enfant.categorie}`
}

function MatchHeader({
  event,
  enfant,
  finished,
  onAnswer,
}: {
  event: ParentEvent
  enfant: ParentEnfant
  finished: boolean
  onAnswer: (reponse: string) => void
}) {
  const info = event.match!
  const nous = nousLabel(enfant)
  const home = info.domicile ? nous : info.adversaire
  const away = info.domicile ? info.adversaire : nous
  const homeScore = info.domicile ? info.butsPour : info.butsContre
  const awayScore = info.domicile ? info.butsContre : info.butsPour
  const issue = issueOf(event)
  const prenom = enfant.nom.split(" ")[0]

  return (
    <header className="flex flex-col gap-5 rounded-lg border border-border p-4 sm:p-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-surface-nested text-ink-subtle">
            <Swords size={18} strokeWidth={2} />
          </span>
          <span className="truncate font-ui text-[0.7rem] font-medium tracking-[0.1em] text-ink-disabled uppercase">
            {info.competition} · {event.categorie}
          </span>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-pill border px-3 py-1 font-ui text-[0.72rem] font-medium",
            finished
              ? "border-success/30 bg-success/10 text-success"
              : "border-brand-blue-600/30 bg-brand-blue-600/10 text-brand-blue-600",
          )}
        >
          {finished ? "Terminé" : "À venir"}
        </span>
      </div>

      {/* Scoreline — notre équipe en vert, l'adversaire en rouge. */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 border-t border-border pt-5 sm:gap-6">
        <TeamName name={home} side="home" align="right" />
        <div className="flex flex-col items-center gap-1">
          {finished ? (
            <div className="flex items-center gap-2 font-display text-[2rem] font-semibold tabular-nums sm:gap-2.5 sm:text-5xl">
              <span className="text-team-home">{homeScore ?? 0}</span>
              <span className="text-ink-disabled">–</span>
              <span className="text-team-away">{awayScore ?? 0}</span>
            </div>
          ) : (
            <div className="font-display text-2xl font-semibold text-ink tabular-nums sm:text-4xl">
              {event.start}
            </div>
          )}
          <span className="rounded-pill bg-surface-nested px-2.5 py-0.5 font-ui text-[0.68rem] font-medium tracking-[0.06em] text-ink-muted uppercase">
            {finished
              ? issue
                ? ISSUE_META[issue].label
                : "Terminé"
              : "Coup d'envoi"}
          </span>
        </div>
        <TeamName name={away} side="away" align="left" />
      </div>

      <div className="-mt-2 text-center font-body text-[0.82rem] text-ink-muted">
        {longDay(event.date)} · {info.domicile ? "À domicile" : "En déplacement"}
      </div>

      <div className="grid grid-cols-2 gap-3 border-t border-border pt-5 sm:grid-cols-4">
        <InfoField icon={CalendarDays} label="Date" value={longDay(event.date)} />
        <InfoField
          icon={Clock}
          label={finished ? "Coup d'envoi" : "Rendez-vous"}
          value={finished ? event.start : (info.rdv ?? event.start)}
        />
        <InfoField icon={Trophy} label="Compétition" value={info.competition} />
        {event.location ? (
          <InfoField icon={MapPin} label="Lieu" value={event.location} />
        ) : null}
      </div>

      {!finished ? (
        <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-body text-[0.82rem] text-ink-muted">
            {event.reponse === "attente"
              ? `Le club attend votre réponse pour ${prenom}.`
              : event.reponse === "present"
                ? `${prenom} est attendu au rendez-vous de ${info.rdv ?? event.start}.`
                : `Vous avez signalé l'absence de ${prenom}.`}
          </p>
          <ReponseControl event={event} onDone={onAnswer} />
        </div>
      ) : null}
    </header>
  )
}

function TeamName({
  name,
  side,
  align,
}: {
  name: string
  side: "home" | "away"
  align: "left" | "right"
}) {
  const dot = (
    <span
      aria-hidden
      className={cn(
        "size-2 shrink-0 rounded-full",
        side === "home" ? "bg-team-home" : "bg-team-away",
      )}
    />
  )
  return (
    <div
      className={cn(
        "flex min-w-0 items-center gap-2",
        align === "right" ? "justify-end" : "justify-start",
      )}
    >
      {align === "left" ? dot : null}
      <h1
        className={cn(
          "min-w-0 font-ui text-base font-medium text-ink sm:text-xl",
          align === "right" ? "text-right" : "text-left",
        )}
      >
        {name}
      </h1>
      {align === "right" ? dot : null}
    </div>
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
    <div className="flex min-w-0 flex-col gap-1">
      <span className="inline-flex items-center gap-1.5 font-ui text-[0.68rem] tracking-[0.08em] text-ink-muted uppercase">
        <Icon size={13} className="shrink-0" />
        {label}
      </span>
      <span className="truncate font-body text-[0.86rem] text-ink">{value}</span>
    </div>
  )
}

function TabBar({
  event,
  tabs,
  active,
}: {
  event: ParentEvent
  tabs: Tab[]
  active: string
}) {
  return (
    <div className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
      <div className="inline-flex gap-1 rounded-pill border border-border p-1">
        {tabs.map((t) => {
          const on = t.value === active
          return (
            <Link
              key={t.value}
              to={`/parent/${event.enfantId}/planification/match/${event.id}/${t.value}`}
              aria-current={on ? "page" : undefined}
              className={cn(
                "inline-flex shrink-0 items-center rounded-pill px-4 py-1.5 font-ui text-[0.78rem] font-medium whitespace-nowrap transition-colors",
                on
                  ? "border border-border-second bg-surface-nested text-ink"
                  : "border border-transparent text-ink-muted hover:text-ink",
              )}
            >
              {t.label}
            </Link>
          )
        })}
      </div>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-ui text-[0.72rem] font-medium tracking-[0.08em] text-ink-muted uppercase">
      {children}
    </h2>
  )
}

/**
 * Consignes — exactement les cartes de la page du club (visuel tactique en
 * haut, titre, pastille d'audience), plus la précision destinée aux familles.
 * La consigne adressée à l'enfant garde le liseré bleu du "Coach → moi".
 */
function Consignes({ event }: { event: ParentEvent }) {
  const consignes = event.match?.consignes ?? []

  if (!consignes.length) {
    return (
      <section className="rounded-lg border border-border">
        <EmptyState
          icon={ListChecks}
          title="Aucune consigne"
          description="Les consignes envoyées par l'éducateur avant le match apparaîtront ici."
        />
      </section>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <SectionTitle>Consignes du club</SectionTitle>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {consignes.map((c) => (
          <article
            key={c.titre}
            className={cn(
              "group flex flex-col overflow-hidden rounded-lg border transition-colors",
              c.personal
                ? "border-brand-blue-600/40"
                : "border-border hover:border-border-strong",
            )}
          >
            <div className="aspect-video overflow-hidden border-b border-border bg-surface-nested">
              <img
                src={c.image}
                alt={`Consigne — ${c.titre}`}
                loading="lazy"
                className="size-full object-cover"
              />
            </div>
            <div className="flex flex-1 flex-col gap-1.5 p-4">
              <h3 className="font-ui text-[0.92rem] font-medium text-ink">
                {c.titre}
              </h3>
              {c.detail ? (
                <p className="font-body text-[0.82rem] leading-relaxed text-ink-muted">
                  {c.detail}
                </p>
              ) : null}
              <span
                className={cn(
                  "mt-0.5 inline-flex w-fit items-center rounded-pill px-2 py-0.5 font-ui text-[0.66rem] font-medium",
                  c.personal
                    ? "border border-brand-blue-600/30 bg-brand-blue-600/10 text-brand-blue-600"
                    : "bg-surface-nested text-ink-muted",
                )}
              >
                {c.audience}
              </span>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}

/* ── Après le match ─────────────────────────────────────────────────────── */

const FAIT_META: Record<ParentFaitKind, { label: string; icon: LucideIcon }> = {
  but: { label: "But", icon: Goal },
  jaune: { label: "Carton jaune", icon: Square },
  rouge: { label: "Carton rouge", icon: Square },
  changement: { label: "Changement", icon: RefreshCw },
}

/**
 * Résumé — le "fil du match" de la page du club : notre côté à gauche en vert,
 * l'adversaire à droite en rouge, la minute au centre.
 */
function Resume({ event, enfant }: { event: ParentEvent; enfant: ParentEnfant }) {
  const info = event.match!
  const faits = info.faits ?? []
  const issue = issueOf(event)
  const nous = nousLabel(enfant)

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <SectionTitle>Fil du match</SectionTitle>
          <div className="flex items-center gap-4">
            <Legend tone="bg-team-home" label={nous} />
            <Legend tone="bg-team-away" label={info.adversaire} />
          </div>
        </div>

        {faits.length ? (
          <div className="flex flex-col gap-3 rounded-lg border border-border px-3 py-4 sm:px-5">
            {faits.map((fait) => (
              <FaitRow
                key={`${fait.minute}-${fait.label}`}
                fait={fait}
                enfantNom={enfant.nom}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-border">
            <EmptyState
              icon={Goal}
              title="Pas de détail sur ce match"
              description="Le club n'a pas saisi le déroulé de la rencontre."
            />
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <SectionTitle>Bilan de la rencontre</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-3">
          <Tile
            label="Score"
            value={`${info.butsPour ?? 0} – ${info.butsContre ?? 0}`}
            hint={info.domicile ? "À domicile" : "En déplacement"}
          />
          <Tile
            label="Issue"
            value={issue ? ISSUE_META[issue].label : "—"}
            hint={info.adversaire}
          />
          <Tile
            label="Compétition"
            value={info.competition}
            hint={longDay(event.date)}
          />
        </div>
      </section>
    </div>
  )
}

function Legend({ tone, label }: { tone: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 font-body text-[0.75rem] text-ink-muted">
      <span aria-hidden className={cn("size-2 rounded-full", tone)} />
      {label}
    </span>
  )
}

/** One line of the timeline — our side left, the opponent right. */
function FaitRow({
  fait,
  enfantNom,
}: {
  fait: ParentFaitDeMatch
  enfantNom: string
}) {
  const meta = FAIT_META[fait.kind]
  const Icon = meta.icon
  const mine = fait.label === enfantNom || fait.detail?.includes(enfantNom)
  const tone = fait.nous
    ? "border-team-home/30 text-team-home"
    : "border-team-away/30 text-team-away"

  const card = (
    <div
      className={cn(
        "flex min-w-0 flex-col gap-0.5 rounded-lg border px-3.5 py-2.5",
        fait.nous ? "border-team-home/25 sm:text-right" : "border-team-away/25",
        mine && "border-brand-blue-600/40",
      )}
    >
      <span className="font-ui text-[0.66rem] tracking-[0.08em] text-ink-muted uppercase">
        {meta.label}
      </span>
      <span className="truncate font-ui text-[0.88rem] text-ink">{fait.label}</span>
      {fait.detail ? (
        <span className="truncate font-body text-[0.76rem] text-ink-muted">
          {fait.detail}
        </span>
      ) : null}
    </div>
  )

  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-4">
      {fait.nous ? card : <span aria-hidden />}
      <span className="flex flex-col items-center gap-1">
        <span
          className={cn(
            "flex size-8 items-center justify-center rounded-full border bg-background",
            tone,
          )}
        >
          <Icon size={14} />
        </span>
        <span className="font-mono text-[0.7rem] text-ink-muted tabular-nums">
          {fait.minute}
        </span>
      </span>
      {fait.nous ? <span aria-hidden /> : card}
    </div>
  )
}

/**
 * Sa performance — la "feuille de match" : le bandeau rôle / minutes / note du
 * coach, puis la grille de statistiques de la page du club.
 */
function Performance({
  event,
  enfant,
}: {
  event: ParentEvent
  enfant: ParentEnfant
}) {
  const info = event.match!
  const stats = info.stats
  const prenom = enfant.nom.split(" ")[0]

  if (!info.joue) {
    return (
      <div className="flex flex-col gap-3">
        <SectionTitle>Sa feuille de match</SectionTitle>
        <div className="rounded-lg border border-border">
          <EmptyState
            icon={Timer}
            title={`${prenom} n'est pas entré en jeu`}
            description="Il était sur la feuille de match mais n'a pas joué ce jour-là."
          />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Bandeau — rôle, minutes, note du coach (comme "Mes stats" du club). */}
      <div className="flex flex-col gap-4 rounded-lg border border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div className="flex items-center gap-3.5">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-md bg-surface-nested text-ink-subtle">
            <Users size={20} />
          </span>
          <div className="min-w-0">
            <p className="font-ui text-[0.95rem] font-medium text-ink">
              {info.titulaire ? "Titulaire" : "Entré en jeu"} ·{" "}
              {info.poste ?? enfant.posteLabel}
            </p>
            <p className="mt-0.5 font-body text-[0.82rem] text-ink-muted">
              {info.minutes ?? 0} minutes jouées
            </p>
          </div>
        </div>

        {info.note ? (
          <div className="flex items-center gap-2.5 rounded-md border border-info/30 px-4 py-2.5">
            <Star size={16} className="shrink-0 text-info" />
            <span className="font-display text-xl font-semibold text-ink">
              {info.note}
              <span className="ml-0.5 font-body text-[0.78rem] text-ink-muted">
                /10
              </span>
            </span>
            <span className="font-ui text-[0.64rem] tracking-[0.08em] text-ink-muted uppercase">
              Note du coach
            </span>
          </div>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCell icon={Timer} value={`${info.minutes ?? 0}'`} label="Minutes jouées" />
        <StatCell icon={Goal} value={info.buts ?? 0} label="Buts" />
        <StatCell icon={Users} value={info.passes ?? 0} label="Passes déc." />
        <StatCell
          icon={Target}
          value={stats ? `${stats.tirs} (${stats.tirsCadres})` : "—"}
          label="Tirs (cadrés)"
        />
        <StatCell
          icon={Percent}
          value={stats ? `${stats.passes} · ${stats.precisionPasses}%` : "—"}
          label="Passes réussies"
        />
        <StatCell
          icon={Shield}
          value={stats ? stats.ballonsRecuperes : "—"}
          label="Ballons récupérés"
        />
        <StatCell
          icon={Swords}
          value={stats ? `${stats.duelsGagnes}/${stats.duelsTotal}` : "—"}
          label="Duels gagnés"
        />
        <StatCell
          icon={Square}
          value={stats ? `${stats.jaunes}/${stats.rouges}` : "—"}
          label="Cartons (J/R)"
        />
      </div>

      {stats ? null : (
        <p className="font-body text-[0.8rem] text-ink-disabled">
          Le club n'a saisi que la ligne principale pour ce match.
        </p>
      )}
    </div>
  )
}

function StatCell({
  icon: Icon,
  value,
  label,
}: {
  icon: LucideIcon
  value: React.ReactNode
  label: string
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border px-4 py-4">
      <span className="flex size-8 items-center justify-center rounded-md bg-surface-nested text-ink-muted">
        <Icon size={15} />
      </span>
      <div className="flex flex-col gap-1">
        <span className="font-display text-[1.4rem] leading-none font-semibold text-ink">
          {value}
        </span>
        <span className="font-ui text-[0.66rem] tracking-[0.08em] text-ink-muted uppercase">
          {label}
        </span>
      </div>
    </div>
  )
}

/**
 * Évaluation — la grille que l'éducateur a remplie après la rencontre, dans le
 * même modèle que le back-office (Carte Joueur & Groupe : PHY, PAS, VIT, DRI,
 * DEF, TIR sur 100, plus le critère de groupe hors carte). Le mot écrit ferme
 * l'onglet : c'est lui qu'on relit, pas les chiffres.
 */
function Evaluation({
  event,
  enfant,
  onDocument,
}: {
  event: ParentEvent
  enfant: ParentEnfant
  onDocument: (nom: string) => void
}) {
  const evaluation = event.match?.evaluation
  const commentaire = event.match?.commentaire

  return (
    <div className="flex flex-col gap-6">
      {evaluation ? (
        <section className="flex flex-col gap-4">
          <SectionTitle>Évaluation du club</SectionTitle>
          <EvaluationGrille
            evaluation={evaluation}
            enfant={enfant}
            onDocument={onDocument}
          />
        </section>
      ) : (
        <div className="rounded-lg border border-border">
          <EmptyState
            icon={Star}
            title="Évaluation non publiée"
            description={
              event.match?.joue
                ? "L'éducateur remplit la grille dans les jours qui suivent le match."
                : `${enfant.nom.split(" ")[0]} n'étant pas entré en jeu, aucune note n'a été saisie pour cette rencontre.`
            }
          />
        </div>
      )}

      {commentaire ? (
        <section className="flex flex-col gap-3">
          <SectionTitle>Le mot de l'éducateur</SectionTitle>
          <div className="flex flex-col gap-4 rounded-lg border border-border px-4 py-4">
            <div className="flex gap-3">
              <MessageSquareQuote
                size={18}
                className="mt-0.5 shrink-0 text-ink-muted"
              />
              <p className="font-body text-[0.9rem] leading-relaxed text-ink-subtle">
                {commentaire}
              </p>
            </div>
            <div className="flex items-center gap-2.5 border-t border-border pt-3">
              <Avatar name={enfant.educateur} size="sm" />
              <div className="min-w-0">
                <p className="truncate font-ui text-[0.82rem] text-ink">
                  {enfant.educateur}
                </p>
                <p className="font-body text-[0.74rem] text-ink-muted">
                  Éducateur {enfant.categorie}
                </p>
              </div>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  )
}

/* ── Small shared bits ──────────────────────────────────────────────────── */

function Tile({
  label,
  value,
  hint,
}: {
  label: string
  value: React.ReactNode
  hint: string
}) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border px-5 py-[1.1rem]">
      <span className="font-display text-[1.75rem] leading-none font-semibold text-ink">
        {value}
      </span>
      <div className="flex flex-col gap-1">
        <span className="font-body text-[0.76rem] text-ink-muted">{hint}</span>
        <span className="font-ui text-[0.7rem] tracking-[0.08em] text-ink-muted uppercase">
          {label}
        </span>
      </div>
    </div>
  )
}
