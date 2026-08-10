import {
  BookOpen,
  ClipboardList,
  FileText,
  ListChecks,
  Shield,
  type LucideIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge, type BadgeVariant } from "@/components/kit/Badge"
import type {
  FicheStatut,
  FicheType,
  MembreLieStatut,
} from "@/data/seed/fichesPoste"

/**
 * Shared chrome for the Fiches & Documents module.
 *
 * The reference design colour-codes the four document families (blue / purple /
 * green / gold). The design system reserves colour for real status and keeps
 * every tag on the one brand blue, so here the families are told apart by their
 * **icon** instead — same at-a-glance scan, no invented palette. Colour is left
 * to what genuinely is status: Actif vs Brouillon, and how a member is bound.
 */

const TYPE_ICONS: Record<Exclude<FicheType, "">, LucideIcon> = {
  "Fiche de Poste": ClipboardList,
  Charte: Shield,
  Règlement: BookOpen,
  "Liste des Rôles": ListChecks,
}

/** The icon standing for a document family ("Sans type" falls back to a page). */
export function typeIcon(type: FicheType): LucideIcon {
  return type ? TYPE_ICONS[type] : FileText
}

/** Square icon tile — the nested fill allowed inside a card (rule 1). */
export function TypeTile({
  type,
  size = "sm",
}: {
  type: FicheType
  size?: "sm" | "lg"
}) {
  const Icon = typeIcon(type)
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-md bg-surface-nested text-ink-muted transition-colors",
        size === "lg" ? "size-11 rounded-lg" : "size-8",
      )}
    >
      <Icon size={size === "lg" ? 20 : 15} strokeWidth={2} />
    </span>
  )
}

/** Document family, as a tag (always brand blue — it's a category, not status). */
export function TypeBadge({ type }: { type: FicheType }) {
  return <Badge variant="info">{type || "Sans type"}</Badge>
}

/** Actif = in force (success), Brouillon = still being written (warning). */
export function StatutBadge({ statut }: { statut: FicheStatut }) {
  return (
    <Badge variant={statut === "Actif" ? "success" : "warning"} dot>
      {statut}
    </Badge>
  )
}

/** How a member is bound: signed/validated/held is a real state, so it's coloured. */
const MEMBRE_STATUT_VARIANTS: Record<MembreLieStatut, BadgeVariant> = {
  Titulaire: "success",
  Validé: "success",
  Signataire: "info",
  Assigné: "info",
  Concerné: "default",
}

export function MembreStatutBadge({ statut }: { statut: MembreLieStatut }) {
  return <Badge variant={MEMBRE_STATUT_VARIANTS[statut]}>{statut}</Badge>
}
