import { formatRelativeDate } from "@/lib/date"
import type { ParticipantIdea } from "@/services/participants"
import { Clock, ImageIcon, Shapes, Sparkles, Users } from "lucide-react"

export function StageIdeaCard({
  idea,
  image,
  onPreview,
}: {
  idea: ParticipantIdea
  image: string
  onPreview: () => void
}) {
  return (
    <article
      className="flex flex-col overflow-hidden border border-[#231f20]/25 bg-white"
      aria-label={idea.title || "Untitled idea"}
    >
      <div className="relative aspect-4/3 w-full overflow-hidden bg-[#f6f5f3]">
        {image ? (
          <img
            src={image}
            alt={idea.title || "Idea visualization"}
            loading="lazy"
            className="size-full object-contain"
          />
        ) : (
          <div className="flex size-full flex-col items-center justify-center gap-2 text-xs text-[#6e6a6c]">
            <ImageIcon size={28} aria-hidden="true" />
            No image available
          </div>
        )}
        {idea.TotalVote > 0 && (
          <span className="absolute top-2 right-2 bg-[#231f20] px-2 py-1 text-xs text-white">
            {idea.TotalVote} {idea.TotalVote === 1 ? "vote" : "votes"}
          </span>
        )}
      </div>
      <div className="flex flex-col gap-2.5 p-4">
        <div>
          <h2 className="line-clamp-2 text-[22px] leading-tight font-bold tracking-[-.02em]">
            {idea.title || "Untitled"}
          </h2>
          <p className="mt-1 flex items-center gap-1.5 text-[11px] text-[#6e6a6c]">
            <Clock size={12} aria-hidden="true" />
            {formatRelativeDate(idea.CreatedDttm)}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5 text-[10px]">
          <span className="inline-flex items-center gap-1 border border-[#231f20]/20 px-2 py-0.5 text-[#4a4749]">
            <Users size={12} aria-hidden="true" />
            {idea.TeamName || "Unknown team"}
          </span>
          <span className="inline-flex items-center gap-1 border border-[#231f20]/20 px-2 py-0.5 text-[#4a4749]">
            <Shapes size={12} aria-hidden="true" />
            {idea.CategoryName || "Unknown pillar"}
          </span>
          {idea.flgCoach && (
            <span className="inline-flex items-center gap-1 border border-[#231f20]/20 px-2 py-0.5 text-[#4a4749]">
              <Sparkles size={12} aria-hidden="true" />
              Sharpened
            </span>
          )}
        </div>
        <p className="line-clamp-3 text-sm leading-relaxed text-[#4a4749]">
          {idea.Desc}
        </p>
        <div className="mt-1 border-t border-[#231f20]/10 pt-2">
          <button
            type="button"
            onClick={onPreview}
            className="flex items-center gap-2 bg-[#231f20] px-3 py-2.5 text-[10px] font-bold tracking-widest text-white uppercase"
          >
            View
          </button>
        </div>
      </div>
    </article>
  )
}
