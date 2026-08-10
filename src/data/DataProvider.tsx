import {
  createContext,
  useMemo,
  useReducer,
  useState,
  type ReactNode,
} from "react"

import { r } from "@/lib/format"
import {
  budgetSeed,
  sumLines,
  type BudgetMode,
  type BudgetState,
  type Line,
  type LineList,
} from "@/data/seed/budget"
import { seasonsSeed, type Season } from "@/data/seed/seasons"
import { entriesSeed, type Entry } from "@/data/seed/entries"
import { monthsSeed, type Month } from "@/data/seed/months"
import { documentsSeed, type Document } from "@/data/seed/documents"
import { fichesSeed, type Fiche } from "@/data/seed/fichesPoste"
import {
  categoriesSeed,
  type Categorie,
} from "@/data/seed/categories"
import {
  projetsDeJeuSeed,
  type ProjetDeJeu,
} from "@/data/seed/projetsDeJeu"
import {
  compositionsSeed,
  type Composition,
} from "@/data/seed/compositions"
import {
  SAISONS,
  SAISON_ACTIVE,
  SEANCES_PAR_SEMAINE,
  programmeVierge,
  renumeroterSessions,
  programmesAnnuelsSeed,
  seancesClubSeed,
  type ProgSession,
  type ProgrammeAnnuel,
  type ProgrammeScope,
  type SeanceClub,
} from "@/data/seed/programmation"
import {
  procedeGroupesSeed,
  procedePhasesSeed,
  procedePrincipesSeed,
  procedesSeed,
  type ProcedeGroupe,
  type ProcedeItem,
  type ProcedePhase,
  type ProcedePrincipe,
} from "@/data/seed/procedes"
import { eventsSeed, type PlanEvent } from "@/data/seed/events"
import { seanceDetailsSeed, type SeanceDetail } from "@/data/seed/seances"
import { matchDetailsSeed, type MatchDetail } from "@/data/seed/matches"
import { objectifsSeed, type Objectif, type ObjectifStatut } from "@/data/seed/objectifs"
import { notificationsSeed, type AppNotif } from "@/data/seed/notifications"
import { educateursSeed, type Educateur } from "@/data/seed/educateurs"
import {
  membresPool,
  relationsSeed,
  unitesSeed,
  type OrgAffectation,
  type OrgMembre,
  type OrgRelation,
  type OrgUnite,
} from "@/data/seed/organigramme"
import {
  projetsSeed,
  sousProjetsSeed,
  tachesSeed,
  type Projet,
  type SousProjet,
  type SousTache,
  type Tache,
} from "@/data/seed/taches"
import {
  SUGGESTED_OFFERS,
  campaignsSeed,
  offersSeed,
  partnersSeed,
  sponsorAccountsSeed,
  type Campaign,
  type Offer,
  type Partner,
  type SponsorAccount,
} from "@/data/seed/sponsoring"
import {
  adminSession,
  sponsorSession,
  type Session,
} from "@/data/seed/session"
import {
  offerRequestsSeed,
  type OfferRequest,
} from "@/data/seed/offerRequests"
import {
  transactionRequestsSeed,
  type NewTransactionRequest,
  type TransactionRequest,
} from "@/data/seed/transactionRequests"
import {
  budget2Reducer,
  budget2InitialState,
  type Budget2State,
} from "@/data/budget2Reducer"
import type {
  BudgetLine,
  BudgetTeamGroup,
  Budget2Draft,
  Budget2Season,
} from "@/data/seed/budget2"
import {
  financeConfigSeed,
  financeTeamsSeed,
  staffSeed,
  groupsSeed,
  subCategoriesSeed,
  transactionsSeed,
  type FinanceConfig,
  type FinanceTeam,
  type StaffMember,
  type Group,
  type SubCategory,
  type Transaction,
  type NewTransaction,
} from "@/data/seed/finance"

/**
 * App-root in-memory store (plain React Context + useReducer — no library).
 * Seeded from src/data/seed on first render; screens read and mutate through
 * the useData() hook. State lives only in memory and resets on refresh.
 *
 * For now it holds the budget config; future entities extend the same store.
 */

type Action =
  | { type: "setSeason"; season: string }
  | { type: "setMode"; mode: BudgetMode }
  | { type: "setGlobalIncome"; value: number }
  | { type: "setGlobalExpense"; value: number }
  | { type: "updateLine"; list: LineList; id: string; patch: Partial<Line> }
  | { type: "addLine"; list: LineList; line: Line }
  | { type: "removeLine"; list: LineList; id: string }

const globalFor = (state: BudgetState, list: LineList) =>
  list === "income" ? state.globalIncome : state.globalExpense

/** Recompute each line's amount from its pct against a global total. */
const fromPct = (lines: Line[], global: number): Line[] =>
  lines.map((line) => ({ ...line, amount: r(((line.pct ?? 0) / 100) * global) }))

/** Recompute each line's pct from its amount against a total. */
const toPct = (lines: Line[], total: number): Line[] =>
  lines.map((line) => ({ ...line, pct: total ? r((line.amount / total) * 100) : 0 }))

function reducer(state: BudgetState, action: Action): BudgetState {
  switch (action.type) {
    case "setSeason":
      return { ...state, season: action.season }

    case "setMode": {
      if (action.mode === state.mode) return state
      if (action.mode === "percent") {
        const ti = sumLines(state.income)
        const te = sumLines(state.expenses)
        return {
          ...state,
          mode: "percent",
          globalIncome: ti,
          globalExpense: te,
          income: toPct(state.income, ti),
          expenses: toPct(state.expenses, te),
          teams: toPct(state.teams, te),
        }
      }
      // percent -> amount: lock in the derived amounts
      return {
        ...state,
        mode: "amount",
        income: fromPct(state.income, state.globalIncome),
        expenses: fromPct(state.expenses, state.globalExpense),
        teams: fromPct(state.teams, state.globalExpense),
      }
    }

    case "setGlobalIncome":
      return {
        ...state,
        globalIncome: action.value,
        income: fromPct(state.income, action.value),
      }

    case "setGlobalExpense":
      return {
        ...state,
        globalExpense: action.value,
        expenses: fromPct(state.expenses, action.value),
        teams: fromPct(state.teams, action.value),
      }

    case "updateLine": {
      const global = globalFor(state, action.list)
      const next = state[action.list].map((line) => {
        if (line.id !== action.id) return line
        const merged = { ...line, ...action.patch }
        // editing the pct re-derives the amount from the relevant global
        if (action.patch.pct !== undefined) {
          merged.amount = r(((action.patch.pct ?? 0) / 100) * global)
        }
        return merged
      })
      return { ...state, [action.list]: next }
    }

    case "addLine":
      return { ...state, [action.list]: [...state[action.list], action.line] }

    case "removeLine":
      return {
        ...state,
        [action.list]: state[action.list].filter((line) => line.id !== action.id),
      }

    default:
      return state
  }
}

export type DataContextValue = {
  /** Who is signed in — `null` when signed out (the shell sends you to /connexion). */
  session: Session | null
  signInAsAdmin: () => void
  signInAsSponsor: () => void
  signOut: () => void
  budget: BudgetState
  /** Past, clôturée seasons shown (read-only) in the season picker. */
  seasons: Season[]
  /** Recorded recettes & dépenses (newest first). */
  entries: Entry[]
  /** Month-by-month planning preview (read-only). */
  months: Month[]
  /** Club documents catalogue (newest first). */
  documents: Document[]
  /** Fiches & Documents — the club's referential, each tied to its membres. */
  fiches: Fiche[]
  /** Procédés taxonomy — groupes ▸ phases ▸ principes (read-only referential). */
  procedeGroupes: ProcedeGroupe[]
  procedePhases: ProcedePhase[]
  procedePrincipes: ProcedePrincipe[]
  /** The club's procédés library (Pôle technique ▸ Procédés). */
  procedes: ProcedeItem[]
  /** Seasons the programme annuel can be scoped to. */
  saisons: string[]
  /** Every programme annuel of the club (one per saison × catégorie × groupe). */
  programmesAnnuels: ProgrammeAnnuel[]
  /** The saison × catégorie × groupe the Programmation screen is showing. */
  programmeScope: ProgrammeScope
  /** Programme of the active scope — null when that combination has none yet. */
  programmeAnnuel: ProgrammeAnnuel | null
  /** Séances of the club (Pôle technique ▸ Séances), oldest first. */
  seancesClub: SeanceClub[]
  /** Playing models (Pôle technique ▸ Projet de jeu). */
  projetsDeJeu: ProjetDeJeu[]
  /** Saved line-ups (Pôle technique ▸ Composition). */
  compositions: Composition[]
  /** Age groups with their effectif, groupes and calendrier (▸ Catégories). */
  categories: Categorie[]
  /** Scheduled events shown on the Planification calendar. */
  events: PlanEvent[]
  /** Session detail (header + procédés) behind a séance card, keyed by event id. */
  seanceDetails: SeanceDetail[]
  /** Match detail (header + convocation / consignes / debrief) behind a match card. */
  matchDetails: MatchDetail[]
  /** Technical objectives (Structuration ▸ Objectifs techniques). */
  objectifs: Objectif[]
  /** Top-bar notifications (newest first). */
  notifications: AppNotif[]
  /** Objective currently open in the global review modal, or null. */
  reviewObjectifId: string | null
  /** Éducateurs (coaches) — Ressources humaines. */
  educateurs: Educateur[]
  /** Organigramme — the club's unités (a tree via `parentId`) placed on a canvas. */
  orgUnites: OrgUnite[]
  /** Organigramme — named transverse links between two unités. */
  orgRelations: OrgRelation[]
  /** Everyone who can be affected to a unité (read-only pool). */
  orgMembres: OrgMembre[]
  /** Gestion des tâches — projets, their sous-projets, and one flat tâche list. */
  projets: Projet[]
  sousProjets: SousProjet[]
  taches: Tache[]
  /** Sponsoring offers (Or / Argent / Bronze…), sorted by the screens. */
  offers: Offer[]
  /** Partenaires signed on an offer (each takes one of its seats). */
  partners: Partner[]
  /** Sponsor-side iSmart Club accounts an admin can link a partenaire to. */
  sponsorAccounts: SponsorAccount[]
  /** Campaigns run by partenaires — one `en_cours` at most, plus archives. */
  campaigns: Campaign[]
  /** Custom sponsoring requests sent by sponsors (Sponsoring ▸ Demandes). */
  offerRequests: OfferRequest[]
  /** Finance module — global config (active season + currency). */
  financeConfig: FinanceConfig
  /** Teams the Finance module can target (portée = équipe). */
  financeTeams: FinanceTeam[]
  /** Staff members (portée = staff). */
  staff: StaffMember[]
  /** Groupes referential (admin-managed). */
  groups: Group[]
  /** Sous-catégories referential (admin-managed). */
  subCategories: SubCategory[]
  /** All financial movements of the active season (incl. soft-deleted). */
  transactions: Transaction[]
  /** Transaction requests submitted by the staff, awaiting or carrying a decision. */
  transactionRequests: TransactionRequest[]
  setSeason: (season: string) => void
  setMode: (mode: BudgetMode) => void
  setGlobalIncome: (value: number) => void
  setGlobalExpense: (value: number) => void
  updateLine: (list: LineList, id: string, patch: Partial<Line>) => void
  addLine: (list: LineList, line?: Partial<Line>) => void
  removeLine: (list: LineList, id: string) => void
  addEntry: (entry: Omit<Entry, "id">) => void
  removeEntry: (id: string) => void
  /** Add a document; returns the new id so the caller can open its editor. */
  addDocument: (doc: Omit<Document, "id">) => string
  removeDocument: (id: string) => void
  /** Add a fiche; returns the new id so the caller can open its detail page. */
  addFiche: (fiche: Omit<Fiche, "id">) => string
  removeFiche: (id: string) => void
  /** Add a procédé to the library; returns the new id so the caller can open it. */
  addProcede: (procede: Omit<ProcedeItem, "id">) => string
  updateProcede: (id: string, patch: Partial<ProcedeItem>) => void
  removeProcede: (id: string) => void
  /** Point the Programmation screen at another saison / catégorie / groupe. */
  setProgrammeScope: (patch: Partial<ProgrammeScope>) => void
  /** Start a blank programme for the active scope; returns its id. */
  creerProgrammeAnnuel: () => string
  /** Retarget one slot of the programme annuel (principe / special). */
  updateProgSession: (id: string, patch: Partial<ProgSession>) => void
  /** Append a semaine (and its séances placeholder) to a programme annuel. */
  addProgSemaine: (programmeId: string) => void
  /** Add one séance placeholder at the end of a semaine. */
  addProgSession: (programmeId: string, semaine: number) => void
  /** Remove one séance placeholder (a slot already planned is left alone). */
  removeProgSession: (id: string) => void
  /** Remove a whole semaine and the séances placeholder it holds. */
  removeProgSemaine: (programmeId: string, semaine: number) => void
  /** Turn a programme slot into a real séance and link the two. Returns its id. */
  planifierSeance: (sessionId: string) => string
  addSeance: (seance: Omit<SeanceClub, "id">) => string
  updateSeance: (id: string, patch: Partial<SeanceClub>) => void
  /** Delete a séance and unlink it from its programme slot. */
  removeSeance: (id: string) => void
  /** Add a catégorie; returns the new id so the caller can open it. */
  addCategorie: (categorie: Omit<Categorie, "id">) => string
  updateCategorie: (id: string, patch: Partial<Categorie>) => void
  removeCategorie: (id: string) => void
  /** Add a composition; returns the new id so the caller can open its board. */
  addComposition: (composition: Omit<Composition, "id">) => string
  updateComposition: (id: string, patch: Partial<Composition>) => void
  removeComposition: (id: string) => void
  /** Add a calendar event; returns the new id. */
  addEvent: (event: Omit<PlanEvent, "id">) => string
  updateEvent: (id: string, patch: Partial<PlanEvent>) => void
  removeEvent: (id: string) => void
  /** Create an objective (statut "En attente") + push a linked notification. */
  addObjectif: (objectif: Omit<Objectif, "id" | "statut" | "date">) => string
  /** Set an objective's review status (Accepté / Refusé) from the fiche modal. */
  setObjectifStatut: (id: string, statut: ObjectifStatut) => void
  /** Mark a notification read. */
  markNotifRead: (id: string) => void
  /** Open / close the global objective review modal. */
  openObjectifReview: (id: string) => void
  closeObjectifReview: () => void
  /** Add an éducateur (id filled in); returns the new id. */
  addEducateur: (edu: Omit<Educateur, "id">) => string
  updateEducateur: (id: string, patch: Partial<Educateur>) => void
  removeEducateur: (id: string) => void
  /** Add a unité (racine when `parentId` is null); returns the new id. */
  addOrgUnite: (unite: Omit<OrgUnite, "id">) => string
  updateOrgUnite: (id: string, patch: Partial<OrgUnite>) => void
  /** Delete a unité; its children are re-attached to its own parent. */
  removeOrgUnite: (id: string) => void
  /** Write back the positions computed by the auto-layout / a drag. */
  setOrgPositions: (positions: Record<string, { x: number; y: number }>) => void
  /** Replace the membres affected to a unité (the picker saves the whole set). */
  setOrgUniteMembres: (id: string, membres: OrgAffectation[]) => void
  /** Add a relation transverse between two unités; returns the new id. */
  addOrgRelation: (relation: Omit<OrgRelation, "id">) => string
  updateOrgRelation: (id: string, patch: Partial<OrgRelation>) => void
  removeOrgRelation: (id: string) => void
  /** Add a projet (id filled in); returns the new id. */
  addProjet: (projet: Omit<Projet, "id">) => string
  updateProjet: (id: string, patch: Partial<Projet>) => void
  /** Delete a projet with its sous-projets and every tâche underneath. */
  removeProjet: (id: string) => void
  addSousProjet: (sousProjet: Omit<SousProjet, "id">) => string
  /** Add a tâche (id filled in); returns the new id. */
  addTache: (tache: Omit<Tache, "id">) => string
  updateTache: (id: string, patch: Partial<Tache>) => void
  removeTache: (id: string) => void
  /** Move a tâche to another kanban column. */
  setTacheStatut: (id: string, statut: Tache["statut"]) => void
  /** Replace a tâche's sous-tâches (the edit modal saves the whole list). */
  setSousTaches: (tacheId: string, sousTaches: SousTache[]) => void
  /** Tick / untick one sous-tâche in place. */
  toggleSousTache: (tacheId: string, sousTacheId: string) => void
  /** Move one tâche from a (unité, membre) to another one. */
  moveOrgTache: (
    from: { uniteId: string; membreId: string; tacheId: string },
    to: { uniteId: string; membreId: string },
  ) => void
  /** Add a sponsoring offer (id filled in); returns the new id. */
  addOffer: (offer: Omit<Offer, "id">) => string
  updateOffer: (id: string, patch: Partial<Offer>) => void
  removeOffer: (id: string) => void
  /** Clone an offer (« Copie » suffix); returns the new id. */
  duplicateOffer: (id: string) => string
  /** Seed the three suggested offers (Or / Argent / Bronze) at once. */
  addSuggestedOffers: () => void
  /** Sign a partenaire on an offer (id filled in); returns the new id. */
  addPartner: (partner: Omit<Partner, "id">) => string
  updatePartner: (id: string, patch: Partial<Partner>) => void
  removePartner: (id: string) => void
  /** Create a campaign for a partenaire (id filled in); returns the new id. */
  addCampaign: (campaign: Omit<Campaign, "id">) => string
  updateCampaign: (id: string, patch: Partial<Campaign>) => void
  removeCampaign: (id: string) => void
  /**
   * Submit a custom sponsoring request (id/status/price/date filled in);
   * pushes an unread admin notification. Returns the new id.
   */
  addOfferRequest: (
    request: Omit<
      OfferRequest,
      "id" | "status" | "price" | "decisionNote" | "createdAt"
    >,
  ) => string
  /** Admin decision on a request (accept + price, or refuse). */
  updateOfferRequest: (id: string, patch: Partial<OfferRequest>) => void
  /** Add a transaction (id/season/flags filled in); returns the new id. */
  addTransaction: (tx: NewTransaction) => string
  /** Edit an existing transaction in place. */
  updateTransaction: (id: string, patch: Partial<NewTransaction>) => void
  /** Soft-delete: hide from table/KPIs, keep restorable in the Historique. */
  deleteTransaction: (id: string) => void
  /** Restore a soft-deleted transaction back into the active view. */
  restoreTransaction: (id: string) => void
  /** Submit a transaction request (id/season/status/date filled in); returns the new id. */
  addTransactionRequest: (request: NewTransactionRequest) => string
  /**
   * Admin decision on a request — flips the status and stamps the decision date
   * (the prototype does NOT create the matching transaction).
   */
  decideTransactionRequest: (
    id: string,
    status: "approuvee" | "refusee",
    note?: string,
  ) => void

  /* ── Budget module (Outil Budget) — seasons / drafts / groups / lines ── */
  budget2: Budget2State
  /** Create a global season; returns its id. */
  addBudget2Season: (input: Omit<Budget2Season, "id">) => string
  /** Create a blank `brouillon` draft in a season; returns its id. */
  addBudget2Draft: (seasonId: string, label: string) => string
  updateBudget2Draft: (id: string, patch: Partial<Budget2Draft>) => void
  removeBudget2Draft: (id: string) => void
  /** Clone a draft (lines + pooled groups); returns the new draft id. */
  duplicateBudget2Draft: (id: string) => string
  /** Validate a draft — becomes the season reference, demotes the previous one. */
  validateBudget2Draft: (id: string) => void
  /** Clone another draft's lines into a target draft (replace or append). */
  importBudget2FromDraft: (
    sourceId: string,
    targetId: string,
    mode: "replace" | "append",
  ) => void
  addBudget2Line: (line: Omit<BudgetLine, "id">) => string
  updateBudget2Line: (id: string, patch: Partial<BudgetLine>) => void
  removeBudget2Line: (id: string) => void
  /** Add a pooled team-group to a draft; returns its id. */
  addBudget2Group: (group: Omit<BudgetTeamGroup, "id">) => string
  updateBudget2Group: (id: string, patch: Partial<BudgetTeamGroup>) => void
  removeBudget2Group: (id: string) => void
}

export const DataContext = createContext<DataContextValue | null>(null)

export function DataProvider({ children }: { children: ReactNode }) {
  // Signed in as the club admin on first load; signing out sends you to the
  // /connexion screen, where you pick the admin or the sponsor space.
  const [session, setSession] = useState<Session | null>(adminSession)
  const [budget, dispatch] = useReducer(reducer, budgetSeed)
  // Archived seasons are read-only for now (no screen mutates them), so they
  // live in plain in-memory state rather than the budget reducer.
  const [seasons] = useState<Season[]>(seasonsSeed)
  // Recorded entries only ever add/remove (no per-field edit), so plain state
  // is enough — no reducer. New entries go to the front (most recent first).
  const [entries, setEntries] = useState<Entry[]>(entriesSeed)
  // Monthly planning preview is read-only for now (the plan screen is
  // auto-filled and self-contained), so it stays in plain in-memory state.
  const [months] = useState<Month[]>(monthsSeed)
  // Documents only add/remove (the editor is a placeholder), so plain state is
  // enough. New documents go to the front (most recent first).
  const [documents, setDocuments] = useState<Document[]>(documentsSeed)
  // Fiches & Documents: same add/remove shape — a fiche is created from the
  // modal and read on its detail page; its membres come from the picker.
  const [fiches, setFiches] = useState<Fiche[]>(fichesSeed)
  // Procédés: the taxonomy (groupes ▸ phases ▸ principes) is a fixed
  // referential, only the library itself add / edit / removes. New procédés go
  // to the front so a freshly created one leads its principe's grid.
  const [procedeGroupes] = useState<ProcedeGroupe[]>(procedeGroupesSeed)
  const [procedePhases] = useState<ProcedePhase[]>(procedePhasesSeed)
  const [procedePrincipes] = useState<ProcedePrincipe[]>(procedePrincipesSeed)
  const [procedes, setProcedes] = useState<ProcedeItem[]>(procedesSeed)
  // Programme annuel + the séances that realise it. They mutate together
  // (planifier / supprimer a séance re-links its programme slot), so they sit
  // side by side in plain in-memory state.
  const [programmesAnnuels, setProgrammesAnnuels] = useState<ProgrammeAnnuel[]>(
    programmesAnnuelsSeed,
  )
  // Which programme the Programmation screen is looking at. It is UI scope, but
  // it lives here so the screen keeps its selection across navigation.
  const [programmeScope, setScope] = useState<ProgrammeScope>({
    saison: SAISON_ACTIVE,
    categorieId: "fff",
    groupeId: "fff-groupe-a",
  })
  const [seancesClub, setSeancesClub] = useState<SeanceClub[]>(seancesClubSeed)
  // Projets de jeu are read-only for now (the club consults its model; editing
  // the étapes is a future job). Compositions add / edit / remove.
  const [projetsDeJeu] = useState<ProjetDeJeu[]>(projetsDeJeuSeed)
  const [compositions, setCompositions] =
    useState<Composition[]>(compositionsSeed)
  // Catégories add / edit / remove. New rows get a uuid; seed rows keep their
  // readable slug ids (the URL of a catégorie is its id).
  const [categories, setCategories] = useState<Categorie[]>(categoriesSeed)
  // Calendar events add / edit / remove, so plain in-memory state is enough
  // (no reducer). New rows get a uuid; seed rows keep their readable slug ids.
  const [events, setEvents] = useState<PlanEvent[]>(eventsSeed)
  // Séance details are read-only for now (the coach views the plan; editing the
  // procédé library is a future job), so plain in-memory state is enough.
  const [seanceDetails] = useState<SeanceDetail[]>(seanceDetailsSeed)
  // Match details are read-only for now (the club views the briefing / debrief;
  // editing convocations & présences is a future job), like séance details.
  const [matchDetails] = useState<MatchDetail[]>(matchDetailsSeed)
  // Objectives + notifications live in plain state (add / status-change /
  // mark-read only). Creating an objective also pushes a linked notification;
  // reviewObjectifId drives the global review modal mounted in AppShell.
  const [objectifs, setObjectifs] = useState<Objectif[]>(objectifsSeed)
  const [notifications, setNotifications] = useState<AppNotif[]>(notificationsSeed)
  const [reviewObjectifId, setReviewObjectifId] = useState<string | null>(null)
  // Éducateurs add / edit / remove, so plain in-memory state is enough. New
  // rows get a uuid; seed rows keep their readable slug ids.
  const [educateurs, setEducateurs] = useState<Educateur[]>(educateursSeed)
  // Organigramme — unités (tree + canvas position + affectations) and the
  // transverse relations between them. The membres pool is read-only: people
  // are created elsewhere in the product, the organigramme only places them.
  const [orgUnites, setOrgUnites] = useState<OrgUnite[]>(unitesSeed)
  const [orgRelations, setOrgRelations] = useState<OrgRelation[]>(relationsSeed)
  const [orgMembres] = useState<OrgMembre[]>(membresPool)
  // Gestion des tâches — projets / sous-projets / tâches. Tâches stay flat so
  // the kanban, the hierarchy and the project cards are three filters over one
  // list rather than three copies of the same work.
  const [projets, setProjets] = useState<Projet[]>(projetsSeed)
  const [sousProjets, setSousProjets] = useState<SousProjet[]>(sousProjetsSeed)
  const [taches, setTaches] = useState<Tache[]>(tachesSeed)
  // Sponsoring offers — add / edit / remove / duplicate, plain in-memory state.
  // Seed is empty: the module opens on its empty state until the club joins.
  // Sponsoring — the club has already joined the program, so offers and their
  // partenaires are seeded. Deleting every offer returns the module to its
  // onboarding empty state.
  const [offers, setOffers] = useState<Offer[]>(offersSeed)
  const [partners, setPartners] = useState<Partner[]>(partnersSeed)
  // Sponsor accounts are created on the sponsor's side of the product, so they
  // stay read-only. Campaigns mutate: the club admin creates them himself for
  // a partenaire (Sponsoring ▸ Campagnes ▸ Nouvelle campagne).
  const [sponsorAccounts] = useState<SponsorAccount[]>(sponsorAccountsSeed)
  const [campaigns, setCampaigns] = useState<Campaign[]>(campaignsSeed)
  // Custom sponsoring requests — a sponsor submits from a club's offers page,
  // the admin accepts (with a price) or refuses from Sponsoring ▸ Demandes.
  const [offerRequests, setOfferRequests] =
    useState<OfferRequest[]>(offerRequestsSeed)
  // Finance referential + config are read-only in this phase (managed on a
  // future admin page), so they live in plain in-memory state. Transactions
  // add / edit / soft-delete / restore, so they carry the mutating helpers.
  const [financeConfig] = useState<FinanceConfig>(financeConfigSeed)
  const [financeTeams] = useState<FinanceTeam[]>(financeTeamsSeed)
  const [staff] = useState<StaffMember[]>(staffSeed)
  const [groups] = useState<Group[]>(groupsSeed)
  const [subCategories] = useState<SubCategory[]>(subCategoriesSeed)
  const [transactions, setTransactions] = useState<Transaction[]>(transactionsSeed)
  // Demandes de transaction — submitted on Finance ▸ Demander une transaction,
  // decided by the admin from the Demandes inbox on the Transactions screen.
  const [transactionRequests, setTransactionRequests] = useState<
    TransactionRequest[]
  >(transactionRequestsSeed)
  // Budget module — its own reducer (seasons / drafts / groups / lines). IDs and
  // timestamps are minted here and passed in, keeping the reducer pure.
  const [budget2, dispatch2] = useReducer(budget2Reducer, budget2InitialState)

  // The programme of the active scope — derived, never stored.
  const programmeAnnuel = useMemo(
    () =>
      programmesAnnuels.find(
        (p) =>
          p.saison === programmeScope.saison &&
          p.categorieId === programmeScope.categorieId &&
          p.groupeId === programmeScope.groupeId,
      ) ?? null,
    [programmesAnnuels, programmeScope],
  )

  const value = useMemo<DataContextValue>(
    () => ({
      session,
      signInAsAdmin: () => setSession(adminSession),
      signInAsSponsor: () => setSession(sponsorSession),
      signOut: () => setSession(null),
      budget,
      seasons,
      entries,
      months,
      documents,
      fiches,
      procedeGroupes,
      procedePhases,
      procedePrincipes,
      procedes,
      saisons: SAISONS,
      programmesAnnuels,
      programmeScope,
      programmeAnnuel,
      seancesClub,
      projetsDeJeu,
      compositions,
      categories,
      events,
      seanceDetails,
      matchDetails,
      objectifs,
      notifications,
      reviewObjectifId,
      educateurs,
      orgUnites,
      orgRelations,
      orgMembres,
      projets,
      sousProjets,
      taches,
      offers,
      partners,
      sponsorAccounts,
      campaigns,
      offerRequests,
      financeConfig,
      financeTeams,
      staff,
      groups,
      subCategories,
      transactions,
      transactionRequests,
      setSeason: (season) => dispatch({ type: "setSeason", season }),
      setMode: (mode) => dispatch({ type: "setMode", mode }),
      setGlobalIncome: (value) => dispatch({ type: "setGlobalIncome", value }),
      setGlobalExpense: (value) => dispatch({ type: "setGlobalExpense", value }),
      updateLine: (list, id, patch) =>
        dispatch({ type: "updateLine", list, id, patch }),
      addLine: (list, line) =>
        dispatch({
          type: "addLine",
          list,
          line: {
            id: crypto.randomUUID(),
            label: "",
            amount: 0,
            pct: 0,
            ...line,
          },
        }),
      removeLine: (list, id) => dispatch({ type: "removeLine", list, id }),
      addEntry: (entry) =>
        setEntries((prev) => [{ id: crypto.randomUUID(), ...entry }, ...prev]),
      removeEntry: (id) =>
        setEntries((prev) => prev.filter((entry) => entry.id !== id)),
      addDocument: (doc) => {
        const id = crypto.randomUUID()
        setDocuments((prev) => [{ id, ...doc }, ...prev])
        return id
      },
      removeDocument: (id) =>
        setDocuments((prev) => prev.filter((doc) => doc.id !== id)),
      addFiche: (fiche) => {
        const id = crypto.randomUUID()
        setFiches((prev) => [{ id, ...fiche }, ...prev])
        return id
      },
      removeFiche: (id) =>
        setFiches((prev) => prev.filter((fiche) => fiche.id !== id)),
      addProcede: (procede) => {
        const id = crypto.randomUUID()
        setProcedes((prev) => [{ id, ...procede }, ...prev])
        return id
      },
      updateProcede: (id, patch) =>
        setProcedes((prev) =>
          prev.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        ),
      removeProcede: (id) =>
        setProcedes((prev) => prev.filter((p) => p.id !== id)),
      setProgrammeScope: (patch) =>
        setScope((prev) => {
          const next = { ...prev, ...patch }
          // Changing catégorie invalidates the groupe — fall back to its first.
          if (patch.categorieId && !patch.groupeId) {
            const cat = categories.find((c) => c.id === patch.categorieId)
            next.groupeId = cat?.groupes[0]?.id ?? ""
          }
          return next
        }),
      creerProgrammeAnnuel: () => {
        const id = crypto.randomUUID()
        const cat = categories.find((c) => c.id === programmeScope.categorieId)
        const groupe = cat?.groupes.find((g) => g.id === programmeScope.groupeId)
        setProgrammesAnnuels((prev) =>
          prev.some(
            (p) =>
              p.saison === programmeScope.saison &&
              p.categorieId === programmeScope.categorieId &&
              p.groupeId === programmeScope.groupeId,
          )
            ? prev
            : [
                ...prev,
                programmeVierge(id, {
                  ...programmeScope,
                  categorie: cat?.nom ?? "",
                  groupe: groupe?.nom ?? "",
                }),
              ],
        )
        return id
      },
      updateProgSession: (id, patch) =>
        setProgrammesAnnuels((prev) =>
          prev.map((prog) =>
            prog.sessions.some((s) => s.id === id)
              ? {
                  ...prog,
                  sessions: prog.sessions.map((s) =>
                    s.id === id ? { ...s, ...patch } : s,
                  ),
                }
              : prog,
          ),
        ),
      // Edit mode of the Programmation screen — the coach shapes the season
      // itself: a semaine is a group of séance placeholders, so adding one adds
      // the club's weekly rhythm and removing the last slot removes the week.
      addProgSemaine: (programmeId) =>
        setProgrammesAnnuels((prev) =>
          prev.map((prog) => {
            if (prog.id !== programmeId) return prog
            const semaine =
              prog.sessions.reduce((max, s) => Math.max(max, s.semaine), 0) + 1
            const ajouts: ProgSession[] = Array.from(
              { length: SEANCES_PAR_SEMAINE },
              (_, index) => ({
                id: crypto.randomUUID(),
                semaine,
                numero: 0,
                index,
              }),
            )
            return {
              ...prog,
              sessions: renumeroterSessions([...prog.sessions, ...ajouts]),
            }
          }),
        ),
      addProgSession: (programmeId, semaine) =>
        setProgrammesAnnuels((prev) =>
          prev.map((prog) =>
            prog.id === programmeId
              ? {
                  ...prog,
                  sessions: renumeroterSessions([
                    ...prog.sessions,
                    {
                      id: crypto.randomUUID(),
                      semaine,
                      numero: 0,
                      // Last of its week — renumbering densifies the index.
                      index: prog.sessions.filter((s) => s.semaine === semaine)
                        .length,
                    },
                  ]),
                }
              : prog,
          ),
        ),
      removeProgSession: (id) =>
        setProgrammesAnnuels((prev) =>
          prev.map((prog) => {
            const slot = prog.sessions.find((s) => s.id === id)
            // A planned slot stays: its séance would be left with no line.
            if (!slot || slot.seanceId) return prog
            return {
              ...prog,
              sessions: renumeroterSessions(
                prog.sessions.filter((s) => s.id !== id),
              ),
            }
          }),
        ),
      removeProgSemaine: (programmeId, semaine) =>
        setProgrammesAnnuels((prev) =>
          prev.map((prog) => {
            if (prog.id !== programmeId) return prog
            const slots = prog.sessions.filter((s) => s.semaine === semaine)
            if (!slots.length || slots.some((s) => s.seanceId)) return prog
            return {
              ...prog,
              sessions: renumeroterSessions(
                prog.sessions.filter((s) => s.semaine !== semaine),
              ),
            }
          }),
        ),
      planifierSeance: (sessionId) => {
        const id = crypto.randomUUID()
        setProgrammesAnnuels((prev) => {
          const prog = prev.find((p) =>
            p.sessions.some((s) => s.id === sessionId),
          )
          const slot = prog?.sessions.find((s) => s.id === sessionId)
          if (!prog || !slot || slot.seanceId) return prev
          // The séance inherits the slot's principe, week and installation —
          // planning is "make this programme line real", not a fresh form.
          setSeancesClub((rows) =>
            [
              ...rows,
              {
                id,
                numero: slot.numero,
                date: new Date(
                  Date.UTC(2025, 6, 1) + (slot.semaine - 1) * 7 * 864e5,
                ).toISOString(),
                categorie: prog.categorie,
                groupe: prog.groupe,
                statut: "À venir" as const,
                brouillon: true,
                duree: "60",
                installation: slot.installation,
                principeId: slot.principeId,
                special: slot.special,
                effectif: 0,
                rpeCible: 0,
                materiel: [],
                procedeIds: [],
                securiteVerifiee: false,
                hydratationVerifiee: false,
              },
            ].sort((a, b) => a.date.localeCompare(b.date)),
          )
          return prev.map((p) =>
            p.id === prog.id
              ? {
                  ...p,
                  sessions: p.sessions.map((s) =>
                    s.id === sessionId ? { ...s, seanceId: id } : s,
                  ),
                }
              : p,
          )
        })
        return id
      },
      addSeance: (seance) => {
        const id = crypto.randomUUID()
        setSeancesClub((prev) =>
          [...prev, { id, ...seance }].sort((a, b) =>
            a.date.localeCompare(b.date),
          ),
        )
        return id
      },
      updateSeance: (id, patch) =>
        setSeancesClub((prev) =>
          prev.map((s) => (s.id === id ? { ...s, ...patch } : s)),
        ),
      addCategorie: (categorie) => {
        const id = crypto.randomUUID()
        setCategories((prev) => [...prev, { id, ...categorie }])
        return id
      },
      updateCategorie: (id, patch) =>
        setCategories((prev) =>
          prev.map((c) => (c.id === id ? { ...c, ...patch } : c)),
        ),
      removeCategorie: (id) =>
        setCategories((prev) => prev.filter((c) => c.id !== id)),
      addComposition: (composition) => {
        const id = crypto.randomUUID()
        setCompositions((prev) => [{ id, ...composition }, ...prev])
        return id
      },
      updateComposition: (id, patch) =>
        setCompositions((prev) =>
          prev.map((c) => (c.id === id ? { ...c, ...patch } : c)),
        ),
      removeComposition: (id) =>
        setCompositions((prev) => prev.filter((c) => c.id !== id)),
      removeSeance: (id) => {
        setSeancesClub((prev) => prev.filter((s) => s.id !== id))
        setProgrammesAnnuels((prev) =>
          prev.map((prog) =>
            prog.sessions.some((s) => s.seanceId === id)
              ? {
                  ...prog,
                  sessions: prog.sessions.map((s) =>
                    s.seanceId === id ? { ...s, seanceId: undefined } : s,
                  ),
                }
              : prog,
          ),
        )
      },
      addEvent: (event) => {
        const id = crypto.randomUUID()
        setEvents((prev) => [...prev, { id, ...event }])
        return id
      },
      updateEvent: (id, patch) =>
        setEvents((prev) =>
          prev.map((event) => (event.id === id ? { ...event, ...patch } : event)),
        ),
      removeEvent: (id) =>
        setEvents((prev) => prev.filter((event) => event.id !== id)),
      addObjectif: (input) => {
        const id = crypto.randomUUID()
        const date = new Date().toLocaleDateString("fr-FR")
        setObjectifs((prev) => [
          { ...input, id, statut: "En attente", date },
          ...prev,
        ])
        // Push a linked, unread notification so the bell reflects the new objective.
        setNotifications((prev) => [
          {
            id: crypto.randomUUID(),
            kind: "objectif",
            title: "Objectif technique",
            date,
            body: `Nouvel objectif « ${input.titre} » à valider`,
            unread: true,
            objectifId: id,
          },
          ...prev,
        ])
        return id
      },
      setObjectifStatut: (id, statut) =>
        setObjectifs((prev) =>
          prev.map((o) => (o.id === id ? { ...o, statut } : o)),
        ),
      markNotifRead: (id) =>
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, unread: false } : n)),
        ),
      openObjectifReview: (id) => setReviewObjectifId(id),
      closeObjectifReview: () => setReviewObjectifId(null),
      addEducateur: (edu) => {
        const id = crypto.randomUUID()
        setEducateurs((prev) => [{ id, ...edu }, ...prev])
        return id
      },
      updateEducateur: (id, patch) =>
        setEducateurs((prev) =>
          prev.map((edu) => (edu.id === id ? { ...edu, ...patch } : edu)),
        ),
      removeEducateur: (id) =>
        setEducateurs((prev) => prev.filter((edu) => edu.id !== id)),
      addOrgUnite: (unite) => {
        const id = crypto.randomUUID()
        setOrgUnites((prev) => [...prev, { id, ...unite }])
        return id
      },
      updateOrgUnite: (id, patch) =>
        setOrgUnites((prev) =>
          prev.map((u) => (u.id === id ? { ...u, ...patch } : u)),
        ),
      removeOrgUnite: (id) => {
        setOrgUnites((prev) => {
          const gone = prev.find((u) => u.id === id)
          if (!gone) return prev
          // Children are re-attached to the deleted unité's own parent, so the
          // tree never breaks into orphan branches.
          return prev
            .filter((u) => u.id !== id)
            .map((u) =>
              u.parentId === id ? { ...u, parentId: gone.parentId } : u,
            )
        })
        // Its transverse relations go with it.
        setOrgRelations((prev) =>
          prev.filter((r) => r.sourceId !== id && r.targetId !== id),
        )
      },
      setOrgPositions: (positions) =>
        setOrgUnites((prev) =>
          prev.map((u) => (positions[u.id] ? { ...u, ...positions[u.id] } : u)),
        ),
      setOrgUniteMembres: (id, membres) =>
        setOrgUnites((prev) =>
          prev.map((u) => (u.id === id ? { ...u, membres } : u)),
        ),
      addOrgRelation: (relation) => {
        const id = crypto.randomUUID()
        setOrgRelations((prev) => [...prev, { id, ...relation }])
        return id
      },
      updateOrgRelation: (id, patch) =>
        setOrgRelations((prev) =>
          prev.map((r) => (r.id === id ? { ...r, ...patch } : r)),
        ),
      removeOrgRelation: (id) =>
        setOrgRelations((prev) => prev.filter((r) => r.id !== id)),
      addProjet: (projet) => {
        const id = crypto.randomUUID()
        setProjets((prev) => [{ id, ...projet }, ...prev])
        return id
      },
      updateProjet: (id, patch) =>
        setProjets((prev) =>
          prev.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        ),
      removeProjet: (id) => {
        // A sous-projet and a tâche only exist through their projet.
        const orphans = new Set(
          sousProjets.filter((sp) => sp.projetId === id).map((sp) => sp.id),
        )
        setProjets((prev) => prev.filter((p) => p.id !== id))
        setSousProjets((prev) => prev.filter((sp) => sp.projetId !== id))
        setTaches((prev) => prev.filter((t) => !orphans.has(t.sousProjetId)))
      },
      addSousProjet: (sousProjet) => {
        const id = crypto.randomUUID()
        setSousProjets((prev) => [...prev, { id, ...sousProjet }])
        return id
      },
      addTache: (tache) => {
        const id = crypto.randomUUID()
        setTaches((prev) => [{ id, ...tache }, ...prev])
        return id
      },
      updateTache: (id, patch) =>
        setTaches((prev) =>
          prev.map((t) => (t.id === id ? { ...t, ...patch } : t)),
        ),
      removeTache: (id) => setTaches((prev) => prev.filter((t) => t.id !== id)),
      setTacheStatut: (id, statut) =>
        setTaches((prev) =>
          prev.map((t) =>
            t.id !== id
              ? t
              : {
                  ...t,
                  statut,
                  // Closing a tâche closes what's left under it — a "Terminée"
                  // card with open sous-tâches reads as a bug.
                  sousTaches:
                    statut === "Terminée"
                      ? t.sousTaches.map((s) => ({ ...s, faite: true }))
                      : t.sousTaches,
                },
          ),
        ),
      setSousTaches: (tacheId, sousTaches) =>
        setTaches((prev) =>
          prev.map((t) => (t.id === tacheId ? { ...t, sousTaches } : t)),
        ),
      toggleSousTache: (tacheId, sousTacheId) =>
        setTaches((prev) =>
          prev.map((t) =>
            t.id !== tacheId
              ? t
              : {
                  ...t,
                  sousTaches: t.sousTaches.map((s) =>
                    s.id === sousTacheId ? { ...s, faite: !s.faite } : s,
                  ),
                },
          ),
        ),
      moveOrgTache: (from, to) =>
        setOrgUnites((prev) => {
          const source = prev.find((u) => u.id === from.uniteId)
          const tache = source?.membres
            .find((a) => a.membreId === from.membreId)
            ?.taches.find((t) => t.id === from.tacheId)
          if (!tache) return prev
          return prev.map((u) => ({
            ...u,
            membres: u.membres.map((a) => {
              if (u.id === from.uniteId && a.membreId === from.membreId) {
                return {
                  ...a,
                  taches: a.taches.filter((t) => t.id !== from.tacheId),
                }
              }
              if (u.id === to.uniteId && a.membreId === to.membreId) {
                return { ...a, taches: [...a.taches, tache] }
              }
              return a
            }),
          }))
        }),
      addOffer: (offer) => {
        const id = crypto.randomUUID()
        setOffers((prev) => [...prev, { id, ...offer }])
        return id
      },
      updateOffer: (id, patch) =>
        setOffers((prev) =>
          prev.map((o) => (o.id === id ? { ...o, ...patch } : o)),
        ),
      removeOffer: (id) => {
        setOffers((prev) => prev.filter((o) => o.id !== id))
        // A partenaire only exists through the offer it occupies a seat on.
        setPartners((prev) => prev.filter((p) => p.offerId !== id))
      },
      duplicateOffer: (id) => {
        const newId = crypto.randomUUID()
        setOffers((prev) => {
          const src = prev.find((o) => o.id === id)
          if (!src) return prev
          return [...prev, { ...src, id: newId, name: `${src.name} (copie)` }]
        })
        return newId
      },
      addSuggestedOffers: () =>
        setOffers((prev) =>
          prev.length
            ? prev
            : SUGGESTED_OFFERS.map((o) => ({ id: crypto.randomUUID(), ...o })),
        ),
      addPartner: (partner) => {
        const id = crypto.randomUUID()
        setPartners((prev) => [{ id, ...partner }, ...prev])
        return id
      },
      updatePartner: (id, patch) =>
        setPartners((prev) =>
          prev.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        ),
      removePartner: (id) =>
        setPartners((prev) => prev.filter((p) => p.id !== id)),
      addCampaign: (campaign) => {
        const id = crypto.randomUUID()
        // Newest first, so a freshly created campaign leads its partenaire's list.
        setCampaigns((prev) => [{ id, ...campaign }, ...prev])
        return id
      },
      updateCampaign: (id, patch) =>
        setCampaigns((prev) =>
          prev.map((c) => (c.id === id ? { ...c, ...patch } : c)),
        ),
      removeCampaign: (id) =>
        setCampaigns((prev) => prev.filter((c) => c.id !== id)),
      addOfferRequest: (request) => {
        const id = crypto.randomUUID()
        const date = new Date().toLocaleDateString("fr-FR")
        setOfferRequests((prev) => [
          {
            ...request,
            id,
            status: "en_attente",
            price: null,
            decisionNote: "",
            createdAt: date,
          },
          ...prev,
        ])
        // Notify the club admin so the bell reflects the new request.
        setNotifications((prev) => [
          {
            id: crypto.randomUUID(),
            kind: "demande",
            title: "Demande de sponsoring",
            date,
            body: `${request.company || "Un sponsor"} souhaite une offre sur mesure`,
            unread: true,
          },
          ...prev,
        ])
        return id
      },
      updateOfferRequest: (id, patch) =>
        setOfferRequests((prev) =>
          prev.map((r) => (r.id === id ? { ...r, ...patch } : r)),
        ),
      addTransaction: (tx) => {
        const id = crypto.randomUUID()
        setTransactions((prev) => [
          {
            ...tx,
            id,
            season: financeConfig.active_season,
            is_deleted: false,
            created_at: new Date().toISOString(),
          },
          ...prev,
        ])
        return id
      },
      updateTransaction: (id, patch) =>
        setTransactions((prev) =>
          prev.map((tx) => (tx.id === id ? { ...tx, ...patch } : tx)),
        ),
      deleteTransaction: (id) =>
        setTransactions((prev) =>
          prev.map((tx) =>
            tx.id === id
              ? { ...tx, is_deleted: true, deleted_at: new Date().toISOString() }
              : tx,
          ),
        ),
      restoreTransaction: (id) =>
        setTransactions((prev) =>
          prev.map((tx) =>
            tx.id === id
              ? { ...tx, is_deleted: false, deleted_at: undefined }
              : tx,
          ),
        ),
      addTransactionRequest: (request) => {
        const id = crypto.randomUUID()
        const today = new Date().toISOString().slice(0, 10)
        setTransactionRequests((prev) => [
          {
            ...request,
            id,
            season: financeConfig.active_season,
            status: "en_attente",
            created_at: today,
          },
          ...prev,
        ])
        // Notify the admin so the bell reflects the new request.
        setNotifications((prev) => [
          {
            id: crypto.randomUUID(),
            kind: "demande",
            title: "Demande de transaction",
            date: new Date().toLocaleDateString("fr-FR"),
            body: `${request.nature} de ${request.amount} TND à valider`,
            unread: true,
          },
          ...prev,
        ])
        return id
      },
      decideTransactionRequest: (id, status, note) =>
        setTransactionRequests((prev) =>
          prev.map((r) =>
            r.id === id
              ? {
                  ...r,
                  status,
                  decided_at: new Date().toISOString().slice(0, 10),
                  decision_note: note?.trim() ? note.trim() : undefined,
                }
              : r,
          ),
        ),

      /* ── Budget module ──────────────────────────────────────────────── */
      budget2,
      addBudget2Season: (input) => {
        const id = crypto.randomUUID()
        dispatch2({ type: "addSeason", season: { id, ...input } })
        return id
      },
      addBudget2Draft: (seasonId, label) => {
        const id = crypto.randomUUID()
        dispatch2({
          type: "addDraft",
          draft: {
            id,
            season_id: seasonId,
            label,
            status: "brouillon",
            updated_at: new Date().toISOString(),
          },
        })
        return id
      },
      updateBudget2Draft: (id, patch) =>
        dispatch2({ type: "updateDraft", id, patch, at: new Date().toISOString() }),
      removeBudget2Draft: (id) => dispatch2({ type: "removeDraft", id }),
      duplicateBudget2Draft: (id) => {
        const newId = crypto.randomUUID()
        dispatch2({ type: "duplicateDraft", id, newId, at: new Date().toISOString() })
        return newId
      },
      validateBudget2Draft: (id) =>
        dispatch2({ type: "validateDraft", id, at: new Date().toISOString() }),
      importBudget2FromDraft: (sourceId, targetId, mode) =>
        dispatch2({
          type: "importFromDraft",
          sourceId,
          targetId,
          mode,
          at: new Date().toISOString(),
        }),
      addBudget2Line: (line) => {
        const id = crypto.randomUUID()
        dispatch2({ type: "addLine", line: { id, ...line }, at: new Date().toISOString() })
        return id
      },
      updateBudget2Line: (id, patch) =>
        dispatch2({ type: "updateLine", id, patch, at: new Date().toISOString() }),
      removeBudget2Line: (id) =>
        dispatch2({ type: "removeLine", id, at: new Date().toISOString() }),
      addBudget2Group: (group) => {
        const id = crypto.randomUUID()
        dispatch2({ type: "addGroup", group: { id, ...group }, at: new Date().toISOString() })
        return id
      },
      updateBudget2Group: (id, patch) =>
        dispatch2({ type: "updateGroup", id, patch, at: new Date().toISOString() }),
      removeBudget2Group: (id) =>
        dispatch2({ type: "removeGroup", id, at: new Date().toISOString() }),
    }),
    [
      session,
      budget,
      seasons,
      entries,
      months,
      documents,
      fiches,
      procedeGroupes,
      procedePhases,
      procedePrincipes,
      procedes,
      programmesAnnuels,
      programmeScope,
      programmeAnnuel,
      seancesClub,
      projetsDeJeu,
      compositions,
      categories,
      events,
      seanceDetails,
      matchDetails,
      objectifs,
      notifications,
      reviewObjectifId,
      educateurs,
      orgUnites,
      orgRelations,
      orgMembres,
      projets,
      sousProjets,
      taches,
      offers,
      partners,
      sponsorAccounts,
      campaigns,
      offerRequests,
      financeConfig,
      financeTeams,
      staff,
      groups,
      subCategories,
      transactions,
      transactionRequests,
      budget2,
    ],
  )

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}
