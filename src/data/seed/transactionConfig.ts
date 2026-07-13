/**
 * Seed for the "Configuration de transaction" screen — the admin referential of
 * transaction GROUPES (a top-level category) each holding one or more TYPES.
 * Prototype-only: the screen manages its own local copy, so this is just the
 * initial content. Currency is a single global (Devise).
 */

export type TxGroup = {
  id: string
  name: string
  description: string
}

export type TxType = {
  id: string
  group_id: string
  name: string
  description: string
}

/** Global currency label shown at the top of the config. */
export const txCurrencySeed = "DT"

export const txGroupsSeed: TxGroup[] = [
  { id: "txg-sponsors", name: "Sponsors et subventions", description: "Sponsors" },
  { id: "txg-equipement", name: "Biens et Équipement", description: "Achats de bien et équipement" },
  { id: "txg-eau", name: "Eau", description: "Eau" },
  { id: "txg-sante", name: "Santé", description: "Santé" },
  { id: "txg-hebergement", name: "Hébergement", description: "Hébergement hôtel" },
  { id: "txg-restauration", name: "Restauration", description: "Restauration" },
  { id: "txg-collecte", name: "Collecte", description: "This Group is for collections" },
  { id: "txg-primes", name: "Primes", description: "Primes" },
  { id: "txg-supporteurs", name: "Supporteurs", description: "Supporteurs" },
  { id: "txg-loyer", name: "Loyer", description: "Loyer joueurs" },
  { id: "txg-transport", name: "Transport", description: "Transport" },
  { id: "txg-admin", name: "Frais Administratifs", description: "Assurances, déclarations, licences.." },
  { id: "txg-president", name: "Président", description: "Transactions liées avec le président du club" },
  { id: "txg-solde", name: "Solde saison 2023-2024", description: "Solde bancaire et en espèce de la saison précédente" },
]

export const txTypesSeed: TxType[] = [
  // Sponsors et subventions
  { id: "txt-mjs", group_id: "txg-sponsors", name: "Subvention Ministère de la Jeunesse et de Sport", description: "MJS" },
  { id: "txt-sponsors", group_id: "txg-sponsors", name: "Sponsors", description: "Sponsor" },
  // Biens et Équipement
  { id: "txt-equipement", group_id: "txg-equipement", name: "Biens et Équipement", description: "Achat de bien et équipement" },
  // Eau
  { id: "txt-eau", group_id: "txg-eau", name: "Eau", description: "Eau" },
  // Santé
  { id: "txt-sante", group_id: "txg-sante", name: "Santé", description: "Santé" },
  // Hébergement
  { id: "txt-hebergement", group_id: "txg-hebergement", name: "Hébergement", description: "Hébergement hôtel" },
  // Restauration
  { id: "txt-restauration", group_id: "txg-restauration", name: "Restauration", description: "Frais restauration mensuels fixes + frais restaurant les jours des matchs" },
  // Collecte
  { id: "txt-collecte", group_id: "txg-collecte", name: "Collecte", description: "Collecte" },
  // Primes
  { id: "txt-prime-signature", group_id: "txg-primes", name: "Prime signature", description: "Prime signature" },
  { id: "txt-salaires-joueurs", group_id: "txg-primes", name: "Salaires joueurs", description: "Salaire mensuel" },
  { id: "txt-avance-salaire", group_id: "txg-primes", name: "Avance / Salaire", description: "Avance" },
  { id: "txt-salaire-personnels", group_id: "txg-primes", name: "Salaire Personnels", description: "Sal Personnel" },
  { id: "txt-salaire-entraineur", group_id: "txg-primes", name: "Salaire entraineur", description: "Salaire entraîneur" },
  { id: "txt-prime-victoire", group_id: "txg-primes", name: "Prime victoire", description: "Prime victoire" },
  // Supporteurs
  { id: "txt-billetterie", group_id: "txg-supporteurs", name: "Billetterie", description: "Billetterie" },
  { id: "txt-don", group_id: "txg-supporteurs", name: "Don", description: "Don" },
  { id: "txt-adherent", group_id: "txg-supporteurs", name: "Adhérent", description: "Membres Adhérents" },
  // Loyer
  { id: "txt-loyer", group_id: "txg-loyer", name: "Loyer", description: "Loyer joueurs" },
  // Transport
  { id: "txt-taxi", group_id: "txg-transport", name: "Taxi", description: "Dépenses Taxi" },
  { id: "txt-minibus", group_id: "txg-transport", name: "Minibus", description: "Entretien, carburant" },
  { id: "txt-bus", group_id: "txg-transport", name: "Bus", description: "Entretien, Carburant" },
  // Frais Administratifs
  { id: "txt-admin", group_id: "txg-admin", name: "Frais administratifs", description: "Bureautiques et consommables" },
  // Président
  { id: "txt-don-president", group_id: "txg-president", name: "Don Président", description: "Don du président" },
  { id: "txt-remboursement-president", group_id: "txg-president", name: "Remboursement Président", description: "Remboursement" },
  { id: "txt-pret-president", group_id: "txg-president", name: "Prêt Président", description: "Prêt Président" },
  // Solde saison 2023-2024
  { id: "txt-solde-banque", group_id: "txg-solde", name: "Solde en banque", description: "Solde bancaire de la saison précédente" },
  { id: "txt-solde-espece", group_id: "txg-solde", name: "Solde en espèce", description: "Solde en espèce de la saison précédente" },
]
