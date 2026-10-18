import type SvgIcon from "@mui/material/SvgIcon"
import AccountTreeOutlined from "@mui/icons-material/AccountTreeOutlined"
import BoltOutlined from "@mui/icons-material/BoltOutlined"
import BusinessOutlined from "@mui/icons-material/BusinessOutlined"
import CalendarTodayOutlined from "@mui/icons-material/CalendarTodayOutlined"
import LayersOutlined from "@mui/icons-material/LayersOutlined"
import Numbers from "@mui/icons-material/Numbers"
import PersonOutlineOutlined from "@mui/icons-material/PersonOutlineOutlined"
import RadioButtonCheckedOutlined from "@mui/icons-material/RadioButtonCheckedOutlined"
import Search from "@mui/icons-material/Search"
import SpeedOutlined from "@mui/icons-material/SpeedOutlined"
import StorageOutlined from "@mui/icons-material/StorageOutlined"
import TimerOutlined from "@mui/icons-material/TimerOutlined"
import WarningAmberOutlined from "@mui/icons-material/WarningAmberOutlined"

import type { ColumnKey } from "./data"

type SvgIconComponent = typeof SvgIcon

/** One Material icon per filterable column, used by filter chips, partial filters, and the type picker. */
export const COLUMN_ICONS: Record<ColumnKey, SvgIconComponent> = {
  runId: Numbers,
  flow: AccountTreeOutlined,
  customer: BusinessOutlined,
  status: RadioButtonCheckedOutlined,
  trigger: BoltOutlined,
  ehr: StorageOutlined,
  started: CalendarTodayOutlined,
  duration: TimerOutlined,
  records: LayersOutlined,
  automationRate: SpeedOutlined,
  errors: WarningAmberOutlined,
  owner: PersonOutlineOutlined,
}

export const SEARCH_ICON: SvgIconComponent = Search
