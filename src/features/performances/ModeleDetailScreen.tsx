import { useState, type ReactNode } from "react"
import { Navigate, useNavigate, useParams } from "react-router-dom"
import { Globe, Lock, Pencil, Send, Settings2, Share2, Trash2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { useData } from "@/data/useData"
import {
  bornesTotal,
  valeursEchelle,
  type IntervalleScore,
  type ModeleQuestionnaire,
} from "@/data/seed/performances"
import { PageHeader } from "@/components/kit/PageHeader"
import { BackButton } from "@/components/kit/BackButton"
import { Badge } from "@/components/kit/Badge"
import { ConfirmDialog } from "@/components/kit/ConfirmDialog"
import { EmptyState } from "@/components/kit/EmptyState"
import { Toast } from "@/components/kit/Toast"
import { Button } from "@/components/ui/button"
import { pluriel } from "@/features/pole-technique/categorieUi"
import { saisonDepuisSlug } from "@/features/pole-technique/programmationRoutes"
import { CommunauteModal } from "@/features/pole-technique/ProgrammeActions"
import {
  RACINE_PERFORMANCES,
  cheminModeleEdition,
  cheminSaisonPerf,
} from "@/features/performances/performancesRoutes"
import {
  EchelleSaisie,
  LancerQuestionnaireModal,
} from "@/features/performances/performancesUi"
import {
  TON_FOND,
  TON_LIBELLE,
  TON_VARIANT,
  dateLongue,
  overlineCls,
  useToastPerf,
  RESSOURCES_MODELE,
} from "@/features/performances/performancesHelpers"

const PORTEE_LIBELLE = {
  prive: { icon: Lock, label: "Privé" },
  partenaires: { icon: Globe, label: "Partagé avec les partenaires" },
  personnalise: { icon: Settings2, label: "Partage personnalisé" },
} as const

/**
 * One modèle, read-only: what a joueur will be asked, on which échelle, and
 * how his total gets read. "Utiliser ce modèle" is the one primary action;
 * share / edit / delete sit beside it as quiet icon buttons.
 */
export function ModeleDetailScreen() {
  const { saison: slug = "", id = "" } = useParams()
  const { saisons, modelesQuestionnaire } = useData()
  const saison = saisonDepuisSlug(slug, saisons)
  const modele = modelesQuestionnaire.find((m) => m.id === id)
  if (!saison) return <Navigate to={RACINE_PERFORMANCES} replace />
  if (!modele) return <Navigate to={cheminSaisonPerf(saison)} replace />
  return <Contenu saison={saison} modele={modele} />
}

function Contenu({
  saison,
  modele,
}: {
  saison: string
  modele: ModeleQuestionnaire
}) {
  const navigate = useNavigate()
  const { questionnaires, updateModeleQuestionnaire, removeModeleQuestionnaire } =
    useData()
  const { toast, notify } = useToastPerf()
  const [lancerOpen, setLancerOpen] = useState(false)
  const [partageOpen, setPartageOpen] = useState(false)
  const [supprimerOpen, setSupprimerOpen] = useState(false)
  const [apercu, setApercu] = useState<number | null>(null)

  const utilisations = questionnaires.filter((q) => q.modeleId === modele.id).length
  const portee = PORTEE_LIBELLE[modele.partage.portee]
  const etiquettes = valeursEchelle(modele.echelle).filter(
    (v) => modele.echelle.etiquettes[v],
  )

  return (
    <div className="flex flex-col gap-8">
      <div>
        <BackButton to={cheminSaisonPerf(saison)} label="Questionnaires" />
        <PageHeader
          title={modele.nom}
          subtitle={
            <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span>
                Créé le {dateLongue(modele.creeLe)} par {modele.auteur}
              </span>
              <span className="text-ink-disabled">·</span>
              <span>
                {utilisations
                  ? `Utilisé ${utilisations} fois`
                  : "Jamais utilisé"}
              </span>
              <span className="text-ink-disabled">·</span>
              <span className="inline-flex items-center gap-1.5">
                <portee.icon size={13} /> {portee.label}
              </span>
            </span>
          }
          actions={
            <>
              <IconBtn label="Partager" onClick={() => setPartageOpen(true)}>
                <Share2 size={16} />
              </IconBtn>
              <IconBtn
                label="Modifier"
                onClick={() => navigate(cheminModeleEdition(saison, modele.id))}
              >
                <Pencil size={16} />
              </IconBtn>
              <IconBtn
                label="Supprimer"
                danger
                onClick={() => setSupprimerOpen(true)}
              >
                <Trash2 size={16} />
              </IconBtn>
              <Button onClick={() => setLancerOpen(true)}>
                <Send /> Utiliser ce modèle
              </Button>
            </>
          }
        />
      </div>

      <Section
        titre="Échelle"
        aside={<span className="font-body text-sm text-ink-muted">{modele.echelle.nom}</span>}
      >
        <div className="grid gap-6 p-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-3 gap-3">
              <Chiffre label="Minimum" valeur={modele.echelle.min} />
              <Chiffre label="Maximum" valeur={modele.echelle.max} />
              <Chiffre label="Pas" valeur={modele.echelle.pas} />
            </div>
            {etiquettes.length ? (
              <div className="flex flex-col gap-2">
                <span className={overlineCls}>Étiquettes</span>
                <ul className="grid gap-x-4 gap-y-1.5 sm:grid-cols-2">
                  {etiquettes.map((v) => (
                    <li
                      key={v}
                      className="flex items-baseline gap-2 font-body text-[0.82rem]"
                    >
                      <span className="w-5 shrink-0 text-right font-ui text-ink-disabled tabular-nums">
                        {v}
                      </span>
                      <span className="truncate text-ink-subtle">
                        {modele.echelle.etiquettes[v]}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="font-body text-[0.8rem] text-ink-disabled">
                Pas d'étiquettes — les joueurs voient seulement les chiffres.
              </p>
            )}
          </div>
          <div className="flex flex-col gap-3 rounded-lg border border-border p-4">
            <span className={overlineCls}>Aperçu côté joueur — essayez</span>
            <EchelleSaisie
              echelle={modele.echelle}
              valeur={apercu}
              onChange={setApercu}
            />
          </div>
        </div>
      </Section>

      <Section
        titre="Analyse des scores"
        aside={
          modele.questions.length ? (
            <span className="font-body text-sm text-ink-muted">
              Total possible {bornesTotal(modele).min} → {bornesTotal(modele).max}
            </span>
          ) : null
        }
      >
        {modele.intervalles.length ? (
          <div className="flex flex-col gap-4 p-5">
            <Regle modele={modele} />
            <ol className="flex flex-col gap-2">
              {modele.intervalles.map((i, n) => (
                <li
                  key={i.id}
                  className="flex items-center gap-4 rounded-md border border-border px-4 py-3"
                >
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-sm border border-border bg-surface-nested font-ui text-[0.74rem] text-ink-muted">
                    {n + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-ui text-[0.9rem] text-ink">
                    {i.libelle}
                  </span>
                  <span className="font-ui text-[0.85rem] text-ink-muted tabular-nums">
                    {i.min} – {i.max}
                  </span>
                  <Badge variant={TON_VARIANT[i.ton]} dot className="hidden sm:inline-flex">
                    {TON_LIBELLE[i.ton]}
                  </Badge>
                </li>
              ))}
            </ol>
          </div>
        ) : (
          <EmptyState
            title="Aucun intervalle ajouté"
            description="Sans analyse, les questionnaires affichent le total des joueurs mais aucun verdict."
            action={
              <Button
                variant="outline"
                onClick={() => navigate(cheminModeleEdition(saison, modele.id))}
              >
                <Pencil /> Définir les intervalles
              </Button>
            }
          />
        )}
      </Section>

      <Section
        titre="Questions"
        aside={
          <span className="font-body text-sm text-ink-muted">
            {pluriel(modele.questions.length, "question")}
          </span>
        }
      >
        {modele.questions.length ? (
          <ol className="flex flex-col divide-y divide-border">
            {modele.questions.map((q, n) => (
              <li key={q.id} className="flex flex-col gap-3 p-5">
                <span className="flex items-baseline gap-3">
                  <span className="font-ui text-[0.74rem] text-ink-disabled tabular-nums">
                    Q{n + 1}
                  </span>
                  <span className="font-ui text-[0.95rem] text-ink">{q.texte}</span>
                </span>
                <div className="max-w-xl pl-8">
                  <EchelleSaisie echelle={modele.echelle} valeur={null} compact />
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <EmptyState
            title="Aucune question"
            description="Ajoutez au moins une question avant de lancer ce modèle."
          />
        )}
      </Section>

      <LancerQuestionnaireModal
        open={lancerOpen}
        onOpenChange={setLancerOpen}
        saison={saison}
        modeleId={modele.id}
      />
      <CommunauteModal
        open={partageOpen}
        onOpenChange={setPartageOpen}
        titre="Partager le modèle"
        ressourcesDisponibles={RESSOURCES_MODELE}
        partage={modele.partage}
        onEnregistrer={(partage) => {
          updateModeleQuestionnaire(modele.id, { partage })
          setPartageOpen(false)
          notify("Paramètres de partage enregistrés.")
        }}
      />
      <ConfirmDialog
        open={supprimerOpen}
        onOpenChange={setSupprimerOpen}
        title={`Supprimer « ${modele.nom} » ?`}
        description={
          utilisations
            ? `Les ${utilisations} questionnaires déjà lancés gardent leurs questions et leurs réponses. Le modèle ne pourra plus être relancé.`
            : "Le modèle n'a jamais été lancé. Cette action est définitive."
        }
        confirmLabel="Supprimer"
        onConfirm={() => {
          removeModeleQuestionnaire(modele.id)
          navigate(cheminSaisonPerf(saison), {
            state: { toast: `Modèle « ${modele.nom} » supprimé.` },
          })
        }}
      />
      <Toast toast={toast} />
    </div>
  )
}

/* ── Pieces ──────────────────────────────────────────────────────────────── */

function Section({
  titre,
  aside,
  children,
}: {
  titre: string
  aside?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-end justify-between gap-4">
        <h2 className="font-ui text-lg font-medium text-ink">{titre}</h2>
        {aside}
      </div>
      <div className="rounded-lg border border-border">{children}</div>
    </section>
  )
}

function Chiffre({ label, valeur }: { label: string; valeur: number }) {
  return (
    <div className="rounded-md border border-border px-4 py-3">
      <div className="font-ui text-2xl font-semibold text-ink tabular-nums">
        {valeur}
      </div>
      <div className={cn(overlineCls, "mt-1")}>{label}</div>
    </div>
  )
}

export function IconBtn({
  label,
  onClick,
  danger = false,
  children,
}: {
  label: string
  onClick: () => void
  danger?: boolean
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex size-9 items-center justify-center rounded-md border border-border-strong text-ink-muted transition-colors hover:bg-surface-hover",
        danger ? "hover:border-danger/50 hover:text-danger" : "hover:text-ink",
      )}
    >
      {children}
    </button>
  )
}

/**
 * The total's whole range drawn as a ruler, each interval a coloured band —
 * gaps show as empty track, so a badly-configured analyse is visible at once.
 */
export function Regle({
  modele,
}: {
  modele: Pick<ModeleQuestionnaire, "echelle" | "questions" | "intervalles">
}) {
  const { min, max } = bornesTotal(modele)
  const span = Math.max(1, max - min)
  const pos = (v: number) => ((Math.min(max, Math.max(min, v)) - min) / span) * 100
  return (
    <div className="flex flex-col gap-1.5">
      <div className="relative h-2.5 overflow-hidden rounded-pill bg-accent">
        {modele.intervalles.map((i: IntervalleScore) => (
          <span
            key={i.id}
            title={`${i.libelle} · ${i.min} – ${i.max}`}
            className={cn("absolute inset-y-0 opacity-70", TON_FOND[i.ton])}
            style={{
              left: `${pos(i.min)}%`,
              width: `${Math.max(0.8, pos(i.max) - pos(i.min))}%`,
            }}
          />
        ))}
      </div>
      <div className="flex justify-between font-ui text-[0.7rem] text-ink-disabled tabular-nums">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  )
}
