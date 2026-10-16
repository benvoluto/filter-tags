import {
  TriangleAlertIcon,
  Building2Icon,
  CalendarIcon,
  CircleDotIcon,
  DatabaseIcon,
  GaugeIcon,
  HashIcon,
  LayersIcon,
  SearchIcon,
  TimerIcon,
  UserRoundIcon,
  WorkflowIcon,
  ZapIcon,
  type LucideIcon,
} from "lucide-react"

import type { ColumnKey } from "./data"

/** One icon per filterable column, used by filter chips and the column picker. */
export const COLUMN_ICONS: Record<ColumnKey, LucideIcon> = {
  runId: HashIcon,
  flow: WorkflowIcon,
  customer: Building2Icon,
  status: CircleDotIcon,
  trigger: ZapIcon,
  ehr: DatabaseIcon,
  started: CalendarIcon,
  duration: TimerIcon,
  records: LayersIcon,
  automationRate: GaugeIcon,
  errors: TriangleAlertIcon,
  owner: UserRoundIcon,
}

export const SEARCH_ICON: LucideIcon = SearchIcon
