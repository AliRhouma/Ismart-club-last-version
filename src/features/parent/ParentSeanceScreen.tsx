import { Link, useParams, useSearchParams } from "react-router-dom"
import {
  CalendarDays,
  ClipboardList,
  Clock,
  Dumbbell,
  ListChecks,
  MapPin,
  MessageSquareQuote,
  RefreshCw,
  Repeat,
  Shirt,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { todayISO } from "@/lib/format"
import { useData } from "@/data/useData"
import {
  PROCEDE_SCHEMAS,
  fallbackSeanceInfo,
  type ParentEnfant,
  type ParentEvaluation,
  type ParentEvent,
  type ParentProcede,
} from "@/data/seed/parent"
import { BackButton } from "@/components/kit/BackButton"
import { EmptyState } from "@/components/kit/EmptyState"
import { Toast, useToast } from "@/components/kit/Toast"
import { AdBanner } from "@/features/planification/AdBanner"
import { EvaluationGrille } from "@/features/parent/EvaluationGrille"
import { TYPE_META } from "@/features/planification/eventMeta"
import {
  EnfantBanner,
  ReponseControl,
  TypeTile,
  longDay,
  parentPlanningPath,
} from "@/features/parent/shared"

/**
 * Espace parent — fiche d'une séance (ou d'une réunion parents).
 *
 * Same page architecture as the club's own SeanceScreen (back arrow → header
 * card → sponsor banner → pill tabs → content), but read-only: a parent has no
 * convocation builder, only the programme his child will follow, the practical
 * details he has to prepare, and the one control he owns — Présent / Absent.
 */

type Tab = { value: string; label: string }

export function ParentSeanceScreen() {
  const { id, tab } = useParams()
  const { parentEvents, parentEnfants } = useData()
  const { toast, notify } = useToast()

  const event = parentEvents.find((e) => e.id === id)
  const enfant = event
    ? parentEnfants.find((c) => c.id === event.enfantId)
    : undefined

  if (!event || !enfant || event.type === "match") {
    return (
      <div className="mx-auto max-w-5xl">
        <BackButton to="/parent" label="Retour à mes enfants" />
        <EmptyState
          icon={Dumbbell}
          title="Rendez-vous introuvable"
          description="Ce rendez-vous n'existe pas ou a été retiré du calendrier du club."
        />
      </div>
    )
  }

  const reunion = event.type === "reunion"
  const past = event.date < todayISO()
  const seance = event.seance ?? fallbackSeanceInfo(event, enfant)
  const bilan = reunion ? event.reunion?.compteRendu : seance.bilan
  const evaluation = reunion ? undefined : seance.evaluation

  const tabs: Tab[] = [
    // Une séance s'ouvre sur son procédé — c'est le contenu, pas un résumé.
    // Une réunion n'en a pas : elle garde son ordre du jour.
    reunion
      ? { value: "programme", label: "Ordre du jour" }
      : { value: "procede", label: "Procédé" },
    { value: "infos", label: "Infos pratiques" },
    ...(past && (bilan || evaluation)
      ? [
          {
            value: "evaluation",
            label: reunion ? "Compte rendu" : "Évaluation",
          },
        ]
      : []),
  ]
  const active = tabs.some((t) => t.value === tab) ? tab! : tabs[0].value

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <BackButton
        to={parentPlanningPath(enfant.id)}
        label={`Retour au calendrier de ${enfant.nom.split(" ")[0]}`}
      />

      <EnfantBanner enfant={enfant} sub="planification" />

      <FicheHeader
        event={event}
        enfant={enfant}
        past={past}
        onAnswer={(r) =>
          notify(
            r === "present"
              ? `Présence confirmée — ${event.title}`
              : `Absence signalée — ${event.title}`,
          )
        }
      />

      <AdBanner />

      <TabBar event={event} tabs={tabs} active={active} />

      {active === "programme" ? (
        <OrdreDuJour event={event} />
      ) : active === "procede" ? (
        <ProcedeTab objectifs={seance.objectifs} procedes={seance.procedes} />
      ) : active === "infos" ? (
        <InfosPratiques event={event} enfant={enfant} reunion={reunion} />
      ) : (
        <EvaluationTab
          evaluation={evaluation}
          bilan={bilan ?? ""}
          enfant={enfant}
          reunion={reunion}
          onDocument={(nom) => notify(`Document ouvert — ${nom}`)}
        />
      )}

      <Toast toast={toast} />
    </div>
  )
}

/* ── Header ─────────────────────────────────────────────────────────────── */

function FicheHeader({
  event,
  enfant,
  past,
  onAnswer,
}: {
  event: ParentEvent
  enfant: ParentEnfant
  past: boolean
  onAnswer: (reponse: string) => void
}) {
  const meta = TYPE_META[event.type]
  const prenom = enfant.nom.split(" ")[0]

  return (
    <header className="flex flex-col gap-5 rounded-lg border border-border p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3 sm:gap-4">
          <TypeTile type={event.type} />
          <div className="min-w-0">
            <p className="font-ui text-[0.7rem] font-medium tracking-[0.1em] text-ink-disabled uppercase">
              {meta.label} · {event.categorie}
            </p>
            <h1 className="mt-1 font-ui text-xl font-semibold tracking-normal text-ink sm:text-2xl">
              {event.title}
            </h1>
            {event.detail ? (
              <p className="mt-1.5 font-body text-[0.88rem] text-ink-subtle">
                {event.detail}
              </p>
            ) : null}
          </div>
        </div>

        <span
          className={cn(
            "shrink-0 rounded-pill border px-3 py-1 font-ui text-[0.72rem] font-medium",
            past
              ? "border-success/30 bg-success/10 text-success"
              : "border-brand-blue-600/30 bg-brand-blue-600/10 text-brand-blue-600",
          )}
        >
          {past ? "Terminé" : "À venir"}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 border-t border-border pt-5 sm:grid-cols-4">
        <InfoField
          icon={CalendarDays}
          label="Date"
          value={longDay(event.date)}
        />
        <InfoField
          icon={Clock}
          label="Horaire"
          value={`${event.start}${event.end ? ` – ${event.end}` : ""}`}
        />
        <InfoField
          icon={event.type === "reunion" ? Users : UserCog}
          label={event.type === "reunion" ? "Animée par" : "Éducateur"}
          value={
            event.type === "reunion"
              ? (event.reunion?.anime ?? enfant.educateur)
              : (event.seance?.educateur ?? enfant.educateur)
          }
        />
        {event.location ? (
          <InfoField icon={MapPin} label="Lieu" value={event.location} />
        ) : null}
      </div>

      {/* The one thing a parent does on this page. */}
      <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-body text-[0.82rem] text-ink-muted">
          {past
            ? "Présence enregistrée par le club."
            : event.reponse === "attente"
              ? "Le club attend votre réponse."
              : event.reponse === "present"
                ? `Vous avez confirmé la présence de ${prenom}.`
                : `Vous avez signalé l'absence de ${prenom}.`}
        </p>
        <ReponseControl event={event} onDone={onAnswer} />
      </div>
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
    <div className="flex min-w-0 flex-col gap-1">
      <span className="inline-flex items-center gap-1.5 font-ui text-[0.68rem] tracking-[0.08em] text-ink-muted uppercase">
        <Icon size={13} className="shrink-0" />
        {label}
      </span>
      <span className="truncate font-body text-[0.86rem] text-ink">
        {value}
      </span>
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
              to={`/parent/${event.enfantId}/planification/${event.type}/${event.id}/${t.value}`}
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

/* ── Titre de section partagé ────────────────────────────────────────────── */

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="font-ui text-[0.72rem] font-medium tracking-[0.08em] text-ink-muted uppercase">
      {children}
    </h2>
  )
}

/* ── Procédé — le détail de l'exercice, tel que le club le lit ──────────── */

/**
 * La même page Procédé que la fiche du club (`planification/SeanceScreen`) :
 * la liste ordonnée des procédés à gauche, le détail du procédé choisi à
 * droite. Un parent n'a rien à y modifier — il lit ce que l'éducateur a
 * publié : l'objectif, l'organisation, les consignes et le schéma.
 * Le procédé ouvert est dans l'URL (`?p=1`), pour que le déroulé du
 * Programme puisse pointer directement sur le bon exercice.
 */
function ProcedeTab({
  objectifs,
  procedes,
}: {
  objectifs: string[]
  procedes: ParentProcede[]
}) {
  const [params, setParams] = useSearchParams()
  const raw = Number(params.get("p"))
  const index = Number.isInteger(raw)
    ? Math.min(Math.max(raw, 0), procedes.length - 1)
    : 0
  const active = procedes[index]

  const select = (i: number) => {
    const next = new URLSearchParams(params)
    next.set("p", String(i))
    setParams(next, { replace: true })
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Ce que la séance vise — la lecture d'ensemble avant le détail. */}
      {objectifs.length ? (
        <section className="flex flex-col gap-3">
          <SectionTitle>Ce qu'ils vont travailler</SectionTitle>
          <ul className="flex flex-col overflow-hidden rounded-lg border border-border">
            {objectifs.map((objectif, i) => (
              <li
                key={objectif}
                className={cn(
                  "flex items-center gap-3 px-4 py-3",
                  i > 0 && "border-t border-border",
                )}
              >
                <ListChecks
                  size={15}
                  className="shrink-0 text-brand-blue-600"
                />
                <span className="font-body text-[0.88rem] text-ink">
                  {objectif}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {!active ? (
        <div className="rounded-lg border border-border">
          <EmptyState
            icon={ClipboardList}
            title="Déroulé à venir"
            description="Le programme détaillé est publié la veille de la séance."
          />
        </div>
      ) : (
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-6">
          {/* Left nav — les procédés dans l'ordre de la séance. */}
          <nav className="lg:sticky lg:top-6 lg:w-64 lg:shrink-0">
            <p className="mb-2 px-1 font-ui text-[0.66rem] font-medium tracking-[0.1em] text-ink-disabled uppercase">
              Procédés · {procedes.length}
            </p>
            {/* Scroller horizontal sur mobile, liste verticale à partir de lg. */}
            <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 lg:mx-0 lg:flex-col lg:gap-1 lg:px-0 lg:pb-0">
              {procedes.map((procede, i) => {
                const on = i === index
                return (
                  <button
                    key={procede.nom}
                    type="button"
                    onClick={() => select(i)}
                    aria-current={on ? "true" : undefined}
                    className={cn(
                      "flex shrink-0 items-center gap-2.5 rounded-md border px-3 py-2.5 text-left transition-colors lg:w-full",
                      on
                        ? "border-border-strong bg-surface-nested"
                        : "border-border text-ink-muted hover:border-border-strong hover:text-ink",
                    )}
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
                          on ? "font-medium text-ink" : "",
                        )}
                      >
                        {procede.nom}
                      </span>
                      <span className="block font-ui text-[0.68rem] text-ink-disabled">
                        {procede.theme} · {procede.duree}
                      </span>
                    </span>
                  </button>
                )
              })}
            </div>
          </nav>

          <div className="min-w-0 flex-1">
            <ProcedeContent procede={active} />
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Chaque procédé porte un schéma. Celui que l'éducateur a publié s'il existe,
 * sinon un schéma de la bibliothèque tactique du club — pioché par le nom de
 * l'exercice, donc stable d'un rendu à l'autre (jamais Math.random() en plein
 * render, qui changerait l'image à chaque frappe).
 */
function schemaDe(procede: ParentProcede): string {
  if (procede.image) return procede.image
  let h = 0
  for (const c of procede.nom) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return PROCEDE_SCHEMAS[h % PROCEDE_SCHEMAS.length]
}

function ProcedeContent({ procede }: { procede: ParentProcede }) {
  const schema = schemaDe(procede)
  return (
    <article className="flex flex-col gap-6 rounded-lg border border-border p-4 sm:p-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2.5">
          <h2 className="font-ui text-xl font-medium text-ink">
            {procede.nom}
          </h2>
          {procede.fifaCard ? (
            <span className="rounded-pill border border-brand-blue-600/30 bg-brand-blue-600/10 px-2.5 py-0.5 font-ui text-[0.7rem] font-medium tracking-wide text-brand-blue-600">
              FIFA CARD · {procede.fifaCard}
            </span>
          ) : null}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <MetaTile icon={Clock} label="Durée" value={procede.duree} />
          <MetaTile
            icon={Repeat}
            label="Séquence"
            value={procede.sequence ?? "—"}
          />
          <MetaTile
            icon={RefreshCw}
            label="Récupération"
            value={procede.recuperation ? `${procede.recuperation} s` : "—"}
          />
        </div>
      </div>

      <figure className="overflow-hidden rounded-lg border border-border bg-surface-nested">
        <img
          src={schema}
          alt={`Schéma du procédé ${procede.nom}`}
          loading="lazy"
          className="mx-auto max-h-[420px] w-full object-contain"
        />
      </figure>

      {procede.blocks?.length ? (
        <div className="flex flex-col gap-6">
          {procede.blocks.map((block, i) => (
            <BlockView key={i} block={block} />
          ))}
        </div>
      ) : (
        /* Le déroulé est publié, le détail ne l'est pas encore. */
        <div className="rounded-lg border border-border">
          <EmptyState
            icon={ClipboardList}
            title="Détail non publié"
            description="L'éducateur n'a pas encore détaillé cet exercice. Le thème et la durée ci-dessus restent valables."
          />
        </div>
      )}
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

/** Un bloc de contenu du procédé — même rendu que la fiche du club. */
function BlockView({
  block,
}: {
  block: NonNullable<ParentProcede["blocks"]>[number]
}) {
  return (
    <section className="flex flex-col gap-2.5">
      <h3 className="flex items-center gap-2 font-ui text-[0.8rem] font-medium tracking-[0.04em] text-ink-subtle uppercase">
        <span
          className="h-3.5 w-1 rounded-full bg-brand-blue-600"
          aria-hidden
        />
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
                  className="border-b border-border transition-colors last:border-b-0 hover:bg-surface-hover"
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

/* ── Ordre du jour (réunion) ────────────────────────────────────────────── */

function OrdreDuJour({ event }: { event: ParentEvent }) {
  const points = event.reunion?.ordreDuJour ?? []

  return (
    <div className="flex flex-col gap-3">
      <SectionTitle>Ordre du jour</SectionTitle>
      {points.length ? (
        <ol className="flex flex-col overflow-hidden rounded-lg border border-border">
          {points.map((point, i) => (
            <li
              key={point}
              className={cn(
                "flex items-center gap-4 px-4 py-3.5",
                i > 0 && "border-t border-border",
              )}
            >
              <span className="flex size-7 shrink-0 items-center justify-center rounded-md border border-border font-ui text-[0.72rem] text-ink-muted tabular-nums">
                {i + 1}
              </span>
              <span className="font-body text-[0.88rem] text-ink">{point}</span>
            </li>
          ))}
        </ol>
      ) : (
        <div className="rounded-lg border border-border">
          <EmptyState
            icon={ListChecks}
            title="Ordre du jour à venir"
            description="Le club le publiera avant la réunion."
          />
        </div>
      )}

      {event.reunion?.enfantAttendu ? (
        <p className="font-body text-[0.8rem] text-ink-muted">
          Cette réunion se tient en présence des enfants.
        </p>
      ) : (
        <p className="font-body text-[0.8rem] text-ink-disabled">
          Réunion réservée aux familles — les enfants ne sont pas attendus.
        </p>
      )}
    </div>
  )
}

/* ── Infos pratiques ────────────────────────────────────────────────────── */

function InfosPratiques({
  event,
  enfant,
  reunion,
}: {
  event: ParentEvent
  enfant: ParentEnfant
  reunion: boolean
}) {
  const seance = event.seance ?? fallbackSeanceInfo(event, enfant)

  return (
    <div className="flex flex-col gap-4">
      <SectionTitle>À prévoir</SectionTitle>
      <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field
          icon={Clock}
          label="Rendez-vous"
          value={`${event.start}${event.end ? ` – ${event.end}` : ""}`}
        />
        <Field
          icon={MapPin}
          label="Lieu"
          value={event.location ?? "Communiqué par l'éducateur"}
        />
        {reunion ? (
          <Field
            icon={Users}
            label="Animée par"
            value={event.reunion?.anime ?? enfant.educateur}
          />
        ) : (
          <>
            <Field icon={Shirt} label="Tenue" value={seance.tenue} />
            <Field icon={UserCog} label="Éducateur" value={seance.educateur} />
            <Field
              icon={Users}
              label="Groupe"
              value={`${enfant.categorie} · ${enfant.groupe}`}
            />
          </>
        )}
      </dl>
      <p className="font-body text-[0.8rem] text-ink-disabled">
        Un empêchement de dernière minute ? Répondez « Absent » sur cette fiche
        : l'éducateur le voit immédiatement.
      </p>
    </div>
  )
}

function Field({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon
  label: string
  value: string
}) {
  return (
    <div className="flex flex-col gap-1.5 rounded-lg border border-border px-4 py-3.5">
      <dt className="inline-flex items-center gap-1.5 font-ui text-[0.68rem] tracking-[0.08em] text-ink-muted uppercase">
        <Icon size={13} className="shrink-0" />
        {label}
      </dt>
      <dd className="font-body text-[0.88rem] text-ink">{value}</dd>
    </div>
  )
}

/* ── Évaluation / compte rendu ──────────────────────────────────────────── */

/**
 * Ce que le club a noté après la séance. La grille elle-même est partagée avec
 * la fiche de match (EvaluationGrille) : le back-office édite le modèle, la
 * famille en lit le résultat. Le mot écrit ferme la page — c'est lui qu'on
 * relit, pas les chiffres.
 */
function EvaluationTab({
  evaluation,
  bilan,
  enfant,
  reunion,
  onDocument,
}: {
  evaluation?: ParentEvaluation
  bilan: string
  enfant: ParentEnfant
  reunion: boolean
  onDocument: (nom: string) => void
}) {
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
      ) : null}

      {bilan ? (
        <section className="flex flex-col gap-3">
          <SectionTitle>
            {reunion ? "Compte rendu" : "Le mot de l'éducateur"}
          </SectionTitle>
          <div className="flex gap-3 rounded-lg border border-border px-4 py-4">
            <MessageSquareQuote
              size={18}
              className="mt-0.5 shrink-0 text-ink-muted"
            />
            <p className="font-body text-[0.9rem] leading-relaxed text-ink-subtle">
              {bilan}
            </p>
          </div>
        </section>
      ) : null}
    </div>
  )
}
