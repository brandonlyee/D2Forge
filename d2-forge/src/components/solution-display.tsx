"use client"

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, AlertTriangle, ClipboardList, Check, X } from 'lucide-react'
import { StatIcon } from '@/components/stat-icon'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { expandSolutionToChecklist, saveChecklist } from '@/lib/checklist-utils'

interface PieceType {
  arch: string
  tertiary: string
  tuning_mode: string // "none", "tuned", "balanced"
  mod_target: string
  tuned_stat?: string | null
  siphon_from?: string | null
}

interface Solution {
  pieces: Record<string, number> // PieceType as string key -> count
  deviation: number
  actualStats?: number[]
  tuningRequirements?: Record<string, Array<{count: number, siphon_from: string}>> // stat -> array of tuning details
  flexiblePieces?: number // count of pieces that can accept any +5/-5 tuning
}

interface SolutionDisplayProps {
  solutions: Solution[]
  desiredStats: Record<string, number>
  isLoading?: boolean
  error?: string | null
}

const STAT_NAMES = ["Health", "Melee", "Grenade", "Super", "Class", "Weapons"]

export function SolutionDisplay({ solutions, desiredStats, isLoading = false, error = null }: SolutionDisplayProps) {
  const [buttonStates, setButtonStates] = useState<Record<number, 'idle' | 'editing' | 'saving' | 'saved'>>({})
  const [editingNames, setEditingNames] = useState<Record<number, string>>({})

  // Create a unique identifier for a solution
  const getSolutionId = (solution: Solution) => {
    return JSON.stringify(solution.pieces)
  }

  // Load saved solution states from sessionStorage
  const loadSavedSolutions = (): Set<string> => {
    try {
      const saved = sessionStorage.getItem('d2forge-saved-solutions')
      return new Set(saved ? JSON.parse(saved) : [])
    } catch {
      return new Set()
    }
  }

  // Save solution as saved to sessionStorage
  const markSolutionAsSaved = (solutionId: string) => {
    try {
      const savedSolutions = loadSavedSolutions()
      savedSolutions.add(solutionId)
      sessionStorage.setItem('d2forge-saved-solutions', JSON.stringify(Array.from(savedSolutions)))
    } catch (error) {
      console.warn('Failed to save solution state:', error)
    }
  }

  // Initialize button states based on saved solutions
  React.useEffect(() => {
    const savedSolutions = loadSavedSolutions()
    const initialStates: Record<number, 'idle' | 'editing' | 'saving' | 'saved'> = {}
    
    solutions.forEach((solution, index) => {
      const solutionId = getSolutionId(solution)
      if (savedSolutions.has(solutionId)) {
        initialStates[index] = 'saved'
      } else {
        initialStates[index] = 'idle'
      }
    })
    
    setButtonStates(initialStates)
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
      const checklist = expandSolutionToChecklist(solution, desiredStats, solutionIndex)
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
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" suppressHydrationWarning />
            Error
          </CardTitle>
          <CardDescription>
            Failed to optimize armor configurations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-600">
            {error}
          </p>
        </CardContent>
      </Card>
    )
  }

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Finding Optimal Builds...</CardTitle>
          <CardDescription>
            Running Mixed Integer Linear Programming optimization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-4">
              <div className="animate-spin text-4xl">⚙️</div>
              <p className="text-muted-foreground">
                Analyzing armor configurations...
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (solutions.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" suppressHydrationWarning />
            No Solutions Found
          </CardTitle>
          <CardDescription>
            No armor combinations could achieve the desired stats
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Try adjusting your desired stats or check if they&apos;re within possible limits.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="w-full space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" suppressHydrationWarning />
            Optimal Armor Builds Found
          </CardTitle>
          <CardDescription>
            {solutions.length} solution{solutions.length !== 1 ? 's' : ''} found within the time limit, ranked by farming difficulty
          </CardDescription>
        </CardHeader>
      </Card>

      {solutions.map((solution, index) => (
        <Card key={index}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                Solution {index + 1}
                {solution.deviation === 0 ? (
                  <Badge className="ml-2" variant="default">Exact Match</Badge>
                ) : (
                  <Badge className="ml-2" variant="secondary">
                    ~{solution.deviation.toFixed(1)} deviation score
                  </Badge>
                )}
              </CardTitle>
<div className="flex items-center gap-2">
                {(() => {
                  const state = buttonStates[index] || 'idle'
                  
                  if (state === 'saved') {
                    return (
                      <Button
                        variant="default"
                        size="sm"
                        disabled
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-600 transition-all duration-300"
                      >
                        <Check className="h-4 w-4" />
                        Saved to Checklist
                      </Button>
                    )
                  }
                  
                  if (state === 'editing') {
                    return (
                      <>
                        <Input
                          value={editingNames[index] || ''}
                          onChange={(e) => setEditingNames(prev => ({ ...prev, [index]: e.target.value }))}
                          className="h-8 text-sm"
                          placeholder="Enter build name..."
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleSaveChecklist(index)
                            } else if (e.key === 'Escape') {
                              handleCancelEdit(index)
                            }
                          }}
                          autoFocus
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSaveChecklist(index)}
                          className="h-8 px-2"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancelEdit(index)}
                          className="h-8 px-2"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    )
                  }
                  
                  return (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleStartEdit(index)}
                      disabled={state === 'saving'}
                      className="flex items-center gap-2 transition-all duration-200"
                    >
                      <ClipboardList className={`h-4 w-4 ${state === 'saving' ? 'animate-spin' : ''}`} />
                      {state === 'saving' ? 'Saving...' : 'Add to Checklist'}
                    </Button>
                  )
                })()}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Armor Pieces */}
              <div>
                <h4 className="font-medium mb-3">Armor Pieces:</h4>
                <div className="space-y-2">
                  {(() => {
                    // Group pieces by arch and tertiary only (ignoring tuning specifics)
                    const groupedPieces: Record<string, { pieces: Array<{piece: PieceType, count: number}>, totalCount: number }> = {}
                    
                    Object.entries(solution.pieces).forEach(([pieceKey, count]) => {
                      try {
                        const piece: PieceType = JSON.parse(pieceKey)
                        
                        // Create grouping key without mod_target and specific tuning details
                        const groupKey = JSON.stringify({
                          arch: piece.arch,
                          tertiary: piece.tertiary,
                          tuning_mode: piece.tuning_mode === "tuned" ? "flexible" : piece.tuning_mode // Group tuned pieces as "flexible"
                        })
                        
                        if (!groupedPieces[groupKey]) {
                          groupedPieces[groupKey] = { pieces: [], totalCount: 0 }
                        }
                        
                        groupedPieces[groupKey].pieces.push({ piece, count })
                        groupedPieces[groupKey].totalCount += count
                      } catch {
                        // Handle malformed pieces
                      }
                    })
                    
                    return Object.entries(groupedPieces).map(([, group], groupIndex) => {
                      if (group.pieces.length === 0) return null
                      
                      const firstPiece = group.pieces[0].piece
                      const isExotic = firstPiece.arch.toLowerCase().includes('exotic')
                      const isFlexible = firstPiece.tuning_mode === "tuned" || (firstPiece.tuning_mode === "none" && !isExotic)
                      
                      const getBadgeVariant = () => {
                        if (isExotic) return "destructive"
                        if (firstPiece.tuning_mode === "balanced") return "default"
                        if (isFlexible) return "secondary" 
                        return "outline"
                      }
                      
                      const getBadgeText = () => {
                        if (isExotic) return "Exotic"
                        if (firstPiece.tuning_mode === "balanced") return "Balanced"
                        if (isFlexible) return "Flexible Tuning"
                        return "No Tuning"
                      }
                      
                      const getDescription = () => {
                        if (firstPiece.tuning_mode === "balanced") {
                          return "Balanced Tuning: +1 to 3 lowest stats"
                        }
                        if (isFlexible) {
                          return "Can accept any +5/-5 tuning mod"
                        }
                        if (isExotic) {
                          return firstPiece.arch.includes('Class Item') 
                            ? 'Exotic Class Item with fixed stat distribution'
                            : 'Exotic Armor: 30/20/13/5/5/5 base stats'
                        }
                        return "No tuning slot available"
                      }
                      
                      return (
                        <div key={groupIndex} className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium flex items-center gap-2">
                                {isExotic && <span className="text-orange-500">✨</span>}
                                <StatIcon stat={firstPiece.arch.replace('Exotic ', '')} size={20} />
                                {group.totalCount} x {firstPiece.arch} {isExotic ? '' : 'Armor'}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  Tertiary: <StatIcon stat={firstPiece.tertiary} size={14} /> {firstPiece.tertiary}
                                </span>
                              </div>
                              <div className={`text-sm ${
                                firstPiece.tuning_mode === "balanced" ? "text-blue-600" :
                                isFlexible ? "text-green-600" :
                                isExotic ? "text-orange-600" : "text-muted-foreground"
                              }`}>
                                {getDescription()}
                              </div>
                            </div>
                            <Badge variant={getBadgeVariant()}>
                              {getBadgeText()}
                            </Badge>
                          </div>
                        </div>
                      )
                    }).filter(Boolean)
                  })()}
                </div>
              </div>
              
              {/* Mods Section */}
              <div>
                <h4 className="font-medium mb-3">Mods:</h4>
                <div className="space-y-2">
                  {(() => {
                    const modCounts: Record<string, number> = {}
                    
                    Object.entries(solution.pieces).forEach(([pieceKey, count]) => {
                      try {
                        const piece: PieceType = JSON.parse(pieceKey)
                        modCounts[piece.mod_target] = (modCounts[piece.mod_target] || 0) + count
                      } catch {
                        // Handle malformed piece data
                      }
                    })
                    
                    return Object.entries(modCounts).map(([stat, count], index) => (
                      <div key={index} className="p-2 border rounded-lg bg-muted/50">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{count} x +10</span>
                          <StatIcon stat={stat} size={16} />
                          <span className="font-medium">{stat}</span>
                        </div>
                      </div>
                    ))
                  })()}
                </div>
              </div>

              {/* Tuning Requirements Section */}
              <div>
                <h4 className="font-medium mb-3">Tuning Requirements:</h4>
                <div className="space-y-2">
                  {solution.tuningRequirements && Object.keys(solution.tuningRequirements).length > 0 ? (
                    <>
                      {Object.entries(solution.tuningRequirements).map(([stat, tuningDetails], index) => (
                        <div key={index}>
                          {tuningDetails.map((detail, detailIndex) => (
                            <div key={detailIndex} className="p-2 border rounded-lg bg-muted/50 mb-2">
                              <div className="flex items-center gap-2">
                                <span className="font-medium flex items-center gap-1">
                                  {detail.count} x <StatIcon stat={stat} size={16} /> {stat} Tuning:
                                </span>
                                <span className="flex items-center gap-1">
                                  +5 <StatIcon stat={stat} size={16} /> {stat}
                                </span>
                                <span>/</span>
                                <span className="flex items-center gap-1">
                                  -5 <StatIcon stat={detail.siphon_from} size={16} /> {detail.siphon_from}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ))}
                    </>
                  ) : null}
                  
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="text-sm text-blue-800">
                      <div className="font-medium mb-1">Tuning Allocation:</div>
                      {(() => {
                        const totalTuningNeeded = solution.tuningRequirements 
                          ? Object.values(solution.tuningRequirements).reduce((sum, details) => 
                              sum + details.reduce((detailSum, detail) => detailSum + detail.count, 0), 0)
                          : 0
                        const flexiblePieces = solution.flexiblePieces || 0
                        
                        if (totalTuningNeeded === 0) {
                          return (
                            <p>
                              ✅ No specific +5/-5 tuning mods required for this build.
                              <br />
                              You have <strong>{flexiblePieces}</strong> piece(s) that can optionally accept any +5/-5 tuning.
                            </p>
                          )
                        } else if (flexiblePieces >= totalTuningNeeded) {
                          return (
                            <p>
                              ✅ You have <strong>{flexiblePieces}</strong> flexible pieces that can accept any +5/-5 tuning.
                              <br />
                              Only <strong>{totalTuningNeeded}</strong> tuning mod(s) needed, so you have options for allocation.
                            </p>
                          )
                        } else {
                          return (
                            <p>
                              ⚠️ You need <strong>{totalTuningNeeded}</strong> tuning mod(s) but only have <strong>{flexiblePieces}</strong> flexible piece(s).
                              <br />
                              This should not happen - please report this as a bug.
                            </p>
                          )
                        }
                      })()}
                    </div>
                  </div>
                </div>
              </div>

              {/* Stat Distribution (if available) */}
              {solution.actualStats && (
                <div>
                  <h4 className="font-medium mb-3">Stat Distribution:</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Stat</TableHead>
                        <TableHead>Actual</TableHead>
                        <TableHead>Desired</TableHead>
                        <TableHead>Difference</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {STAT_NAMES.map((statName, statIndex) => {
                        const actual = solution.actualStats![statIndex]
                        const desired = desiredStats[statName]
                        const diff = actual - desired
                        
                        return (
                          <TableRow key={statName}>
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <StatIcon stat={statName} size={16} />
                                {statName}
                              </div>
                            </TableCell>
                            <TableCell>{actual}</TableCell>
                            <TableCell>{desired}</TableCell>
                            <TableCell>
                              <span className={diff === 0 ? "text-green-600" : diff > 0 ? "text-blue-600" : "text-red-600"}>
                                {diff > 0 ? '+' : ''}{diff}
                              </span>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}