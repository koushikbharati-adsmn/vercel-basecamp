import { useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: HomePage,
})

const stack = ['React', 'TypeScript', 'Tailwind CSS', 'TanStack Router', 'TanStack Query']

function HomePage() {
  const { data } = useQuery({
    queryKey: ['stack'],
    queryFn: async () => stack,
    staleTime: Number.POSITIVE_INFINITY,
  })

  return (
    <main className="mx-auto flex max-w-5xl flex-col items-start px-6 py-24 sm:py-32">
      <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-sm text-cyan-300">
        Ready to build
      </span>
      <h1 className="mt-8 max-w-3xl text-5xl font-bold tracking-tight sm:text-7xl">
        Your modern React stack is configured.
      </h1>
      <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
        File-based routing, server-state management, and utility-first styling are wired up and
        ready for your application.
      </p>
      <ul className="mt-10 flex flex-wrap gap-3">
        {data?.map((item) => (
          <li key={item} className="rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm">
            {item}
          </li>
        ))}
      </ul>
    </main>
  )
}
