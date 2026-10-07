import { AnimatedDialog } from "@/components/experience/animated-dialog"
import { formatRelativeDate } from "@/lib/date"
import type { ParticipantIdea } from "@/services/participants"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { useState } from "react"
import {
  ChevronLeft,
  ChevronRight,
  ImageIcon,
  Shapes,
  Sparkles,
  ThumbsUp,
  Users,
  X,
} from "lucide-react"

export function StageIdeaPreviewDialog({
  idea,
  image,
  title,
  position,
  total,
  showVotes = true,
  onPrevious,
  onNext,
  onClose,
}: {
  idea: ParticipantIdea
  image: string
  title: string
  position: number
  total: number
  showVotes?: boolean
  onPrevious: () => void
  onNext: () => void
  onClose: () => void
}) {
  const reducedMotion = useReducedMotion()
  const [direction, setDirection] = useState(1)
  const distance = reducedMotion ? 0 : 32
  const variants = {
    enter: (direction: number) => ({ opacity: 0, x: direction * distance }),
    center: { opacity: 1, x: 0 },
    exit: (direction: number) => ({ opacity: 0, x: -direction * distance }),
  }
  const transition = {
    duration: reducedMotion ? 0 : 0.16,
    ease: "easeInOut" as const,
  }
  const handlePrevious = () => {
    setDirection(-1)
    onPrevious()
  }
  const handleNext = () => {
    setDirection(1)
    onNext()
  }

  return (
    <AnimatedDialog
      variant="fullscreen"
      onClose={onClose}
      aria-labelledby="stage-preview-title"
      className="fixed inset-0 m-0 h-dvh max-h-dvh w-full max-w-none overflow-hidden border-0 bg-workspace p-0 text-content"
      onKeyDown={(event) => {
        if (event.key === "ArrowLeft" && position > 1) {
          event.preventDefault()
          handlePrevious()
        }
        if (event.key === "ArrowRight" && position < total) {
          event.preventDefault()
          handleNext()
        }
      }}
    >
      <div className="flex h-full min-h-0 flex-col">
        <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-line/15 px-5 sm:px-8">
          <span className="text-sm font-bold tracking-[.16em] text-action uppercase">
            {title}
          </span>
          <button
            type="button"
            aria-label="Close idea preview"
            onClick={onClose}
            className="grid size-10 shrink-0 place-items-center border border-line/20"
          >
            <X size={20} />
          </button>
        </header>
        <div className="grid min-h-0 flex-1 overflow-y-auto overscroll-contain lg:grid-cols-[minmax(0,1fr)_minmax(20rem,30rem)] lg:overflow-hidden">
          <div className="relative flex min-h-[48dvh] items-center justify-center overflow-hidden bg-surface-muted px-14 py-12 sm:px-20 lg:min-h-0">
            <AnimatePresence mode="wait" initial={false} custom={direction}>
              <motion.div
                key={idea.ID}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={transition}
                className="flex w-full min-w-0 items-center justify-center"
              >
                {image ? (
                  <img
                    key={image}
                    src={image}
                    alt={idea.title || "Idea visualization"}
                    className="max-h-[50dvh] max-w-full object-contain lg:max-h-[calc(100dvh-10rem)]"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-sm text-secondary">
                    <ImageIcon size={32} aria-hidden="true" />
                    No image available
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
            <button
              type="button"
              aria-label="View previous idea"
              disabled={position <= 1}
              onClick={handlePrevious}
              className="absolute top-1/2 left-3 grid size-10 -translate-y-1/2 place-items-center border border-line/20 bg-workspace/90 disabled:cursor-not-allowed disabled:opacity-25 sm:left-6"
            >
              <ChevronLeft size={22} className="text-action" />
            </button>
            <button
              type="button"
              aria-label="View next idea"
              disabled={position >= total}
              onClick={handleNext}
              className="absolute top-1/2 right-3 grid size-10 -translate-y-1/2 place-items-center border border-line/20 bg-workspace/90 disabled:cursor-not-allowed disabled:opacity-25 sm:right-6"
            >
              <ChevronRight size={22} className="text-action" />
            </button>
            <p
              aria-live="polite"
              className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm text-secondary tabular-nums"
            >
              {position} / {total}
            </p>
          </div>
          <aside className="min-w-0 overflow-x-hidden border-t border-line/15 p-6 sm:p-8 lg:overflow-y-auto lg:border-t-0 lg:border-l">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={idea.ID}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={transition}
              >
                <p className="mb-3 text-xs text-secondary">
                  Submitted {formatRelativeDate(idea.CreatedDttm)}
                </p>
                <h2
                  id="stage-preview-title"
                  className="font-display text-4xl leading-tight break-words"
                >
                  {idea.title || "Untitled"}
                </h2>
                <div className="mt-4 flex flex-wrap gap-2 text-xs">
                  <span className="inline-flex items-center gap-1 border border-line/20 px-2 py-1">
                    <Users
                      size={13}
                      aria-hidden="true"
                      className="text-action"
                    />
                    {idea.TeamName || "Unknown team"}
                  </span>
                  <span className="inline-flex items-center gap-1 border border-line/20 px-2 py-1">
                    <Shapes
                      size={13}
                      aria-hidden="true"
                      className="text-action"
                    />
                    {idea.CategoryName || "Unknown pillar"}
                  </span>
                  {idea.flgCoach && (
                    <span className="inline-flex items-center gap-1 border border-line/20 px-2 py-1">
                      <Sparkles
                        size={13}
                        aria-hidden="true"
                        className="text-action"
                      />
                      Sharpened
                    </span>
                  )}
                </div>
                {showVotes && idea.TotalVote > 0 && (
                  <div className="mt-5 inline-flex items-center gap-3.5 self-start py-3.5">
                    <span
                      className="grid size-11 shrink-0 place-items-center rounded-full bg-action text-on-action"
                      aria-hidden="true"
                    >
                      <ThumbsUp
                        className="size-5.5"
                        fill="currentColor"
                        aria-hidden="true"
                      />
                    </span>
                    <div>
                      <p className="m-0 text-3xl leading-none font-bold tabular-nums">
                        {idea.TotalVote.toString().padStart(1, "0")}
                      </p>
                      <p className="m-0 text-xs font-medium tracking-wide text-secondary uppercase">
                        {idea.TotalVote === 1 ? "Total vote" : "Total votes"}
                      </p>
                    </div>
                  </div>
                )}
                <p className="mt-7 border-t border-line/15 pt-6 text-base leading-7 break-words whitespace-pre-line text-body">
                  {idea.Desc}
                </p>
              </motion.div>
            </AnimatePresence>
          </aside>
        </div>
      </div>
    </AnimatedDialog>
  )
}
