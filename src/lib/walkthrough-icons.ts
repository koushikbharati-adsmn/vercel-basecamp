import {
  BookmarkIcon,
  CircleHelpIcon,
  CompassIcon,
  HomeIcon,
  LightbulbIcon,
  NewspaperIcon,
  SparklesIcon,
  TargetIcon,
  TrophyIcon,
  UsersIcon,
  VoteIcon,
  WandSparklesIcon,
  type LucideIcon,
} from 'lucide-react'
import { createElement } from 'react'

const WALKTHROUGH_ICONS: Record<string, LucideIcon> = {
  home: HomeIcon,
  lightbulb: LightbulbIcon,
  sparkles: SparklesIcon,
  users: UsersIcon,
  vote: VoteIcon,
  trophy: TrophyIcon,
  newspaper: NewspaperIcon,
  compass: CompassIcon,
  target: TargetIcon,
  bookmark: BookmarkIcon,
  wand: WandSparklesIcon,
  help: CircleHelpIcon,
}

export function getWalkthroughIcon(iconKey?: string | null) {
  return (iconKey && WALKTHROUGH_ICONS[iconKey]) || LightbulbIcon
}

export function WalkthroughIcon({
  iconKey,
  className,
}: {
  iconKey?: string | null
  className?: string
}) {
  return createElement(getWalkthroughIcon(iconKey), {
    className,
    'aria-hidden': true,
  })
}
