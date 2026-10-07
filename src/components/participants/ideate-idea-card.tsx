import { IMAGE_GENERATION_LIMIT } from "@/components/participants/participant-idea-constants"
import { IdeaImageGenerating } from "@/components/participants/idea-image-generating"
import { DUR, EASE } from "@/lib/motion"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { useState } from "react"
import { formatActivityTime, formatRelativeDate } from "@/lib/date"
import type { ParticipantIdea } from "@/services/participants"
import {
  Clock,
  Expand,
  ImagePlus,
  LoaderCircle,
  Pencil,
  RefreshCw,
  Shapes,
  Sparkle,
  Sparkles,
  Star,
  Users,
} from "lucide-react"

/** Board presentation only: the screen owns API mutations and modal workflows. */
export function IdeateIdeaCard({
  idea,
  number,
  canEdit,
  canSharpen,
  isGeneratingImage,
  isShortlisting,
  onEdit,
  onPreview,
  onGenerateImage,
  onShortlist,
  onSharpen,
}: {
  idea: ParticipantIdea
  number: number
  canEdit: boolean
  canSharpen: boolean
  isGeneratingImage: boolean
  isShortlisting: boolean
  onEdit: () => void
  onPreview: () => void
  onGenerateImage: () => void
  onShortlist: () => void
  onSharpen: () => void
}) {
  const reducedMotion = useReducedMotion()
  const [sparkling, setSparkling] = useState(false)
  const hasImage = Boolean(idea.imageFileName?.trim())
  const imageLimitReached = idea.imgCount >= IMAGE_GENERATION_LIMIT
  const submitted = formatActivityTime(idea.CreatedDttm)
  const generationDisabled = !canEdit || isGeneratingImage || imageLimitReached

  return (
    <article
      className="flex flex-col overflow-hidden border border-line/25 bg-workspace"
      aria-label={idea.title || `Idea ${number}`}
    >
      <div className="relative aspect-4/3 w-full overflow-hidden bg-surface-muted">
        {hasImage ? (
          <>
            <IdeaImage
              key={idea.imageFileName}
              src={idea.imageFileName}
              alt={idea.title || "Idea visualization"}
            />
            <span className="absolute top-2 left-2 z-20 bg-action px-2 py-0.5 text-sm text-on-action tabular-nums">
              {idea.imgCount}/{IMAGE_GENERATION_LIMIT}
            </span>
            <div className="absolute right-2 bottom-2 z-20 flex items-center gap-2">
              <button
                type="button"
                onClick={onGenerateImage}
                disabled={generationDisabled}
                aria-busy={isGeneratingImage}
                aria-label={`Regenerate the image for ${idea.title || "this idea"}`}
                title={
                  imageLimitReached
                    ? "Image generation limit reached"
                    : "Regenerate image"
                }
                className="grid size-8 place-content-center bg-action text-on-action disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw size={16} />
              </button>
              <button
                type="button"
                onClick={onPreview}
                aria-label={`Open the image for ${idea.title || "this idea"} in fullscreen`}
                title="Fullscreen image preview"
                className="grid size-8 place-content-center bg-action text-on-action"
              >
                <Expand size={16} />
              </button>
            </div>
          </>
        ) : (
          <button
            type="button"
            onClick={onGenerateImage}
            disabled={generationDisabled}
            aria-busy={isGeneratingImage}
            style={{ visibility: isGeneratingImage ? "hidden" : undefined }}
            className="flex size-full flex-col items-center justify-center gap-2 px-4 py-3 text-xs font-bold text-secondary disabled:cursor-not-allowed disabled:opacity-50"
            title={
              !canEdit
                ? "Images can be generated during ideation"
                : imageLimitReached
                  ? "Image generation limit reached"
                  : undefined
            }
          >
            <ImagePlus size={18} className="shrink-0" />
            <span>
              {imageLimitReached
                ? "Image generation limit reached"
                : "Generate image"}
            </span>
          </button>
        )}
        <AnimatePresence>
          {isGeneratingImage && (
            <IdeaImageGenerating key="generating" regenerating={hasImage} />
          )}
        </AnimatePresence>
      </div>
      <div className="flex flex-col gap-2.5 p-4">
        <div>
          <h2 className="line-clamp-2 text-[22px] leading-tight font-bold tracking-[-.02em]">
            {idea.title || "Untitled"}
          </h2>
          <p
            className="mt-1 flex items-center gap-1.5 text-[11px] text-secondary"
            title={submitted ? `Submitted ${submitted}` : undefined}
          >
            <Clock size={12} />
            {submitted
              ? formatRelativeDate(idea.CreatedDttm)
              : "Submission time unavailable"}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5 text-[10px]">
          <span className="inline-flex items-center gap-1 border border-line/20 px-2 py-0.5 text-body">
            <Users size={12} className="shrink-0" />
            {idea.TeamName || "Unknown team"}
          </span>
          <span className="inline-flex items-center gap-1 border border-line/20 px-2 py-0.5 text-body">
            <Shapes size={12} className="shrink-0" />
            {idea.CategoryName || "Unknown pillar"}
          </span>
          {idea.flgCoach && (
            <span className="inline-flex items-center gap-1 border border-line/20 px-2 py-0.5 text-body">
              <Sparkles size={12} />
              Sharpened
            </span>
          )}
        </div>
        <p className="line-clamp-3 text-sm leading-relaxed text-body">
          {idea.Desc}
        </p>
        <div className="mt-1 flex items-center justify-between gap-2 border-t border-line/10 pt-2">
          <div className="flex items-center gap-1">
            <span className="relative inline-grid size-8 shrink-0">
              <button
                type="button"
                className={`grid size-8 place-items-center disabled:cursor-not-allowed disabled:opacity-50 ${idea.flgTeam ? "text-action" : ""}`}
                disabled={!canEdit || isShortlisting}
                aria-label={
                  idea.flgTeam
                    ? `Remove ${idea.title || "idea"} from shortlist`
                    : `Shortlist ${idea.title || "idea"}`
                }
                title={idea.flgTeam ? "Remove from shortlist" : "Shortlist"}
                aria-pressed={idea.flgTeam}
                aria-busy={isShortlisting}
                onClick={() => {
                  setSparkling(!idea.flgTeam && !reducedMotion)
                  onShortlist()
                }}
              >
                <motion.span
                  className="inline-grid place-items-center"
                  animate={{
                    scale: sparkling && !reducedMotion ? [1, 1.18, 1] : 1,
                  }}
                  transition={{ duration: reducedMotion ? 0 : 0.3, ease: EASE }}
                >
                  {isShortlisting ? (
                    <LoaderCircle size={17} className="animate-spin" />
                  ) : (
                    <Star
                      size={17}
                      fill={idea.flgTeam ? "currentColor" : "none"}
                    />
                  )}
                </motion.span>
              </button>
              {sparkling && !reducedMotion && (
                <ShortlistSparkle onComplete={() => setSparkling(false)} />
              )}
            </span>
            <button
              type="button"
              disabled={!canEdit || isGeneratingImage}
              onClick={onEdit}
              aria-label={`Edit ${idea.title || "idea"}`}
              title="Edit idea"
              className="grid size-8 place-items-center disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Pencil size={17} />
            </button>
          </div>
          <button
            type="button"
            className="bg-action-neutral px-3 py-2.5 text-[10px] font-bold tracking-widest text-on-action-neutral uppercase disabled:cursor-not-allowed disabled:opacity-50"
            disabled={!canEdit || !canSharpen}
            title={
              !canSharpen
                ? "No coaches are configured for this workshop"
                : undefined
            }
            onClick={onSharpen}
          >
            Sharpen
          </button>
        </div>
      </div>
    </article>
  )
}

const SHORTLIST_SPARKLES = [
  { x: -12, y: -11, size: 7 },
  { x: 2, y: -16, size: 6 },
  { x: 14, y: -6, size: 8 },
  { x: 10, y: 13, size: 6 },
  { x: -13, y: 10, size: 5 },
] as const

/** Local click feedback only; incoming shortlist updates do not celebrate. */
function ShortlistSparkle({ onComplete }: { onComplete: () => void }) {
  return (
    <motion.span
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-10 text-action"
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 1, 1, 0] }}
      transition={{ duration: 0.5, times: [0, 0.12, 0.65, 1] }}
      onAnimationComplete={onComplete}
    >
      {SHORTLIST_SPARKLES.map(({ x, y, size }, index) => (
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

function IdeaImage({ src, alt }: { src: string; alt: string }) {
  const [loaded, setLoaded] = useState(false)
  const reducedMotion = useReducedMotion()
  return (
    <motion.img
      src={src}
      alt={alt}
      loading="lazy"
      className="size-full object-contain"
      initial={{ opacity: 0 }}
      animate={{ opacity: loaded ? 1 : 0 }}
      transition={{ duration: reducedMotion ? 0 : DUR.beat, ease: EASE }}
      onLoad={() => setLoaded(true)}
      onError={() => setLoaded(true)}
    />
  )
}
