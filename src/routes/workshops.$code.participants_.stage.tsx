import { StageScreen } from "@/components/participants/stage-screen"
import {
  ParticipantEntryError,
  ParticipantEntryLoading,
} from "@/components/participants/participant-route-feedback"
import { visitorIdOptions } from "@/lib/participant-identity"
import { getParticipantWorkshopOptions } from "@/services/participants"
import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/workshops/$code/participants_/stage")({
  head: () => ({ meta: [{ title: "Stage | Basecamp" }] }),
  loader: async ({ context, params }) => {
    const visitorId =
      await context.queryClient.ensureQueryData(visitorIdOptions)
    await context.queryClient.ensureQueryData(
      getParticipantWorkshopOptions({
        code: params.code,
        visitor_id: visitorId,
      })
    )
  },
  pendingComponent: ParticipantEntryLoading,
  errorComponent: ParticipantEntryError,
  component: StageRoute,
})

function StageRoute() {
  const { code } = Route.useParams()
  const { data: visitorId } = useSuspenseQuery(visitorIdOptions)
  const { data: response } = useSuspenseQuery(
    getParticipantWorkshopOptions({ code, visitor_id: visitorId })
  )
  return (
    <StageScreen
      key={code}
      workshop={response.data}
      workshopCode={code}
      visitorId={visitorId}
    />
  )
}
