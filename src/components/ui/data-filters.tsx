'use client'
import { Search, X } from 'lucide-react'

interface DataFiltersProps {
  search: string
  onSearchChange: (val: string) => void
  placeholder?: string
  filters?: { label: string; value: string; options: { value: string; label: string }[]; onChange: (val: string) => void }[]
  actions?: React.ReactNode
}

export function DataFilters({ search, onSearchChange, placeholder = 'Search...', filters, actions }: DataFiltersProps) {
  return (
    <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', alignItems: 'center', flexWrap: 'wrap' }}>
      <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
        <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
        <input
          type="text"
          className="input-field"
          placeholder={placeholder}
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          style={{ paddingLeft: '2.25rem', paddingRight: search ? '2.25rem' : undefined }}
        />
        {search && (
          <button onClick={() => onSearchChange('')} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>
            <X size={14} />
          </button>
        )}
      </div>
      {filters?.map(f => (
        <select key={f.label} className="input-field" style={{ width: 'auto' }} value={f.value} onChange={e => f.onChange(e.target.value)}>
          <option value="">{f.label}</option>
          {f.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ))}
      {actions && <div style={{ marginLeft: 'auto' }}>{actions}</div>}
    </div>
  )
}
