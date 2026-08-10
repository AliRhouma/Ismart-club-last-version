import dagre from "@dagrejs/dagre"

import type { OrgUnite } from "@/data/seed/organigramme"

/** Card widths — the node grows when the tâches column is shown. */
export const NODE_W = 300
export const NODE_W_TACHES = 380

const HEAD_H = 64
const MEMBRE_H = 46
const TACHE_H = 62
const FOOTER_H = 42

/**
 * A unité's rendered height, so dagre reserves the right room. Mirrors what
 * `UniteNode` actually draws: header, one row per membre, the tâches of every
 * expanded membre, and the "Gérer les membres" footer.
 */
export function uniteHeight(
  unite: OrgUnite,
  showMembres: boolean,
  showTaches: boolean,
  expanded: Set<string>,
) {
  if (!showMembres) return HEAD_H
  let h = HEAD_H + FOOTER_H
  for (const a of unite.membres) {
    h += MEMBRE_H
    if (showTaches && expanded.has(`${unite.id}:${a.membreId}`)) {
      h += a.taches.length * TACHE_H + 8
    }
  }
  return h
}

/**
 * Top-down dagre layout over the parent/child tree. `espacement` (0.6 → 3) is
 * the toolbar slider: it stretches the gap between two levels relative to the
 * tallest card, so opening the membres never makes the levels overlap.
 */
export function layoutUnites(
  unites: OrgUnite[],
  showMembres: boolean,
  showTaches: boolean,
  expanded: Set<string>,
  espacement: number,
): Record<string, { x: number; y: number }> {
  if (unites.length === 0) return {}

  const width = showTaches ? NODE_W_TACHES : NODE_W
  const tallest = unites.reduce(
    (max, u) => Math.max(max, uniteHeight(u, showMembres, showTaches, expanded)),
    HEAD_H,
  )

  const g = new dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({
    rankdir: "TB",
    ranksep: Math.max(120, tallest * espacement * 0.55),
    nodesep: 70,
  })

  const ids = new Set(unites.map((u) => u.id))
  for (const u of unites) {
    g.setNode(u.id, {
      width,
      height: uniteHeight(u, showMembres, showTaches, expanded),
    })
  }
  for (const u of unites) {
    if (u.parentId && ids.has(u.parentId)) g.setEdge(u.parentId, u.id)
  }

  dagre.layout(g)

  const positions: Record<string, { x: number; y: number }> = {}
  for (const u of unites) {
    const n = g.node(u.id)
    if (!n) continue
    positions[u.id] = { x: n.x - width / 2, y: n.y - n.height / 2 }
  }
  return positions
}
