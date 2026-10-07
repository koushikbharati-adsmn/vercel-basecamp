import { AnimatedDialog } from "@/components/experience/animated-dialog"
import { ExperienceSelect } from "@/components/experience/experience-select"
import { formatRelativeDate } from "@/lib/date"
import { applyParticipantVote, getVotingUsage } from "@/lib/participant-voting"
import { DUR, EASE, STAGGER_DENSE } from "@/lib/motion"
import { cn } from "@/lib/utils"
import {
  getParticipantVoteIdeasOptions,
  useVoteIdea,
  type ParticipantWorkshop,
} from "@/services/participants"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import {
  ChevronLeft,
  ChevronRight,
  ImageIcon,
  LoaderCircle,
  Shapes,
  Sparkles,
  ThumbsUp,
  Users,
} from "lucide-react"
import { useState } from "react"

export function VotingScreen({
  workshop,
  workshopCode,
  visitorId,
}: {
  workshop: ParticipantWorkshop
  workshopCode: string
  visitorId: string
}) {
  const [teamId, setTeamId] = useState<number | null>(null)
  const [categoryId, setCategoryId] = useState<number | null>(null)
  const [index, setIndex] = useState(0)
  const queryClient = useQueryClient()
  const reducedMotion = useReducedMotion()
  const voteIdeasQueryOptions = getParticipantVoteIdeasOptions({
    workshop_code: workshopCode,
    visitor_id: visitorId,
    team_id: teamId,
    category_id: categoryId,
  })
  const query = useQuery(voteIdeasQueryOptions)
  const vote = useVoteIdea()
  const ideas = query.data?.data ?? []
  const boundedIndex = Math.min(index, Math.max(ideas.length - 1, 0))
  const idea = ideas[boundedIndex]
  const votesUsed = getVotingUsage(
    query.data,
    workshop.votingScope,
    idea?.CategoryID
  )
  const cannotAddVote = Boolean(
    idea &&
    !idea.flgSelf &&
    workshop.votingLimit !== null &&
    votesUsed >= workshop.votingLimit
  )
  const isSaving = vote.isPending
  const image =
    idea?.imageFileName?.trim() ||
    workshop.placeholderImages[
      Math.abs(idea?.ID ?? 0) % workshop.placeholderImages.length
    ]?.fileName?.trim() ||
    ""
  const teamOptions = [
    { value: "all", label: "All teams" },
    ...workshop.teams.map((team) => ({
      value: String(team.ID),
      label: team.TeamName,
    })),
  ]
  const pillarOptions = [
    { value: "all", label: "All pillars" },
    ...workshop.category.map((pillar) => ({
      value: String(pillar.ID),
      label: pillar.Name,
    })),
  ]
  const container = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: reducedMotion ? 0 : STAGGER_DENSE },
    },
    exit: { opacity: 0, transition: { duration: reducedMotion ? 0 : 0.1 } },
  }
  const item = {
    hidden: { opacity: 0, y: reducedMotion ? 0 : 8 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: reducedMotion ? 0 : DUR.cut, ease: EASE },
    },
  }
  const toggleVote = () => {
    if (!idea || isSaving || cannotAddVote || workshop.status !== "Vote") return
    const voted = !idea.flgSelf
    vote.mutate(
      {
        workshop_code: workshopCode,
        visitor_id: visitorId,
        idea_id: idea.ID,
        action: voted ? "add" : "remove",
      },
      {
        onSuccess: (response) => {
          if (!response.success) return
          queryClient.setQueryData(
            voteIdeasQueryOptions.queryKey,
            (current) => {
              if (!current?.data) return current
              const previousIdea =
                current.data.find((row) => row.ID === idea.ID) ?? idea
              return applyParticipantVote(current, previousIdea, voted)
            }
          )
        },
      }
    )
  }

  return (
    <AnimatedDialog
      variant="fullscreen"
      dismissDisabled
      onClose={() => {}}
      aria-labelledby="participant-voting-heading"
      className="fixed inset-0 m-0 h-dvh max-h-dvh w-full max-w-none overflow-hidden border-0 bg-white p-0 text-[#231f20]"
      onKeyDown={(event) => {
        if (
          event.target instanceof HTMLElement &&
          event.target.closest('[role="combobox"], [role="listbox"]')
        )
          return
        if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
          event.preventDefault()
          setIndex(
            Math.max(
              0,
              Math.min(
                ideas.length - 1,
                boundedIndex + (event.key === "ArrowLeft" ? -1 : 1)
              )
            )
          )
        }
      }}
    >
      <div className="flex h-full min-h-0 flex-col">
        <header className="relative z-10 flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-[#231f20]/15 px-4 py-3 sm:px-6">
          <h1
            id="participant-voting-heading"
            className="text-sm font-bold tracking-[.16em] uppercase"
          >
            {workshop.VotingPage || "Vote for the big ideas"}
          </h1>
          <div className="grid w-full grid-cols-2 gap-2 sm:w-auto sm:min-w-80">
            <ExperienceSelect
              aria-label="Filter voting ideas by team"
              value={String(teamId ?? "all")}
              options={teamOptions}
              onValueChange={(value) => {
                setTeamId(value === "all" ? null : Number(value))
                setIndex(0)
              }}
            />
            <ExperienceSelect
              aria-label="Filter voting ideas by pillar"
              value={String(categoryId ?? "all")}
              options={pillarOptions}
              onValueChange={(value) => {
                setCategoryId(value === "all" ? null : Number(value))
                setIndex(0)
              }}
            />
          </div>
        </header>
        <AnimatePresence mode="wait">
          {query.isPending ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              aria-label="Loading ideas available for voting"
              aria-busy="true"
              className="grid min-h-0 flex-1 animate-pulse overflow-y-auto lg:grid-cols-[minmax(0,1fr)_minmax(20rem,30rem)]"
            >
              <div className="min-h-[48dvh] bg-[#f6f5f3] lg:min-h-0" />
              <div className="space-y-5 border-t border-[#231f20]/15 p-8 lg:border-t-0 lg:border-l">
                {["h-10", "h-10", "h-5 w-24", "h-10 w-3/4", "h-24"].map(
                  (size, row) => (
                    <div
                      key={row}
                      className={cn("rounded bg-[#231f20]/10", size)}
                    />
                  )
                )}
              </div>
            </motion.div>
          ) : query.isError ? (
            <div
              key="error"
              role="alert"
              className="grid min-h-0 flex-1 place-content-center gap-4 p-6 text-center"
            >
              <h2 className="font-display text-3xl">
                Unable to load voting ideas
              </h2>
              <p className="text-sm text-[#6e6a6c]">
                Check your connection and try again.
              </p>
              <button
                type="button"
                onClick={() => void query.refetch()}
                className="mx-auto bg-[#da291c] px-5 py-3 text-sm font-bold text-white"
              >
                Try again
              </button>
            </div>
          ) : idea ? (
            <motion.div
              key={idea.ID}
              variants={container}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="grid min-h-0 flex-1 overflow-y-auto overscroll-contain lg:grid-cols-[minmax(0,1fr)_minmax(20rem,30rem)] lg:overflow-hidden"
            >
              <motion.div
                variants={item}
                className="relative flex min-h-[48dvh] items-center justify-center bg-[#f6f5f3] px-14 py-12 sm:px-20 lg:min-h-0"
              >
                {image ? (
                  <img
                    src={image}
                    alt={idea.title || "Idea visualization"}
                    className="max-h-[50dvh] max-w-full object-contain lg:max-h-[calc(100dvh-10rem)]"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-sm text-[#6e6a6c]">
                    <ImageIcon size={32} aria-hidden="true" />
                    No image available
                  </div>
                )}
                <motion.button
                  type="button"
                  aria-label="View previous idea"
                  disabled={boundedIndex <= 0}
                  onClick={() => setIndex(boundedIndex - 1)}
                  whileHover={
                    reducedMotion || boundedIndex <= 0
                      ? undefined
                      : { x: -3, scale: 1.05 }
                  }
                  whileTap={reducedMotion ? undefined : { scale: 0.94 }}
                  className="absolute top-1/2 left-3 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-[#231f20]/10 ring-1 ring-[#231f20]/20 backdrop-blur-sm disabled:cursor-not-allowed disabled:opacity-25 sm:left-6 sm:size-12"
                >
                  <ChevronLeft size={24} aria-hidden="true" />
                </motion.button>
                <motion.button
                  type="button"
                  aria-label="View next idea"
                  disabled={boundedIndex >= ideas.length - 1}
                  onClick={() => setIndex(boundedIndex + 1)}
                  whileHover={
                    reducedMotion || boundedIndex >= ideas.length - 1
                      ? undefined
                      : { x: 3, scale: 1.05 }
                  }
                  whileTap={reducedMotion ? undefined : { scale: 0.94 }}
                  className="absolute top-1/2 right-3 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-[#231f20]/10 ring-1 ring-[#231f20]/20 backdrop-blur-sm disabled:cursor-not-allowed disabled:opacity-25 sm:right-6 sm:size-12"
                >
                  <ChevronRight size={24} aria-hidden="true" />
                </motion.button>
                <p
                  aria-live="polite"
                  className="absolute bottom-4 left-1/2 -translate-x-1/2 text-sm text-[#6e6a6c] tabular-nums"
                >
                  {boundedIndex + 1} / {ideas.length}
                </p>
              </motion.div>
              <motion.aside
                variants={item}
                className="min-w-0 border-t border-[#231f20]/15 lg:overflow-y-auto lg:border-t-0 lg:border-l"
              >
                <div className="flex min-h-full flex-col p-6 sm:p-8 lg:p-10">
                  <motion.div variants={item}>
                    <p className="mb-3 text-sm text-[#6e6a6c]">
                      {formatRelativeDate(idea.CreatedDttm)}
                    </p>
                    <h2 className="font-display text-4xl leading-tight break-words">
                      {idea.title || "Untitled"}
                    </h2>
                  </motion.div>
                  <motion.div
                    variants={item}
                    className="mt-4 flex flex-wrap gap-2 text-xs"
                  >
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#231f20]/20 px-3 py-1.5">
                      <Users size={14} aria-hidden="true" />
                      {idea.TeamName || "Unknown team"}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#231f20]/20 px-3 py-1.5">
                      <Shapes size={14} aria-hidden="true" />
                      {idea.CategoryName || "Unknown pillar"}
                    </span>
                    {idea.flgCoach && (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#231f20]/20 px-3 py-1.5">
                        <Sparkles size={14} aria-hidden="true" />
                        Sharpened
                      </span>
                    )}
                  </motion.div>
                  <motion.p
                    variants={item}
                    className="my-8 border-t border-[#231f20]/15 pt-8 text-base leading-7 break-words whitespace-pre-line text-[#4a4749]"
                  >
                    {idea.Desc}
                  </motion.p>
                  <motion.div variants={item} className="mt-auto pt-2">
                    <motion.button
                      type="button"
                      aria-label={
                        idea.flgSelf ? "Remove vote" : "Vote for this idea"
                      }
                      aria-pressed={idea.flgSelf}
                      aria-busy={isSaving}
                      aria-describedby={
                        workshop.votingLimit !== null
                          ? "participant-voting-usage"
                          : undefined
                      }
                      disabled={isSaving || cannotAddVote}
                      onClick={toggleVote}
                      whileHover={
                        reducedMotion || isSaving || cannotAddVote
                          ? undefined
                          : { y: -2, scale: 1.04 }
                      }
                      whileTap={reducedMotion ? undefined : { scale: 0.94 }}
                      className={cn(
                        "mx-auto flex w-24 items-center justify-center rounded-full border px-5 py-2.5 disabled:cursor-not-allowed disabled:opacity-50",
                        idea.flgSelf
                          ? "border-[#da291c] bg-[#da291c] text-white"
                          : "border-[#231f20]/25 bg-white text-[#231f20]"
                      )}
                    >
                      {isSaving ? (
                        <LoaderCircle
                          className="size-5 animate-spin"
                          aria-hidden="true"
                        />
                      ) : (
                        <ThumbsUp
                          className="size-5"
                          fill={idea.flgSelf ? "currentColor" : "none"}
                          aria-hidden="true"
                        />
                      )}
                    </motion.button>
                    {vote.isError && (
                      <p
                        role="alert"
                        className="mt-3 text-center text-sm text-[#da291c]"
                      >
                        Unable to save your vote. Please try again.
                      </p>
                    )}
                    {workshop.votingLimit !== null && (
                      <div
                        id="participant-voting-usage"
                        aria-live="polite"
                        className="mt-4 text-center text-sm text-[#6e6a6c]"
                      >
                        <p className="tabular-nums">
                          {votesUsed} of {workshop.votingLimit}{" "}
                          {workshop.votingScope === "workshop"
                            ? "votes used"
                            : `votes used in ${idea.CategoryName}`}
                        </p>
                        {cannotAddVote && (
                          <p className="mt-1">
                            Remove an existing vote to vote for this idea.
                          </p>
                        )}
                      </div>
                    )}
                  </motion.div>
                </div>
              </motion.aside>
            </motion.div>
          ) : (
            <div
              key="empty"
              className="grid min-h-0 flex-1 place-content-center gap-2 p-6 text-center"
            >
              <h2 className="font-display text-3xl">No ideas available</h2>
              <p className="text-sm text-[#6e6a6c]">
                No voting ideas match the selected team and pillar.
              </p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </AnimatedDialog>
  )
}
