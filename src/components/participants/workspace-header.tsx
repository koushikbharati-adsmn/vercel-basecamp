import { WorkshopLogo } from "@/components/experience/workshop-logo"
import { WorkshopNavigation } from "@/components/participants/workshop-navigation"
import type { ParticipantWorkshop } from "@/services/participants"
import { Link } from "@tanstack/react-router"
import { motion, useReducedMotion } from "framer-motion"
import { BEAT, DUR, EASE } from "@/lib/motion"

export type WorkspaceView = "board" | "stage" | "newsroom"

export function WorkspaceHeader({
  workshop,
  workshopCode,
  view,
  teamId,
}: {
  workshop: ParticipantWorkshop
  workshopCode: string
  view: WorkspaceView
  teamId?: number
}) {
  const reducedMotion = useReducedMotion()
  const inverse = view === "newsroom"
  const team = workshop.teams.find((team) => team.ID === teamId)
  const boardTeamId = teamId ?? workshop.teamID
  const title =
    view === "board"
      ? workshop.IdeationPage || "The Board"
      : view === "stage"
        ? workshop.ShortlistedIdeaPage || "The Stage"
        : workshop.StatsBoard || "The Newsroom"
  const linkClassName = inverse
    ? "text-newsroom-muted hover:text-inverse"
    : "text-secondary hover:text-content"

  return (
    <motion.header
      initial={{ opacity: 0, y: reducedMotion ? 0 : -56 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: reducedMotion ? 0 : DUR.beat,
        delay: reducedMotion ? 0 : BEAT.structure,
        ease: EASE,
      }}
      className={`sticky top-0 z-30 flex items-center justify-between gap-3 border-b px-5 py-4 backdrop-blur-lg sm:gap-4 sm:px-12 ${inverse ? "border-line-inverse/15 bg-newsroom/95" : "border-line/15 bg-workspace/95"}`}
    >
      <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
        <Link
          to="/workshops/$code/participants"
          params={{ code: workshopCode }}
          search={{ selectTeam: true }}
          aria-label="Basecamp home"
          className="shrink-0"
        >
          <WorkshopLogo
            src={workshop.logoFileName}
            workshopName={workshop.Name}
          />
        </Link>
        <span
          className={`h-5 w-px shrink-0 ${inverse ? "bg-tint-inverse/20" : "bg-tint/15"}`}
        />
        {view === "board" && team && (
          <Link
            to="/workshops/$code/participants"
            params={{ code: workshopCode }}
            search={{ selectTeam: true }}
            className="min-w-0 truncate rounded border-2 px-3 py-1.5 text-xs font-bold tracking-[.12em] uppercase"
            style={{ borderColor: team.TeamColorCode }}
            aria-label="Change team"
          >
            {team.TeamName} ▾
          </Link>
        )}
        <h1
          className={`${view === "board" ? "hidden lg:block" : ""} truncate font-display text-[28px] capitalize`}
        >
          {title}
        </h1>
        {inverse && (
          <span className="hidden shrink-0 items-center gap-2 border border-line-inverse/15 bg-tint-inverse/5 px-2.5 py-1 text-[10px] font-bold tracking-[.16em] sm:inline-flex">
            <span
              aria-hidden="true"
              className="size-1.5 rounded-full bg-action"
            />
            LIVE
          </span>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-3 sm:gap-8">
        <WorkshopNavigation key={view} inverse={inverse}>
          {view === "board" ? (
            <span aria-current="page" className="text-action">
              The Board
            </span>
          ) : boardTeamId != null ? (
            <Link
              to="/workshops/$code/participants/$teamId"
              params={{ code: workshopCode, teamId: String(boardTeamId) }}
              className={linkClassName}
            >
              The Board
            </Link>
          ) : (
            <Link
              to="/workshops/$code/participants"
              params={{ code: workshopCode }}
              search={{ selectTeam: true }}
              className={linkClassName}
            >
              Choose team
            </Link>
          )}
          {view === "stage" ? (
            <span aria-current="page" className="text-action">
              The Stage
            </span>
          ) : (
            <Link
              to="/workshops/$code/participants/stage"
              params={{ code: workshopCode }}
              className={linkClassName}
            >
              The Stage
            </Link>
          )}
          {view === "newsroom" ? (
            <span aria-current="page" className="text-action">
              The Newsroom
            </span>
          ) : (
            <Link
              to="/workshops/$code/participants/newsroom"
              params={{ code: workshopCode }}
              className={linkClassName}
            >
              The Newsroom
            </Link>
          )}
        </WorkshopNavigation>
      </div>
    </motion.header>
  )
}
