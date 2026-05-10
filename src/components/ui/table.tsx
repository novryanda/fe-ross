'use client'
import { useState, useMemo, type ReactNode } from 'react'
import { ChevronUp, ChevronDown, ChevronsLeft, ChevronsRight, ChevronLeft, ChevronRight } from 'lucide-react'

export interface Column<T> {
  key: string
  label: string
  sortable?: boolean
  render?: (item: T) => ReactNode
  width?: number | string
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  loading?: boolean
  emptyMessage?: string
  emptyIcon?: ReactNode
  pagination?: { page: number; limit: number; total: number; onChange: (page: number) => void }
  onRowClick?: (item: T) => void
  rowKey: (item: T) => string
}

export function DataTable<T>({ columns, data, loading, emptyMessage = 'Tidak ada data.', emptyIcon, pagination, onRowClick, rowKey }: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const handleSort = (key: string) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  const sortedData = useMemo(() => {
    if (!sortKey) return data
    return [...data].sort((a, b) => {
      const va = (a as Record<string, unknown>)[sortKey]
      const vb = (b as Record<string, unknown>)[sortKey]
      if (va == null || vb == null) return 0
      const cmp = va < vb ? -1 : va > vb ? 1 : 0
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [data, sortKey, sortDir])

  const totalPages = pagination ? Math.ceil(pagination.total / pagination.limit) : 1

  return (
    <div className="data-table-container">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map(col => (
              <th
                key={col.key}
                style={{ width: col.width, cursor: col.sortable ? 'pointer' : undefined }}
                onClick={() => col.sortable && handleSort(col.key)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  {col.label}
                  {col.sortable && sortKey === col.key && (sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={i}>
                {columns.map((col, j) => <td key={j}><div className="skeleton" style={{ height: 14, width: '80%' }} /></td>)}
              </tr>
            ))
          ) : sortedData.length === 0 ? (
            <tr>
              <td colSpan={columns.length} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                {emptyIcon && <div style={{ marginBottom: '0.75rem', opacity: 0.4, display: 'flex', justifyContent: 'center' }}>{emptyIcon}</div>}
                <div>{emptyMessage}</div>
              </td>
            </tr>
          ) : (
            sortedData.map(item => (
              <tr key={rowKey(item)} onClick={() => onRowClick?.(item)} style={{ cursor: onRowClick ? 'pointer' : undefined }}>
                {columns.map(col => (
                  <td key={col.key}>
                    {col.render ? col.render(item) : String((item as Record<string, unknown>)[col.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>

      {pagination && totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1rem', borderTop: '1px solid var(--border-subtle)' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Menampilkan {((pagination.page - 1) * pagination.limit) + 1}–{Math.min(pagination.page * pagination.limit, pagination.total)} dari {pagination.total}
          </span>
          <div style={{ display: 'flex', gap: '0.25rem' }}>
            <button onClick={() => pagination.onChange(1)} disabled={pagination.page === 1} className="btn-ghost" style={{ padding: '0.25rem' }}><ChevronsLeft size={14} /></button>
            <button onClick={() => pagination.onChange(pagination.page - 1)} disabled={pagination.page === 1} className="btn-ghost" style={{ padding: '0.25rem' }}><ChevronLeft size={14} /></button>
            <span style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{pagination.page} / {totalPages}</span>
            <button onClick={() => pagination.onChange(pagination.page + 1)} disabled={pagination.page >= totalPages} className="btn-ghost" style={{ padding: '0.25rem' }}><ChevronRight size={14} /></button>
            <button onClick={() => pagination.onChange(totalPages)} disabled={pagination.page >= totalPages} className="btn-ghost" style={{ padding: '0.25rem' }}><ChevronsRight size={14} /></button>
          </div>
        </div>
      )}
    </div>
  )
}
