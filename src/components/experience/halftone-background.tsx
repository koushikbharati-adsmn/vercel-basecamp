import { cn } from "@/lib/utils"

/** Decorative print texture for dark, brand-themed screen backgrounds. */
export function HalftoneBackground({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(var(--pattern-inverse-color)_0.75px,transparent_0.75px)] bg-[length:5px_5px] opacity-10",
        className
      )}
    />
  )
}
