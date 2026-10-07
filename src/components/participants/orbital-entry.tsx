import { HalftoneBackground } from "@/components/experience/halftone-background"
import { AmbientField } from "@/components/participants/ambient-field"
import { motion } from "framer-motion"
import { useEffect, useId, useRef, useState } from "react"

const EASE = [0.16, 1, 0.3, 1] as const
const EASE_EXIT = [0.62, 0, 0.9, 0.4] as const
const ORBIT_COPY =
  "THE DIVINE DISCONTENT SESSION · OGILVY · WELCOME TO BASECAMP · 2026 · "

function OrbitType({ pathId }: { pathId: string }) {
  const radius = 336

  return (
    <svg
      className="orbital-rotate absolute inset-0 size-full overflow-visible"
      viewBox="0 0 760 760"
      aria-hidden="true"
    >
      <defs>
        <path
          id={pathId}
          d={`M 380,380 m -${radius},0 a ${radius},${radius} 0 1,1 ${radius * 2},0 a ${radius},${radius} 0 1,1 -${radius * 2},0`}
        />
      </defs>
      <text
        fill="color-mix(in srgb, var(--text-inverse) 74%, transparent)"
        fontSize="12"
        fontWeight="700"
        letterSpacing="3.4"
      >
        <textPath
          href={`#${pathId}`}
          startOffset="0%"
          textLength={Math.round(2 * Math.PI * radius)}
          lengthAdjust="spacing"
        >
          {ORBIT_COPY.repeat(3)}
        </textPath>
      </text>
    </svg>
  )
}

export function OrbitalEntry({
  workshopName,
  onComplete,
}: {
  workshopName: string
  onComplete: () => void
}) {
  const outerPathId = `orbital-outer-${useId().replace(/:/g, "")}`
  const timerRef = useRef<number | null>(null)
  const [unlocking, setUnlocking] = useState(false)

  useEffect(
    () => () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current)
    },
    []
  )

  const handleEnter = () => {
    if (unlocking) return
    setUnlocking(true)
    timerRef.current = window.setTimeout(onComplete, 1050)
  }

  return (
    <motion.section
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="relative min-h-screen overflow-hidden bg-app text-inverse"
    >
      <AmbientField />
      <div className="orbital-vignette pointer-events-none absolute inset-0 z-[1]" />
      <HalftoneBackground className="z-[2]" />

      <motion.header
        initial={{ opacity: 0 }}
        animate={{ opacity: unlocking ? 0 : 1 }}
        transition={{ duration: 0.7, delay: 0.1 }}
        className="absolute inset-x-0 top-0 z-20 flex items-start justify-between px-5 py-5 sm:px-8 sm:py-7 lg:px-11"
      >
        <div className="flex items-baseline gap-2">
          <span className="font-display text-[15px] sm:text-[16px]">
            Basecamp
          </span>
          <span className="hidden text-[12px] font-medium tracking-[0.03em] text-inverse/60 sm:inline">
            by Ogilvy
          </span>
        </div>
        <div className="max-w-[52vw] text-right text-[11px] leading-[1.6] font-medium tracking-[0.03em] text-inverse/64 sm:text-[12px]">
          <div className="truncate">{workshopName}</div>
          <div className="text-inverse/45">2026</div>
        </div>
      </motion.header>

      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={
          unlocking ? { opacity: 1, scale: 7.5 } : { opacity: 1, scale: 1 }
        }
        transition={
          unlocking
            ? { duration: 1.05, ease: EASE_EXIT }
            : { duration: 1.1, delay: 0.1, ease: EASE }
        }
        className="absolute left-1/2 z-10 aspect-square -translate-x-1/2 -translate-y-1/2"
        style={{
          top: "41.5%",
          width: "min(92vw, calc(100svh - 260px), 660px)",
          containerType: "inline-size",
        }}
      >
        <div className="absolute inset-[1%] rounded-full border border-line-inverse/20" />
        <div className="absolute inset-[3%] rounded-full border border-line-inverse/10" />
        <OrbitType pathId={outerPathId} />

        <div
          className="absolute inset-[9%] flex flex-col items-center justify-center overflow-hidden rounded-full border border-line-inverse/35 px-[10%] text-center shadow-[0_40px_120px_color-mix(in_srgb,var(--shadow-color)_45%,transparent)]"
          style={{
            background: unlocking
              ? "radial-gradient(circle at 50% 42%, color-mix(in srgb, var(--orbital-active-center) 96%, transparent), color-mix(in srgb, var(--orbital-active-edge) 99%, transparent) 72%)"
              : "radial-gradient(circle at 50% 42%, color-mix(in srgb, var(--orbital-idle-center) 58%, transparent), color-mix(in srgb, var(--orbital-idle-edge) 78%, transparent) 72%)",
            backdropFilter: unlocking ? "none" : "blur(22px)",
            WebkitBackdropFilter: unlocking ? "none" : "blur(22px)",
            transition: "background 0.5s ease",
          }}
        >
          <motion.div
            animate={{ opacity: unlocking ? 0 : 1 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center justify-center"
          >
            <img
              src="/logos/ogilvy-logo-white.svg"
              alt="Ogilvy"
              className="mb-[3%] h-auto w-[clamp(62px,15cqw,108px)]"
            />
            <div className="mb-[1.5%] text-[clamp(11px,2cqw,14px)] font-medium tracking-[0.05em] text-inverse/68">
              Welcome to
            </div>
            <h1 className="font-display text-[clamp(36px,12.6cqw,92px)] leading-[0.92] tracking-[-0.03em] [text-wrap:balance]">
              Basecamp
            </h1>
            <div className="my-[3%] h-px w-[clamp(52px,7cqw,92px)] bg-entry-action" />
            <p className="max-w-[440px] font-display text-[clamp(17px,4.1cqw,30px)] leading-[1.1] tracking-[-0.015em] text-inverse/96">
              {workshopName}
            </p>
            <p className="mt-[3%] max-w-[380px] text-[clamp(12px,2.2cqw,15px)] leading-[1.5] font-medium text-inverse/72">
              Where the room’s best ideas become inevitable.
            </p>
          </motion.div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={unlocking ? { opacity: 0, y: 20 } : { opacity: 1, y: 0 }}
        transition={
          unlocking
            ? { duration: 0.25 }
            : { duration: 0.65, delay: 0.75, ease: EASE }
        }
        className="absolute bottom-[62px] left-1/2 z-20 w-[calc(100%-40px)] max-w-xl -translate-x-1/2 sm:bottom-[70px]"
      >
        <div className="mb-2.5 text-center text-[11px] font-medium tracking-[0.03em] text-inverse/62 sm:text-[12px]">
          Enter the workshop when you’re ready
        </div>
        <button
          type="button"
          onClick={handleEnter}
          disabled={unlocking}
          className="w-full cursor-pointer disabled:pointer-events-none"
        >
          <span className="block bg-entry-action px-5 py-3 text-[11px] font-bold tracking-[0.22em] text-on-entry-action uppercase transition-[background,transform] duration-200 hover:bg-entry-action-hover sm:text-[12px]">
            Enter workshop
          </span>
        </button>
      </motion.div>
    </motion.section>
  )
}
