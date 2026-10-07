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
      className="flex flex-col overflow-hidden border border-line/25 bg-workspace"
      aria-label={idea.title || "Untitled idea"}
    >
      <div className="relative aspect-4/3 w-full overflow-hidden bg-surface-muted">
        {image ? (
          <img
            src={image}
            alt={idea.title || "Idea visualization"}
            loading="lazy"
            className="size-full object-contain"
          />
        ) : (
          <div className="flex size-full flex-col items-center justify-center gap-2 text-xs text-secondary">
            <ImageIcon size={28} aria-hidden="true" />
            No image available
          </div>
        )}
        {idea.TotalVote > 0 && (
          <div className="absolute top-2 right-2 text-center font-bold text-inverse [text-shadow:0_1px_4px_color-mix(in_srgb,var(--shadow-color)_60%,transparent)]">
            <p className="text-2xl leading-none">
              {idea.TotalVote.toString().padStart(2, "0")}
            </p>
            <p className="text-sm uppercase">
              {idea.TotalVote === 1 ? "Vote" : "Votes"}
            </p>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-2.5 p-4">
        <div>
          <h2 className="line-clamp-2 text-[22px] leading-tight font-bold tracking-[-.02em]">
            {idea.title || "Untitled"}
          </h2>
          <p className="mt-1 flex items-center gap-1.5 text-[11px] text-secondary">
            <Clock size={12} aria-hidden="true" />
            {formatRelativeDate(idea.CreatedDttm)}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5 text-[10px]">
          <span className="inline-flex items-center gap-1 border border-line/20 px-2 py-0.5 text-body">
            <Users size={12} aria-hidden="true" className="text-action" />
            {idea.TeamName || "Unknown team"}
          </span>
          <span className="inline-flex items-center gap-1 border border-line/20 px-2 py-0.5 text-body">
            <Shapes size={12} aria-hidden="true" className="text-action" />
            {idea.CategoryName || "Unknown pillar"}
          </span>
          {idea.flgCoach && (
            <span className="inline-flex items-center gap-1 border border-line/20 px-2 py-0.5 text-body">
              <Sparkles size={12} aria-hidden="true" className="text-action" />
              Sharpened
            </span>
          )}
        </div>
        <p className="line-clamp-3 text-sm leading-relaxed text-body">
          {idea.Desc}
        </p>
        <div className="mt-1 border-t border-line/10 pt-2">
          <button
            type="button"
            onClick={onPreview}
            className="flex items-center gap-2 bg-action px-3 py-2.5 text-[10px] font-bold tracking-widest text-on-action uppercase"
          >
            View
          </button>
        </div>
      </div>
    </article>
  )
}
