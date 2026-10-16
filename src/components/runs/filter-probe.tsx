"use client"

import * as React from "react"

import { ROWS } from "@/lib/data"
import { matchFilters, matchSearch, type Filter, type MatchMode } from "@/lib/filters"

/**
 * Answers "if this filter were added, would any rows remain?", given the other active filters
 * (minus the one being edited), the match mode, and the search text. Used to flag criteria that
 * would return zero rows.
 */
export type FilterProbe = (candidate: Omit<Filter, "id">, excludeFilterId?: string) => boolean

const FilterProbeContext = React.createContext<FilterProbe | null>(null)

export function FilterProbeProvider({
  filters,
  matchMode,
  query,
  children,
}: {
  filters: Filter[]
  matchMode: MatchMode
  query: string
  children: React.ReactNode
}) {
  const probe = React.useCallback<FilterProbe>(
    (candidate, excludeFilterId) => {
      const others = filters.filter((f) => f.id !== excludeFilterId)
      const all = [...others, candidate]
      return ROWS.some((row) => matchSearch(row, query) && matchFilters(row, all, matchMode))
    },
    [filters, matchMode, query]
  )
  return <FilterProbeContext.Provider value={probe}>{children}</FilterProbeContext.Provider>
}

export function useFilterProbe() {
  return React.useContext(FilterProbeContext)
}
