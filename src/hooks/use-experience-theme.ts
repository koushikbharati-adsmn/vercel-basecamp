import type { CSSProperties } from "react"

import type { ExperienceThemeSource } from "@/components/experience/experience-theme"
import { useExperienceFonts } from "@/hooks/use-experience-fonts"

/** Returns theme CSS variables and loads fonts for a data-experience-theme root. */
export function useExperienceTheme(workshop: ExperienceThemeSource) {
  const experienceFonts = useExperienceFonts(workshop)

  return {
    ...experienceFonts,
    "--exp-header-bg-color": workshop.header_bg_color,
    "--exp-header-txt-color": workshop.header_txt_color,
    "--exp-page-bg-color": workshop.page_bg_color,
    "--exp-txt-primary-color": workshop.txt_primary_color,
    "--exp-txt-secondary-color": workshop.txt_secondary_color,
    "--exp-btn-primary-bg-color": workshop.btn_primary_bg_color,
    "--exp-btn-primary-txt-color": workshop.btn_primary_txt_color,
    "--exp-btn-secondary-bg-color": workshop.btn_secondary_bg_color,
    "--exp-btn-secondary-active-bg-color":
      workshop.btn_secondary_active_bg_color,
    "--exp-btn-secondary-txt-color": workshop.btn_secondary_txt_color,
    "--exp-btn-secondary-border-color": workshop.btn_secondary_border_color,
    "--exp-card-primary-bg-color": workshop.card_primary_bg_color,
    "--exp-card-primary-border-color": workshop.card_primary_border_color,
    "--exp-card-primary-border-radius": `${workshop.card_primary_border_radius}px`,
    "--exp-card-primary-border-width": `${workshop.card_primary_border_width}px`,
    "--exp-card-secondary-bg-color": workshop.card_secondary_bg_color,
    "--exp-card-secondary-border-radius": `${workshop.card_secondary_border_radius}px`,
    "--exp-card-secondary-txt-color": workshop.card_secondary_txt_color,
    "--exp-ticker-live-bg-color": workshop.ticker_live_bg_color,
    "--exp-ticker-live-txt-color": workshop.ticker_live_txt_color,
    "--exp-ticker-bg-color": workshop.ticker_bg_color,
    "--exp-ticker-txt-color": workshop.ticker_txt_color,
  } as CSSProperties
}
