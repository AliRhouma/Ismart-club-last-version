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
import { eventsSeed, type PlanEvent } from "@/data/seed/events"
import { objectifsSeed, type Objectif, type ObjectifStatut } from "@/data/seed/objectifs"
import { notificationsSeed, type AppNotif } from "@/data/seed/notifications"
import { educateursSeed, type Educateur } from "@/data/seed/educateurs"
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
  /** Scheduled events shown on the Planification calendar. */
  events: PlanEvent[]
  /** Technical objectives (Structuration ▸ Objectifs techniques). */
  objectifs: Objectif[]
  /** Top-bar notifications (newest first). */
  notifications: AppNotif[]
  /** Objective currently open in the global review modal, or null. */
  reviewObjectifId: string | null
  /** Éducateurs (coaches) — Ressources humaines. */
  educateurs: Educateur[]
  /** Sponsoring offers (Or / Argent / Bronze…), sorted by the screens. */
  offers: Offer[]
  /** Partenaires signed on an offer (each takes one of its seats). */
  partners: Partner[]
  /** Sponsor-side iSmart Club accounts an admin can link a partenaire to. */
  sponsorAccounts: SponsorAccount[]
  /** Campaigns run by partenaires — one `en_cours` at most, plus archives. */
  campaigns: Campaign[]
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
  /** Add a transaction (id/season/flags filled in); returns the new id. */
  addTransaction: (tx: NewTransaction) => string
  /** Edit an existing transaction in place. */
  updateTransaction: (id: string, patch: Partial<NewTransaction>) => void
  /** Soft-delete: hide from table/KPIs, keep restorable in the Historique. */
  deleteTransaction: (id: string) => void
  /** Restore a soft-deleted transaction back into the active view. */
  restoreTransaction: (id: string) => void

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
  // Calendar events add / edit / remove, so plain in-memory state is enough
  // (no reducer). New rows get a uuid; seed rows keep their readable slug ids.
  const [events, setEvents] = useState<PlanEvent[]>(eventsSeed)
  // Objectives + notifications live in plain state (add / status-change /
  // mark-read only). Creating an objective also pushes a linked notification;
  // reviewObjectifId drives the global review modal mounted in AppShell.
  const [objectifs, setObjectifs] = useState<Objectif[]>(objectifsSeed)
  const [notifications, setNotifications] = useState<AppNotif[]>(notificationsSeed)
  const [reviewObjectifId, setReviewObjectifId] = useState<string | null>(null)
  // Éducateurs add / edit / remove, so plain in-memory state is enough. New
  // rows get a uuid; seed rows keep their readable slug ids.
  const [educateurs, setEducateurs] = useState<Educateur[]>(educateursSeed)
  // Sponsoring offers — add / edit / remove / duplicate, plain in-memory state.
  // Seed is empty: the module opens on its empty state until the club joins.
  // Sponsoring — the club has already joined the program, so offers and their
  // partenaires are seeded. Deleting every offer returns the module to its
  // onboarding empty state.
  const [offers, setOffers] = useState<Offer[]>(offersSeed)
  const [partners, setPartners] = useState<Partner[]>(partnersSeed)
  // Sponsor accounts are created on the sponsor's side of the product, and
  // campaigns are read-only for now (the club views them; editing the visuals
  // is the sponsor's job). Both stay in plain read-only state.
  const [sponsorAccounts] = useState<SponsorAccount[]>(sponsorAccountsSeed)
  const [campaigns] = useState<Campaign[]>(campaignsSeed)
  // Finance referential + config are read-only in this phase (managed on a
  // future admin page), so they live in plain in-memory state. Transactions
  // add / edit / soft-delete / restore, so they carry the mutating helpers.
  const [financeConfig] = useState<FinanceConfig>(financeConfigSeed)
  const [financeTeams] = useState<FinanceTeam[]>(financeTeamsSeed)
  const [staff] = useState<StaffMember[]>(staffSeed)
  const [groups] = useState<Group[]>(groupsSeed)
  const [subCategories] = useState<SubCategory[]>(subCategoriesSeed)
  const [transactions, setTransactions] = useState<Transaction[]>(transactionsSeed)
  // Budget module — its own reducer (seasons / drafts / groups / lines). IDs and
  // timestamps are minted here and passed in, keeping the reducer pure.
  const [budget2, dispatch2] = useReducer(budget2Reducer, budget2InitialState)

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
      events,
      objectifs,
      notifications,
      reviewObjectifId,
      educateurs,
      offers,
      partners,
      sponsorAccounts,
      campaigns,
      financeConfig,
      financeTeams,
      staff,
      groups,
      subCategories,
      transactions,
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
      events,
      objectifs,
      notifications,
      reviewObjectifId,
      educateurs,
      offers,
      partners,
      sponsorAccounts,
      campaigns,
      financeConfig,
      financeTeams,
      staff,
      groups,
      subCategories,
      transactions,
      budget2,
    ],
  )

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}
