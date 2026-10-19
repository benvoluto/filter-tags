import {
  BuildingsIcon,
  CalendarBlankIcon,
  CircleHalfIcon,
  DatabaseIcon,
  FlowArrowIcon,
  GaugeIcon,
  HashIcon,
  type Icon,
  LightningIcon,
  MagnifyingGlassIcon,
  StackIcon,
  TimerIcon,
  UserIcon,
  WarningIcon,
} from "@phosphor-icons/react"

import type { ColumnKey } from "./data"

/**
 * One Phosphor icon per filterable column (the staff app's icon set; names carry the `Icon` suffix
 * its eslint rule requires). Used inside the filter editor only — staff filter chips carry no
 * column icon.
 */
export const COLUMN_ICONS: Record<ColumnKey, Icon> = {
  runId: HashIcon,
  flow: FlowArrowIcon,
  customer: BuildingsIcon,
  status: CircleHalfIcon,
  trigger: LightningIcon,
  ehr: DatabaseIcon,
  started: CalendarBlankIcon,
  duration: TimerIcon,
  records: StackIcon,
  automationRate: GaugeIcon,
  errors: WarningIcon,
  owner: UserIcon,
}

export const SEARCH_ICON: Icon = MagnifyingGlassIcon
