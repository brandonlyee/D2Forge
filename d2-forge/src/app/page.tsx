"use client"

import React, { useState } from 'react'
import { StatInputForm } from '@/components/stat-input-form'
import { SolutionDisplay } from '@/components/solution-display'
import { ThemeToggle } from '@/components/theme-toggle'

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
  // Minimum constraint locks for each stat
  Health_min: boolean
  Melee_min: boolean
  Grenade_min: boolean
  Super_min: boolean
  Class_min: boolean
  Weapons_min: boolean
  allow_tuned: boolean
  use_exotic: boolean
  use_class_item_exotic: boolean
  exotic_perk1?: string
  exotic_perk2?: string
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
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (data: FormData) => {
    setIsLoading(true)
    setError(null) // Clear previous errors
    // Extract only the stat values for display, excluding optimization options
    const { 
      allow_tuned, use_exotic, use_class_item_exotic, exotic_perk1, exotic_perk2,
      Health_min, Melee_min, Grenade_min, Super_min, Class_min, Weapons_min,
      ...statValues 
    } = data
    setDesiredStats(statValues)
    setSolutions([]) // Clear previous results

    try {
      // Prepare exotic perks array for backend
      const exotic_perks = (use_exotic && use_class_item_exotic && exotic_perk1 && exotic_perk2) 
        ? [exotic_perk1, exotic_perk2] 
        : undefined

      // Prepare minimum constraints for backend
      const minimum_constraints = {
        Health: Health_min ? data.Health : null,
        Melee: Melee_min ? data.Melee : null,
        Grenade: Grenade_min ? data.Grenade : null,
        Super: Super_min ? data.Super : null,
        Class: Class_min ? data.Class : null,
        Weapons: Weapons_min ? data.Weapons : null,
      }

      const requestData = {
        ...data,
        exotic_perks,
        minimum_constraints
      }

      // Call our Vercel Function directly
      const response = await fetch('/api/optimize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to optimize stats')
      }

      const result = await response.json()
      setSolutions(result.solutions || [])
    } catch (error) {
      console.error('Error optimizing stats:', error)
      setError(error instanceof Error ? error.message : 'An unexpected error occurred')
      setSolutions([])
    } finally {
      setIsLoading(false)
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
                D2 Forge
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Forge optimal Destiny 2 armor builds to achieve your desired stat distribution 
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
            <div className="lg:col-span-3">
              <SolutionDisplay 
                solutions={solutions} 
                desiredStats={desiredStats}
                isLoading={isLoading}
                error={error}
              />
            </div>
          </div>

          {/* Footer */}
          <footer className="text-center text-sm text-muted-foreground border-t pt-8 space-y-2">
            <p>
              Built with Next.js, shadcn/ui, and Python. 
              Uses Mixed Integer Linear Programming (MILP) to find optimal armor builds.
            </p>
            <p>
              Developed by{' '}
              <a 
                href="https://x.com/mojobukoo" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-500 hover:text-blue-400 transition-colors"
              >
                @mojobukoo
              </a>
              . Please reach out for any suggestions/improvements!
            </p>
          </footer>
        </div>
      </div>
    </main>
  )
}
