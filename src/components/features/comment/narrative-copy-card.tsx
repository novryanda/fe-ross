'use client'
import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { toast } from 'sonner'

export function NarrativeCopyCard({ narrative, instruction }: { narrative: string; instruction?: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(narrative)
    setCopied(true)
    toast.success('Narasi berhasil disalin!')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="card" style={{ padding: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
        <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Narasi Komentar</label>
        <button onClick={handleCopy} style={{
          display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.25rem 0.5rem',
          background: copied ? 'var(--status-available-bg)' : 'var(--bg-primary)', border: `1px solid ${copied ? 'rgba(16,185,129,0.3)' : 'var(--border-default)'}`,
          borderRadius: 6, cursor: 'pointer', color: copied ? 'var(--status-available)' : 'var(--text-muted)', fontSize: '0.7rem', transition: 'all 0.15s',
        }}>
          {copied ? <><Check size={12} /> Tersalin</> : <><Copy size={12} /> Salin</>}
        </button>
      </div>
      <div style={{ padding: '0.75rem', background: 'var(--bg-primary)', borderRadius: 8, border: '1px solid var(--border-subtle)', fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.6, fontStyle: 'italic' }}>
        &ldquo;{narrative}&rdquo;
      </div>
      {instruction && (
        <div style={{ marginTop: '0.625rem', padding: '0.5rem 0.75rem', background: 'rgba(0,212,255,0.05)', border: '1px solid rgba(0,212,255,0.15)', borderRadius: 8, fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
          <strong style={{ color: 'var(--cyan)' }}>Instruksi:</strong> {instruction}
        </div>
      )}
    </div>
  )
}
