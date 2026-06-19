import { Outlet, useLocation } from "react-router-dom"

import { navLeaves } from "@/lib/navigation"
import { AppSidebar } from "@/components/AppSidebar"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"

/**
 * Reads the sidebar's collapsed/expanded state from the cookie that
 * SidebarProvider writes on every toggle. In an SSR app the server would
 * inject this; in our SPA we read it on mount so the state persists across
 * refreshes.
 */
function readSidebarDefaultOpen(): boolean {
  if (typeof document === "undefined") return true
  const match = document.cookie.match(/(?:^|;\s*)sidebar_state=(true|false)/)
  return match ? match[1] === "true" : true
}

function useCurrentTitle(): string {
  const { pathname } = useLocation()
  const leaf =
    navLeaves.find((l) =>
      l.path === "/" ? pathname === "/" : pathname.startsWith(l.path),
    ) ?? null
  return leaf?.label ?? "Page introuvable"
}

export function AppShell() {
  const title = useCurrentTitle()

  return (
    <SidebarProvider defaultOpen={readSidebarDefaultOpen()}>
      <AppSidebar />
      <SidebarInset>
        {/* App top bar — deep surface, fixed height, matches the design system. */}
        <header className="sticky top-0 z-10 flex h-12 shrink-0 items-center gap-2 border-b border-border bg-surface-deep px-4">
          <SidebarTrigger className="text-ink-muted hover:text-ink" />
          <Separator
            orientation="vertical"
            className="mr-1 !h-5 bg-border"
          />
          <h1 className="truncate font-ui text-sm font-semibold tracking-wide text-ink">
            {title}
          </h1>
        </header>

        {/* Scrollable main content area. */}
        <div className="flex-1 overflow-auto px-6 py-6 md:px-8">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
