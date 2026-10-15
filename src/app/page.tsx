import { RunsTable } from "@/components/runs/runs-table"

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col gap-6 px-4 py-6 sm:px-6 sm:py-10">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Flow runs</h1>
      </header>
      <RunsTable />
    </main>
  )
}
