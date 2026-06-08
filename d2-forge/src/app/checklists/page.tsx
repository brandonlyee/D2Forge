"use client"

import React, { useState, useEffect } from 'react'
import { ChecklistView } from '@/components/checklist-view'
import { ThemeToggle } from '@/components/theme-toggle'
import { Logo, Icon } from '@/components/forge/icons'
import { ChecklistState } from '@/types/checklist'
import { loadChecklists, deleteChecklist } from '@/lib/checklist-utils'
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

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="logo"><Logo /></span>
          <span className="wordmark">D2 Forge</span>
          <span className="live"><span className="dot" /> Checklists</span>
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
          <Link className="btn primary" href="/">
            <Icon.back style={{ width: 15, height: 15 }} />
            <span className="hidden sm:inline">Back to Optimizer</span>
          </Link>
          <ThemeToggle />
        </div>
      </header>
      <div className="container-forge">
        {isLoading ? (
          <div className="panel">
            <div className="scan">
              <div className="ring" />
              <div className="label">Loading your checklists…</div>
              <div className="barwrap"><span /></div>
            </div>
          </div>
        ) : (
          <>
      <div className="page-head">
        <p className="eyebrow">Farming Tracker</p>
        <h1>My Build Checklists</h1>
        <p>Track your farming progress for optimal Destiny 2 armor builds — assign slots, tick off mods, and let tuning requirements auto-complete.</p>
      </div>

      {/* Summary */}
      <div className="summary-grid">
        <div className="stat-card">
          <div className="sc-ic total"><Icon.package /></div>
          <div className="sc-meta">
            <div className="lbl">Total Builds</div>
            <div className="num">{checklistArray.length}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="sc-ic prog"><Icon.list /></div>
          <div className="sc-meta">
            <div className="lbl">In Progress</div>
            <div className="num">{activeChecklists.length}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="sc-ic done"><Icon.check2 /></div>
          <div className="sc-meta">
            <div className="lbl">Completed</div>
            <div className="num">{completedChecklists.length}</div>
          </div>
        </div>
      </div>

      {checklistArray.length === 0 ? (
        <div className="panel ck-empty">
          <div className="empty">
            <span className="glyph"><Logo /></span>
            <h3>No Checklists Yet</h3>
            <p>
              Head to the optimizer and hit <span className="kbd">Add to Checklist</span> on any
              solution to start tracking what you need to farm.
            </p>
            <Link className="btn primary" href="/">Start Optimizing Builds</Link>
          </div>
        </div>
      ) : (
        <div>
          {activeChecklists.length > 0 && (
            <div className="section-block">
              <h2 className="section-label">
                Active Builds <span className="count">{activeChecklists.length}</span>
              </h2>
              {activeChecklists.map((checklist) => (
                <div key={checklist.id} style={{ marginBottom: 16 }}>
                  <ChecklistView
                    checklist={checklist}
                    onUpdate={handleUpdateChecklist}
                    onDelete={handleDeleteChecklist}
                  />
                </div>
              ))}
            </div>
          )}

          {completedChecklists.length > 0 && (
            <div className="section-block">
              <h2 className="section-label">
                Completed Builds <span className="count">{completedChecklists.length}</span>
              </h2>
              {completedChecklists.map((checklist) => (
                <div key={checklist.id} style={{ marginBottom: 16 }}>
                  <ChecklistView
                    checklist={checklist}
                    onUpdate={handleUpdateChecklist}
                    onDelete={handleDeleteChecklist}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
          </>
        )}
      </div>
    </div>
  )
}
