import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom"
import { FileQuestion, FileText } from "lucide-react"

import { navLeaves } from "@/lib/navigation"
import { DataProvider } from "@/data/DataProvider"
import { AppShell } from "@/shells/AppShell"
import { Placeholder } from "@/components/kit/Placeholder"
import { SeasonSelectScreen } from "@/features/budget/SeasonSelectScreen"
import { BudgetConfigScreen } from "@/features/budget/BudgetConfigScreen"
import { BudgetDashboardScreen } from "@/features/budget/BudgetDashboardScreen"
import { MonthlyPlanningScreen } from "@/features/budget/MonthlyPlanningScreen"
import { MonthPlanScreen } from "@/features/budget/MonthPlanScreen"
import { Budget2SeasonsScreen } from "@/features/budget2/Budget2SeasonsScreen"
import { Budget2SeasonScreen } from "@/features/budget2/Budget2SeasonScreen"
import { Budget2EditorScreen } from "@/features/budget2/Budget2EditorScreen"
import { Budget2CompareScreen } from "@/features/budget2/Budget2CompareScreen"
import { DocumentsScreen } from "@/features/documents/DocumentsScreen"
import { TransactionsScreen } from "@/features/finance/TransactionsScreen"
import { DemandeTransactionScreen } from "@/features/finance/DemandeTransactionScreen"
import { TransactionConfigScreen } from "@/features/finance/TransactionConfigScreen"
import { CompteRenduScreen } from "@/features/compte-rendu/CompteRenduScreen"
import { PlanificationScreen } from "@/features/planification/PlanificationScreen"
import { SeanceScreen } from "@/features/planification/SeanceScreen"
import { MatchScreen } from "@/features/planification/MatchScreen"
import { ResultatsScreen } from "@/features/resultats/ResultatsScreen"
import { MessagerieScreen } from "@/features/messagerie/MessagerieScreen"
import { ObjectifsScreen } from "@/features/objectifs/ObjectifsScreen"
import { CategoriesScreen } from "@/features/pole-technique/CategoriesScreen"
import { CategoryDetailScreen } from "@/features/pole-technique/CategoryDetailScreen"
import { EducateursScreen } from "@/features/educateurs/EducateursScreen"
import { SponsoringHome } from "@/features/sponsoring/SponsoringHome"
import { DemarrageScreen } from "@/features/sponsoring/DemarrageScreen"
import { OffreFormScreen } from "@/features/sponsoring/OffreFormScreen"
import { OffresScreen } from "@/features/sponsoring/OffresScreen"
import { OffreRequestsScreen } from "@/features/sponsoring/OffreRequestsScreen"
import { RequestEditScreen } from "@/features/sponsoring/RequestEditScreen"
import { EmplacementsScreen } from "@/features/sponsoring/EmplacementsScreen"
import { PartenairesScreen } from "@/features/sponsoring/PartenairesScreen"
import { PartenaireAccueilScreen } from "@/features/sponsoring/PartenaireAccueilScreen"
import { CampagneScreen } from "@/features/sponsoring/CampagneScreen"
import { CampagnesScreen as SponsoringCampagnesScreen } from "@/features/sponsoring/CampagnesScreen"
import { DemandesCampagneScreen } from "@/features/sponsoring/DemandesCampagneScreen"
import { DesignSystemScreen } from "@/features/design-system/DesignSystemScreen"
import { AccueilScreen } from "@/features/accueil/AccueilScreen"
import { LoginScreen } from "@/features/auth/LoginScreen"
import { PartenairesListScreen } from "@/features/sponsor/PartenairesListScreen"
import { CampagnesScreen } from "@/features/sponsor/CampagnesScreen"
import { NouvelleCampagneScreen } from "@/features/sponsor/NouvelleCampagneScreen"
import { CampagneVisuelsScreen } from "@/features/sponsor/CampagneVisuelsScreen"
import { ExplorerScreen } from "@/features/sponsor/ExplorerScreen"
import { ClubOffresScreen } from "@/features/sponsor/ClubOffresScreen"
import { CustomOfferScreen } from "@/features/sponsor/CustomOfferScreen"
import { DemandesSurMesureScreen } from "@/features/sponsor/DemandesSurMesureScreen"

/** Routes that have a real screen (so they skip the generic Placeholder). */
const CUSTOM_ROUTES = new Set([
  "/",
  "/ressources-humaines/educateurs",
  "/planification",
  "/resultats",
  "/messagerie",
  "/structuration/objectifs-techniques",
  "/pole-technique/categories",
  "/sponsoring",
  "/budget",
  "/budget2",
  "/documents",
  "/finance/transactions",
  "/finance/demande",
  "/compte-rendu",
  "/design-system",
])

/**
 * <DataProvider> wraps the router (CLAUDE.md). Every screen renders inside
 * <AppShell/>. Most leaves still render the on-brand Placeholder; Budget is
 * the first real feature (config + dashboard sub-route).
 */
export default function App() {
  return (
    <DataProvider>
      <BrowserRouter>
        <Routes>
          {/* Standalone light "compte rendu" report — renders OUTSIDE the app
              shell (no sidebar/topbar): it's a document about the product. */}
          <Route path="/compte-rendu" element={<CompteRenduScreen />} />

          {/* Sign-in — also outside the shell: you pick a space (club admin or
              sponsor) and the shell's nav + routes follow that role. */}
          <Route path="/connexion" element={<LoginScreen />} />

          <Route element={<AppShell />}>
            {/* Accueil — quick-access grid of the club's modules. */}
            <Route index element={<AccueilScreen />} />

            {navLeaves
              .filter((leaf) => !CUSTOM_ROUTES.has(leaf.path))
              .map((leaf) =>
                leaf.path === "/" ? (
                  <Route
                    key={leaf.path}
                    index
                    element={<Placeholder title={leaf.label} icon={leaf.icon} />}
                  />
                ) : (
                  <Route
                    key={leaf.path}
                    path={leaf.path.slice(1)}
                    element={<Placeholder title={leaf.label} icon={leaf.icon} />}
                  />
                ),
              )}

            {/* Design System — in-app gallery of every reused component. */}
            <Route path="design-system" element={<DesignSystemScreen />} />

            {/* Ressources humaines — Éducateurs (coaches roster). */}
            <Route
              path="ressources-humaines/educateurs"
              element={<EducateursScreen />}
            />

            {/* Planification — month calendar of séances / matchs / réunions.
                A séance card opens its session page (header + procédé tabs). */}
            <Route path="planification" element={<PlanificationScreen />} />
            <Route
              path="planification/seance/:id"
              element={<Navigate to="procede" replace />}
            />
            <Route
              path="planification/seance/:id/:tab"
              element={<SeanceScreen />}
            />
            {/* A match card opens its match page — tabs differ before vs after
                the game (convocation/consignes vs debrief). */}
            <Route
              path="planification/match/:id"
              element={<MatchScreen />}
            />
            <Route
              path="planification/match/:id/:tab"
              element={<MatchScreen />}
            />

            {/* Résultats — list of played matches with their final scores,
                catégorie and poule. A result card is clickable (hover) but
                doesn't route anywhere yet. */}
            <Route path="resultats" element={<ResultatsScreen />} />

            {/* Messagerie — two-pane chat: conversation list + chat, three
                conversation types (groupes / sessions / matchs) via tabs. */}
            <Route path="messagerie" element={<MessagerieScreen />} />

            {/* Structuration — Objectifs techniques: reviewable objectives table. */}
            <Route
              path="structuration/objectifs-techniques"
              element={<ObjectifsScreen />}
            />

            {/* Pôle Technique — Catégories: the grid, and each category's
                detail page (welcome header + six route-linked tabs). */}
            <Route
              path="pole-technique/categories"
              element={<CategoriesScreen />}
            />
            <Route
              path="pole-technique/categories/:slug"
              element={<Navigate to="resultats" replace />}
            />
            <Route
              path="pole-technique/categories/:slug/:tab"
              element={<CategoryDetailScreen />}
            />

            {/* Sponsoring — join flow: empty state → onboarding → offer form
                → offers list. The module home forwards to the list once the
                club has offers. */}
            <Route path="sponsoring" element={<SponsoringHome />} />
            <Route path="sponsoring/demarrage" element={<DemarrageScreen />} />
            {/* Packs tab — the offers list (kept at /offres so existing links
                hold; the tab bar labels it "Packs"). */}
            <Route path="sponsoring/offres" element={<OffresScreen />} />
            {/* Campagnes tab — every partenaire's live + archived campaigns. */}
            <Route
              path="sponsoring/campagnes"
              element={<SponsoringCampagnesScreen />}
            />
            {/* Demandes sur mesure — the club's inbox of custom sponsoring
                requests sent by sponsors; accept (with a price) or refuse. */}
            <Route
              path="sponsoring/demandes-sur-mesure"
              element={<OffreRequestsScreen />}
            />
            <Route
              path="sponsoring/demandes-sur-mesure/:id/modifier"
              element={<RequestEditScreen />}
            />
            <Route
              path="sponsoring/emplacements"
              element={<EmplacementsScreen />}
            />
            <Route
              path="sponsoring/offres/nouvelle"
              element={<OffreFormScreen />}
            />
            {/* Demandes de campagne — the club's inbox of sponsor campaign
                requests: review the visuals, then approve or refuse. */}
            <Route
              path="sponsoring/demandes"
              element={<DemandesCampagneScreen />}
            />
            <Route
              path="sponsoring/partenaires"
              element={<PartenairesScreen />}
            />
            {/* A partenaire's accueil (campagne en cours + archives), and one
                campaign shown across the six ad surfaces. */}
            <Route
              path="sponsoring/partenaires/:id"
              element={<PartenaireAccueilScreen />}
            />
            <Route
              path="sponsoring/partenaires/:id/campagnes/:campaignId"
              element={<CampagneScreen />}
            />

            {/* Sponsor space — the company's own side of the product. Same
                shell, its own two-item nav. Both pages are empty for now. */}
            <Route
              path="sponsor/partenaires"
              element={<PartenairesListScreen />}
            />
            {/* Campagnes — list → wizard (club, période, objectif) → the
                visuals editor, which is also where an existing campaign
                opens. */}
            <Route path="sponsor/campagnes" element={<CampagnesScreen />} />
            {/* Mes demandes — the sponsor's custom-offer requests + their
                status (accepted / refused / counter-proposal). */}
            <Route path="sponsor/demandes" element={<DemandesSurMesureScreen />} />
            <Route
              path="sponsor/campagnes/nouvelle"
              element={<NouvelleCampagneScreen />}
            />
            <Route
              path="sponsor/campagnes/nouvelle/visuels"
              element={<CampagneVisuelsScreen />}
            />
            <Route
              path="sponsor/campagnes/:id"
              element={<CampagneVisuelsScreen />}
            />
            {/* "Trouver un partenaire" — browse clubs, open a club's offers. */}
            <Route path="sponsor/explorer" element={<ExplorerScreen />} />
            <Route
              path="sponsor/explorer/:slug"
              element={<ClubOffresScreen />}
            />
            {/* Custom-offer request — the sponsor composes its own package. */}
            <Route
              path="sponsor/explorer/:slug/sur-mesure"
              element={<CustomOfferScreen />}
            />

            {/* Finance — Transactions is the first real tool of the module. */}
            <Route path="finance/transactions" element={<TransactionsScreen />} />
            <Route path="finance/demande" element={<DemandeTransactionScreen />} />
            <Route
              path="finance/configuration-transaction"
              element={<TransactionConfigScreen />}
            />

            {/* Budget — real feature. /budget is the season picker; the
                active season opens the config ("Nouvelle saison"). */}
            <Route path="budget" element={<SeasonSelectScreen />} />
            <Route path="budget/nouvelle" element={<BudgetConfigScreen />} />
            <Route path="budget/dashboard" element={<BudgetDashboardScreen />} />
            <Route path="budget/mensuel" element={<MonthlyPlanningScreen />} />
            <Route path="budget/mensuel/plan" element={<MonthPlanScreen />} />

            {/* Budget 2 — Outil Budget: three levels (saisons → onglets →
                éditeur de brouillon). Independent of the legacy Budget above. */}
            <Route path="budget2" element={<Budget2SeasonsScreen />} />
            <Route path="budget2/comparaison" element={<Budget2CompareScreen />} />
            <Route
              path="budget2/:seasonId"
              element={<Navigate to="brouillon" replace />}
            />
            <Route path="budget2/:seasonId/:tab" element={<Budget2SeasonScreen />} />
            <Route
              path="budget2/:seasonId/brouillon/:draftId"
              element={<Budget2EditorScreen />}
            />

            {/* Documents — list is real; the per-document editor is a
                clickable placeholder until the editor is built. */}
            <Route path="documents" element={<DocumentsScreen />} />
            <Route
              path="documents/:id"
              element={<Placeholder title="Éditeur de document" icon={FileText} />}
            />

            <Route
              path="*"
              element={
                <Placeholder title="Page introuvable" icon={FileQuestion} />
              }
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </DataProvider>
  )
}
