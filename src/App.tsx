import { BrowserRouter, Route, Routes } from "react-router-dom"
import { FileQuestion } from "lucide-react"

import { navLeaves } from "@/lib/navigation"
import { DataProvider } from "@/data/DataProvider"
import { AppShell } from "@/shells/AppShell"
import { Placeholder } from "@/components/kit/Placeholder"
import { BudgetConfigScreen } from "@/features/budget/BudgetConfigScreen"
import { BudgetDashboardScreen } from "@/features/budget/BudgetDashboardScreen"

/** Routes that have a real screen (so they skip the generic Placeholder). */
const CUSTOM_ROUTES = new Set(["/budget"])

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

            {/* Budget — real feature */}
            <Route path="budget" element={<BudgetConfigScreen />} />
            <Route path="budget/dashboard" element={<BudgetDashboardScreen />} />

            <Route
              path="*"
              element={
                <Placeholder
                  title="Page introuvable"
                  icon={FileQuestion}
                  eyebrow="Erreur 404"
                />
              }
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </DataProvider>
  )
}
