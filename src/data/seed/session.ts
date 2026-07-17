/**
 * Session — who is signed in.
 *
 * The prototype has two spaces sharing one shell: the club back-office (admin)
 * and the sponsor's own space. There is no auth: signing in picks an identity,
 * and the sidebar + routes follow the role. `null` = signed out (→ /connexion).
 */

export type Role = "admin" | "sponsor"

export type Session = {
  role: Role
  /** Person signed in — shown in the account menu. */
  name: string
  /** Line under the name: the club role, or the sponsor's company. */
  subtitle: string
  /** Sponsors only — the linked SponsorAccount id (see seed/sponsoring). */
  accountId?: string
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
