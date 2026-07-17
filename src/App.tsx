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
import { ObjectifsScreen } from "@/features/objectifs/ObjectifsScreen"
import { CategoriesScreen } from "@/features/pole-technique/CategoriesScreen"
import { CategoryDetailScreen } from "@/features/pole-technique/CategoryDetailScreen"
import { EducateursScreen } from "@/features/educateurs/EducateursScreen"
import { SponsoringHome } from "@/features/sponsoring/SponsoringHome"
import { DemarrageScreen } from "@/features/sponsoring/DemarrageScreen"
import { OffreFormScreen } from "@/features/sponsoring/OffreFormScreen"
import { OffresScreen } from "@/features/sponsoring/OffresScreen"
import { EmplacementsScreen } from "@/features/sponsoring/EmplacementsScreen"
import { PartenairesScreen } from "@/features/sponsoring/PartenairesScreen"
import { PartenaireAccueilScreen } from "@/features/sponsoring/PartenaireAccueilScreen"
import { CampagneScreen } from "@/features/sponsoring/CampagneScreen"
import { DesignSystemScreen } from "@/features/design-system/DesignSystemScreen"
import { LoginScreen } from "@/features/auth/LoginScreen"
import { PartenairesListScreen } from "@/features/sponsor/PartenairesListScreen"
import { CampagnesScreen } from "@/features/sponsor/CampagnesScreen"
import { NouvelleCampagneScreen } from "@/features/sponsor/NouvelleCampagneScreen"
import { CampagneVisuelsScreen } from "@/features/sponsor/CampagneVisuelsScreen"
import { ExplorerScreen } from "@/features/sponsor/ExplorerScreen"
import { ClubOffresScreen } from "@/features/sponsor/ClubOffresScreen"

/** Routes that have a real screen (so they skip the generic Placeholder). */
const CUSTOM_ROUTES = new Set([
  "/ressources-humaines/educateurs",
  "/planification",
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

            {/* Planification — month calendar of séances / matchs / réunions. */}
            <Route path="planification" element={<PlanificationScreen />} />

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
            <Route path="sponsoring/offres" element={<OffresScreen />} />
            <Route
              path="sponsoring/emplacements"
              element={<EmplacementsScreen />}
            />
            <Route
              path="sponsoring/offres/nouvelle"
              element={<OffreFormScreen />}
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
