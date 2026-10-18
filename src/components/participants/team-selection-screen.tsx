import { HalftoneBackground } from "@/components/experience/halftone-background"
import { WorkshopLogo } from "@/components/experience/workshop-logo"
import { AnimatedDialog } from "@/components/experience/animated-dialog"
import { TeamMedallion } from "@/components/participants/team-medallion"
import type {
  ParticipantWorkshop,
  ParticipantWorkshopTeam,
} from "@/services/participants"
import { useSelectTeam } from "@/services/participants"
import { AnimatePresence, motion } from "framer-motion"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

const EASE = [0.16, 1, 0.3, 1] as const
export function TeamSelectionScreen({
  workshop,
  workshopCode,
  visitorId,
  onComplete,
}: {
  workshop: ParticipantWorkshop
  workshopCode: string
  visitorId: string
  onComplete: (team: ParticipantWorkshopTeam) => void
}) {
  const initialIndex = Math.max(
    0,
    workshop.teams.findIndex((team) => team.ID === workshop.teamID)
  )
  const [activeIndex, setActiveIndex] = useState(initialIndex)
  const [rotationAngle, setRotationAngle] = useState(
    -initialIndex * (360 / Math.max(workshop.teams.length, 1))
  )
  const [pendingTeam, setPendingTeam] =
    useState<ParticipantWorkshopTeam | null>(null)
  const [submittingTeamId, setSubmittingTeamId] = useState<number | null>(null)
  const [launchingTeam, setLaunchingTeam] =
    useState<ParticipantWorkshopTeam | null>(null)
  const selectTeam = useSelectTeam()
  const angleStep = 360 / Math.max(workshop.teams.length, 1)
  const activeTeam = workshop.teams[activeIndex] ?? workshop.teams[0]
  const activeColor = activeTeam?.TeamColorCode
  const touchStart = useRef<{ x: number; y: number } | null>(null)
  const didSwipe = useRef(false)

  const rotateRing = useCallback(
    (direction: number) => {
      if (selectTeam.isPending || launchingTeam || workshop.teams.length < 2)
        return
      setActiveIndex(
        (index) =>
          (index + direction + workshop.teams.length) % workshop.teams.length
      )
      setRotationAngle((angle) => angle - direction * angleStep)
    },
    [angleStep, launchingTeam, selectTeam.isPending, workshop.teams.length]
  )

  const focusTeam = (index: number) => {
    if (selectTeam.isPending || launchingTeam || index === activeIndex) return
    let difference = index - activeIndex
    const half = workshop.teams.length / 2
    if (difference > half) difference -= workshop.teams.length
    if (difference < -half) difference += workshop.teams.length
    setActiveIndex(index)
    setRotationAngle((angle) => angle - difference * angleStep)
  }

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault()
        rotateRing(-1)
      }
      if (event.key === "ArrowRight") {
        event.preventDefault()
        rotateRing(1)
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [rotateRing])

  const submitTeam = (team: ParticipantWorkshopTeam, teamCode?: string) => {
    setSubmittingTeamId(team.ID)
    selectTeam.mutate(
      {
        visitor_id: visitorId,
        workshop_code: workshopCode,
        team_id: team.ID,
        ...(teamCode ? { team_code: teamCode } : {}),
      },
      {
        onSuccess: () => {
          setSubmittingTeamId(null)
          setPendingTeam(null)
          setLaunchingTeam(team)
          window.setTimeout(() => onComplete(team), 1450)
        },
        onError: () => setSubmittingTeamId(null),
      }
    )
  }

  const chooseTeam = (team: ParticipantWorkshopTeam) => {
    selectTeam.reset()
    if (workshop.IsProtected) setPendingTeam(team)
    else submitTeam(team)
  }

  const medallionRadius = useMemo(
    () => (workshop.teams.length <= 2 ? 220 : 300),
    [workshop.teams.length]
  )

  if (workshop.teams.length === 0) {
    return (
      <main className="relative grid min-h-[calc(100dvh-var(--activity-ticker-height,3rem))] place-items-center bg-team-selection px-6 pb-12 text-center text-inverse">
        <HalftoneBackground />
        <div className="relative z-10">
          <h1 className="font-display text-5xl">No teams are available yet.</h1>
          <p className="mt-4 text-inverse/55">
            Ask your facilitator to add teams to this workshop.
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="relative flex min-h-[calc(100dvh-var(--activity-ticker-height,3rem))] flex-col overflow-x-clip bg-team-selection text-inverse">
      <motion.div
        key={activeIndex}
        initial={{ opacity: 0.25 }}
        animate={{ opacity: 1 }}
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(ellipse 42% 38% at 50% 58%, ${activeColor}47, ${activeColor}14 55%, transparent 74%)`,
        }}
      />

      <HalftoneBackground className="z-1" />
      <motion.header
        initial={{ y: -56, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1, ease: EASE }}
        className="sticky top-0 z-30 flex shrink-0 items-center justify-between border-b border-line-inverse/14 bg-team-selection/95 px-5 py-4 backdrop-blur-lg sm:px-10 sm:py-5"
      >
        <div className="flex items-center gap-4">
          <WorkshopLogo
            src={workshop.logoFileName}
            workshopName={workshop.Name}
          />
          <div className="h-6 w-px bg-tint-inverse/20" />
          <h1 className="font-display text-xl sm:text-2xl">Team Select</h1>
        </div>
      </motion.header>

      <div className="relative z-10 flex flex-1 shrink-0 flex-col justify-center py-8 [--ring-scale:0.6] sm:py-12 sm:[--ring-scale:0.8] lg:[--ring-scale:1]">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.28, ease: EASE }}
          className="relative z-0 mb-4 px-5 text-center sm:mb-0 sm:px-10 lg:-mb-4"
        >
          <div className="mb-3 text-[10px] font-bold tracking-[2px] break-words text-inverse/55 uppercase sm:mb-4 sm:text-[12px] sm:tracking-[4px]">
            {workshop.Name}
          </div>
          <h2 className="font-display text-[clamp(36px,8.5vw,56px)] leading-[.98] tracking-[-.02em] text-inverse/95 sm:text-[clamp(56px,8.5vw,128px)]">
            Choose your team.
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 26 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5, ease: EASE }}
          className="relative z-10 mx-auto w-full max-w-[1200px]"
        >
          <button
            type="button"
            onClick={() => rotateRing(-1)}
            aria-label="Previous team"
            className="absolute bottom-0 left-5 z-[100] flex size-[46px] cursor-pointer items-center justify-center rounded-full border-2 border-line-inverse/30 bg-transparent text-[22px] text-inverse transition hover:border-line-inverse/70 hover:bg-tint-inverse/6 sm:top-1/2 sm:bottom-auto sm:-translate-y-1/2"
          >
            <ChevronLeftIcon className="size-5 sm:size-6" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => rotateRing(1)}
            aria-label="Next team"
            className="absolute right-5 bottom-0 z-[100] flex size-[46px] cursor-pointer items-center justify-center rounded-full border-2 border-line-inverse/30 bg-transparent text-[22px] text-inverse transition hover:border-line-inverse/70 hover:bg-tint-inverse/6 sm:top-1/2 sm:bottom-auto sm:-translate-y-1/2"
          >
            <ChevronRightIcon className="size-5 sm:size-6" aria-hidden="true" />
          </button>

          <div
            className="relative flex h-[300px] touch-pan-y items-center justify-center overflow-visible [perspective:1200px] sm:h-[340px] lg:h-[400px]"
            onTouchStart={(event) => {
              didSwipe.current = false
              const touch = event.touches[0]
              touchStart.current =
                event.touches.length === 1
                  ? { x: touch.clientX, y: touch.clientY }
                  : null
            }}
            onTouchEnd={(event) => {
              const start = touchStart.current
              touchStart.current = null
              if (!start) return
              const touch = event.changedTouches[0]
              const deltaX = touch.clientX - start.x
              const deltaY = touch.clientY - start.y
              if (Math.abs(deltaX) < 40 || Math.abs(deltaX) <= Math.abs(deltaY))
                return
              didSwipe.current = true
              rotateRing(deltaX < 0 ? 1 : -1)
            }}
            onTouchCancel={() => {
              touchStart.current = null
            }}
            onClickCapture={(event) => {
              if (!didSwipe.current) return
              event.preventDefault()
              event.stopPropagation()
              didSwipe.current = false
            }}
          >
            <div className="pointer-events-none absolute bottom-[-52px] left-1/2 h-[90px] w-[560px] -translate-x-1/2 bg-[radial-gradient(ellipse_50%_50%_at_50%_50%,color-mix(in_srgb,var(--shadow-color)_55%,transparent),transparent_70%)]" />
            <motion.div
              animate={{ rotateY: rotationAngle }}
              transition={{ type: "spring", stiffness: 100, damping: 20 }}
              className="relative size-64 transform-3d sm:size-70 lg:size-80"
            >
              {workshop.teams.map((team, index) => {
                const isActive = index === activeIndex
                return (
                  <div
                    key={team.ID}
                    className="absolute size-full [transform-style:preserve-3d]"
                    style={{
                      transform: `rotateY(${index * angleStep}deg) translateZ(calc(${medallionRadius}px * var(--ring-scale)))`,
                      cursor: isActive ? "default" : "pointer",
                    }}
                    onClick={() => !isActive && focusTeam(index)}
                  >
                    <TeamMedallion
                      name={team.TeamName}
                      description={team.Description}
                      color={team.TeamColorCode}
                      image={team.ThumbnailFileName}
                      isActive={isActive}
                      isPending={
                        selectTeam.isPending && submittingTeamId === team.ID
                      }
                      onSelect={() => chooseTeam(team)}
                      onFocus={() => focusTeam(index)}
                    />
                  </div>
                )
              })}
            </motion.div>
          </div>

          <div className="relative z-10 mx-20 mt-6 flex min-h-[46px] flex-wrap items-center justify-center gap-3 sm:mx-0 sm:mt-12">
            {workshop.teams.map((team, index) => (
              <button
                type="button"
                key={team.ID}
                onClick={() => focusTeam(index)}
                aria-label={team.TeamName}
                className="size-3 cursor-pointer rounded-full border-2 p-0"
                style={{
                  borderColor:
                    index === activeIndex
                      ? "color-mix(in srgb, var(--surface-inverse-tint) 85%, transparent)"
                      : "color-mix(in srgb, var(--border-inverse-color) 30%, transparent)",
                  background:
                    index === activeIndex ? team.TeamColorCode : "transparent",
                }}
              />
            ))}
          </div>

          {selectTeam.isError && !pendingTeam && (
            <p
              className="mt-5 text-center text-sm text-error-inverse"
              role="alert"
            >
              {selectTeam.error.message}
            </p>
          )}
        </motion.div>
      </div>

      <AnimatePresence>
        {pendingTeam && (
          <TeamCodeDialog
            team={pendingTeam}
            isPending={selectTeam.isPending}
            error={selectTeam.error?.message}
            onClose={() => {
              if (!selectTeam.isPending) {
                setPendingTeam(null)
                selectTeam.reset()
              }
            }}
            onSubmit={(code) => submitTeam(pendingTeam, code)}
          />
        )}
        {launchingTeam && (
          <motion.div
            key="launch"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[10000] grid place-items-center bg-overlay"
          >
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 10, opacity: [0, 0.6, 0.15] }}
              transition={{ duration: 1, ease: EASE }}
              className="absolute size-[300px] rounded-full"
              style={{
                background: `radial-gradient(circle, ${launchingTeam.TeamColorCode} 0%, transparent 70%)`,
              }}
            />
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.55, delay: 0.2, ease: EASE }}
              className="absolute inset-x-0 top-1/2 h-0.5 origin-left"
              style={{ background: launchingTeam.TeamColorCode }}
            />
            <div className="relative z-10 text-center">
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.42 }}
                className="mb-5 text-[12px] font-bold tracking-[6px] uppercase"
              >
                Entering the room
              </motion.p>
              <motion.h2
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55, ease: EASE }}
                className="font-display text-[clamp(64px,9vw,110px)] leading-none"
              >
                {launchingTeam.TeamName}
              </motion.h2>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  )
}

function TeamCodeDialog({
  team,
  isPending,
  error,
  onClose,
  onSubmit,
}: {
  team: ParticipantWorkshopTeam
  isPending: boolean
  error?: string
  onClose: () => void
  onSubmit: (code: string) => void
}) {
  const [code, setCode] = useState("")
  const [validationError, setValidationError] = useState<string>()
  const message = validationError ?? error

  return (
    <AnimatedDialog
      mobileSheet
      onClose={onClose}
      dismissDisabled={isPending}
      aria-labelledby="team-pin-title"
      className="max-w-md border-line-inverse/15 bg-entry-panel p-7 text-inverse shadow-2xl shadow-shadow/25 backdrop:bg-overlay/70"
      onClick={(event) => {
        if (event.target === event.currentTarget && !isPending) onClose()
      }}
    >
      <form
        onClick={(event) => event.stopPropagation()}
        onSubmit={(event) => {
          event.preventDefault()
          if (!/^\d{4}$/.test(code)) {
            setValidationError("Enter the four-digit team PIN.")
            return
          }
          setValidationError(undefined)
          onSubmit(code)
        }}
        className="w-full"
      >
        <p className="text-[11px] font-bold tracking-[.2em] text-entry-action uppercase">
          Protected team
        </p>
        <h2 id="team-pin-title" className="mt-3 font-display text-3xl">
          Enter {team.TeamName}’s PIN
        </h2>
        <p className="mt-2 text-sm text-inverse/55">
          Ask your facilitator for the four-digit code.
        </p>
        <input
          autoFocus
          inputMode="numeric"
          value={code}
          maxLength={4}
          onChange={(event) => {
            setCode(event.target.value.replace(/\D/g, "").slice(0, 4))
            setValidationError(undefined)
          }}
          className="mt-7 h-14 w-full border border-line-inverse/20 bg-overlay/25 px-4 text-center font-mono text-xl tracking-[.5em] outline-none focus:border-line-inverse/60"
          aria-label={`PIN for ${team.TeamName}`}
          aria-invalid={Boolean(message)}
        />
        {message && (
          <p className="mt-3 text-sm text-error-inverse" role="alert">
            {message}
          </p>
        )}
        <div className="mt-7 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="cursor-pointer border border-line-inverse/20 px-5 py-3 text-xs font-bold tracking-[.12em] uppercase disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="cursor-pointer bg-entry-action px-6 py-3 text-xs font-bold tracking-[.12em] text-on-entry-action uppercase disabled:cursor-wait disabled:opacity-60"
          >
            {isPending ? "Checking…" : "Join team"}
          </button>
        </div>
      </form>
    </AnimatedDialog>
  )
}
