"use client"

import React, { useState, useEffect } from 'react'
import { ChecklistView } from '@/components/checklist-view'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ThemeToggle } from '@/components/theme-toggle'
import { ChecklistState } from '@/types/checklist'
import { loadChecklists, deleteChecklist } from '@/lib/checklist-utils'
import { ArrowLeft, Package } from 'lucide-react'
import Link from 'next/link'

export default function ChecklistsPage() {
  const [checklists, setChecklists] = useState<Record<string, ChecklistState>>({})
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadedChecklists = loadChecklists()
    setChecklists(loadedChecklists)
    setIsLoading(false)
  }, [])

  const handleUpdateChecklist = (updatedChecklist: ChecklistState) => {
    setChecklists(prev => ({
      ...prev,
      [updatedChecklist.id]: updatedChecklist
    }))
  }

  const handleDeleteChecklist = (checklistId: string) => {
    deleteChecklist(checklistId)
    setChecklists(prev => {
      const updated = { ...prev }
      delete updated[checklistId]
      return updated
    })
  }

  const checklistArray = Object.values(checklists).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  const completedChecklists = checklistArray.filter(checklist => {
    const totalItems = checklist.armorItems.length + checklist.tuningItems.length
    const completedItems = 
      checklist.armorItems.filter(item => item.isCompleted).length +
      checklist.tuningItems.filter(tuning => tuning.isCompleted).length
    return totalItems > 0 && completedItems === totalItems
  })

  const activeChecklists = checklistArray.filter(checklist => {
    const totalItems = checklist.armorItems.length + checklist.tuningItems.length
    const completedItems = 
      checklist.armorItems.filter(item => item.isCompleted).length +
      checklist.tuningItems.filter(tuning => tuning.isCompleted).length
    return totalItems === 0 || completedItems < totalItems
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin text-4xl mb-4">⚙️</div>
                <p className="text-muted-foreground">Loading your checklists...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-4 sm:py-8">
        <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
          {/* Header */}
          <div className="space-y-4 sm:space-y-6">
            {/* Navigation */}
            <div className="flex items-center justify-between">
              <Link href="/">
                <Button variant="outline" size="sm" className="h-8 sm:h-9 px-2 sm:px-3">
                  <ArrowLeft className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Back to Optimizer</span>
                  <span className="sm:hidden">Back</span>
                </Button>
              </Link>
              <ThemeToggle />
            </div>
            
            {/* Title and Description */}
            <div className="text-center space-y-2">
              <h1 className="text-xl sm:text-3xl font-bold tracking-tight">
                My Build Checklists
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground px-2 sm:px-4">
                Track your farming progress for optimal Destiny 2 armor builds
              </p>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="text-sm font-medium">Total Checklists</p>
                      <p className="text-2xl font-bold">{checklistArray.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-5 rounded-full bg-orange-500"></div>
                    <div>
                      <p className="text-sm font-medium">In Progress</p>
                      <p className="text-2xl font-bold">{activeChecklists.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-5 rounded-full bg-green-500"></div>
                    <div>
                      <p className="text-sm font-medium">Completed</p>
                      <p className="text-2xl font-bold">{completedChecklists.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

          {/* Checklists Content */}
          {checklistArray.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  No Checklists Yet
                </CardTitle>
                <CardDescription>
                  You haven&apos;t saved any build checklists yet. Go back to the optimizer and click &quot;Add to Checklist&quot; on any solution to get started!
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/">
                  <Button>
                    Start Optimizing Builds
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Active Checklists */}
              {activeChecklists.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">Active Builds</h2>
                  <div className="space-y-4">
                    {activeChecklists.map((checklist) => (
                      <ChecklistView
                        key={checklist.id}
                        checklist={checklist}
                        onUpdate={handleUpdateChecklist}
                        onDelete={handleDeleteChecklist}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Completed Checklists */}
              {completedChecklists.length > 0 && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">Completed Builds</h2>
                  <div className="space-y-4">
                    {completedChecklists.map((checklist) => (
                      <ChecklistView
                        key={checklist.id}
                        checklist={checklist}
                        onUpdate={handleUpdateChecklist}
                        onDelete={handleDeleteChecklist}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}