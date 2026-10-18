import { cn } from "@/lib/utils"
import { useState } from "react"

type WorkshopLogoProps = {
  src?: string | null
  workshopName: string
  className?: string
}

/** A new URL remounts the image so an earlier load failure never sticks. */
export function WorkshopLogo(props: WorkshopLogoProps) {
  const src = props.src?.trim() || undefined
  return <LogoImage key={src ?? "fallback"} {...props} src={src} />
}

function LogoImage({ src, workshopName, className }: WorkshopLogoProps) {
  const [failed, setFailed] = useState(false)
  const useFallback = !src || failed

  return (
    <span
      className={cn(
        "inline-flex h-10 max-w-28 shrink-0 items-center justify-center bg-white px-2 py-1.5 align-middle sm:max-w-36",
        className
      )}
    >
      <img
        src={useFallback ? "/logos/ogilvy-logo-white.svg" : src}
        alt={useFallback ? "Ogilvy" : `${workshopName} logo`}
        onError={useFallback ? undefined : () => setFailed(true)}
        className={cn(
          "block h-full w-auto max-w-full min-w-0 object-contain",
          useFallback && "brightness-0"
        )}
      />
    </span>
  )
}
