import { Children, isValidElement, useLayoutEffect, useRef, type ReactNode } from 'react'

/** Measure natural content, not grid tracks, so image/font loads can safely reflow the wall. */
function MasonryItem({ children }: { children: ReactNode }) {
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

  return <div ref={itemRef} className="min-w-0 self-start"><div ref={contentRef} className="flow-root">{children}</div></div>
}

export function IdeaMasonry({ children }: { children: ReactNode }) {
  return (
    <div className="ideate-wall">
      {Children.toArray(children).map((child, index) => (
        <MasonryItem key={isValidElement(child) ? child.key ?? index : index}>{child}</MasonryItem>
      ))}
    </div>
  )
}
