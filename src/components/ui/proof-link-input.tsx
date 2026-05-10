'use client'
import { useState } from 'react'
import { Link2, ExternalLink, CheckCircle, AlertTriangle } from 'lucide-react'
import { isGoogleDriveUrl, isValidUrl } from '@/lib/utils'

interface ProofLinkInputProps {
  value: string
  onChange: (val: string) => void
  error?: string
}

export function ProofLinkInput({ value, onChange, error }: ProofLinkInputProps) {
  const valid = value && isValidUrl(value)
  const isDrive = valid && isGoogleDriveUrl(value)

  return (
    <div className="form-group">
      <label className="form-label"><Link2 size={13} style={{ display: 'inline', verticalAlign: 'middle' }} /> Proof Link</label>
      <div style={{ position: 'relative' }}>
        <input
          type="url"
          className="input-field"
          placeholder="https://drive.google.com/file/d/..."
          value={value}
          onChange={e => onChange(e.target.value)}
          style={{ paddingRight: valid ? '2.5rem' : undefined, borderColor: error ? 'var(--status-expired)' : undefined }}
        />
        {valid && (
          <a href={value} target="_blank" rel="noopener noreferrer" style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--cyan)', display: 'flex' }}>
            <ExternalLink size={14} />
          </a>
        )}
      </div>
      {error && <span className="form-error">{error}</span>}
      {valid && !isDrive && (
        <div style={{ marginTop: '0.375rem', display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.375rem 0.625rem', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 8, fontSize: '0.75rem', color: 'var(--status-kept)' }}>
          <AlertTriangle size={12} /> Bukan Google Drive URL. Disarankan menggunakan Google Drive.
        </div>
      )}
      {isDrive && (
        <div style={{ marginTop: '0.375rem', display: 'flex', alignItems: 'center', gap: '0.375rem', padding: '0.375rem 0.625rem', background: 'var(--status-available-bg)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 8, fontSize: '0.75rem', color: 'var(--status-available)' }}>
          <CheckCircle size={12} /> Google Drive URL terdeteksi ✓
        </div>
      )}
      <span className="form-hint">Gunakan Google Drive link dengan akses publik Anyone with the link.</span>
    </div>
  )
}
