import { NewsroomScreen } from "@/components/participants/newsroom-screen"
import {
  ParticipantEntryError,
  ParticipantEntryLoading,
} from "@/components/participants/participant-route-feedback"
import { visitorIdOptions } from "@/lib/participant-identity"
import { getParticipantWorkshopOptions } from "@/services/participants"
import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/workshops/$code/participants_/newsroom")(
  {
    head: () => ({ meta: [{ title: "Newsroom | Basecamp" }] }),
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
    component: NewsroomRoute,
  }
)

function NewsroomRoute() {
  const { code } = Route.useParams()
  const { data: visitorId } = useSuspenseQuery(visitorIdOptions)
  const { data: response } = useSuspenseQuery(
    getParticipantWorkshopOptions({ code, visitor_id: visitorId })
  )
  return (
    <NewsroomScreen key={code} workshop={response.data} workshopCode={code} />
  )
}
