"use client"

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArmorSlotButtons } from '@/components/armor-slot-buttons'
import { TuningDropdown } from '@/components/tuning-dropdown'
import { StatIcon } from '@/components/stat-icon'
import { ChecklistState, ArmorSlot } from '@/types/checklist'
import { saveChecklist } from '@/lib/checklist-utils'
import { Copy, Trash2 } from 'lucide-react'

interface ChecklistViewProps {
  checklist: ChecklistState
  onUpdate: (updatedChecklist: ChecklistState) => void
  onDelete: (checklistId: string) => void
}

export function ChecklistView({ checklist, onUpdate, onDelete }: ChecklistViewProps) {
  
  const handleSlotSelect = (itemId: string, slot: ArmorSlot) => {
    const updatedChecklist = { ...checklist }
    
    // Find the item being updated
    const itemIndex = updatedChecklist.armorItems.findIndex(item => item.id === itemId)
    if (itemIndex === -1) return
    
    const item = updatedChecklist.armorItems[itemIndex]
    
    // If clicking the same slot, unassign it
    if (item.assignedSlot === slot) {
      updatedChecklist.armorItems[itemIndex] = {
        ...item,
        assignedSlot: null,
        isCompleted: false
      }
      updatedChecklist.slotsUsed[slot] = null
    } else {
      // Clear previous slot assignment if any
      if (item.assignedSlot) {
        updatedChecklist.slotsUsed[item.assignedSlot] = null
      }
      
      // Assign new slot
      updatedChecklist.armorItems[itemIndex] = {
        ...item,
        assignedSlot: slot,
        isCompleted: true
      }
      updatedChecklist.slotsUsed[slot] = itemId
    }
    
    // Update tuning completion status
    updateTuningCompletion(updatedChecklist)
    
    // Save and update
    saveChecklist(updatedChecklist)
    onUpdate(updatedChecklist)
  }

  const handleTuningSelect = (itemId: string, tuning: string | null) => {
    const updatedChecklist = { ...checklist }
    
    // Find the item being updated
    const itemIndex = updatedChecklist.armorItems.findIndex(item => item.id === itemId)
    if (itemIndex === -1) return
    
    updatedChecklist.armorItems[itemIndex] = {
      ...updatedChecklist.armorItems[itemIndex],
      selectedTuning: tuning
    }
    
    // Update tuning completion status
    updateTuningCompletion(updatedChecklist)
    
    // Save and update
    saveChecklist(updatedChecklist)
    onUpdate(updatedChecklist)
  }

  const updateTuningCompletion = (updatedChecklist: ChecklistState) => {
    // Reset all tuning completions
    updatedChecklist.tuningItems.forEach(tuningItem => {
      tuningItem.isCompleted = false
      tuningItem.assignedToItemId = null
    })

    // Check which tunings are satisfied by armor pieces with selected tunings
    updatedChecklist.armorItems.forEach(armorItem => {
      if (armorItem.selectedTuning) {
        // Find an incomplete tuning requirement that matches
        const matchingTuning = updatedChecklist.tuningItems.find(tuningItem => 
          tuningItem.targetStat === armorItem.selectedTuning && 
          !tuningItem.isCompleted
        )
        
        if (matchingTuning) {
          matchingTuning.isCompleted = true
          matchingTuning.assignedToItemId = armorItem.id
        }
      }
    })
  }

  const handleModToggle = (modId: string) => {
    const updatedChecklist = { ...checklist }
    const modIndex = updatedChecklist.modItems.findIndex(mod => mod.id === modId)
    if (modIndex === -1) return
    
    updatedChecklist.modItems[modIndex] = {
      ...updatedChecklist.modItems[modIndex],
      isCompleted: !updatedChecklist.modItems[modIndex].isCompleted
    }
    
    saveChecklist(updatedChecklist)
    onUpdate(updatedChecklist)
  }

  const copyToClipboard = () => {
    const checklistText = generateChecklistText(checklist)
    navigator.clipboard.writeText(checklistText)
  }

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this checklist?')) {
      onDelete(checklist.id)
    }
  }

  // Calculate progress (excluding mods from completion calculation)
  const completedArmor = checklist.armorItems.filter(item => item.isCompleted).length
  const totalArmor = checklist.armorItems.length
  const completedMods = checklist.modItems.filter(mod => mod.isCompleted).length
  const totalMods = checklist.modItems.length
  const completedTuning = checklist.tuningItems.filter(tuning => tuning.isCompleted).length
  const totalTuning = checklist.tuningItems.length
  
  const totalCompleted = completedArmor + completedTuning
  const totalItems = totalArmor + totalTuning
  const progressPercentage = totalItems > 0 ? Math.round((totalCompleted / totalItems) * 100) : 0

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {checklist.name}
              <Badge variant={progressPercentage === 100 ? "default" : "secondary"}>
                {progressPercentage}% Complete
              </Badge>
            </CardTitle>
            <CardDescription>
              Target: {Object.entries(checklist.solutionData.targetStats)
                .map(([stat, value]) => `${value} ${stat}`)
                .join(', ')}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={copyToClipboard}>
              <Copy className="h-4 w-4 mr-1" />
              Copy
            </Button>
            <Button variant="destructive" size="sm" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Armor Pieces Section */}
        <div>
          <h4 className="font-medium mb-3">Armor Pieces to Farm:</h4>
          <div className="space-y-3">
            {checklist.armorItems.map((item, index) => (
              <div key={item.id} className="p-3 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium flex items-center gap-1">
                      {index + 1}. 
                      <StatIcon stat={item.archetype.replace('Exotic ', '')} size={16} />
                      {item.archetype}
                    </span>
                    {item.isExotic && <Badge variant="destructive" className="text-xs">Exotic</Badge>}
                  </div>
                  {item.isCompleted && (
                    <Badge variant="default" className="text-xs">
                      {item.assignedSlot?.charAt(0).toUpperCase()}{item.assignedSlot?.slice(1)}
                    </Badge>
                  )}
                </div>
                <div className="text-sm text-muted-foreground mb-3">
                  Tertiary: <StatIcon stat={item.tertiary} size={14} className="inline mx-1" /> {item.tertiary}
                  {item.tuningMode === 'flexible' && ' - Flexible tuning'}
                  {item.tuningMode === 'balanced' && ' - Balanced tuning'}
                  {item.tuningMode === 'none' && item.isExotic && ' - No tuning slot'}
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">Slot:</span>
                    <ArmorSlotButtons
                      item={item}
                      slotsUsed={checklist.slotsUsed}
                      onSlotSelect={(slot) => handleSlotSelect(item.id, slot)}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">Tuning:</span>
                    <TuningDropdown
                      item={item}
                      onTuningSelect={(tuning) => handleTuningSelect(item.id, tuning)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mods Section */}
        <div>
          <h4 className="font-medium mb-3">Mods Needed:</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {checklist.modItems.map((mod, index) => (
              <div
                key={mod.id}
                className={`flex items-center gap-2 p-2 border rounded cursor-pointer transition-colors ${
                  mod.isCompleted ? 'bg-green-50 border-green-200' : 'hover:bg-gray-50'
                }`}
                onClick={() => handleModToggle(mod.id)}
              >
                <input
                  type="checkbox"
                  checked={mod.isCompleted}
                  onChange={() => handleModToggle(mod.id)}
                  className="h-4 w-4"
                />
                <span className={mod.isCompleted ? 'line-through text-muted-foreground' : ''}>
                  +10 <StatIcon stat={mod.stat} size={16} className="inline mx-1" /> {mod.stat} Mod
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Tuning Requirements Section */}
        {checklist.tuningItems.length > 0 && (
          <div>
            <h4 className="font-medium mb-3">Tuning Requirements:</h4>
            <div className="space-y-2">
              {checklist.tuningItems.map((tuning, index) => (
                <div
                  key={tuning.id}
                  className={`flex items-center gap-2 p-2 border rounded ${
                    tuning.isCompleted ? 'bg-green-50 border-green-200' : ''
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={tuning.isCompleted}
                    disabled
                    className="h-4 w-4"
                  />
                  <span className={tuning.isCompleted ? 'line-through text-muted-foreground' : ''}>
                    <StatIcon stat={tuning.targetStat} size={16} className="inline mx-1" />
                    {tuning.targetStat} Tuning: +5 {tuning.targetStat} / -5 {tuning.siphonStat}
                  </span>
                  {tuning.isCompleted && tuning.assignedToItemId && (
                    <Badge variant="outline" className="text-xs ml-auto">
                      Auto-completed
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Generate text format for copying
function generateChecklistText(checklist: ChecklistState): string {
  const lines: string[] = []
  
  lines.push(`D2 Forge - Farming Checklist (${checklist.name})`)
  lines.push(`Target Stats: ${Object.entries(checklist.solutionData.targetStats)
    .map(([stat, value]) => `${value} ${stat}`)
    .join(', ')}`)
  lines.push('')
  
  lines.push('ARMOR PIECES TO FARM:')
  checklist.armorItems.forEach((item, index) => {
    const status = item.isCompleted ? '✓' : '□'
    const slot = item.assignedSlot ? ` (${item.assignedSlot})` : ''
    const tuning = item.tuningMode === 'flexible' 
      ? ' - Flexible tuning -- See TUNING REQUIREMENTS section for details'
      : item.tuningMode === 'balanced'
      ? ' - Balanced tuning'
      : ' - No tuning slot'
    lines.push(`${status} ${item.archetype} (Tertiary: ${item.tertiary})${slot}${tuning}`)
  })
  lines.push('')
  
  lines.push('MODS NEEDED:')
  checklist.modItems.forEach((mod) => {
    const status = mod.isCompleted ? '✓' : '□'
    lines.push(`${status} +10 ${mod.stat} Mod`)
  })
  
  if (checklist.tuningItems.length > 0) {
    lines.push('')
    lines.push('TUNING REQUIREMENTS:')
    checklist.tuningItems.forEach((tuning) => {
      const status = tuning.isCompleted ? '✓' : '□'
      lines.push(`${status} ${tuning.targetStat} Tuning: +5 ${tuning.targetStat} / -5 ${tuning.siphonStat}`)
    })
  }
  
  return lines.join('\n')
}