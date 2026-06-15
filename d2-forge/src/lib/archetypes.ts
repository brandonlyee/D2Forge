// Armor archetype data + helpers for the "build around specific pieces" (locked pieces) feature.
//
// Mirrors ARCHETYPES in api/main.py (the backend source of truth). Each archetype fixes a
// piece's primary (+30) and secondary (+25) stats; the tertiary (+20) is any of the remaining
// four stats. A "locked piece" is one the player already owns and wants every build to include.

import type { StatName } from '@/lib/constants'
import { STAT_NAMES } from '@/lib/constants'

export interface Archetype {
  name: string
  primary: StatName
  secondary: StatName
}

export const ARCHETYPES: Archetype[] = [
  { name: 'Brawler', primary: 'Melee', secondary: 'Health' },
  { name: 'Bulwark', primary: 'Health', secondary: 'Class' },
  { name: 'Grenadier', primary: 'Grenade', secondary: 'Super' },
  { name: 'Paragon', primary: 'Super', secondary: 'Melee' },
  { name: 'Gunner', primary: 'Weapons', secondary: 'Grenade' },
  { name: 'Specialist', primary: 'Class', secondary: 'Weapons' },
  { name: 'Siegebreaker', primary: 'Health', secondary: 'Grenade' },
  { name: 'Skirmisher', primary: 'Melee', secondary: 'Weapons' },
  { name: 'Demolitionist', primary: 'Grenade', secondary: 'Class' },
  { name: 'Colossus', primary: 'Super', secondary: 'Health' },
  { name: 'Reaver', primary: 'Class', secondary: 'Melee' },
  { name: 'Powerhouse', primary: 'Weapons', secondary: 'Super' },
]

export const ARCHETYPE_BY_NAME: Record<string, Archetype> = Object.fromEntries(
  ARCHETYPES.map((a) => [a.name, a]),
)

// Tuning intent for a locked piece. "tuned" pins the +5 target stat (the optimizer still picks
// the −5 donor); "flexible" lets the optimizer choose everything; "none"/"balanced" are fixed.
export type LockedTuningMode = 'none' | 'balanced' | 'flexible' | 'tuned'

// The five concrete gear slots a locked piece can occupy.
export type GearSlot = 'helmet' | 'arms' | 'chest' | 'legs' | 'class'

export const GEAR_SLOTS: GearSlot[] = ['helmet', 'arms', 'chest', 'legs', 'class']

export const GEAR_SLOT_LABEL: Record<GearSlot, string> = {
  helmet: 'Helmet',
  arms: 'Arms',
  chest: 'Chest',
  legs: 'Legs',
  class: 'Class Item',
}

export interface LockedPiece {
  // The concrete gear slot this owned piece occupies (so the checklist pre-checks the right one).
  slot: GearSlot
  archetype: string
  tertiary: string
  tuningMode: LockedTuningMode
  tunedStat?: string
}

// Valid tertiary stats for an archetype: anything that isn't its primary or secondary.
export function tertiaryOptions(archetypeName: string): StatName[] {
  const arch = ARCHETYPE_BY_NAME[archetypeName]
  if (!arch) return [...STAT_NAMES]
  return STAT_NAMES.filter((s) => s !== arch.primary && s !== arch.secondary)
}

// A locked piece is complete enough to send once it has a valid slot + archetype + tertiary
// (and, for the "tuned" mode, a +5 target stat).
export function isLockedPieceValid(p: LockedPiece): boolean {
  if (!GEAR_SLOTS.includes(p.slot)) return false
  const arch = ARCHETYPE_BY_NAME[p.archetype]
  if (!arch) return false
  if (!tertiaryOptions(p.archetype).includes(p.tertiary as StatName)) return false
  if (p.tuningMode === 'tuned' && !p.tunedStat) return false
  return true
}

// Coerce arbitrary (possibly stale-shaped) persisted data into well-formed LockedPieces:
// migrate the legacy `isClassItem` flag to a concrete slot, assign any missing/duplicate slots
// to the first free gear slot, and drop entries that can't be repaired.
export function sanitizeLockedPieces(raw: unknown): LockedPiece[] {
  if (!Array.isArray(raw)) return []
  const used = new Set<GearSlot>()
  const out: LockedPiece[] = []
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const r = item as Record<string, unknown>
    const archetype = typeof r.archetype === 'string' && ARCHETYPE_BY_NAME[r.archetype]
      ? r.archetype
      : ARCHETYPES[0].name
    const tertOpts = tertiaryOptions(archetype)
    const tertiary = typeof r.tertiary === 'string' && tertOpts.includes(r.tertiary as StatName)
      ? r.tertiary
      : tertOpts[0]
    const tuningMode: LockedTuningMode =
      r.tuningMode === 'balanced' || r.tuningMode === 'flexible' || r.tuningMode === 'tuned'
        ? r.tuningMode
        : 'none'

    // Prefer an explicit valid slot; else migrate legacy isClassItem; else first free slot.
    let slot = GEAR_SLOTS.includes(r.slot as GearSlot) ? (r.slot as GearSlot) : undefined
    if (!slot && r.isClassItem === true) slot = 'class'
    if (!slot || used.has(slot)) slot = GEAR_SLOTS.find((s) => !used.has(s))
    if (!slot) break // all five slots taken
    used.add(slot)

    out.push({
      slot,
      archetype,
      tertiary,
      tuningMode,
      tunedStat: tuningMode === 'tuned' && typeof r.tunedStat === 'string' ? r.tunedStat : undefined,
    })
  }
  return out
}

// Map a locked piece to the snake_case shape the backend expects.
export function lockedPieceToRequest(p: LockedPiece) {
  return {
    slot: p.slot,
    arch: p.archetype,
    tertiary: p.tertiary,
    tuning_mode: p.tuningMode,
    tuned_stat: p.tuningMode === 'tuned' ? p.tunedStat ?? null : null,
  }
}

// Human-readable tuning summary for display.
export function lockedTuningLabel(p: LockedPiece): string {
  switch (p.tuningMode) {
    case 'balanced':
      return 'Balanced tuning'
    case 'flexible':
      return 'Flexible tuning (optimizer decides)'
    case 'tuned':
      return p.tunedStat ? `+5 ${p.tunedStat} tuning` : 'Specific tuning'
    default:
      return 'No tuning'
  }
}
