'use client'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface ProKontraData {
  label: string
  pro: number
  kontra: number
}

export function ProKontraChart({ data, height = 200 }: { data: ProKontraData[]; height?: number }) {
  return (
    <div className="card" style={{ padding: '1.25rem' }}>
      <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
        ⚔ PRO vs KONTRA
      </h3>
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem' }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, background: '#10b981' }} /> PRO
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.75rem' }}>
          <span style={{ width: 10, height: 10, borderRadius: 2, background: '#ef4444' }} /> KONTRA
        </div>
      </div>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} layout="vertical" margin={{ left: 60 }}>
          <XAxis type="number" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
          <YAxis type="category" dataKey="label" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
          <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 10, fontSize: '0.8125rem' }} />
          <Bar dataKey="pro" fill="#10b981" radius={[0, 4, 4, 0]} barSize={14} name="PRO" />
          <Bar dataKey="kontra" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={14} name="KONTRA" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
