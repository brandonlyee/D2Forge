"use client"

import React, { useState } from 'react'
import { StatInputForm } from '@/components/stat-input-form'
import { SolutionDisplay } from '@/components/solution-display'
import { ThemeToggle } from '@/components/theme-toggle'
import { OptimizationProgress } from '@/components/optimization-progress'
import { useOptimizationWorker } from '@/hooks/useOptimizationWorker'

interface Solution {
  pieces: Record<string, number>
  deviation: number
  actualStats?: number[]
}

interface FormData {
  Health: number
  Melee: number
  Grenade: number
  Super: number
  Class: number
  Weapons: number
}

export default function Home() {
  const [solutions, setSolutions] = useState<Solution[]>([])
  const [desiredStats, setDesiredStats] = useState<Record<string, number>>({
    Health: 150,
    Melee: 75,
    Grenade: 75,
    Super: 100,
    Class: 75,
    Weapons: 25,
  })
  
  // Use the client-side optimization worker
  const { optimize, progress, isLoading, error, stats } = useOptimizationWorker()

  const handleSubmit = async (data: FormData) => {
    const statsData = data as unknown as Record<string, number>
    setDesiredStats(statsData)
    setSolutions([]) // Clear previous results

    try {
      // Use client-side optimization
      const result = await optimize({
        desired_stats: statsData,
        max_solutions: 5
      })
      
      setSolutions(result.solutions || [])
    } catch (error) {
      console.error('Error optimizing stats:', error)
      setSolutions([])
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="relative">
            <div className="absolute top-0 right-0">
              <ThemeToggle />
            </div>
            <div className="text-center space-y-4">
              <h1 className="text-4xl font-bold tracking-tight">
                D2 Stat Tuner
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Find the optimal Destiny 2 armor combinations to achieve your desired stat distribution 
                using Mixed Integer Linear Programming.
              </p>
            </div>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Stat Input Form */}
            <div className="lg:col-span-2">
              <StatInputForm onSubmit={handleSubmit} isLoading={isLoading} />
            </div>

            {/* Solutions Display */}
            <div className="lg:col-span-3 space-y-6">
              {/* Show progress when optimizing */}
              <OptimizationProgress 
                progress={progress}
                stats={stats}
                isLoading={isLoading}
              />
              
              <SolutionDisplay 
                solutions={solutions} 
                desiredStats={desiredStats}
                isLoading={isLoading}
              />
            </div>
          </div>

          {/* Footer */}
          <footer className="text-center text-sm text-muted-foreground border-t pt-8">
            <p>
              Built with Next.js, TypeScript, and Web Workers. 
              Client-side optimization of 1944 armor configurations using Mixed Integer Linear Programming.
              {stats && ` • ${stats.total_pieces.toLocaleString()} configurations loaded`}
            </p>
          </footer>
        </div>
      </div>
    </main>
  )
}
