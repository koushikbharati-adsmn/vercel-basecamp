import { IdeateScreen } from "@/components/participants/ideate-screen"
import { ParticipantVotingGate } from "@/components/participants/participant-voting-gate"
import {
  ParticipantEntryError,
  ParticipantEntryLoading,
} from "@/components/participants/participant-route-feedback"
import { visitorIdOptions } from "@/lib/participant-identity"
import { getParticipantWorkshopOptions } from "@/services/participants"
import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, redirect } from "@tanstack/react-router"

export const Route = createFileRoute("/workshops/$code/participants_/$teamId")({
  head: () => ({ meta: [{ title: "Ideate | Basecamp" }] }),
  loader: async ({ context, params }) => {
    const visitorId =
      await context.queryClient.ensureQueryData(visitorIdOptions)
    const { data: workshop } = await context.queryClient.ensureQueryData(
      getParticipantWorkshopOptions({
        code: params.code,
        visitor_id: visitorId,
      })
    )
    const teamId = Number(params.teamId)
    if (
      !workshop.teams.some((team) => team.ID === teamId) ||
      workshop.teamID !== teamId
    ) {
      throw redirect({
        to: "/workshops/$code/participants",
        params: { code: params.code },
        search: { selectTeam: true },
      })
    }
  },
  pendingComponent: ParticipantEntryLoading,
  errorComponent: ParticipantEntryError,
  component: TeamRoute,
})

function TeamRoute() {
  const { code, teamId } = Route.useParams()
  const { data: visitorId } = useSuspenseQuery(visitorIdOptions)
  const { data: response } = useSuspenseQuery(
    getParticipantWorkshopOptions({ code, visitor_id: visitorId })
  )
  return (
    <ParticipantVotingGate
      workshop={response.data}
      workshopCode={code}
      visitorId={visitorId}
    >
      <IdeateScreen
        key={`${code}:${teamId}`}
        workshop={response.data}
        workshopCode={code}
        visitorId={visitorId}
        teamId={Number(teamId)}
      />
    </ParticipantVotingGate>
  )
}
