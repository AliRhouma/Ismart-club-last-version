import { Link, useLocation } from "react-router-dom"
import { ChevronRight } from "lucide-react"

import { navTree, type NavGroup, type NavLeaf } from "@/lib/navigation"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"

/** "/" matches only the home route; every other route also matches its children. */
function useIsActive() {
  const { pathname } = useLocation()
  return (path: string) =>
    path === "/"
      ? pathname === "/"
      : pathname === path || pathname.startsWith(path + "/")
}

/** Brand mark — green monogram + wordmark. Wordmark hides in icon mode. */
function BrandMark() {
  return (
    <Link
      to="/"
      className="flex min-w-0 items-center gap-2.5 outline-hidden"
      aria-label="iSmart Club — Accueil"
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-brand font-display text-lg font-bold leading-none text-ink-inverted shadow-glow">
        iS
      </span>
      <span className="flex min-w-0 flex-col group-data-[collapsible=icon]:hidden">
        <span className="truncate font-ui text-sm font-semibold tracking-normal text-ink">
          iSmart Club
        </span>
        <span className="truncate font-body text-[0.68rem] text-ink-muted">
          Plateforme club
        </span>
      </span>
    </Link>
  )
}

function NavLeafItem({
  leaf,
  isActive,
}: {
  leaf: NavLeaf
  isActive: boolean
}) {
  const Icon = leaf.icon
  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={isActive} tooltip={leaf.label}>
        <Link to={leaf.path} aria-current={isActive ? "page" : undefined}>
          <Icon />
          <span>{leaf.label}</span>
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

function NavGroupItem({
  group,
  isActive,
}: {
  group: NavGroup
  isActive: (path: string) => boolean
}) {
  const { state } = useSidebar()
  const Icon = group.icon
  const hasActiveChild = group.children.some((c) => isActive(c.path))

  return (
    <Collapsible
      asChild
      defaultOpen={hasActiveChild}
      className="group/collapsible"
    >
      <SidebarMenuItem>
        <CollapsibleTrigger asChild>
          {/* In icon mode the parent shows the active state when a child is active. */}
          <SidebarMenuButton
            tooltip={group.label}
            isActive={state === "collapsed" && hasActiveChild}
          >
            <Icon />
            <span>{group.label}</span>
            <ChevronRight className="ml-auto size-4 shrink-0 text-ink-muted transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
          </SidebarMenuButton>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <SidebarMenuSub>
            {group.children.map((child) => {
              const ChildIcon = child.icon
              const childActive = isActive(child.path)
              return (
                <SidebarMenuSubItem key={child.path}>
                  <SidebarMenuSubButton asChild isActive={childActive}>
                    <Link
                      to={child.path}
                      aria-current={childActive ? "page" : undefined}
                    >
                      <ChildIcon />
                      <span>{child.label}</span>
                    </Link>
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              )
            })}
          </SidebarMenuSub>
        </CollapsibleContent>
      </SidebarMenuItem>
    </Collapsible>
  )
}

export function AppSidebar() {
  const isActive = useIsActive()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex h-10 items-center justify-between gap-2 px-1">
          <BrandMark />
          {/* Collapse toggle — hidden in icon mode (the rail + main-bar trigger re-open it). */}
          <SidebarTrigger className="shrink-0 text-ink-muted hover:text-ink group-data-[collapsible=icon]:hidden" />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {navTree.map((node) =>
              node.type === "group" ? (
                <NavGroupItem
                  key={node.key}
                  group={node}
                  isActive={isActive}
                />
              ) : (
                <NavLeafItem
                  key={node.path}
                  leaf={node}
                  isActive={isActive(node.path)}
                />
              ),
            )}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <p className="px-2 font-body text-[0.68rem] text-ink-disabled group-data-[collapsible=icon]:hidden">
          Prototype · v0.1
        </p>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
