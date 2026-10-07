import { AnimatedDialog } from "@/components/experience/animated-dialog"
import type { ParticipantIdea } from "@/services/participants"
import { X } from "lucide-react"

export function IdeaImageFullscreenDialog({
  idea,
  onClose,
}: {
  idea: ParticipantIdea
  onClose: () => void
}) {
  return (
    <AnimatedDialog
      variant="fullscreen"
      onClose={onClose}
      className="fixed inset-0 m-0 h-dvh max-h-dvh w-full max-w-none overflow-hidden border-0 bg-overlay/95 p-0 text-inverse backdrop-blur-sm"
      aria-labelledby="fullscreen-idea-image-title"
    >
      <div className="relative flex size-full items-center justify-center p-4 sm:p-8">
        <h2 id="fullscreen-idea-image-title" className="sr-only">
          {idea.title || "Untitled idea"} image
        </h2>
        <img
          src={idea.imageFileName}
          alt={idea.title || "Idea visualization"}
          className="max-h-full max-w-full object-contain"
        />
        <button
          type="button"
          onClick={onClose}
          aria-label="Close fullscreen image"
          className="absolute top-4 right-4 grid size-10 cursor-pointer place-items-center bg-overlay/70 text-inverse ring-1 ring-line-inverse/30 transition-colors hover:bg-overlay focus-visible:outline-inverse sm:top-6 sm:right-6"
        >
          <X size={20} />
        </button>
      </div>
    </AnimatedDialog>
  )
}
