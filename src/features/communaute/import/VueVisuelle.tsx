import { useEffect, useMemo, useRef, useState } from "react"
import dagre from "@dagrejs/dagre"
import {
  Background,
  BackgroundVariant,
  Controls,
  Handle,
  Position,
  ReactFlow,
  type Edge,
  type Node,
  type NodeProps,
  type ReactFlowInstance,
} from "@xyflow/react"
import {
  Anchor,
  Check,
  ClipboardList,
  EyeOff,
  FileText,
  Network,
  Plus,
  Shield,
  Sparkles,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { useData } from "@/data/useData"
import type { OrgMembre, OrgUnite } from "@/data/seed/organigramme"
import type { OrgPartage } from "@/data/seed/organigrammesPartages"
import { Avatar } from "@/components/kit/Avatar"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Segmented } from "@/features/budget/ui"
import {
  docsUtilises,
  estPourvu,
  type BrouillonImport,
  type PosteB,
  type ResumeImport,
  type UniteB,
} from "@/features/communaute/import/importHelpers"
import { EditeurUnite } from "@/features/communaute/import/EtapeStructure"
import { EtapeDocuments } from "@/features/communaute/import/EtapeDocuments"
import { EtapeValidation } from "@/features/communaute/import/EtapeValidation"

import "@xyflow/react/dist/style.css"

type Maj = (f: (b: BrouillonImport) => BrouillonImport) => void

type Contexte = "seul" | "complet"

/* ── Geometry ───────────────────────────────────────────────────────────── */

const W_IMPORT = 270
const W_MIEN = 220
const H_TETE = 58
const H_POSTE = 40
const H_PIED = 40
const hauteurImport = (u: UniteB) =>
  H_TETE + Math.max(1, u.postes.length) * H_POSTE + H_PIED
const H_MIEN = 58

/* ── Nodes ──────────────────────────────────────────────────────────────── */

type DonneesImport = {
  u: UniteB
  membres: Record<string, OrgMembre>
  club: string
  onOuvrir: (id: string) => void
  onAjouter: (parentId: string) => void
}
type DonneesMien = { u: OrgUnite; ancre: boolean }

type NoeudImportType = Node<DonneesImport, "import">
type NoeudMienType = Node<DonneesMien, "mien">

const poignee = "!size-2 !border-0 !bg-border-strong"

/**
 * An imported unité, drawn as it will land: each poste with who takes it —
 * a face when it's filled, amber "À pourvoir" when not. The whole card opens
 * the editor; only "+ sous-unité" is its own gesture.
 */
function NoeudImport({ data }: NodeProps<NoeudImportType>) {
  const { u, membres, club } = data
  const ok = u.postes.filter(estPourvu).length
  const docs = u.postes.reduce(
    (n, p) => n + (p.ficheId ? 1 : 0) + p.charteIds.length + p.roles.length,
    0,
  )
  return (
    <div
      style={{ width: W_IMPORT }}
      className={cn(
        "group relative cursor-pointer rounded-lg border bg-surface transition-colors",
        u.inclus
          ? "border-brand-blue-600/50 hover:border-brand-blue-600"
          : "border-dashed border-border-strong opacity-55 hover:opacity-80",
      )}
      onClick={() => data.onOuvrir(u.id)}
    >
      <Handle type="target" position={Position.Top} className={poignee} />
      <Handle type="source" position={Position.Bottom} className={poignee} />

      <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-surface-nested text-ink-muted">
          {u.inclus ? <Network size={13} /> : <EyeOff size={13} />}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-ui text-[0.82rem] font-medium text-ink">
            {u.nom || "Sans nom"}
          </span>
          <span className="block font-body text-[0.66rem] text-ink-disabled">
            {u.inclus ? (u.source ? `Importée de ${club}` : "Ajoutée pendant l'import") : "Non importée"}
          </span>
        </span>
        {u.inclus && u.postes.length ? (
          <span
            className={cn(
              "shrink-0 font-ui text-[0.7rem] tabular-nums",
              ok < u.postes.length ? "text-warning" : "text-success",
            )}
          >
            {ok}/{u.postes.length}
          </span>
        ) : null}
      </div>

      <ul className="flex flex-col px-2 py-1.5">
        {u.postes.length ? (
          u.postes.map((p) => <LignePosteNoeud key={p.id} p={p} membres={membres} />)
        ) : (
          <li className="px-1 py-2 font-body text-[0.72rem] text-ink-disabled">Aucun poste</li>
        )}
      </ul>

      <div className="flex items-center justify-between border-t border-border px-3 py-2">
        <span className="inline-flex items-center gap-1 font-ui text-[0.66rem] text-ink-disabled">
          {docs ? (
            <>
              <FileText size={11} /> {docs} lien{docs > 1 ? "s" : ""} documents
            </>
          ) : null}
        </span>
        {u.inclus ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              data.onAjouter(u.id)
            }}
            className="nodrag inline-flex items-center gap-1 font-ui text-[0.66rem] font-medium tracking-[0.04em] text-info uppercase transition-opacity hover:opacity-80"
          >
            <Plus size={11} /> Sous-unité
          </button>
        ) : null}
      </div>
    </div>
  )
}

function LignePosteNoeud({ p, membres }: { p: PosteB; membres: Record<string, OrgMembre> }) {
  const a = p.affectation
  const qui =
    a.kind === "membre" ? membres[a.membreId]?.nom : a.kind === "nouveau" && a.nom.trim() ? a.nom.trim() : null
  return (
    <li className="flex items-center gap-2 rounded-sm px-1 py-1">
      {qui ? (
        <Avatar name={qui} size="sm" />
      ) : (
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-dashed border-warning/60 font-ui text-[0.6rem] text-warning">
          ?
        </span>
      )}
      <span className="min-w-0 flex-1 leading-tight">
        <span className={cn("flex items-center gap-1 truncate font-body text-[0.74rem]", qui ? "text-ink" : "text-warning")}>
          <span className="truncate">{qui ?? "À pourvoir"}</span>
          {a.kind === "membre" && a.suggere ? <Sparkles size={10} className="shrink-0 text-info" /> : null}
          {a.kind === "nouveau" && qui ? <span className="shrink-0 text-[0.62rem] text-info">nouveau</span> : null}
        </span>
        <span className="block truncate font-body text-[0.64rem] text-ink-muted">{p.intitule}</span>
      </span>
      {p.ficheId ? <ClipboardList size={11} className="shrink-0 text-ink-disabled" /> : null}
      {p.charteIds.length ? <Shield size={11} className="shrink-0 text-ink-disabled" /> : null}
    </li>
  )
}

/** One of our existing unités — context only, quiet and compact. */
function NoeudMien({ data }: NodeProps<NoeudMienType>) {
  const { u, ancre } = data
  return (
    <div
      style={{ width: W_MIEN }}
      className={cn(
        "rounded-lg border bg-background px-3 py-2.5",
        ancre ? "border-info" : "border-border opacity-60",
      )}
    >
      <Handle type="target" position={Position.Top} className={poignee} />
      <Handle type="source" position={Position.Bottom} className={poignee} />
      <span className="flex items-center gap-2">
        {ancre ? <Anchor size={12} className="shrink-0 text-info" /> : null}
        <span className="truncate font-ui text-[0.78rem] text-ink-subtle">{u.nom}</span>
      </span>
      <span className="block font-body text-[0.64rem] text-ink-disabled">
        {ancre ? "Point de rattachement · " : ""}
        {u.membres.length} membre{u.membres.length > 1 ? "s" : ""}
      </span>
    </div>
  )
}

const nodeTypes = { import: NoeudImport, mien: NoeudMien }

/* ── Layout ─────────────────────────────────────────────────────────────── */

function construireGraphe(
  b: BrouillonImport,
  orgUnites: OrgUnite[],
  contexte: Contexte,
  donnees: Omit<DonneesImport, "u">,
) {
  const g = new dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({ rankdir: "TB", ranksep: 70, nodesep: 36 })

  const ancreId = b.placement.kind === "sous" ? `o:${b.placement.uniteId}` : null
  const edges: Edge[] = []
  const lien = (source: string, target: string, importe: boolean) => {
    g.setEdge(source, target)
    edges.push({
      id: `${source}->${target}`,
      source,
      target,
      type: "smoothstep",
      style: {
        stroke: importe ? "var(--brand-blue-600)" : "var(--border-strong)",
        strokeWidth: importe ? 1.5 : 1,
        strokeDasharray: importe ? undefined : "4 4",
      },
    })
  }

  if (contexte === "complet") {
    for (const u of orgUnites) g.setNode(`o:${u.id}`, { width: W_MIEN, height: H_MIEN })
    for (const u of orgUnites) if (u.parentId) lien(`o:${u.parentId}`, `o:${u.id}`, false)
  }
  for (const u of b.unites) g.setNode(`i:${u.id}`, { width: W_IMPORT, height: hauteurImport(u) })
  for (const u of b.unites) {
    if (u.parentId) lien(`i:${u.parentId}`, `i:${u.id}`, true)
    else if (contexte === "complet" && ancreId) lien(ancreId, `i:${u.id}`, true)
  }

  dagre.layout(g)

  const pos = (id: string, w: number) => {
    const n = g.node(id)
    return { x: n.x - w / 2, y: n.y - n.height / 2 }
  }
  const nodes: (NoeudImportType | NoeudMienType)[] = [
    ...(contexte === "complet"
      ? orgUnites.map<NoeudMienType>((u) => ({
          id: `o:${u.id}`,
          type: "mien",
          position: pos(`o:${u.id}`, W_MIEN),
          data: { u, ancre: `o:${u.id}` === ancreId },
          draggable: false,
          selectable: false,
        }))
      : []),
    ...b.unites.map<NoeudImportType>((u) => ({
      id: `i:${u.id}`,
      type: "import",
      position: pos(`i:${u.id}`, W_IMPORT),
      data: { ...donnees, u },
      draggable: false,
    })),
  ]
  return { nodes, edges }
}

/* ── Visual mode ────────────────────────────────────────────────────────── */

/**
 * The same draft as the guided flow, shown as the organigramme it will become.
 * Blue cards are what you import; with "Dans mon organigramme" your own
 * unités appear around them (quiet, dashed links) so you see exactly where
 * the branch lands. Click a card to edit it; documents and the final check
 * open as centered modals over the chart.
 */
export function VueVisuelle({
  b,
  maj,
  club,
  ancre,
  partage,
  resume,
  onImporter,
  onAnnuler,
}: {
  b: BrouillonImport
  maj: Maj
  club: string
  ancre: string
  partage: OrgPartage
  resume: ResumeImport
  onImporter: () => void
  onAnnuler: () => void
}) {
  const { orgUnites, orgMembres, fiches } = useData()
  const [contexte, setContexte] = useState<Contexte>("seul")
  const [edition, setEdition] = useState<string | null>(null)
  const [docsOuverts, setDocsOuverts] = useState(false)
  const [valider, setValider] = useState(false)
  const flow = useRef<ReactFlowInstance<NoeudImportType | NoeudMienType, Edge> | null>(null)

  const membresById = useMemo(
    () => Object.fromEntries(orgMembres.map((m) => [m.id, m])),
    [orgMembres],
  )

  const ajouterSousUnite = (parentId: string | null) => {
    const id = crypto.randomUUID()
    maj((prev) => ({
      ...prev,
      unites: [...prev.unites, { id, nom: "Nouvelle unité", parentId, inclus: true, source: false, postes: [] }],
    }))
    setEdition(id)
  }

  const { nodes, edges } = useMemo(
    () =>
      construireGraphe(b, orgUnites, contexte, {
        membres: membresById,
        club,
        onOuvrir: setEdition,
        onAjouter: ajouterSousUnite,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [b, orgUnites, contexte, membresById, club],
  )

  // Re-frame when what's on the canvas changes shape (context, placement, count).
  const forme = `${contexte}|${b.placement.kind === "sous" ? b.placement.uniteId : "racine"}|${b.unites.length}`
  useEffect(() => {
    requestAnimationFrame(() => flow.current?.fitView({ padding: 0.12, duration: 260 }))
  }, [forme])

  const inclus = b.unites.filter((u) => u.inclus)
  const postes = inclus.flatMap((u) => u.postes)
  const pourvus = postes.filter(estPourvu).length
  const usage = docsUtilises(b)
  const aVerifier = [...usage.keys()].filter((id) => {
    const m = b.docs[id]
    return m?.mode === "lier" && m.suggere
  }).length
  const enEdition = b.unites.find((u) => u.id === edition)

  return (
    <div className="flex flex-col gap-4">
      {/* ── Toolbar ── */}
      <div className="flex flex-col gap-3 rounded-lg border border-border p-3.5 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2">
            <span className="font-ui text-[0.66rem] font-medium tracking-[0.08em] text-ink-muted uppercase">Placer</span>
            <select
              value={b.placement.kind === "sous" ? b.placement.uniteId : ""}
              onChange={(e) =>
                maj((x) => ({
                  ...x,
                  placement: e.target.value ? { kind: "sous", uniteId: e.target.value } : { kind: "racine" },
                }))
              }
              aria-label="Où placer la structure importée"
              className="rounded-md border border-input bg-transparent px-3 py-1.5 font-body text-sm text-ink outline-none focus:border-border-focus"
            >
              <option value="">Nouvelle branche à la racine</option>
              {orgUnites.map((u) => (
                <option key={u.id} value={u.id}>
                  Sous « {u.nom} »
                </option>
              ))}
            </select>
          </label>
          <Segmented
            value={contexte}
            onChange={setContexte}
            options={[
              { value: "seul", label: "Import seul" },
              { value: "complet", label: "Dans mon organigramme" },
            ]}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 font-body text-[0.8rem] text-ink-muted tabular-nums">
            <span className="text-ink">{inclus.length}</span> unités ·{" "}
            <span className="text-success">{pourvus}</span>/{postes.length} postes pourvus
          </span>
          <Button size="sm" variant="outline" onClick={() => ajouterSousUnite(null)}>
            <Plus /> Unité
          </Button>
          <Button size="sm" variant="outline" onClick={() => setDocsOuverts(true)}>
            <FileText /> Documents
            <span className="rounded-pill bg-accent px-1.5 text-[0.66rem] tabular-nums">{usage.size}</span>
            {aVerifier ? <Sparkles size={12} className="text-info" /> : null}
          </Button>
          <Button size="sm" variant="ghost" onClick={onAnnuler}>
            Annuler
          </Button>
          <Button size="sm" onClick={() => setValider(true)} disabled={resume.nbUnites === 0}>
            <Check /> Importer…
          </Button>
        </div>
      </div>

      {/* ── Canvas ── */}
      <div className="relative h-[68vh] min-h-[520px] overflow-hidden rounded-lg border border-border">
        <ReactFlow
          colorMode="dark"
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onInit={(inst) => (flow.current = inst)}
          fitView
          fitViewOptions={{ padding: 0.12 }}
          minZoom={0.15}
          nodesConnectable={false}
          zoomOnDoubleClick={false}
          proOptions={{ hideAttribution: true }}
          className="org-flow"
        >
          <Background variant={BackgroundVariant.Dots} gap={18} size={1} color="#2e2e2e" />
          <Controls
            showInteractive={false}
            className="!rounded-md !border !border-border !bg-surface !shadow-none [&_button]:!border-border [&_button]:!bg-transparent [&_button]:!text-ink-muted [&_button:hover]:!bg-surface-hover [&_button:hover]:!text-ink [&_svg]:!fill-current"
          />
        </ReactFlow>

        {/* Legend */}
        <div className="pointer-events-none absolute top-3 left-3 flex flex-col gap-1.5 rounded-md border border-border bg-background/90 px-3 py-2 font-body text-[0.7rem] text-ink-muted">
          <span className="flex items-center gap-2">
            <span className="size-2.5 rounded-sm border border-brand-blue-600" /> Importé de {club} — cliquez pour modifier
          </span>
          {contexte === "complet" ? (
            <span className="flex items-center gap-2">
              <span className="size-2.5 rounded-sm border border-border-strong" /> Votre organigramme
            </span>
          ) : null}
          <span className="flex items-center gap-2">
            <span className="size-2.5 rounded-full border border-dashed border-warning" /> Poste à pourvoir
          </span>
        </div>
      </div>

      <p className="font-body text-[0.78rem] text-ink-disabled">
        {ancre} · les personnes de {club} ne sont pas importées : chaque poste est confié à quelqu'un de votre club.
      </p>

      {/* ── Unit editor ── */}
      <Dialog open={!!enEdition} onOpenChange={(o) => !o && setEdition(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-xl sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Modifier l'unité</DialogTitle>
            <DialogDescription>Les changements s'affichent aussitôt sur l'organigramme.</DialogDescription>
          </DialogHeader>
          {enEdition ? (
            <EditeurUnite
              b={b}
              maj={maj}
              uniteId={enEdition.id}
              club={club}
              ancre={ancre}
              membres={orgMembres}
              documents={partage.documents}
              onSelect={(id) => setEdition(id || null)}
            />
          ) : null}
          <DialogFooter>
            <Button onClick={() => setEdition(null)}>
              <Check /> Terminé
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Documents ── */}
      <Dialog open={docsOuverts} onOpenChange={setDocsOuverts}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-xl sm:max-w-6xl">
          <DialogHeader>
            <DialogTitle>Documents de l'organigramme</DialogTitle>
            <DialogDescription>
              Reliez chaque document de {club} à l'un des vôtres, importez-en une copie, ou ignorez-le.
            </DialogDescription>
          </DialogHeader>
          <EtapeDocuments b={b} maj={maj} club={club} documents={partage.documents} fiches={fiches} />
          <DialogFooter>
            <Button onClick={() => setDocsOuverts(false)}>
              <Check /> Terminé
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Final check ── */}
      <Dialog open={valider} onOpenChange={setValider}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-xl sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Importer l'organigramme ?</DialogTitle>
            <DialogDescription>Voici exactement ce qui sera ajouté à votre club.</DialogDescription>
          </DialogHeader>
          <EtapeValidation resume={resume} ancre={ancre} club={club} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setValider(false)}>
              Revenir à l'organigramme
            </Button>
            <Button onClick={onImporter}>
              <Check /> Importer l'organigramme
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

