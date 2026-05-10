'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart3, ClipboardList, FileText, History, MessageCircle, Target, Users } from 'lucide-react'

const TABS = [
  { label: 'Overview', href: '', icon: BarChart3 },
  { label: 'Blast Links', href: '/blast-links', icon: Target },
  { label: 'Commands', href: '/commands', icon: MessageCircle },
  { label: 'Tasks', href: '/tasks', icon: ClipboardList },
  { label: 'Reports', href: '/reports', icon: FileText },
  { label: 'Members', href: '/members', icon: Users },
  { label: 'Audit', href: '/audit', icon: History },
]

export function CampaignTabs({ campaignId, viewer = false }: { campaignId: string; viewer?: boolean }) {
  const pathname = usePathname()
  const visibleTabs = viewer ? TABS.filter(t => !['Members', 'Audit', 'Tasks'].includes(t.label)) : TABS
  return (
    <div style={{ display: 'flex', gap: '1.25rem', borderBottom: '1px solid var(--border-subtle)', marginBottom: '1.5rem', overflowX: 'auto' }}>
      {visibleTabs.map(tab => {
        const href = `/campaigns/${campaignId}${tab.href}`
        const active = tab.href === '' ? pathname === `/campaigns/${campaignId}` : pathname.startsWith(href)
        const Icon = tab.icon
        return (
          <Link
            key={tab.label}
            href={href}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.75rem 0',
              color: active ? 'var(--cyan)' : 'var(--text-muted)',
              borderBottom: `2px solid ${active ? 'var(--cyan)' : 'transparent'}`,
              fontSize: '0.8125rem',
              fontWeight: active ? 700 : 500,
              textDecoration: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            <Icon size={13} />
            {tab.label}
          </Link>
        )
      })}
    </div>
  )
}
