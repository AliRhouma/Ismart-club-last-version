import { useMemo, useState, type ReactNode } from "react"
import { Link, Navigate, useNavigate, useParams } from "react-router-dom"
import {
  BellRing,
  ClipboardEdit,
  Lock,
  LockOpen,
  Search,
  Trash2,
  UserX,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { useData } from "@/data/useData"
import type { CategorieJoueur } from "@/data/seed/categories"
import {
  totalReponse,
  verdictPour,
  type IntervalleScore,
  type Questionnaire,
  type ReponseQuestionnaire,
} from "@/data/seed/performances"
import { PageHeader } from "@/components/kit/PageHeader"
import { BackButton } from "@/components/kit/BackButton"
import { Avatar } from "@/components/kit/Avatar"
import { Badge } from "@/components/kit/Badge"
import { ConfirmDialog } from "@/components/kit/ConfirmDialog"
import { EmptyState } from "@/components/kit/EmptyState"
import { Toast } from "@/components/kit/Toast"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Bar, Segmented } from "@/features/budget/ui"
import { saisonDepuisSlug } from "@/features/pole-technique/programmationRoutes"
import {
  RACINE_PERFORMANCES,
  cheminModele,
  cheminSaisonPerf,
} from "@/features/performances/performancesRoutes"
import {
  EchelleSaisie,
  Verdict,
} from "@/features/performances/performancesUi"
import {
  TON_FOND,
  TON_TEXTE,
  bilan,
  dateLongue,
  overlineCls,
  useToastPerf,
} from "@/features/performances/performancesHelpers"
import { IconBtn } from "@/features/performances/ModeleDetailScreen"

type Filtre = "tous" | "repondu" | "attente" | "alerte"

type Ligne = {
  joueur: CategorieJoueur
  reponse: ReponseQuestionnaire | null
  total: number | null
  verdict: IntervalleScore | null
}

const RANG_TON = { mauvais: 0, moyen: 1, bon: 2 } as const

/**
 * One launched questionnaire. The staff opens it to answer "who is not OK
 * today?", so the players in alerte lead the list and the numbers above say
 * how complete the picture is (réponses reçues) before what it shows.
 */
export function QuestionnaireDetailScreen() {
  const { saison: slug = "", id = "" } = useParams()
  const { saisons, questionnaires } = useData()
  const saison = saisonDepuisSlug(slug, saisons)
  const q = questionnaires.find((x) => x.id === id)
  if (!saison) return <Navigate to={RACINE_PERFORMANCES} replace />
  if (!q) return <Navigate to={cheminSaisonPerf(saison)} replace />
  return <Contenu saison={saison} q={q} />
}

function Contenu({ saison, q }: { saison: string; q: Questionnaire }) {
  const navigate = useNavigate()
  const {
    categories,
    modelesQuestionnaire,
    updateQuestionnaire,
    removeQuestionnaire,
  } = useData()
  const { toast, notify } = useToastPerf()
  const [filtre, setFiltre] = useState<Filtre>("tous")
  const [recherche, setRecherche] = useState("")
  const [saisie, setSaisie] = useState<CategorieJoueur | null>(null)
  const [supprimerOpen, setSupprimerOpen] = useState(false)

  const categorie = categories.find((c) => c.id === q.categorieId)
  const groupe = categorie?.groupes.find((g) => g.id === q.groupeId)
  const { cibles, recues, attendues, alertes } = bilan(q, categories)
  const ouvert = q.statut === "ouvert"
  const modeleExiste = modelesQuestionnaire.some((m) => m.id === q.modeleId)
  const { intervalles, questions, echelle } = q.modele

  const lignes: Ligne[] = useMemo(
    () =>
      cibles
        .map((joueur) => {
          const reponse = q.reponses.find((r) => r.joueurId === joueur.id) ?? null
          const total = reponse ? totalReponse(reponse) : null
          return {
            joueur,
            reponse,
            total,
            verdict: total != null ? verdictPour(intervalles, total) : null,
          }
        })
        // Alerte first, then à suivre, then bon; unanswered last.
        .sort((a, b) => {
          if (!a.reponse || !b.reponse) return a.reponse ? -1 : b.reponse ? 1 : 0
          const ra = a.verdict ? RANG_TON[a.verdict.ton] : 3
          const rb = b.verdict ? RANG_TON[b.verdict.ton] : 3
          return ra - rb || (b.total ?? 0) - (a.total ?? 0)
        }),
    [cibles, q.reponses, intervalles],
  )

  const repondus = lignes.filter((l) => l.reponse)
  const enAttente = lignes.filter((l) => !l.reponse)
  const moyenne = repondus.length
    ? repondus.reduce((s, l) => s + (l.total ?? 0), 0) / repondus.length
    : null
  const verdictMoyen =
    moyenne != null ? verdictPour(intervalles, Math.round(moyenne)) : null

  const visibles = lignes.filter((l) => {
    const okFiltre =
      filtre === "tous" ||
      (filtre === "repondu" && l.reponse) ||
      (filtre === "attente" && !l.reponse) ||
      (filtre === "alerte" && l.verdict?.ton === "mauvais")
    return okFiltre && l.joueur.nom.toLowerCase().includes(recherche.trim().toLowerCase())
  })

  const reponseEnCours = saisie
    ? (q.reponses.find((r) => r.joueurId === saisie.id) ?? null)
    : null

  return (
    <div className="flex flex-col gap-8">
      <div>
        <BackButton to={cheminSaisonPerf(saison)} label="Questionnaires" />
        <PageHeader
          title={q.nom}
          subtitle={
            <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
              {ouvert ? (
                <Badge variant="info" dot>
                  En cours
                </Badge>
              ) : (
                <Badge>Clos</Badge>
              )}
              {modeleExiste ? (
                <Link
                  to={cheminModele(saison, q.modeleId)}
                  className="text-info transition-opacity hover:opacity-80"
                >
                  {q.modele.nom}
                </Link>
              ) : (
                <span>{q.modele.nom}</span>
              )}
              <span className="text-ink-disabled">·</span>
              <span>
                {categorie?.nom ?? "—"}
                {groupe ? ` · ${groupe.nom}` : " · tous les groupes"}
              </span>
              <span className="text-ink-disabled">·</span>
              <span>Lancé le {dateLongue(q.lanceLe)}</span>
            </span>
          }
          actions={
            <>
              <IconBtn label="Supprimer" danger onClick={() => setSupprimerOpen(true)}>
                <Trash2 size={16} />
              </IconBtn>
              <Button
                variant="outline"
                onClick={() => {
                  updateQuestionnaire(q.id, { statut: ouvert ? "clos" : "ouvert" })
                  notify(
                    ouvert
                      ? "Questionnaire clôturé — les réponses sont figées."
                      : "Questionnaire rouvert.",
                  )
                }}
              >
                {ouvert ? <Lock /> : <LockOpen />}
                {ouvert ? "Clôturer" : "Rouvrir"}
              </Button>
              {ouvert && enAttente.length ? (
                <Button onClick={() => setSaisie(enAttente[0].joueur)}>
                  <ClipboardEdit /> Saisir une réponse
                </Button>
              ) : null}
            </>
          }
        />
      </div>

      {/* ── Key numbers ── */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Tuile label="Réponses">
          <span className="font-display text-[2.3rem] leading-none font-semibold text-ink">
            {recues}
            <span className="text-[1.3rem] text-ink-disabled"> / {attendues}</span>
          </span>
          <Bar sm value={attendues ? (recues / attendues) * 100 : 0} />
          {ouvert && enAttente.length ? (
            <button
              type="button"
              onClick={() =>
                notify(`Rappel envoyé à ${enAttente.length} joueurs en attente.`)
              }
              className="inline-flex items-center gap-1.5 self-start font-ui text-[0.72rem] text-info transition-opacity hover:opacity-80"
            >
              <BellRing size={12} /> Relancer les {enAttente.length} en attente
            </button>
          ) : (
            <span className="font-body text-[0.76rem] text-ink-muted">
              {enAttente.length ? `${enAttente.length} sans réponse` : "Tout le monde a répondu"}
            </span>
          )}
        </Tuile>

        <Tuile label="Score moyen">
          <span
            className={cn(
              "font-display text-[2.3rem] leading-none font-semibold",
              verdictMoyen ? TON_TEXTE[verdictMoyen.ton] : "text-ink",
            )}
          >
            {moyenne != null ? moyenne.toFixed(1).replace(".", ",") : "—"}
          </span>
          <span className="font-body text-[0.76rem] text-ink-muted">
            {moyenne == null
              ? "Pas encore de réponse"
              : verdictMoyen
                ? `Groupe « ${verdictMoyen.libelle} »`
                : intervalles.length
                  ? "Hors des intervalles définis"
                  : "Modèle sans analyse des scores"}
          </span>
        </Tuile>

        <Tuile label="En alerte">
          <span
            className={cn(
              "font-display text-[2.3rem] leading-none font-semibold",
              alertes ? "text-danger" : "text-ink",
            )}
          >
            {alertes}
          </span>
          {alertes ? (
            <button
              type="button"
              onClick={() => setFiltre("alerte")}
              className="self-start font-ui text-[0.72rem] text-info transition-opacity hover:opacity-80"
            >
              Voir les joueurs concernés
            </button>
          ) : (
            <span className="font-body text-[0.76rem] text-ink-muted">
              {intervalles.length ? "Aucun joueur dans le rouge" : "—"}
            </span>
          )}
        </Tuile>
      </div>

      {/* ── Répartition + moyenne par question ── */}
      {repondus.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Panneau titre="Répartition des verdicts">
            {intervalles.length ? (
              <Repartition lignes={repondus} intervalles={intervalles} />
            ) : (
              <p className="font-body text-[0.82rem] text-ink-disabled">
                Le modèle n'a pas d'analyse des scores : seuls les totaux sont
                affichés.
              </p>
            )}
          </Panneau>
          <Panneau titre="Moyenne par question">
            <ul className="flex flex-col gap-3">
              {questions.map((qu) => {
                const vals = repondus
                  .map((l) => l.reponse!.valeurs[qu.id])
                  .filter((v): v is number => v != null)
                const moy = vals.length ? vals.reduce((s, v) => s + v, 0) / vals.length : 0
                const part =
                  echelle.max > echelle.min
                    ? ((moy - echelle.min) / (echelle.max - echelle.min)) * 100
                    : 0
                return (
                  <li key={qu.id} className="flex flex-col gap-1.5">
                    <span className="flex items-baseline justify-between gap-3 font-body text-[0.8rem]">
                      <span className="truncate text-ink-subtle">{qu.texte}</span>
                      <span className="shrink-0 font-ui text-ink tabular-nums">
                        {moy.toFixed(1).replace(".", ",")}
                        <span className="text-ink-disabled"> / {echelle.max}</span>
                      </span>
                    </span>
                    <Bar sm value={part} warn={part >= 66} />
                  </li>
                )
              })}
            </ul>
          </Panneau>
        </div>
      ) : null}

      {/* ── Joueurs ── */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <h2 className="font-ui text-lg font-medium text-ink">Joueurs</h2>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className="relative block sm:w-56">
              <Search
                size={15}
                aria-hidden
                className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-disabled"
              />
              <input
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                placeholder="Rechercher…"
                aria-label="Rechercher un joueur"
                className="w-full rounded-md border border-input bg-transparent py-2 pr-3.5 pl-10 font-body text-sm text-ink outline-none transition-colors placeholder:text-ink-disabled focus:border-border-focus"
              />
            </label>
            <Segmented
              value={filtre}
              onChange={setFiltre}
              options={[
                { value: "tous", label: "Tous", badge: lignes.length },
                { value: "repondu", label: "Répondu", badge: repondus.length },
                { value: "attente", label: "En attente", badge: enAttente.length },
                ...(intervalles.length
                  ? [{ value: "alerte" as const, label: "En alerte", badge: alertes }]
                  : []),
              ]}
            />
          </div>
        </div>

        <div className="overflow-hidden rounded-lg border border-border">
          {visibles.length ? (
            <ul className="divide-y divide-border">
              {visibles.map((l) => (
                <LigneJoueur
                  key={l.joueur.id}
                  ligne={l}
                  q={q}
                  groupe={
                    categorie?.groupes.find((g) => g.id === l.joueur.groupeId)?.nom
                  }
                  onOpen={() => setSaisie(l.joueur)}
                />
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={cibles.length ? Search : UserX}
              title={
                cibles.length
                  ? filtre === "attente"
                    ? "Tout le monde a répondu"
                    : "Aucun joueur ne correspond"
                  : "Aucun joueur dans ce groupe"
              }
            />
          )}
        </div>
      </section>

      <ReponseModal
        joueur={saisie}
        onClose={() => setSaisie(null)}
        q={q}
        reponse={reponseEnCours}
        suivant={
          enAttente.find((l) => l.joueur.id !== saisie?.id)?.joueur ?? null
        }
        onEnchainer={(j) => setSaisie(j)}
        onFait={notify}
      />
      <ConfirmDialog
        open={supprimerOpen}
        onOpenChange={setSupprimerOpen}
        title={`Supprimer « ${q.nom} » ?`}
        description={
          recues
            ? `Les ${recues} réponses collectées seront perdues.`
            : "Aucune réponse n'a encore été collectée."
        }
        confirmLabel="Supprimer"
        onConfirm={() => {
          removeQuestionnaire(q.id)
          navigate(cheminSaisonPerf(saison), {
            state: { toast: `Questionnaire « ${q.nom} » supprimé.` },
          })
        }}
      />
      <Toast toast={toast} />
    </div>
  )
}

/* ── Pieces ──────────────────────────────────────────────────────────────── */

function Tuile({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2.5 rounded-lg border border-border px-5 py-[1.1rem]">
      <span className={overlineCls}>{label}</span>
      {children}
    </div>
  )
}

function Panneau({ titre, children }: { titre: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border p-5">
      <h3 className="font-ui text-[0.95rem] font-medium text-ink">{titre}</h3>
      {children}
    </div>
  )
}

/** One stacked bar (share of joueurs per verdict) + its legend with counts. */
function Repartition({
  lignes,
  intervalles,
}: {
  lignes: Ligne[]
  intervalles: IntervalleScore[]
}) {
  const parts = intervalles.map((i) => ({
    i,
    n: lignes.filter((l) => l.verdict?.id === i.id).length,
  }))
  const hors = lignes.filter((l) => !l.verdict).length
  const total = lignes.length
  return (
    <div className="flex flex-col gap-4">
      <div className="flex h-3 gap-0.5 overflow-hidden rounded-pill bg-accent">
        {parts
          .filter((p) => p.n)
          .map((p) => (
            <span
              key={p.i.id}
              title={`${p.i.libelle} · ${p.n}`}
              className={cn("h-full opacity-80", TON_FOND[p.i.ton])}
              style={{ width: `${(p.n / total) * 100}%` }}
            />
          ))}
      </div>
      <ul className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
        {parts.map((p) => (
          <li
            key={p.i.id}
            className="flex items-center justify-between gap-3 font-body text-[0.8rem]"
          >
            <span className="flex min-w-0 items-center gap-2">
              <span className={cn("size-2 shrink-0 rounded-full", TON_FOND[p.i.ton])} />
              <span className={cn("truncate", p.n ? "text-ink-subtle" : "text-ink-disabled")}>
                {p.i.libelle}
              </span>
            </span>
            <span className={cn("font-ui tabular-nums", p.n ? "text-ink" : "text-ink-disabled")}>
              {p.n}
            </span>
          </li>
        ))}
        {hors ? (
          <li className="flex items-center justify-between gap-3 font-body text-[0.8rem] text-ink-disabled">
            <span>Hors intervalles</span>
            <span className="font-ui tabular-nums">{hors}</span>
          </li>
        ) : null}
      </ul>
    </div>
  )
}

function LigneJoueur({
  ligne,
  q,
  groupe,
  onOpen,
}: {
  ligne: Ligne
  q: Questionnaire
  groupe?: string
  onOpen: () => void
}) {
  const { joueur, reponse, total, verdict } = ligne
  const ouvert = q.statut === "ouvert"
  const cliquable = !!reponse || ouvert
  return (
    <li>
      <button
        type="button"
        disabled={!cliquable}
        onClick={onOpen}
        className={cn(
          "flex w-full items-center gap-4 px-4 py-3 text-left transition-colors",
          cliquable ? "hover:bg-surface-hover" : "cursor-default",
        )}
      >
        <Avatar name={joueur.nom} src={joueur.photo} size="md" />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-ui text-[0.9rem] text-ink">
            {joueur.nom}
          </span>
          <span className="block truncate font-body text-[0.74rem] text-ink-disabled">
            {reponse
              ? `Répondu le ${dateLongue(reponse.reponduLe)}`
              : "En attente de réponse"}
            {groupe ? ` · ${groupe}` : ""}
          </span>
        </span>

        {reponse ? (
          <>
            <span className="hidden items-center gap-1 md:flex" aria-hidden>
              {q.modele.questions.map((qu) => (
                <span
                  key={qu.id}
                  title={`${qu.texte} : ${reponse.valeurs[qu.id] ?? "—"}`}
                  className="flex size-7 items-center justify-center rounded-sm border border-border font-ui text-[0.72rem] text-ink-muted tabular-nums"
                >
                  {reponse.valeurs[qu.id] ?? "—"}
                </span>
              ))}
            </span>
            <span className="w-12 text-right font-ui text-[1.05rem] font-medium text-ink tabular-nums">
              {total}
            </span>
            <span className="hidden w-32 justify-end sm:flex">
              <Verdict intervalle={verdict} />
            </span>
          </>
        ) : ouvert ? (
          <span className="rounded-md border border-border-strong px-3 py-1.5 font-ui text-[0.76rem] text-ink-muted">
            Saisir
          </span>
        ) : (
          <span className="font-body text-[0.76rem] text-ink-disabled">
            Pas de réponse
          </span>
        )}
      </button>
    </li>
  )
}

/* ── Saisir / consulter une réponse ──────────────────────────────────────── */

function ReponseModal({
  joueur,
  onClose,
  q,
  reponse,
  suivant,
  onEnchainer,
  onFait,
}: {
  joueur: CategorieJoueur | null
  onClose: () => void
  q: Questionnaire
  reponse: ReponseQuestionnaire | null
  /** Next joueur still waiting — offered as "Enregistrer et suivant". */
  suivant: CategorieJoueur | null
  onEnchainer: (j: CategorieJoueur) => void
  onFait: (msg: string) => void
}) {
  return (
    <Dialog open={!!joueur} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto rounded-xl sm:max-w-xl">
        {joueur ? (
          <ReponseForm
            key={joueur.id}
            joueur={joueur}
            q={q}
            reponse={reponse}
            suivant={suivant}
            onClose={onClose}
            onEnchainer={onEnchainer}
            onFait={onFait}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

function ReponseForm({
  joueur,
  q,
  reponse,
  suivant,
  onClose,
  onEnchainer,
  onFait,
}: {
  joueur: CategorieJoueur
  q: Questionnaire
  reponse: ReponseQuestionnaire | null
  suivant: CategorieJoueur | null
  onClose: () => void
  onEnchainer: (j: CategorieJoueur) => void
  onFait: (msg: string) => void
}) {
  const { enregistrerReponse, removeReponse } = useData()
  const lecture = q.statut === "clos"
  const [valeurs, setValeurs] = useState<Record<string, number>>(
    reponse?.valeurs ?? {},
  )
  const { questions, echelle, intervalles } = q.modele
  const complet = questions.every((qu) => valeurs[qu.id] != null)
  const total = questions.reduce((s, qu) => s + (valeurs[qu.id] ?? 0), 0)
  const verdict = complet ? verdictPour(intervalles, total) : null
  const nouveau = !reponse

  const enregistrer = (enchainer: boolean) => {
    if (!complet) return
    enregistrerReponse(q.id, joueur.id, valeurs)
    onFait(`Réponse de ${joueur.nom} enregistrée.`)
    if (enchainer && suivant) onEnchainer(suivant)
    else onClose()
  }

  return (
    <>
      <DialogHeader>
        <div className="flex items-center gap-3">
          <Avatar name={joueur.nom} src={joueur.photo} size="lg" />
          <div className="flex min-w-0 flex-col gap-1 text-left">
            <DialogTitle className="truncate">{joueur.nom}</DialogTitle>
            <DialogDescription>
              {lecture
                ? "Questionnaire clos — réponse en lecture seule."
                : reponse
                  ? `Répondu le ${dateLongue(reponse.reponduLe)} — vous pouvez corriger.`
                  : "Saisie pour le joueur."}
            </DialogDescription>
          </div>
        </div>
      </DialogHeader>

      {lecture && !reponse ? (
        <EmptyState title="Pas de réponse" description="Le joueur n'a pas répondu avant la clôture." />
      ) : (
        <ol className="flex flex-col gap-5">
          {questions.map((qu, n) => (
            <li key={qu.id} className="flex flex-col gap-2.5">
              <span className="flex items-baseline gap-2.5">
                <span className="font-ui text-[0.72rem] text-ink-disabled tabular-nums">
                  Q{n + 1}
                </span>
                <span className="font-ui text-[0.9rem] text-ink">{qu.texte}</span>
              </span>
              <EchelleSaisie
                echelle={echelle}
                valeur={valeurs[qu.id] ?? null}
                onChange={
                  lecture
                    ? undefined
                    : (v) => setValeurs((prev) => ({ ...prev, [qu.id]: v }))
                }
              />
            </li>
          ))}
        </ol>
      )}

      {/* Live result — the staff sees the verdict before saving. */}
      <div className="flex items-center justify-between gap-4 rounded-lg border border-border px-4 py-3">
        <span className="flex flex-col gap-0.5">
          <span className={overlineCls}>Total</span>
          <span className="font-ui text-xl font-semibold text-ink tabular-nums">
            {complet ? total : "—"}
            <span className="text-sm font-normal text-ink-disabled">
              {" "}
              / {questions.length * echelle.max}
            </span>
          </span>
        </span>
        {complet ? (
          <Verdict intervalle={verdict} />
        ) : (
          <span className="font-body text-[0.78rem] text-ink-disabled">
            {questions.filter((qu) => valeurs[qu.id] == null).length} question(s)
            sans réponse
          </span>
        )}
      </div>

      <DialogFooter className="gap-2 sm:justify-between">
        {reponse && !lecture ? (
          <Button
            variant="ghost"
            className="text-danger hover:text-danger"
            onClick={() => {
              removeReponse(q.id, reponse.id)
              onFait(`Réponse de ${joueur.nom} supprimée.`)
              onClose()
            }}
          >
            <Trash2 /> Supprimer la réponse
          </Button>
        ) : (
          <span />
        )}
        <div className="flex flex-col-reverse gap-2 sm:flex-row">
          <Button variant="outline" onClick={onClose}>
            {lecture ? "Fermer" : "Annuler"}
          </Button>
          {!lecture && nouveau && suivant ? (
            <Button variant="outline" disabled={!complet} onClick={() => enregistrer(true)}>
              Enregistrer et suivant
            </Button>
          ) : null}
          {!lecture ? (
            <Button disabled={!complet} onClick={() => enregistrer(false)}>
              Enregistrer
            </Button>
          ) : null}
        </div>
      </DialogFooter>
    </>
  )
}
