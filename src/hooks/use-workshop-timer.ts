import { socket } from "@/lib/socket"
import { useEffect, useRef, useState } from "react"

export type TimerStatus = "idle" | "running" | "paused"

export type TimerState = {
  status: TimerStatus
  durationSeconds: number
  remainingSeconds: number
}

// Wire time is milliseconds; public hook state exposes rounded-up seconds.
type TimerStatePayload = {
  roomId: string
  status: TimerStatus
  durationSeconds: number
  remainingMs: number
}

const INITIAL_TIMER: TimerState = {
  status: "idle",
  durationSeconds: 0,
  remainingSeconds: 0,
}

/** Uses a deadline so delayed browser ticks do not accumulate countdown drift. */
const getRemainingSeconds = (endsAt: number) =>
  Math.max(0, Math.ceil((endsAt - Date.now()) / 1000))

/** Synchronizes a room timer, ticks locally, and exposes server-directed controls.
 * Rejoins and requests fresh state whenever the shared socket reconnects.
 */
export function useWorkshopTimer(roomId: string) {
  const [timer, setTimer] = useState<TimerState>(INITIAL_TIMER)
  const endsAtRef = useRef<number | null>(null)

  useEffect(() => {
    // Convert this room's server snapshot into a local countdown deadline.
    const syncTimer = (data: TimerStatePayload) => {
      if (data.roomId !== roomId) return

      const remainingMs = Math.max(0, data.remainingMs)

      endsAtRef.current =
        data.status === "running" ? Date.now() + remainingMs : null

      setTimer({
        status: data.status,
        durationSeconds: data.durationSeconds,
        remainingSeconds: Math.ceil(remainingMs / 1000),
      })
    }

    // Joining alone does not supply timer state; request a snapshot explicitly.
    const syncRoom = () => {
      socket.emit("join_room", { roomId })
      socket.emit("get_timer_state", { roomId })
    }

    socket.on("connect", syncRoom)
    socket.on("timer_state", syncTimer)

    if (socket.connected) {
      syncRoom()
    }

    return () => {
      socket.off("connect", syncRoom)
      socket.off("timer_state", syncTimer)
    }
  }, [roomId])

  useEffect(() => {
    if (timer.status !== "running") return

    // Update only the display; later server events can overwrite this estimate.
    const tick = () => {
      if (endsAtRef.current === null) return

      const remainingSeconds = getRemainingSeconds(endsAtRef.current)

      setTimer((current) => ({
        ...current,
        status: remainingSeconds === 0 ? "idle" : current.status,
        remainingSeconds,
      }))
    }

    tick()

    const interval = window.setInterval(tick, 250)

    return () => window.clearInterval(interval)
  }, [timer.status])

  /** Sets the local preview and server duration only while not running. */
  const setDuration = (durationSeconds: number) => {
    if (timer.status === "running") return

    setTimer((current) => ({
      ...current,
      durationSeconds,
      remainingSeconds: durationSeconds,
    }))

    socket.emit("set_timer_duration", {
      roomId,
      duration: durationSeconds,
    })
  }

  /** Requests a start only when there is positive remaining time. */
  const start = () => {
    if (timer.remainingSeconds <= 0) return

    socket.emit("start_timer", {
      roomId,
      duration: timer.durationSeconds,
    })
  }

  /** Requests a pause; timer_state supplies the resulting local state. */
  const pause = () => {
    socket.emit("pause_timer", { roomId })
  }

  /** Requests continuation of the server's paused timer. */
  const resume = () => {
    socket.emit("resume_timer", { roomId })
  }

  /** Requests a server reset rather than inventing local reset state. */
  const reset = () => {
    socket.emit("reset_timer", { roomId })
  }

  return {
    timer,
    setDuration,
    start,
    pause,
    resume,
    reset,
  }
}
