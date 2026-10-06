import { useEffect } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"

import { socket } from "@/lib/socket"
import {
  type ActivityCreatedSocketPayload,
  getActivitiesOptions,
} from "@/services/big-screen"

/** Fetches the feed and merges room-scoped activity events into its query cache.
 * The experience controller is responsible for joining the workshop socket room.
 */
export function useWorkshopActivities(workshopCode: string) {
  const queryClient = useQueryClient()
  const activityQueryOptions = getActivitiesOptions({
    code: workshopCode,
    type: null,
  })
  const {
    data: activities = [],
    isPending,
    isError,
    refetch,
  } = useQuery({
    ...activityQueryOptions,
    select: (response) => response.data,
  })

  useEffect(() => {
    // Prepend incoming rows and remove deleted/replaced IDs without duplicating them.
    const handleActivityCreated = ({
      roomId,
      activities: incomingActivities,
      deletedActivityIds,
    }: ActivityCreatedSocketPayload) => {
      if (roomId !== workshopCode) return

      queryClient.setQueryData(activityQueryOptions.queryKey, (current) => {
        if (!current) return current

        const deletedIds = new Set(deletedActivityIds ?? [])
        const nextActivities = (incomingActivities ?? []).filter(
          (activity) => !deletedIds.has(activity.ID)
        )
        const incomingIds = new Set(
          nextActivities.map((activity) => activity.ID)
        )

        return {
          ...current,
          data: [
            ...nextActivities,
            ...current.data.filter(
              (activity) =>
                !deletedIds.has(activity.ID) && !incomingIds.has(activity.ID)
            ),
          ],
        }
      })
    }

    socket.on("activity_created", handleActivityCreated)

    return () => {
      socket.off("activity_created", handleActivityCreated)
    }
  }, [queryClient, workshopCode, activityQueryOptions.queryKey])

  return { activities, isPending, isError, refetch }
}
