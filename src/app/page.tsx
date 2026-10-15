import { RunsTable } from "@/components/runs/runs-table"

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col gap-6 px-4 py-6 sm:px-6 sm:py-10">
      <header className="flex flex-col gap-1">
        <p className="text-xs font-semibold tracking-widest text-primary uppercase">Automation · Flows</p>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Flow runs</h1>
        <p className="text-sm text-muted-foreground">
          Recent executions of patient-access Flows across health-system customers (sample data).
        </p>
      </header>
      <RunsTable />
    </main>
  )
}
