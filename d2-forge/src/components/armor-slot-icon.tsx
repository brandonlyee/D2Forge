interface ArmorSlotIconProps {
  slot: 'helmet' | 'arms' | 'chest' | 'legs' | 'class'
  size?: number
  className?: string
}

const SLOT_ICONS: Record<string, string> = {
  helmet: '/helmet.svg',
  arms: '/arms.svg', 
  chest: '/chest.svg',
  legs: '/boots.svg',
  class: '/class-item.svg'
}

const SLOT_LABELS: Record<string, string> = {
  helmet: 'Helmet',
  arms: 'Arms',
  chest: 'Chest', 
  legs: 'Legs',
  class: 'Class Item'
}

export function ArmorSlotIcon({ slot, size = 24, className = "" }: ArmorSlotIconProps) {
  const iconPath = SLOT_ICONS[slot]
  const label = SLOT_LABELS[slot]

  if (!iconPath) {
    return null
  }

  return (
    <img
      src={iconPath}
      alt={`${label} slot`}
      width={size}
      height={size}
      className={`inline-block filter dark:invert invert-0 ${className}`}
      suppressHydrationWarning
    />
  )
}