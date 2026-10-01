import { useState } from "react"
import { useNavigate } from "react-router-dom"

import { cn } from "@/lib/utils"
import { useData } from "@/data/useData"
import {
  valeursEchelle,
  type Echelle,
  type IntervalleScore,
} from "@/data/seed/performances"
import { Badge } from "@/components/kit/Badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  cheminModeleNouveau,
  cheminQuestionnaire,
} from "@/features/performances/performancesRoutes"
import {
  TON_VARIANT,
  fieldCls,
  labelCls,
} from "@/features/performances/performancesHelpers"


/** The verdict pill — or a muted dash when the modèle has no analyse. */
export function Verdict({ intervalle }: { intervalle: IntervalleScore | null }) {
  if (!intervalle)
    return <span className="font-body text-[0.8rem] text-ink-disabled">—</span>
  return (
    <Badge variant={TON_VARIANT[intervalle.ton]} dot>
      {intervalle.libelle}
    </Badge>
  )
}

/* ── Échelle: tap a value ────────────────────────────────────────────────── */

/**
 * Answering on an échelle. Rather than a free slider, every allowed value is a
 * tappable step (exact on a phone, readable at a glance) sitting on the heat
 * ramp the platform uses for sports data. The selected value's label shows
 * above so the joueur reads words, not just a number.
 */
export function EchelleSaisie({
  echelle,
  valeur,
  onChange,
  compact = false,
}: {
  echelle: Echelle
  valeur: number | null
  onChange?: (v: number) => void
  compact?: boolean
}) {
  const valeurs = valeursEchelle(echelle)
  const bas = echelle.etiquettes[echelle.min]
  const haut = echelle.etiquettes[echelle.max]
  const courant = valeur != null ? echelle.etiquettes[valeur] : undefined

  if (!valeurs.length)
    return (
      <p className="font-body text-[0.8rem] text-ink-disabled">
        Échelle incomplète — renseignez le minimum, le maximum et le pas.
      </p>
    )

  return (
    <div className="flex flex-col gap-2">
      {!compact ? (
        <div className="flex h-5 items-center justify-center">
          {valeur != null ? (
            <span className="rounded-sm border border-border bg-background px-2 py-0.5 font-ui text-[0.72rem] text-ink">
              {valeur}
              {courant ? (
                <span className="text-ink-muted"> · {courant}</span>
              ) : null}
            </span>
          ) : (
            <span className="font-body text-[0.74rem] text-ink-disabled">
              Choisissez une valeur
            </span>
          )}
        </div>
      ) : null}

      <div
        role="radiogroup"
        className="flex gap-1"
        aria-label="Valeur sur l'échelle"
      >
        {valeurs.map((v) => {
          const actif = v === valeur
          return (
            <button
              key={v}
              type="button"
              role="radio"
              aria-checked={actif}
              title={echelle.etiquettes[v] ?? String(v)}
              disabled={!onChange}
              onClick={() => onChange?.(v)}
              className={cn(
                "flex min-w-0 flex-1 items-center justify-center rounded-sm border font-ui tabular-nums transition-colors",
                compact ? "h-7 text-[0.7rem]" : "h-9 text-[0.8rem]",
                actif
                  ? "border-info bg-info/15 text-info"
                  : "border-border text-ink-muted",
                onChange && !actif && "hover:border-border-strong hover:text-ink",
                !onChange && "cursor-default",
              )}
            >
              {v}
            </button>
          )
        })}
      </div>

      {/* Heat ramp (sports data encoding, design-system --heat-*): low → high. */}
      <div
        aria-hidden
        className="h-1 rounded-pill"
        style={{
          background:
            "linear-gradient(to right, var(--heat-1), var(--heat-2), var(--heat-3), var(--heat-4))",
        }}
      />

      {bas || haut ? (
        <div className="flex justify-between gap-4 font-body text-[0.7rem] text-ink-disabled">
          <span className="truncate">{bas}</span>
          <span className="truncate text-right">{haut}</span>
        </div>
      ) : null}
    </div>
  )
}

/* ── Lancer un questionnaire ─────────────────────────────────────────────── */

export function LancerQuestionnaireModal({
  open,
  onOpenChange,
  saison,
  modeleId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  saison: string
  /** Pre-selected modèle ("Utiliser ce modèle"). */
  modeleId?: string
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-y-auto rounded-xl sm:max-w-lg">
        {open ? (
          <LancerForm
            saison={saison}
            modeleId={modeleId}
            onCancel={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

function LancerForm({
  saison,
  modeleId: modeleInitial,
  onCancel,
}: {
  saison: string
  modeleId?: string
  onCancel: () => void
}) {
  const navigate = useNavigate()
  const { modelesQuestionnaire, categories, lancerQuestionnaire } = useData()
  const avecEffectif = categories.filter((c) => c.joueurs.length > 0)

  const [modeleId, setModeleId] = useState(
    modeleInitial ?? modelesQuestionnaire[0]?.id ?? "",
  )
  const [categorieId, setCategorieId] = useState(avecEffectif[0]?.id ?? "")
  const [groupeId, setGroupeId] = useState("")
  const modele = modelesQuestionnaire.find((m) => m.id === modeleId)
  const categorie = categories.find((c) => c.id === categorieId)
  const [nom, setNom] = useState("")

  const nomPropose = modele && categorie ? `${modele.nom} — ${categorie.nom}` : ""
  const destinataires = categorie
    ? categorie.joueurs.filter((j) => !groupeId || j.groupeId === groupeId)
        .length
    : 0
  const canSave = !!modele && !!categorie && destinataires > 0

  const lancer = () => {
    if (!canSave) return
    const id = lancerQuestionnaire({
      nom: nom.trim() || nomPropose,
      saison,
      categorieId,
      groupeId: groupeId || null,
      modeleId,
    })
    navigate(cheminQuestionnaire(saison, id), {
      state: { toast: "Questionnaire lancé — les joueurs peuvent répondre." },
    })
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Lancer un questionnaire</DialogTitle>
        <DialogDescription>
          Choisissez le modèle et les joueurs qui doivent y répondre.
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <label className={labelCls} htmlFor="lancer-modele">
            Modèle
          </label>
          <select
            id="lancer-modele"
            value={modeleId}
            onChange={(e) => setModeleId(e.target.value)}
            className={fieldCls}
          >
            {modelesQuestionnaire.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nom} · {m.questions.length} question
                {m.questions.length > 1 ? "s" : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label className={labelCls} htmlFor="lancer-categorie">
              Catégorie
            </label>
            <select
              id="lancer-categorie"
              value={categorieId}
              onChange={(e) => {
                setCategorieId(e.target.value)
                setGroupeId("")
              }}
              className={fieldCls}
            >
              {avecEffectif.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nom}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className={labelCls} htmlFor="lancer-groupe">
              Groupe
            </label>
            <select
              id="lancer-groupe"
              value={groupeId}
              onChange={(e) => setGroupeId(e.target.value)}
              className={fieldCls}
            >
              <option value="">Tous les groupes</option>
              {categorie?.groupes.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.nom}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className={labelCls} htmlFor="lancer-nom">
            Nom
          </label>
          <input
            id="lancer-nom"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            placeholder={nomPropose || "Nom du questionnaire"}
            className={fieldCls}
          />
          <span className="font-body text-[0.74rem] text-ink-disabled">
            Laissez vide pour garder « {nomPropose || "…"} ».
          </span>
        </div>

        <p className="rounded-md border border-border px-3.5 py-2.5 font-body text-[0.8rem] text-ink-muted">
          {destinataires > 0 ? (
            <>
              <span className="text-ink">{destinataires} joueurs</span> recevront
              le questionnaire.
            </>
          ) : (
            "Aucun joueur dans ce groupe."
          )}
        </p>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button onClick={lancer} disabled={!canSave}>
          Lancer
        </Button>
      </DialogFooter>
    </>
  )
}

/* ── Créer un modèle (name first, then the editor) ───────────────────────── */

export function CreerModeleModal({
  open,
  onOpenChange,
  saison,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  saison: string
}) {
  const navigate = useNavigate()
  const [nom, setNom] = useState("")

  const continuer = () => {
    if (!nom.trim()) return
    navigate(cheminModeleNouveau(saison), { state: { nom: nom.trim() } })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o)
        if (!o) setNom("")
      }}
    >
      <DialogContent className="rounded-xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nouveau modèle</DialogTitle>
          <DialogDescription>
            Donnez-lui un nom — l'échelle et les questions se règlent ensuite.
          </DialogDescription>
        </DialogHeader>
        <form
          className="flex flex-col gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            continuer()
          }}
        >
          <label className={labelCls} htmlFor="modele-nom">
            Nom
          </label>
          <input
            id="modele-nom"
            autoFocus
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            placeholder="Ex. Bien-être post-match"
            className={fieldCls}
          />
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={continuer} disabled={!nom.trim()}>
            Continuer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
