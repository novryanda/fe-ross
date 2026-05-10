'use client'
import { useState, type ReactNode } from 'react'

interface Tab { id: string; label: string; icon?: ReactNode; count?: number }

interface TabsProps {
  tabs: Tab[]
  activeTab: string
  onChange: (id: string) => void
  children: ReactNode
}

export function Tabs({ tabs, activeTab, onChange, children }: TabsProps) {
  return (
    <div>
      <div style={{ display: 'flex', gap: '1.5rem', borderBottom: '1px solid var(--border-subtle)', marginBottom: '1.5rem' }}>
        {tabs.map(tab => {
          const active = tab.id === activeTab
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '0.75rem 0', fontSize: '0.875rem', fontWeight: active ? 600 : 500,
                color: active ? 'var(--cyan)' : 'var(--text-muted)',
                background: 'transparent', border: 'none', borderBottom: `2px solid ${active ? 'var(--cyan)' : 'transparent'}`,
                cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              {tab.icon && <span style={{ opacity: active ? 1 : 0.7 }}>{tab.icon}</span>}
              {tab.label}
              {typeof tab.count === 'number' && (
                <span style={{ background: active ? 'var(--cyan-dim)' : 'var(--bg-elevated)', color: active ? 'var(--cyan)' : 'var(--text-secondary)', padding: '0.125rem 0.375rem', borderRadius: 99, fontSize: '0.65rem', fontWeight: 700 }}>
                  {tab.count}
                </span>
              )}
            </button>
          )
        })}
      </div>
      {children}
    </div>
  )
}
