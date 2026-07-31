/**
 * Compositions — the club's saved line-ups (Pôle technique ▸ Composition).
 *
 * Shapes follow the backend's `/game-lineup`: a composition belongs to a
 * catégorie × groupe, names a `formation`, and holds its `joueurs` with
 * pitch coordinates. Coordinates are normalised to **percentages of the pitch**
 * (0-100, origin top-left, own goal at the top) so the board scales on any
 * screen — the backend stores raw editor pixels.
 */

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
}

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
    image:
      "https://back.ismart-club.com/public/fb4200ec-d401-4dfb-b6e6-9b2d71522bae/game-lineups/image-1762280144040-20434115.png",
    joueurs: [
      {
        id: "compo-u10-2-4-1-j1",
        nom: "Rayan Chaabane",
        poste: "GB",
        remplacant: false,
        x: 50,
        y: 12,
      },
      {
        id: "compo-u10-2-4-1-j2",
        nom: "Malek Bouzid",
        poste: "Défenseur",
        remplacant: false,
        x: 14,
        y: 28,
      },
      {
        id: "compo-u10-2-4-1-j3",
        nom: "Anis Khemiri",
        poste: "Défenseur",
        remplacant: false,
        x: 86,
        y: 28,
      },
      {
        id: "compo-u10-2-4-1-j4",
        nom: "Wassim Laroussi",
        poste: "Milieu",
        remplacant: false,
        x: 14,
        y: 56,
      },
      {
        id: "compo-u10-2-4-1-j5",
        nom: "Nour Zaidi",
        poste: "Milieu",
        remplacant: false,
        x: 38,
        y: 56,
      },
      {
        id: "compo-u10-2-4-1-j6",
        nom: "Iyed Mahjoub",
        poste: "Milieu",
        remplacant: false,
        x: 62,
        y: 56,
      },
      {
        id: "compo-u10-2-4-1-j7",
        nom: "Skander Riahi",
        poste: "Milieu",
        remplacant: false,
        x: 86,
        y: 56,
      },
      {
        id: "compo-u10-2-4-1-j8",
        nom: "Adam Bouaziz",
        poste: "Attaquant",
        remplacant: false,
        x: 50,
        y: 84,
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
    image:
      "https://back.ismart-club.com/public/fb4200ec-d401-4dfb-b6e6-9b2d71522bae/game-lineups/image-1762354889357-619450673.png",
    joueurs: [
      {
        id: "compo-3-3-1-j1",
        nom: "Wassim Laroussi",
        poste: "GB",
        remplacant: false,
        x: 50,
        y: 12,
      },
      {
        id: "compo-3-3-1-j2",
        nom: "Nour Zaidi",
        poste: "Défenseur",
        remplacant: false,
        x: 14,
        y: 28,
      },
      {
        id: "compo-3-3-1-j3",
        nom: "Iyed Mahjoub",
        poste: "Défenseur",
        remplacant: false,
        x: 50,
        y: 28,
      },
      {
        id: "compo-3-3-1-j4",
        nom: "Skander Riahi",
        poste: "Défenseur",
        remplacant: false,
        x: 86,
        y: 28,
      },
      {
        id: "compo-3-3-1-j5",
        nom: "Adam Bouaziz",
        poste: "Milieu",
        remplacant: false,
        x: 14,
        y: 56,
      },
      {
        id: "compo-3-3-1-j6",
        nom: "Ziad Mrabet",
        poste: "Milieu",
        remplacant: false,
        x: 50,
        y: 56,
      },
      {
        id: "compo-3-3-1-j7",
        nom: "Hedi Selmi",
        poste: "Milieu",
        remplacant: false,
        x: 86,
        y: 56,
      },
      {
        id: "compo-3-3-1-j8",
        nom: "Taha Jebali",
        poste: "Attaquant",
        remplacant: false,
        x: 50,
        y: 84,
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
    image:
      "https://pprodback.ismart-club.com/public/fb4200ec-d401-4dfb-b6e6-9b2d71522bae/game-lineups/image-1778808837138-221436007.png",
    joueurs: [
      {
        id: "compo-4-3-3-j1",
        nom: "Mike Maignan",
        poste: "GB",
        photo:
          "https://pprodback.ismart-club.com/public/fb4200ec-d401-4dfb-b6e6-9b2d71522bae/general/maignan.jpg-1772018136854-446059239.jpg",
        remplacant: false,
        x: 48.4,
        y: 9,
      },
      {
        id: "compo-4-3-3-j2",
        nom: "Dayot Upamecano",
        poste: "DC",
        photo:
          "https://pprodback.ismart-club.com/public/fb4200ec-d401-4dfb-b6e6-9b2d71522bae/general/upamecano.jpg-1772017847572-141518690.jpg",
        remplacant: false,
        x: 69.7,
        y: 24.3,
      },
      {
        id: "compo-4-3-3-j3",
        nom: "Eduardo Camavinga",
        poste: "MDC",
        photo:
          "https://pprodback.ismart-club.com/public/fb4200ec-d401-4dfb-b6e6-9b2d71522bae/general/cama.jpg-1772017975809-391784380.jpg",
        remplacant: false,
        x: 49.9,
        y: 52.2,
      },
      {
        id: "compo-4-3-3-j4",
        nom: "Ousmane Dembélé",
        poste: "AD",
        photo:
          "https://pprodback.ismart-club.com/public/fb4200ec-d401-4dfb-b6e6-9b2d71522bae/general/dembele.jpg-1772018209365-301426615.jpg",
        remplacant: false,
        x: 16.2,
        y: 81.1,
      },
      {
        id: "compo-4-3-3-j5",
        nom: "Theo Hernandez",
        poste: "LG",
        photo:
          "https://pprodback.ismart-club.com/public/fb4200ec-d401-4dfb-b6e6-9b2d71522bae/general/theo.jpg-1772018322296-879174532.jpg",
        remplacant: false,
        x: 85,
        y: 27.5,
      },
      {
        id: "compo-4-3-3-j6",
        nom: "Kingsley Coman",
        poste: "AD",
        photo:
          "https://pprodback.ismart-club.com/public/fb4200ec-d401-4dfb-b6e6-9b2d71522bae/general/coman.jpg-1772018017187-823824322.jpg",
        remplacant: false,
        x: 84.4,
        y: 82.5,
      },
      {
        id: "compo-4-3-3-j7",
        nom: "Kylian Mbappé",
        poste: "AG",
        photo:
          "https://pprodback.ismart-club.com/public/fb4200ec-d401-4dfb-b6e6-9b2d71522bae/general/kyks.jpg-1772018036179-544380539.jpg",
        remplacant: false,
        x: 50.6,
        y: 88,
      },
      {
        id: "compo-4-3-3-j8",
        nom: "Antoine Griezmann",
        poste: "MOC",
        photo:
          "https://pprodback.ismart-club.com/public/fb4200ec-d401-4dfb-b6e6-9b2d71522bae/general/griezmann.jpg-1772019557570-523688009.jpg",
        remplacant: false,
        x: 32.8,
        y: 59.7,
      },
      {
        id: "compo-4-3-3-j9",
        nom: "Aurélien Tchouaméni",
        poste: "MDC",
        photo:
          "https://pprodback.ismart-club.com/public/fb4200ec-d401-4dfb-b6e6-9b2d71522bae/general/tchoua.jpg-1772017810040-66339328.jpg",
        remplacant: false,
        x: 64.3,
        y: 60,
      },
      {
        id: "compo-4-3-3-j10",
        nom: "William Saliba",
        poste: "DC",
        photo:
          "https://pprodback.ismart-club.com/public/fb4200ec-d401-4dfb-b6e6-9b2d71522bae/general/saliba.jpg-1772018372018-816808238.jpg",
        remplacant: false,
        x: 29.9,
        y: 25.1,
      },
      {
        id: "compo-4-3-3-j11",
        nom: "Jules Koundé",
        poste: "LD",
        photo:
          "https://pprodback.ismart-club.com/public/fb4200ec-d401-4dfb-b6e6-9b2d71522bae/general/kounde.jpg-1772018002697-124957233.jpg",
        remplacant: false,
        x: 15,
        y: 11.3,
      },
    ],
  },
]
