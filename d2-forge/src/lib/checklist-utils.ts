import {
  ChecklistState,
  ChecklistArmorItem,
  ChecklistModItem,
  ChecklistTuningItem,
  ArmorSlot,
  SlotsUsed
} from '@/types/checklist'
import type { Solution } from '@/types/solution'
import type { FragmentSelection } from '@/lib/fragments'
import { STORAGE_KEYS } from '@/lib/constants'
import { readJSON, writeJSON, parsePiece } from '@/lib/storage'

// Generate unique ID for checklist items
function generateId(): string {
  return Math.random().toString(36).substr(2, 9)
}

// Expand solution into individual armor pieces
export function expandSolutionToChecklist(
  solution: Solution,
  targetStats: Record<string, number>,
  solutionIndex: number,
  fragments?: FragmentSelection | null
): ChecklistState {
  const armorItems: ChecklistArmorItem[] = []
  const modItems: ChecklistModItem[] = []
  const tuningItems: ChecklistTuningItem[] = []

  // User-locked pieces (piece.slot set) are already owned, so they're pre-assigned to a slot
  // and pre-completed below. Class-item locks take the class slot; armor locks fill the
  // remaining gear slots in order.
  const slotsUsed: SlotsUsed = { helmet: null, arms: null, chest: null, legs: null, class: null }
  const freeArmorSlots: ArmorSlot[] = ['helmet', 'arms', 'chest', 'legs']

  // Expand armor pieces from grouped format to individual items
  Object.entries(solution.pieces).forEach(([pieceKey, count]) => {
    const piece = parsePiece(pieceKey)
    if (!piece) return

    // Create individual items for each count
    for (let i = 0; i < count; i++) {
      const isExotic = piece.arch.toLowerCase().includes('exotic')
      const isExoticClassItem = piece.arch.toLowerCase().includes('exotic class item')
      const isLocked = piece.slot === 'armor' || piece.slot === 'class'
      const isClassItem = piece.slot === 'class'

      // Every piece — including the Exotic Class Item — has an open tuning slot.
      // Backend "none"/"tuned" both mean the slot can take a +5/-5 mod, so surface
      // those as "flexible"; only "balanced" is a distinct, fixed tuning choice.
      const tuningMode: 'flexible' | 'balanced' | 'none' =
        piece.tuning_mode === 'balanced' ? 'balanced' : 'flexible'

      const itemId = generateId()

      // Pre-assign owned pieces to a concrete slot and mark them acquired.
      let assignedSlot: ArmorSlot | null = null
      if (isClassItem && !slotsUsed.class) {
        assignedSlot = 'class'
      } else if (isLocked) {
        assignedSlot = freeArmorSlots.shift() ?? null
      }
      if (assignedSlot) slotsUsed[assignedSlot] = itemId

      armorItems.push({
        id: itemId,
        archetype: piece.arch,
        tertiary: piece.tertiary,
        isExotic,
        isExoticClassItem,
        isLocked,
        isClassItem,
        tuningMode,
        assignedSlot,
        selectedTuning: null,
        isCompleted: isLocked
      })

      // Add mod requirement for this piece
      modItems.push({
        id: generateId(),
        stat: piece.mod_target,
        isCompleted: false
      })
    }
  })

  // Extract tuning requirements from pieces
  const tuningRequirementsMap: Record<string, { count: number, siphon_from: string }> = {}
  
  Object.entries(solution.pieces).forEach(([pieceKey, count]) => {
    const piece = parsePiece(pieceKey)
    if (!piece) return

    // If this piece has tuning requirements
    if (piece.tuned_stat && piece.siphon_from) {
      const key = `${piece.tuned_stat}-${piece.siphon_from}`
      if (!tuningRequirementsMap[key]) {
        tuningRequirementsMap[key] = {
          count: 0,
          siphon_from: piece.siphon_from
        }
      }
      tuningRequirementsMap[key].count += count
    }
  })

  // Convert to individual tuning items
  Object.entries(tuningRequirementsMap).forEach(([key, data]) => {
    const [targetStat] = key.split('-')
    for (let i = 0; i < data.count; i++) {
      tuningItems.push({
        id: generateId(),
        targetStat,
        siphonStat: data.siphon_from,
        isCompleted: false,
        assignedToItemId: null
      })
    }
  })

  const checklistId = `checklist-${Date.now()}-${generateId()}`
  
  return {
    id: checklistId,
    name: `Build Solution ${solutionIndex + 1}`,
    solutionData: {
      targetStats,
      deviation: solution.deviation,
      originalSolutionId: JSON.stringify(solution.pieces), // Store for deletion tracking
      ...(fragments ? { fragments } : {})
    },
    armorItems,
    modItems,
    tuningItems,
    slotsUsed,
    createdAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString()
  }
}

// Get available slots for an armor item
export function getAvailableSlots(
  item: ChecklistArmorItem, 
  slotsUsed: SlotsUsed
): string[] {
  // Both exotic and locked legendary class items belong in the class slot.
  if (item.isExoticClassItem || item.isClassItem) {
    return slotsUsed.class && slotsUsed.class !== item.id ? [] : ['class']
  }

  if (item.isExotic) {
    // Regular exotics can't go in class slot
    return (['helmet', 'arms', 'chest', 'legs'] as const).filter(
      slot => !slotsUsed[slot as keyof SlotsUsed]
    )
  }
  
  // Regular armor can use any available slot
  return (['helmet', 'arms', 'chest', 'legs', 'class'] as const).filter(
    slot => !slotsUsed[slot as keyof SlotsUsed]
  )
}

// Save checklist to localStorage
export function saveChecklist(checklist: ChecklistState): void {
  const existing = loadChecklists()
  existing[checklist.id] = {
    ...checklist,
    lastUpdated: new Date().toISOString()
  }
  writeJSON('local', STORAGE_KEYS.checklists, existing)
}

// Load all checklists from localStorage
export function loadChecklists(): Record<string, ChecklistState> {
  return readJSON<Record<string, ChecklistState>>('local', STORAGE_KEYS.checklists, {})
}

// Delete checklist from localStorage
export function deleteChecklist(checklistId: string): void {
  const existing = loadChecklists()
  const deletedChecklist = existing[checklistId]
  delete existing[checklistId]
  writeJSON('local', STORAGE_KEYS.checklists, existing)

  // Remove from saved solutions tracking
  if (deletedChecklist) {
    removeSavedSolution(deletedChecklist)
  }

  // Notify other components that a checklist was deleted
  window.dispatchEvent(new CustomEvent('checklistDeleted', {
    detail: { checklistId, checklist: deletedChecklist }
  }))
}

// Remove solution from saved solutions tracking
function removeSavedSolution(checklist: ChecklistState): void {
  const solutionId = checklist.solutionData?.originalSolutionId
  if (!solutionId) return

  const savedSolutions = new Set(readJSON<string[]>('session', STORAGE_KEYS.savedSolutions, []))
  savedSolutions.delete(solutionId)
  writeJSON('session', STORAGE_KEYS.savedSolutions, Array.from(savedSolutions))
}