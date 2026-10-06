import { format, formatDistanceToNow, isToday, isValid } from "date-fns"

/** Interprets a trailing-Z timestamp as an India-offset wall clock, not UTC. */
const parseDate = (value: string) => new Date(value.replace(/Z$/, "+05:30"))

/** Formats time relative to now; unlike ticker clock time, this label can age. */
export function formatRelativeDate(value: string) {
  return formatDistanceToNow(parseDate(value), {
    addSuffix: true,
  })
}

// Absolute clock time for the activity ticker. Relative labels ("2 min ago")
// would go stale while the strip loops, so today's items show "HH:mm" and
// older ones add the day ("24 Sep, 14:05").
export function formatActivityTime(value: string) {
  const date = parseDate(value)
  if (!isValid(date)) return ""

  return format(date, isToday(date) ? "HH:mm" : "d MMM, HH:mm")
}
