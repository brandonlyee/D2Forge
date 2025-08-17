"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArmorSlotButtons } from '@/components/armor-slot-buttons'
import { TuningDropdown } from '@/components/tuning-dropdown'
import { StatIcon } from '@/components/stat-icon'
import { ChecklistState, ArmorSlot } from '@/types/checklist'
import { saveChecklist } from '@/lib/checklist-utils'
import { Copy, Trash2, X } from 'lucide-react'

interface ChecklistViewProps {
  checklist: ChecklistState
  onUpdate: (updatedChecklist: ChecklistState) => void
  onDelete: (checklistId: string) => void
}

export function ChecklistView({ checklist, onUpdate, onDelete }: ChecklistViewProps) {
  const [deleteState, setDeleteState] = useState<'idle' | 'confirming'>('idle')
  
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
    if (deleteState === 'idle') {
      setDeleteState('confirming')
    } else {
      onDelete(checklist.id)
    }
  }

  const handleCancelDelete = () => {
    setDeleteState('idle')
  }

  // Calculate progress (excluding mods from completion calculation)
  const completedArmor = checklist.armorItems.filter(item => item.isCompleted).length
  const totalArmor = checklist.armorItems.length
  const completedTuning = checklist.tuningItems.filter(tuning => tuning.isCompleted).length
  const totalTuning = checklist.tuningItems.length
  
  const totalCompleted = completedArmor + completedTuning
  const totalItems = totalArmor + totalTuning
  const progressPercentage = totalItems > 0 ? Math.round((totalCompleted / totalItems) * 100) : 0

  return (
    <Card className="w-full">
      <CardHeader className="pb-4 sm:pb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="space-y-2">
            <CardTitle className="flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="text-base sm:text-lg">{checklist.name}</span>
              <Badge variant={progressPercentage === 100 ? "default" : "secondary"} className="text-xs self-start">
                {progressPercentage}% Complete
              </Badge>
            </CardTitle>
            <CardDescription className="text-sm">
              Target: {Object.entries(checklist.solutionData.targetStats)
                .map(([stat, value]) => `${value} ${stat}`)
                .join(', ')}
            </CardDescription>
          </div>
          <div className="flex gap-2 self-start sm:self-center">
            <Button variant="outline" size="sm" onClick={copyToClipboard} className="h-8 sm:h-9 px-2 sm:px-3">
              <Copy className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">Copy</span>
            </Button>
{deleteState === 'confirming' ? (
              <div className="flex gap-2">
                <Button variant="destructive" size="sm" onClick={handleDelete} className="h-8 sm:h-9 px-2 sm:px-3">
                  <Trash2 className="h-4 w-4 sm:mr-1" />
                  <span className="hidden sm:inline">Confirm Delete</span>
                  <span className="sm:hidden">Delete</span>
                </Button>
                <Button variant="outline" size="sm" onClick={handleCancelDelete} className="h-8 sm:h-9 px-2">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button variant="outline" size="sm" onClick={handleDelete} className="h-8 sm:h-9 px-2 sm:px-3">
                <Trash2 className="h-4 w-4 sm:mr-1" />
                <span className="hidden sm:inline">Delete</span>
                <span className="sm:hidden sr-only">Delete</span>
              </Button>
            )}
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
                      {item.assignedSlot === 'class' 
                        ? 'Class Item' 
                        : item.assignedSlot 
                          ? item.assignedSlot.charAt(0).toUpperCase() + item.assignedSlot.slice(1)
                          : ''
                      }
                    </Badge>
                  )}
                </div>
                <div className="text-sm text-muted-foreground mb-3">
                  Tertiary: <StatIcon stat={item.tertiary} size={14} className="inline mx-1" /> {item.tertiary}
                  {item.tuningMode === 'flexible' && ' - Flexible tuning'}
                  {item.tuningMode === 'balanced' && ' - Balanced tuning'}
                  {item.tuningMode === 'none' && item.isExotic && ' - No tuning slot'}
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
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
            {checklist.modItems.map((mod) => (
              <div
                key={mod.id}
                className={`flex items-center gap-2 p-2 border rounded cursor-pointer transition-colors ${
                  mod.isCompleted 
                    ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' 
                    : 'hover:bg-muted/50 dark:hover:bg-muted/20'
                }`}
                onClick={() => handleModToggle(mod.id)}
              >
                <input
                  type="checkbox"
                  checked={mod.isCompleted}
                  onChange={() => {}} // Remove handler to prevent conflicts
                  className="h-4 w-4 pointer-events-none" // Disable direct clicking on checkbox
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
              {checklist.tuningItems.map((tuning) => (
                <div
                  key={tuning.id}
                  className={`p-3 border rounded-lg ${
                    tuning.isCompleted ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' : 'bg-muted/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={tuning.isCompleted}
                      disabled
                      className="h-4 w-4 mt-1"
                    />
                    <div className="flex-1 space-y-2">
                      <div className="font-medium flex items-center gap-1 text-sm">
                        <StatIcon stat={tuning.targetStat} size={16} />
                        {tuning.targetStat} Tuning:
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        <span className="flex items-center gap-1 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded">
                          +5 <StatIcon stat={tuning.targetStat} size={14} /> {tuning.targetStat}
                        </span>
                        <span className="text-muted-foreground">/</span>
                        <span className="flex items-center gap-1 bg-red-100 dark:bg-red-900/30 px-2 py-1 rounded">
                          -5 <StatIcon stat={tuning.siphonStat} size={14} /> {tuning.siphonStat}
                        </span>
                      </div>
                      {tuning.isCompleted && tuning.assignedToItemId && (
                        <Badge variant="outline" className="text-xs">
                          Auto-completed
                        </Badge>
                      )}
                    </div>
                  </div>
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
  checklist.armorItems.forEach((item) => {
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