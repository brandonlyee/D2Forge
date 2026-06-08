"use client"

import { StatIcon } from '@/components/stat-icon'
import { Icon } from '@/components/forge/icons'
import type { FragmentSelection } from '@/lib/fragments'

// Read-only display of the subclass fragments chosen for a build. Shared by the solution
// results and saved checklists so both render fragments identically.
export function FragmentList({ selection }: { selection: FragmentSelection }) {
  return (
    <div>
      <span className="frag-subclass" style={{ color: selection.accent }}>
        <span className="dot" style={{ background: selection.accent }} />
        {selection.subclassName}
      </span>
      <div className="frag-list">
        {selection.fragments.map((frag) => (
          <div className="frag-line" key={frag.name}>
            <span className="frag-ico">
              {frag.icon ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={frag.icon} alt="" loading="lazy" />
              ) : (
                <Icon.package className="ph" />
              )}
            </span>
            <span className="frag-meta">
              <span className="frag-name">{frag.name}</span>
              <span className="frag-effect">
                {Object.entries(frag.effects).map(([stat, delta]) => (
                  <span className={'frag-chip ' + (delta > 0 ? 'plus' : 'minus')} key={stat}>
                    {delta > 0 ? '+' : ''}{delta}
                    <StatIcon stat={stat} size={12} /> {stat}
                  </span>
                ))}
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
