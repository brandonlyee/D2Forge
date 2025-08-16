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

  // Extract tuning requirements from pieces
  const tuningRequirementsMap: Record<string, { count: number, siphon_from: string }> = {}
  
  Object.entries(solution.pieces).forEach(([pieceKey, count]) => {
    try {
      const piece: PieceType = JSON.parse(pieceKey)
      
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
    } catch (error) {
      console.warn('Failed to parse piece for tuning requirements:', pieceKey, error)
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
      originalSolutionId: JSON.stringify(solution.pieces) // Store for deletion tracking
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
    const deletedChecklist = existing[checklistId]
    delete existing[checklistId]
    localStorage.setItem('d2forge-checklists', JSON.stringify(existing))
    
    // Remove from saved solutions tracking
    if (deletedChecklist) {
      removeSavedSolution(deletedChecklist)
    }
    
    // Notify other components that a checklist was deleted
    window.dispatchEvent(new CustomEvent('checklistDeleted', { 
      detail: { checklistId, checklist: deletedChecklist } 
    }))
  } catch (error) {
    console.error('Failed to delete checklist:', error)
  }
}

// Remove solution from saved solutions tracking
function removeSavedSolution(checklist: ChecklistState): void {
  try {
    const solutionId = checklist.solutionData?.originalSolutionId
    if (solutionId) {
      const saved = sessionStorage.getItem('d2forge-saved-solutions')
      if (saved) {
        const savedSolutions = new Set(JSON.parse(saved))
        savedSolutions.delete(solutionId)
        sessionStorage.setItem('d2forge-saved-solutions', JSON.stringify(Array.from(savedSolutions)))
      }
    }
  } catch (error) {
    console.warn('Failed to remove saved solution:', error)
  }
}