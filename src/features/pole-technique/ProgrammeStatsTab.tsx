import { useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  BarChart3,
  CheckCircle2,
  CircleDashed,
  Minus,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { useData } from "@/data/useData"
import type { ProgSession, SeanceClub } from "@/data/seed/programmation"
import { EmptyState } from "@/components/kit/EmptyState"
import { Segmented } from "@/features/budget/ui"
import { useProgramme } from "@/features/pole-technique/useProgramme"

type Portee = "groupe" | "club"

/** Rows drawn at once. "Tout le club" is thousands of séances — a season plan
 *  per groupe — so the table grows on demand instead of freezing the tab. */
const PAR_PAGE = 100

/** One row of the table: a programme slot, plus the séance realising it. */
type Ligne = {
  id: string
  numero: number
  semaine: number
  categorie: string
  groupe: string
  seance: SeanceClub | null
  procedes: string[]
}

/**
 * Where the season stands. Four numbers answer "what is left to do", and the
 * table below them answers "on which séance" — a séance is only really finished
 * once it has been run, debriefed and rated, so the three follow-up columns are
 * read as one line.
 */
export function ProgrammeStatsTab() {
  const navigate = useNavigate()
  const { categorie, programme } = useProgramme()
  const { programmesAnnuels, seancesClub, procedes } = useData()
  const [portee, setPortee] = useState<Portee>("groupe")
  const [affichees, setAffichees] = useState(PAR_PAGE)

  const nomProcede = (id: string) =>
    procedes.find((p) => p.id === id)?.titre ?? "Procédé"

  const seanceById = new Map(seancesClub.map((s) => [s.id, s]))

  // A programme line has no groupe of its own — the groupe is decided when the
  // line is planned, so an unplanned row reads "—".
  const ligneDe = (s: ProgSession, cat: string): Ligne => {
    const seance = s.seanceId ? (seanceById.get(s.seanceId) ?? null) : null
    return {
      id: s.id,
      numero: s.numero,
      semaine: s.semaine,
      categorie: cat,
      groupe: seance?.groupe ?? "—",
      seance,
      procedes: (seance?.procedeIds ?? []).map(nomProcede),
    }
  }

  // "Cette équipe" is the programme in front of you; "Tout le club" is the same
  // season across every équipe — which is what makes the two first columns
  // worth reading.
  const lignes: Ligne[] =
    portee === "groupe"
      ? (programme?.sessions ?? []).map((s) => ligneDe(s, categorie?.nom ?? ""))
      : programmesAnnuels
          .filter((p) => p.saison === programme?.saison)
          .flatMap((p) => p.sessions.map((s) => ligneDe(s, p.categorie)))

  const aPlanifier = lignes.filter((l) => !l.seance).length
  const terminees = lignes.filter((l) => l.seance?.statut === "Terminée").length
  const evaluees = lignes.filter((l) => l.seance?.evaluationFaite).length
  const notees = lignes.filter((l) => l.seance?.performanceFaite).length

  if (!programme)
    return (
      <div className="rounded-lg border border-border">
        <EmptyState
          icon={BarChart3}
          title="Pas encore de chiffres"
          description="Les statistiques suivent le programme annuel : créez-le d'abord."
        />
      </div>
    )

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <Segmented
          value={portee}
          onChange={(p) => {
            setPortee(p)
            setAffichees(PAR_PAGE)
          }}
          options={[
            { value: "groupe", label: "Cette équipe" },
            { value: "club", label: "Tout le club" },
          ]}
        />
        <p className="ml-auto font-body text-sm text-ink-muted">
          <span className="text-ink">{lignes.length}</span> séance
          {lignes.length > 1 ? "s" : ""} au programme
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Chiffre
          valeur={aPlanifier}
          total={lignes.length}
          label="À planifier"
          ton={aPlanifier ? "warning" : "neutre"}
        />
        <Chiffre
          valeur={terminees}
          total={lignes.length}
          label="Séances terminées"
        />
        <Chiffre valeur={evaluees} total={terminees} label="Évaluées" />
        <Chiffre valeur={notees} total={terminees} label="Performances notées" />
      </div>

      {lignes.length === 0 ? (
        <div className="rounded-lg border border-border">
          <EmptyState
            icon={BarChart3}
            title="Aucune séance"
            description="Ce programme ne contient encore aucune séance."
          />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[52rem] border-collapse">
            <thead>
              <tr className="border-b border-border">
                <Th className="w-20">Séance</Th>
                <Th>Catégorie</Th>
                <Th>Groupe</Th>
                <Th>Liste des procédés</Th>
                <Th className="w-28 text-center">Terminée</Th>
                <Th className="w-28 text-center">Évaluation</Th>
                <Th className="w-28 text-center">Performance</Th>
              </tr>
            </thead>
            <tbody>
              {lignes.slice(0, affichees).map((l) => (
                <tr
                  key={l.id}
                  onClick={() =>
                    l.seance && navigate(`/pole-technique/seances/${l.seance.id}`)
                  }
                  className={cn(
                    "border-b border-border last:border-0 transition-colors",
                    l.seance && "cursor-pointer hover:bg-surface-hover",
                  )}
                >
                  <Td className="font-ui text-ink">
                    S{l.numero}
                    <span className="ml-1.5 text-[0.72rem] text-ink-disabled">
                      sem {l.semaine}
                    </span>
                  </Td>
                  <Td className="whitespace-nowrap">{l.categorie}</Td>
                  <Td className="whitespace-nowrap">{l.groupe}</Td>
                  <Td>
                    {!l.seance ? (
                      <span className="text-ink-disabled">Non planifiée</span>
                    ) : l.procedes.length === 0 ? (
                      <span className="text-ink-disabled">Aucun procédé</span>
                    ) : (
                      <span className="flex flex-wrap gap-1.5">
                        {l.procedes.map((nom, i) => (
                          <span
                            key={`${l.id}-${i}`}
                            className="rounded-pill border border-brand-blue-600/30 bg-brand-blue-600/10 px-2 py-0.5 font-ui text-[0.68rem] text-brand-blue-600"
                          >
                            {nom}
                          </span>
                        ))}
                      </span>
                    )}
                  </Td>
                  <Td className="text-center">
                    <Etat
                      fait={l.seance?.statut === "Terminée"}
                      absent={!l.seance}
                    />
                  </Td>
                  <Td className="text-center">
                    <Etat
                      fait={!!l.seance?.evaluationFaite}
                      absent={!l.seance}
                    />
                  </Td>
                  <Td className="text-center">
                    <Etat
                      fait={!!l.seance?.performanceFaite}
                      absent={!l.seance}
                    />
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {lignes.length > affichees ? (
        <button
          type="button"
          onClick={() => setAffichees((n) => n + PAR_PAGE)}
          className="self-center font-ui text-[0.76rem] font-medium tracking-[0.04em] text-info uppercase transition-colors hover:text-ink"
        >
          Afficher plus ({affichees} / {lignes.length})
        </button>
      ) : null}
    </div>
  )
}

/* ── Bits ─────────────────────────────────────────────────────────────────── */

function Chiffre({
  valeur,
  total,
  label,
  ton = "neutre",
}: {
  valeur: number
  total: number
  label: string
  ton?: "neutre" | "warning"
}) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-border p-4">
      <span className="flex items-baseline gap-1.5">
        <span
          className={cn(
            "font-display text-2xl font-semibold",
            ton === "warning" ? "text-warning" : "text-ink",
          )}
        >
          {valeur}
        </span>
        <span className="font-body text-[0.8rem] text-ink-disabled">
          / {total}
        </span>
      </span>
      <span className="font-ui text-[0.74rem] text-ink-muted">{label}</span>
    </div>
  )
}

/** Done, not done, or not applicable because the séance doesn't exist yet. */
function Etat({ fait, absent }: { fait: boolean; absent: boolean }) {
  if (absent)
    return (
      <span title="Séance non planifiée">
        <Minus size={15} className="mx-auto text-ink-disabled" aria-hidden />
        <span className="sr-only">Sans objet</span>
      </span>
    )
  return fait ? (
    <span title="Fait">
      <CheckCircle2 size={16} className="mx-auto text-success" aria-hidden />
      <span className="sr-only">Fait</span>
    </span>
  ) : (
    <span title="Pas encore">
      <CircleDashed size={16} className="mx-auto text-ink-disabled" aria-hidden />
      <span className="sr-only">Pas encore</span>
    </span>
  )
}

function Th({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <th
      className={cn(
        "px-4 py-3 text-left font-ui text-[0.68rem] font-medium tracking-[0.08em] text-ink-muted uppercase",
        className,
      )}
    >
      {children}
    </th>
  )
}

function Td({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <td
      className={cn(
        "px-4 py-3 align-middle font-body text-[0.82rem] text-ink-subtle",
        className,
      )}
    >
      {children}
    </td>
  )
}
