import { BrowserRouter, Route, Routes } from "react-router-dom"
import { FileQuestion } from "lucide-react"

import { navLeaves } from "@/lib/navigation"
import { AppShell } from "@/shells/AppShell"
import { Placeholder } from "@/components/kit/Placeholder"

/**
 * Every screen renders inside <AppShell/> (the collapsible-sidebar layout).
 * Routes are generated from the same nav tree the sidebar uses, so a nav
 * entry and its URL can never drift apart. Real screens replace the
 * <Placeholder/> elements as they get built.
 */
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          {navLeaves.map((leaf) =>
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
  )
}
