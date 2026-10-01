/**
 * Organigrammes partagés — the full content behind an "Organigramme" ressource
 * of the Communauté: the partner's tree, the postes in it, and the documents
 * (fiches de poste, chartes, listes des rôles) those postes use.
 *
 * People don't travel: `occupant` is who holds a poste *at the partner club*,
 * shown for context only. Importing turns every poste into a slot to fill
 * with someone of our own club.
 */

import type { FicheContenu, FicheType } from "@/data/seed/fichesPoste"

export type DocPartage = {
  id: string
  type: Exclude<FicheType, "">
  titre: string
  perimetre: string
  contenu: FicheContenu
}

export type PostePartage = {
  id: string
  intitule: string
  occupant: string | null
  ficheId?: string
  roles: { docId: string; libelle: string }[]
  charteIds: string[]
}

export type UnitePartage = {
  id: string
  nom: string
  parentId: string | null
  postes: PostePartage[]
}

export type OrgPartage = {
  saison: string
  unites: UnitePartage[]
  documents: DocPartage[]
}

const CH_ETHIQUE = "fc93-charte-ethique"
const CH_EDUC = "fc93-charte-educateur"
const CH_BENEVOLE = "fc93-charte-benevole"
const RL_COMITE = "fc93-roles-comite"
const RL_SPORTIF = "fc93-roles-sportif"

const poste = (
  id: string,
  intitule: string,
  occupant: string | null,
  ficheId: string | undefined,
  roles: { docId: string; libelle: string }[],
  charteIds: string[],
): PostePartage => ({ id, intitule, occupant, ficheId, roles, charteIds })

const dirigeant = [CH_ETHIQUE, CH_BENEVOLE]
const encadrant = [CH_ETHIQUE, CH_EDUC]

export const organigrammesPartagesSeed: Record<string, OrgPartage> = {
  "res-fc93-organigramme": {
    saison: "2025 - 2026",
    unites: [
      {
        id: "fc93-u-comite",
        nom: "Comité directeur",
        parentId: null,
        postes: [
          poste("fc93-p-president", "Président", "Karim Bensalem", "fc93-fp-president", [{ docId: RL_COMITE, libelle: "Représentation & pilotage" }], dirigeant),
          poste("fc93-p-vp", "Vice-président", "Nadia Ouali", undefined, [{ docId: RL_COMITE, libelle: "Suivi des commissions" }], dirigeant),
          poste("fc93-p-tresorier", "Trésorier", "Samir Haddad", "fc93-fp-tresorier", [{ docId: RL_COMITE, libelle: "Budget & subventions" }], dirigeant),
          poste("fc93-p-sg", "Secrétaire générale", "Leïla Mansour", "fc93-fp-secretariat", [{ docId: RL_COMITE, libelle: "PV & licences" }], dirigeant),
        ],
      },
      {
        id: "fc93-u-sportif",
        nom: "Pôle sportif",
        parentId: "fc93-u-comite",
        postes: [
          poste("fc93-p-dt", "Directeur technique", "Olivier Mendy", "fc93-fp-dt", [{ docId: RL_SPORTIF, libelle: "Projet sportif du club" }], encadrant),
          poste("fc93-p-coord", "Coordinateur de la formation", "Yanis Belkacem", "fc93-fp-dt", [{ docId: RL_SPORTIF, libelle: "Suivi des éducateurs" }], encadrant),
        ],
      },
      {
        id: "fc93-u-ecole",
        nom: "École de football (U6 – U11)",
        parentId: "fc93-u-sportif",
        postes: [
          poste("fc93-p-resp-edf", "Responsable école de foot", "Mickaël Da Silva", "fc93-fp-edf", [{ docId: RL_SPORTIF, libelle: "Plateaux & lien parents" }], encadrant),
          poste("fc93-p-educ-u9", "Éducateur U9", "Thomas Keita", "fc93-fp-educateur", [], encadrant),
          poste("fc93-p-educ-u11", "Éducateur U11", null, "fc93-fp-educateur", [], encadrant),
        ],
      },
      {
        id: "fc93-u-preformation",
        nom: "Préformation (U12 – U15)",
        parentId: "fc93-u-sportif",
        postes: [
          poste("fc93-p-resp-pref", "Responsable préformation", "Farid Amrani", "fc93-fp-educateur", [{ docId: RL_SPORTIF, libelle: "Détection & passerelles" }], encadrant),
          poste("fc93-p-educ-u13", "Éducateur U13", "Julien Lopes", "fc93-fp-educateur", [], encadrant),
        ],
      },
      {
        id: "fc93-u-perf",
        nom: "Cellule performance & santé",
        parentId: "fc93-u-sportif",
        postes: [
          poste("fc93-p-prep", "Préparateur physique", "Hugo Martin", "fc93-fp-prep", [{ docId: RL_SPORTIF, libelle: "Charge & prévention" }], encadrant),
          poste("fc93-p-kine", "Kinésithérapeute", "Sarah Benali", undefined, [], [CH_ETHIQUE]),
        ],
      },
      {
        id: "fc93-u-admin",
        nom: "Pôle administratif",
        parentId: "fc93-u-comite",
        postes: [
          poste("fc93-p-secretariat", "Assistante administrative", "Inès Laroche", "fc93-fp-secretariat", [], [CH_ETHIQUE]),
          poste("fc93-p-materiel", "Responsable équipements", "Moussa Diallo", undefined, [], dirigeant),
        ],
      },
      {
        // Edge case: a commission described but still empty at the partner.
        id: "fc93-u-animation",
        nom: "Commission animation & partenariats",
        parentId: "fc93-u-comite",
        postes: [],
      },
    ],
    documents: [
      {
        id: "fc93-fp-president",
        type: "Fiche de Poste",
        titre: "Fiche de poste — Président",
        perimetre: "Président",
        contenu: {
          objectif: "Porter le projet associatif du F.C. 93 et le représenter.",
          rattachement: "Assemblée générale",
          sections: [
            {
              titre: "Missions",
              points: [
                "Présider le comité directeur",
                "Signer les conventions avec la ville",
                "Arbitrer les priorités budgétaires",
              ],
            },
          ],
        },
      },
      {
        id: "fc93-fp-tresorier",
        type: "Fiche de Poste",
        titre: "Fiche de poste — Trésorier",
        perimetre: "Trésorier",
        contenu: {
          objectif: "Tenir les comptes et sécuriser les ressources du club.",
          rattachement: "Président",
          sections: [
            {
              titre: "Missions",
              points: [
                "Monter les dossiers de subvention",
                "Suivre les cotisations",
                "Présenter le bilan annuel",
              ],
            },
          ],
        },
      },
      {
        id: "fc93-fp-secretariat",
        type: "Fiche de Poste",
        titre: "Fiche de poste — Secrétariat administratif",
        perimetre: "Secrétariat",
        contenu: {
          objectif: "Assurer le suivi administratif des licenciés et des instances.",
          rattachement: "Secrétaire générale",
          sections: [
            {
              titre: "Missions",
              points: [
                "Saisir les licences",
                "Rédiger les PV",
                "Accueillir les familles le mercredi",
              ],
            },
          ],
        },
      },
      {
        id: "fc93-fp-dt",
        type: "Fiche de Poste",
        titre: "Fiche de poste — Directeur technique",
        perimetre: "Directeur technique",
        contenu: {
          objectif:
            "Construire et faire vivre le projet sportif, de l'école de foot aux seniors.",
          rattachement: "Président",
          sections: [
            {
              titre: "Projet sportif",
              points: [
                "Écrire la programmation annuelle par catégorie",
                "Fixer les objectifs de fin de saison",
              ],
            },
            {
              titre: "Encadrement",
              points: [
                "Recruter et former les éducateurs",
                "Observer une séance par catégorie et par mois",
              ],
            },
          ],
        },
      },
      {
        id: "fc93-fp-edf",
        type: "Fiche de Poste",
        titre: "Fiche de poste — Responsable école de football",
        perimetre: "Responsable école de foot",
        contenu: {
          objectif: "Faire aimer le football aux plus jeunes dans un cadre sûr.",
          rattachement: "Directeur technique",
          sections: [
            {
              titre: "Missions",
              points: [
                "Organiser les plateaux du samedi",
                "Accompagner les éducateurs débutants",
                "Réunir les parents en début de saison",
              ],
            },
          ],
        },
      },
      {
        id: "fc93-fp-educateur",
        type: "Fiche de Poste",
        titre: "Fiche de poste — Éducateur",
        perimetre: "Éducateur",
        contenu: {
          objectif: "Encadrer une catégorie selon le projet sportif du club.",
          rattachement: "Responsable de section",
          sections: [
            {
              titre: "Missions",
              points: [
                "Préparer et animer deux séances par semaine",
                "Gérer les convocations",
                "Remplir les présences",
              ],
            },
          ],
        },
      },
      {
        id: "fc93-fp-prep",
        type: "Fiche de Poste",
        titre: "Fiche de poste — Préparateur physique",
        perimetre: "Préparateur physique",
        contenu: {
          objectif: "Développer les qualités athlétiques et prévenir les blessures.",
          rattachement: "Directeur technique",
          sections: [
            {
              titre: "Missions",
              points: [
                "Planifier la charge par cycle",
                "Conduire les tests VMA",
                "Suivre les retours de blessure avec le kiné",
              ],
            },
          ],
        },
      },
      {
        id: CH_ETHIQUE,
        type: "Charte",
        titre: "Charte éthique du F.C. 93",
        perimetre: "Tous les membres",
        contenu: {
          sections: [
            {
              titre: "Nos valeurs",
              points: [
                "Respect de tous, sans discrimination",
                "Fair-play sur et hors du terrain",
                "Solidarité entre les catégories",
              ],
            },
          ],
        },
      },
      {
        id: CH_EDUC,
        type: "Charte",
        titre: "Charte de l'éducateur",
        perimetre: "Éducateurs",
        contenu: {
          sections: [
            {
              titre: "L'éducateur s'engage à",
              points: [
                "Être exemplaire dans sa tenue et son langage",
                "Faire jouer chaque enfant",
                "Ne jamais laisser un mineur seul à la fin d'une séance",
              ],
            },
          ],
        },
      },
      {
        id: CH_BENEVOLE,
        type: "Charte",
        titre: "Charte du bénévole",
        perimetre: "Dirigeants & bénévoles",
        contenu: {
          sections: [
            {
              titre: "Le bénévole s'engage à",
              points: [
                "Respecter les décisions du comité",
                "Tenir ses engagements de présence",
                "Garder la confidentialité des échanges",
              ],
            },
          ],
        },
      },
      {
        id: RL_COMITE,
        type: "Liste des Rôles",
        titre: "Rôles du comité directeur",
        perimetre: "Comité directeur",
        contenu: {
          sections: [
            {
              titre: "Principe",
              points: [
                "Chaque membre du comité porte un domaine",
                "Un point d'avancement à chaque réunion mensuelle",
              ],
            },
          ],
        },
      },
      {
        id: RL_SPORTIF,
        type: "Liste des Rôles",
        titre: "Rôles du pôle sportif",
        perimetre: "Pôle sportif",
        contenu: {
          sections: [
            {
              titre: "Principe",
              points: [
                "Un référent par section",
                "Réunion technique toutes les deux semaines",
              ],
            },
          ],
        },
      },
    ],
  },
}
