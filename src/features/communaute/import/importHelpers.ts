/**
 * The "importer un organigramme" draft and the logic around it: seeding the
 * draft from a partner's organigramme (with suggestions), and turning the
 * finished draft into the plan the store applies. Pure functions — the wizard
 * screens only render and edit the draft.
 */
import type { Fiche, FicheType, MembreLie } from "@/data/seed/fichesPoste"
import type { OrgMembre, OrgUnite } from "@/data/seed/organigramme"
import type { DocPartage, OrgPartage } from "@/data/seed/organigrammesPartages"
import type { PlanImportOrganigramme } from "@/data/seed/importOrganigramme"
import { layoutUnites } from "@/features/structuration/organigramme/layout"

/* ── Draft ──────────────────────────────────────────────────────────────── */

export type Affectation =
  | { kind: "vide" }
  | { kind: "membre"; membreId: string; suggere: boolean }
  | { kind: "nouveau"; nom: string }

export type PosteB = {
  id: string
  intitule: string
  /** Who holds it at the partner club — context only. */
  occupant: string | null
  affectation: Affectation
  ficheId?: string
  roles: { docId: string; libelle: string }[]
  charteIds: string[]
}

export type UniteB = {
  id: string
  nom: string
  parentId: string | null
  inclus: boolean
  /** False for a unité the user added during the import. */
  source: boolean
  postes: PosteB[]
}

export type MappingDoc =
  | { mode: "lier"; cibleId: string; suggere: boolean }
  | { mode: "copier" }
  | { mode: "ignorer" }

export type Placement = { kind: "racine" } | { kind: "sous"; uniteId: string }

export type BrouillonImport = {
  unites: UniteB[]
  docs: Record<string, MappingDoc>
  placement: Placement
}

/* ── Matching ───────────────────────────────────────────────────────────── */

const MOTS_VIDES = new Set([
  "fiche", "poste", "de", "du", "des", "la", "le", "les", "l", "d", "et", "a",
  "charte", "role", "club", "fc", "c", "f", "93", "u", "commission",
])

/** "Secrétaire générale" → ["secretair", "general"] — crude French stemming. */
export const mots = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .map((m) => m.replace(/s$/, ""))
    .map((m) => (m.length > 5 ? m.replace(/e$/, "") : m))
    .filter((m) => m && !MOTS_VIDES.has(m))

export const similarite = (a: string, b: string) => {
  const A = new Set(mots(a))
  const B = new Set(mots(b))
  if (!A.size || !B.size) return 0
  let inter = 0
  for (const m of A) if (B.has(m)) inter++
  return inter / (A.size + B.size - inter)
}

const SEUIL = 0.3

/** Documents are only ever mapped within the same family. */
export const famille = (t: FicheType) =>
  t === "Fiche de Poste" ? "poste" : t === "Liste des Rôles" ? "roles" : t ? "charte" : "autre"

export const FAMILLES = [
  { cle: "poste", label: "Fiches de poste" },
  { cle: "charte", label: "Chartes & règlement" },
  { cle: "roles", label: "Listes des rôles" },
] as const

export function meilleurMembre(intitule: string, membres: OrgMembre[]) {
  let best: { m: OrgMembre; s: number } | null = null
  for (const m of membres) {
    const s = similarite(intitule, m.role)
    if (s >= SEUIL && (!best || s > best.s)) best = { m, s }
  }
  return best?.m ?? null
}

export function meilleurDoc(doc: DocPartage, fiches: Fiche[]) {
  let best: { f: Fiche; s: number } | null = null
  for (const f of fiches) {
    if (famille(f.type) !== famille(doc.type)) continue
    const s = similarite(`${doc.titre} ${doc.perimetre}`, `${f.titre} ${f.perimetre}`)
    if (s >= SEUIL && (!best || s > best.s)) best = { f, s }
  }
  return best?.f ?? null
}

/** A fresh draft: the partner's tree, with suggested people and documents. */
export function brouillonInitial(
  partage: OrgPartage,
  membres: OrgMembre[],
  fiches: Fiche[],
): BrouillonImport {
  const unites: UniteB[] = partage.unites.map((u) => ({
    id: u.id,
    nom: u.nom,
    parentId: u.parentId,
    inclus: true,
    source: true,
    postes: u.postes.map((p) => {
      const m = meilleurMembre(p.intitule, membres)
      return {
        ...p,
        affectation: m
          ? { kind: "membre", membreId: m.id, suggere: true }
          : { kind: "vide" },
      }
    }),
  }))
  const docs: Record<string, MappingDoc> = {}
  for (const d of partage.documents) {
    const f = meilleurDoc(d, fiches)
    docs[d.id] = f ? { mode: "lier", cibleId: f.id, suggere: true } : { mode: "copier" }
  }
  return { unites, docs, placement: { kind: "racine" } }
}

/* ── Tree helpers ───────────────────────────────────────────────────────── */

export const enfantsDe = (unites: UniteB[], id: string | null) =>
  unites.filter((u) => u.parentId === id)

/** Depth-first order, roots first — the order the tree is drawn in. */
export function ordreArbre(unites: UniteB[]) {
  const out: { u: UniteB; niveau: number }[] = []
  const visite = (parent: string | null, niveau: number) => {
    for (const u of enfantsDe(unites, parent)) {
      out.push({ u, niveau })
      visite(u.id, niveau + 1)
    }
  }
  visite(null, 0)
  return out
}

export const descendants = (unites: UniteB[], id: string): string[] =>
  enfantsDe(unites, id).flatMap((e) => [e.id, ...descendants(unites, e.id)])

/** Documents actually used by the postes still being imported. */
export function docsUtilises(b: BrouillonImport) {
  const usage = new Map<string, string[]>()
  const ajoute = (docId: string, qui: string) =>
    usage.set(docId, [...(usage.get(docId) ?? []), qui])
  for (const u of b.unites) {
    if (!u.inclus) continue
    for (const p of u.postes) {
      if (p.ficheId) ajoute(p.ficheId, p.intitule)
      for (const r of p.roles) ajoute(r.docId, p.intitule)
      for (const c of p.charteIds) ajoute(c, p.intitule)
    }
  }
  return usage
}

export const estPourvu = (p: PosteB) =>
  p.affectation.kind === "membre" ||
  (p.affectation.kind === "nouveau" && p.affectation.nom.trim() !== "")

/* ── Plan ───────────────────────────────────────────────────────────────── */

const moisFr = () =>
  new Date().toLocaleDateString("fr-FR", { month: "short", year: "numeric" })
const jourFr = () =>
  new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })

export type ResumeImport = {
  plan: PlanImportOrganigramme
  nbUnites: number
  postesPourvus: number
  postesVides: { unite: string; intitule: string }[]
  nouveauxNoms: string[]
  personnes: number
  docsLies: number
  docsCopies: number
  docsIgnores: number
  chartesAEnvoyer: number
}

/**
 * Resolve the draft against our club: real ids for the new unités, members
 * created, documents linked or copied, and one link per person and document.
 * The recap screen reads the same result the store will apply.
 */
export function construirePlan(
  b: BrouillonImport,
  partage: OrgPartage,
  ctx: {
    ressourceId: string
    club: string
    orgUnites: OrgUnite[]
    orgMembres: OrgMembre[]
    fiches: Fiche[]
  },
): ResumeImport {
  const inclus = ordreArbre(b.unites).filter(({ u }) => u.inclus).map(({ u }) => u)
  const ids = new Map(inclus.map((u) => [u.id, crypto.randomUUID()]))
  const parentReel = (u: UniteB): string | null => {
    let p = u.parentId
    while (p) {
      const id = ids.get(p)
      if (id) return id
      p = b.unites.find((x) => x.id === p)?.parentId ?? null
    }
    return b.placement.kind === "sous" ? b.placement.uniteId : null
  }

  /* People */
  const nouveaux = new Map<string, OrgMembre>()
  const personne = (p: PosteB): OrgMembre | null => {
    const a = p.affectation
    if (a.kind === "membre") return ctx.orgMembres.find((m) => m.id === a.membreId) ?? null
    if (a.kind === "nouveau" && a.nom.trim()) {
      const cle = a.nom.trim().toLowerCase()
      if (!nouveaux.has(cle))
        nouveaux.set(cle, { id: crypto.randomUUID(), nom: a.nom.trim(), role: p.intitule })
      return nouveaux.get(cle)!
    }
    return null
  }

  /* Documents */
  const copies = new Map<string, Fiche>()
  const cible = (docId: string): string | null => {
    const m = b.docs[docId]
    const d = partage.documents.find((x) => x.id === docId)
    if (!m || !d || m.mode === "ignorer") return null
    if (m.mode === "lier") return m.cibleId
    if (!copies.has(docId))
      copies.set(docId, {
        id: crypto.randomUUID(),
        titre: d.titre,
        type: d.type,
        perimetre: d.perimetre,
        majLe: jourFr(),
        auteur: `Importé de ${ctx.club}`,
        statut: "Brouillon",
        version: "v1.0",
        membres: [],
        contenu: d.contenu,
      })
    return copies.get(docId)!.id
  }

  const unites: OrgUnite[] = []
  const liens: PlanImportOrganigramme["liens"] = []
  const postesVides: ResumeImport["postesVides"] = []
  let postesPourvus = 0
  const personnes = new Set<string>()
  const chartes = new Set<string>()

  for (const u of inclus) {
    const membres: OrgUnite["membres"] = []
    for (const p of u.postes) {
      const m = personne(p)
      if (!m) {
        postesVides.push({ unite: u.nom, intitule: p.intitule })
        continue
      }
      postesPourvus++
      personnes.add(m.id)
      if (!membres.some((a) => a.membreId === m.id)) membres.push({ membreId: m.id, taches: [] })
      const lien = (statut: MembreLie["statut"], role: string, enAttente?: boolean): MembreLie => ({
        id: m.id,
        nom: m.nom,
        role,
        groupe: u.nom,
        depuis: moisFr(),
        statut,
        enAttente,
      })
      if (p.ficheId) {
        const f = cible(p.ficheId)
        if (f) liens.push({ ficheId: f, lien: lien("Titulaire", p.intitule) })
      }
      for (const r of p.roles) {
        const f = cible(r.docId)
        if (f) liens.push({ ficheId: f, lien: lien("Assigné", r.libelle) })
      }
      for (const c of p.charteIds) {
        const f = cible(c)
        if (!f) continue
        const reglement =
          (ctx.fiches.find((x) => x.id === f) ?? copies.get(c))?.type === "Règlement"
        liens.push({ ficheId: f, lien: lien(reglement ? "Validé" : "Signataire", p.intitule, true) })
        chartes.add(`${m.id}:${f}`)
      }
    }
    unites.push({
      id: ids.get(u.id)!,
      nom: u.nom.trim() || "Unité sans nom",
      parentId: parentReel(u),
      membres,
      x: 0,
      y: 0,
    })
  }

  // Charte links a person already has in our club don't count as "to send".
  const dejaSignees = [...chartes].filter((k) => {
    const [mid, fid] = k.split(":")
    return ctx.fiches.find((f) => f.id === fid)?.membres.some((x) => x.id === mid)
  }).length

  const positions = layoutUnites([...ctx.orgUnites, ...unites], true, false, new Set(), 1.2)

  const utilises = docsUtilises(b)
  const modes = [...utilises.keys()].map((id) => b.docs[id]?.mode)

  return {
    plan: {
      ressourceId: ctx.ressourceId,
      unites,
      positions,
      nouveauxMembres: [...nouveaux.values()],
      nouvellesFiches: [...copies.values()],
      liens,
    },
    nbUnites: unites.length,
    postesPourvus,
    postesVides,
    nouveauxNoms: [...nouveaux.values()].map((m) => m.nom),
    personnes: personnes.size,
    docsLies: modes.filter((m) => m === "lier").length,
    docsCopies: modes.filter((m) => m === "copier").length,
    docsIgnores: modes.filter((m) => m === "ignorer").length,
    chartesAEnvoyer: chartes.size - dejaSignees,
  }
}
