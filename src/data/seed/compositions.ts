/**
 * Compositions — the club's saved line-ups (Pôle technique ▸ Composition).
 *
 * Shapes follow the backend's `/game-lineup`: a composition belongs to a
 * catégorie × groupe, names a `formation`, and holds its `joueurs` with
 * pitch coordinates. Coordinates are normalised to **percentages of the board**
 * (0-100, origin top-left, own goal at the BOTTOM — the board is a leaning
 * half-pitch seen from behind one's own goal) so it scales on any screen; the
 * backend stores raw editor pixels.
 */

/* Player portraits + the pitch board, bundled with the app: the prototype
   must render with no backend and no network (CLAUDE.md). Vite hashes and
   emits each one, so these resolve to plain URL strings at runtime. */
import cama from "@/assets/joueurs/cama.jpg"
import coman from "@/assets/joueurs/coman.jpg"
import dembele from "@/assets/joueurs/dembele.jpg"
import griezmann from "@/assets/joueurs/griezmann.jpg"
import kounde from "@/assets/joueurs/kounde.jpg"
import kyks from "@/assets/joueurs/kyks.jpg"
import maignan from "@/assets/joueurs/maignan.jpg"
import saliba from "@/assets/joueurs/saliba.jpg"
import tchoua from "@/assets/joueurs/tchoua.jpg"
import theo from "@/assets/joueurs/theo.jpg"
import upamecano from "@/assets/joueurs/upamecano.jpg"
import boardImage from "@/assets/joueurs/board-4-3-3.png"

export type CompositionJoueur = {
  id: string
  nom: string
  /** Post code as the club writes it: GB, DC, LD, MDC, MOC, AD, AG… */
  poste: string
  photo?: string
  remplacant: boolean
  /** % of pitch width / height. */
  x: number
  y: number
  /**
   * Index of the formation slot the joueur occupies, or `null` in placement
   * libre where x/y are the only truth.
   */
  slot?: number | null
}

/**
 * Captains and the set-piece pecking order. Each list is an **ordered** array of
 * joueur ids: first choice, then who takes over if they're off the pitch.
 */
export type CompositionRoles = {
  capitaine: string | null
  viceCapitaine: string | null
  penaltys: string[]
  coupsFrancsDirects: string[]
  coupsFrancsIndirects: string[]
  corners: string[]
  /** The squad the coach falls back on — bench order. */
  listeAlternative: string[]
}

export const rolesVides = (): CompositionRoles => ({
  capitaine: null,
  viceCapitaine: null,
  penaltys: [],
  coupsFrancsDirects: [],
  coupsFrancsIndirects: [],
  corners: [],
  listeAlternative: [],
})

export type Composition = {
  id: string
  titre: string
  description: string
  categorie: string
  groupe: string
  /** "4-3-3", "2-4-1"… — "" when the title doesn't name one. */
  formation: string
  /** Snapshot of the board saved by the editor. */
  image?: string
  joueurs: CompositionJoueur[]
  /** Editor settings — all optional so the existing seed rows stay valid. */
  sport?: Sport
  /** Free placement ignores the formation slots; x/y become the only truth. */
  placementLibre?: boolean
  /** Which pitch drawing is used — see TERRAINS. */
  terrain?: TerrainId
  /** Board scale. */
  taille?: Taille
  roles?: CompositionRoles
}

/* ── Editor vocabulary ──────────────────────────────────────────────────── */

export const SPORTS = [
  "Foot",
  "Futsal",
  "Handball",
  "Basket",
  "Rugby",
  "Foot américain",
] as const
export type Sport = (typeof SPORTS)[number]

export const TAILLES = ["S", "M", "L"] as const
export type Taille = (typeof TAILLES)[number]

/**
 * The four looks the board can wear. The stadium itself is one asset — a
 * 1206×802 leaning half-pitch — so the variants are treatments of it, plus one
 * drawn fallback for anyone who wants the board to sit quietly in the dark UI.
 */
export const TERRAINS = [
  { id: "stade", label: "Terrain 1", hint: "Stade" },
  { id: "zones", label: "Terrain 2", hint: "Stade + tiers de jeu" },
  { id: "sombre", label: "Terrain 3", hint: "Stade sombre" },
  { id: "sobre", label: "Terrain 4", hint: "Sans photo" },
] as const
export type TerrainId = (typeof TERRAINS)[number]["id"]

export type SlotDef = { poste: string; x: number; y: number }

/**
 * Slot maps, as **percentages of the board**, lifted from the reference editor
 * so the two apps place a squad identically.
 *
 * Two things are load-bearing and would be wrong if generated:
 * - the goalkeeper sits at the **bottom** (y≈80) and the attack at the top —
 *   the board is a half-pitch seen from behind one's own goal;
 * - each line is **perspective-corrected**. The stadium leans, so the near
 *   (defensive) line spreads wider than the far one — 4-3-3 defence sits at
 *   18/38/62/82 while its attack sits at 22/50/78. A linear spread would drift
 *   off the pitch on the near side and pinch on the far side.
 *
 * Foot à 8 and à 5 are ours (the reference is 11-a-side only) and follow the
 * same widening rule.
 */
export const FORMATIONS: Partial<Record<Sport, Record<string, SlotDef[]>>> = {
  "Foot": {
    "3-4-3": [{ poste: "GB", x: 50, y: 80 }, { poste: "DC", x: 68, y: 69 }, { poste: "DC", x: 50, y: 71 }, { poste: "DC", x: 32, y: 69 }, { poste: "MD", x: 80, y: 48 }, { poste: "MC", x: 60, y: 52 }, { poste: "MC", x: 40, y: 52 }, { poste: "MG", x: 20, y: 48 }, { poste: "AD", x: 74, y: 30 }, { poste: "BU", x: 50, y: 24 }, { poste: "AG", x: 26, y: 30 }],
    "3-5-2": [{ poste: "GB", x: 50, y: 80 }, { poste: "DC", x: 68, y: 69 }, { poste: "DC", x: 50, y: 71 }, { poste: "DC", x: 32, y: 69 }, { poste: "LD", x: 84, y: 50 }, { poste: "MC", x: 62, y: 52 }, { poste: "MDC", x: 50, y: 55 }, { poste: "MC", x: 38, y: 52 }, { poste: "LG", x: 16, y: 50 }, { poste: "BU", x: 58, y: 28 }, { poste: "BU", x: 42, y: 28 }],
    "4-3-3": [{ poste: "GB", x: 50, y: 80 }, { poste: "LD", x: 82, y: 68 }, { poste: "DC", x: 62, y: 69 }, { poste: "DC", x: 38, y: 69 }, { poste: "LG", x: 18, y: 68 }, { poste: "MC", x: 66, y: 50 }, { poste: "MDC", x: 50, y: 54 }, { poste: "MC", x: 34, y: 50 }, { poste: "AD", x: 78, y: 32 }, { poste: "BU", x: 50, y: 24 }, { poste: "AG", x: 22, y: 32 }],
    "4-4-2": [{ poste: "GB", x: 50, y: 80 }, { poste: "LD", x: 82, y: 68 }, { poste: "DC", x: 62, y: 69 }, { poste: "DC", x: 38, y: 69 }, { poste: "LG", x: 18, y: 68 }, { poste: "MD", x: 78, y: 48 }, { poste: "MC", x: 60, y: 52 }, { poste: "MC", x: 40, y: 52 }, { poste: "MG", x: 22, y: 48 }, { poste: "BU", x: 58, y: 28 }, { poste: "BU", x: 42, y: 28 }],
    "5-3-2": [{ poste: "GB", x: 50, y: 80 }, { poste: "LD", x: 86, y: 66 }, { poste: "DC", x: 64, y: 69 }, { poste: "DC", x: 50, y: 71 }, { poste: "DC", x: 36, y: 69 }, { poste: "LG", x: 14, y: 66 }, { poste: "MC", x: 64, y: 50 }, { poste: "MDC", x: 50, y: 54 }, { poste: "MC", x: 36, y: 50 }, { poste: "BU", x: 58, y: 28 }, { poste: "BU", x: 42, y: 28 }],
    "5-4-1": [{ poste: "GB", x: 50, y: 80 }, { poste: "LD", x: 86, y: 66 }, { poste: "DC", x: 64, y: 69 }, { poste: "DC", x: 50, y: 71 }, { poste: "DC", x: 36, y: 69 }, { poste: "LG", x: 14, y: 66 }, { poste: "MD", x: 76, y: 48 }, { poste: "MC", x: 60, y: 52 }, { poste: "MC", x: 40, y: 52 }, { poste: "MG", x: 24, y: 48 }, { poste: "BU", x: 50, y: 26 }],
    "3-4-2-1": [{ poste: "GB", x: 50, y: 80 }, { poste: "DC", x: 68, y: 69 }, { poste: "DC", x: 50, y: 71 }, { poste: "DC", x: 32, y: 69 }, { poste: "LD", x: 82, y: 50 }, { poste: "MC", x: 62, y: 54 }, { poste: "MC", x: 38, y: 54 }, { poste: "LG", x: 18, y: 50 }, { poste: "MOC", x: 62, y: 36 }, { poste: "MOC", x: 38, y: 36 }, { poste: "BU", x: 50, y: 22 }],
    "3-5-1-1": [{ poste: "GB", x: 50, y: 80 }, { poste: "DC", x: 68, y: 69 }, { poste: "DC", x: 50, y: 71 }, { poste: "DC", x: 32, y: 69 }, { poste: "LD", x: 84, y: 50 }, { poste: "MC", x: 62, y: 52 }, { poste: "MDC", x: 50, y: 55 }, { poste: "MC", x: 38, y: 52 }, { poste: "LG", x: 16, y: 50 }, { poste: "MOC", x: 50, y: 34 }, { poste: "BU", x: 50, y: 20 }],
    "4-1-4-1": [{ poste: "GB", x: 50, y: 80 }, { poste: "LD", x: 82, y: 68 }, { poste: "DC", x: 62, y: 69 }, { poste: "DC", x: 38, y: 69 }, { poste: "LG", x: 18, y: 68 }, { poste: "MDC", x: 50, y: 57 }, { poste: "MD", x: 80, y: 44 }, { poste: "MC", x: 62, y: 46 }, { poste: "MC", x: 38, y: 46 }, { poste: "MG", x: 20, y: 44 }, { poste: "BU", x: 50, y: 24 }],
    "4-2-2-2": [{ poste: "GB", x: 50, y: 80 }, { poste: "LD", x: 82, y: 68 }, { poste: "DC", x: 62, y: 69 }, { poste: "DC", x: 38, y: 69 }, { poste: "LG", x: 18, y: 68 }, { poste: "MDC", x: 58, y: 54 }, { poste: "MDC", x: 42, y: 54 }, { poste: "MOC", x: 64, y: 40 }, { poste: "MOC", x: 36, y: 40 }, { poste: "BU", x: 56, y: 24 }, { poste: "BU", x: 44, y: 24 }],
    "4-2-3-1": [{ poste: "GB", x: 50, y: 80 }, { poste: "LD", x: 82, y: 68 }, { poste: "DC", x: 62, y: 69 }, { poste: "DC", x: 38, y: 69 }, { poste: "LG", x: 18, y: 68 }, { poste: "MDC", x: 58, y: 54 }, { poste: "MDC", x: 42, y: 54 }, { poste: "AD", x: 76, y: 38 }, { poste: "MOC", x: 50, y: 40 }, { poste: "AG", x: 24, y: 38 }, { poste: "BU", x: 50, y: 22 }],
    "4-3-2-1": [{ poste: "GB", x: 50, y: 80 }, { poste: "LD", x: 82, y: 68 }, { poste: "DC", x: 62, y: 69 }, { poste: "DC", x: 38, y: 69 }, { poste: "LG", x: 18, y: 68 }, { poste: "MC", x: 66, y: 52 }, { poste: "MC", x: 50, y: 55 }, { poste: "MC", x: 34, y: 52 }, { poste: "MOC", x: 62, y: 38 }, { poste: "MOC", x: 38, y: 38 }, { poste: "BU", x: 50, y: 22 }],
    "4-4-1-1": [{ poste: "GB", x: 50, y: 80 }, { poste: "LD", x: 82, y: 68 }, { poste: "DC", x: 62, y: 69 }, { poste: "DC", x: 38, y: 69 }, { poste: "LG", x: 18, y: 68 }, { poste: "MD", x: 78, y: 48 }, { poste: "MC", x: 60, y: 52 }, { poste: "MC", x: 40, y: 52 }, { poste: "MG", x: 22, y: 48 }, { poste: "MOC", x: 50, y: 34 }, { poste: "BU", x: 50, y: 20 }],
    "2-4-1": [{ poste: "GB", x: 50, y: 80 }, { poste: "DC", x: 64, y: 69 }, { poste: "DC", x: 36, y: 69 }, { poste: "MD", x: 78, y: 50 }, { poste: "MC", x: 60, y: 53 }, { poste: "MC", x: 40, y: 53 }, { poste: "MG", x: 22, y: 50 }, { poste: "BU", x: 50, y: 26 }],
    "3-3-1": [{ poste: "GB", x: 50, y: 80 }, { poste: "DC", x: 68, y: 69 }, { poste: "DC", x: 50, y: 71 }, { poste: "DC", x: 32, y: 69 }, { poste: "MD", x: 70, y: 50 }, { poste: "MC", x: 50, y: 53 }, { poste: "MG", x: 30, y: 50 }, { poste: "BU", x: 50, y: 26 }],
    "3-1-3": [{ poste: "GB", x: 50, y: 80 }, { poste: "DC", x: 68, y: 69 }, { poste: "DC", x: 50, y: 71 }, { poste: "DC", x: 32, y: 69 }, { poste: "MDC", x: 50, y: 54 }, { poste: "AD", x: 72, y: 32 }, { poste: "BU", x: 50, y: 26 }, { poste: "AG", x: 28, y: 32 }],
    "2-3-2": [{ poste: "GB", x: 50, y: 80 }, { poste: "DC", x: 64, y: 69 }, { poste: "DC", x: 36, y: 69 }, { poste: "MD", x: 70, y: 51 }, { poste: "MC", x: 50, y: 54 }, { poste: "MG", x: 30, y: 51 }, { poste: "BU", x: 58, y: 28 }, { poste: "BU", x: 42, y: 28 }],
    "1-2-1": [{ poste: "GB", x: 50, y: 80 }, { poste: "DC", x: 50, y: 66 }, { poste: "MC", x: 66, y: 48 }, { poste: "MC", x: 34, y: 48 }, { poste: "BU", x: 50, y: 26 }],
    "2-1-1": [{ poste: "GB", x: 50, y: 80 }, { poste: "DC", x: 63, y: 67 }, { poste: "DC", x: 37, y: 67 }, { poste: "MC", x: 50, y: 48 }, { poste: "BU", x: 50, y: 26 }],
  },
  "Futsal": {
    "1-2-1": [{ poste: "GB", x: 50, y: 82 }, { poste: "FIX", x: 50, y: 62 }, { poste: "AIL", x: 26, y: 45 }, { poste: "AIL", x: 74, y: 45 }, { poste: "PIV", x: 50, y: 24 }],
    "2-2": [{ poste: "GB", x: 50, y: 82 }, { poste: "DC", x: 35, y: 60 }, { poste: "DC", x: 65, y: 60 }, { poste: "BU", x: 35, y: 32 }, { poste: "BU", x: 65, y: 32 }],
  },
  "Handball": {
    "3-2-1": [{ poste: "GB", x: 50, y: 84 }, { poste: "AG", x: 18, y: 60 }, { poste: "ARG", x: 34, y: 56 }, { poste: "DC", x: 50, y: 54 }, { poste: "ARD", x: 66, y: 56 }, { poste: "AD", x: 82, y: 60 }, { poste: "PIV", x: 50, y: 30 }],
  },
  "Basket": {
    "1-2-2": [{ poste: "MEN", x: 50, y: 70 }, { poste: "ARR", x: 30, y: 52 }, { poste: "AIL", x: 70, y: 52 }, { poste: "AIF", x: 38, y: 30 }, { poste: "PIV", x: 62, y: 25 }],
    "2-1-2": [{ poste: "MEN", x: 38, y: 68 }, { poste: "ARR", x: 62, y: 68 }, { poste: "AIL", x: 50, y: 48 }, { poste: "AIF", x: 35, y: 28 }, { poste: "PIV", x: 65, y: 24 }],
  },}

/** The slots of a formation, or [] when the sport is placement libre only. */
export function slotsDe(sport: Sport, formation: string): SlotDef[] {
  return FORMATIONS[sport]?.[formation] ?? []
}

/** Formations offered when creating a composition, by team format. */
export const formationsSeed: { format: string; formations: string[] }[] = [
  {
    format: "Foot à 11",
    formations: ["4-3-3", "4-4-2", "4-2-3-1", "3-5-2", "3-4-3"],
  },
  { format: "Foot à 8", formations: ["3-3-1", "2-4-1", "3-1-3", "2-3-2"] },
  { format: "Foot à 5", formations: ["1-2-1", "2-1-1"] },
]

export const compositionsSeed: Composition[] = [
  {
    id: "compo-u10-2-4-1",
    titre: "U10 - 2-4-1",
    description: "",
    categorie: "U10",
    groupe: "Groupe A",
    formation: "2-4-1",
    image: boardImage,
    joueurs: [
      {
        id: "compo-u10-2-4-1-j1",
        nom: "Rayan Chaabane",
        poste: "GB",
        remplacant: false,
        x: 50.0,
        y: 80.0,
      },
      {
        id: "compo-u10-2-4-1-j2",
        nom: "Malek Bouzid",
        poste: "DC",
        remplacant: false,
        x: 64.0,
        y: 69.0,
      },
      {
        id: "compo-u10-2-4-1-j3",
        nom: "Anis Khemiri",
        poste: "DC",
        remplacant: false,
        x: 36.0,
        y: 69.0,
      },
      {
        id: "compo-u10-2-4-1-j4",
        nom: "Wassim Laroussi",
        poste: "MD",
        remplacant: false,
        x: 78.0,
        y: 50.0,
      },
      {
        id: "compo-u10-2-4-1-j5",
        nom: "Nour Zaidi",
        poste: "MC",
        remplacant: false,
        x: 60.0,
        y: 53.0,
      },
      {
        id: "compo-u10-2-4-1-j6",
        nom: "Iyed Mahjoub",
        poste: "MC",
        remplacant: false,
        x: 40.0,
        y: 53.0,
      },
      {
        id: "compo-u10-2-4-1-j7",
        nom: "Skander Riahi",
        poste: "MG",
        remplacant: false,
        x: 22.0,
        y: 50.0,
      },
      {
        id: "compo-u10-2-4-1-j8",
        nom: "Adam Bouaziz",
        poste: "BU",
        remplacant: false,
        x: 50.0,
        y: 26.0,
      },
    ],
  },
  {
    id: "compo-3-3-1",
    titre: "3-3-1",
    description: "",
    categorie: "U10",
    groupe: "Groupe A",
    formation: "3-3-1",
    image: boardImage,
    joueurs: [
      {
        id: "compo-3-3-1-j1",
        nom: "Wassim Laroussi",
        poste: "GB",
        remplacant: false,
        x: 50.0,
        y: 80.0,
      },
      {
        id: "compo-3-3-1-j2",
        nom: "Nour Zaidi",
        poste: "DC",
        remplacant: false,
        x: 68.0,
        y: 69.0,
      },
      {
        id: "compo-3-3-1-j3",
        nom: "Iyed Mahjoub",
        poste: "DC",
        remplacant: false,
        x: 50.0,
        y: 71.0,
      },
      {
        id: "compo-3-3-1-j4",
        nom: "Skander Riahi",
        poste: "DC",
        remplacant: false,
        x: 32.0,
        y: 69.0,
      },
      {
        id: "compo-3-3-1-j5",
        nom: "Adam Bouaziz",
        poste: "MD",
        remplacant: false,
        x: 70.0,
        y: 50.0,
      },
      {
        id: "compo-3-3-1-j6",
        nom: "Ziad Mrabet",
        poste: "MC",
        remplacant: false,
        x: 50.0,
        y: 53.0,
      },
      {
        id: "compo-3-3-1-j7",
        nom: "Hedi Selmi",
        poste: "MG",
        remplacant: false,
        x: 30.0,
        y: 50.0,
      },
      {
        id: "compo-3-3-1-j8",
        nom: "Taha Jebali",
        poste: "BU",
        remplacant: false,
        x: 50.0,
        y: 26.0,
      },
    ],
  },
  {
    id: "compo-4-3-3",
    titre: "4-3-3",
    description: "",
    categorie: "FFF",
    groupe: "Groupe A",
    formation: "4-3-3",
    image: boardImage,
    joueurs: [
      {
        id: "compo-4-3-3-j1",
        nom: "Mike Maignan",
        poste: "GB",
        photo: maignan,
        remplacant: false,
        x: 50.0,
        y: 80.0,
      },
      {
        id: "compo-4-3-3-j2",
        nom: "Dayot Upamecano",
        poste: "LD",
        photo: upamecano,
        remplacant: false,
        x: 82.0,
        y: 68.0,
      },
      {
        id: "compo-4-3-3-j3",
        nom: "Eduardo Camavinga",
        poste: "DC",
        photo: cama,
        remplacant: false,
        x: 62.0,
        y: 69.0,
      },
      {
        id: "compo-4-3-3-j4",
        nom: "Ousmane Dembélé",
        poste: "DC",
        photo: dembele,
        remplacant: false,
        x: 38.0,
        y: 69.0,
      },
      {
        id: "compo-4-3-3-j5",
        nom: "Theo Hernandez",
        poste: "LG",
        photo: theo,
        remplacant: false,
        x: 18.0,
        y: 68.0,
      },
      {
        id: "compo-4-3-3-j6",
        nom: "Kingsley Coman",
        poste: "MC",
        photo: coman,
        remplacant: false,
        x: 66.0,
        y: 50.0,
      },
      {
        id: "compo-4-3-3-j7",
        nom: "Kylian Mbappé",
        poste: "MDC",
        photo: kyks,
        remplacant: false,
        x: 50.0,
        y: 54.0,
      },
      {
        id: "compo-4-3-3-j8",
        nom: "Antoine Griezmann",
        poste: "MC",
        photo: griezmann,
        remplacant: false,
        x: 34.0,
        y: 50.0,
      },
      {
        id: "compo-4-3-3-j9",
        nom: "Aurélien Tchouaméni",
        poste: "AD",
        photo: tchoua,
        remplacant: false,
        x: 78.0,
        y: 32.0,
      },
      {
        id: "compo-4-3-3-j10",
        nom: "William Saliba",
        poste: "BU",
        photo: saliba,
        remplacant: false,
        x: 50.0,
        y: 24.0,
      },
      {
        id: "compo-4-3-3-j11",
        nom: "Jules Koundé",
        poste: "AG",
        photo: kounde,
        remplacant: false,
        x: 22.0,
        y: 32.0,
      },
    ],
  },
]
