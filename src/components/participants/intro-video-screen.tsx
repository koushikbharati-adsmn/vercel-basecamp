import { AnimatePresence, motion } from "framer-motion"
import { useState } from "react"

const EASE = [0.22, 1, 0.36, 1] as const

export function IntroVideoScreen({
  src,
  title,
  subtitle,
  onComplete,
}: {
  src: string
  title: string
  subtitle: string
  onComplete: () => void
}) {
  const [isVisible, setIsVisible] = useState(true)
  const [duration, setDuration] = useState(0)
  const [progress, setProgress] = useState(0)

  const finish = () => {
    setProgress(1)
    setIsVisible(false)
  }

  return (
    <main className="relative h-dvh overflow-hidden bg-black text-white">
      <AnimatePresence onExitComplete={onComplete}>
        {isVisible && (
          <motion.section
            key="intro-video"
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{
              opacity: 0,
              transition: { duration: 0.12, ease: "easeOut" },
            }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden bg-black pb-12"
          >
            <motion.button
              type="button"
              onClick={finish}
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8, ease: EASE }}
              className="absolute top-5 right-6 z-20 cursor-pointer text-[11px] font-bold tracking-[0.2em] text-white/60 uppercase transition-colors hover:text-white"
            >
              Skip →
            </motion.button>

            <figure className="relative z-10 flex w-full max-w-3xl flex-col items-center gap-3 px-6 text-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.5, filter: "brightness(0.15)" }}
                animate={{ opacity: 1, scale: 1, filter: "brightness(1)" }}
                exit={{
                  opacity: 0,
                  scale: 0.96,
                  filter: "brightness(0.4)",
                  transition: { duration: 0.12, ease: "easeOut" },
                }}
                transition={{ duration: 1.6, ease: EASE }}
                className="relative aspect-video w-full overflow-hidden bg-zinc-900 ring-1 ring-white/10"
              >
                <video
                  src={src}
                  autoPlay
                  muted
                  playsInline
                  preload="auto"
                  onLoadedMetadata={(event) => {
                    setDuration(event.currentTarget.duration)
                    setProgress(0)
                  }}
                  onTimeUpdate={(event) => {
                    const video = event.currentTarget
                    if (video.duration) {
                      setProgress(
                        Math.min(video.currentTime / video.duration, 1)
                      )
                    }
                  }}
                  onEnded={finish}
                  onError={finish}
                  className="size-full object-cover"
                />
              </motion.div>

              <motion.blockquote
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -3, transition: { duration: 0.1 } }}
                transition={{ delay: 0.5, duration: 0.8, ease: EASE }}
                className="font-display mt-7 max-w-2xl text-xl italic sm:text-2xl"
              >
                {title}
              </motion.blockquote>
              <motion.figcaption
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -3, transition: { duration: 0.1 } }}
                transition={{ delay: 0.9, duration: 0.8, ease: EASE }}
                className="mt-2 font-mono text-[9px] tracking-[0.25em] text-white/40 uppercase"
              >
                {subtitle}
              </motion.figcaption>
            </figure>

            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="absolute bottom-16 h-px w-40 overflow-hidden bg-white/10"
              aria-label={
                duration > 0
                  ? `${Math.round(progress * 100)}% played`
                  : "Loading video"
              }
            >
              <motion.div
                animate={{ scaleX: progress }}
                transition={{ duration: 0.08, ease: "linear" }}
                className="h-full origin-left bg-[#eb3f43]"
              />
            </motion.div>
          </motion.section>
        )}
      </AnimatePresence>
    </main>
  )
}
