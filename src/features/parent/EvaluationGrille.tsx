import { Eye, Paperclip } from "lucide-react"

import { cn } from "@/lib/utils"
import type {
  ParentCritere,
  ParentEnfant,
  ParentEvaluation,
} from "@/data/seed/parent"
import { Bar } from "@/features/budget/ui"

/**
 * La grille d'évaluation du club, telle que la FAMILLE la lit — partagée par
 * la fiche de séance et la fiche de match, pour que les deux pages notent de
 * la même façon.
 *
 * Le back-office édite le modèle (nom, type, domaine, critères, barème) ; ici
 * on affiche d'abord la moyenne carte joueur, puis chaque critère avec sa note
 * sur son barème, ce qu'il alimente et les pièces jointes par l'éducateur.
 * Rien n'est modifiable : un parent lit, il ne note pas.
 * Densité reprise des écrans Budget (Stat + Bar).
 */
export function EvaluationGrille({
  evaluation,
  enfant,
  onDocument,
}: {
  evaluation: ParentEvaluation
  enfant: ParentEnfant
  onDocument: (nom: string) => void
}) {
  /** Moyenne des seuls critères qui alimentent la carte — jamais stockée. */
  const surCarte = evaluation.criteres.filter((c) => c.carteJoueur)
  const moyenne = surCarte.length
    ? Math.round(
        surCarte.reduce((total, c) => total + (c.note / c.sur) * 100, 0) /
          surCarte.length,
      )
    : null

  return (
    <div className="flex flex-col gap-4">
      {/* En-tête de la grille : quel modèle a servi, et le résultat. */}
      <div className="flex flex-col gap-5 rounded-lg border border-border p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h2 className="font-ui text-lg font-medium text-ink">
              {evaluation.nom}
            </h2>
            <p className="mt-1 font-body text-[0.82rem] text-ink-muted">
              {evaluation.type}
            </p>
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              <Tag>{evaluation.modele}</Tag>
              <Tag>{evaluation.domaine}</Tag>
              <Tag>
                {enfant.categorie} · {enfant.groupe}
              </Tag>
            </div>
          </div>

          {moyenne != null ? (
            <div className="flex shrink-0 flex-col items-end">
              <span className="font-display text-3xl font-semibold text-ink tabular-nums">
                {moyenne}
              </span>
              <span className="font-ui text-[0.66rem] tracking-[0.08em] text-ink-disabled uppercase">
                Moyenne carte joueur
              </span>
            </div>
          ) : null}
        </div>

        {evaluation.privee ? (
          <p className="inline-flex items-center gap-2 border-t border-border pt-3.5 font-body text-[0.8rem] text-ink-muted">
            <Eye size={14} className="shrink-0 text-ink-disabled" />
            Évaluation privée — seule votre famille la voit, jamais le reste du
            groupe.
          </p>
        ) : null}
      </div>

      <h3 className="font-ui text-[0.72rem] font-medium tracking-[0.08em] text-ink-muted uppercase">
        Les critères d'évaluation · {evaluation.criteres.length}
      </h3>
      <ul className="flex flex-col overflow-hidden rounded-lg border border-border">
        {evaluation.criteres.map((critere, i) => (
          <CritereRow
            key={critere.code}
            critere={critere}
            first={i === 0}
            onDocument={onDocument}
          />
        ))}
      </ul>
    </div>
  )
}

/** Une puce de la grille — même traitement que les tags du reste de l'app. */
function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-pill border border-brand-blue-600/30 bg-brand-blue-600/10 px-2.5 py-0.5 font-ui text-[0.72rem] text-brand-blue-600">
      {children}
    </span>
  )
}

/**
 * Un critère noté. La note et sa barre disent le niveau d'un coup d'œil ; les
 * marqueurs dessous disent ce que la note alimente et ce qui la justifie.
 */
function CritereRow({
  critere,
  first,
  onDocument,
}: {
  critere: ParentCritere
  first: boolean
  onDocument: (nom: string) => void
}) {
  const pourcent = Math.round((critere.note / critere.sur) * 100)

  return (
    <li
      className={cn(
        "flex flex-col gap-3 px-4 py-4",
        !first && "border-t border-border",
      )}
    >
      <div className="flex items-start gap-3.5">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-surface-nested font-ui text-[0.72rem] tracking-[0.04em] text-ink-subtle">
          {critere.code}
        </span>

        <div className="min-w-0 flex-1">
          <p className="font-ui text-[0.9rem] text-ink">{critere.label}</p>
          {critere.commentaire ? (
            <p className="mt-0.5 font-body text-[0.8rem] leading-relaxed text-ink-muted">
              {critere.commentaire}
            </p>
          ) : null}
        </div>

        <span className="shrink-0 text-right">
          <span className="font-display text-lg font-medium text-ink tabular-nums">
            {critere.note}
          </span>
          <span className="font-body text-[0.78rem] text-ink-disabled tabular-nums">
            {" / "}
            {critere.sur}
          </span>
        </span>
      </div>

      {/* Sous 50, la barre passe en gold : c'est un vrai axe de travail. */}
      <Bar value={pourcent} warn={pourcent < 50} sm />

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span
          className={cn(
            "font-ui text-[0.72rem]",
            critere.carteJoueur ? "text-info" : "text-ink-disabled",
          )}
        >
          {critere.carteJoueur
            ? "Inclus dans la carte joueur"
            : "Hors carte joueur"}
        </span>

        {critere.documents?.map((document) => (
          <button
            key={document}
            type="button"
            onClick={() => onDocument(document)}
            className="inline-flex items-center gap-1.5 font-ui text-[0.72rem] text-ink-muted transition-colors hover:text-ink"
          >
            <Paperclip size={13} className="shrink-0" />
            {document}
          </button>
        ))}
      </div>
    </li>
  )
}
