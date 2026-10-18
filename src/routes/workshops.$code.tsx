import { ParticipantLayout } from "@/components/participants/participant-layout"
import {
  ParticipantEntryError,
  ParticipantEntryLoading,
} from "@/components/participants/participant-route-feedback"
import { visitorIdOptions } from "@/lib/participant-identity"
import { getParticipantWorkshopOptions } from "@/services/participants"
import { useSuspenseQuery } from "@tanstack/react-query"
import {
  createFileRoute,
  Outlet,
  redirect,
  useMatches,
} from "@tanstack/react-router"

export const Route = createFileRoute("/workshops/$code")({
  beforeLoad: ({ location, params }) => {
    // This route supplies the shared layout, not a standalone workshop page.
    if (/^\/workshops\/[^/]+\/?$/.test(location.pathname)) {
      throw redirect({
        to: "/workshops/$code/participants",
        params: { code: params.code },
        search: { selectTeam: false },
        replace: true,
      })
    }
  },
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
  component: ParticipantWorkshopRoute,
})

function ParticipantWorkshopRoute() {
  const { code } = Route.useParams()
  // Read the view and team from the same committed match, not a pending URL.
  const match = useMatches({ select: (matches) => matches.at(-1) })
  const teamId =
    match && "teamId" in match.params ? Number(match.params.teamId) : undefined
  const { data: visitorId } = useSuspenseQuery(visitorIdOptions)
  const { data: response } = useSuspenseQuery(
    getParticipantWorkshopOptions({ code, visitor_id: visitorId })
  )
  const view = match?.routeId.endsWith("/newsroom")
    ? "newsroom"
    : match?.routeId.endsWith("/stage")
      ? "stage"
      : match?.routeId.endsWith("/$teamId")
        ? "board"
        : null
  return (
    <ParticipantLayout
      key={code}
      workshop={response.data}
      workshopCode={code}
      view={view}
      teamId={teamId}
    >
      <Outlet />
    </ParticipantLayout>
  )
}
