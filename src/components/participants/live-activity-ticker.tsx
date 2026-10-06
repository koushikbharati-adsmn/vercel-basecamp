import { formatActivityTime } from '@/lib/date'
import type { WorkshopActivity } from '@/services/big-screen'
import { useLayoutEffect, useRef, useState } from 'react'

const TICKER_SPEED = 50

function ActivityStrip({ activities }: { activities: WorkshopActivity[] }) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<Animation | null>(null)
  const [spacerWidth, setSpacerWidth] = useState(0)

  useLayoutEffect(() => {
    const viewport = viewportRef.current
    const track = trackRef.current
    const content = contentRef.current
    if (!viewport || !track || !content) return

    const measure = () => {
      const contentWidth = content.getBoundingClientRect().width
      const viewportWidth = viewport.getBoundingClientRect().width
      if (!contentWidth || !viewportWidth) return

      const nextSpacerWidth = contentWidth < viewportWidth * 1.5 ? viewportWidth : 64
      setSpacerWidth(nextSpacerWidth)
      const distance = contentWidth + nextSpacerWidth
      const duration = (distance / TICKER_SPEED) * 1000

      animationRef.current?.cancel()
      animationRef.current = track.animate(
        [
          { transform: 'translate3d(0, 0, 0)' },
          { transform: `translate3d(${-distance}px, 0, 0)` },
        ],
        { duration, iterations: Number.POSITIVE_INFINITY, easing: 'linear' },
      )
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(viewport)
    observer.observe(content)

    return () => {
      observer.disconnect()
      animationRef.current?.cancel()
    }
  }, [activities])

  const setPaused = (paused: boolean) => {
    if (paused) animationRef.current?.pause()
    else animationRef.current?.play()
  }

  return (
    <div
      ref={viewportRef}
      className="min-w-0 flex-1 overflow-hidden"
      onPointerEnter={(event) => event.pointerType === 'mouse' && setPaused(true)}
      onPointerLeave={(event) => event.pointerType === 'mouse' && setPaused(false)}
    >
      <div ref={trackRef} className="flex w-max whitespace-nowrap will-change-transform">
        {[0, 1].map((copy) => (
          <div key={copy} className="flex shrink-0 items-center" aria-hidden={copy === 1}>
            <div ref={copy === 0 ? contentRef : undefined} className="flex shrink-0 items-center">
              {activities.map((activity) => (
                <div key={`${copy}-${activity.ID}`} className="flex items-center gap-2 px-8 text-[13px]">
                  <span className="bg-[#b91423] px-2 py-0.5 text-[10px] font-bold tracking-[0.1em] uppercase">
                    {activity.TeamName}
                  </span>
                  <span className="font-medium">{activity.Message}</span>
                  <span className="text-white/35" aria-hidden="true">·</span>
                  <time className="font-mono text-[11px] text-white/55" dateTime={activity.CreatedDttm}>
                    {formatActivityTime(activity.CreatedDttm)}
                  </time>
                </div>
              ))}
            </div>
            <div className="shrink-0" style={{ width: spacerWidth }} />
          </div>
        ))}
      </div>
    </div>
  )
}

export function LiveActivityTicker({
  activities,
  isPending,
  isError,
}: {
  activities: WorkshopActivity[]
  isPending: boolean
  isError: boolean
}) {
  return (
    <footer className="fixed inset-x-0 bottom-0 z-50 flex h-12 overflow-hidden border-t border-white/10 bg-[#171416] text-white">
      <div className="relative z-10 flex shrink-0 items-center bg-[#b91423] px-5">
        <span className="live-pulse mr-2 size-1.5 rounded-full bg-white" />
        <span className="text-[11px] font-bold tracking-[0.2em] uppercase">Live</span>
      </div>
      <div className="flex min-w-0 flex-1 items-center overflow-hidden">
        {activities.length > 0 ? (
          <ActivityStrip activities={activities} />
        ) : (
          <p className="px-8 text-xs font-medium text-white/65">
            {isPending
              ? 'Loading latest activity…'
              : isError
                ? 'Live activity is temporarily unavailable.'
                : 'The room is quiet. Activity will appear here live.'}
          </p>
        )}
      </div>
    </footer>
  )
}
