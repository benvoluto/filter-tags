export type ColumnType = "text" | "category" | "number" | "percent" | "duration" | "date"

export type RunRow = {
  runId: string
  flow: string
  customer: string
  status: string
  trigger: string
  ehr: string
  started: string // ISO
  duration: number | null // seconds
  records: number
  automationRate: number | null // 0-100
  errors: number
  owner: string | null
}

export type ColumnKey = keyof RunRow

export type ColumnDef = {
  key: ColumnKey
  label: string
  type: ColumnType
  align?: "left" | "right"
  minWidth?: number
}

export const COLUMNS: ColumnDef[] = [
  { key: "runId", label: "Run ID", type: "text", minWidth: 110 },
  { key: "flow", label: "Flow", type: "category", minWidth: 200 },
  { key: "customer", label: "Customer", type: "category", minWidth: 190 },
  { key: "status", label: "Status", type: "category", minWidth: 130 },
  { key: "trigger", label: "Trigger", type: "category", minWidth: 130 },
  { key: "ehr", label: "EHR", type: "category", minWidth: 140 },
  { key: "started", label: "Started", type: "date", minWidth: 160 },
  { key: "duration", label: "Duration", type: "duration", align: "right", minWidth: 110 },
  { key: "records", label: "Records", type: "number", align: "right", minWidth: 110 },
  { key: "automationRate", label: "Automation", type: "percent", align: "right", minWidth: 130 },
  { key: "errors", label: "Errors", type: "number", align: "right", minWidth: 100 },
  { key: "owner", label: "Owner", type: "text", minWidth: 150 },
]

export const COLUMN_MAP = Object.fromEntries(COLUMNS.map((c) => [c.key, c])) as Record<
  ColumnKey,
  ColumnDef
>

const FLOWS = [
  "Patient Intake",
  "Prior Authorization",
  "Referral Processing",
  "Eligibility Verification",
  "Appointment Reminders",
  "Chart Prep",
  "Insurance Card Capture",
  "Care Gap Outreach",
  "Fax Triage",
  "Post-Visit Follow-up",
]
const CUSTOMERS = [
  "Riverbend Health",
  "Summit Valley Medical",
  "Lakeshore Clinics",
  "Cedar Ridge Hospital",
  "Bayview Physicians Group",
  "Northwind Orthopedics",
  "Mesa Family Practice",
  "Harborlight Pediatrics",
]
const TRIGGERS = ["Scheduled", "EHR Event", "Patient Action", "Manual", "API"]
const EHRS = ["Epic", "Cerner", "athenahealth", "eClinicalWorks", "NextGen"]
const OWNERS = ["Maya Ortiz", "Jordan Lee", "Priya Shah", "Sam Whitfield", "Alex Chen", "Dana Brooks"]

// Deterministic PRNG so server and client render identical data.
function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function generateRows(count: number): RunRow[] {
  const rand = mulberry32(20261015)
  const pick = <T,>(arr: T[]) => arr[Math.floor(rand() * arr.length)]
  const base = Date.UTC(2026, 9, 14, 18, 0, 0)
  const rows: RunRow[] = []
  for (let i = 0; i < count; i++) {
    const r = rand()
    const status =
      r < 0.58 ? "Completed" : r < 0.72 ? "Failed" : r < 0.84 ? "Needs Review" : r < 0.94 ? "Running" : "Cancelled"
    const records = Math.max(1, Math.round(Math.pow(rand(), 2) * 2400))
    const running = status === "Running"
    const errors =
      status === "Failed"
        ? 2 + Math.floor(rand() * 13)
        : status === "Needs Review"
          ? 1 + Math.floor(rand() * 4)
          : rand() < 0.15
            ? 1
            : 0
    rows.push({
      runId: `RUN-${48120 + i * 7 + Math.floor(rand() * 6)}`,
      flow: pick(FLOWS),
      customer: pick(CUSTOMERS),
      status,
      trigger: pick(TRIGGERS),
      ehr: pick(EHRS),
      started: new Date(base - Math.floor(rand() * 9 * 24 * 3600 * 1000)).toISOString(),
      duration: running ? null : 8 + Math.floor(Math.pow(rand(), 1.6) * 900),
      records,
      automationRate:
        running || status === "Cancelled"
          ? null
          : status === "Failed"
            ? 40 + Math.floor(rand() * 35)
            : 78 + Math.floor(rand() * 22),
      errors,
      owner: rand() < 0.2 ? null : pick(OWNERS),
    })
  }
  return rows
}

export const ROWS: RunRow[] = generateRows(50)

export function isEmptyValue(v: unknown) {
  return v === null || v === undefined || v === ""
}

export function formatDuration(sec: number) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return m ? `${m}m ${s.toString().padStart(2, "0")}s` : `${s}s`
}

const dateFmt = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "UTC",
})
const dayFmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })

export function formatCell(col: ColumnDef, value: unknown): string {
  if (isEmptyValue(value)) return "—"
  switch (col.type) {
    case "duration":
      return formatDuration(value as number)
    case "percent":
      return `${value}%`
    case "number":
      return (value as number).toLocaleString("en-US")
    case "date":
      return dateFmt.format(new Date(value as string))
    default:
      return String(value)
  }
}

/** Format a filter criterion value (stored as a string) for display. */
export function formatCriterion(col: ColumnDef, value: string): string {
  if (value === "") return "(empty)"
  switch (col.type) {
    case "duration":
      return Number.isNaN(Number(value)) ? value : formatDuration(Number(value))
    case "percent":
      return `${value}%`
    case "number":
      return Number.isNaN(Number(value)) ? value : Number(value).toLocaleString("en-US")
    case "date": {
      const d = new Date(`${value.slice(0, 10)}T00:00:00Z`)
      return Number.isNaN(d.getTime()) ? value : dayFmt.format(d)
    }
    default:
      return value
  }
}

/** The comparable string form of a cell value (dates collapse to their day). */
export function criterionKey(col: ColumnDef, value: unknown): string {
  if (isEmptyValue(value)) return ""
  if (col.type === "date") return String(value).slice(0, 10)
  return String(value)
}

/** Distinct values in a column, used to populate criteria comboboxes. */
export function distinctValues(key: ColumnKey): string[] {
  const col = COLUMN_MAP[key]
  const set = new Set<string>()
  for (const row of ROWS) {
    const k = criterionKey(col, row[key])
    if (k !== "") set.add(k)
  }
  const values = [...set]
  if (col.type === "text" || col.type === "category") return values.sort((a, b) => a.localeCompare(b))
  if (col.type === "date") return values.sort().reverse()
  return values.sort((a, b) => Number(a) - Number(b))
}
