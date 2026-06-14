import type { FragmentSelection } from '@/lib/fragments'

export type ArmorSlot = 'helmet' | 'arms' | 'chest' | 'legs' | 'class'

export interface ChecklistArmorItem {
  id: string
  archetype: string
  tertiary: string
  isExotic: boolean
  isExoticClassItem: boolean
  // A user-locked piece the player already owns: pre-assigned to a slot and pre-completed.
  isLocked: boolean
  // True when this piece belongs in the class slot (a locked legendary class item).
  isClassItem: boolean
  tuningMode: 'flexible' | 'balanced' | 'none'
  assignedSlot: ArmorSlot | null
  selectedTuning: string | null
  isCompleted: boolean
}

export interface ChecklistModItem {
  id: string
  stat: string
  isCompleted: boolean
}

export interface ChecklistTuningItem {
  id: string
  targetStat: string
  siphonStat: string
  isCompleted: boolean
  assignedToItemId: string | null
}

export interface SlotsUsed {
  helmet: string | null
  arms: string | null
  chest: string | null
  legs: string | null
  class: string | null
}

export interface ChecklistState {
  id: string
  name: string
  solutionData: {
    targetStats: Record<string, number>
    deviation: number
    originalSolutionId?: string
    // Subclass fragments this build relies on (baseline stat shifts), if any.
    fragments?: FragmentSelection
  }
  armorItems: ChecklistArmorItem[]
  modItems: ChecklistModItem[]
  tuningItems: ChecklistTuningItem[]
  slotsUsed: SlotsUsed
  createdAt: string
  lastUpdated: string
}

export interface ChecklistStorage {
  [checklistId: string]: ChecklistState
}