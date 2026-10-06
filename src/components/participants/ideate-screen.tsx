import { LiveActivityTicker } from "@/components/participants/live-activity-ticker"
import { IdeaEditor } from "@/components/participants/idea-editor"
import { IdeaMasonry } from "@/components/participants/idea-masonry"
import { IdeateIdeaCard } from "@/components/participants/ideate-idea-card"
import { IdeaImageFullscreenDialog } from "@/components/participants/idea-image-fullscreen-dialog"
import { IMAGE_GENERATION_LIMIT } from "@/components/participants/participant-idea-constants"
import { SharpenDialog } from "@/components/participants/sharpen-dialog"
import { AnimatedDialog } from "@/components/experience/animated-dialog"
import { BEAT, DUR, EASE, STAGGER_DENSE } from "@/lib/motion"
import { useWorkshopActivities } from "@/hooks/use-workshop-activities"
import { useWorkshopTimer } from "@/hooks/use-workshop-timer"
import { socket } from "@/lib/socket"
import {
  getParticipantIdeasOptions,
  getParticipantWorkshopOptions,
  participantIdeaKeys,
  useGenerateIdeaImage,
  useScoutIdea,
  useShortlistIdea,
  participantIdeaMutationKeys,
  type GenerateIdeaImagePayload,
  type IdeaUpsertSocketPayload,
  type IdeaShortlistSocketPayload,
  type IdeaCoachSocketPayload,
  type IdeaImageSocketPayload,
  type ShortlistIdeaPayload,
  type ParticipantIdea,
  type ParticipantWorkshop,
} from "@/services/participants"
import {
  useMutationState,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { Binoculars, X } from "lucide-react"
import { useEffect, useState } from "react"

export function IdeateScreen({
  workshop,
  workshopCode,
  visitorId,
  teamId,
}: {
  workshop: ParticipantWorkshop
  workshopCode: string
  visitorId: string
  teamId: number
}) {
  const queryClient = useQueryClient()
  const reducedMotion = useReducedMotion()
  const team = workshop.teams.find((item) => item.ID === teamId)!
  const color = /^#[0-9a-f]{6}$/i.test(team.TeamColorCode)
    ? team.TeamColorCode
    : "#da291c"
  const rgb = color
    .slice(1)
    .match(/../g)!
    .map((hex) => parseInt(hex, 16))
  const lightBand = rgb[0] * 0.299 + rgb[1] * 0.587 + rgb[2] * 0.114 > 160
  const [categoryId, setCategoryId] = useState<number | null>(null)
  const category = workshop.category.find((item) => item.ID === categoryId)
  const [editor, setEditor] = useState<{
    idea?: ParticipantIdea
    description?: string
  } | null>(null)
  const [scoutOpen, setScoutOpen] = useState(false)
  const [previewId, setPreviewId] = useState<number | null>(null)
  const [sharpenId, setSharpenId] = useState<number | null>(null)
  const scout = useScoutIdea()
  const shortlist = useShortlistIdea()
  const generateImage = useGenerateIdeaImage()
  const pendingImages = useMutationState<number>({
    filters: {
      mutationKey: participantIdeaMutationKeys.generateImage,
      status: "pending",
    },
    select: (mutation) =>
      (mutation.state.variables as GenerateIdeaImagePayload).idea_id,
  })
  const pendingShortlists = useMutationState<number>({
    filters: {
      mutationKey: participantIdeaMutationKeys.shortlist,
      status: "pending",
    },
    select: (mutation) =>
      (mutation.state.variables as ShortlistIdeaPayload).idea_id,
  })
  const {
    activities,
    isPending: activityPending,
    isError: activityError,
  } = useWorkshopActivities(workshopCode)
  const { timer } = useWorkshopTimer(workshopCode)
  const ideasQueryOptions = getParticipantIdeasOptions({
    visitor_id: visitorId,
    workshop_code: workshopCode,
    team_id: teamId,
    category_id: categoryId,
    is_shortlisted: null,
    is_coached: null,
  })
  const ideasQuery = useQuery(ideasQueryOptions)
  const ideas = ideasQuery.data?.data ?? []
  const canIdeate = workshop.status === "Ideate" && workshop.teamID === teamId
  const scoutDisabledReason = !canIdeate
    ? "Scout is only available during ideation."
    : scout.isPending
      ? "Scout is reviewing your ideas…"
      : ideasQuery.isPending
        ? "Loading ideas…"
        : ideasQuery.isError
          ? "Load your ideas before using Scout."
          : !category
            ? "Select a pillar to use Scout."
            : ideas.length === 0
              ? "Add an idea to this pillar to use Scout."
              : undefined
  const previewIdea = ideas.find((idea) => idea.ID === previewId)
  const sharpenIdea = ideas.find((idea) => idea.ID === sharpenId)
  const handleGenerateImage = (idea: ParticipantIdea) => {
    if (
      !canIdeate ||
      pendingImages.includes(idea.ID) ||
      idea.imgCount >= IMAGE_GENERATION_LIMIT
    )
      return
    generateImage.mutate({
      idea_id: idea.ID,
      workshop_code: workshopCode,
      pillar_context:
        workshop.category.find((item) => item.ID === idea.CategoryID)
          ?.Context ?? "",
      workshop_context: workshop.WorkshopContext,
      user_idea: idea.Desc,
      brand_guidelines: workshop.GuidelineFileName,
    })
  }

  useEffect(() => {
    const handleIdeaUpserted = ({
      roomId,
      idea: socketIdea,
    }: IdeaUpsertSocketPayload) => {
      if (roomId !== workshopCode) return
      queryClient.setQueryData(ideasQueryOptions.queryKey, (oldData) => {
        if (!oldData?.data) return oldData
        const existing = oldData.data.find(
          (idea) => idea.ID === socketIdea.ideaId
        )
        const matchesFilters =
          socketIdea.teamId === teamId &&
          (categoryId === null || socketIdea.categoryId === categoryId)
        if (!matchesFilters) {
          return existing
            ? {
                ...oldData,
                data: oldData.data.filter(
                  (idea) => idea.ID !== socketIdea.ideaId
                ),
              }
            : oldData
        }
        const updatedIdea: ParticipantIdea = {
          ID: socketIdea.ideaId,
          imageFileName: "",
          TotalVote: 0,
          flgSelf: false,
          flgTeam: false,
          flgCoach: false,
          CreatedDttm: new Date(
            Date.now() + 5.5 * 60 * 60 * 1000
          ).toISOString(),
          imgCount: 0,
          ...existing,
          TeamID: socketIdea.teamId,
          TeamName:
            workshop.teams.find((team) => team.ID === socketIdea.teamId)
              ?.TeamName ?? "",
          CategoryID: socketIdea.categoryId,
          CategoryName: socketIdea.categoryName,
          Desc: socketIdea.desc,
          title: socketIdea.title,
          Context: socketIdea.context,
        }
        return {
          ...oldData,
          data: existing
            ? oldData.data.map((idea) =>
                idea.ID === updatedIdea.ID ? updatedIdea : idea
              )
            : [...oldData.data, updatedIdea],
        }
      })
    }
    const handleIdeaShortlistUpdated = ({
      roomId,
      idea: socketIdea,
      isShortlisted,
    }: IdeaShortlistSocketPayload) => {
      if (roomId !== workshopCode) return
      queryClient.setQueryData(ideasQueryOptions.queryKey, (oldData) => {
        if (!oldData?.data) return oldData
        const exists = oldData.data.some((idea) => idea.ID === socketIdea.ID)
        const matchesFilters =
          socketIdea.TeamID === teamId &&
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
                idea.ID === socketIdea.ID
                  ? { ...idea, flgTeam: isShortlisted }
                  : idea
              )
            : [...oldData.data, { ...socketIdea, flgTeam: isShortlisted }],
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
        const exists = oldData.data.some((idea) => idea.ID === socketIdea.ID)
        const matchesFilters =
          socketIdea.TeamID === teamId &&
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
                idea.ID === socketIdea.ID ? { ...idea, flgCoach } : idea
              )
            : [...oldData.data, { ...socketIdea, flgCoach }],
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
    workshop.teams,
    queryClient,
    ideasQueryOptions.queryKey,
  ])

  useEffect(() => {
    const reconnect = () => {
      // Reconnect is the only refetch: recover changes missed while disconnected.
      void queryClient.invalidateQueries({ queryKey: participantIdeaKeys.all })
      void queryClient.invalidateQueries({
        queryKey: getParticipantWorkshopOptions({
          code: workshopCode,
          visitor_id: visitorId,
        }).queryKey,
      })
    }
    const statusChanged = ({
      roomId,
      status,
    }: {
      roomId: string
      status: ParticipantWorkshop["status"]
    }) => {
      if (roomId !== workshopCode) return
      queryClient.setQueryData(
        getParticipantWorkshopOptions({
          code: workshopCode,
          visitor_id: visitorId,
        }).queryKey,
        (current) =>
          current ? { ...current, data: { ...current.data, status } } : current
      )
    }
    socket.on("connect", reconnect)
    socket.on("workshop_status", statusChanged)
    return () => {
      socket.off("connect", reconnect)
      socket.off("workshop_status", statusChanged)
    }
  }, [queryClient, visitorId, workshopCode])

  // Nest the editor under the active modal so native dialog focus/inertness works.
  const ideaDialog = editor ? (
    <IdeaEditor
      key={editor.idea?.ID ?? "new"}
      workshop={workshop}
      workshopCode={workshopCode}
      visitorId={visitorId}
      teamId={teamId}
      idea={editor.idea}
      description={editor.description}
      canEdit={canIdeate}
      onClose={() => setEditor(null)}
      onSaved={(savedIdea) => {
        queryClient.setQueryData(ideasQueryOptions.queryKey, (oldData) => {
          if (!oldData?.data) return oldData
          const exists = oldData.data.some((idea) => idea.ID === savedIdea.ID)
          const matchesFilters =
            savedIdea.TeamID === teamId &&
            (categoryId === null || savedIdea.CategoryID === categoryId)
          if (!matchesFilters) {
            return exists
              ? {
                  ...oldData,
                  data: oldData.data.filter((idea) => idea.ID !== savedIdea.ID),
                }
              : oldData
          }
          return {
            ...oldData,
            data: exists
              ? oldData.data.map((idea) =>
                  idea.ID === savedIdea.ID ? savedIdea : idea
                )
              : [...oldData.data, savedIdea],
          }
        })
        if (savedIdea.ID === sharpenId) setSharpenId(null)
        setEditor(null)
      }}
    />
  ) : null

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
        <div className="flex min-w-0 items-center gap-4">
          <Link
            to="/workshops/$code/participants"
            params={{ code: workshopCode }}
            search={{
              selectTeam: true,
            }}
            aria-label="Basecamp home"
          >
            <img
              src="/logos/ogilvy-logo-white.svg"
              alt="Ogilvy"
              className="h-[26px] brightness-0"
            />
          </Link>
          <span className="h-5 w-px bg-[#231f20]/15" />
          <Link
            to="/workshops/$code/participants"
            params={{ code: workshopCode }}
            search={{ selectTeam: true }}
            className="rounded border-2 px-3 py-1.5 text-xs font-bold tracking-[.12em] uppercase"
            style={{ borderColor: color }}
            aria-label="Change team"
          >
            {team.TeamName} ▾
          </Link>
          <span className="font-display hidden text-[28px] md:block">
            {workshop.IdeationPage || "The Board"}
          </span>
        </div>
        <div className="flex items-center gap-5 text-xs font-bold tracking-[.12em] text-[#6e6a6c] uppercase">
          <Link
            to="/workshops/$code/participants/stage"
            params={{ code: workshopCode }}
            className="hover:text-[#231f20]"
          >
            Stage
          </Link>
          {timer.durationSeconds > 0 && (
            <span className="tabular-nums" role="timer">
              {Math.floor(timer.remainingSeconds / 60)
                .toString()
                .padStart(2, "0")}
              :{(timer.remainingSeconds % 60).toString().padStart(2, "0")}
            </span>
          )}
          <span>{workshop.status || "Waiting to begin"}</span>
        </div>
      </motion.header>

      <section
        className="relative overflow-hidden px-5 py-6 sm:px-12"
        style={{
          color: lightBand ? "#231f20" : "#fff",
        }}
      >
        <motion.div
          aria-hidden="true"
          className="ideate-hero absolute inset-0 origin-left"
          style={{ backgroundColor: color }}
          initial={{ scaleX: reducedMotion ? 1 : 0 }}
          animate={{ scaleX: 1 }}
          transition={{
            duration: reducedMotion ? 0 : DUR.draw,
            delay: reducedMotion ? 0 : BEAT.hero,
            ease: EASE,
          }}
        />
        <motion.div
          initial={{ opacity: 0, x: reducedMotion ? 0 : -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{
            duration: reducedMotion ? 0 : DUR.beat,
            delay: reducedMotion ? 0 : BEAT.content,
            ease: EASE,
          }}
          className="relative z-10"
        >
          <p className="mb-2 text-xs font-bold tracking-[.22em] uppercase">
            Team {team.TeamName}
          </p>
          <h1 className="font-display text-[clamp(38px,4.6vw,66px)] leading-[1.05]">
            {team.Description || workshop.Name}
          </h1>
        </motion.div>
      </section>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{
          duration: reducedMotion ? 0 : DUR.beat,
          delay: reducedMotion ? 0 : BEAT.content,
          ease: EASE,
        }}
        className="overflow-x-auto border-b border-[#231f20]/15 px-5 sm:px-12"
      >
        <div
          className="flex w-max min-w-full"
          role="tablist"
          aria-label="Idea pillars"
        >
          {[{ ID: null, Name: "All" }, ...workshop.category].map((item) => {
            return (
              <button
                key={item.ID ?? "all"}
                type="button"
                role="tab"
                aria-selected={categoryId === item.ID}
                onClick={() => {
                  setCategoryId(item.ID)
                  setScoutOpen(false)
                  scout.reset()
                }}
                className={`relative flex items-center gap-2 px-4 py-5 text-[13px] font-bold tracking-[.12em] uppercase sm:px-6 ${categoryId === item.ID ? "text-[#231f20]" : "text-[#8a8689]"}`}
              >
                {item.Name}
                {categoryId === item.ID && (
                  <motion.span
                    initial={{ scaleX: reducedMotion ? 1 : 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{
                      duration: reducedMotion ? 0 : DUR.cut,
                      ease: EASE,
                    }}
                    className="absolute right-4 bottom-0 left-4 h-[3px] origin-left bg-[#231f20]"
                  />
                )}
              </button>
            )
          })}
        </div>
      </motion.div>

      <motion.main
        initial={{ opacity: 0, y: reducedMotion ? 0 : 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: reducedMotion ? 0 : DUR.beat,
          delay: reducedMotion ? 0 : BEAT.detail,
          ease: EASE,
        }}
        className="px-5 pt-6 pb-12 sm:px-12"
      >
        {!canIdeate && (
          <p className="mb-5 text-sm text-[#6e6a6c]" role="status">
            {workshop.status === null
              ? "Your facilitator hasn’t opened ideation yet."
              : "Ideation is closed. You can still explore your team’s ideas."}
          </p>
        )}
        {workshop.category.length === 0 && (
          <p className="mb-5 text-sm text-[#6e6a6c]">
            No categories are available yet. Ask your facilitator to add one.
          </p>
        )}
        <IdeaMasonry key={categoryId ?? "all"}>
          <div className="grid h-24 grid-cols-2 gap-2">
            <button
              type="button"
              disabled={!canIdeate || workshop.category.length === 0}
              onClick={() => setEditor({})}
              className="ideate-pocket text-base"
            >
              + Add an idea
            </button>
            <button
              type="button"
              disabled={Boolean(scoutDisabledReason)}
              title={scoutDisabledReason}
              onClick={() => {
                if (!category || scoutDisabledReason) return
                if (scout.data) {
                  setScoutOpen(true)
                  return
                }
                scout.mutate(
                  {
                    workshop_code: workshopCode,
                    pillar_title: category.Name,
                    user_ideas: ideas.map((idea) => idea.Desc),
                  },
                  {
                    onSuccess: (response) => {
                      if (response.success) setScoutOpen(true)
                    },
                  }
                )
              }}
              className="ideate-pocket flex flex-col items-center justify-center gap-1.5"
            >
              <Binoculars size={26} strokeWidth={1.5} />
              <span className="text-[15px] font-bold">The Scout</span>
              <span className="px-2 text-center text-xs leading-4 text-[#8a8689]">
                {scoutDisabledReason ??
                  (scout.data
                    ? `${scout.data.data.text.length} pitches ready`
                    : "Ask for a pitch")}
              </span>
            </button>
          </div>
          {ideasQuery.isPending && (
            <p className="text-sm text-[#8a8689]" role="status">
              Loading your team’s ideas…
            </p>
          )}
          {ideasQuery.isError && (
            <div role="alert">
              <p>We couldn’t load your ideas.</p>
              <button
                type="button"
                onClick={() => void ideasQuery.refetch()}
                className="mt-2 underline"
              >
                Try again
              </button>
            </div>
          )}
          {ideasQuery.isSuccess && ideas.length === 0 && (
            <p className="py-6 text-base leading-relaxed text-[#8a8689]">
              {category
                ? "No ideas in this pillar yet. Add the first idea."
                : "The board is empty. Add the first idea and choose its pillar."}
            </p>
          )}
          {ideas.map((idea, index) => (
            <IdeateIdeaCard
              key={idea.ID}
              idea={idea}
              number={index + 1}
              canEdit={canIdeate}
              canSharpen={workshop.coaches.length > 0}
              isGeneratingImage={pendingImages.includes(idea.ID)}
              isShortlisting={pendingShortlists.includes(idea.ID)}
              onEdit={() => setEditor({ idea })}
              onPreview={() => setPreviewId(idea.ID)}
              onGenerateImage={() => handleGenerateImage(idea)}
              onSharpen={() => setSharpenId(idea.ID)}
              onShortlist={() => {
                if (!canIdeate || pendingShortlists.includes(idea.ID)) return
                shortlist.mutate({
                  workshop_code: workshopCode,
                  idea_id: idea.ID,
                  flag: !idea.flgTeam,
                  idea,
                })
              }}
            />
          ))}
        </IdeaMasonry>
      </motion.main>

      <AnimatePresence>{!sharpenIdea && ideaDialog}</AnimatePresence>
      <AnimatePresence>
        {previewIdea?.imageFileName?.trim() && (
          <IdeaImageFullscreenDialog
            key={previewIdea.ID}
            idea={previewIdea}
            onClose={() => setPreviewId(null)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {sharpenIdea && (
          <SharpenDialog
            key={sharpenIdea.ID}
            idea={sharpenIdea}
            workshop={workshop}
            workshopCode={workshopCode}
            visitorId={visitorId}
            canEdit={canIdeate}
            onClose={() => setSharpenId(null)}
            onEdit={() => {
              setEditor({ idea: sharpenIdea })
            }}
          >
            {ideaDialog}
          </SharpenDialog>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {scoutOpen && (
          <AnimatedDialog
            key="scout"
            onClose={() => setScoutOpen(false)}
            className="ideate-dialog"
            aria-labelledby="scout-title"
          >
            <div className="flex items-center justify-between gap-4">
              <h2 id="scout-title" className="font-display text-3xl">
                The Scout
              </h2>
              <button
                type="button"
                onClick={() => setScoutOpen(false)}
                aria-label="Close Scout"
              >
                <X size={22} />
              </button>
            </div>
            <p className="mt-2 text-sm text-[#8a8689]">
              Fresh directions for {category?.Name}.
            </p>
            <div className="mt-6 space-y-4">
              {scout.data?.data.text.length === 0 && (
                <p>
                  No pitches came back.{" "}
                  <button
                    type="button"
                    className="underline"
                    onClick={() => {
                      scout.reset()
                      setScoutOpen(false)
                    }}
                  >
                    Try again
                  </button>
                </p>
              )}
              {scout.data?.data.text.map((pitch, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: reducedMotion ? 0 : 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: reducedMotion ? 0 : DUR.beat,
                    delay: reducedMotion
                      ? 0
                      : Math.min(index, 6) * STAGGER_DENSE,
                    ease: EASE,
                  }}
                  className="border border-[#231f20]/20 p-5"
                >
                  <p className="text-lg leading-relaxed">{pitch}</p>
                </motion.div>
              ))}
            </div>
          </AnimatedDialog>
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
