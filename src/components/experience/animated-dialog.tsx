import { useBodyScrollLock } from "@/hooks/use-body-scroll-lock"
import { cn } from "@/lib/utils"
import { DUR, EASE, EASE_EXIT } from "@/lib/motion"
import {
  motion,
  useIsPresent,
  useReducedMotion,
  type HTMLMotionProps,
} from "framer-motion"
import { useLayoutEffect, useRef, useSyncExternalStore } from "react"

const mobileQuery = "(max-width: 639px)"
const subscribeToMobile = (callback: () => void) => {
  const media = window.matchMedia(mobileQuery)
  media.addEventListener("change", callback)
  return () => media.removeEventListener("change", callback)
}
const isMobileScreen = () => window.matchMedia(mobileQuery).matches
const serverSnapshot = () => false

type AnimatedDialogProps = Omit<
  HTMLMotionProps<"dialog">,
  "open" | "onClose" | "onCancel"
> & {
  onClose: () => void
  dismissDisabled?: boolean
  variant?: "panel" | "fullscreen"
  mobileSheet?: boolean
}

/** Use inside AnimatePresence. Native focus/inertness and scroll locking remain
 * active throughout the exit; the element closes only once it is unmounted.
 */
export function AnimatedDialog({
  children,
  className,
  onClose,
  dismissDisabled = false,
  variant = "panel",
  mobileSheet = false,
  ...props
}: AnimatedDialogProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const present = useIsPresent()
  const reducedMotion = useReducedMotion()
  const isMobile = useSyncExternalStore(
    subscribeToMobile,
    isMobileScreen,
    serverSnapshot
  )
  const isSheet = mobileSheet && isMobile && variant === "panel"
  useBodyScrollLock(true)

  useLayoutEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (!dialog.open) dialog.showModal()
    return () => {
      if (dialog.open) dialog.close()
    }
  }, [])

  return (
    <motion.dialog
      {...props}
      ref={ref}
      className={cn(
        "animated-dialog [&_button:enabled]:cursor-pointer",
        variant === "panel" &&
          "fixed inset-0 m-auto max-h-[calc(100dvh-48px)] w-[min(640px,calc(100vw-32px))] overflow-y-auto border border-line/20 bg-workspace p-[clamp(24px,4vw,40px)] text-content shadow-[0_24px_64px_color-mix(in_srgb,var(--dialog-shadow-color)_25%,transparent)] backdrop:bg-[color-mix(in_srgb,var(--dialog-backdrop-color)_65%,transparent)]",
        className,
        mobileSheet &&
          variant === "panel" &&
          "max-sm:inset-x-0 max-sm:top-auto max-sm:bottom-0 max-sm:m-0 max-sm:max-h-dvh max-sm:w-full max-sm:max-w-none max-sm:overscroll-contain max-sm:rounded-none max-sm:pb-[max(24px,env(safe-area-inset-bottom))]"
      )}
      inert={!present}
      data-state={present ? "open" : "closing"}
      initial={{
        opacity: 0,
        scale: reducedMotion || isSheet ? 1 : 0.95,
        y: reducedMotion || !isSheet ? 0 : "100%",
      }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{
        opacity: 0,
        scale: reducedMotion || isSheet ? 1 : 0.95,
        y: reducedMotion || !isSheet ? 0 : "100%",
        transition: { duration: reducedMotion ? 0 : DUR.cut, ease: EASE_EXIT },
      }}
      transition={{ duration: reducedMotion ? 0 : DUR.beat, ease: EASE }}
      onCancel={(event) => {
        event.preventDefault()
        event.stopPropagation()
        if (present && !dismissDisabled) onClose()
      }}
      onClose={(event) => {
        event.stopPropagation()
        // StrictMode may queue a close event and then reopen the same element.
        if (!ref.current?.open && present && !dismissDisabled) onClose()
      }}
    >
      {children}
    </motion.dialog>
  )
}
