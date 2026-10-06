import { useEffect } from "react"

import { EXP_FONT_FAMILIES } from "@/lib/constants"

type ExperienceFontSources = {
  font_primary_name: string | null
  font_secondary_name: string | null
}

/**
 * Loads the workshop's primary/secondary fonts and returns the
 * `--exp-font-*` CSS variables to spread onto the `data-experience-theme`
 * element. index.css applies them: primary to headings, secondary to body text.
 */
export function useExperienceFonts({
  font_primary_name: primaryUrl,
  font_secondary_name: secondaryUrl,
}: ExperienceFontSources) {
  useEffect(() => {
    const fontSources = [
      [EXP_FONT_FAMILIES.primary, primaryUrl],
      [EXP_FONT_FAMILIES.secondary, secondaryUrl],
    ] as const
    const loadedFonts: FontFace[] = []
    let isCancelled = false

    // Register only this effect's fonts; late loads must not outlive cleanup.
    const loadFont = async (family: string, url: string | null) => {
      if (!url) return

      try {
        const font = await new FontFace(
          family,
          `url(${JSON.stringify(url)})`
        ).load()

        if (isCancelled) return

        document.fonts.add(font)
        loadedFonts.push(font)
      } catch (error) {
        // Keep the existing app font when a workshop font cannot be loaded.
        console.warn(`Workshop font "${family}" failed to load: ${url}`, error)
      }
    }

    void Promise.all(fontSources.map(([family, url]) => loadFont(family, url)))

    return () => {
      isCancelled = true
      loadedFonts.forEach((font) => document.fonts.delete(font))
    }
  }, [primaryUrl, secondaryUrl])

  // A missing secondary font falls back to the primary (and vice versa)
  // before the app font, so a single configured font applies everywhere.
  const primary = primaryUrl ? `"${EXP_FONT_FAMILIES.primary}"` : null
  const secondary = secondaryUrl ? `"${EXP_FONT_FAMILIES.secondary}"` : null

  return {
    "--exp-font-primary": [primary ?? secondary, "var(--font-sans)"]
      .filter(Boolean)
      .join(", "),
    "--exp-font-secondary": [secondary ?? primary, "var(--font-sans)"]
      .filter(Boolean)
      .join(", "),
  }
}
