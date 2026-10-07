import {
  Children,
  isValidElement,
  useLayoutEffect,
  useRef,
  type ReactNode,
} from "react"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import { DUR, EASE, EASE_EXIT, STAGGER_DENSE } from "@/lib/motion"

/** Measure natural content, not grid tracks, so image/font loads can safely reflow the wall. */
function MasonryItem({
  children,
  index,
}: {
  children: ReactNode
  index: number
}) {
  const reducedMotion = useReducedMotion()
  const itemRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const item = itemRef.current
    const content = contentRef.current
    if (!item || !content) return
    const measure = () => {
      // One-pixel tracks plus a 16px bottom gutter keep each card at its own height.
      item.style.gridRowEnd = `span ${Math.max(1, Math.ceil(content.getBoundingClientRect().height + 16))}`
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(content)
    return () => observer.disconnect()
  }, [])

  return (
    <motion.div
      ref={itemRef}
      initial={{ opacity: 0, y: reducedMotion ? 0 : 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{
        opacity: 0,
        transition: { duration: reducedMotion ? 0 : DUR.cut, ease: EASE_EXIT },
      }}
      transition={{
        duration: reducedMotion ? 0 : DUR.beat,
        delay: reducedMotion ? 0 : Math.min(index, 6) * STAGGER_DENSE,
        ease: EASE,
      }}
      className="min-w-0 self-start"
    >
      <div ref={contentRef} className="flow-root">
        {children}
      </div>
    </motion.div>
  )
}

export function IdeaMasonry({ children }: { children: ReactNode }) {
  return (
    <div className="grid auto-rows-[1px] grid-flow-dense grid-cols-1 items-start gap-x-4 min-[760px]:grid-cols-2 min-[1200px]:grid-cols-3 min-[1800px]:grid-cols-4">
      <AnimatePresence>
        {Children.toArray(children).map((child, index) => (
          <MasonryItem
            key={isValidElement(child) ? (child.key ?? index) : index}
            index={index}
          >
            {child}
          </MasonryItem>
        ))}
      </AnimatePresence>
    </div>
  )
}
