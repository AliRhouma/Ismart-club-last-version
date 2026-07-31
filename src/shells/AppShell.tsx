import { useEffect, useRef, useState } from "react"
import {
  Navigate,
  Outlet,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom"
import {
  Activity,
  Bell,
  ChevronDown,
  LogOut,
  MessageSquare,
  Settings,
  SlidersHorizontal,
  User,
} from "lucide-react"

import { navLeaves, sponsorNavLeaves, HOME_PATH } from "@/lib/navigation"
import { useData } from "@/data/useData"
import { AppSidebar } from "@/components/AppSidebar"
import { NotificationsMenu } from "@/components/NotificationsMenu"
import { ObjectifReviewModal } from "@/features/objectifs/ObjectifReviewModal"
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

/**
 * Account chip → dropdown menu. Opens a popover with account entries; the
 * "Configuration de transaction" item routes to the finance config screen.
 * Closes on outside click or Escape (same pattern as NotificationsMenu).
 */
function AccountMenu() {
  const navigate = useNavigate()
  const { session, signOut } = useData()
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)
  const isSponsor = session?.role === "sponsor"

  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false)
    }
    document.addEventListener("mousedown", onDown)
    document.addEventListener("keydown", onKey)
    return () => {
      document.removeEventListener("mousedown", onDown)
      document.removeEventListener("keydown", onKey)
    }
  }, [open])

  const go = (path: string) => {
    setOpen(false)
    navigate(path)
  }

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        aria-label="Mon compte"
        title="Mon compte"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "inline-flex items-center gap-1 rounded-full border bg-surface py-0.5 pr-1.5 pl-0.5 text-ink transition-colors",
          open ? "border-border-strong" : "border-border-strong",
        )}
      >
        <span className="inline-flex size-8 items-center justify-center rounded-full bg-surface-nested text-ink">
          <User size={17} />
        </span>
        <ChevronDown
          size={14}
          className={cn(
            "text-ink-muted transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-[260px] overflow-hidden rounded-xl border border-border bg-surface shadow-lg shadow-black/40">
          {/* Identity */}
          <div className="flex items-center gap-3 border-b border-border px-4 py-3.5">
            <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-surface-nested text-ink">
              <User size={18} />
            </span>
            <div className="min-w-0">
              <div className="truncate font-ui text-sm font-medium text-ink">
                {session?.name ?? "—"}
              </div>
              <div className="truncate font-body text-xs text-ink-muted">
                {session?.subtitle ?? ""}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="py-1.5">
            {/* Club-admin-only tool. */}
            {!isSponsor ? (
              <MenuItem
                icon={SlidersHorizontal}
                label="Configuration de transaction"
                onClick={() => go("/finance/configuration-transaction")}
              />
            ) : null}
            <MenuItem icon={User} label="Mon profil" onClick={() => setOpen(false)} />
            <MenuItem icon={Settings} label="Paramètres" onClick={() => setOpen(false)} />
          </div>

          <div className="border-t border-border py-1.5">
            <MenuItem
              icon={LogOut}
              label="Se déconnecter"
              danger
              onClick={() => {
                setOpen(false)
                signOut()
                navigate("/connexion")
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

/** A single row inside the account dropdown. */
function MenuItem({
  icon: Icon,
  label,
  onClick,
  danger,
}: {
  icon: typeof User
  label: string
  onClick: () => void
  danger?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 px-4 py-2.5 text-left font-body text-sm transition-colors hover:bg-surface-hover",
        danger ? "text-danger" : "text-ink-subtle hover:text-ink",
      )}
    >
      <Icon size={16} className="shrink-0" />
      <span className="truncate">{label}</span>
    </button>
  )
}

/** Right-side cluster: quick-glance icons + the account menu. */
function HeaderActions() {
  return (
    <div className="ml-auto flex items-center gap-2">
      <IconAction icon={Activity} label="Activité" />
      <IconAction icon={MessageSquare} label="Messages" />
      <NotificationsMenu />
      <AccountMenu />
    </div>
  )
}

function useCurrentTitle(isSponsor: boolean): string {
  const { pathname } = useLocation()
  const leaves = isSponsor ? sponsorNavLeaves : navLeaves
  const leaf =
    leaves.find((l) =>
      l.path === "/" ? pathname === "/" : pathname.startsWith(l.path),
    ) ?? null
  return leaf?.label ?? "Page introuvable"
}

export function AppShell() {
  const { session } = useData()
  const { pathname } = useLocation()
  const isSponsor = session?.role === "sponsor"
  const title = useCurrentTitle(isSponsor)
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

  // Signed out → the sign-in screen.
  if (!session) return <Navigate to="/connexion" replace />

  // The two spaces stay separate: a sponsor only ever sees /sponsor/*, and the
  // club admin never does. Note "/sponsor/" is distinct from the club's
  // "/sponsoring" module — the trailing slash keeps them from colliding.
  const inSponsorArea = pathname.startsWith("/sponsor/")
  if (isSponsor && !inSponsorArea) {
    return <Navigate to={HOME_PATH.sponsor} replace />
  }
  if (!isSponsor && inSponsorArea) {
    return <Navigate to={HOME_PATH.admin} replace />
  }

  return (
    <SidebarProvider defaultOpen={readSidebarDefaultOpen()}>
      <AppSidebar />
      {/* Viewport-height inset so the content area below is the real scroll
          container — otherwise `position: sticky` inside a screen has no
          scrollport to stick to and simply scrolls away. */}
      <SidebarInset className="h-svh overflow-hidden">
        {/* App top bar — deep surface, fixed height, matches the design system. */}
        <header className="z-10 flex h-12 shrink-0 items-center gap-2 border-b border-border bg-surface-deep px-4">
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
        <div className="min-h-0 flex-1 overflow-auto px-6 py-6 md:px-8">
          <Outlet />
        </div>
      </SidebarInset>

      {/* Objective review "fiche" — global so it opens from a notification on
          any page as well as from the objectives table. */}
      <ObjectifReviewModal />
    </SidebarProvider>
  )
}
