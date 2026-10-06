import { IntroVideoScreen } from '@/components/participants/intro-video-screen'
import { LiveActivityTicker } from '@/components/participants/live-activity-ticker'
import { OrbitalEntry } from '@/components/participants/orbital-entry'
import { TeamSelectionScreen } from '@/components/participants/team-selection-screen'
import { WalkthroughScreen } from '@/components/participants/walkthrough-screen'
import { useWorkshopActivities } from '@/hooks/use-workshop-activities'
import { getVisitorId } from '@/lib/fingerprint'
import { socket } from '@/lib/socket'
import { getActivitiesOptions } from '@/services/big-screen'
import { getParticipantWorkshopOptions } from '@/services/participants'
import { queryOptions, useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'

const visitorIdOptions = queryOptions({
  queryKey: ['PARTICIPANT_VISITOR_ID'],
  queryFn: getVisitorId,
  staleTime: Number.POSITIVE_INFINITY,
})

export const Route = createFileRoute('/workshops/$code/participants')({
  head: () => ({
    meta: [{ title: 'Workshop Participants | Basecamp' }],
  }),
  loader: async ({ context, params }) => {
    const visitorId = await context.queryClient.ensureQueryData(visitorIdOptions)

    await Promise.all([
      context.queryClient.ensureQueryData(
        getParticipantWorkshopOptions({ code: params.code, visitor_id: visitorId }),
      ),
      context.queryClient.ensureQueryData(getActivitiesOptions({ code: params.code, type: null })),
    ])
  },
  pendingComponent: ParticipantEntryLoading,
  errorComponent: ParticipantEntryError,
  component: ParticipantEntryRoute,
})

function ParticipantEntryRoute() {
  const { code } = Route.useParams()
  const { data: visitorId } = useSuspenseQuery(visitorIdOptions)
  const { data: workshopResponse } = useSuspenseQuery(
    getParticipantWorkshopOptions({ code, visitor_id: visitorId }),
  )
  const { activities, isPending, isError } = useWorkshopActivities(code)
  const workshop = workshopResponse.data
  const introVideo = workshop.videoFileName?.trim() || null
  const [screen, setScreen] = useState<'entry' | 'video' | 'walkthrough' | 'teams' | 'ready'>('entry')
  const [selectedTeamName, setSelectedTeamName] = useState<string>()
  const walkthroughSteps = useMemo(
    () => [...workshop.walkThrough].sort((first, second) => first.DisplayOrder - second.DisplayOrder),
    [workshop.walkThrough],
  )

  useEffect(() => {
    const joinRoom = () => socket.emit('join_room', { roomId: code })
    socket.on('connect', joinRoom)
    if (socket.connected) joinRoom()
    return () => {
      socket.off('connect', joinRoom)
    }
  }, [code])

  const handleEntryComplete = () => {
    setScreen(introVideo ? 'video' : 'walkthrough')
  }

  return (
    <div className="min-h-dvh bg-[#0d0c0d]">
      <AnimatePresence mode="wait">
        {screen === 'entry' && (
          <motion.div key="entry" exit={{ opacity: 0 }}>
            <OrbitalEntry workshopName={workshop.Name} onComplete={handleEntryComplete} />
          </motion.div>
        )}
        {screen === 'video' && introVideo && (
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
                '“Unless your advertising has a big idea, it will pass like a ship in the night.”'
              }
              subtitle={
                workshop.videoSubTitle ?? 'DAVID OGILVY · THE VIEW FROM TOUFFOU · 1981'
              }
              onComplete={() => setScreen('walkthrough')}
            />
          </motion.div>
        )}
        {screen === 'walkthrough' && (
          <motion.div key="walkthrough" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <WalkthroughScreen steps={walkthroughSteps} onComplete={() => setScreen('teams')} />
          </motion.div>
        )}
        {screen === 'teams' && (
          <motion.div key="teams" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <TeamSelectionScreen
              workshop={workshop}
              workshopCode={code}
              visitorId={visitorId}
              onComplete={(team) => {
                setSelectedTeamName(team.TeamName)
                setScreen('ready')
              }}
            />
          </motion.div>
        )}
        {screen === 'ready' && (
          <ParticipantReadyScreen
            key="ready"
            workshopName={workshop.Name}
            teamName={selectedTeamName}
          />
        )}
      </AnimatePresence>
      <LiveActivityTicker activities={activities} isPending={isPending} isError={isError} />
    </div>
  )
}

function ParticipantReadyScreen({ workshopName, teamName }: { workshopName: string; teamName?: string }) {
  return (
    <motion.main
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid min-h-dvh place-items-center bg-[#0d0c0d] px-6 pb-12 text-center text-white"
    >
      <div>
        <p className="text-xs font-bold tracking-[0.22em] text-[#eb3f43] uppercase">You’re in</p>
        <h1 className="font-display mt-4 text-4xl sm:text-6xl">{workshopName}</h1>
        <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-white/60">
          {teamName ? `You joined ${teamName}.` : 'Your participant workspace is ready.'}
        </p>
      </div>
    </motion.main>
  )
}

function ParticipantEntryLoading() {
  return (
    <main className="grid min-h-dvh place-items-center bg-[#0d0c0d] text-white">
      <div className="text-center">
        <span className="live-pulse mx-auto block size-2 rounded-full bg-[#e74246]" />
        <p className="mt-5 text-xs font-bold tracking-[0.2em] text-white/55 uppercase">Opening workshop</p>
      </div>
    </main>
  )
}

function ParticipantEntryError({ reset }: { reset: () => void }) {
  return (
    <main className="grid min-h-dvh place-items-center bg-[#0d0c0d] px-6 text-white">
      <div className="max-w-md text-center">
        <p className="text-xs font-bold tracking-[0.2em] text-[#e74246] uppercase">Unable to enter</p>
        <h1 className="orbital-display mt-4 text-4xl">We couldn’t open this workshop.</h1>
        <p className="mt-4 text-sm leading-6 text-white/55">Check the workshop code or your connection, then try again.</p>
        <button type="button" onClick={reset} className="mt-8 cursor-pointer border border-white/25 px-7 py-3 text-xs font-bold tracking-[0.16em] uppercase hover:bg-white/10">
          Try again
        </button>
      </div>
    </main>
  )
}
