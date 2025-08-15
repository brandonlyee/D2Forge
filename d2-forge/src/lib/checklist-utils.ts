import { 
  ChecklistState, 
  ChecklistArmorItem, 
  ChecklistModItem, 
  ChecklistTuningItem,
  SlotsUsed 
} from '@/types/checklist'

interface PieceType {
  arch: string
  tertiary: string
  tuning_mode: string
  mod_target: string
  tuned_stat?: string | null
  siphon_from?: string | null
}

interface Solution {
  pieces: Record<string, number>
  deviation: number
  actualStats?: number[]
  tuningRequirements?: Record<string, Array<{count: number, siphon_from: string}>>
  flexiblePieces?: number
}

// Generate unique ID for checklist items
function generateId(): string {
  return Math.random().toString(36).substr(2, 9)
}

// Expand solution into individual armor pieces
export function expandSolutionToChecklist(
  solution: Solution,
  targetStats: Record<string, number>,
  solutionIndex: number
): ChecklistState {
  const armorItems: ChecklistArmorItem[] = []
  const modItems: ChecklistModItem[] = []
  const tuningItems: ChecklistTuningItem[] = []

  // Expand armor pieces from grouped format to individual items
  Object.entries(solution.pieces).forEach(([pieceKey, count]) => {
    try {
      const piece: PieceType = JSON.parse(pieceKey)
      
      // Create individual items for each count
      for (let i = 0; i < count; i++) {
        const isExotic = piece.arch.toLowerCase().includes('exotic')
        const isExoticClassItem = piece.arch.toLowerCase().includes('exotic class item')
        
        armorItems.push({
          id: generateId(),
          archetype: piece.arch,
          tertiary: piece.tertiary,
          isExotic,
          isExoticClassItem,
          tuningMode: piece.tuning_mode as 'flexible' | 'balanced' | 'none',
          assignedSlot: null,
          selectedTuning: null,
          isCompleted: false
        })

        // Add mod requirement for this piece
        modItems.push({
          id: generateId(),
          stat: piece.mod_target,
          isCompleted: false
        })
      }
    } catch (error) {
      console.warn('Failed to parse piece:', pieceKey, error)
    }
  })

  // Expand tuning requirements into individual items
  if (solution.tuningRequirements) {
    Object.entries(solution.tuningRequirements).forEach(([stat, tuningDetails]) => {
      tuningDetails.forEach((detail) => {
        for (let i = 0; i < detail.count; i++) {
          tuningItems.push({
            id: generateId(),
            targetStat: stat,
            siphonStat: detail.siphon_from,
            isCompleted: false,
            assignedToItemId: null
          })
        }
      })
    })
  }

  const checklistId = `checklist-${Date.now()}-${generateId()}`
  
  return {
    id: checklistId,
    name: `Build Solution ${solutionIndex + 1}`,
    solutionData: {
      targetStats,
      deviation: solution.deviation
    },
    armorItems,
    modItems,
    tuningItems,
    slotsUsed: {
      helmet: null,
      arms: null,
      chest: null,
      legs: null,
      class: null
    },
    createdAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString()
  }
}

// Get available slots for an armor item
export function getAvailableSlots(
  item: ChecklistArmorItem, 
  slotsUsed: SlotsUsed
): string[] {
  if (item.isExoticClassItem) {
    return slotsUsed.class ? [] : ['class']
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

// Check if item can have tuning
export function canHaveTuning(item: ChecklistArmorItem): boolean {
  return !item.isExotic && !item.isExoticClassItem
}

// Save checklist to localStorage
export function saveChecklist(checklist: ChecklistState): void {
  try {
    const existing = JSON.parse(localStorage.getItem('d2forge-checklists') || '{}')
    existing[checklist.id] = {
      ...checklist,
      lastUpdated: new Date().toISOString()
    }
    localStorage.setItem('d2forge-checklists', JSON.stringify(existing))
  } catch (error) {
    console.error('Failed to save checklist:', error)
  }
}

// Load all checklists from localStorage
export function loadChecklists(): Record<string, ChecklistState> {
  try {
    return JSON.parse(localStorage.getItem('d2forge-checklists') || '{}')
  } catch (error) {
    console.error('Failed to load checklists:', error)
    return {}
  }
}

// Delete checklist from localStorage
export function deleteChecklist(checklistId: string): void {
  try {
    const existing = JSON.parse(localStorage.getItem('d2forge-checklists') || '{}')
    delete existing[checklistId]
    localStorage.setItem('d2forge-checklists', JSON.stringify(existing))
  } catch (error) {
    console.error('Failed to delete checklist:', error)
  }
}