import { Outlet, useLocation, useSearchParams } from "react-router-dom"
import { Activity, Bell, ChevronDown, MessageSquare, User } from "lucide-react"

import { navLeaves } from "@/lib/navigation"
import { AppSidebar } from "@/components/AppSidebar"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

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

/**
 * A single circular icon button in the top-bar action cluster. Purely visual
 * for the prototype — no routing on click. `active` gives the pressed/selected
 * look (a brighter ring + white glyph) used on the account chip.
 */
function IconAction({
  icon: Icon,
  label,
  active,
}: {
  icon: typeof Bell
  label: string
  active?: boolean
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex size-9 shrink-0 items-center justify-center rounded-full border transition-colors",
        active
          ? "border-border-strong bg-surface text-ink"
          : "border-transparent bg-surface text-ink-muted hover:border-border-strong hover:text-ink",
      )}
    >
      <Icon size={17} />
    </button>
  )
}

/** Right-side cluster: quick-glance icons + the account chip. Non-navigating. */
function HeaderActions() {
  return (
    <div className="ml-auto flex items-center gap-2">
      <IconAction icon={Activity} label="Activité" />
      <IconAction icon={MessageSquare} label="Messages" />
      <IconAction icon={Bell} label="Notifications" />
      <button
        type="button"
        aria-label="Mon compte"
        title="Mon compte"
        className="inline-flex items-center gap-1 rounded-full border border-border-strong bg-surface py-0.5 pr-1.5 pl-0.5 text-ink transition-colors hover:border-border-strong"
      >
        <span className="inline-flex size-8 items-center justify-center rounded-full bg-surface-nested text-ink">
          <User size={17} />
        </span>
        <ChevronDown size={14} className="text-ink-muted" />
      </button>
    </div>
  )
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
  const [params] = useSearchParams()

  // Embed mode (`?embed=1`) — strips the sidebar + top bar so a single screen
  // can be dropped into an iframe (used by the "Compte rendu" report page).
  // Everything else about the screen (data, dark theme, interactions) is intact.
  if (params.get("embed") === "1") {
    return (
      <div className="min-h-screen overflow-auto bg-background px-5 py-5 md:px-6">
        <Outlet />
      </div>
    )
  }

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

          <HeaderActions />
        </header>

        {/* Scrollable main content area. */}
        <div className="flex-1 overflow-auto px-6 py-6 md:px-8">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
