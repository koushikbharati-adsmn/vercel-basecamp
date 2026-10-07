import { ActionSparkle } from "@/components/participants/action-sparkle"
import { EASE } from "@/lib/motion"
import { cn } from "@/lib/utils"
import { motion, useReducedMotion } from "framer-motion"
import { LoaderCircle, ThumbsUp } from "lucide-react"
import { useState } from "react"

/** Key by idea ID so navigating never carries click feedback to another idea. */
export function VoteButton({
  voted,
  isSaving,
  disabled,
  describedBy,
  onVote,
}: {
  voted: boolean
  isSaving: boolean
  disabled: boolean
  describedBy?: string
  onVote: () => void
}) {
  const reducedMotion = useReducedMotion()
  const [sparkling, setSparkling] = useState(false)

  return (
    <div className="relative mx-auto w-24">
      <motion.button
        type="button"
        aria-label={voted ? "Remove vote" : "Vote for this idea"}
        aria-pressed={voted}
        aria-busy={isSaving}
        aria-describedby={describedBy}
        disabled={disabled || isSaving}
        onClick={() => {
          setSparkling(!voted && !reducedMotion)
          onVote()
        }}
        whileHover={
          reducedMotion || disabled || isSaving
            ? undefined
            : { y: -2, scale: 1.04 }
        }
        whileTap={
          reducedMotion || disabled || isSaving ? undefined : { scale: 0.94 }
        }
        className={cn(
          "flex w-full items-center justify-center border px-5 py-2.5 disabled:cursor-not-allowed disabled:opacity-50",
          voted
            ? "border-action bg-action text-on-action"
            : "border-line/25 bg-workspace text-action"
        )}
      >
        <motion.span
          className="inline-grid place-items-center"
          animate={{ scale: sparkling && !reducedMotion ? [1, 1.18, 1] : 1 }}
          transition={{ duration: reducedMotion ? 0 : 0.3, ease: EASE }}
        >
          {isSaving ? (
            <LoaderCircle className="size-5 animate-spin" aria-hidden="true" />
          ) : (
            <ThumbsUp
              className="size-5"
              fill={voted ? "currentColor" : "none"}
              aria-hidden="true"
            />
          )}
        </motion.span>
      </motion.button>
      {sparkling && !reducedMotion && (
        <ActionSparkle
          colorClassName={voted ? "text-on-action" : "text-action"}
          onComplete={() => setSparkling(false)}
        />
      )}
    </div>
  )
}
