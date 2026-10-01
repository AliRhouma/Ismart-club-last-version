import { useState, type ReactNode } from "react"
import { RotateCcw, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { useData } from "@/data/useData"
import type { PlanEvent } from "@/data/seed/events"
import type { SeanceDetail } from "@/data/seed/seances"
import { FormSheet } from "@/components/kit/FormSheet"
import { Field, Select, inputCls } from "@/features/finance/ui"
import {
  MATERIAUX,
  materiauParNom,
  materielDeroule,
  totalPieces,
} from "@/data/seed/materiaux"

/**
 * Fiche de la séance — Séance ▸ « Modifier la séance ».
 *
 * Une séance vit sur deux lignes : la **fiche** (SeanceDetail : type, effectif,
 * intensité…) et l'**événement du planning** (PlanEvent : jour, horaire, lieu,
 * intitulé). Les deux se contredisaient facilement ; ce formulaire les écrit
 * ensemble, de sorte que renommer une séance ou la déplacer d'un jour se voit
 * aussitôt sur le calendrier, et inversement.
 *
 * Catégorie et groupe ne sont pas du texte libre : ils viennent de l'effectif
 * du club, comme la convocation — c'est la même vérité.
 */

/** Familles de séance proposées ; la valeur en place est toujours conservée. */
const TYPES_SEANCE = [
  "Séance technique",
  "Séance tactique",
  "Séance physique",
  "Séance athlétique",
  "Évaluation",
  "Récupération",
  "Séance mixte",
]

const INTENSITES = ["N/A", "Faible", "Modérée", "Élevée", "Très élevée"]

/** "06/07/2026" → "2026-07-06" (et l'inverse). */
const toIso = (fr: string): string => {
  const [d, m, y] = fr.split("/")
  return y && m && d ? y + "-" + m + "-" + d : ""
}
const toFr = (iso: string): string => {
  const [y, m, d] = iso.split("-")
  return y && m && d ? d + "/" + m + "/" + y : iso
}

type Draft = {
  numero: string
  type: string
  categorieId: string
  groupeId: string
  effectif: string
  date: string
  start: string
  end: string
  lieu: string
  duree: string
  intensite: string
  saison: string
  objectif: string
}

export function SeanceFormModal({
  detail,
  event,
  onClose,
  onSaved,
}: {
  detail: SeanceDetail
  /** L'événement du planning derrière la séance — absent pour une séance orpheline. */
  event: PlanEvent | null
  onClose: () => void
  onSaved: (message: string) => void
}) {
  const { categories, saisons, updateSeanceDetail, updateEvent } = useData()

  // La fiche stocke des libellés ("Minime", "Groupe A") ; on retrouve l'id
  // correspondant dans l'effectif pour que les listes s'ouvrent au bon endroit.
  const categorieDeDepart =
    categories.find(
      (c) =>
        detail.categorie &&
        detail.categorie.toLowerCase().includes(c.nom.toLowerCase()),
    )?.id ?? ""
  const groupeDeDepart =
    categories
      .find((c) => c.id === categorieDeDepart)
      ?.groupes.find(
        (g) => g.nom.toLowerCase() === detail.groupe.trim().toLowerCase(),
      )?.id ?? ""

  const [draft, setDraft] = useState<Draft>({
    numero: detail.numero,
    type: detail.type,
    categorieId: categorieDeDepart,
    groupeId: groupeDeDepart,
    effectif: detail.effectif === "N/A" ? "" : detail.effectif,
    // Le planning fait foi pour le jour ; la fiche ne sert que de repli.
    date: event?.date ?? toIso(detail.date),
    start: event?.start ?? "",
    end: event?.end ?? "",
    lieu: event?.location ?? "",
    duree: detail.duree === "N/A" ? "" : detail.duree,
    intensite: detail.intensite || "N/A",
    saison: detail.saison,
    objectif: event?.detail ?? "",
  })

  /*
   * Matériel de la séance. Tant que l'éducateur n'y touche pas, il suit les
   * procédés (calcul automatique) ; dès qu'il ajuste, sa liste fait foi.
   */
  const auto = [...materielDeroule(detail.procedes)].map(([nom, quantite]) => ({
    nom,
    quantite: String(quantite),
  }))
  const [materiel, setMateriel] = useState<{ nom: string; quantite: string }[]>(
    () =>
      detail.materiel
        ? detail.materiel.map((m) => ({ nom: m.nom, quantite: String(m.quantite) }))
        : auto,
  )
  const [materielManuel, setMaterielManuel] = useState(detail.materiel !== undefined)
  const majMateriel = (suite: { nom: string; quantite: string }[]) => {
    setMateriel(suite)
    setMaterielManuel(true)
  }
  const pieces = totalPieces(
    materiel.map((m) => ({ nom: m.nom, quantite: Number(m.quantite) || 0 })),
  )
  const horsCaisse = MATERIAUX.filter(
    (m) => !materiel.some((l) => l.nom.toLowerCase() === m.nom.toLowerCase()),
  )

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((prev) => ({ ...prev, [key]: value }))

  const categorie = categories.find((c) => c.id === draft.categorieId) ?? null
  const groupes = categorie?.groupes ?? []

  // Changer de catégorie invalide le groupe : il appartient à l'autre effectif.
  const changeCategorie = (id: string) => {
    setDraft((prev) => ({ ...prev, categorieId: id, groupeId: "" }))
  }

  const typeOptions = TYPES_SEANCE.includes(draft.type)
    ? TYPES_SEANCE
    : [draft.type, ...TYPES_SEANCE]

  const canSubmit = draft.numero.trim().length > 0 && draft.date !== ""

  const submit = () => {
    if (!canSubmit) return
    const nomCategorie = categorie?.nom ?? "N/A"
    const nomGroupe = groupes.find((g) => g.id === draft.groupeId)?.nom ?? "N/A"

    updateSeanceDetail(detail.eventId, {
      numero: draft.numero.trim(),
      type: draft.type,
      categorie: nomCategorie,
      groupe: nomGroupe,
      effectif: draft.effectif.trim() || "N/A",
      date: toFr(draft.date),
      duree: draft.duree.trim() || "N/A",
      intensite: draft.intensite,
      saison: draft.saison,
      // Non retouché : on laisse la séance suivre ses procédés.
      materiel: materielManuel
        ? materiel
            .map((m) => ({ nom: m.nom, quantite: Number(m.quantite) || 0 }))
            .filter((m) => m.quantite > 0)
        : undefined,
    })

    // Le planning suit la fiche : intitulé, jour, horaire, lieu, objectif.
    if (event) {
      updateEvent(event.id, {
        title: draft.numero.trim(),
        date: draft.date,
        start: draft.start || event.start,
        end: draft.end || undefined,
        category:
          categorie && draft.groupeId
            ? nomCategorie + " · " + nomGroupe
            : (categorie?.nom ?? undefined),
        location: draft.lieu.trim() || undefined,
        detail: draft.objectif.trim() || undefined,
      })
    }

    onSaved("Séance mise à jour")
    onClose()
  }

  return (
    <FormSheet
      open
      onOpenChange={(o) => !o && onClose()}
      title="Modifier la séance"
      description="La fiche et la case du planning sont enregistrées ensemble."
      onSubmit={submit}
      submitDisabled={!canSubmit}
      submitLabel="Enregistrer"
    >
      <div className="flex flex-col gap-4">
        <Field label="Intitulé" required>
          <input
            className={inputCls}
            value={draft.numero}
            autoFocus
            placeholder="Séance 22"
            onChange={(e) => set("numero", e.target.value)}
          />
        </Field>

        <Field label="Type de séance">
          <Select
            value={draft.type}
            onChange={(v) => set("type", v)}
            options={typeOptions.map((t) => ({ value: t, label: t }))}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Catégorie">
            <Select
              value={draft.categorieId}
              onChange={changeCategorie}
              options={[
                { value: "", label: "Non renseignée" },
                ...categories.map((c) => ({ value: c.id, label: c.nom })),
              ]}
            />
          </Field>
          <Field label="Groupe">
            <Select
              value={draft.groupeId}
              onChange={(v) => set("groupeId", v)}
              disabled={groupes.length === 0}
              options={[
                { value: "", label: "Non renseigné" },
                ...groupes.map((g) => ({ value: g.id, label: g.nom })),
              ]}
            />
          </Field>
        </div>

        <Section label="Créneau" />

        <Field label="Date" required>
          <input
            type="date"
            className={cn(inputCls, "[color-scheme:dark]")}
            value={draft.date}
            onChange={(e) => set("date", e.target.value)}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Début">
            <input
              type="time"
              className={cn(inputCls, "[color-scheme:dark]")}
              value={draft.start}
              onChange={(e) => set("start", e.target.value)}
            />
          </Field>
          <Field label="Fin" hint="Optionnel">
            <input
              type="time"
              className={cn(inputCls, "[color-scheme:dark]")}
              value={draft.end}
              onChange={(e) => set("end", e.target.value)}
            />
          </Field>
        </div>

        <Field label="Lieu">
          <input
            className={inputCls}
            value={draft.lieu}
            placeholder="Terrain B"
            onChange={(e) => set("lieu", e.target.value)}
          />
        </Field>

        <Section label="Déroulé" />

        <div className="grid grid-cols-2 gap-3">
          <Field label="Effectif" hint="Vide = N/A">
            <input
              inputMode="numeric"
              className={inputCls}
              value={draft.effectif}
              placeholder="18"
              onChange={(e) => set("effectif", e.target.value)}
            />
          </Field>
          <Field label="Durée (min)" hint="Temps de travail effectif">
            <input
              inputMode="numeric"
              className={inputCls}
              value={draft.duree}
              placeholder="90"
              onChange={(e) => set("duree", e.target.value)}
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Intensité">
            <Select
              value={draft.intensite}
              onChange={(v) => set("intensite", v)}
              options={INTENSITES.map((i) => ({ value: i, label: i }))}
            />
          </Field>
          <Field label="Saison">
            <Select
              value={draft.saison}
              onChange={(v) => set("saison", v)}
              options={
                saisons.includes(draft.saison)
                  ? saisons.map((s) => ({ value: s, label: s }))
                  : [
                      { value: draft.saison, label: draft.saison },
                      ...saisons.map((s) => ({ value: s, label: s })),
                    ]
              }
            />
          </Field>
        </div>

        <Section
          label={
            <>
              Matériaux ·{" "}
              <span className="text-ink-muted tabular-nums">
                {pieces} pièce{pieces > 1 ? "s" : ""}
              </span>
            </>
          }
        />

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3">
            <span className="font-body text-[0.75rem] text-ink-muted">
              {materielManuel
                ? "Ajusté à la main."
                : "Calculé depuis les procédés de la séance."}
            </span>
            {materielManuel ? (
              <button
                type="button"
                onClick={() => {
                  setMateriel(auto)
                  setMaterielManuel(false)
                }}
                className="inline-flex shrink-0 items-center gap-1 font-ui text-[0.72rem] text-info hover:text-ink"
              >
                <RotateCcw size={12} /> Recalculer
              </button>
            ) : null}
          </div>

          {materiel.length === 0 ? (
            <p className="rounded-md border border-dashed border-border px-3 py-4 text-center font-body text-[0.78rem] text-ink-disabled">
              Aucun matériel pour cette séance.
            </p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {materiel.map((m, i) => {
                const ref = materiauParNom(m.nom)
                return (
                  <li
                    key={m.nom}
                    className="flex items-center gap-3 rounded-md border border-border px-2.5 py-2"
                  >
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-sm bg-surface-nested">
                      {ref ? (
                        <img src={ref.svg} alt="" aria-hidden className="max-h-5 max-w-[70%] object-contain" />
                      ) : null}
                    </span>
                    <span className="min-w-0 flex-1 truncate font-ui text-[0.84rem] text-ink">
                      {m.nom}
                    </span>
                    <input
                      inputMode="numeric"
                      aria-label={"Quantité — " + m.nom}
                      value={m.quantite}
                      onFocus={(e) => e.currentTarget.select()}
                      onChange={(e) =>
                        majMateriel(
                          materiel.map((x, j) =>
                            j === i ? { ...x, quantite: e.target.value.replace(/\D/g, "") } : x,
                          ),
                        )
                      }
                      className={cn(inputCls, "w-16 px-2 py-1 text-center tabular-nums")}
                    />
                    <button
                      type="button"
                      aria-label={"Retirer " + m.nom}
                      onClick={() => majMateriel(materiel.filter((_, j) => j !== i))}
                      className="shrink-0 text-ink-disabled transition-colors hover:text-danger"
                    >
                      <X size={14} />
                    </button>
                  </li>
                )
              })}
            </ul>
          )}

          {horsCaisse.length ? (
            <Select
              value=""
              placeholder="Ajouter du matériel…"
              onChange={(nom) => {
                const ref = MATERIAUX.find((m) => m.nom === nom)
                if (ref)
                  majMateriel([...materiel, { nom: ref.nom, quantite: String(ref.defaut) }])
              }}
              options={horsCaisse.map((m) => ({ value: m.nom, label: m.nom }))}
            />
          ) : null}
        </div>

        <Field label="Objectif de la séance">
          <textarea
            rows={3}
            className={cn(inputCls, "resize-none")}
            value={draft.objectif}
            placeholder="Se démarquer pour fixer et éliminer, passer ou finir"
            onChange={(e) => set("objectif", e.target.value)}
          />
        </Field>
      </div>
    </FormSheet>
  )
}

/** Petit intertitre : donne du rythme au formulaire sans ajouter de surface. */
function Section({ label }: { label: ReactNode }) {
  return (
    <div className="flex items-center gap-3 pt-1">
      <span className="font-ui text-[0.62rem] font-medium tracking-[0.1em] text-ink-disabled uppercase">
        {label}
      </span>
      <span className="h-px flex-1 bg-border" aria-hidden />
    </div>
  )
}
