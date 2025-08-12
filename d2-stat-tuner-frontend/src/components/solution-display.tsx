"use client"

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Copy, CheckCircle, AlertTriangle } from 'lucide-react'
import { StatIcon } from '@/components/stat-icon'

interface PieceType {
  arch: string
  tertiary: string
  mod_target: string
  tuned_stat?: string | null
  siphon_from?: string | null
}

interface Solution {
  pieces: Record<string, number> // PieceType as string key -> count
  deviation: number
  actualStats?: number[]
}

interface SolutionDisplayProps {
  solutions: Solution[]
  desiredStats: Record<string, number>
  isLoading?: boolean
}

const STAT_NAMES = ["Health", "Melee", "Grenade", "Super", "Class", "Weapons"]

export function SolutionDisplay({ solutions, desiredStats, isLoading = false }: SolutionDisplayProps) {
  const [copiedIndex, setCopiedIndex] = React.useState<number | null>(null)

  const copyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedIndex(index)
      setTimeout(() => setCopiedIndex(null), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  const formatPieceDescription = (pieceKey: string, count: number): string => {
    try {
      const piece: PieceType = JSON.parse(pieceKey)
      const tuningText = piece.tuned_stat && piece.siphon_from 
        ? ` tuned->${piece.tuned_stat} siphon_from=${piece.siphon_from}`
        : ' No Tuning'
      
      return `${count}x ${piece.arch} (tertiary=${piece.tertiary}) mod+10->${piece.mod_target}${tuningText}`
    } catch {
      return `${count}x ${pieceKey}`
    }
  }

  const getSolutionText = (solution: Solution, index: number): string => {
    const pieces = Object.entries(solution.pieces)
      .map(([pieceKey, count]) => formatPieceDescription(pieceKey, count))
      .join('\n')
    
    const statusText = solution.deviation > 0 
      ? `\nTotal deviation from desired stats: ${solution.deviation.toFixed(1)}`
      : '\nExact match'
    
    return `Solution ${index + 1}:\n${pieces}${statusText}`
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
                Analyzing 1944 possible armor configurations...
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
            Try adjusting your desired stats or check if they're within possible limits.
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
            {solutions.length} solution{solutions.length !== 1 ? 's' : ''} found, ranked by farming difficulty
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
                    ~{solution.deviation.toFixed(1)} deviation
                  </Badge>
                )}
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(getSolutionText(solution, index), index)}
                suppressHydrationWarning
              >
                {copiedIndex === index ? (
                  <CheckCircle className="h-4 w-4" suppressHydrationWarning />
                ) : (
                  <Copy className="h-4 w-4" suppressHydrationWarning />
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Armor Pieces */}
              <div>
                <h4 className="font-medium mb-3">Armor Pieces:</h4>
                <div className="space-y-2">
                  {Object.entries(solution.pieces).map(([pieceKey, count], pieceIndex) => {
                    try {
                      const piece: PieceType = JSON.parse(pieceKey)
                      const isNonTuned = !piece.tuned_stat || !piece.siphon_from
                      
                      return (
                        <div key={pieceIndex} className="p-3 border rounded-lg">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium flex items-center gap-2">
                                <StatIcon stat={piece.arch} size={20} />
                                {count}x {piece.arch} Armor
                              </div>
                              <div className="text-sm text-muted-foreground flex items-center gap-4">
                                <span className="flex items-center gap-1">
                                  Tertiary: <StatIcon stat={piece.tertiary} size={14} /> {piece.tertiary}
                                </span>
                                <span className="flex items-center gap-1">
                                  Mod: +10 <StatIcon stat={piece.mod_target} size={14} /> {piece.mod_target}
                                </span>
                              </div>
                              {!isNonTuned && (
                                <div className="text-sm text-orange-600 flex items-center gap-2">
                                  <span className="flex items-center gap-1">
                                    Tuned: +5 <StatIcon stat={piece.tuned_stat} size={14} /> {piece.tuned_stat}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    -5 <StatIcon stat={piece.siphon_from} size={14} /> {piece.siphon_from}
                                  </span>
                                </div>
                              )}
                            </div>
                            <Badge variant={isNonTuned ? "default" : "secondary"}>
                              {isNonTuned ? "No Tuning" : "Tuned"}
                            </Badge>
                          </div>
                        </div>
                      )
                    } catch {
                      return (
                        <div key={pieceIndex} className="p-3 border rounded-lg">
                          <div className="font-medium">{count}x Unknown Piece</div>
                        </div>
                      )
                    }
                  })}
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