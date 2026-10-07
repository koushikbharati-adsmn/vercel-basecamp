import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/** Combines conditional class names and resolves conflicting Tailwind utilities. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Splits a seconds-based duration into display hours, minutes, and seconds. */
export function getDurationParts(totalSeconds: number) {
  return {
    hours: Math.floor(totalSeconds / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  }
}

/** Builds avatar initials from first/last words, with a blank-name fallback. */
export function getInitials(name?: string, fallback = "U") {
  if (!name?.trim()) return fallback

  const parts = name.trim().split(/\s+/)

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase()
  }

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

/** Chooses dark or white text for a solid hex-color background. */
export function getReadableTextColor(background: string) {
  const value = background.replace("#", "")
  const hex =
    value.length === 3
      ? value
          .split("")
          .map((character) => character.repeat(2))
          .join("")
      : value

  const color = Number.parseInt(hex, 16)
  const brightness =
    (((color >> 16) & 255) * 299 +
      ((color >> 8) & 255) * 587 +
      (color & 255) * 114) /
    1000

  return brightness > 150 ? "#231f20" : "#ffffff"
}

/** Selects an item randomly, returning undefined for an empty collection. */
export function getRandomItem<T>(items: readonly T[]) {
  if (items.length === 0) return undefined

  return items[Math.floor(Math.random() * items.length)]
}

// Resolves an idea's image, falling back to a placeholder chosen by idea ID so
// the same idea shows the same placeholder in every view (no useState needed).
export function getIdeaPlaceholderImage(
  idea: { ID: number; imageFileName?: string | null },
  placeholderImages?: readonly { fileName: string }[] | null
) {
  const own = idea.imageFileName?.trim()
  if (own) return own
  if (!placeholderImages?.length) return undefined

  const index = Math.abs(Number(idea.ID) || 0) % placeholderImages.length
  return placeholderImages[index].fileName.trim() || undefined
}
