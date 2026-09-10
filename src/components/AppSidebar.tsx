import { Logo } from "@/components/kit/Logo"
import { Link, useLocation } from "react-router-dom"
import { ChevronRight } from "lucide-react"

import {
  NAV_TREE,
  SPACE_SUBTITLE,
  HOME_PATH,
  normalizeParentPath,
  parentNavTreeFor,
  type NavGroup,
  type NavLeaf,
} from "@/lib/navigation"
import { useData } from "@/data/useData"
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
  // In the parent space the child's id sits in the URL; compare the section
  // paths so "Séances" reads as active for one child as for the whole family.
  const norm = (p: string) =>
    p.startsWith("/parent") ? normalizeParentPath(p) : p

  return (path: string, exact = false) => {
    const current = norm(pathname)
    const target = norm(path)
    return path === "/" || exact
      ? current === target
      : current === target || current.startsWith(target + "/")
  }
}

/**
 * Brand — the iSmart Club wordmark with the space's name under it. A collapsed
 * (icon) sidebar has no room for the words, so it keeps the figure alone.
 */
function BrandMark({ to, subtitle }: { to: string; subtitle: string }) {
  return (
    <Link
      to={to}
      className="flex min-w-0 items-center outline-hidden"
      aria-label="iSmart Club — Accueil"
    >
      <Logo
        variant="mark"
        alt=""
        className="hidden h-8 group-data-[collapsible=icon]:block"
      />
      <span className="flex min-w-0 flex-col gap-1 group-data-[collapsible=icon]:hidden">
        <Logo alt="" className="h-7" />
        <span className="truncate font-body text-[0.68rem] text-ink-muted">
          {subtitle}
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
  const { pathname } = useLocation()
  const { session, parentEnfants } = useData()

  const enfantId =
    pathname.match(/^\/parent\/([^/]+)/)?.[1] ?? parentEnfants[0]?.id ?? ""
  const parentTree = parentNavTreeFor(enfantId)

  // The sponsor and parent spaces reuse this exact shell — only the tree
  // (and the wordmark's subtitle) changes with the role.
  const role = session?.role ?? "admin"
  // The parent space carries the child in the URL, so its nav is built for the
  // child currently opened (falling back to the first one from /parent).
  const tree = role === "parent" ? parentTree : NAV_TREE[role]
  const home = HOME_PATH[role]
  const subtitle = SPACE_SUBTITLE[role]

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex h-10 items-center justify-between gap-2 px-1">
          <BrandMark to={home} subtitle={subtitle} />
          {/* Collapse toggle — hidden in icon mode (the rail + main-bar trigger re-open it). */}
          <SidebarTrigger className="shrink-0 text-ink-muted hover:text-ink group-data-[collapsible=icon]:hidden" />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {tree.map((node) =>
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
                  isActive={isActive(node.path, node.exact)}
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
