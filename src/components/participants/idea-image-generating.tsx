import { DUR, EASE } from "@/lib/motion"
import { motion, useReducedMotion } from "framer-motion"

/** Indeterminate visual feedback, not simulated backend progress. */
export function IdeaImageGenerating({
  regenerating,
}: {
  regenerating: boolean
}) {
  const reducedMotion = useReducedMotion()
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reducedMotion ? 0 : DUR.cut, ease: EASE }}
      role="status"
      aria-live="polite"
      aria-label={
        regenerating
          ? "Regenerating your idea image"
          : "Generating your idea image"
      }
      className="image-developing pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-4 overflow-hidden bg-surface-muted/90 px-4"
    >
      <div
        aria-hidden="true"
        className="image-developing-grid absolute inset-0"
      />
      <div
        aria-hidden="true"
        className="image-developing-sweep absolute inset-0"
      />
      <div className="relative text-center">
        <p className="text-sm font-bold text-content">
          {regenerating ? "Reimagining your idea" : "Generating your image"}
        </p>
        <p className="mt-1.5 text-[11px] text-muted">
          Your idea is taking shape.
        </p>
        <div
          aria-hidden="true"
          className="mx-auto mt-4 h-px w-32 overflow-hidden bg-tint/10"
        >
          <div className="image-developing-progress h-full w-1/3 bg-action" />
        </div>
      </div>
    </motion.div>
  )
}
