'use client'
import { useState, useRef, useEffect } from 'react'
import { Bell, AlertTriangle, Clock, CheckCircle2 } from 'lucide-react'

const mockNotifications = [
  { id: '1', type: 'warning', message: '2 blast attempt akan expired dalam 30 menit', time: '5m lalu', read: false },
  { id: '2', type: 'success', message: 'Dimas Pratama menyelesaikan blast TikTok', time: '1j lalu', read: false },
  { id: '3', type: 'info', message: 'Comment task baru di-assign ke Anda', time: '2j lalu', read: true },
]

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const unread = mockNotifications.filter(n => !n.read).length

  useEffect(() => {
    const handle = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  const iconMap: Record<string, React.ReactNode> = {
    warning: <AlertTriangle size={14} style={{ color: 'var(--status-kept)' }} />,
    success: <CheckCircle2 size={14} style={{ color: 'var(--status-available)' }} />,
    info: <Clock size={14} style={{ color: 'var(--cyan)' }} />,
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(!open)} style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.375rem', borderRadius: 8, display: 'flex' }}>
        <Bell size={18} />
        {unread > 0 && (
          <span style={{ position: 'absolute', top: 2, right: 2, width: 8, height: 8, borderRadius: '50%', background: 'var(--status-expired)', border: '2px solid var(--bg-surface)' }} />
        )}
      </button>

      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: 320, background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.4)', zIndex: 100, overflow: 'hidden' }}>
          <div style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>Notifikasi</span>
            {unread > 0 && <span style={{ fontSize: '0.7rem', color: 'var(--cyan)', background: 'var(--cyan-dim)', padding: '0.125rem 0.375rem', borderRadius: 99 }}>{unread} baru</span>}
          </div>
          {mockNotifications.map(n => (
            <div key={n.id} style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border-subtle)', display: 'flex', gap: '0.625rem', alignItems: 'flex-start', background: n.read ? 'transparent' : 'rgba(0,212,255,0.03)' }}>
              <div style={{ marginTop: 2 }}>{iconMap[n.type]}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{n.message}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{n.time}</div>
              </div>
              {!n.read && <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--cyan)', marginTop: 6, flexShrink: 0 }} />}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
