import type { ReactNode, KeyboardEvent } from "react"
import type { LucideIcon } from "lucide-react"
import { Inbox } from "lucide-react"

import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
import { EmptyState } from "@/components/kit/EmptyState"

export type Column<T> = {
  /** stable key for the column */
  id: string
  header: ReactNode
  /** how to render the cell for a given row */
  cell: (row: T) => ReactNode
  align?: "left" | "right" | "center"
  /** fixed width, e.g. "64px" or "20%" */
  width?: string
  className?: string
  headerClassName?: string
}

export type DataTableProps<T> = {
  columns: Column<T>[]
  data: T[]
  /** stable React key per row */
  getRowId: (row: T) => string
  loading?: boolean
  /** number of shimmer rows shown while loading */
  skeletonRows?: number
  onRowClick?: (row: T) => void
  isRowActive?: (row: T) => boolean
  /** empty-state customisation (shown when not loading and data is empty) */
  empty?: {
    icon?: LucideIcon
    title?: string
    description?: ReactNode
    action?: ReactNode
  }
  className?: string
}

const alignClass = {
  left: "text-left",
  right: "text-right",
  center: "text-center",
} as const

/**
 * Generic, typed data table with loading (shimmer rows) and empty states
 * built in (design-system §8 event-list). Pass `columns` + `data`; rows can
 * be clickable and/or marked active. Keeps markup semantic (<table>) and
 * keyboard-accessible when interactive.
 */
export function DataTable<T>({
  columns,
  data,
  getRowId,
  loading = false,
  skeletonRows = 5,
  onRowClick,
  isRowActive,
  empty,
  className,
}: DataTableProps<T>) {
  const interactive = Boolean(onRowClick)
  const showEmpty = !loading && data.length === 0

  const handleKeyDown = (row: T) => (event: KeyboardEvent<HTMLTableRowElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault()
      onRowClick?.(row)
    }
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-border bg-surface",
        className,
      )}
    >
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-border bg-surface-muted">
              {columns.map((col) => (
                <th
                  key={col.id}
                  scope="col"
                  style={col.width ? { width: col.width } : undefined}
                  className={cn(
                    "px-3.5 py-2.5 font-ui text-[0.7rem] font-bold tracking-[0.08em] whitespace-nowrap text-ink-disabled uppercase",
                    alignClass[col.align ?? "left"],
                    col.headerClassName,
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: skeletonRows }).map((_, r) => (
                  <tr
                    key={`skeleton-${r}`}
                    className="border-b border-border last:border-0"
                  >
                    {columns.map((col) => (
                      <td
                        key={col.id}
                        className={cn("px-3.5 py-3", alignClass[col.align ?? "left"])}
                      >
                        <Skeleton className="h-4 w-[60%] max-w-40" />
                      </td>
                    ))}
                  </tr>
                ))
              : data.map((row) => {
                  const active = isRowActive?.(row) ?? false
                  return (
                    <tr
                      key={getRowId(row)}
                      data-active={active || undefined}
                      onClick={onRowClick ? () => onRowClick(row) : undefined}
                      onKeyDown={interactive ? handleKeyDown(row) : undefined}
                      tabIndex={interactive ? 0 : undefined}
                      role={interactive ? "button" : undefined}
                      className={cn(
                        "border-b border-border transition-colors outline-none last:border-0",
                        interactive &&
                          "cursor-pointer hover:bg-accent focus-visible:bg-accent",
                        active && "bg-brand/5",
                      )}
                    >
                      {columns.map((col) => (
                        <td
                          key={col.id}
                          className={cn(
                            "px-3.5 py-3 font-body text-sm text-ink-subtle",
                            alignClass[col.align ?? "left"],
                            col.className,
                          )}
                        >
                          {col.cell(row)}
                        </td>
                      ))}
                    </tr>
                  )
                })}
          </tbody>
        </table>
      </div>

      {showEmpty ? (
        <EmptyState
          icon={empty?.icon ?? Inbox}
          title={empty?.title ?? "Aucune donnée"}
          description={
            empty?.description ?? "Rien à afficher pour le moment."
          }
          action={empty?.action}
        />
      ) : null}
    </div>
  )
}
