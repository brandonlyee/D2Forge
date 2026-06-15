"use client"

import React, { useState } from 'react'
import { StatIcon } from '@/components/stat-icon'
import { FragmentList } from '@/components/fragment-list'
import { Logo, Icon } from '@/components/forge/icons'
import { expandSolutionToChecklist, saveChecklist } from '@/lib/checklist-utils'
import type { FragmentSelection } from '@/lib/fragments'
import { GEAR_SLOTS, GEAR_SLOT_LABEL, type GearSlot } from '@/lib/archetypes'
import type { PieceType, Solution } from '@/types/solution'
import { STAT_NAMES, STORAGE_KEYS } from '@/lib/constants'
import { readJSON, writeJSON, parsePiece } from '@/lib/storage'

interface SolutionDisplayProps {
  solutions: Solution[]
  desiredStats: Record<string, number>
  fragments?: FragmentSelection | null
  isLoading?: boolean
  error?: string | null
}

export function SolutionDisplay({ solutions, desiredStats, fragments = null, isLoading = false, error = null }: SolutionDisplayProps) {
  // Load saved solution states from sessionStorage synchronously for initial render
  const getInitialButtonStates = (): Record<number, 'idle' | 'editing' | 'saving' | 'saved'> => {
    const savedSolutions = new Set(readJSON<string[]>('session', STORAGE_KEYS.savedSolutions, []))
    const initialStates: Record<number, 'idle' | 'editing' | 'saving' | 'saved'> = {}

    solutions.forEach((solution, index) => {
      const solutionId = JSON.stringify(solution.pieces)
      initialStates[index] = savedSolutions.has(solutionId) ? 'saved' : 'idle'
    })

    return initialStates
  }

  const [buttonStates, setButtonStates] = useState<Record<number, 'idle' | 'editing' | 'saving' | 'saved'>>(getInitialButtonStates)
  const [editingNames, setEditingNames] = useState<Record<number, string>>({})

  // Create a unique identifier for a solution
  const getSolutionId = (solution: Solution) => {
    return JSON.stringify(solution.pieces)
  }

  // Load saved solution states from sessionStorage
  const loadSavedSolutions = (): Set<string> =>
    new Set(readJSON<string[]>('session', STORAGE_KEYS.savedSolutions, []))

  // Save solution as saved to sessionStorage
  const markSolutionAsSaved = (solutionId: string) => {
    const savedSolutions = loadSavedSolutions()
    savedSolutions.add(solutionId)
    writeJSON('session', STORAGE_KEYS.savedSolutions, Array.from(savedSolutions))
  }

  // Update button states when solutions change or checklist is deleted
  React.useEffect(() => {
    const updateButtonStates = () => {
      const savedSolutions = loadSavedSolutions()
      const updatedStates: Record<number, 'idle' | 'editing' | 'saving' | 'saved'> = {}
      
      solutions.forEach((solution, index) => {
        const solutionId = getSolutionId(solution)
        if (savedSolutions.has(solutionId)) {
          updatedStates[index] = 'saved'
        } else {
          updatedStates[index] = 'idle'
        }
      })
      
      setButtonStates(updatedStates)
    }

    // Only update when solutions change (not on initial mount)
    if (solutions.length > 0) {
      updateButtonStates()
    }

    // Listen for checklist deletions
    const handleChecklistDeleted = () => {
      updateButtonStates()
    }

    window.addEventListener('checklistDeleted', handleChecklistDeleted)
    
    return () => {
      window.removeEventListener('checklistDeleted', handleChecklistDeleted)
    }
  }, [solutions])

  const handleStartEdit = (solutionIndex: number) => {
    setButtonStates(prev => ({ ...prev, [solutionIndex]: 'editing' }))
    setEditingNames(prev => ({ 
      ...prev, 
      [solutionIndex]: `Build Solution ${solutionIndex + 1}` 
    }))
  }

  const handleCancelEdit = (solutionIndex: number) => {
    setButtonStates(prev => ({ ...prev, [solutionIndex]: 'idle' }))
    setEditingNames(prev => {
      const updated = { ...prev }
      delete updated[solutionIndex]
      return updated
    })
  }

  const handleSaveChecklist = async (solutionIndex: number) => {
    const solution = solutions[solutionIndex]
    const buildName = editingNames[solutionIndex] || `Build Solution ${solutionIndex + 1}`
    
    try {
      // Set saving state
      setButtonStates(prev => ({ ...prev, [solutionIndex]: 'saving' }))
      
      // Create checklist
      const finalName = buildName.trim() || `Build Solution ${solutionIndex + 1}`
      const checklist = expandSolutionToChecklist(solution, desiredStats, solutionIndex, fragments)
      checklist.name = finalName
      saveChecklist(checklist)
      
      // Mark solution as saved persistently
      const solutionId = getSolutionId(solution)
      markSolutionAsSaved(solutionId)
      
      // Clear editing state
      setEditingNames(prev => {
        const updated = { ...prev }
        delete updated[solutionIndex]
        return updated
      })
      
      // Set saved state permanently (no more auto-reset)
      setButtonStates(prev => ({ ...prev, [solutionIndex]: 'saved' }))
      
    } catch (error) {
      console.error('Failed to create checklist:', error)
      setButtonStates(prev => ({ ...prev, [solutionIndex]: 'idle' }))
    }
  }
  
  if (error) {
    return (
      <div className="panel">
        <div className="panel-head">
          <span className="corner" />
          <span className="title">Error</span>
          <span className="sub">Solver failed</span>
        </div>
        <div className="empty">
          <span className="glyph" style={{ color: 'var(--under)' }}><Icon.alert /></span>
          <h3>Optimization Failed</h3>
          <p>{error}</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="panel">
        <div className="panel-head">
          <span className="corner" />
          <span className="title">Optimizing</span>
          <span className="sub">MILP solver</span>
        </div>
        <div className="scan">
          <div className="ring" />
          <div className="label">Analyzing armor configurations…</div>
          <div className="barwrap"><span /></div>
        </div>
      </div>
    )
  }

  if (solutions.length === 0) {
    return (
      <div className="panel">
        <div className="empty">
          <span className="glyph"><Logo /></span>
          <h3>Awaiting Parameters</h3>
          <p>
            Set your desired stats and hit <span className="kbd">Find Optimal Builds</span>.
            Solutions appear here, ranked by farming difficulty.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="panel" style={{ marginBottom: 16 }}>
        <div className="panel-head">
          <span className="corner" />
          <span className="results-head">
            <Icon.check2 className="ic" /> <span className="title">Optimal Builds Found</span>
          </span>
          <span className="sub">
            {solutions.length} result{solutions.length !== 1 ? 's' : ''} · ranked by farming difficulty
          </span>
        </div>
      </div>

      {solutions.map((solution, index) => {
        const state = buttonStates[index] || 'idle'

        // Group pieces by arch + tertiary + tuning class (ignoring mod target).
        const groupedPieces: Record<string, { pieces: Array<{ piece: PieceType; count: number }>; totalCount: number }> = {}
        Object.entries(solution.pieces).forEach(([pieceKey, count]) => {
          const piece = parsePiece(pieceKey)
          if (!piece) return
          const groupKey = JSON.stringify({
            arch: piece.arch,
            tertiary: piece.tertiary,
            tuning_mode: piece.tuning_mode === 'tuned' ? 'flexible' : piece.tuning_mode,
            // Keep owned (locked) pieces in their own groups so they render with an "Owned" tag.
            slot: piece.slot ?? null,
          })
          if (!groupedPieces[groupKey]) groupedPieces[groupKey] = { pieces: [], totalCount: 0 }
          groupedPieces[groupKey].pieces.push({ piece, count })
          groupedPieces[groupKey].totalCount += count
        })

        // Mod tallies.
        const modCounts: Record<string, number> = {}
        Object.entries(solution.pieces).forEach(([pieceKey, count]) => {
          const piece = parsePiece(pieceKey)
          if (!piece) return
          modCounts[piece.mod_target] = (modCounts[piece.mod_target] || 0) + count
        })

        const totalTuningNeeded = solution.tuningRequirements
          ? Object.values(solution.tuningRequirements).reduce(
              (sum, details) => sum + details.reduce((s, d) => s + d.count, 0),
              0
            )
          : 0
        const flexiblePieces = solution.flexiblePieces || 0
        const hasTuning = solution.tuningRequirements && Object.keys(solution.tuningRequirements).length > 0

        return (
          <div className="panel" key={index}>
            <div className="sol-head">
              <div className="sol-id">
                <span className="sol-rank">{String(index + 1).padStart(2, '0')}</span>
                <span className="sol-title">Solution</span>
                {solution.deviation === 0 ? (
                  <span className="tag match">
                    <Icon.check style={{ width: 11, height: 11 }} /> Exact Match
                  </span>
                ) : (
                  <span className="tag approx">~{solution.deviation.toFixed(0)} dev</span>
                )}
              </div>
              <div>
                {state === 'saved' ? (
                  <button className="btn success sm" disabled>
                    <Icon.check style={{ width: 14, height: 14 }} /> Saved
                  </button>
                ) : state === 'editing' ? (
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <input
                      className="numfield"
                      style={{ width: 150, textAlign: 'left', fontFamily: 'var(--font-ui)', padding: '0 10px', height: 30 }}
                      value={editingNames[index] || ''}
                      autoFocus
                      placeholder="Build name…"
                      onChange={(e) => setEditingNames((prev) => ({ ...prev, [index]: e.target.value }))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveChecklist(index)
                        if (e.key === 'Escape') handleCancelEdit(index)
                      }}
                    />
                    <button className="btn icon sm" onClick={() => handleSaveChecklist(index)} aria-label="Save">
                      <Icon.check style={{ width: 14, height: 14 }} />
                    </button>
                    <button className="btn icon sm" onClick={() => handleCancelEdit(index)} aria-label="Cancel">
                      <Icon.x style={{ width: 14, height: 14 }} />
                    </button>
                  </div>
                ) : (
                  <button className="btn sm" onClick={() => handleStartEdit(index)} disabled={state === 'saving'}>
                    <Icon.clipboard style={{ width: 14, height: 14 }} />
                    {state === 'saving' ? 'Saving…' : 'Add to Checklist'}
                  </button>
                )}
              </div>
            </div>

            <div className="panel-body">
              {/* Subclass fragments (baseline stat shifts) */}
              {fragments && (
                <div className="sol-section">
                  <div className="subhead">Subclass Fragments</div>
                  <FragmentList selection={fragments} />
                </div>
              )}

              {/* Armor pieces */}
              <div className="sol-section">
                <div className="subhead">Armor Pieces</div>
                {Object.entries(groupedPieces).map(([, group], groupIndex) => {
                  if (group.pieces.length === 0) return null
                  const firstPiece = group.pieces[0].piece
                  const isExotic = firstPiece.arch.toLowerCase().includes('exotic')
                  const lockedSlot = GEAR_SLOTS.includes((firstPiece.slot ?? '') as GearSlot)
                    ? (firstPiece.slot as GearSlot)
                    : null
                  const isLocked = lockedSlot !== null
                  const isClassItem =
                    firstPiece.arch.toLowerCase().includes('class item') || lockedSlot === 'class'
                  // Every piece (including the Exotic Class Item) has an open tuning slot.
                  const isFlexible =
                    firstPiece.tuning_mode === 'tuned' || firstPiece.tuning_mode === 'none'

                  let tag = 'plain'
                  let tagText = 'No Tuning'
                  let tuningDesc = 'No tuning slot'
                  if (firstPiece.tuning_mode === 'balanced') {
                    tag = 'balanced'
                    tagText = 'Balanced'
                    tuningDesc = 'Balanced tuning · +1 to 3 lowest'
                  } else if (isFlexible) {
                    tag = 'flex'
                    tagText = 'Flexible'
                    tuningDesc = isLocked ? 'Tuning honored on owned piece' : 'Accepts any ±5 tuning mod'
                  }

                  // Owned pieces show their concrete slot (e.g. "Demolitionist Helmet"); farmed
                  // pieces keep the existing "Armor" label.
                  const nameSuffix = isExotic
                    ? ''
                    : lockedSlot
                    ? ` ${GEAR_SLOT_LABEL[lockedSlot]}`
                    : ' Armor'

                  return (
                    <div
                      className={'piece' + (isExotic ? ' is-exotic' : '') + (isLocked ? ' is-locked' : '')}
                      key={groupIndex}
                    >
                      <div className="pico">
                        <StatIcon stat={isClassItem ? 'Class' : firstPiece.arch.replace('Exotic ', '')} size={17} />
                      </div>
                      <div className="pmeta">
                        <div className="pname">
                          <span className="ct">{group.totalCount}×</span> {firstPiece.arch}
                          {nameSuffix}
                        </div>
                        <div className="pdesc">
                          Tertiary: <StatIcon stat={firstPiece.tertiary} size={13} /> {firstPiece.tertiary} · {tuningDesc}
                        </div>
                      </div>
                      <span className="pspacer" />
                      {isLocked && (
                        <span className="tag owned">
                          <Icon.lock2 style={{ width: 11, height: 11 }} /> Owned
                        </span>
                      )}
                      <span className={'tag ' + tag}>{tagText}</span>
                    </div>
                  )
                })}
              </div>

              {/* Mods */}
              <div className="sol-section">
                <div className="subhead">Mods</div>
                <div className="mods">
                  {Object.entries(modCounts).map(([stat, count], i) => (
                    <span className="mod" key={i}>
                      <b>{count}×</b> +10 <StatIcon stat={stat} size={15} /> {stat}
                    </span>
                  ))}
                </div>
              </div>

              {/* Tuning */}
              <div className="sol-section">
                <div className="subhead">Tuning Requirements</div>
                {hasTuning &&
                  Object.entries(solution.tuningRequirements!).map(([stat, details]) =>
                    details.map((detail, detailIndex) => (
                      <div className="tune" key={stat + detailIndex}>
                        <div className="th">
                          <span className="mono" style={{ color: 'var(--primary)' }}>{detail.count}×</span>{' '}
                          <StatIcon stat={stat} size={15} /> {stat} Tuning
                        </div>
                        <div className="pair">
                          <span className="chiplet plus">
                            +5 <StatIcon stat={stat} size={13} /> {stat}
                          </span>
                          <span className="sep">/</span>
                          <span className="chiplet minus">
                            −5 <StatIcon stat={detail.siphon_from} size={13} /> {detail.siphon_from}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                <div className="notice info" style={{ marginTop: hasTuning ? 8 : 0 }}>
                  <Icon.info className="ic" />
                  <span>
                    {totalTuningNeeded === 0 ? (
                      <>
                        No specific ±5 tuning mods required. You have <b>{flexiblePieces}</b>{' '}
                        flexible piece(s) that can optionally accept any ±5 tuning.
                      </>
                    ) : (
                      <>
                        You have <b>{flexiblePieces}</b> flexible piece(s) for <b>{totalTuningNeeded}</b>{' '}
                        required tuning mod(s).
                      </>
                    )}
                  </span>
                </div>
              </div>

              {/* Stat distribution */}
              {solution.actualStats && (
                <div className="sol-section">
                  <div className="subhead">Stat Distribution</div>
                  <table className="stat-table">
                    <thead>
                      <tr>
                        <th>Stat</th>
                        <th className="bar-cell">Level</th>
                        <th>Actual</th>
                        <th>Desired</th>
                        <th>Δ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {STAT_NAMES.map((statName, statIndex) => {
                        const actual = solution.actualStats![statIndex]
                        const desired = desiredStats[statName]
                        const diff = actual - desired
                        const cls = diff < 0 ? 'diff-under' : 'diff-over'
                        return (
                          <tr key={statName}>
                            <td>
                              <span className="nm">
                                <StatIcon stat={statName} size={15} /> {statName}
                              </span>
                            </td>
                            <td className="bar-cell">
                              <div className="bar">
                                <span style={{ width: (actual / 200) * 100 + '%' }} />
                              </div>
                            </td>
                            <td>{actual}</td>
                            <td className="subtle">{desired}</td>
                            <td className={cls}>
                              {diff > 0 ? '+' : ''}
                              {diff}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}