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
  const hasImage = Boolean(idea.imageFileName?.trim())
  const imageLimitReached = idea.imgCount >= IMAGE_GENERATION_LIMIT
  const submitted = formatActivityTime(idea.CreatedDttm)
  const generationDisabled = !canEdit || isGeneratingImage || imageLimitReached

  return (
    <article
      className={`flex flex-col overflow-hidden border bg-white ${idea.flgTeam ? "border-[#da291c] ring-1 ring-[#da291c]" : "border-[#231f20]/25"}`}
      aria-label={idea.title || `Idea ${number}`}
    >
      <div className="relative aspect-4/3 w-full overflow-hidden bg-[#f6f5f3]">
        {hasImage ? (
          <>
            <IdeaImage
              key={idea.imageFileName}
              src={idea.imageFileName}
              alt={idea.title || "Idea visualization"}
            />
            <span className="absolute top-2 left-2 z-20 bg-[#da291c] px-2 py-0.5 text-sm text-white tabular-nums">
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
                className="grid size-8 place-content-center bg-[#da291c] text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw size={16} />
              </button>
              <button
                type="button"
                onClick={onPreview}
                aria-label={`Open the image for ${idea.title || "this idea"} in fullscreen`}
                title="Fullscreen image preview"
                className="grid size-8 place-content-center bg-[#da291c] text-white"
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
            className="flex size-full flex-col items-center justify-center gap-2 px-4 py-3 text-xs font-bold text-[#6e6a6c] disabled:cursor-not-allowed disabled:opacity-50"
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
            className="mt-1 flex items-center gap-1.5 text-[11px] text-[#6e6a6c]"
            title={submitted ? `Submitted ${submitted}` : undefined}
          >
            <Clock size={12} />
            {submitted
              ? formatRelativeDate(idea.CreatedDttm)
              : "Submission time unavailable"}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5 text-[10px]">
          <span className="inline-flex items-center gap-1 border border-[#231f20]/20 px-2 py-0.5 text-[#4a4749]">
            <Users size={12} className="shrink-0" />
            {idea.TeamName || "Unknown team"}
          </span>
          <span className="inline-flex items-center gap-1 border border-[#231f20]/20 px-2 py-0.5 text-[#4a4749]">
            <Shapes size={12} className="shrink-0" />
            {idea.CategoryName || "Unknown pillar"}
          </span>
          {idea.flgCoach && (
            <span className="inline-flex items-center gap-1 border border-[#231f20]/20 px-2 py-0.5 text-[#4a4749]">
              <Sparkles size={12} />
              Sharpened
            </span>
          )}
        </div>
        <p className="line-clamp-3 text-sm leading-relaxed text-[#4a4749]">
          {idea.Desc}
        </p>
        <div className="mt-1 flex items-center justify-between gap-2 border-t border-[#231f20]/10 pt-2">
          <div className="flex items-center gap-1">
            <button
              type="button"
              className={`grid size-8 place-items-center disabled:cursor-not-allowed disabled:opacity-50 ${idea.flgTeam ? "text-[#da291c]" : ""}`}
              disabled={!canEdit || isShortlisting}
              aria-label={
                idea.flgTeam
                  ? `Remove ${idea.title || "idea"} from shortlist`
                  : `Shortlist ${idea.title || "idea"}`
              }
              title={idea.flgTeam ? "Remove from shortlist" : "Shortlist"}
              aria-pressed={idea.flgTeam}
              aria-busy={isShortlisting}
              onClick={onShortlist}
            >
              {isShortlisting ? (
                <LoaderCircle size={17} className="animate-spin" />
              ) : (
                <Star size={17} fill={idea.flgTeam ? "currentColor" : "none"} />
              )}
            </button>
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
            className="bg-[#231f20] px-3 py-2.5 text-[10px] font-bold tracking-widest text-white uppercase disabled:cursor-not-allowed disabled:opacity-50"
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
