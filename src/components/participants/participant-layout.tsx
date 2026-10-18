import { LiveActivityTicker } from "@/components/participants/live-activity-ticker"
import {
  WorkspaceHeader,
  type WorkspaceView,
} from "@/components/participants/workspace-header"
import { useWorkshopActivities } from "@/hooks/use-workshop-activities"
import { ParticipantActivityContext } from "@/hooks/use-participant-activities"
import { socket } from "@/lib/socket"
import type { ParticipantWorkshop } from "@/services/participants"
import { useEffect, type ReactNode } from "react"

/** Persists across participant routes; onboarding keeps its own presentation. */
export function ParticipantLayout({
  workshop,
  workshopCode,
  view,
  teamId,
  children,
}: {
  workshop: ParticipantWorkshop
  workshopCode: string
  view: WorkspaceView | null
  teamId?: number
  children: ReactNode
}) {
  const activities = useWorkshopActivities(workshopCode)

  useEffect(() => {
    const joinRoom = () => socket.emit("join_room", { roomId: workshopCode })
    socket.on("connect", joinRoom)
    if (socket.connected) joinRoom()
    return () => {
      socket.off("connect", joinRoom)
    }
  }, [workshopCode])

  return (
    <ParticipantActivityContext.Provider value={activities}>
      <div
        className={`flex min-h-dvh flex-col pb-[var(--activity-ticker-height)] [--activity-ticker-height:calc(3rem+env(safe-area-inset-bottom))] ${view === "newsroom" ? "bg-newsroom text-inverse" : view ? "bg-workspace text-content" : "bg-app text-inverse"}`}
      >
        {view && (
          <WorkspaceHeader
            workshop={workshop}
            workshopCode={workshopCode}
            view={view}
            teamId={teamId}
          />
        )}
        <div className="min-w-0 flex-1">{children}</div>
        <LiveActivityTicker
          workshopCode={workshopCode}
          activities={activities.activities}
          isPending={activities.isPending}
          isError={activities.isError}
        />
      </div>
    </ParticipantActivityContext.Provider>
  )
}
