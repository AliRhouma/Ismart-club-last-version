import { Dumbbell, Swords, Users, type LucideIcon } from "lucide-react"

import type { EventType } from "@/data/seed/events"

/**
 * Per-type visual + copy config for calendar events. One calm accent split
 * (design rule 3): séances take the brand blue (the default category), réunions
 * stay neutral. Matches are the exception the system explicitly allows — a
 * fixture is "home-team data", so it carries the team-home green rail (the one
 * sanctioned non-button green). Icons stay blue/neutral: green never tints an
 * icon (rule 2).
 */
export type EventTypeMeta = {
  label: string
  icon: LucideIcon
  /** left rail fill on the chip */
  rail: string
  /** icon color (never green — rule 2) */
  iconColor: string
  /** soft tinted fill for the detail dialog's icon tile */
  tile: string
  titlePlaceholder: string
  categoryPlaceholder: string
  locationPlaceholder: string
  detailPlaceholder: string
}

export const TYPE_META: Record<EventType, EventTypeMeta> = {
  seance: {
    label: "Séance",
    icon: Dumbbell,
    rail: "bg-brand-blue-600",
    iconColor: "text-brand-blue-600",
    tile: "bg-brand-blue-600/10 text-brand-blue-600",
    titlePlaceholder: "Ex. Séance 27",
    categoryPlaceholder: "Ex. Minime · Minime A",
    locationPlaceholder: "Ex. Terrain B",
    detailPlaceholder: "Ex. Jouer dans les intervalles et entre les lignes",
  },
  match: {
    label: "Match",
    icon: Swords,
    rail: "bg-team-home",
    iconColor: "text-ink",
    tile: "bg-team-home/10 text-ink",
    titlePlaceholder: "Ex. Match 207",
    categoryPlaceholder: "Ex. Minime",
    locationPlaceholder: "Ex. Stade municipal",
    detailPlaceholder: "Ex. Minime vs Adversaire FC",
  },
  reunion: {
    label: "Réunion",
    icon: Users,
    rail: "bg-border-strong",
    iconColor: "text-ink-muted",
    tile: "bg-surface-nested text-ink-muted",
    titlePlaceholder: "Ex. Réunion hebdomadaire",
    categoryPlaceholder: "Ex. Staff technique",
    locationPlaceholder: "Ex. Salle 1",
    detailPlaceholder: "Ex. Bilan de la semaine et préparation du match",
  },
}

export const EVENT_TYPES: EventType[] = ["seance", "match", "reunion"]
