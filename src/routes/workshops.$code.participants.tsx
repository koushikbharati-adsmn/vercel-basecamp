import { LiveActivityTicker } from '@/components/participants/live-activity-ticker'
import { OrbitalEntry } from '@/components/participants/orbital-entry'
import { useWorkshopActivities } from '@/hooks/use-workshop-activities'
import { getVisitorId } from '@/lib/fingerprint'
import { socket } from '@/lib/socket'
import { getActivitiesOptions } from '@/services/big-screen'
import { getParticipantWorkshopOptions } from '@/services/participants'
import { queryOptions, useSuspenseQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useEffect } from 'react'

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

  useEffect(() => {
    const joinRoom = () => socket.emit('join_room', { roomId: code })
    socket.on('connect', joinRoom)
    if (socket.connected) joinRoom()
    return () => {
      socket.off('connect', joinRoom)
    }
  }, [code])

  return (
    <div className="min-h-dvh bg-[#0d0c0d]">
      <OrbitalEntry workshopName={workshopResponse.data.Name} />
      <LiveActivityTicker activities={activities} isPending={isPending} isError={isError} />
    </div>
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
