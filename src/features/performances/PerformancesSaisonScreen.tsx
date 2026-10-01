import { useMemo, useState, type ReactNode } from "react"
import { Navigate, useNavigate, useParams } from "react-router-dom"
import {
  AlertTriangle,
  CalendarDays,
  ChevronRight,
  ClipboardList,
  FileQuestion,
  Plus,
  Search,
  Send,
  User,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { useData } from "@/data/useData"
import type { Questionnaire } from "@/data/seed/performances"
import { PageHeader } from "@/components/kit/PageHeader"
import { BackButton } from "@/components/kit/BackButton"
import { Badge } from "@/components/kit/Badge"
import { EmptyState } from "@/components/kit/EmptyState"
import { Toast } from "@/components/kit/Toast"
import { Button } from "@/components/ui/button"
import { Bar, Segmented, Stat } from "@/features/budget/ui"
import { pluriel } from "@/features/pole-technique/categorieUi"
import { saisonDepuisSlug } from "@/features/pole-technique/programmationRoutes"
import {
  RACINE_PERFORMANCES,
  cheminModele,
  cheminQuestionnaire,
} from "@/features/performances/performancesRoutes"
import {
  CreerModeleModal,
  LancerQuestionnaireModal,
} from "@/features/performances/performancesUi"
import {
  bilan,
  dateLongue,
  useToastPerf,
} from "@/features/performances/performancesHelpers"

type Filtre = "tous" | "ouvert" | "clos"

/**
 * Performances — step 2: one saison. The staff comes here to launch a
 * questionnaire or follow one in flight, so the questionnaires lead (with the
 * one primary action) and the modèles sit below as the library they draw on.
 */
export function PerformancesSaisonScreen() {
  const { saison: slug = "" } = useParams()
  const { saisons } = useData()
  const saison = saisonDepuisSlug(slug, saisons)
  if (!saison) return <Navigate to={RACINE_PERFORMANCES} replace />
  return <Contenu saison={saison} />
}

function Contenu({ saison }: { saison: string }) {
  const navigate = useNavigate()
  const { questionnaires, modelesQuestionnaire, categories } = useData()
  const { toast } = useToastPerf()
  const [lancerOpen, setLancerOpen] = useState(false)
  const [creerOpen, setCreerOpen] = useState(false)
  const [filtre, setFiltre] = useState<Filtre>("tous")
  const [q, setQ] = useState("")
  const [qModele, setQModele] = useState("")

  const lignes = useMemo(
    () =>
      questionnaires
        .filter((x) => x.saison === saison)
        .map((x) => ({ q: x, ...bilan(x, categories) })),
    [questionnaires, saison, categories],
  )

  const visibles = lignes.filter(
    ({ q: x }) =>
      (filtre === "tous" || x.statut === filtre) &&
      x.nom.toLowerCase().includes(q.trim().toLowerCase()),
  )

  const ouverts = lignes.filter((l) => l.q.statut === "ouvert")
  const recues = lignes.reduce((n, l) => n + l.recues, 0)
  const attendues = lignes.reduce((n, l) => n + l.attendues, 0)
  const alertes = ouverts.reduce((n, l) => n + l.alertes, 0)

  const utilisations = (modeleId: string) =>
    questionnaires.filter((x) => x.modeleId === modeleId).length
  const modeles = modelesQuestionnaire.filter((m) =>
    m.nom.toLowerCase().includes(qModele.trim().toLowerCase()),
  )

  return (
    <div className="flex flex-col gap-8">
      <div>
        <BackButton to={RACINE_PERFORMANCES} label="Performances" />
        <PageHeader
          title="Questionnaires"
          subtitle={`Saison ${saison}`}
          actions={
            <Button
              onClick={() => setLancerOpen(true)}
              disabled={!modelesQuestionnaire.length}
            >
              <Send /> Lancer un questionnaire
            </Button>
          }
        />
      </div>

      {lignes.length ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <Stat
            label="En cours"
            value={ouverts.length}
            delta={`${pluriel(lignes.length, "questionnaire")} cette saison`}
          />
          <Stat
            label="Taux de réponse"
            value={attendues ? `${Math.round((recues / attendues) * 100)} %` : "—"}
            delta={`${recues} réponses sur ${attendues} attendues`}
          />
          <Stat
            label="Joueurs en alerte"
            value={alertes}
            tone={alertes ? "negative" : undefined}
            delta={
              alertes
                ? "Dans les questionnaires en cours"
                : "Aucune alerte en cours"
            }
          />
        </div>
      ) : null}

      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Recherche
            value={q}
            onChange={setQ}
            placeholder="Rechercher un questionnaire…"
          />
          <Segmented
            value={filtre}
            onChange={setFiltre}
            options={[
              { value: "tous", label: "Tous", badge: lignes.length },
              { value: "ouvert", label: "En cours", badge: ouverts.length },
              {
                value: "clos",
                label: "Clos",
                badge: lignes.length - ouverts.length,
              },
            ]}
          />
        </div>

        {visibles.length ? (
          <div className="flex flex-col gap-2.5">
            {visibles.map((l) => (
              <LigneQuestionnaire
                key={l.q.id}
                q={l.q}
                recues={l.recues}
                attendues={l.attendues}
                alertes={l.alertes}
                categorie={
                  categories.find((c) => c.id === l.q.categorieId)?.nom ?? "—"
                }
                groupe={
                  categories
                    .find((c) => c.id === l.q.categorieId)
                    ?.groupes.find((g) => g.id === l.q.groupeId)?.nom
                }
                onOpen={() => navigate(cheminQuestionnaire(saison, l.q.id))}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border">
            {lignes.length ? (
              <EmptyState
                icon={Search}
                title="Aucun questionnaire ne correspond"
                description="Changez le filtre ou la recherche."
              />
            ) : (
              <EmptyState
                icon={FileQuestion}
                title="Aucun questionnaire cette saison"
                description="Lancez un modèle pour une catégorie : les joueurs y répondent, vous suivez leur état de forme ici."
                action={
                  modelesQuestionnaire.length ? (
                    <Button variant="outline" onClick={() => setLancerOpen(true)}>
                      <Send /> Lancer le premier
                    </Button>
                  ) : null
                }
              />
            )}
          </div>
        )}
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-1">
            <h2 className="font-ui text-lg font-medium text-ink">Modèles</h2>
            <p className="font-body text-sm text-ink-muted">
              Échelle, questions et analyse des scores — réutilisables chaque
              saison.
            </p>
          </div>
          <Button variant="outline" onClick={() => setCreerOpen(true)}>
            <Plus /> Nouveau modèle
          </Button>
        </div>

        {modelesQuestionnaire.length > 3 ? (
          <Recherche
            value={qModele}
            onChange={setQModele}
            placeholder="Rechercher un modèle…"
          />
        ) : null}

        {modeles.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {modeles.map((m) => (
              <CarteModele
                key={m.id}
                onOpen={() => navigate(cheminModele(saison, m.id))}
                nom={m.nom}
                infos={[
                  pluriel(m.questions.length, "question"),
                  `Échelle ${m.echelle.min} → ${m.echelle.max}`,
                ]}
                creeLe={dateLongue(m.creeLe)}
                auteur={m.auteur}
                utilisations={utilisations(m.id)}
                sansAnalyse={m.intervalles.length === 0}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border">
            <EmptyState
              icon={ClipboardList}
              title={
                modelesQuestionnaire.length
                  ? "Aucun modèle ne correspond"
                  : "Aucun modèle"
              }
              description={
                modelesQuestionnaire.length
                  ? undefined
                  : "Créez un modèle pour pouvoir lancer un questionnaire."
              }
            />
          </div>
        )}
      </section>

      <LancerQuestionnaireModal
        open={lancerOpen}
        onOpenChange={setLancerOpen}
        saison={saison}
      />
      <CreerModeleModal
        open={creerOpen}
        onOpenChange={setCreerOpen}
        saison={saison}
      />
      <Toast toast={toast} />
    </div>
  )
}

/* ── Pieces ──────────────────────────────────────────────────────────────── */

function Recherche({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
}) {
  return (
    <label className="relative block flex-1">
      <Search
        size={15}
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-disabled"
      />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="w-full rounded-md border border-input bg-transparent py-2.5 pr-3.5 pl-10 font-body text-sm text-ink outline-none transition-colors placeholder:text-ink-disabled focus:border-border-focus"
      />
    </label>
  )
}

/** Navigable row: identity left, progress + status right (stacks on a phone). */
function LigneQuestionnaire({
  q,
  categorie,
  groupe,
  recues,
  attendues,
  alertes,
  onOpen,
}: {
  q: Questionnaire
  categorie: string
  groupe?: string
  recues: number
  attendues: number
  alertes: number
  onOpen: () => void
}) {
  return (
    <FluidButton onOpen={onOpen}>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="truncate font-ui text-[0.95rem] font-medium text-ink transition-colors group-hover:text-brand-blue-600">
            {q.nom}
          </span>
          {q.statut === "ouvert" ? (
            <Badge variant="info" dot>
              En cours
            </Badge>
          ) : (
            <Badge>Clos</Badge>
          )}
          {alertes ? (
            <Badge variant="danger">
              <AlertTriangle size={11} /> {alertes} en alerte
            </Badge>
          ) : null}
        </span>
        <span className="flex flex-wrap items-center gap-x-3 gap-y-1 font-body text-[0.78rem] text-ink-muted">
          <span>{q.modele.nom}</span>
          <span className="text-ink-disabled">·</span>
          <span>
            {categorie}
            {groupe ? ` · ${groupe}` : ""}
          </span>
          <span className="text-ink-disabled">·</span>
          <span className="inline-flex items-center gap-1">
            <CalendarDays size={12} /> {dateLongue(q.lanceLe)}
          </span>
        </span>
      </span>

      <span className="flex w-full flex-col gap-1.5 sm:w-44">
        <span className="flex items-baseline justify-between font-ui text-[0.74rem] text-ink-muted">
          <span>Réponses</span>
          <span className="text-ink">
            {recues}
            <span className="text-ink-disabled"> / {attendues}</span>
          </span>
        </span>
        <Bar sm value={attendues ? (recues / attendues) * 100 : 0} />
      </span>

      <ChevronRight
        size={15}
        className="hidden shrink-0 text-ink-disabled transition-colors group-hover:text-brand-blue-600 sm:block"
      />
    </FluidButton>
  )
}

function CarteModele({
  nom,
  infos,
  creeLe,
  auteur,
  utilisations,
  sansAnalyse,
  onOpen,
}: {
  nom: string
  infos: string[]
  creeLe: string
  auteur: string
  utilisations: number
  sansAnalyse: boolean
  onOpen: () => void
}) {
  return (
    <FluidButton onOpen={onOpen} colonne>
      <span className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-md border border-border bg-surface-nested text-ink-muted transition-colors group-hover:text-brand-blue-600">
          <ClipboardList size={17} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-ui text-[0.95rem] font-medium text-ink transition-colors group-hover:text-brand-blue-600">
            {nom}
          </span>
          <span className="block truncate font-body text-[0.76rem] text-ink-muted">
            {infos.join(" · ")}
          </span>
        </span>
      </span>
      <span className="flex flex-wrap items-center gap-2">
        <span className="rounded-pill border border-border px-2.5 py-0.5 font-body text-[0.72rem] text-ink-muted">
          {utilisations
            ? `Utilisé ${utilisations} fois`
            : "Jamais utilisé"}
        </span>
        {sansAnalyse ? (
          <span className="rounded-pill border border-border px-2.5 py-0.5 font-body text-[0.72rem] text-ink-disabled">
            Sans analyse des scores
          </span>
        ) : null}
      </span>
      <span className="flex items-center justify-between gap-3 border-t border-border pt-3 font-body text-[0.74rem] text-ink-disabled">
        <span className="inline-flex min-w-0 items-center gap-1.5">
          <User size={12} className="shrink-0" />
          <span className="truncate">{auteur}</span>
        </span>
        <span className="shrink-0">{creeLe}</span>
      </span>
    </FluidButton>
  )
}

/** Navigable card (design-system "Card anatomy"): fluid surface fill on hover. */
function FluidButton({
  onOpen,
  children,
  colonne = false,
}: {
  onOpen: () => void
  children: ReactNode
  colonne?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group relative overflow-hidden rounded-lg border border-border bg-background text-left transition-colors hover:border-border-strong"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 origin-top scale-y-0 bg-surface transition-transform duration-[260ms] ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:scale-y-100"
      />
      <span
        className={cn(
          "relative z-10 flex gap-3.5 p-4",
          colonne
            ? "h-full flex-col"
            : "flex-col sm:flex-row sm:items-center sm:gap-6",
        )}
      >
        {children}
      </span>
    </button>
  )
}
