import { useState, type ReactNode } from "react"
import { Navigate, useLocation, useNavigate, useParams } from "react-router-dom"
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Check,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { useData } from "@/data/useData"
import {
  ECHELLES_PRESET,
  ECHELLE_PERSONNALISEE,
  PARTAGE_PAR_DEFAUT_MODELE,
  aujourdhuiIso,
  bornesTotal,
  echelleVide,
  valeursEchelle,
  type Echelle,
  type IntervalleScore,
  type ModeleQuestionnaire,
  type QuestionModele,
  type TonScore,
} from "@/data/seed/performances"
import { BackButton } from "@/components/kit/BackButton"
import { EmptyState } from "@/components/kit/EmptyState"
import { Button } from "@/components/ui/button"
import { LinkBtn } from "@/features/budget/ui"
import { saisonDepuisSlug } from "@/features/pole-technique/programmationRoutes"
import {
  RACINE_PERFORMANCES,
  cheminModele,
  cheminSaisonPerf,
} from "@/features/performances/performancesRoutes"
import {
  EchelleSaisie,
} from "@/features/performances/performancesUi"
import {
  TON_LIBELLE,
  TON_TEXTE,
  fieldCls,
  overlineCls,
} from "@/features/performances/performancesHelpers"
import { Regle } from "@/features/performances/ModeleDetailScreen"

type Brouillon = Omit<ModeleQuestionnaire, "id">

/**
 * Create or edit a modèle. The whole modèle is a local draft: nothing reaches
 * the store until "Enregistrer", so "Annuler" really cancels. The three
 * blocks mirror the detail page — échelle, analyse, questions — and each one
 * checks itself live (a gap in the analyse, a question left blank).
 */
export function ModeleEditeurScreen() {
  const { saison: slug = "", id } = useParams()
  const { state } = useLocation() as { state: { nom?: string } | null }
  const { saisons, modelesQuestionnaire, session } = useData()
  const saison = saisonDepuisSlug(slug, saisons)
  if (!saison) return <Navigate to={RACINE_PERFORMANCES} replace />

  if (id) {
    const modele = modelesQuestionnaire.find((m) => m.id === id)
    if (!modele) return <Navigate to={cheminSaisonPerf(saison)} replace />
    const initial: Partial<ModeleQuestionnaire> = structuredClone(modele)
    delete initial.id
    return (
      <Editeur
        key={modele.id}
        saison={saison}
        modeleId={modele.id}
        initial={initial as Brouillon}
      />
    )
  }

  return (
    <Editeur
      saison={saison}
      initial={{
        nom: state?.nom ?? "Nouveau modèle",
        creeLe: aujourdhuiIso(),
        auteur: session?.name ?? "Staff technique",
        echelle: echelleVide(),
        intervalles: [],
        questions: [{ id: crypto.randomUUID(), texte: "" }],
        partage: PARTAGE_PAR_DEFAUT_MODELE,
      }}
    />
  )
}

function Editeur({
  saison,
  modeleId,
  initial,
}: {
  saison: string
  modeleId?: string
  initial: Brouillon
}) {
  const navigate = useNavigate()
  const { addModeleQuestionnaire, updateModeleQuestionnaire } = useData()
  const [b, setB] = useState<Brouillon>(initial)
  const [editNom, setEditNom] = useState(false)

  const patch = (p: Partial<Brouillon>) => setB((prev) => ({ ...prev, ...p }))
  const patchEchelle = (p: Partial<Echelle>) =>
    setB((prev) => ({
      ...prev,
      echelle: { ...prev.echelle, ...p, nom: ECHELLE_PERSONNALISEE },
    }))

  const retour = modeleId
    ? cheminModele(saison, modeleId)
    : cheminSaisonPerf(saison)

  /* ── Checks ── */
  const echelleOk =
    b.echelle.max > b.echelle.min &&
    b.echelle.pas > 0 &&
    valeursEchelle(b.echelle).length >= 2
  const questionsOk =
    b.questions.length > 0 && b.questions.every((q) => q.texte.trim())
  const problemes = problemesAnalyse(b)
  const bloquants = [
    !b.nom.trim() && "Le modèle n'a pas de nom.",
    !echelleOk && "L'échelle est incomplète (maximum > minimum, pas > 0).",
    !questionsOk && "Chaque question doit avoir un texte.",
  ].filter(Boolean) as string[]

  const enregistrer = () => {
    if (bloquants.length) return
    const propre: Brouillon = {
      ...b,
      nom: b.nom.trim(),
      questions: b.questions.map((q) => ({ ...q, texte: q.texte.trim() })),
      intervalles: [...b.intervalles]
        .map((i) => ({ ...i, libelle: i.libelle.trim() || "Sans nom" }))
        .sort((x, y) => x.min - y.min),
    }
    if (modeleId) {
      updateModeleQuestionnaire(modeleId, propre)
      navigate(cheminModele(saison, modeleId), {
        state: { toast: "Modèle mis à jour." },
      })
    } else {
      const id = addModeleQuestionnaire(propre)
      navigate(cheminModele(saison, id), {
        state: { toast: `Modèle « ${propre.nom} » créé.` },
      })
    }
  }

  /* ── Intervalles ── */
  const bornes = bornesTotal(b)
  const ajouterIntervalle = () => {
    const dernier = [...b.intervalles].sort((x, y) => x.max - y.max).at(-1)
    const debut = dernier ? Math.min(bornes.max, dernier.max + 1) : bornes.min
    const fin = Math.min(bornes.max, debut + Math.max(1, Math.round((bornes.max - bornes.min) / 4)))
    patch({
      intervalles: [
        ...b.intervalles,
        { id: crypto.randomUUID(), min: debut, max: fin, libelle: "", ton: "moyen" },
      ],
    })
  }
  const majIntervalle = (id: string, p: Partial<IntervalleScore>) =>
    patch({
      intervalles: b.intervalles.map((i) => (i.id === id ? { ...i, ...p } : i)),
    })

  /* ── Questions ── */
  const majQuestion = (id: string, p: Partial<QuestionModele>) =>
    patch({ questions: b.questions.map((q) => (q.id === id ? { ...q, ...p } : q)) })
  const deplacer = (index: number, dir: -1 | 1) => {
    const to = index + dir
    if (to < 0 || to >= b.questions.length) return
    const qs = [...b.questions]
    ;[qs[index], qs[to]] = [qs[to], qs[index]]
    patch({ questions: qs })
  }

  const valeurs = valeursEchelle(b.echelle)

  return (
    <div className="flex flex-col gap-8 pb-4">
      <div>
        <BackButton to={retour} label="Annuler et revenir" />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <span className={overlineCls}>
              {modeleId ? "Modifier le modèle" : "Nouveau modèle"}
            </span>
            {editNom ? (
              <input
                autoFocus
                value={b.nom}
                onChange={(e) => patch({ nom: e.target.value })}
                onBlur={() => setEditNom(false)}
                onKeyDown={(e) => e.key === "Enter" && setEditNom(false)}
                aria-label="Nom du modèle"
                className="w-full max-w-xl rounded-md border border-input bg-transparent px-3 py-1.5 font-ui text-2xl font-semibold text-ink outline-none focus:border-border-focus"
              />
            ) : (
              <button
                type="button"
                onClick={() => setEditNom(true)}
                className="group flex max-w-full items-center gap-2.5 text-left"
              >
                <h1 className="truncate font-ui text-2xl font-semibold text-ink">
                  {b.nom || "Sans nom"}
                </h1>
                <Pencil
                  size={15}
                  className="shrink-0 text-ink-disabled transition-colors group-hover:text-ink"
                />
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate(retour)}>
              Annuler
            </Button>
            <Button onClick={enregistrer} disabled={bloquants.length > 0}>
              <Check /> {modeleId ? "Enregistrer" : "Créer le modèle"}
            </Button>
          </div>
        </div>
      </div>

      {/* ── Échelle ── */}
      <Bloc
        titre="Échelle"
        aside={
          <select
            aria-label="Échelle prédéfinie"
            value={b.echelle.nom}
            onChange={(e) => {
              const p = ECHELLES_PRESET.find((x) => x.nom === e.target.value)
              if (p) patch({ echelle: structuredClone(p) })
            }}
            className={cn(fieldCls, "w-auto min-w-56 py-2")}
          >
            <option value={ECHELLE_PERSONNALISEE}>{ECHELLE_PERSONNALISEE}</option>
            {ECHELLES_PRESET.map((p) => (
              <option key={p.nom} value={p.nom}>
                {p.nom}
              </option>
            ))}
          </select>
        }
      >
        <div className="grid gap-6 p-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="flex flex-col gap-5">
            <div className="grid grid-cols-3 gap-3">
              <Nombre
                label="Minimum"
                value={b.echelle.min}
                onChange={(min) => patchEchelle({ min })}
              />
              <Nombre
                label="Maximum"
                value={b.echelle.max}
                onChange={(max) => patchEchelle({ max })}
              />
              <Nombre
                label="Pas"
                value={b.echelle.pas}
                onChange={(pas) => patchEchelle({ pas })}
              />
            </div>

            {echelleOk && valeurs.length <= 11 ? (
              <div className="flex flex-col gap-2">
                <span className={overlineCls}>Étiquettes (optionnel)</span>
                <div className="grid gap-2 sm:grid-cols-2">
                  {valeurs.map((v) => (
                    <label key={v} className="flex items-center gap-2.5">
                      <span className="w-5 shrink-0 text-right font-ui text-[0.78rem] text-ink-disabled tabular-nums">
                        {v}
                      </span>
                      <input
                        value={b.echelle.etiquettes[v] ?? ""}
                        onChange={(e) =>
                          patchEchelle({
                            etiquettes: {
                              ...b.echelle.etiquettes,
                              [v]: e.target.value,
                            },
                          })
                        }
                        placeholder="—"
                        className={cn(fieldCls, "py-2")}
                      />
                    </label>
                  ))}
                </div>
              </div>
            ) : echelleOk ? (
              <p className="font-body text-[0.8rem] text-ink-disabled">
                Plus de 11 valeurs : les étiquettes ne sont pas proposées.
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-3 rounded-lg border border-border p-4">
            <span className={overlineCls}>Aperçu côté joueur</span>
            <ApercuEchelle echelle={b.echelle} />
          </div>
        </div>
      </Bloc>

      {/* ── Analyse des scores ── */}
      <Bloc
        titre="Analyse des scores"
        aside={
          b.questions.length ? (
            <span className="font-body text-sm text-ink-muted">
              Total possible {bornes.min} → {bornes.max}
            </span>
          ) : null
        }
      >
        {b.intervalles.length ? (
          <div className="flex flex-col gap-4 p-5">
            <Regle modele={b} />
            <div className="flex flex-col gap-2">
              {b.intervalles.map((i, n) => (
                <div
                  key={i.id}
                  className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-md border border-border p-3 sm:grid-cols-[auto_minmax(0,1fr)_auto_auto_auto]"
                >
                  <span className="flex size-7 items-center justify-center rounded-sm border border-border bg-surface-nested font-ui text-[0.74rem] text-ink-muted">
                    {n + 1}
                  </span>
                  <input
                    value={i.libelle}
                    onChange={(e) => majIntervalle(i.id, { libelle: e.target.value })}
                    placeholder="Libellé (ex. Excellent)"
                    aria-label="Libellé de l'intervalle"
                    className={cn(fieldCls, "py-2")}
                  />
                  <button
                    type="button"
                    aria-label="Supprimer l'intervalle"
                    onClick={() =>
                      patch({
                        intervalles: b.intervalles.filter((x) => x.id !== i.id),
                      })
                    }
                    className="flex size-9 items-center justify-center rounded-md text-ink-disabled transition-colors hover:bg-surface-hover hover:text-danger sm:order-last"
                  >
                    <Trash2 size={15} />
                  </button>
                  <span className="col-span-3 flex items-center gap-2 sm:col-span-1">
                    <input
                      type="number"
                      value={i.min}
                      onChange={(e) => majIntervalle(i.id, { min: Number(e.target.value) })}
                      aria-label="De"
                      className={cn(fieldCls, "w-20 py-2 text-center tabular-nums")}
                    />
                    <span className="text-ink-disabled">–</span>
                    <input
                      type="number"
                      value={i.max}
                      onChange={(e) => majIntervalle(i.id, { max: Number(e.target.value) })}
                      aria-label="À"
                      className={cn(fieldCls, "w-20 py-2 text-center tabular-nums")}
                    />
                  </span>
                  <ChoixTon
                    value={i.ton}
                    onChange={(ton) => majIntervalle(i.id, { ton })}
                  />
                </div>
              ))}
            </div>
            {problemes.length ? (
              <ul className="flex flex-col gap-1.5 rounded-md border border-warning/25 bg-warning/10 px-4 py-3">
                {problemes.map((p) => (
                  <li
                    key={p}
                    className="flex items-start gap-2 font-body text-[0.8rem] text-warning"
                  >
                    <AlertTriangle size={13} className="mt-0.5 shrink-0" /> {p}
                  </li>
                ))}
              </ul>
            ) : null}
            <div>
              <LinkBtn onClick={ajouterIntervalle}>
                <Plus size={13} /> Ajouter un intervalle
              </LinkBtn>
            </div>
          </div>
        ) : (
          <EmptyState
            title="Aucun intervalle"
            description="Les intervalles transforment le total d'un joueur en verdict (Excellent, Moyen, Alerte…). Optionnel."
            action={
              <Button variant="outline" onClick={ajouterIntervalle}>
                <Plus /> Ajouter un intervalle
              </Button>
            }
          />
        )}
      </Bloc>

      {/* ── Questions ── */}
      <Bloc
        titre="Questions"
        aside={
          <LinkBtn
            onClick={() =>
              patch({
                questions: [...b.questions, { id: crypto.randomUUID(), texte: "" }],
              })
            }
          >
            <Plus size={13} /> Ajouter une question
          </LinkBtn>
        }
      >
        {b.questions.length ? (
          <ol className="flex flex-col divide-y divide-border">
            {b.questions.map((q, n) => (
              <li key={q.id} className="flex items-center gap-3 p-4">
                <span className="w-7 shrink-0 font-ui text-[0.74rem] text-ink-disabled tabular-nums">
                  Q{n + 1}
                </span>
                <input
                  value={q.texte}
                  autoFocus={!q.texte && n === b.questions.length - 1 && n > 0}
                  onChange={(e) => majQuestion(q.id, { texte: e.target.value })}
                  placeholder="Texte de la question (ex. Niveau de fatigue)"
                  aria-label={`Question ${n + 1}`}
                  className={cn(
                    fieldCls,
                    "py-2",
                    !q.texte.trim() && "border-warning/40",
                  )}
                />
                <span className="flex shrink-0 items-center">
                  <MiniBtn
                    label="Monter"
                    disabled={n === 0}
                    onClick={() => deplacer(n, -1)}
                  >
                    <ArrowUp size={14} />
                  </MiniBtn>
                  <MiniBtn
                    label="Descendre"
                    disabled={n === b.questions.length - 1}
                    onClick={() => deplacer(n, 1)}
                  >
                    <ArrowDown size={14} />
                  </MiniBtn>
                  <MiniBtn
                    label="Supprimer la question"
                    danger
                    onClick={() =>
                      patch({ questions: b.questions.filter((x) => x.id !== q.id) })
                    }
                  >
                    <Trash2 size={14} />
                  </MiniBtn>
                </span>
              </li>
            ))}
          </ol>
        ) : (
          <EmptyState
            title="Aucune question"
            description="Un modèle a besoin d'au moins une question."
          />
        )}
      </Bloc>

      {bloquants.length ? (
        <p className="font-body text-[0.8rem] text-ink-muted">
          Pour enregistrer : {bloquants.join(" ")}
        </p>
      ) : null}
    </div>
  )
}

/* ── Checks ──────────────────────────────────────────────────────────────── */

/** Soft warnings — the analyse still saves, but the staff should know. */
function problemesAnalyse(b: Brouillon): string[] {
  const out: string[] = []
  const { min, max } = bornesTotal(b)
  const tries = [...b.intervalles].sort((x, y) => x.min - y.min)
  for (const i of tries) {
    if (i.min > i.max) out.push(`« ${i.libelle || "Sans nom"} » commence après sa fin.`)
    else if (i.min < min || i.max > max)
      out.push(`« ${i.libelle || "Sans nom"} » sort du total possible (${min} → ${max}).`)
  }
  for (let n = 1; n < tries.length; n++) {
    const a = tries[n - 1]
    const c = tries[n]
    if (c.min <= a.max)
      out.push(`« ${a.libelle || "Sans nom"} » et « ${c.libelle || "Sans nom"} » se chevauchent.`)
    else if (c.min > a.max + 1)
      out.push(`Aucun verdict pour un total entre ${a.max + 1} et ${c.min - 1}.`)
  }
  if (tries.length && tries[0].min > min)
    out.push(`Aucun verdict en dessous de ${tries[0].min}.`)
  if (tries.length && tries.at(-1)!.max < max)
    out.push(`Aucun verdict au-dessus de ${tries.at(-1)!.max}.`)
  return out
}

/* ── Pieces ──────────────────────────────────────────────────────────────── */

function ApercuEchelle({ echelle }: { echelle: Echelle }) {
  const [v, setV] = useState<number | null>(null)
  return <EchelleSaisie echelle={echelle} valeur={v} onChange={setV} />
}

function Bloc({
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
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="font-ui text-lg font-medium text-ink">{titre}</h2>
        {aside}
      </div>
      <div className="rounded-lg border border-border">{children}</div>
    </section>
  )
}

function Nombre({
  label,
  value,
  onChange,
}: {
  label: string
  value: number
  onChange: (v: number) => void
}) {
  return (
    <label className="flex flex-col gap-2">
      <span className={overlineCls}>{label}</span>
      <input
        type="number"
        value={Number.isFinite(value) ? value : ""}
        onChange={(e) => onChange(Number(e.target.value))}
        className={cn(fieldCls, "tabular-nums")}
      />
    </label>
  )
}

const TONS: TonScore[] = ["bon", "moyen", "mauvais"]

/** How the interval reads — three status dots, the chosen one labelled. */
function ChoixTon({
  value,
  onChange,
}: {
  value: TonScore
  onChange: (t: TonScore) => void
}) {
  return (
    <span
      role="radiogroup"
      aria-label="Lecture de l'intervalle"
      className="col-span-3 inline-flex items-center gap-1 rounded-pill border border-border p-1 sm:col-span-1"
    >
      {TONS.map((t) => {
        const actif = t === value
        return (
          <button
            key={t}
            type="button"
            role="radio"
            aria-checked={actif}
            title={TON_LIBELLE[t]}
            onClick={() => onChange(t)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-pill px-2.5 py-1 font-ui text-[0.72rem] transition-colors",
              actif
                ? "border border-border-second bg-surface-nested text-ink"
                : "border border-transparent text-ink-muted hover:text-ink",
            )}
          >
            <span className={cn("size-2 rounded-full bg-current", TON_TEXTE[t])} />
            {actif ? TON_LIBELLE[t] : null}
          </button>
        )
      })}
    </span>
  )
}

function MiniBtn({
  label,
  onClick,
  disabled,
  danger,
  children,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
  danger?: boolean
  children: ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "flex size-8 items-center justify-center rounded-md text-ink-disabled transition-colors hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-40",
        danger ? "hover:text-danger" : "hover:text-ink",
      )}
    >
      {children}
    </button>
  )
}
