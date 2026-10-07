import { VotingScreen } from "@/components/participants/voting-screen"
import { socket } from "@/lib/socket"
import {
  getParticipantWorkshopOptions,
  type ParticipantWorkshop,
} from "@/services/participants"
import { useQueryClient } from "@tanstack/react-query"
import { AnimatePresence } from "framer-motion"
import { useEffect, type ReactNode } from "react"

/** Keep the workspace mounted underneath the phase-controlled voting modal. */
export function ParticipantVotingGate({
  workshop,
  workshopCode,
  visitorId,
  enabled = true,
  children,
}: {
  workshop: ParticipantWorkshop
  workshopCode: string
  visitorId: string
  enabled?: boolean
  children: ReactNode
}) {
  const queryClient = useQueryClient()
  useEffect(() => {
    const joinRoom = () => socket.emit("join_room", { roomId: workshopCode })
    const updateStatus = ({
      roomId,
      status,
    }: {
      roomId: string
      status: ParticipantWorkshop["status"]
    }) => {
      if (roomId !== workshopCode) return
      queryClient.setQueryData(
        getParticipantWorkshopOptions({
          code: workshopCode,
          visitor_id: visitorId,
        }).queryKey,
        (current) =>
          current ? { ...current, data: { ...current.data, status } } : current
      )
    }
    socket.on("connect", joinRoom)
    socket.on("workshop_status", updateStatus)
    if (socket.connected) joinRoom()
    return () => {
      socket.off("connect", joinRoom)
      socket.off("workshop_status", updateStatus)
    }
  }, [queryClient, visitorId, workshopCode])

  const isVoting = enabled && workshop.status === "Vote"
  return (
    <>
      <div inert={isVoting || undefined} aria-hidden={isVoting || undefined}>
        {children}
      </div>
      <AnimatePresence>
        {isVoting && (
          <VotingScreen
            key={workshopCode}
            workshop={workshop}
            workshopCode={workshopCode}
            visitorId={visitorId}
          />
        )}
      </AnimatePresence>
    </>
  )
}
