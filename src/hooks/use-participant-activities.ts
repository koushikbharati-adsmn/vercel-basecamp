import { createContext, useContext } from "react"
import type { useWorkshopActivities } from "@/hooks/use-workshop-activities"

export const ParticipantActivityContext = createContext<ReturnType<
  typeof useWorkshopActivities
> | null>(null)

export function useParticipantActivities() {
  const activities = useContext(ParticipantActivityContext)
  if (!activities)
    throw new Error("Participant activities require ParticipantLayout")
  return activities
}
