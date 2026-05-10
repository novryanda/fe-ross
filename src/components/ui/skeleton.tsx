export function Skeleton({ width = '100%', height = 16, rounded = 6, style }: { width?: string | number; height?: number; rounded?: number; style?: React.CSSProperties }) {
  return <div className="skeleton" style={{ width, height, borderRadius: rounded, ...style }} />
}

export function SkeletonCard() {
  return (
    <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <Skeleton height={12} width="60%" />
      <Skeleton height={24} width="80%" />
      <Skeleton height={10} width="40%" />
    </div>
  )
}

export function SkeletonRow({ cols = 4 }: { cols?: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i}><Skeleton height={14} width="80%" /></td>
      ))}
    </tr>
  )
}
