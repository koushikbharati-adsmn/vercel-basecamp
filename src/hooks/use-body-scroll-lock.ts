import { useLayoutEffect } from 'react'

let lockCount = 0
let restoreStyles: (() => void) | null = null

/** Reference-counted so closing one modal cannot unlock another open modal. */
export function useBodyScrollLock(locked: boolean) {
  useLayoutEffect(() => {
    if (!locked) return

    if (lockCount === 0) {
      const root = document.documentElement
      const body = document.body
      const properties = [
        [root, 'overflow'],
        [body, 'overflow'],
        [body, 'padding-right'],
      ] as const
      const previous = properties.map(([element, property]) => ({
        element, property,
        value: element.style.getPropertyValue(property),
        priority: element.style.getPropertyPriority(property),
      }))
      const scrollbarWidth = window.innerWidth - root.clientWidth
      const paddingRight = parseFloat(window.getComputedStyle(body).paddingRight) || 0
      root.style.setProperty('overflow', 'hidden')
      body.style.setProperty('overflow', 'hidden')
      if (scrollbarWidth > 0) body.style.setProperty('padding-right', `${paddingRight + scrollbarWidth}px`)

      restoreStyles = () => {
        previous.forEach(({ element, property, value, priority }) => {
          if (value) element.style.setProperty(property, value, priority)
          else element.style.removeProperty(property)
        })
      }
    }
    lockCount += 1

    return () => {
      lockCount -= 1
      if (lockCount === 0) {
        restoreStyles?.()
        restoreStyles = null
      }
    }
  }, [locked])
}
