import { IntroVideoScreen } from "@/components/participants/intro-video-screen"
import { LiveActivityTicker } from "@/components/participants/live-activity-ticker"
import { OrbitalEntry } from "@/components/participants/orbital-entry"
import { ParticipantVotingGate } from "@/components/participants/participant-voting-gate"
import {
  ParticipantEntryError,
  ParticipantEntryLoading,
} from "@/components/participants/participant-route-feedback"
import { TeamSelectionScreen } from "@/components/participants/team-selection-screen"
import { WalkthroughScreen } from "@/components/participants/walkthrough-screen"
import { useWorkshopActivities } from "@/hooks/use-workshop-activities"
import { visitorIdOptions } from "@/lib/participant-identity"
import { socket } from "@/lib/socket"
import { getActivitiesOptions } from "@/services/big-screen"
import { getParticipantWorkshopOptions } from "@/services/participants"
import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { AnimatePresence, motion } from "framer-motion"
import { useEffect, useMemo, useState } from "react"

export const Route = createFileRoute("/workshops/$code/participants")({
  validateSearch: (search: Record<string, unknown>) => ({
    selectTeam: search.selectTeam === true || search.selectTeam === "true",
  }),
  head: () => ({
    meta: [{ title: "Workshop Participants | Basecamp" }],
  }),
  loader: async ({ context, params }) => {
    const visitorId =
      await context.queryClient.ensureQueryData(visitorIdOptions)

    await Promise.all([
      context.queryClient.ensureQueryData(
        getParticipantWorkshopOptions({
          code: params.code,
          visitor_id: visitorId,
        })
      ),
      context.queryClient.ensureQueryData(
        getActivitiesOptions({ code: params.code, type: null })
      ),
    ])
  },
  pendingComponent: ParticipantEntryLoading,
  errorComponent: ParticipantEntryError,
  component: ParticipantEntryRoute,
})

function ParticipantEntryRoute() {
  const { code } = Route.useParams()
  const { selectTeam } = Route.useSearch()
  const navigate = Route.useNavigate()
  const { data: visitorId } = useSuspenseQuery(visitorIdOptions)
  const { data: workshopResponse } = useSuspenseQuery(
    getParticipantWorkshopOptions({ code, visitor_id: visitorId })
  )
  const { activities, isPending, isError } = useWorkshopActivities(code)
  const workshop = workshopResponse.data
  const introVideo = workshop.videoFileName?.trim() || null
  const [screen, setScreen] = useState<
    "entry" | "video" | "walkthrough" | "teams"
  >(selectTeam ? "teams" : "entry")
  const walkthroughSteps = useMemo(
    () =>
      [...workshop.walkThrough].sort(
        (first, second) => first.DisplayOrder - second.DisplayOrder
      ),
    [workshop.walkThrough]
  )

  useEffect(() => {
    const joinRoom = () => socket.emit("join_room", { roomId: code })
    socket.on("connect", joinRoom)
    if (socket.connected) joinRoom()
    return () => {
      socket.off("connect", joinRoom)
    }
  }, [code])

  const handleEntryComplete = () => {
    setScreen(introVideo ? "video" : "walkthrough")
  }

  return (
    <ParticipantVotingGate
      workshop={workshop}
      workshopCode={code}
      visitorId={visitorId}
      enabled={screen === "teams"}
    >
      <div className="min-h-dvh bg-app">
        <AnimatePresence mode="wait">
          {screen === "entry" && (
            <motion.div key="entry" exit={{ opacity: 0 }}>
              <OrbitalEntry
                workshopName={workshop.Name}
                onComplete={handleEntryComplete}
              />
            </motion.div>
          )}
          {screen === "video" && introVideo && (
            <motion.div
              key="video"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.1 } }}
            >
              <IntroVideoScreen
                src={introVideo}
                title={
                  workshop.videoTitle ??
                  "“Unless your advertising has a big idea, it will pass like a ship in the night.”"
                }
                subtitle={
                  workshop.videoSubTitle ??
                  "DAVID OGILVY · THE VIEW FROM TOUFFOU · 1981"
                }
                onComplete={() => setScreen("walkthrough")}
              />
            </motion.div>
          )}
          {screen === "walkthrough" && (
            <motion.div
              key="walkthrough"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <WalkthroughScreen
                steps={walkthroughSteps}
                onComplete={() => setScreen("teams")}
              />
            </motion.div>
          )}
          {screen === "teams" && (
            <motion.div
              key="teams"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <TeamSelectionScreen
                workshop={workshop}
                workshopCode={code}
                visitorId={visitorId}
                onComplete={(team) => {
                  void navigate({
                    to: "/workshops/$code/participants/$teamId",
                    params: { code, teamId: String(team.ID) },
                  })
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>
        <LiveActivityTicker
          activities={activities}
          isPending={isPending}
          isError={isError}
        />
      </div>
    </ParticipantVotingGate>
  )
}
