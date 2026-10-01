/**
 * Non-component helpers of Performances (kept apart from performancesUi.tsx so
 * that file only exports components — React fast refresh).
 */
import { useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"

import type { Categorie } from "@/data/seed/categories"
import {
  totalReponse,
  verdictPour,
  type Questionnaire,
  type TonScore,
} from "@/data/seed/performances"
import type { BadgeVariant } from "@/components/kit/Badge"
import { useToast } from "@/components/kit/Toast"

/** The blocks a shared modèle can carry. */
export const RESSOURCES_MODELE = ["Questions", "Échelle", "Analyse des scores"]

export const fieldCls =
  "w-full rounded-md border border-input bg-transparent px-3.5 py-2.5 font-body text-sm text-ink outline-none transition-colors placeholder:text-ink-disabled focus:border-border-focus"
export const labelCls =
  "block font-ui text-[0.72rem] font-medium tracking-[0.02em] text-ink"
export const overlineCls =
  "font-ui text-[0.66rem] font-medium tracking-[0.08em] text-ink-muted uppercase"

/**
 * The shared toast, plus any confirmation handed over by the screen that
 * navigated here (`navigate(to, { state: { toast } })`). The state is cleared
 * once shown so a refresh or a back-navigation doesn't replay it.
 */
export function useToastPerf() {
  const { toast, notify } = useToast()
  const location = useLocation()
  const navigate = useNavigate()
  const recu = (location.state as { toast?: string } | null)?.toast
  useEffect(() => {
    if (!recu) return
    notify(recu)
    navigate(location.pathname, { replace: true, state: null })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recu])
  return { toast, notify }
}

/* ── Derived numbers of a questionnaire ─────────────────────────────────── */

/** The joueurs a questionnaire was sent to (its catégorie, or one groupe). */
export const joueursCibles = (q: Questionnaire, categories: Categorie[]) => {
  const cat = categories.find((c) => c.id === q.categorieId)
  return (cat?.joueurs ?? []).filter(
    (j) => !q.groupeId || j.groupeId === q.groupeId,
  )
}

/** Response count, expected count, and how many answers land in "mauvais". */
export const bilan = (q: Questionnaire, categories: Categorie[]) => {
  const cibles = joueursCibles(q, categories)
  const ids = new Set(cibles.map((j) => j.id))
  const reponses = q.reponses.filter((r) => ids.has(r.joueurId))
  const alertes = reponses.filter(
    (r) => verdictPour(q.modele.intervalles, totalReponse(r))?.ton === "mauvais",
  ).length
  return { cibles, reponses, recues: reponses.length, attendues: cibles.length, alertes }
}

/** "2026-03-09" → "9 mars 2026". */
export const dateLongue = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number)
  if (!y || !m || !d) return iso
  return new Date(y, m - 1, d).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

/* ── Verdict ─────────────────────────────────────────────────────────────── */

export const TON_VARIANT: Record<TonScore, BadgeVariant> = {
  bon: "success",
  moyen: "warning",
  mauvais: "danger",
}

export const TON_TEXTE: Record<TonScore, string> = {
  bon: "text-success",
  moyen: "text-warning",
  mauvais: "text-danger",
}

export const TON_FOND: Record<TonScore, string> = {
  bon: "bg-success",
  moyen: "bg-warning",
  mauvais: "bg-danger",
}

export const TON_LIBELLE: Record<TonScore, string> = {
  bon: "Bon",
  moyen: "À suivre",
  mauvais: "Alerte",
}
