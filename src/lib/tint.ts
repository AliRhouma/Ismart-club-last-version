/**
 * Deterministic color tinting derived from a string (a name or label).
 * Used by Avatar and Badge so the same person/label always gets the same
 * colour across the app. Every entry references ONLY design-system token
 * utility classes — no hardcoded colours.
 */

export type Tint = {
  /** translucent fill */
  bg: string
  /** solid accent text/icon */
  text: string
}

// One calm accent — blue — never a rainbow (design rule 3). Category badges
// derive a stable but single-hue tint; green is reserved for buttons/success.
const TINTS: readonly Tint[] = [{ bg: "bg-info/10", text: "text-info" }]

/** Stable 32-bit string hash (djb2-ish), independent of platform. */
export function hashString(input: string): number {
  let hash = 0
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i)
    hash |= 0 // force 32-bit
  }
  return Math.abs(hash)
}

/** Pick a deterministic tint for the given string. */
export function tintFor(input: string): Tint {
  return TINTS[hashString(input) % TINTS.length]
}

/** Up to two uppercase initials from a name ("Marie Dupont" → "MD"). */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}
