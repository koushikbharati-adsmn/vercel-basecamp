import type {
  GetParticipantVoteIdeasResponse,
  ParticipantIdea,
  ParticipantWorkshop,
} from "@/services/participants"

export function getVotingUsage(
  response: GetParticipantVoteIdeasResponse | undefined,
  scope: ParticipantWorkshop["votingScope"],
  categoryId: number | undefined
) {
  return scope === "workshop"
    ? (response?.usage.workshopWise ?? 0)
    : (response?.usage.pillarWise.find(
        (pillar) => pillar.categoryId === categoryId
      )?.votes ?? 0)
}

/** Use an authoritative pre-event row to update even filters that omit this idea. */
export function applyParticipantVote(
  current: GetParticipantVoteIdeasResponse,
  previousIdea: ParticipantIdea,
  isVoted: boolean
): GetParticipantVoteIdeasResponse {
  if (previousIdea.flgSelf === isVoted) return current
  const delta = isVoted ? 1 : -1
  const pillarWise = current.usage.pillarWise.map((pillar) =>
    pillar.categoryId === previousIdea.CategoryID
      ? { ...pillar, votes: Math.max(0, pillar.votes + delta) }
      : pillar
  )
  if (
    !pillarWise.some(
      (pillar) => pillar.categoryId === previousIdea.CategoryID
    ) &&
    isVoted
  )
    pillarWise.push({ categoryId: previousIdea.CategoryID, votes: 1 })
  return {
    ...current,
    data: current.data.map((row) =>
      row.ID === previousIdea.ID ? { ...row, flgSelf: isVoted } : row
    ),
    usage: {
      workshopWise: Math.max(0, current.usage.workshopWise + delta),
      pillarWise,
    },
  }
}
