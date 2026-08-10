import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type Edge,
  type EdgeProps,
} from "@xyflow/react"
import { Link2 } from "lucide-react"

export type RelationEdgeData = {
  libelle: string
  onOpen: (relationId: string) => void
}

export type RelationEdgeType = Edge<RelationEdgeData, "relation">

/**
 * A relation transverse: a dashed blue link that ignores the hierarchy, with
 * its label carried in a clickable pill at the middle of the curve (clicking it
 * opens the rename / delete modal). Blue and dashed keeps it clearly apart from
 * the solid neutral tree edges.
 */
export function RelationEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
}: EdgeProps<RelationEdgeType>) {
  const [path, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  })

  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        /* The label pill is the affordance — without this the edge's invisible
           hit area (20px wide) would sit on top of it and swallow the click. */
        interactionWidth={0}
        style={{
          stroke: "var(--brand-blue-600)",
          strokeWidth: 1.6,
          strokeDasharray: "5 4",
          /* The curve itself is decoration — it must not sit in front of its
             own label pill, which is the only clickable part. */
          pointerEvents: "none",
        }}
      />
      <EdgeLabelRenderer>
        <button
          type="button"
          onClick={() => data?.onOpen(id)}
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
          }}
          className="nodrag nopan pointer-events-auto absolute inline-flex items-center gap-1.5 rounded-pill border border-brand-blue-600/30 bg-surface px-2.5 py-1 font-ui text-[0.68rem] font-medium text-brand-blue-600 transition-colors hover:border-brand-blue-600"
        >
          <Link2 size={12} />
          {data?.libelle || "Relation"}
        </button>
      </EdgeLabelRenderer>
    </>
  )
}
