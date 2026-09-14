import { useState } from "react"
import { Navigate, useNavigate, useParams } from "react-router-dom"
import {
  ArrowRight,
  CalendarPlus,
  Check,
  ChevronDown,
  Droplets,
  ListChecks,
  Package,
  Pencil,
  Plus,
  Trash2,
  Users,
  X,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { versIso } from "@/lib/calendrier"
import { useData } from "@/data/useData"
import type { ProcedeAtelier } from "@/data/seed/seances"
import { PageHeader } from "@/components/kit/PageHeader"
import { BackButton } from "@/components/kit/BackButton"
import { EmptyState } from "@/components/kit/EmptyState"
import { Steps } from "@/components/kit/Steps"
import { Toast, useToast } from "@/components/kit/Toast"
import { Button } from "@/components/ui/button"
import { materiauParNom } from "@/data/seed/materiaux"
import { hexCouleur } from "@/features/planification/atelierCouleurs"
import { GroupesJoueurs } from "@/features/planification/GroupesJoueurs"
import { ProcedeVignette } from "@/features/planification/ProcedeVignette"
import { ProcedePicker } from "@/features/planification/ProcedePicker"
import { MaterielPicker } from "@/features/pole-technique/MaterielPicker"
import { cheminProgramme } from "@/features/pole-technique/programmationRoutes"

const labelCls =
  "font-ui text-[0.62rem] font-medium tracking-[0.1em] text-ink-disabled uppercase"
const fieldCls =
  "w-full rounded-md border border-input bg-transparent px-3.5 py-2.5 font-body text-sm text-ink outline-none transition-colors focus:border-border-focus"

/**
 * Three steps: the séance is described (who, when, how hard), prepared (what
 * comes out of the caisse, what the coach wants to say), then built exercise by
 * exercise. The déroulé is where a coach spends his time, so it gets a step of
 * its own instead of being the tail of a form nobody scrolls to.
 */
const ETAPES = ["Général", "Préparation", "Déroulé"]

/**
 * One line of the déroulé: the exercise, how the squad is split *for it*, and
 * the drinks break that follows it. The row carries its own key because the
 * same library procédé can legitimately be run twice in one séance.
 */
type LigneProcede = {
  cle: string
  procedeId: string
  ateliers: ProcedeAtelier[]
  /** Minutes of drinks break after this procédé — absent = no break. */
  pause?: number
}

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
  const [lignes, setLignes] = useState<LigneProcede[]>([])
  /** Which procédé has its groups open — one at a time keeps the form legible. */
  const [groupesOuverts, setGroupesOuverts] = useState<string | null>(null)
  const [etape, setEtape] = useState(1)
  const [pickerOuvert, setPickerOuvert] = useState(false)
  const { toast, notify } = useToast()
  const [materielOuvert, setMaterielOuvert] = useState(false)

  // The line was deleted, or the URL is stale.
  if (!programme || !session || !categorie)
    return <Navigate to="/pole-technique/programmation" replace />

  const retour = cheminProgramme(programme.saison, programme.categorieId)

  // Le vivier : les joueurs des groupes cochés ci-dessus. C'est lui qu'on
  // répartit en groupes de travail (chasubles) plus bas.
  const roster = categorie.joueurs
    .filter((j) => groupeIds.includes(j.groupeId))
    .map((j) => ({ id: j.id, nom: j.nom, poste: j.poste, photo: j.photo }))

  const basculerGroupe = (id: string) => {
    const suite = groupeIds.includes(id)
      ? groupeIds.filter((x) => x !== id)
      : [...groupeIds, id]
    setGroupeIds(suite)

    // Décocher un groupe sort ses joueurs de l'effectif : ils ne peuvent pas
    // rester dans une chasuble.
    const vivier = new Set(
      categorie.joueurs.filter((j) => suite.includes(j.groupeId)).map((j) => j.id),
    )
    setLignes((prev) =>
      prev.map((l) => ({
        ...l,
        ateliers: l.ateliers.map((g) => ({
          ...g,
          joueurIds: g.joueurIds.filter((x) => vivier.has(x)),
        })),
      })),
    )
  }

  const majLigne = (cle: string, p: Partial<LigneProcede>) =>
    setLignes((prev) => prev.map((l) => (l.cle === cle ? { ...l, ...p } : l)))

  /** Ce que l'étape courante a retenu — lu juste avant de passer à la suite. */
  const resumeEtape = () => {
    if (etape === 1)
      return groupeIds.length === 0
        ? "Sélectionnez au moins un groupe pour continuer."
        : `${roster.length} joueurs · ${duree} min · RPE ${rpe}`
    if (etape === 2) {
      const lignesMateriel = materiel.filter((m) => m.nom.trim()).length
      return `${lignesMateriel} matériel${lignesMateriel > 1 ? "s" : ""} · ${
        notes.trim() ? "notes renseignées" : "aucune note"
      }`
    }
    const pauses = lignes.filter((l) => l.pause).length
    return deroule.length === 0
      ? "Ajoutez des procédés, ou créez la séance et construisez-la plus tard."
      : `${deroule.length} procédé${deroule.length > 1 ? "s" : ""} · ${pauses} pause${pauses > 1 ? "s" : ""}`
  }

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
      procedeIds: lignes.map((l) => l.procedeId),
      notes: notes.trim() || undefined,
      hydratations: lignes.flatMap((l, i) =>
        l.pause ? [{ apres: i, duree: l.pause }] : [],
      ),
      // Positional: one bucket of chasubles per procédé of the déroulé.
      ateliersParProcede: lignes.some((l) => l.ateliers.length)
        ? lignes.map((l) => l.ateliers)
        : undefined,
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

  // Le déroulé résolu : chaque ligne avec le procédé de la bibliothèque
  // qu'elle désigne (une ligne orpheline — procédé supprimé — disparaît).
  const deroule = lignes.flatMap((ligne) => {
    const procede = procedes.find((p) => p.id === ligne.procedeId)
    return procede ? [{ ligne, procede }] : []
  })

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <div>
        <BackButton to={retour} label={`Programme · ${categorie.nom}`} />
        <PageHeader
          title="Fiche de création séance"
          subtitle={`Séance ${session.numero} du programme ${categorie.nom} · semaine ${session.semaine}`}
        />
        <div className="mt-5">
          <Steps steps={ETAPES} current={etape} onSelect={setEtape} />
        </div>
      </div>

      {etape === 1 ? (
        <>
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
        </>
      ) : null}

      {etape === 2 ? (
        <>
        {/* Matériaux — pris dans la caisse, pas saisis à la main. */}
        <Section
          titre="Matériaux"
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMaterielOuvert(true)}
            >
              {materiel.length === 0 ? <Plus /> : <Pencil />}
              {materiel.length === 0 ? "Ajouter" : "Modifier"}
            </Button>
          }
        >
          {materiel.length === 0 ? (
            <div className="rounded-lg border border-border">
              <EmptyState
                icon={Package}
                title="Aucun matériel"
                description="Ajoutez le matériel à sortir pour cette séance."
                action={
                  <Button variant="outline" onClick={() => setMaterielOuvert(true)}>
                    <Plus /> Ouvrir la caisse
                  </Button>
                }
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {materiel.map((m, i) => {
                const ref = materiauParNom(m.nom)
                return (
                  <div
                    key={m.nom}
                    className="group relative flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:border-border-strong"
                  >
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-md border border-border bg-surface-nested">
                      {ref ? (
                        <img
                          src={ref.svg}
                          alt=""
                          aria-hidden
                          className="max-h-8 max-w-[70%] object-contain"
                        />
                      ) : (
                        <Package size={16} className="text-ink-disabled" />
                      )}
                    </span>

                    <span className="flex min-w-0 flex-col gap-1">
                      <span className="truncate font-ui text-[0.78rem] text-ink">
                        {m.nom}
                      </span>
                      <input
                        type="number"
                        min={0}
                        value={m.quantite}
                        aria-label={`Quantité — ${m.nom}`}
                        onFocus={(e) => e.currentTarget.select()}
                        onChange={(e) =>
                          setMateriel((prev) =>
                            prev.map((x, j) =>
                              j === i ? { ...x, quantite: e.target.value } : x,
                            ),
                          )
                        }
                        className={cn(fieldCls, "w-20 px-2.5 py-1 text-center")}
                      />
                    </span>

                    <button
                      type="button"
                      aria-label={`Retirer ${m.nom}`}
                      onClick={() =>
                        setMateriel((prev) => prev.filter((_, j) => j !== i))
                      }
                      className="absolute top-2 right-2 text-ink-disabled opacity-0 transition-opacity group-hover:opacity-100 hover:text-danger focus-visible:opacity-100"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )
              })}
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
        </>
      ) : null}

      {etape === 3 ? (
        <>
        {/* Déroulé — les exercices dans l'ordre, leurs chasubles, les pauses. */}
        <Section
          titre="Déroulé de la séance"
          action={
            <Button variant="outline" size="sm" onClick={() => setPickerOuvert(true)}>
              <Plus /> Ajouter des procédés
            </Button>
          }
        >
          {deroule.length === 0 ? (
            <div className="rounded-lg border border-border">
              <EmptyState
                icon={ListChecks}
                title="Veuillez ajouter des procédés"
                description="Les exercices dans l'ordre, avec leurs groupes de joueurs et les pauses hydratation entre eux."
              />
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {deroule.map(({ ligne, procede }, i) => {
                const ouvert = groupesOuverts === ligne.cle
                const places = new Set(ligne.ateliers.flatMap((a) => a.joueurIds))
                return (
                  <div key={ligne.cle} className="flex flex-col gap-2">
                    <div
                      className={cn(
                        "flex flex-col rounded-lg border transition-colors",
                        ouvert ? "border-border-strong" : "border-border",
                      )}
                    >
                      <div className="flex items-center gap-3 p-3">
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-surface-nested font-ui text-[0.72rem] text-ink-muted">
                          {i + 1}
                        </span>
                        <ProcedeVignette
                          src={procede.image}
                          titre={procede.titre}
                          className="h-12 w-16"
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-ui text-[0.86rem] text-ink">
                            {procede.titre}
                          </span>
                          <span className="block font-body text-[0.74rem] text-ink-muted">
                            {procede.type} · {procede.duree} min · {procede.sequence}
                          </span>
                          {/* Les chasubles de CE procédé, lisibles replié. */}
                          <span className="mt-1 flex items-center gap-1.5 font-body text-[0.72rem] text-ink-disabled">
                            {ligne.ateliers.length === 0 ? (
                              "Tout le monde ensemble"
                            ) : (
                              <>
                                <span aria-hidden className="flex items-center gap-1">
                                  {ligne.ateliers.map((a) => (
                                    <span
                                      key={a.id}
                                      className="size-2.5 rounded-full ring-1 ring-white/15"
                                      style={{ backgroundColor: hexCouleur(a.couleur) }}
                                    />
                                  ))}
                                </span>
                                {ligne.ateliers.length} groupe
                                {ligne.ateliers.length > 1 ? "s" : ""} ·{" "}
                                {places.size}/{roster.length} placés
                              </>
                            )}
                          </span>
                        </span>

                        <Button
                          variant="ghost"
                          size="sm"
                          aria-expanded={ouvert}
                          className="shrink-0"
                          onClick={() =>
                            setGroupesOuverts((c) =>
                              c === ligne.cle ? null : ligne.cle,
                            )
                          }
                        >
                          <Users /> Groupes
                          <ChevronDown
                            size={14}
                            className={cn(
                              "transition-transform",
                              ouvert && "rotate-180",
                            )}
                          />
                        </Button>
                        <button
                          type="button"
                          aria-label={`Retirer ${procede.titre}`}
                          onClick={() =>
                            setLignes((prev) =>
                              prev.filter((l) => l.cle !== ligne.cle),
                            )
                          }
                          className="shrink-0 text-ink-disabled transition-colors hover:text-danger"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>

                      {ouvert ? (
                        <div className="border-t border-border p-3.5">
                          {roster.length === 0 ? (
                            <p className="font-body text-[0.78rem] text-ink-disabled">
                              Cochez d'abord un groupe dans « Général » : ses
                              joueurs forment l'effectif à répartir.
                            </p>
                          ) : (
                            <GroupesJoueurs
                              roster={roster}
                              groupes={ligne.ateliers}
                              onChange={(suite) =>
                                majLigne(ligne.cle, { ateliers: suite })
                              }
                              notify={notify}
                              aide="sur ce procédé"
                              vide={{
                                titre: "Aucun groupe",
                                description:
                                  "Sans groupe, tout le monde travaille ensemble sur ce procédé.",
                              }}
                            />
                          )}
                        </div>
                      ) : null}
                    </div>

                    {/* Une pause se glisse entre deux procédés, jamais après le dernier. */}
                    {i < deroule.length - 1 ? (
                      ligne.pause === undefined ? (
                        <button
                          type="button"
                          onClick={() => majLigne(ligne.cle, { pause: 3 })}
                          className="mx-auto inline-flex items-center gap-1.5 rounded-pill border border-dashed border-border px-3 py-1 font-ui text-[0.72rem] text-ink-disabled transition-colors hover:border-info/40 hover:text-info"
                        >
                          <Droplets size={12} /> Ajouter une pause
                        </button>
                      ) : (
                        <span className="mx-auto inline-flex items-center gap-1.5 rounded-pill border border-info/30 bg-info/10 py-1 pr-1.5 pl-3 font-ui text-[0.72rem] text-info">
                          <Droplets size={12} />
                          Pause hydratation
                          <input
                            type="number"
                            min={1}
                            max={30}
                            value={ligne.pause}
                            aria-label={`Durée de la pause après ${procede.titre}, en minutes`}
                            onChange={(e) =>
                              majLigne(ligne.cle, {
                                pause: Math.min(
                                  30,
                                  Math.max(1, Number(e.target.value) || 1),
                                ),
                              })
                            }
                            className="w-11 rounded-sm border border-info/30 bg-transparent px-1 py-0.5 text-center font-ui text-[0.72rem] tabular-nums outline-none transition-colors focus:border-border-focus"
                          />
                          min
                          <button
                            type="button"
                            aria-label={`Retirer la pause après ${procede.titre}`}
                            onClick={() => majLigne(ligne.cle, { pause: undefined })}
                            className="opacity-60 transition-opacity hover:opacity-100"
                          >
                            <X size={12} />
                          </button>
                        </span>
                      )
                    ) : null}
                  </div>
                )
              })}
            </div>
          )}
        </Section>
        </>
      ) : null}

      {/* Navigation de l'étape, gardée en vue au bas d'un formulaire long. */}
      <div className="sticky bottom-0 flex flex-wrap items-center gap-3 rounded-lg border border-border bg-surface p-4">
        <p className="min-w-0 flex-1 font-body text-[0.8rem] text-ink-muted">
          {resumeEtape()}
        </p>
        <Button
          variant="ghost"
          onClick={() =>
            etape === 1 ? navigate(retour) : setEtape((e) => e - 1)
          }
        >
          {etape === 1 ? "Annuler" : "Précédent"}
        </Button>
        {etape < ETAPES.length ? (
          <Button
            onClick={() => setEtape((e) => e + 1)}
            // Sans groupe, il n'y a pas d'effectif à répartir ensuite.
            disabled={groupeIds.length === 0}
          >
            Continuer <ArrowRight />
          </Button>
        ) : (
          <Button onClick={creer} disabled={groupeIds.length === 0}>
            <CalendarPlus /> Créer la séance
          </Button>
        )}
      </div>

      {materielOuvert ? (
        <MaterielPicker
          lignes={materiel}
          onClose={() => setMaterielOuvert(false)}
          onValider={setMateriel}
        />
      ) : null}

      <Toast toast={toast} />

      {pickerOuvert ? (
        <ProcedePicker
          seanceLabel={`Séance ${session.numero}`}
          dejaProgrammes={lignes.map((l) => l.procedeId)}
          onClose={() => setPickerOuvert(false)}
          onAdd={(ajoutes) => {
            // A picked procédé is a copy; its `procedeId` points back at the
            // library row, which is what a SeanceClub stores.
            const nouvelles = ajoutes.flatMap((p) =>
              p.procedeId
                ? [
                    {
                      cle: crypto.randomUUID(),
                      procedeId: p.procedeId,
                      ateliers: [],
                    },
                  ]
                : [],
            )
            setLignes((prev) => [...prev, ...nouvelles])
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
