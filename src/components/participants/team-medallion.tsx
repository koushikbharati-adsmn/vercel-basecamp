import { useEffect, useRef, useState } from "react"

function readableTextColor(hex: string) {
  const value = hex.replace("#", "")
  const full =
    value.length === 3
      ? value
          .split("")
          .map((character) => character.repeat(2))
          .join("")
      : value
  if (!/^[0-9a-f]{6}$/i.test(full)) return "#ffffff"

  const number = Number.parseInt(full, 16)
  const brightness =
    (((number >> 16) & 255) * 299 +
      ((number >> 8) & 255) * 587 +
      (number & 255) * 114) /
    1000
  return brightness > 150 ? "#231f20" : "#ffffff"
}

function shade(hex: string, amount: number) {
  const normalized = /^#[0-9a-f]{6}$/i.test(hex) ? hex : "#7a2b2e"
  const number = Number.parseInt(normalized.slice(1), 16)
  const target = amount < 0 ? 0 : 255
  const strength = Math.abs(amount)
  const mix = (value: number) => Math.round(value + (target - value) * strength)
  const red = mix((number >> 16) & 255)
  const green = mix((number >> 8) & 255)
  const blue = mix(number & 255)
  return `#${((red << 16) | (green << 8) | blue).toString(16).padStart(6, "0")}`
}

const FIELD_BODIES = [
  {
    x: 0.24,
    y: 0.26,
    radius: 0.5,
    stretchX: 1.3,
    stretchY: 0.85,
    phase: 0.4,
    drift: 0.8,
    color: 1,
  },
  {
    x: 0.78,
    y: 0.3,
    radius: 0.44,
    stretchX: 0.95,
    stretchY: 1.2,
    phase: 2.2,
    drift: 0.55,
    color: 2,
  },
  {
    x: 0.7,
    y: 0.76,
    radius: 0.54,
    stretchX: 1.25,
    stretchY: 0.8,
    phase: 3.9,
    drift: 0.65,
    color: 3,
  },
  {
    x: 0.26,
    y: 0.8,
    radius: 0.42,
    stretchX: 0.9,
    stretchY: 1.15,
    phase: 5.3,
    drift: 0.7,
    color: 2,
  },
  {
    x: 0.52,
    y: 0.48,
    radius: 0.4,
    stretchX: 1.45,
    stretchY: 0.7,
    phase: 1.6,
    drift: 0.5,
    color: 4,
  },
] as const

function GenerativeField({
  color,
  inkText,
  animate,
}: {
  color: string
  inkText: boolean
  animate: boolean
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const timeRef = useRef(-1)

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext("2d")
    if (!canvas || !context) return

    const palette = inkText
      ? [
          shade(color, 0.12),
          color,
          shade(color, 0.34),
          shade(color, -0.18),
          shade(color, 0.22),
        ]
      : [
          shade(color, -0.34),
          color,
          shade(color, -0.5),
          shade(color, 0.2),
          shade(color, -0.16),
        ]
    const seed = (Number.parseInt(color.replace("#", ""), 16) % 89) / 7 || 1
    if (timeRef.current < 0) timeRef.current = seed * 60000
    let width = 0
    let height = 0
    let frame = 0
    let last = 0

    const resize = () => {
      const bounds = canvas.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      width = Math.max(1, bounds.width)
      height = Math.max(1, bounds.height)
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      context.setTransform(dpr, 0, 0, dpr, 0, 0)
    }

    const draw = () => {
      const time = timeRef.current * 0.00015
      const edge = Math.min(width, height)
      context.fillStyle = palette[0]
      context.fillRect(0, 0, width, height)

      FIELD_BODIES.forEach((body) => {
        const orbit = time * body.drift + body.phase + seed
        const x = body.x * width + Math.sin(orbit * 1.13) * edge * 0.1
        const y = body.y * height + Math.cos(orbit * 0.87) * edge * 0.09
        const radius = edge * body.radius
        context.save()
        context.translate(x, y)
        context.rotate(Math.sin(orbit * 0.31) * 0.2)
        context.scale(body.stretchX, body.stretchY)
        const gradient = context.createRadialGradient(0, 0, 0, 0, 0, radius)
        gradient.addColorStop(0, `${palette[body.color]}e0`)
        gradient.addColorStop(0.5, `${palette[body.color]}7d`)
        gradient.addColorStop(1, `${palette[body.color]}00`)
        context.fillStyle = gradient
        context.beginPath()
        context.arc(0, 0, radius, 0, Math.PI * 2)
        context.fill()
        context.restore()
      })
    }

    const tick = (now: number) => {
      timeRef.current += now - last
      last = now
      draw()
      frame = window.requestAnimationFrame(tick)
    }
    const observer = new ResizeObserver(() => {
      resize()
      draw()
    })
    observer.observe(canvas)
    resize()
    draw()
    if (animate) {
      last = performance.now()
      frame = window.requestAnimationFrame(tick)
    }

    return () => {
      window.cancelAnimationFrame(frame)
      observer.disconnect()
    }
  }, [animate, color, inkText])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 size-full scale-[1.14] blur-[22px] saturate-[1.06]"
      aria-hidden="true"
    />
  )
}

export function TeamMedallion({
  name,
  description,
  color,
  image,
  isActive,
  isPending,
  onSelect,
  onFocus,
}: {
  name: string
  description: string
  color: string
  image?: string | null
  isActive: boolean
  isPending: boolean
  onSelect: () => void
  onFocus: () => void
}) {
  const [imageFailed, setImageFailed] = useState(false)
  const hasImage = Boolean(image) && !imageFailed
  const textColor = hasImage ? "#ffffff" : readableTextColor(color)
  const inkText = textColor !== "#ffffff"
  const initial = name.trim().charAt(0)
  const backfaceHidden = {
    backfaceVisibility: "hidden" as const,
    WebkitBackfaceVisibility: "hidden" as const,
  }

  return (
    <>
      {isActive && (
        <div
          className="pointer-events-none absolute -inset-[52px] rounded-full"
          style={{
            background: `radial-gradient(circle, ${color}40 30%, ${color}1a 55%, transparent 72%)`,
            ...backfaceHidden,
          }}
        />
      )}
      <div
        className="pointer-events-none absolute -inset-[9px] rounded-full border-[2.5px]"
        style={{
          borderColor: color,
          opacity: isActive ? 0.95 : 0.4,
          transition: "opacity .5s ease",
          ...backfaceHidden,
        }}
      />
      <div
        className="absolute inset-0 overflow-hidden rounded-full"
        style={{
          background: color,
          clipPath: "circle(50% at 50% 50%)",
          boxShadow: `inset 0 0 0 1px ${isActive ? "rgba(255,255,255,.35)" : "rgba(255,255,255,.12)"}`,
          filter: isActive ? "brightness(1)" : "brightness(.62) saturate(.85)",
          transition: "box-shadow .5s ease, filter .7s ease",
          ...backfaceHidden,
        }}
      >
        {hasImage ? (
          <img
            src={image ?? undefined}
            alt=""
            onError={() => setImageFailed(true)}
            className="absolute inset-0 size-full object-cover opacity-60 contrast-125 grayscale"
          />
        ) : (
          <GenerativeField color={color} inkText={inkText} animate={isActive} />
        )}
        {hasImage && (
          <div className="pointer-events-none absolute inset-0 bg-black/45" />
        )}
        {!hasImage && (
          <div
            aria-hidden="true"
            className="font-display pointer-events-none absolute top-[46%] left-[56%] -translate-1/2 text-[300px] leading-none italic opacity-[.09] select-none"
            style={{ color: textColor }}
          >
            {initial}
          </div>
        )}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle, ${inkText ? "rgba(35,31,32,.05)" : "rgba(255,255,255,.04)"} 1px, transparent 1px)`,
            backgroundSize: "4px 4px",
          }}
        />
        <div
          className="absolute inset-0 flex flex-col items-center justify-center px-9 text-center"
          style={{ color: textColor }}
        >
          <div className="mb-1.5 text-[11px] font-bold tracking-[.32em] uppercase opacity-80">
            Team
          </div>
          <div className="font-display text-[44px] leading-[1.05]">{name}</div>
          <div
            className="font-display mt-3 min-h-[46px] text-[18px] leading-[1.35] italic"
            style={{
              opacity: isActive ? 1 : 0,
              transition: "opacity .4s ease",
            }}
          >
            {description || "Make the best ideas inevitable."}
          </div>
          <button
            type="button"
            disabled={isPending}
            onClick={(event) => {
              event.stopPropagation()
              if (isActive) onSelect()
              else onFocus()
            }}
            className="mt-6 cursor-pointer rounded-full border-2 bg-transparent px-6 py-2.5 text-[13px] font-bold tracking-[1px] transition-all hover:bg-white/10 disabled:cursor-wait"
            style={{ borderColor: textColor, color: textColor }}
          >
            {isPending ? "Entering…" : "Enter Team →"}
          </button>
        </div>
      </div>
      <div
        className="absolute inset-0 overflow-hidden rounded-full"
        style={{
          background: shade(color, -0.3),
          clipPath: "circle(50% at 50% 50%)",
          transform: "rotateY(180deg)",
          ...backfaceHidden,
        }}
      >
        {hasImage ? (
          <>
            <img
              src={image ?? undefined}
              alt=""
              onError={() => setImageFailed(true)}
              className="absolute inset-0 size-full object-cover opacity-60 contrast-125 grayscale"
            />
            <div
              className="pointer-events-none absolute inset-0 opacity-85 mix-blend-color"
              style={{ background: color }}
            />
            <div
              className="pointer-events-none absolute inset-0 opacity-30"
              style={{ background: color }}
            />
          </>
        ) : (
          <GenerativeField color={color} inkText={inkText} animate={false} />
        )}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle, ${inkText ? "rgba(35,31,32,.05)" : "rgba(255,255,255,.04)"} 1px, transparent 1px)`,
            backgroundSize: "4px 4px",
          }}
        />
      </div>
    </>
  )
}
