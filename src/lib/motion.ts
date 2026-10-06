// Showcase motion grammar: structure → hero → content, decelerating arrivals,
// accelerating departures. No elastic/bounce motion on the working surface.
export const EASE = [0.16, 1, 0.3, 1] as const
export const EASE_EXIT = [0.62, 0, 0.9, 0.4] as const
export const DUR = { cut: 0.25, beat: 0.5, draw: 0.55 } as const
export const BEAT = { structure: 0.1, hero: 0.28, content: 0.5, detail: 0.66 } as const
export const STAGGER = 0.08
export const STAGGER_DENSE = 0.04
