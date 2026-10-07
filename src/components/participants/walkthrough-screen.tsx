import { WalkthroughIcon } from "@/lib/walkthrough-icons"
import type { ParticipantWorkshopWalkthrough } from "@/services/participants"
import { AnimatePresence, motion } from "framer-motion"
import { useState } from "react"

export function WalkthroughScreen({
  steps,
  onComplete,
}: {
  steps: ParticipantWorkshopWalkthrough[]
  onComplete: () => void
}) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const currentStep = steps[currentStepIndex]

  if (!currentStep) {
    return (
      <main className="grid min-h-dvh place-items-center bg-app px-6 pb-12 text-center text-inverse">
        <div>
          <h1 className="font-display text-4xl">You’re ready.</h1>
          <button
            type="button"
            onClick={onComplete}
            className="mt-8 cursor-pointer bg-entry-action px-9 py-3 text-xs font-bold tracking-[0.18em] text-on-entry-action uppercase hover:bg-entry-action-hover"
          >
            Begin
          </button>
        </div>
      </main>
    )
  }

  const isFirstStep = currentStepIndex === 0
  const isLastStep = currentStepIndex === steps.length - 1
  const goNext = () => {
    if (isLastStep) onComplete()
    else setCurrentStepIndex((index) => index + 1)
  }

  return (
    <main className="grid min-h-dvh place-items-center bg-app px-4 py-8 pb-20 text-inverse sm:px-6">
      <motion.section
        initial={{ opacity: 0, y: 12, scale: 0.99 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="flex min-h-[28rem] w-full max-w-5xl flex-col overflow-hidden border border-line-inverse/14 bg-entry-panel shadow-[0_24px_80px_color-mix(in_srgb,var(--shadow-color)_40%,transparent)] sm:min-h-[32rem]"
      >
        <div
          className="relative border-b border-line-inverse/10"
          role="progressbar"
          aria-label="Walkthrough progress"
          aria-valuemin={1}
          aria-valuemax={steps.length}
          aria-valuenow={currentStepIndex + 1}
        >
          <div className="absolute inset-x-0 top-0 h-1 bg-entry-action" />
          <div className="flex items-stretch gap-2 px-6 pt-6 pb-4">
            {steps.map((step, index) => {
              const isActive = index === currentStepIndex
              return (
                <button
                  type="button"
                  key={step.ID}
                  onClick={() => setCurrentStepIndex(index)}
                  className="min-w-0 flex-1 cursor-pointer"
                  aria-label={`Go to step ${index + 1}: ${step.tabName ?? step.Title}`}
                >
                  <span className="relative block h-1 overflow-hidden bg-tint-inverse/10">
                    {isActive && (
                      <motion.span
                        layoutId="walkthrough-active-tab"
                        className="absolute inset-0 bg-tint-inverse"
                        transition={{
                          type: "spring",
                          stiffness: 350,
                          damping: 32,
                        }}
                      />
                    )}
                  </span>
                  <span
                    className={`mt-3 block truncate text-center text-xs font-semibold tracking-wide uppercase ${isActive ? "text-inverse" : "text-inverse/45"}`}
                  >
                    <span className="sm:hidden">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="hidden sm:inline">
                      {step.tabName ?? `Step ${index + 1}`}
                    </span>
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        <div
          aria-live="polite"
          className="relative flex flex-1 flex-col justify-center overflow-hidden px-6 py-12 sm:px-14 sm:py-16 lg:px-20"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep.ID}
              initial={{ opacity: 0, y: 18, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -12, filter: "blur(3px)" }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className="grid gap-3"
            >
              <div className="flex items-center gap-3 text-inverse/55">
                <WalkthroughIcon
                  iconKey={currentStep.fileName}
                  className="size-5"
                />
                <span className="text-[13px] font-bold tracking-[0.28em] uppercase">
                  {currentStep.tabName ?? `Step ${currentStepIndex + 1}`}
                </span>
              </div>
              <h1 className="font-display max-w-4xl text-4xl leading-[1.08] tracking-[-0.035em] sm:text-5xl lg:text-6xl">
                {currentStep.Title}
              </h1>
              <p className="mt-2 max-w-2xl text-base leading-[1.65] whitespace-pre-line text-inverse/60 sm:text-lg">
                {currentStep.Description}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        <footer className="flex items-center justify-end gap-3 border-t border-line-inverse/10 px-6 py-5 sm:px-12">
          {!isFirstStep && (
            <button
              type="button"
              onClick={() => setCurrentStepIndex((index) => index - 1)}
              className="cursor-pointer border border-line-inverse/25 px-6 py-3 text-xs font-bold tracking-[0.14em] uppercase hover:bg-tint-inverse/8"
            >
              Previous
            </button>
          )}
          <button
            type="button"
            onClick={goNext}
            className="cursor-pointer bg-entry-action px-7 py-3 text-xs font-bold tracking-[0.14em] text-on-entry-action uppercase hover:bg-entry-action-hover"
          >
            {isLastStep ? "Begin" : "Next"}
          </button>
        </footer>
      </motion.section>
    </main>
  )
}
