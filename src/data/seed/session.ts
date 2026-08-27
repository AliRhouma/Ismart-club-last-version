/**
 * Session — who is signed in.
 *
 * The prototype has three spaces sharing one shell: the club back-office
 * (admin), the sponsor's own space, and the parent space (a family following
 * one child). There is no auth: signing in picks an identity, and the sidebar +
 * routes follow the role. `null` = signed out (→ /connexion).
 */

export type Role = "admin" | "sponsor" | "parent"

export type Session = {
  role: Role
  /** Person signed in — shown in the account menu. */
  name: string
  /** Line under the name: the club role, or the sponsor's company. */
  subtitle: string
  /** Sponsors only — the linked SponsorAccount id (see seed/sponsoring). */
  accountId?: string
  /** Parents only — the id of the child followed (see seed/parent). */
  enfantId?: string
}

/** The club admin the prototype opens as. */
export const adminSession: Session = {
  role: "admin",
  name: "Ahmed Ben Salah",
  subtitle: "Trésorier",
}

/**
 * The sponsor identity used by "Se connecter en tant que sponsor". Reuses the
 * seeded Délice Danone account so the two sides of the product line up.
 */
export const sponsorSession: Session = {
  role: "sponsor",
  name: "Sonia Belhaj",
  subtitle: "Délice Danone",
  accountId: "account-delice",
}

/**
 * The parent identity used by "Se connecter en tant que parent". Follows the
 * three Khemiri boys — real joueurs of the club's U10 / U13 / U8 effectifs
 * (seed/categories.ts) — so the coach's roster and the family's space describe
 * the same children. `enfantId` is the child the space opens on.
 */
export const parentSession: Session = {
  role: "parent",
  name: "Nadia Khemiri",
  subtitle: "Famille Khemiri · 3 enfants",
  enfantId: "u10-j7",
}
