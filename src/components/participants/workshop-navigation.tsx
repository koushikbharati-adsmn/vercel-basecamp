import { Menu, X } from "lucide-react"
import { useEffect, useId, useRef, useState, type ReactNode } from "react"

export function WorkshopNavigation({
  children,
  inverse = false,
}: {
  children: ReactNode
  inverse?: boolean
}) {
  const [open, setOpen] = useState(false)
  const id = useId()
  const root = useRef<HTMLDivElement>(null)
  const toggle = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const dismiss = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false)
    }
    const escape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return
      setOpen(false)
      toggle.current?.focus()
    }
    document.addEventListener("pointerdown", dismiss)
    document.addEventListener("keydown", escape)
    return () => {
      document.removeEventListener("pointerdown", dismiss)
      document.removeEventListener("keydown", escape)
    }
  }, [open])

  return (
    <div ref={root} className="relative shrink-0">
      <button
        ref={toggle}
        type="button"
        aria-label={open ? "Close navigation" : "Open navigation"}
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((value) => !value)}
        className="relative flex size-11 cursor-pointer items-center justify-center rounded border border-current/20 transition-colors duration-200 hover:bg-current/5 motion-reduce:transition-none md:hidden"
      >
        <Menu
          aria-hidden="true"
          className={`absolute transition-[opacity,transform] duration-200 motion-reduce:transition-none ${open ? "scale-75 rotate-90 opacity-0" : "scale-100 rotate-0 opacity-100"}`}
        />
        <X
          aria-hidden="true"
          className={`absolute transition-[opacity,transform] duration-200 motion-reduce:transition-none ${open ? "scale-100 rotate-0 opacity-100" : "scale-75 -rotate-90 opacity-0"}`}
        />
      </button>
      <nav
        id={id}
        aria-label="Workshop views"
        onClick={() => setOpen(false)}
        className={`${open ? "visible translate-y-0 scale-100 opacity-100" : "pointer-events-none invisible -translate-y-2 scale-95 opacity-0"} absolute top-full right-0 mt-3 flex min-w-52 origin-top-right flex-col gap-1 border p-2 text-xs font-bold tracking-[.15em] uppercase shadow-lg transition-[opacity,transform,visibility] duration-200 ease-out motion-reduce:transition-none md:pointer-events-auto md:visible md:static md:mt-0 md:min-w-0 md:translate-y-0 md:scale-100 md:flex-row md:items-center md:gap-8 md:border-0 md:bg-transparent md:p-0 md:text-sm md:opacity-100 md:shadow-none [&>a]:px-4 [&>a]:py-3 md:[&>a]:p-0 [&>span]:px-4 [&>span]:py-3 md:[&>span]:p-0 ${inverse ? "border-line-inverse/15 bg-newsroom text-newsroom-muted" : "border-line/15 bg-workspace text-secondary"}`}
      >
        {children}
      </nav>
    </div>
  )
}
