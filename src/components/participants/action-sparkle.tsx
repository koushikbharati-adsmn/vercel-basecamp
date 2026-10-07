import { EASE } from "@/lib/motion"
import { motion } from "framer-motion"
import { Sparkle } from "lucide-react"

const SPARKLES = [
  { x: -12, y: -11, size: 7 },
  { x: 2, y: -16, size: 6 },
  { x: 14, y: -6, size: 8 },
  { x: 10, y: 13, size: 6 },
  { x: -13, y: 10, size: 5 },
] as const

/** Decorative click feedback. Mount only for local additions, not state updates. */
export function ActionSparkle({
  onComplete,
  colorClassName = "text-action",
}: {
  onComplete: () => void
  colorClassName?: string
}) {
  return (
    <motion.span
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 z-10 ${colorClassName}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 1, 1, 0] }}
      transition={{ duration: 0.5, times: [0, 0.12, 0.65, 1] }}
      onAnimationComplete={onComplete}
    >
      {SPARKLES.map(({ x, y, size }, index) => (
        <motion.span
          key={index}
          className="absolute top-1/2 left-1/2"
          style={{ marginLeft: -size / 2, marginTop: -size / 2 }}
          initial={{ x: x * 0.35, y: y * 0.35, scale: 0 }}
          animate={{ x, y, scale: [0, 1, 0], rotate: [0, 20] }}
          transition={{ duration: 0.42, delay: index * 0.015, ease: EASE }}
        >
          <Sparkle size={size} fill="currentColor" strokeWidth={1.5} />
        </motion.span>
      ))}
    </motion.span>
  )
}
