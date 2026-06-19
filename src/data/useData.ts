import { useContext } from "react"

import { DataContext } from "@/data/DataProvider"

/** Read + mutate the in-memory store. Must be used under <DataProvider>. */
export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) {
    throw new Error("useData must be used within a DataProvider.")
  }
  return ctx
}
