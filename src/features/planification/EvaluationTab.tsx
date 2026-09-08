import { useMemo, useState } from "react"
import { Eraser, FileText, Gauge, Star, Users } from "lucide-react"

import { cn } from "@/lib/utils"
import { useData } from "@/data/useData"
import type {
  EvaluationCritere,
  EvaluationGrille,
} from "@/data/seed/evaluations"
import type { SeanceDetail } from "@/data/seed/seances"
import { Avatar } from "@/components/kit/Avatar"
import { EmptyState } from "@/components/kit/EmptyState"
import { ConfirmDialog } from "@/components/kit/ConfirmDialog"
import { Button } from "@/components/ui/button"

/** A row of the sheet, from either roster source. */
type Evalue = { id: string; nom: string; poste: string; photo?: string }

/** Where a mark sits on its barème — the only colour on the sheet. */
function tonDeNote(valeur: number, bareme: number) {
  const part = valeur / bareme
  if (part >= 0.75) return "text-success"
  if (part >= 0.5) return "text-ink"
  if (part >= 0.3) return "text-warning"
  return "text-danger"
}

/**
 * The séance debrief: every convoqué scored against one grille at a time.
 *
 * A grille is a set of critères, and a critère is either a mark out of a barème
 * (100, almost always) or a measured value in its own unit — a chrono is not a
 * mark, so it never counts towards an average. The sheet is a table because
 * that is how a coach fills it: one player per row, one critère per column,
 * tabbing across.
 */
export function EvaluationTab({
  detail,
  notify,
}: {
  detail: SeanceDetail
  notify: (msg: string) => void
}) {
  const {
    categories,
    convocations,
    evaluationGrilles,
    evaluationNotes,
    setEvaluationNote,
    clearEvaluationGrille,
  } = useData()

  const [grilleId, setGrilleId] = useState(evaluationGrilles[0]?.id ?? "")
  const [viderOpen, setViderOpen] = useState(false)

  const grille: EvaluationGrille | undefined =
    evaluationGrilles.find((g) => g.id === grilleId) ?? evaluationGrilles[0]

  // Who is scored: the convoqués if the séance has one, otherwise the joueurs
  // attached to it. The two sources carry different row types — a convocation
  // stores CategorieJoueur ids, a séance its own participants — so both are
  // flattened to the little the sheet needs.
  const joueurs: Evalue[] = useMemo(() => {
    const convocation = convocations.find((c) => c.eventId === detail.eventId)
    if (convocation) {
      const categorie = categories.find((c) => c.id === convocation.categorieId)
      return convocation.joueurs
        .map((j) => categorie?.joueurs.find((x) => x.id === j.joueurId))
        .filter((j) => !!j)
        .map((j) => ({ id: j.id, nom: j.nom, poste: j.poste, photo: j.photo }))
    }
    return detail.participants
      .filter((p) => p.kind === "joueur")
      .map((p) => ({ id: p.id, nom: p.name, poste: p.role }))
  }, [detail.eventId, detail.participants, convocations, categories])

  const noteDe = (joueurId: string, critereId: string) =>
    evaluationNotes.find(
      (n) =>
        n.seanceId === detail.eventId &&
        n.joueurId === joueurId &&
        n.critereId === critereId,
    )?.valeur

  if (!grille)
    return (
      <section className="rounded-lg border border-border">
        <EmptyState
          icon={Gauge}
          title="Aucune grille d'évaluation"
          description="Le club n'a pas encore défini de critères à noter."
        />
      </section>
    )

  if (joueurs.length === 0)
    return (
      <section className="rounded-lg border border-border">
        <EmptyState
          icon={Users}
          title="Personne à évaluer"
          description={`Aucun joueur n'est rattaché à ${detail.numero}. Faites la convocation pour retrouver ici la liste à noter.`}
        />
      </section>
    )

  const notes = grille.criteres.filter((c) => c.type === "note")
  const cellules = joueurs.length * grille.criteres.length
  const remplies = joueurs.reduce(
    (n, j) =>
      n + grille.criteres.filter((c) => noteDe(j.id, c.id) !== undefined).length,
    0,
  )

  /** A joueur's average — marks only, and only the ones actually given. */
  const moyenneDe = (joueurId: string) => {
    const donnees = notes
      .map((c) => ({ c, v: noteDe(joueurId, c.id) }))
      .filter((x) => x.v !== undefined)
    if (donnees.length === 0) return null
    const total = donnees.reduce(
      (sum, x) => sum + (x.v! / (x.c.bareme ?? 100)) * 100,
      0,
    )
    return Math.round(total / donnees.length)
  }

  return (
    <div className="flex flex-col gap-5">
      {/* The grilles the club scores against — one sheet at a time. */}
      <div className="flex flex-wrap items-center gap-2">
        {evaluationGrilles.map((g) => (
          <button
            key={g.id}
            type="button"
            aria-pressed={g.id === grille.id}
            onClick={() => setGrilleId(g.id)}
            className={cn(
              "rounded-pill border px-3.5 py-1.5 font-ui text-[0.78rem] transition-colors",
              g.id === grille.id
                ? "border-border-second bg-surface-nested text-ink"
                : "border-transparent text-ink-muted hover:text-ink",
            )}
          >
            {g.nom}
          </button>
        ))}
      </div>

      {/* What this sheet is, and how far it has been filled. */}
      <section className="flex flex-wrap items-center gap-3 rounded-lg border border-border p-4">
        <div className="min-w-0 flex-1">
          <p className="font-ui text-sm text-ink">
            <span className="font-medium tabular-nums">{remplies}</span>
            <span className="text-ink-muted tabular-nums">/{cellules}</span>{" "}
            <span className="text-ink-muted">notes saisies</span>
          </p>
          <p className="mt-0.5 font-body text-[0.78rem] text-ink-disabled">
            {grille.domaine} · {grille.criteres.length} critères ·{" "}
            {joueurs.length} joueurs
            {grille.prive ? " · évaluation privée" : ""}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          disabled={!remplies}
          onClick={() => setViderOpen(true)}
        >
          <Eraser /> Effacer la grille
        </Button>
      </section>

      {/* The sheet. The joueur column is sticky so a wide grille stays readable. */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-border">
              <th className="sticky left-0 z-10 min-w-[13rem] bg-background px-4 py-3 text-left font-ui text-[0.68rem] font-medium tracking-[0.08em] text-ink-muted uppercase">
                Joueur
              </th>
              {grille.criteres.map((c) => (
                <th
                  key={c.id}
                  title={c.libelle}
                  className="min-w-[8rem] px-3 py-3 text-left font-ui text-[0.68rem] font-medium tracking-[0.08em] text-ink-muted uppercase"
                >
                  <span className="flex items-center gap-1.5">
                    {c.nom}
                    {c.surCarte ? (
                      <Star
                        size={11}
                        aria-label="Sur la carte joueur"
                        className="shrink-0 text-ink-disabled"
                      />
                    ) : null}
                    {c.avecDocuments ? (
                      <FileText
                        size={11}
                        aria-label="Avec documents"
                        className="shrink-0 text-ink-disabled"
                      />
                    ) : null}
                  </span>
                  <span className="mt-0.5 block font-body text-[0.66rem] tracking-normal text-ink-disabled normal-case">
                    {c.type === "note" ? `sur ${c.bareme}` : c.unite}
                  </span>
                </th>
              ))}
              <th className="min-w-[6rem] px-4 py-3 text-right font-ui text-[0.68rem] font-medium tracking-[0.08em] text-ink-muted uppercase">
                Moyenne
              </th>
            </tr>
          </thead>
          <tbody>
            {joueurs.map((j) => {
              const moyenne = moyenneDe(j.id)
              return (
                <tr key={j.id} className="border-b border-border last:border-0">
                  <td className="sticky left-0 z-10 bg-background px-4 py-2">
                    <span className="flex items-center gap-2.5">
                      <Avatar name={j.nom} src={j.photo} size="sm" />
                      <span className="min-w-0">
                        <span className="block truncate font-ui text-[0.84rem] text-ink">
                          {j.nom}
                        </span>
                        <span className="block font-body text-[0.72rem] text-ink-muted">
                          {j.poste}
                        </span>
                      </span>
                    </span>
                  </td>

                  {grille.criteres.map((c) => (
                    <td key={c.id} className="px-3 py-2">
                      <CelluleNote
                        critere={c}
                        valeur={noteDe(j.id, c.id)}
                        label={`${c.nom} — ${j.nom}`}
                        onChange={(v) =>
                          setEvaluationNote(detail.eventId, j.id, c.id, v)
                        }
                      />
                    </td>
                  ))}

                  <td className="px-4 py-2 text-right">
                    {moyenne === null ? (
                      <span className="font-ui text-[0.8rem] text-ink-disabled">
                        —
                      </span>
                    ) : (
                      <span
                        className={cn(
                          "font-ui text-[0.95rem] font-medium tabular-nums",
                          tonDeNote(moyenne, 100),
                        )}
                      >
                        {moyenne}
                        <span className="text-[0.72rem] text-ink-disabled">
                          /100
                        </span>
                      </span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <p className="flex flex-wrap items-center gap-x-4 gap-y-1.5 font-body text-[0.74rem] text-ink-disabled">
        <span className="inline-flex items-center gap-1.5">
          <Star size={11} /> figure sur la carte joueur
        </span>
        <span className="inline-flex items-center gap-1.5">
          <FileText size={11} /> accepte des documents
        </span>
        <span>
          Les mesures (unités) ne comptent pas dans la moyenne — ce ne sont pas
          des notes.
        </span>
      </p>

      <ConfirmDialog
        open={viderOpen}
        onOpenChange={setViderOpen}
        title={`Effacer « ${grille.nom} » ?`}
        description={`Les ${remplies} notes saisies sur cette grille pour ${detail.numero} seront perdues. Les autres grilles ne sont pas touchées.`}
        confirmLabel="Effacer"
        onConfirm={() => {
          clearEvaluationGrille(
            detail.eventId,
            grille.criteres.map((c) => c.id),
          )
          setViderOpen(false)
          notify(`« ${grille.nom} » effacée`)
        }}
      />
    </div>
  )
}

/**
 * One score. Kept a plain number input: a coach fills a grille by tabbing, and
 * anything cleverer (a slider, a stepper) gets in the way of that.
 */
function CelluleNote({
  critere,
  valeur,
  label,
  onChange,
}: {
  critere: EvaluationCritere
  valeur: number | undefined
  label: string
  onChange: (valeur: number | null) => void
}) {
  const bareme = critere.bareme ?? 100
  return (
    <span className="relative flex items-center">
      <input
        type="number"
        inputMode="decimal"
        min={0}
        max={critere.type === "note" ? bareme : undefined}
        step={critere.type === "note" ? 1 : "any"}
        value={valeur ?? ""}
        placeholder="—"
        aria-label={label}
        onChange={(e) => {
          const brut = e.target.value
          if (brut === "") return onChange(null)
          const n = Number(brut)
          if (Number.isNaN(n)) return
          onChange(critere.type === "note" ? Math.min(Math.max(n, 0), bareme) : n)
        }}
        className={cn(
          "w-full rounded-md border border-input bg-transparent py-1.5 pr-9 pl-2.5 font-ui text-[0.84rem] tabular-nums outline-none transition-colors focus:border-border-focus",
          valeur === undefined
            ? "text-ink-disabled"
            : critere.type === "note"
              ? tonDeNote(valeur, bareme)
              : "text-ink",
          // The spinners steal width the value needs on a dense sheet.
          "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
        )}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute right-2.5 font-body text-[0.68rem] text-ink-disabled"
      >
        {critere.type === "note" ? `/${bareme}` : critere.unite}
      </span>
    </span>
  )
}
