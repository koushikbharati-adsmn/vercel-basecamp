import { ExperienceSelect } from "@/components/experience/experience-select"
import { IdeaMasonry } from "@/components/participants/idea-masonry"
import { LiveActivityTicker } from "@/components/participants/live-activity-ticker"
import { IMAGE_GENERATION_LIMIT } from "@/components/participants/participant-idea-constants"
import { StageIdeaCard } from "@/components/participants/stage-idea-card"
import { StageIdeaPreviewDialog } from "@/components/participants/stage-idea-preview-dialog"
import { useWorkshopActivities } from "@/hooks/use-workshop-activities"
import { BEAT, DUR, EASE } from "@/lib/motion"
import { socket } from "@/lib/socket"
import {
  getParticipantIdeasOptions,
  type IdeaCoachSocketPayload,
  type IdeaImageSocketPayload,
  type IdeaShortlistSocketPayload,
  type IdeaUpsertSocketPayload,
  type ParticipantIdea,
  type ParticipantWorkshop,
} from "@/services/participants"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { useEffect, useState } from "react"

export function StageScreen({
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
  const [previewId, setPreviewId] = useState<number | null>(null)
  const queryClient = useQueryClient()
  const reducedMotion = useReducedMotion()
  const {
    activities,
    isPending: activityPending,
    isError: activityError,
  } = useWorkshopActivities(workshopCode)
  const ideasQueryOptions = getParticipantIdeasOptions({
    visitor_id: visitorId,
    workshop_code: workshopCode,
    team_id: teamId,
    category_id: categoryId,
    is_shortlisted: true,
    is_coached: null,
  })
  const ideasQuery = useQuery(ideasQueryOptions)
  const ideas = ideasQuery.data?.data ?? []
  const previewIndex = ideas.findIndex((idea) => idea.ID === previewId)
  const previewIdea = previewIndex < 0 ? null : ideas[previewIndex]
  const title = workshop.ShortlistedIdeaPage || "The Stage"
  const getImage = (idea: ParticipantIdea) =>
    idea.imageFileName?.trim() ||
    workshop.placeholderImages[
      Math.abs(idea.ID) % workshop.placeholderImages.length
    ]?.fileName?.trim() ||
    ""

  useEffect(() => {
    const joinRoom = () => socket.emit("join_room", { roomId: workshopCode })
    socket.on("connect", joinRoom)
    if (socket.connected) joinRoom()
    return () => {
      socket.off("connect", joinRoom)
    }
  }, [workshopCode])

  useEffect(() => {
    const handleIdeaUpserted = ({
      roomId,
      idea: socketIdea,
    }: IdeaUpsertSocketPayload) => {
      if (roomId !== workshopCode) return
      queryClient.setQueryData(ideasQueryOptions.queryKey, (oldData) => {
        if (!oldData?.data) return oldData
        // A lightweight upsert cannot tell us whether an unknown idea is shortlisted.
        const existing = oldData.data.find(
          (idea) => idea.ID === socketIdea.ideaId
        )
        if (!existing) return oldData
        const matchesFilters =
          (teamId === null || socketIdea.teamId === teamId) &&
          (categoryId === null || socketIdea.categoryId === categoryId)
        if (!matchesFilters) {
          return {
            ...oldData,
            data: oldData.data.filter((idea) => idea.ID !== socketIdea.ideaId),
          }
        }
        return {
          ...oldData,
          data: oldData.data.map((idea) =>
            idea.ID === socketIdea.ideaId
              ? {
                  ...idea,
                  TeamID: socketIdea.teamId,
                  TeamName: socketIdea.teamName,
                  CategoryID: socketIdea.categoryId,
                  CategoryName: socketIdea.categoryName,
                  Desc: socketIdea.desc,
                  title: socketIdea.title,
                  Context: socketIdea.context,
                }
              : idea
          ),
        }
      })
    }
    const handleIdeaShortlistUpdated = ({
      roomId,
      idea: socketIdea,
      isShortlisted,
    }: IdeaShortlistSocketPayload) => {
      if (roomId !== workshopCode) return
      if (!isShortlisted)
        setPreviewId((current) => (current === socketIdea.ID ? null : current))
      queryClient.setQueryData(ideasQueryOptions.queryKey, (oldData) => {
        if (!oldData?.data) return oldData
        const exists = oldData.data.some((idea) => idea.ID === socketIdea.ID)
        const matchesFilters =
          isShortlisted &&
          (teamId === null || socketIdea.TeamID === teamId) &&
          (categoryId === null || socketIdea.CategoryID === categoryId)
        if (!matchesFilters) {
          return exists
            ? {
                ...oldData,
                data: oldData.data.filter((idea) => idea.ID !== socketIdea.ID),
              }
            : oldData
        }
        return {
          ...oldData,
          data: exists
            ? oldData.data.map((idea) =>
                idea.ID === socketIdea.ID ? { ...idea, flgTeam: true } : idea
              )
            : [...oldData.data, { ...socketIdea, flgTeam: true }],
        }
      })
    }
    const handleIdeaCoachUpdated = ({
      roomId,
      idea: socketIdea,
      flgCoach,
    }: IdeaCoachSocketPayload) => {
      if (roomId !== workshopCode) return
      queryClient.setQueryData(ideasQueryOptions.queryKey, (oldData) => {
        if (!oldData?.data) return oldData
        return {
          ...oldData,
          data: oldData.data.map((idea) =>
            idea.ID === socketIdea.ID ? { ...idea, flgCoach } : idea
          ),
        }
      })
    }
    const handleIdeaImageGenerated = ({
      roomId,
      ideaId,
      imageUrl,
    }: IdeaImageSocketPayload) => {
      if (roomId !== workshopCode) return
      queryClient.setQueryData(ideasQueryOptions.queryKey, (oldData) => {
        if (!oldData?.data) return oldData
        return {
          ...oldData,
          data: oldData.data.map((idea) =>
            idea.ID === ideaId && idea.imageFileName !== imageUrl
              ? {
                  ...idea,
                  imageFileName: imageUrl,
                  imgCount: Math.min(idea.imgCount + 1, IMAGE_GENERATION_LIMIT),
                }
              : idea
          ),
        }
      })
    }
    socket.on("idea_upserted", handleIdeaUpserted)
    socket.on("idea_shortlist_updated", handleIdeaShortlistUpdated)
    socket.on("idea_coach_updated", handleIdeaCoachUpdated)
    socket.on("idea_image_generated", handleIdeaImageGenerated)
    return () => {
      socket.off("idea_upserted", handleIdeaUpserted)
      socket.off("idea_shortlist_updated", handleIdeaShortlistUpdated)
      socket.off("idea_coach_updated", handleIdeaCoachUpdated)
      socket.off("idea_image_generated", handleIdeaImageGenerated)
    }
  }, [
    workshopCode,
    teamId,
    categoryId,
    queryClient,
    ideasQueryOptions.queryKey,
  ])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: reducedMotion ? 0 : DUR.cut }}
      className="ideate-board min-h-dvh bg-white pb-14 text-[#231f20]"
    >
      <motion.header
        initial={{ opacity: 0, y: reducedMotion ? 0 : -56 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: reducedMotion ? 0 : DUR.beat,
          delay: reducedMotion ? 0 : BEAT.structure,
          ease: EASE,
        }}
        className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-4 border-b border-[#231f20]/15 bg-white/95 px-5 py-4 backdrop-blur-lg sm:px-12"
      >
        <div className="flex items-center gap-4">
          <Link
            to="/workshops/$code/participants"
            params={{ code: workshopCode }}
            search={{ selectTeam: true }}
            aria-label="Basecamp home"
          >
            <img
              src="/logos/ogilvy-logo-white.svg"
              alt="Ogilvy"
              className="h-[26px] brightness-0"
            />
          </Link>
          <span className="h-5 w-px bg-[#231f20]/15" />
          <span className="font-display text-[28px]">{title}</span>
        </div>
        <nav
          aria-label="Workshop views"
          className="flex items-center gap-5 text-xs font-bold tracking-[.12em] uppercase"
        >
          {workshop.teamID !== null ? (
            <Link
              to="/workshops/$code/participants/$teamId"
              params={{ code: workshopCode, teamId: String(workshop.teamID) }}
              className="text-[#6e6a6c]"
            >
              Board
            </Link>
          ) : (
            <Link
              to="/workshops/$code/participants"
              params={{ code: workshopCode }}
              search={{ selectTeam: true }}
              className="text-[#6e6a6c]"
            >
              Choose team
            </Link>
          )}
          <span aria-current="page" className="text-[#da291c]">
            Stage
          </span>
          <Link
            to="/workshops/$code/participants/newsroom"
            params={{ code: workshopCode }}
            className="text-[#6e6a6c] hover:text-[#231f20]"
          >
            Newsroom
          </Link>
        </nav>
      </motion.header>
      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{
          duration: reducedMotion ? 0 : DUR.beat,
          delay: reducedMotion ? 0 : BEAT.detail,
          ease: EASE,
        }}
        className="px-5 pt-6 pb-12 sm:px-12"
      >
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <p
            className="text-xs font-bold tracking-[.12em] text-[#6e6a6c] uppercase"
            aria-live="polite"
          >
            {ideasQuery.isPending ? "Loading shortlist…" : ""}
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <ExperienceSelect<string | number>
              className="sm:min-w-48"
              value={teamId ?? "all"}
              options={[
                { value: "all", label: "All teams" },
                ...workshop.teams.map((team) => ({
                  value: team.ID,
                  label: team.TeamName,
                })),
              ]}
              onValueChange={(value) => {
                setPreviewId(null)
                setTeamId(value === "all" ? null : Number(value))
              }}
            />
            <ExperienceSelect<string | number>
              className="sm:min-w-48"
              value={categoryId ?? "all"}
              options={[
                { value: "all", label: "All pillars" },
                ...workshop.category.map((pillar) => ({
                  value: pillar.ID,
                  label: pillar.Name,
                })),
              ]}
              onValueChange={(value) => {
                setPreviewId(null)
                setCategoryId(value === "all" ? null : Number(value))
              }}
            />
          </div>
        </div>
        {ideasQuery.isPending ? (
          <p role="status" className="py-12 text-center text-sm text-[#6e6a6c]">
            Loading shortlisted ideas…
          </p>
        ) : ideasQuery.isError ? (
          <div role="alert" className="py-12 text-center">
            <p className="text-sm text-[#6e6a6c]">
              Could not load shortlisted ideas.
            </p>
            <button
              type="button"
              onClick={() => void ideasQuery.refetch()}
              className="mt-3 border border-[#231f20]/25 px-4 py-2 text-xs font-bold"
            >
              Try again
            </button>
          </div>
        ) : ideas.length === 0 ? (
          <p className="py-12 text-center text-sm text-[#6e6a6c]">
            No shortlisted ideas match the selected filters.
          </p>
        ) : (
          <IdeaMasonry key={`${teamId ?? "all"}:${categoryId ?? "all"}`}>
            {ideas.map((idea) => (
              <StageIdeaCard
                key={idea.ID}
                idea={idea}
                image={getImage(idea)}
                onPreview={() => setPreviewId(idea.ID)}
              />
            ))}
          </IdeaMasonry>
        )}
      </motion.main>
      <AnimatePresence>
        {previewIdea && (
          <StageIdeaPreviewDialog
            key="stage-preview"
            idea={previewIdea}
            image={getImage(previewIdea)}
            title={title}
            position={previewIndex + 1}
            total={ideas.length}
            onPrevious={() => {
              if (previewIndex > 0) setPreviewId(ideas[previewIndex - 1].ID)
            }}
            onNext={() => {
              if (previewIndex < ideas.length - 1)
                setPreviewId(ideas[previewIndex + 1].ID)
            }}
            onClose={() => setPreviewId(null)}
          />
        )}
      </AnimatePresence>
      <LiveActivityTicker
        activities={activities}
        isPending={activityPending}
        isError={activityError}
      />
    </motion.div>
  )
}
