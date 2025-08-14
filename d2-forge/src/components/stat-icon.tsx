import Image from 'next/image'

interface StatIconProps {
  stat: string
  size?: number
  className?: string
}

const STAT_ICONS: Record<string, string> = {
  Health: '/health.png',
  Melee: '/melee.png', 
  Grenade: '/grenade.png',
  Super: '/super.png',
  Class: '/class.png',
  Weapons: '/weapons.png',
}

const ARCHETYPE_TO_PRIMARY_STAT: Record<string, string> = {
  Brawler: 'Melee',
  Bulwark: 'Health', 
  Grenadier: 'Grenade',
  Paragon: 'Super',
  Gunner: 'Weapons',
  Specialist: 'Class',
}

export function StatIcon({ stat, size = 24, className = "" }: StatIconProps) {
  // If it's an archetype, get the corresponding primary stat
  const statToUse = ARCHETYPE_TO_PRIMARY_STAT[stat] || stat
  const iconPath = STAT_ICONS[statToUse]

  if (!iconPath) {
    return null
  }

  return (
    <Image
      src={iconPath}
      alt={`${statToUse} icon`}
      width={size}
      height={size}
      className={`inline-block ${className}`}
      suppressHydrationWarning
    />
  )
}