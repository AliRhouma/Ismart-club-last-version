/**
 * Ressources humaines — Éducateurs data slice.
 *
 * An éducateur (coach) belongs to one age category (Catégorie) and can be
 * assigned to one or several training groups (Groupes). The list screen shows
 * a photo/initials avatar, the name + email, the category, the groups, and
 * per-row actions. We only model what those columns need, plus a phone for the
 * edit form.
 *
 * Seed rows keep readable slug ids; rows added at runtime get crypto UUIDs.
 */

/** Age categories, oldest club convention first. */
export const CATEGORIES = [
  "Poussin",
  "Benjamin",
  "Minime",
  "Cadet",
  "Junior",
  "Senior",
] as const

export type Category = (typeof CATEGORIES)[number]

/** Training groups the club runs, grouped loosely by category. */
export const GROUPS = [
  "Poussin A",
  "Benjamin A",
  "Benjamin B",
  "Minime A",
  "Minime B",
  "Minime C",
  "Cadet A",
  "Cadet B",
  "Groupe1",
  "Groupe2",
  "Séniors",
] as const

export type Educateur = {
  id: string
  full_name: string
  email: string
  phone?: string
  category: Category
  /** Assigned training groups (0..n). */
  groups: string[]
  /** Optional photo; when absent the avatar falls back to initials. */
  avatar?: string
}

/**
 * A varied, believable roster so the screen reads on first load: a mix of
 * categories, single- and multi-group coaches, a long name, and an edge case
 * (a newly-onboarded coach with no group assigned yet).
 */
export const educateursSeed: Educateur[] = [
  {
    id: "edu-edu-edu",
    full_name: "edu edu",
    email: "educa@gmail.fr",
    phone: "+216 24 118 902",
    category: "Minime",
    groups: ["Minime C"],
  },
  {
    id: "edu-test",
    full_name: "edu test",
    email: "edu@gmail.com",
    phone: "+216 55 340 771",
    category: "Minime",
    groups: ["Minime C"],
  },
  {
    id: "edu-ttt",
    full_name: "educateur TTT",
    email: "educa@gmail.com",
    category: "Minime",
    groups: ["Minime B", "Minime C"],
  },
  {
    id: "edu-john-educat",
    full_name: "john educat",
    email: "edu.joh@gmail.fr",
    phone: "+216 98 214 550",
    category: "Cadet",
    groups: ["Groupe1"],
  },
  {
    id: "edu-john-dde",
    full_name: "John dde",
    email: "doe@gmail.com",
    category: "Minime",
    groups: ["Minime C"],
  },
  {
    id: "edu-john-doe",
    full_name: "John Doe",
    email: "john.12@gmail.com",
    phone: "+216 20 776 431",
    category: "Senior",
    groups: ["Séniors"],
  },
  {
    id: "edu-mohamed-benslimane",
    full_name: "Mohamed Amine Ben Slimane",
    email: "m.benslimane@ismartclub.tn",
    phone: "+216 22 903 145",
    category: "Benjamin",
    groups: ["Benjamin A", "Benjamin B"],
  },
  {
    id: "edu-nouvelle-recrue",
    full_name: "Sarra Khelifi",
    email: "s.khelifi@ismartclub.tn",
    category: "Poussin",
    groups: [],
  },
]
