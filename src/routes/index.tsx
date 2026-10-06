import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/")({
  component: HomePage,
})

function HomePage() {
  return (
    <main className="mx-auto flex max-w-5xl flex-col items-start px-6 py-24 sm:py-32">
      <h1 className="text-4xl font-bold">Welcome</h1>
    </main>
  )
}
