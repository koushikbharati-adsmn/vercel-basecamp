import { AmbientField } from '@/components/participants/ambient-field'
import { motion } from 'framer-motion'
import { useEffect, useId, useRef, useState } from 'react'

const EASE = [0.16, 1, 0.3, 1] as const
const EASE_EXIT = [0.62, 0, 0.9, 0.4] as const
const ORBIT_COPY =
  'THE DIVINE DISCONTENT SESSION · OGILVY · WELCOME TO BASECAMP · 2026 · '

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
        fill="rgba(255,255,255,0.74)"
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

export function OrbitalEntry({ workshopName }: { workshopName: string }) {
  const outerPathId = `orbital-outer-${useId().replace(/:/g, '')}`
  const timerRef = useRef<number | null>(null)
  const [unlocking, setUnlocking] = useState(false)
  const [entered, setEntered] = useState(false)

  useEffect(
    () => () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current)
    },
    [],
  )

  const handleEnter = () => {
    if (unlocking) return
    setUnlocking(true)
    timerRef.current = window.setTimeout(() => setEntered(true), 1050)
  }

  if (entered) {
    return (
      <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-[#0d0c0d] px-6 pb-12 text-center">
        <AmbientField />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_47%,rgba(13,12,13,.04)_0%,rgba(13,12,13,.22)_42%,rgba(13,12,13,.72)_100%)]" />
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-10"
        >
          <p className="text-xs font-bold tracking-[0.22em] text-[#eb3f43] uppercase">
            You’re in
          </p>
          <h1 className="font-display mt-4 text-4xl sm:text-6xl">
            {workshopName}
          </h1>
          <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-white/60">
            Your participant workspace is ready for the next experience screen.
          </p>
        </motion.div>
      </main>
    )
  }

  return (
    <motion.section
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="relative min-h-screen overflow-hidden bg-[#0d0c0d] text-white"
    >
      <AmbientField />
      <div className="pointer-events-none absolute inset-0 z-[1] bg-[radial-gradient(circle_at_50%_47%,rgba(13,12,13,.04)_0%,rgba(13,12,13,.22)_42%,rgba(13,12,13,.72)_100%)]" />
      <div
        className="pointer-events-none absolute inset-0 z-[2] opacity-30"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
          backgroundSize: '48px 48px',
          maskImage:
            'radial-gradient(circle at 50% 47%, transparent 12%, black 78%)',
        }}
      />

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
          <span className="hidden text-[12px] font-medium tracking-[0.03em] text-white/60 sm:inline">
            by Ogilvy
          </span>
        </div>
        <div className="max-w-[52vw] text-right text-[11px] font-medium leading-[1.6] tracking-[0.03em] text-white/64 sm:text-[12px]">
          <div className="truncate">{workshopName}</div>
          <div className="text-white/45">2026</div>
        </div>
      </motion.header>

      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={
          unlocking
            ? { opacity: 1, scale: 7.5 }
            : { opacity: 1, scale: 1 }
        }
        transition={
          unlocking
            ? { duration: 1.05, ease: EASE_EXIT }
            : { duration: 1.1, delay: 0.1, ease: EASE }
        }
        className="absolute left-1/2 z-10 aspect-square -translate-x-1/2 -translate-y-1/2"
        style={{
          top: '41.5%',
          width: 'min(92vw, calc(100svh - 260px), 660px)',
          containerType: 'inline-size',
        }}
      >
        <div className="absolute inset-[1%] rounded-full border border-white/20" />
        <div className="absolute inset-[3%] rounded-full border border-white/10" />
        <OrbitType pathId={outerPathId} />

        <div
          className="absolute inset-[9%] flex flex-col items-center justify-center overflow-hidden rounded-full border border-white/35 px-[10%] text-center shadow-[0_40px_120px_rgba(0,0,0,0.45)]"
          style={{
            background: unlocking
              ? 'radial-gradient(circle at 50% 42%, rgba(29,17,20,0.96), rgba(10,8,9,0.99) 72%)'
              : 'radial-gradient(circle at 50% 42%, rgba(38,24,27,0.58), rgba(13,12,13,0.78) 72%)',
            backdropFilter: unlocking ? 'none' : 'blur(22px)',
            WebkitBackdropFilter: unlocking ? 'none' : 'blur(22px)',
            transition: 'background 0.5s ease',
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
            <div className="mb-[1.5%] text-[clamp(11px,2cqw,14px)] font-medium tracking-[0.05em] text-white/68">
              Welcome to
            </div>
            <h1 className="font-display text-[clamp(36px,12.6cqw,92px)] leading-[0.92] tracking-[-0.03em] [text-wrap:balance]">
              Basecamp
            </h1>
            <div className="my-[3%] h-px w-[clamp(52px,7cqw,92px)] bg-[#eb3f43]" />
            <p className="max-w-[440px] font-display text-[clamp(17px,4.1cqw,30px)] leading-[1.1] tracking-[-0.015em] text-white/96">
              {workshopName}
            </p>
            <p className="mt-[3%] max-w-[380px] text-[clamp(12px,2.2cqw,15px)] font-medium leading-[1.5] text-white/72">
              Where the room’s best ideas become inevitable.
            </p>
          </motion.div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={
          unlocking ? { opacity: 0, y: 20 } : { opacity: 1, y: 0 }
        }
        transition={
          unlocking
            ? { duration: 0.25 }
            : { duration: 0.65, delay: 0.75, ease: EASE }
        }
        className="absolute bottom-[62px] left-1/2 z-20 w-[calc(100%-40px)] max-w-[620px] -translate-x-1/2 sm:bottom-[70px]"
      >
        <div className="mb-2.5 text-center text-[11px] font-medium tracking-[0.03em] text-white/62 sm:text-[12px]">
          Enter the workshop when you’re ready
        </div>
        <button
          type="button"
          onClick={handleEnter}
          disabled={unlocking}
          className="w-full cursor-pointer border border-white/30 bg-black/35 p-1.5 backdrop-blur-xl disabled:pointer-events-none"
        >
          <span className="block bg-[#eb3f43] px-5 py-3 text-[11px] font-bold tracking-[0.22em] text-white uppercase transition-[background,transform] duration-200 hover:-translate-y-px hover:bg-[#f26b6e] sm:text-[12px]">
            Enter workshop
          </span>
        </button>
      </motion.div>
    </motion.section>
  )
}
