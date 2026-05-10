'use client'
import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Layers } from 'lucide-react'
import { useCampaignStore } from '@/stores/campaign-store'
import { useCampaigns } from '@/hooks/use-campaign'

export function CampaignSelector() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const { activeCampaignId, setActiveCampaignId } = useCampaignStore()
  const { data } = useCampaigns()

  useEffect(() => {
    const handle = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  const campaigns = data?.data ?? []
  const active = campaigns.find(c => c.id === activeCampaignId)

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(!open)} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.375rem 0.75rem', background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 8, cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.8125rem', minWidth: 160 }}>
        <Layers size={14} style={{ color: 'var(--cyan)' }} />
        <span style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {active?.name ?? 'All Campaigns'}
        </span>
        <ChevronDown size={12} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>

      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, minWidth: 220, background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.4)', zIndex: 100, overflow: 'hidden' }}>
          <button onClick={() => { setActiveCampaignId(null); setOpen(false) }} style={{ width: '100%', padding: '0.5rem 0.875rem', textAlign: 'left', background: !activeCampaignId ? 'var(--cyan-dim)' : 'transparent', border: 'none', cursor: 'pointer', color: !activeCampaignId ? 'var(--cyan)' : 'var(--text-secondary)', fontSize: '0.8125rem', borderBottom: '1px solid var(--border-subtle)' }}>
            All Campaigns
          </button>
          {campaigns.filter(c => c.status === 'ACTIVE').map(c => (
            <button key={c.id} onClick={() => { setActiveCampaignId(c.id); setOpen(false) }} style={{ width: '100%', padding: '0.5rem 0.875rem', textAlign: 'left', background: activeCampaignId === c.id ? 'var(--cyan-dim)' : 'transparent', border: 'none', cursor: 'pointer', color: activeCampaignId === c.id ? 'var(--cyan)' : 'var(--text-secondary)', fontSize: '0.8125rem' }}>
              {c.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
