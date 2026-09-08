import { useState } from "react"
import { Navigate, useNavigate, useParams } from "react-router-dom"
import {
  CalendarPlus,
  Check,
  Droplets,
  ListChecks,
  Package,
  Plus,
  Trash2,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { versIso } from "@/lib/calendrier"
import { useData } from "@/data/useData"
import { PageHeader } from "@/components/kit/PageHeader"
import { BackButton } from "@/components/kit/BackButton"
import { EmptyState } from "@/components/kit/EmptyState"
import { Button } from "@/components/ui/button"
import { ProcedePicker } from "@/features/planification/ProcedePicker"
import { cheminProgramme } from "@/features/pole-technique/programmationRoutes"

const labelCls =
  "font-ui text-[0.62rem] font-medium tracking-[0.1em] text-ink-disabled uppercase"
const fieldCls =
  "w-full rounded-md border border-input bg-transparent px-3.5 py-2.5 font-body text-sm text-ink outline-none transition-colors focus:border-border-focus"

/**
 * Fiche de création séance — the long form behind one line of the programme
 * annuel. The programme already knows the catégorie, the saison, the séance
 * number and the principe it works, so those are shown read-only: what the
 * coach actually decides here is when it runs, for which groupes, with what.
 */
export function SeanceCreationScreen() {
  const navigate = useNavigate()
  const { sessionId } = useParams()
  const {
    programmesAnnuels,
    categories,
    procedes,
    procedePhases,
    procedePrincipes,
    planifierSeance,
    addSeance,
  } = useData()

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

  const [groupeIds, setGroupeIds] = useState<string[]>(() =>
    categorie?.groupes[0] ? [categorie.groupes[0].id] : [],
  )
  const [date, setDate] = useState(versIso(new Date()))
  const [duree, setDuree] = useState("60")
  const [rpe, setRpe] = useState("0")
  const [effectif, setEffectif] = useState("0")
  const [brouillon, setBrouillon] = useState(true)
  const [installation, setInstallation] = useState(session?.installation ?? "")
  const [materiel, setMateriel] = useState<{ quantite: string; nom: string }[]>(
    [],
  )
  const [notes, setNotes] = useState("")
  const [procedeIds, setProcedeIds] = useState<string[]>([])
  const [hydratations, setHydratations] = useState<number[]>([])
  const [pickerOuvert, setPickerOuvert] = useState(false)

  // The line was deleted, or the URL is stale.
  if (!programme || !session || !categorie)
    return <Navigate to="/pole-technique/programmation" replace />

  const retour = cheminProgramme(programme.saison, programme.categorieId)

  const basculerGroupe = (id: string) =>
    setGroupeIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )

  const creer = () => {
    const noms = groupeIds
      .map((id) => categorie.groupes.find((g) => g.id === id)?.nom)
      .filter((n): n is string => !!n)
    if (noms.length === 0) return

    // The programme line links to one séance; a second groupe running the same
    // line gets its own séance on the calendar, unlinked from the line.
    const patch = {
      date: `${date}T18:00:00.000Z`,
      duree,
      installation: installation.trim() || undefined,
      effectif: Number(effectif) || 0,
      rpeCible: Number(rpe) || 0,
      brouillon,
      materiel: materiel
        .filter((m) => m.nom.trim())
        .map((m) => ({ quantite: Number(m.quantite) || 0, nom: m.nom.trim() })),
      procedeIds,
      notes: notes.trim() || undefined,
      hydratations: hydratations.length ? hydratations : undefined,
    }

    // The programme line can only point at one séance, so the first groupe
    // planned takes the link; the others get their own séance on the calendar
    // — same content, same day, their own attendance and convocation.
    const premier = planifierSeance(session.id, noms[0], patch)

    for (const nom of noms.slice(1))
      addSeance({
        numero: session.numero,
        categorie: programme.categorie,
        groupe: nom,
        statut: "À venir",
        principeId: session.principeId,
        special: session.special,
        securiteVerifiee: false,
        hydratationVerifiee: false,
        ...patch,
      })

    navigate(`/planification/seance/${premier}/procede`)
  }

  const procedesChoisis = procedeIds
    .map((id) => procedes.find((p) => p.id === id))
    .filter((p) => !!p)

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <div>
        <BackButton to={retour} label={`Programme · ${categorie.nom}`} />
        <PageHeader
          title="Fiche de création séance"
          subtitle={`Séance ${session.numero} du programme ${categorie.nom} · semaine ${session.semaine}`}
        />
      </div>

      {/* Général — what the programme already decided. */}
      <Section titre="Général">
        <div className="grid gap-4 sm:grid-cols-2">
          <Lecture label="Catégorie" valeur={categorie.nom} />
          <Lecture label="Saison" valeur={programme.saison} />
          <Lecture label="Séance" valeur={`Séance ${session.numero}`} />
          <Lecture label="Phase de jeu" valeur={phase?.nom ?? "—"} />
          <Lecture
            label="Principe de jeu"
            valeur={principe?.nom ?? session.special ?? "À définir"}
            large
          />
        </div>

        <div className="flex flex-col gap-2">
          <span className={labelCls}>Groupes</span>
          {categorie.groupes.length === 0 ? (
            <p className="font-body text-[0.8rem] text-ink-disabled">
              {categorie.nom} n'a pas encore de groupe.
            </p>
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                {categorie.groupes.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    aria-pressed={groupeIds.includes(g.id)}
                    onClick={() => basculerGroupe(g.id)}
                    className={cn(
                      "rounded-pill border px-3.5 py-1.5 font-ui text-[0.78rem] transition-colors",
                      groupeIds.includes(g.id)
                        ? "border-brand-blue-600/30 bg-brand-blue-600/10 text-brand-blue-600"
                        : "border-border-strong text-ink-muted hover:text-ink",
                    )}
                  >
                    {g.nom}
                  </button>
                ))}
              </div>
              <p className="font-body text-[0.75rem] text-ink-disabled">
                {groupeIds.length === 0
                  ? "Sélectionner les groupes qui jouent cette séance."
                  : "La séance est rattachée à la ligne du programme."}
              </p>
            </>
          )}
        </div>
      </Section>

      {/* Détails — what the coach decides. */}
      <Section titre="Détails">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className={labelCls}>Date</span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={fieldCls}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className={labelCls}>Durée</span>
            <span className="relative flex items-center">
              <input
                type="number"
                min={0}
                value={duree}
                onChange={(e) => setDuree(e.target.value)}
                className={cn(fieldCls, "pr-20")}
              />
              <span
                aria-hidden
                className="pointer-events-none absolute right-3.5 font-body text-[0.78rem] text-ink-disabled"
              >
                minutes
              </span>
            </span>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className={labelCls}>Intensité prévue</span>
            <input
              type="number"
              min={0}
              max={10}
              value={rpe}
              onChange={(e) => setRpe(e.target.value)}
              className={fieldCls}
            />
            <span className="font-body text-[0.75rem] text-ink-disabled">
              Effort cible selon l'échelle RPE (Rate of Perceived Exertion) de 0
              à 10.
            </span>
          </label>

          <label className="flex flex-col gap-1.5">
            <span className={labelCls}>Effectif</span>
            <input
              type="number"
              min={0}
              value={effectif}
              onChange={(e) => setEffectif(e.target.value)}
              className={fieldCls}
            />
          </label>

          <label className="flex flex-col gap-1.5 sm:col-span-2">
            <span className={labelCls}>Installation</span>
            <input
              value={installation}
              onChange={(e) => setInstallation(e.target.value)}
              placeholder="Stade de France, Terrain B…"
              className={fieldCls}
            />
          </label>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={brouillon}
          onClick={() => setBrouillon((b) => !b)}
          className={cn(
            "flex items-center gap-3 rounded-lg border p-3.5 text-left transition-colors",
            brouillon ? "border-info" : "border-border hover:border-border-strong",
          )}
        >
          <span className="min-w-0 flex-1">
            <span className="block font-ui text-[0.86rem] text-ink">
              Brouillon
            </span>
            <span className="block font-body text-[0.75rem] text-ink-muted">
              La séance reste modifiable et n'est pas annoncée aux joueurs.
            </span>
          </span>
          <span
            aria-hidden
            className={cn(
              "flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition-colors",
              brouillon ? "bg-info" : "bg-surface-nested",
            )}
          >
            <span
              className={cn(
                "size-4 rounded-full bg-ink transition-transform",
                brouillon && "translate-x-4",
              )}
            />
          </span>
        </button>
      </Section>

      {/* Matériaux. */}
      <Section
        titre="Matériaux"
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setMateriel((prev) => [...prev, { quantite: "1", nom: "" }])
            }
          >
            <Plus /> Ajouter
          </Button>
        }
      >
        {materiel.length === 0 ? (
          <div className="rounded-lg border border-border">
            <EmptyState
              icon={Package}
              title="Aucun matériel"
              description="Ajoutez le matériel à sortir pour cette séance."
            />
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {materiel.map((m, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  value={m.quantite}
                  aria-label={`Quantité ${i + 1}`}
                  onChange={(e) =>
                    setMateriel((prev) =>
                      prev.map((x, j) =>
                        j === i ? { ...x, quantite: e.target.value } : x,
                      ),
                    )
                  }
                  className={cn(fieldCls, "w-20 shrink-0")}
                />
                <input
                  value={m.nom}
                  placeholder="Coupelles, ballons, buts…"
                  aria-label={`Matériel ${i + 1}`}
                  onChange={(e) =>
                    setMateriel((prev) =>
                      prev.map((x, j) =>
                        j === i ? { ...x, nom: e.target.value } : x,
                      ),
                    )
                  }
                  className={fieldCls}
                />
                <button
                  type="button"
                  aria-label={`Retirer le matériel ${i + 1}`}
                  onClick={() =>
                    setMateriel((prev) => prev.filter((_, j) => j !== i))
                  }
                  className="shrink-0 text-ink-disabled transition-colors hover:text-danger"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Notes. */}
      <Section titre="Notes">
        <label className="flex flex-col gap-1.5">
          <span className={labelCls}>Explication</span>
          <textarea
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ce que la séance doit produire, les consignes clés, les points de vigilance…"
            className={cn(fieldCls, "resize-y")}
          />
        </label>
      </Section>

      {/* Procédés & périodes d'hydratation. */}
      <Section
        titre="Procédés & périodes d'hydratation"
        action={
          <Button variant="outline" size="sm" onClick={() => setPickerOuvert(true)}>
            <Plus /> Ajouter des procédés
          </Button>
        }
      >
        {procedesChoisis.length === 0 ? (
          <div className="rounded-lg border border-border">
            <EmptyState
              icon={ListChecks}
              title="Veuillez ajouter des procédés"
              description="Le déroulé de la séance : les exercices, dans l'ordre, et les pauses hydratation entre eux."
            />
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {procedesChoisis.map((p, i) => (
              <div key={`${p.id}-${i}`} className="flex flex-col gap-2">
                <div className="flex items-center gap-3 rounded-lg border border-border p-3">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-surface-nested font-ui text-[0.72rem] text-ink-muted">
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-ui text-[0.86rem] text-ink">
                      {p.titre}
                    </span>
                    <span className="block font-body text-[0.74rem] text-ink-muted">
                      {p.type} · {p.duree} min · {p.sequence}
                    </span>
                  </span>
                  <button
                    type="button"
                    aria-label={`Retirer ${p.titre}`}
                    onClick={() =>
                      setProcedeIds((prev) => prev.filter((_, j) => j !== i))
                    }
                    className="shrink-0 text-ink-disabled transition-colors hover:text-danger"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                {/* A drinks break sits between two procédés, never after the last. */}
                {i < procedesChoisis.length - 1 ? (
                  <button
                    type="button"
                    aria-pressed={hydratations.includes(i)}
                    onClick={() =>
                      setHydratations((prev) =>
                        prev.includes(i)
                          ? prev.filter((x) => x !== i)
                          : [...prev, i].sort((a, b) => a - b),
                      )
                    }
                    className={cn(
                      "mx-auto inline-flex items-center gap-1.5 rounded-pill border px-3 py-1 font-ui text-[0.72rem] transition-colors",
                      hydratations.includes(i)
                        ? "border-info/30 bg-info/10 text-info"
                        : "border-dashed border-border text-ink-disabled hover:text-ink-muted",
                    )}
                  >
                    <Droplets size={12} />
                    {hydratations.includes(i)
                      ? "Pause hydratation"
                      : "Ajouter une pause"}
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* The one action, kept in view at the bottom of a long form. */}
      <div className="sticky bottom-0 flex flex-wrap items-center gap-3 rounded-lg border border-border bg-surface p-4">
        <p className="min-w-0 flex-1 font-body text-[0.8rem] text-ink-muted">
          {groupeIds.length === 0
            ? "Sélectionnez au moins un groupe pour créer la séance."
            : `${procedesChoisis.length} procédé${procedesChoisis.length > 1 ? "s" : ""} · ${duree} min · RPE ${rpe}`}
        </p>
        <Button variant="ghost" onClick={() => navigate(retour)}>
          Annuler
        </Button>
        <Button onClick={creer} disabled={groupeIds.length === 0}>
          <CalendarPlus /> Créer la séance
        </Button>
      </div>

      {pickerOuvert ? (
        <ProcedePicker
          seanceLabel={`Séance ${session.numero}`}
          dejaProgrammes={procedeIds}
          onClose={() => setPickerOuvert(false)}
          onAdd={(ajoutes) => {
            setProcedeIds((prev) => [
              ...prev,
              // A picked procédé is a copy; its `procedeId` points back at the
              // library row, which is what a SeanceClub stores.
              ...ajoutes
                .map((p) => p.procedeId)
                .filter((id): id is string => !!id),
            ])
            setPickerOuvert(false)
          }}
        />
      ) : null}
    </div>
  )
}

/* ── Bits ─────────────────────────────────────────────────────────────────── */

function Section({
  titre,
  action,
  children,
}: {
  titre: string
  action?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="flex flex-col gap-4 rounded-lg border border-border p-5">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="min-w-0 flex-1 font-ui text-[0.95rem] font-medium text-ink">
          {titre}
        </h2>
        {action}
      </div>
      {children}
    </section>
  )
}

/** A value the programme already decided — shown, not asked. */
function Lecture({
  label,
  valeur,
  large,
}: {
  label: string
  valeur: string
  large?: boolean
}) {
  return (
    <div className={cn("flex flex-col gap-1", large && "sm:col-span-2")}>
      <span className={labelCls}>{label}</span>
      <span className="flex items-center gap-2 rounded-md border border-border bg-surface-nested px-3.5 py-2.5 font-body text-sm text-ink-subtle">
        <Check size={13} className="shrink-0 text-ink-disabled" />
        {valeur}
      </span>
    </div>
  )
}
