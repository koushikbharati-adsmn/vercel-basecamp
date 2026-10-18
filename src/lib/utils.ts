import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/** Combines conditional class names and resolves conflicting Tailwind utilities. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Creates a UUID-shaped UI identifier, even without secure-context crypto APIs.
 * The Math.random fallback is not suitable for secrets or security tokens.
 */
export function generateRandomId(): string {
  const crypto = globalThis.crypto
  if (typeof crypto?.randomUUID === "function") return crypto.randomUUID()

  const bytes = new Uint8Array(16)
  if (typeof crypto?.getRandomValues === "function") {
    crypto.getRandomValues(bytes)
  } else {
    for (let index = 0; index < bytes.length; index++) {
      bytes[index] = Math.floor(Math.random() * 256)
    }
  }

  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0"))
  return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex.slice(6, 8).join("")}-${hex.slice(8, 10).join("")}-${hex.slice(10).join("")}`
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
