import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  icon?: ReactNode
}

export function Button({ variant = 'primary', size = 'md', loading, icon, children, className = '', disabled, ...props }: ButtonProps) {
  const cls = variant === 'primary' ? 'btn-primary' : variant === 'secondary' ? 'btn-secondary' : variant === 'danger' ? 'btn-danger' : 'btn-ghost'
  const sizeStyles: Record<string, string> = {
    sm: 'padding: 0.25rem 0.625rem; font-size: 0.75rem;',
    md: '',
    lg: 'padding: 0.625rem 1.5rem; font-size: 0.9375rem;',
  }

  return (
    <button className={`${cls} ${className}`} disabled={disabled || loading} style={{ opacity: loading ? 0.7 : undefined, cursor: loading ? 'wait' : undefined }} {...props}>
      {loading ? <span className="spinner" /> : icon}
      {children}
    </button>
  )
}
