"use client"

import React, { useState } from 'react'
import { ArmorSlotButtons } from '@/components/armor-slot-buttons'
import { TuningDropdown } from '@/components/tuning-dropdown'
import { StatIcon } from '@/components/stat-icon'
import { FragmentList } from '@/components/fragment-list'
import { Icon } from '@/components/forge/icons'
import { ChecklistState, ArmorSlot, ChecklistArmorItem } from '@/types/checklist'
import { saveChecklist } from '@/lib/checklist-utils'
import { STAT_NAMES } from '@/lib/constants'

const SLOT_LABEL: Record<ArmorSlot, string> = {
  helmet: 'Helmet',
  arms: 'Arms',
  chest: 'Chest',
  legs: 'Legs',
  class: 'Class Item',
}

function pieceTuningLabel(item: ChecklistArmorItem): string {
  if (item.tuningMode === 'balanced') return 'Balanced tuning'
  if (item.tuningMode === 'flexible') return 'Flexible tuning'
  return 'No tuning slot'
}

interface ChecklistViewProps {
  checklist: ChecklistState
  onUpdate: (updatedChecklist: ChecklistState) => void
  onDelete: (checklistId: string) => void
}

export function ChecklistView({ checklist, onUpdate, onDelete }: ChecklistViewProps) {
  const [deleteState, setDeleteState] = useState<'idle' | 'confirming'>('idle')
  const [copied, setCopied] = useState(false)
  
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
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
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

  const isDone = progressPercentage === 100

  return (
    <div className="panel">
      <div className="ck-head">
        <div style={{ minWidth: 0 }}>
          <div className="ck-title">
            {checklist.name}
            <span className={'tag ' + (isDone ? 'match' : 'balanced')}>{progressPercentage}% Complete</span>
          </div>
          <div className="ck-target">
            <span style={{ color: 'var(--faint-foreground)', letterSpacing: '.1em' }}>TARGET</span>
            {STAT_NAMES.map((stat) => (
              <span className="ts" key={stat}>
                <StatIcon stat={stat} size={13} /> <b>{checklist.solutionData.targetStats[stat] ?? 0}</b>
              </span>
            ))}
          </div>
        </div>
        <div className="ck-actions">
          <button className="btn sm" onClick={copyToClipboard}>
            {copied ? <Icon.check style={{ width: 14, height: 14 }} /> : <Icon.copy style={{ width: 14, height: 14 }} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
          {deleteState === 'confirming' ? (
            <>
              <button className="btn sm danger" onClick={handleDelete}>
                <Icon.trash style={{ width: 14, height: 14 }} /> Confirm
              </button>
              <button className="btn icon sm" onClick={handleCancelDelete} aria-label="Cancel delete">
                <Icon.x style={{ width: 14, height: 14 }} />
              </button>
            </>
          ) : (
            <button className="btn icon sm" title="Delete" onClick={handleDelete} aria-label="Delete">
              <Icon.trash style={{ width: 14, height: 14 }} />
            </button>
          )}
        </div>
      </div>

      <div className="ck-progress">
        <div className={'pbar' + (isDone ? ' done' : '')}>
          <span style={{ width: progressPercentage + '%' }} />
        </div>
        <span className={'pval' + (isDone ? ' done' : '')}>
          {totalCompleted}/{totalItems}
        </span>
      </div>

      <div className="panel-body">
        <div className="ck-grid">
        <div className="ck-main">
        {/* Armor pieces to farm */}
        <div className="sol-section">
          <div className="subhead">Armor Pieces to Farm</div>
          {checklist.armorItems.map((item, index) => (
            <div
              className={'ck-piece' + (item.isExotic ? ' is-exotic' : '') + (item.isCompleted ? ' done' : '')}
              key={item.id}
            >
              <div className="ck-piece-top">
                <span className="ck-idx">{String(index + 1).padStart(2, '0')}</span>
                <div className="ck-pico">
                  <StatIcon stat={item.isExoticClassItem ? 'Class' : item.archetype.replace('Exotic ', '')} size={17} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <div className="ck-pname">
                    {item.archetype}
                    {item.isExotic ? '' : ' Armor'}
                    {item.isExotic && <span className="tag exotic">Exotic</span>}
                  </div>
                  <div className="ck-ptert">
                    Tertiary: <StatIcon stat={item.tertiary} size={13} /> {item.tertiary} · {pieceTuningLabel(item)}
                  </div>
                </div>
                <span className="pspacer" />
                {item.isCompleted && item.assignedSlot && (
                  <span className="done-badge">
                    <Icon.check /> {SLOT_LABEL[item.assignedSlot]}
                  </span>
                )}
              </div>
              <div className="ck-controls">
                <div className="ck-ctl-group">
                  <span className="gl">Slot</span>
                  <ArmorSlotButtons
                    item={item}
                    slotsUsed={checklist.slotsUsed}
                    onSlotSelect={(slot) => handleSlotSelect(item.id, slot)}
                  />
                </div>
                <div className="ck-ctl-group">
                  <span className="gl">Tuning</span>
                  <TuningDropdown item={item} onTuningSelect={(tuning) => handleTuningSelect(item.id, tuning)} />
                </div>
              </div>
            </div>
          ))}
        </div>
        </div>

        <div className="ck-side">
        {/* Subclass fragments this build relies on */}
        {checklist.solutionData.fragments && (
          <div className="sol-section">
            <div className="subhead">Subclass Fragments</div>
            <FragmentList selection={checklist.solutionData.fragments} />
          </div>
        )}

        {/* Mods needed */}
        <div className="sol-section">
          <div className="subhead">Mods Needed</div>
          <div className="mod-grid">
            {checklist.modItems.map((mod) => (
              <div
                className={'mod-check' + (mod.isCompleted ? ' done' : '')}
                key={mod.id}
                onClick={() => handleModToggle(mod.id)}
              >
                <span className="box"><Icon.check /></span>
                <span className={'txt' + (mod.isCompleted ? ' done' : '')}>
                  +10 <StatIcon stat={mod.stat} size={14} /> {mod.stat} Mod
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Tuning requirements */}
        {checklist.tuningItems.length > 0 && (
          <div className="sol-section">
            <div className="subhead">Tuning Requirements</div>
            {checklist.tuningItems.map((tuning) => (
              <div className={'tune ck-tune' + (tuning.isCompleted ? ' done' : '')} key={tuning.id}>
                <div className="th">
                  <span
                    className="box"
                    style={{
                      width: 15,
                      height: 15,
                      border: '1.5px solid var(--border-strong)',
                      borderRadius: 3,
                      display: 'inline-grid',
                      placeItems: 'center',
                      color: tuning.isCompleted ? 'var(--primary-foreground)' : 'transparent',
                      background: tuning.isCompleted ? 'var(--success)' : 'transparent',
                      borderColor: tuning.isCompleted ? 'var(--success)' : 'var(--border-strong)',
                    }}
                  >
                    <Icon.check style={{ width: 10, height: 10 }} />
                  </span>
                  <StatIcon stat={tuning.targetStat} size={15} /> {tuning.targetStat} Tuning
                </div>
                <div className="pair">
                  <span className="chiplet plus">
                    +5 <StatIcon stat={tuning.targetStat} size={13} /> {tuning.targetStat}
                  </span>
                  <span className="sep">/</span>
                  <span className="chiplet minus">
                    −5 <StatIcon stat={tuning.siphonStat} size={13} /> {tuning.siphonStat}
                  </span>
                </div>
                {tuning.isCompleted && (
                  <span className="auto">
                    <Icon.check /> Auto-completed by tuning selection
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
        </div>
        </div>
      </div>
    </div>
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

  const fragments = checklist.solutionData.fragments
  if (fragments) {
    lines.push(`SUBCLASS FRAGMENTS (${fragments.subclassName}):`)
    fragments.fragments.forEach((frag) => {
      const effect = Object.entries(frag.effects)
        .map(([stat, delta]) => `${delta > 0 ? '+' : ''}${delta} ${stat}`)
        .join(', ')
      lines.push(`- ${frag.name} (${effect})`)
    })
    lines.push('')
  }

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