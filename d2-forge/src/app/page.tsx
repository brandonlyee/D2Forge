"use client"

import React, { useState, useEffect, useRef } from 'react'
import { StatInputForm } from '@/components/stat-input-form'
import { SolutionDisplay } from '@/components/solution-display'
import { ThemeToggle } from '@/components/theme-toggle'
import { Logo, Icon } from '@/components/forge/icons'
import Link from 'next/link'
import type { Solution } from '@/types/solution'
import { STORAGE_KEYS } from '@/lib/constants'
import { readJSON, writeJSON } from '@/lib/storage'
import { computeFragmentBonuses, buildFragmentSelection, type FragmentSelection } from '@/lib/fragments'
import { lockedPieceToRequest, type LockedPiece } from '@/lib/archetypes'

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
  // "Ignore" flags: don't-care dump stats (mutually exclusive with the matching _min lock)
  Health_ignore: boolean
  Melee_ignore: boolean
  Grenade_ignore: boolean
  Super_ignore: boolean
  Class_ignore: boolean
  Weapons_ignore: boolean
  allow_tuned: boolean
  use_class_item_exotic: boolean
  exotic_perk1?: string
  exotic_perk2?: string
  use_fragments: boolean
  fragment_subclass?: string
  fragments: string[]
  use_locked_pieces: boolean
  locked_pieces: LockedPiece[]
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
  const [fragmentSelection, setFragmentSelection] = useState<FragmentSelection | null>(null)
  // Stats the last solve was told to ignore — so results can flag them as "don't care".
  const [ignoredStats, setIgnoredStats] = useState<string[]>([])
  const solutionsRef = useRef<HTMLDivElement>(null)

  // Restore solutions, desiredStats, and fragment selection from sessionStorage on mount
  useEffect(() => {
    const saved = readJSON<{
      solutions?: Solution[]
      desiredStats?: Record<string, number>
      ignoredStats?: string[]
      fragmentSelection?: FragmentSelection | null
    } | null>('session', STORAGE_KEYS.mainState, null)
    if (saved?.solutions) setSolutions(saved.solutions)
    if (saved?.desiredStats) setDesiredStats(saved.desiredStats)
    if (saved?.ignoredStats) setIgnoredStats(saved.ignoredStats)
    if (saved?.fragmentSelection) setFragmentSelection(saved.fragmentSelection)
  }, [])

  // Save solutions, desiredStats, and fragment selection to sessionStorage whenever they change
  useEffect(() => {
    writeJSON('session', STORAGE_KEYS.mainState, { solutions, desiredStats, ignoredStats, fragmentSelection })
  }, [solutions, desiredStats, ignoredStats, fragmentSelection])

  const handleSubmit = async (data: FormData) => {
    setIsLoading(true)
    setError(null) // Clear previous errors

    // On stacked (mobile/narrow) layouts the form sits above the solutions, so
    // bring the results into view once the loading state renders. On wide
    // layouts the solutions are already visible in the right column.
    if (typeof window !== 'undefined' && window.innerWidth <= 1040) {
      requestAnimationFrame(() =>
        solutionsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      )
    }

    // Extract only the stat values for display, excluding optimization options
    const {
      allow_tuned, use_class_item_exotic, exotic_perk1, exotic_perk2,
      use_fragments, fragment_subclass, fragments,
      use_locked_pieces, locked_pieces,
      Health_min, Melee_min, Grenade_min, Super_min, Class_min, Weapons_min,
      Health_ignore, Melee_ignore, Grenade_ignore, Super_ignore, Class_ignore, Weapons_ignore,
      ...statValues
    } = data
    setDesiredStats(statValues)
    // Snapshot the fragments chosen for this run so results and saved checklists record them.
    setFragmentSelection(buildFragmentSelection(fragment_subclass, use_fragments ? fragments : []))
    setSolutions([]) // Clear previous results

    try {
      // Prepare exotic perks array for backend
      const exotic_perks = (use_class_item_exotic && exotic_perk1 && exotic_perk2)
        ? [exotic_perk1, exotic_perk2]
        : undefined

      // Stats the user marked "ignore": free dump stats with no target, floor, or penalty.
      const ignored_stats = [
        Health_ignore && 'Health',
        Melee_ignore && 'Melee',
        Grenade_ignore && 'Grenade',
        Super_ignore && 'Super',
        Class_ignore && 'Class',
        Weapons_ignore && 'Weapons',
      ].filter(Boolean) as string[]
      const isIgnored = (s: string) => ignored_stats.includes(s)
      // Snapshot for the results panel so ignored stats render as "don't care".
      setIgnoredStats(ignored_stats)

      // Prepare minimum constraints for backend. An ignored stat never carries a floor
      // (the UI keeps Min and Ignore exclusive; this is belt-and-suspenders).
      const minimum_constraints = {
        Health: Health_min && !isIgnored('Health') ? data.Health : null,
        Melee: Melee_min && !isIgnored('Melee') ? data.Melee : null,
        Grenade: Grenade_min && !isIgnored('Grenade') ? data.Grenade : null,
        Super: Super_min && !isIgnored('Super') ? data.Super : null,
        Class: Class_min && !isIgnored('Class') ? data.Class : null,
        Weapons: Weapons_min && !isIgnored('Weapons') ? data.Weapons : null,
      }

      // Subclass fragments shift the player's baseline stats. The backend subtracts these
      // from the desired/minimum targets before solving, then folds them back into the
      // reported stats so the results compare true totals against what the user asked for.
      const fragment_bonuses = computeFragmentBonuses(use_fragments ? fragments : [])

      // Locked pieces the solver must build around (snake_case for the backend). Omitted when
      // the toggle is off so empty rows never constrain the solve.
      const locked = use_locked_pieces ? (locked_pieces || []).map(lockedPieceToRequest) : []

      const requestData = {
        ...data,
        exotic_perks,
        minimum_constraints,
        ignored_stats,
        fragment_bonuses,
        locked_pieces: locked,
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
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="logo"><Logo /></span>
          <span className="wordmark">D2 Forge</span>
          <span className="banner-sub">
            Destiny 2 Armor 3.0 Stat Optimizer
            <span className="tip banner-tip" tabIndex={0}>
              <Icon.info className="tip-ic" />
              <span className="tip-body">
                Enter a desired stat distribution and the solver returns the armor combinations
                that reach it — ranked by how hard they are to farm. Powered by Mixed Integer
                Linear Programming.
              </span>
            </span>
          </span>
        </div>
        <div className="topbar-actions">
          <span className="topbar-credit hidden lg:inline-flex">
            Developed by{' '}
            <a href="https://x.com/mojobukoo" target="_blank" rel="noopener noreferrer">
              @mojobukoo
            </a>
          </span>
          <a
            className="btn bmc"
            href="https://buymeacoffee.com/mojobuko"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span aria-hidden>☕</span>
            <span className="hidden sm:inline">Buy me a coffee</span>
          </a>
          <Link className="btn primary" href="/checklists">
            <Icon.list style={{ width: 15, height: 15 }} />
            <span className="hidden sm:inline">My Checklists</span>
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <div className="container-forge">
        <div className="layout">
          <StatInputForm onSubmit={handleSubmit} isLoading={isLoading} />
          <div className="sol-col" ref={solutionsRef}>
            <SolutionDisplay
              solutions={solutions}
              desiredStats={desiredStats}
              ignoredStats={ignoredStats}
              fragments={fragmentSelection}
              isLoading={isLoading}
              error={error}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
