/**
 * Fiches & Documents — the club's written referential: fiches de poste,
 * chartes, règlements and listes des rôles, each one tied to the members it
 * concerns (a titulaire, the signataires of a charte, the staff a liste des
 * rôles assigns…).
 *
 * Distinct from `seed/documents.ts`: that one is the free-form document
 * catalogue (rapports, comptes rendus) with an editor behind it. This module
 * is about *who* a document binds, so every fiche carries its `membres`.
 *
 * Seed rows keep readable slug ids; rows added at runtime get crypto UUIDs.
 */

/** The four document families (empty string = "Sans type"). */
export type FicheType =
  | ""
  | "Fiche de Poste"
  | "Charte"
  | "Règlement"
  | "Liste des Rôles"

export const FICHE_TYPES: { value: FicheType; label: string }[] = [
  { value: "", label: "Sans type" },
  { value: "Fiche de Poste", label: "Fiche de Poste" },
  { value: "Charte", label: "Charte" },
  { value: "Règlement", label: "Règlement" },
  { value: "Liste des Rôles", label: "Liste des Rôles" },
]

/** Types a filter chip can point at, in display order. */
export const FICHE_TYPE_FILTERS = [
  "Fiche de Poste",
  "Charte",
  "Règlement",
  "Liste des Rôles",
] as const

/** Actif = in force; Brouillon = still being written. */
export type FicheStatut = "Actif" | "Brouillon"

/**
 * How a member is bound to a document — a fiche de poste has a titulaire, a
 * charte is signed, a règlement is validated, a liste des rôles assigns, and
 * everything else simply concerns people.
 */
export type MembreLieStatut =
  | "Titulaire"
  | "Signataire"
  | "Validé"
  | "Assigné"
  | "Concerné"

/** One person as shown in a document's "Membres concernés" table. */
export type MembreLie = {
  id: string
  nom: string
  role: string
  groupe: string
  /** Month they joined that role, e.g. "Sep 2022". */
  depuis: string
  statut: MembreLieStatut
}

export type Fiche = {
  id: string
  titre: string
  type: FicheType
  /** Poste / périmètre the document covers ("Entraîneur Principal", "Tous membres"…). */
  perimetre: string
  /** Display date, e.g. "28 Feb 2025". */
  majLe: string
  auteur: string
  statut: FicheStatut
  /** Revision label, e.g. "v2.1". */
  version: string
  membres: MembreLie[]
}

/* ── Member picker referential ─────────────────────────────────────────────
   The three ways "Nouveau document" scopes a document: by staff group, by
   poste family, or member by member. Counts are the club's real headcounts,
   so the picker reads believable even though only the annuaire is listed. */

export type SelectableGroup = { id: string; label: string; count: number }

/** Groupe Staff tab — the club's six organisational groups. */
export const staffGroupes: SelectableGroup[] = [
  { id: "sg-direction", label: "Comité Directeur", count: 5 },
  { id: "sg-technique", label: "Staff Technique", count: 6 },
  { id: "sg-medical", label: "Service Médical", count: 3 },
  { id: "sg-admin", label: "Administration", count: 4 },
  { id: "sg-com", label: "Communication", count: 3 },
  { id: "sg-joueurs", label: "Équipe Première", count: 22 },
]

/** Par Poste tab — job families, cutting across the groups above. */
export const posteGroupes: SelectableGroup[] = [
  { id: "pg-joueurs", label: "Joueurs", count: 22 },
  { id: "pg-entraineurs", label: "Entraîneurs", count: 3 },
  { id: "pg-prep", label: "Préparateurs Physiques", count: 2 },
  { id: "pg-analystes", label: "Analystes Vidéo", count: 2 },
  { id: "pg-kine", label: "Kinésithérapeutes", count: 2 },
  { id: "pg-dirigeants", label: "Dirigeants", count: 5 },
  { id: "pg-media", label: "Responsables Médias", count: 3 },
  { id: "pg-admin", label: "Administratifs", count: 4 },
]

export type AnnuaireMembre = {
  id: string
  nom: string
  poste: string
  groupe: string
}

/** Individuel tab — the club's staff annuaire, grouped on screen by `groupe`. */
export const annuaire: AnnuaireMembre[] = [
  { id: "m1", nom: "Khalil Ayari", poste: "Président", groupe: "Comité Directeur" },
  { id: "m2", nom: "Nadia Rekik", poste: "Vice-Présidente", groupe: "Comité Directeur" },
  { id: "m3", nom: "Sami Trabelsi", poste: "Trésorier", groupe: "Comité Directeur" },
  { id: "m4", nom: "Leila Guesmi", poste: "Secrétaire Générale", groupe: "Comité Directeur" },
  { id: "m5", nom: "Hedi Ben Ammar", poste: "Membre CD", groupe: "Comité Directeur" },
  { id: "m6", nom: "Amine Benali", poste: "Entraîneur Principal", groupe: "Staff Technique" },
  { id: "m7", nom: "Riadh Zouari", poste: "Entraîneur Adjoint", groupe: "Staff Technique" },
  { id: "m8", nom: "Omar Hamdi", poste: "Entraîneur des Gardiens", groupe: "Staff Technique" },
  { id: "m9", nom: "Tarek Mansouri", poste: "Préparateur Physique", groupe: "Staff Technique" },
  { id: "m10", nom: "Wissem Dridi", poste: "Préparateur Physique", groupe: "Staff Technique" },
  { id: "m11", nom: "Cyrine Lajmi", poste: "Analyste Vidéo", groupe: "Staff Technique" },
  { id: "m12", nom: "Dr. Mehdi Karray", poste: "Médecin du Club", groupe: "Service Médical" },
  { id: "m13", nom: "Asma Ferchichi", poste: "Kinésithérapeute", groupe: "Service Médical" },
  { id: "m14", nom: "Bilel Chaabane", poste: "Kinésithérapeute", groupe: "Service Médical" },
  { id: "m15", nom: "Ines Turki", poste: "Directrice Admin.", groupe: "Administration" },
  { id: "m16", nom: "Mohamed Gharbi", poste: "Comptable", groupe: "Administration" },
  { id: "m17", nom: "Dorra Slim", poste: "Assistante RH", groupe: "Administration" },
  { id: "m18", nom: "Farouk Belhaj", poste: "Logisticien", groupe: "Administration" },
  { id: "m19", nom: "Karim Slama", poste: "Responsable Com.", groupe: "Communication" },
  { id: "m20", nom: "Rim Mabrouk", poste: "Community Manager", groupe: "Communication" },
  { id: "m21", nom: "Yassine Nasr", poste: "Photographe", groupe: "Communication" },
]

/* ── Seed ─────────────────────────────────────────────────────────────────── */

/** The three people every club-wide document concerns by default. */
const perimetreLarge: MembreLie[] = [
  {
    id: "mx1",
    nom: "Khalil Ayari",
    role: "Président",
    groupe: "Comité Directeur",
    depuis: "Jan 2021",
    statut: "Concerné",
  },
  {
    id: "mx2",
    nom: "Amine Benali",
    role: "Entraîneur Principal",
    groupe: "Staff Technique",
    depuis: "Sep 2022",
    statut: "Concerné",
  },
  {
    id: "mx3",
    nom: "Ines Turki",
    role: "Directrice Admin.",
    groupe: "Administration",
    depuis: "Feb 2022",
    statut: "Concerné",
  },
]

export const fichesSeed: Fiche[] = [
  {
    id: "fiche-entraineur-principal",
    titre: "Fiche de Poste – Entraîneur Principal",
    type: "Fiche de Poste",
    perimetre: "Entraîneur Principal",
    majLe: "28 Feb 2025",
    auteur: "A. Benali",
    statut: "Actif",
    version: "v2.1",
    // A single titulaire — the edge case that makes the members table look real.
    membres: [
      {
        id: "m6",
        nom: "Amine Benali",
        role: "Entraîneur Principal",
        groupe: "Staff Technique",
        depuis: "Sep 2022",
        statut: "Titulaire",
      },
    ],
  },
  {
    id: "fiche-charte-ethique",
    titre: "Charte Éthique du Club",
    type: "Charte",
    perimetre: "Tous membres",
    majLe: "14 Jan 2025",
    auteur: "Direction",
    statut: "Actif",
    version: "v1.3",
    membres: [
      {
        id: "m1",
        nom: "Khalil Ayari",
        role: "Président",
        groupe: "Comité Directeur",
        depuis: "Jan 2021",
        statut: "Signataire",
      },
      {
        id: "m6",
        nom: "Amine Benali",
        role: "Entraîneur Principal",
        groupe: "Staff Technique",
        depuis: "Sep 2022",
        statut: "Signataire",
      },
      {
        id: "m12",
        nom: "Dr. Mehdi Karray",
        role: "Médecin du Club",
        groupe: "Service Médical",
        depuis: "Mar 2023",
        statut: "Signataire",
      },
      {
        id: "m15",
        nom: "Ines Turki",
        role: "Directrice Admin.",
        groupe: "Administration",
        depuis: "Feb 2022",
        statut: "Signataire",
      },
      {
        id: "m19",
        nom: "Karim Slama",
        role: "Responsable Com.",
        groupe: "Communication",
        depuis: "Jul 2023",
        statut: "Signataire",
      },
    ],
  },
  {
    id: "fiche-reglement-interieur-2025",
    titre: "Règlement Intérieur 2025",
    type: "Règlement",
    perimetre: "Tous membres",
    majLe: "01 Jan 2025",
    auteur: "Secrétariat",
    statut: "Actif",
    version: "v3.0",
    // The fullest record: the whole comité directeur plus the lead coaches.
    membres: [
      {
        id: "m1",
        nom: "Khalil Ayari",
        role: "Président",
        groupe: "Comité Directeur",
        depuis: "Jan 2021",
        statut: "Validé",
      },
      {
        id: "m2",
        nom: "Nadia Rekik",
        role: "Vice-Présidente",
        groupe: "Comité Directeur",
        depuis: "Jan 2021",
        statut: "Validé",
      },
      {
        id: "m3",
        nom: "Sami Trabelsi",
        role: "Trésorier",
        groupe: "Comité Directeur",
        depuis: "Jan 2021",
        statut: "Validé",
      },
      {
        id: "m4",
        nom: "Leila Guesmi",
        role: "Secrétaire Générale",
        groupe: "Comité Directeur",
        depuis: "Jan 2021",
        statut: "Validé",
      },
      {
        id: "m5",
        nom: "Hedi Ben Ammar",
        role: "Membre CD",
        groupe: "Comité Directeur",
        depuis: "Jan 2021",
        statut: "Validé",
      },
      {
        id: "m6",
        nom: "Amine Benali",
        role: "Entraîneur Principal",
        groupe: "Staff Technique",
        depuis: "Sep 2022",
        statut: "Validé",
      },
      {
        id: "m7",
        nom: "Riadh Zouari",
        role: "Entraîneur Adjoint",
        groupe: "Staff Technique",
        depuis: "Sep 2022",
        statut: "Validé",
      },
    ],
  },
  {
    id: "fiche-roles-staff-technique",
    titre: "Liste des Rôles – Staff Technique",
    type: "Liste des Rôles",
    perimetre: "Staff Technique",
    majLe: "10 Feb 2025",
    auteur: "M. Trabelsi",
    statut: "Actif",
    version: "v1.0",
    membres: [
      {
        id: "m6",
        nom: "Amine Benali",
        role: "Entraîneur Principal",
        groupe: "Staff Technique",
        depuis: "Sep 2022",
        statut: "Assigné",
      },
      {
        id: "m7",
        nom: "Riadh Zouari",
        role: "Entraîneur Adjoint",
        groupe: "Staff Technique",
        depuis: "Sep 2022",
        statut: "Assigné",
      },
      {
        id: "m8",
        nom: "Omar Hamdi",
        role: "Entraîneur des Gardiens",
        groupe: "Staff Technique",
        depuis: "Oct 2023",
        statut: "Assigné",
      },
      {
        id: "m9",
        nom: "Tarek Mansouri",
        role: "Préparateur Physique",
        groupe: "Staff Technique",
        depuis: "Sep 2022",
        statut: "Assigné",
      },
      {
        id: "m10",
        nom: "Wissem Dridi",
        role: "Préparateur Physique",
        groupe: "Staff Technique",
        depuis: "Jan 2024",
        statut: "Assigné",
      },
      {
        id: "m11",
        nom: "Cyrine Lajmi",
        role: "Analyste Vidéo",
        groupe: "Staff Technique",
        depuis: "Feb 2024",
        statut: "Assigné",
      },
    ],
  },
  {
    id: "fiche-preparateur-physique",
    titre: "Fiche de Poste – Préparateur Physique",
    type: "Fiche de Poste",
    perimetre: "Préparateur Physique",
    majLe: "22 Feb 2025",
    auteur: "A. Benali",
    // The one still-unpublished document — shows the Brouillon state.
    statut: "Brouillon",
    version: "v1.1",
    membres: perimetreLarge,
  },
  {
    id: "fiche-charte-partenaires",
    titre: "Charte des Partenaires",
    type: "Charte",
    perimetre: "Partenaires Commerciaux",
    majLe: "05 Dec 2024",
    auteur: "Direction",
    statut: "Actif",
    version: "v1.0",
    membres: perimetreLarge,
  },
  {
    id: "fiche-reglement-sportif",
    titre: "Règlement Sportif – Compétitions",
    type: "Règlement",
    perimetre: "Joueurs & Staff",
    majLe: "15 Aug 2024",
    auteur: "Comité Sportif",
    statut: "Actif",
    version: "v2.4",
    membres: perimetreLarge,
  },
  {
    id: "fiche-directeur-general",
    titre: "Fiche de Poste – Directeur Général",
    type: "Fiche de Poste",
    perimetre: "Directeur Général (CEO)",
    majLe: "11 Mar 2025",
    auteur: "RH",
    statut: "Actif",
    version: "v1.0",
    membres: perimetreLarge,
  },
  {
    id: "fiche-roles-comite-directeur",
    titre: "Liste des Rôles – Comité Directeur",
    type: "Liste des Rôles",
    perimetre: "Comité Directeur",
    majLe: "18 Jan 2025",
    auteur: "Secrétariat",
    statut: "Actif",
    version: "v2.2",
    membres: perimetreLarge,
  },
  {
    id: "fiche-analyste-video",
    titre: "Fiche de Poste – Analyste Vidéo",
    type: "Fiche de Poste",
    perimetre: "Analyste Vidéo",
    majLe: "03 Feb 2025",
    auteur: "A. Benali",
    statut: "Actif",
    version: "v1.0",
    membres: perimetreLarge,
  },
  {
    id: "fiche-charte-reseaux-sociaux",
    titre: "Charte Réseaux Sociaux",
    type: "Charte",
    perimetre: "Communication",
    majLe: "19 Nov 2024",
    auteur: "Resp. Com.",
    statut: "Actif",
    version: "v1.2",
    membres: perimetreLarge,
  },
  {
    id: "fiche-kinesitherapeute",
    titre: "Fiche de Poste – Kinésithérapeute",
    type: "Fiche de Poste",
    perimetre: "Kinésithérapeute Sportif",
    majLe: "27 Jan 2025",
    auteur: "RH",
    statut: "Actif",
    version: "v1.0",
    membres: perimetreLarge,
  },
]
