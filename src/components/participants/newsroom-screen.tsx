import { HalftoneBackground } from "@/components/experience/halftone-background"
import { LiveActivityTicker } from "@/components/participants/live-activity-ticker"
import { useWorkshopActivities } from "@/hooks/use-workshop-activities"
import { formatActivityTime } from "@/lib/date"
import { BEAT, DUR, EASE, STAGGER_DENSE } from "@/lib/motion"
import { socket } from "@/lib/socket"
import { getReadableTextColor } from "@/lib/utils"
import { getDashboardOptions } from "@/services/big-screen"
import {
  type IdeaCoachSocketPayload,
  type IdeaShortlistSocketPayload,
  type IdeaUpsertSocketPayload,
  type ParticipantWorkshop,
} from "@/services/participants"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { useEffect } from "react"

export function NewsroomScreen({
  workshop,
  workshopCode,
}: {
  workshop: ParticipantWorkshop
  workshopCode: string
}) {
  const queryClient = useQueryClient()
  const reducedMotion = useReducedMotion()
  const dashboardQueryOptions = getDashboardOptions(workshopCode)
  const dashboardQuery = useQuery(dashboardQueryOptions)
  const dashboard = dashboardQuery.data?.data
  const {
    activities,
    isPending: activityPending,
    isError: activityError,
    refetch: refetchActivities,
  } = useWorkshopActivities(workshopCode)
  const title = workshop.StatsBoard || "The Newsroom"

  useEffect(() => {
    const joinRoom = () => socket.emit("join_room", { roomId: workshopCode })
    socket.on("connect", joinRoom)
    if (socket.connected) joinRoom()
    return () => {
      socket.off("connect", joinRoom)
    }
  }, [workshopCode])

  useEffect(() => {
    const updateDashboard = (
      teamId: number,
      delta: {
        draft?: number
        shortlisted?: number
        sharpened?: number
        totalIdeas?: number
      }
    ) => {
      const {
        draft = 0,
        shortlisted = 0,
        sharpened = 0,
        totalIdeas = 0,
      } = delta
      queryClient.setQueryData(dashboardQueryOptions.queryKey, (current) => {
        if (!current) return current
        return {
          ...current,
          data: {
            ...current.data,
            overall: {
              ...current.data.overall,
              Draft: current.data.overall.Draft + draft,
              Shortlisted: current.data.overall.Shortlisted + shortlisted,
              Sharpened: current.data.overall.Sharpened + sharpened,
              TotalIdeas: current.data.overall.TotalIdeas + totalIdeas,
            },
            teams: current.data.teams.map((team) =>
              team.TeamID === teamId
                ? {
                    ...team,
                    Drafts: team.Drafts + draft,
                    Shortlisted: team.Shortlisted + shortlisted,
                    Sharpened: team.Sharpened + sharpened,
                    TotalIdeas: team.TotalIdeas + totalIdeas,
                  }
                : team
            ),
          },
        }
      })
    }
    const handleIdeaUpserted = ({
      roomId,
      action,
      idea,
    }: IdeaUpsertSocketPayload) => {
      if (roomId !== workshopCode || action !== "add") return
      updateDashboard(idea.teamId, { draft: 1, totalIdeas: 1 })
    }
    const handleIdeaShortlistUpdated = ({
      roomId,
      isShortlisted,
      idea,
    }: IdeaShortlistSocketPayload) => {
      if (roomId !== workshopCode) return
      const delta = isShortlisted ? 1 : -1
      updateDashboard(idea.TeamID, { draft: -delta, shortlisted: delta })
    }
    const handleIdeaCoachUpdated = ({
      roomId,
      flgCoach,
      idea,
    }: IdeaCoachSocketPayload) => {
      if (roomId !== workshopCode) return
      updateDashboard(idea.TeamID, { sharpened: flgCoach ? 1 : -1 })
    }
    socket.on("idea_upserted", handleIdeaUpserted)
    socket.on("idea_shortlist_updated", handleIdeaShortlistUpdated)
    socket.on("idea_coach_updated", handleIdeaCoachUpdated)
    return () => {
      socket.off("idea_upserted", handleIdeaUpserted)
      socket.off("idea_shortlist_updated", handleIdeaShortlistUpdated)
      socket.off("idea_coach_updated", handleIdeaCoachUpdated)
    }
  }, [queryClient, workshopCode, dashboardQueryOptions.queryKey])

  const summary = [
    { label: "Drafts", value: dashboard?.overall.Draft ?? 0 },
    { label: "Shortlisted", value: dashboard?.overall.Shortlisted ?? 0 },
    { label: "Sharpened", value: dashboard?.overall.Sharpened ?? 0 },
    { label: "Total ideas", value: dashboard?.overall.TotalIdeas ?? 0 },
  ]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: reducedMotion ? 0 : DUR.cut }}
      className="relative isolate min-h-dvh bg-newsroom pb-14 text-inverse"
    >
      <HalftoneBackground />
      <motion.header
        initial={{ opacity: 0, y: reducedMotion ? 0 : -56 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: reducedMotion ? 0 : DUR.beat,
          delay: reducedMotion ? 0 : BEAT.structure,
          ease: EASE,
        }}
        className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-4 border-b border-line-inverse/15 bg-newsroom/95 px-5 py-4 backdrop-blur-lg sm:px-12"
      >
        <div className="flex min-w-0 flex-wrap items-center gap-4">
          <Link
            to="/workshops/$code/participants"
            params={{ code: workshopCode }}
            search={{ selectTeam: true }}
            aria-label="Basecamp home"
          >
            <img
              src="/logos/ogilvy-logo-white.svg"
              alt="Ogilvy"
              className="h-[26px]"
            />
          </Link>
          <span className="h-5 w-px bg-tint-inverse/20" />
          <h1 className="font-display text-[28px] capitalize">{title}</h1>
          <span className="inline-flex items-center gap-2 border border-line-inverse/15 bg-tint-inverse/5 px-2.5 py-1 text-[10px] font-bold tracking-[.16em]">
            <span
              aria-hidden="true"
              className="size-1.5 rounded-full bg-action"
            />
            LIVE
          </span>
        </div>
        <nav
          aria-label="Workshop views"
          className="flex items-center gap-5 text-xs font-bold tracking-[.15em] uppercase sm:gap-8 sm:text-sm"
        >
          {workshop.teamID !== null ? (
            <Link
              to="/workshops/$code/participants/$teamId"
              params={{ code: workshopCode, teamId: String(workshop.teamID) }}
              className="text-newsroom-muted hover:text-inverse"
            >
              The Board
            </Link>
          ) : (
            <Link
              to="/workshops/$code/participants"
              params={{ code: workshopCode }}
              search={{ selectTeam: true }}
              className="text-newsroom-muted hover:text-inverse"
            >
              Choose team
            </Link>
          )}
          <Link
            to="/workshops/$code/participants/stage"
            params={{ code: workshopCode }}
            className="text-newsroom-muted hover:text-inverse"
          >
            The Stage
          </Link>
          <span aria-current="page" className="text-action">
            The Newsroom
          </span>
        </nav>
      </motion.header>
      <main className="relative z-10 mx-auto max-w-[1400px] px-5 pt-8 pb-12 sm:px-10">
        {dashboardQuery.isPending ? (
          <div
            role="status"
            aria-label="Loading newsroom statistics"
            className="grid grid-cols-2 border-y border-line-inverse/15 lg:grid-cols-4"
          >
            {summary.map((stat) => (
              <div
                key={stat.label}
                className="border-line-inverse/15 px-4 py-7 sm:px-8"
              >
                <div className="h-20 bg-tint-inverse/5" />
                <p className="mt-3 text-xs tracking-widest text-newsroom-muted uppercase">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        ) : dashboardQuery.isError ? (
          <div
            role="alert"
            className="border-y border-line-inverse/15 py-12 text-center"
          >
            <h2 className="text-lg font-bold">
              Unable to load newsroom statistics
            </h2>
            <p className="mt-2 text-sm text-newsroom-muted">
              Check the connection and try again.
            </p>
            <button
              type="button"
              onClick={() => void dashboardQuery.refetch()}
              className="mt-4 border border-line-inverse/25 px-4 py-2 text-xs font-bold"
            >
              Retry statistics
            </button>
          </div>
        ) : (
          <>
            <motion.dl
              initial={{ opacity: 0, y: reducedMotion ? 0 : 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: reducedMotion ? 0 : DUR.beat,
                delay: reducedMotion ? 0 : BEAT.hero,
                ease: EASE,
              }}
              className="grid grid-cols-2 border-t border-line-inverse/15 lg:grid-cols-4"
            >
              {summary.map((stat, index) => (
                <div
                  key={stat.label}
                  className={`flex min-w-0 flex-col-reverse gap-3 border-b border-line-inverse/15 px-4 py-6 sm:px-8 sm:py-7 ${index % 2 === 1 ? "border-l" : ""} ${index === 2 ? "lg:border-l" : ""}`}
                >
                  <dt className="text-[11px] font-bold tracking-[3px] text-newsroom-muted uppercase sm:text-[clamp(13px,0.8125vw,18px)]">
                    {stat.label}
                  </dt>
                  <dd className="font-display text-[48px] leading-none tabular-nums sm:text-[clamp(84px,5.25vw,112px)]">
                    {stat.value.toLocaleString()}
                  </dd>
                </div>
              ))}
            </motion.dl>
            <motion.section
              aria-labelledby="newsroom-teams-title"
              initial={{ opacity: 0, y: reducedMotion ? 0 : 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: reducedMotion ? 0 : DUR.beat,
                delay: reducedMotion ? 0 : BEAT.content,
                ease: EASE,
              }}
              className="mt-10"
            >
              <div className="hidden grid-cols-[minmax(0,1.5fr)_repeat(4,minmax(0,1fr))] pb-3 text-center text-[13px] font-bold tracking-[3px] text-newsroom-muted uppercase lg:grid">
                <span className="pl-7 text-left">Team</span>
                {summary.map((stat) => (
                  <span key={stat.label}>{stat.label}</span>
                ))}
              </div>
              <ul className="border-t border-line-inverse/15">
                {(dashboard?.teams ?? []).map((team, index) => {
                  const config = workshop.teams.find(
                    (item) => item.ID === team.TeamID
                  )
                  const color = config?.TeamColorCode
                  const stats = [
                    { label: "Drafts", value: team.Drafts },
                    { label: "Shortlisted", value: team.Shortlisted },
                    { label: "Sharpened", value: team.Sharpened },
                    { label: "Total ideas", value: team.TotalIdeas },
                  ]
                  return (
                    <motion.li
                      key={team.TeamID}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{
                        duration: reducedMotion ? 0 : DUR.cut,
                        delay: reducedMotion
                          ? 0
                          : Math.min(index, 6) * STAGGER_DENSE,
                        ease: EASE,
                      }}
                      className="grid grid-cols-2 border-b border-l-[6px] border-b-white/15 lg:grid-cols-[minmax(0,1.5fr)_repeat(4,minmax(0,1fr))]"
                      style={{ borderLeftColor: color }}
                    >
                      <div className="col-span-2 flex min-w-0 flex-col justify-center px-5 pt-5 lg:col-span-1 lg:py-6">
                        <h3 className="text-2xl leading-tight font-bold break-words sm:text-[clamp(32px,2vw,42px)]">
                          {team.TeamName || config?.TeamName || "Unknown team"}
                        </h3>
                        {config?.Description && (
                          <p className="mt-1 line-clamp-2 text-[clamp(16px,1vw,20px)] text-newsroom-muted">
                            {config.Description}
                          </p>
                        )}
                      </div>
                      {stats.map((stat) => (
                        <dl
                          key={stat.label}
                          className="min-w-0 px-5 py-5 lg:text-center"
                        >
                          <dt className="mb-2 text-[10px] font-bold tracking-widest text-newsroom-muted uppercase lg:sr-only">
                            {stat.label}
                          </dt>
                          <dd className="font-display text-[42px] leading-none tabular-nums sm:text-[clamp(52px,3.25vw,72px)]">
                            {stat.value.toLocaleString()}
                          </dd>
                        </dl>
                      ))}
                    </motion.li>
                  )
                })}
              </ul>
              {dashboard?.teams.length === 0 && (
                <p className="border-b border-line-inverse/15 py-8 text-center text-sm text-newsroom-muted">
                  Team statistics will appear here as the workshop gets going.
                </p>
              )}
            </motion.section>
          </>
        )}
        <motion.section
          aria-labelledby="newsroom-wire-title"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            duration: reducedMotion ? 0 : DUR.beat,
            delay: reducedMotion ? 0 : BEAT.detail,
            ease: EASE,
          }}
          className="mt-10"
        >
          <h2
            id="newsroom-wire-title"
            className="mb-4 text-[13px] font-bold tracking-[3px] text-newsroom-muted uppercase"
          >
            The wire
          </h2>
          {activityPending ? (
            <p
              role="status"
              className="border-y border-line-inverse/15 py-8 text-center text-sm text-newsroom-muted"
            >
              Loading latest activity…
            </p>
          ) : activityError ? (
            <div
              role="alert"
              className="flex flex-wrap items-center justify-between gap-3 border-y border-line-inverse/15 py-6"
            >
              <p className="text-sm text-newsroom-muted">
                Unable to load activity.
              </p>
              <button
                type="button"
                onClick={() => void refetchActivities()}
                className="border border-line-inverse/25 px-4 py-2 text-xs font-bold"
              >
                Retry activity
              </button>
            </div>
          ) : activities.length === 0 ? (
            <p className="border-y border-line-inverse/15 py-8 text-center text-sm text-newsroom-muted">
              Quiet so far. Activity crosses the wire as teams work.
            </p>
          ) : (
            <ul className="border-t border-line-inverse/15">
              <AnimatePresence initial={false}>
                {activities.map((activity) => {
                  const teamColor =
                    activity.TeamColorCode ||
                    workshop.teams.find(
                      (team) => team.TeamName === activity.TeamName
                    )?.TeamColorCode

                  return (
                    <motion.li
                      key={activity.ID}
                      initial={{ opacity: 0, y: reducedMotion ? 0 : 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{
                        duration: reducedMotion ? 0 : DUR.cut,
                        ease: EASE,
                      }}
                      className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-line-inverse/10 px-2 py-3"
                    >
                      <time
                        dateTime={activity.CreatedDttm}
                        className="shrink-0 font-mono text-[11px] text-newsroom-muted"
                      >
                        {formatActivityTime(activity.CreatedDttm)}
                      </time>
                      <span
                        className="shrink-0 px-2 py-0.5 text-[10px] font-bold tracking-[0.1em] uppercase"
                        style={{
                          backgroundColor: teamColor,
                          color: teamColor
                            ? getReadableTextColor(teamColor)
                            : undefined,
                        }}
                      >
                        {activity.TeamName || "Unknown team"}
                      </span>
                      <p className="min-w-0 basis-full text-sm leading-relaxed break-words text-inverse/75 sm:flex-1 sm:basis-auto sm:text-base">
                        {activity.Message}
                      </p>
                      <span className="ml-auto shrink-0 text-[10px] font-bold tracking-[.16em] text-newsroom-muted uppercase">
                        {activity.Type}
                      </span>
                    </motion.li>
                  )
                })}
              </AnimatePresence>
            </ul>
          )}
        </motion.section>
      </main>
      <LiveActivityTicker
        activities={activities}
        isPending={activityPending}
        isError={activityError}
      />
    </motion.div>
  )
}
