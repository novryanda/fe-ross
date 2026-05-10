import type { ReactNode, HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'glow'
  accentColor?: string
  padding?: string
}

export function Card({ variant = 'default', accentColor, padding = '1.25rem', children, className = '', style, ...props }: CardProps) {
  const cls = variant === 'elevated' ? 'card-elevated' : variant === 'glow' ? 'card card-glow' : 'card'
  return (
    <div
      className={`${cls} ${className}`}
      style={{ padding, borderLeft: accentColor ? `3px solid ${accentColor}` : undefined, ...style }}
      {...props}
    >
      {children}
    </div>
  )
}
