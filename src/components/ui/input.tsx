import type { InputHTMLAttributes } from 'react'
import { forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  icon?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({ label, error, hint, icon, style, ...props }, ref) => (
  <div className="form-group">
    {label && <label className="form-label" htmlFor={props.id}>{label}</label>}
    <div style={{ position: 'relative' }}>
      {icon && <div style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none', display: 'flex' }}>{icon}</div>}
      <input ref={ref} className="input-field" style={{ ...style, paddingLeft: icon ? '2.5rem' : undefined, borderColor: error ? 'var(--status-expired)' : undefined }} {...props} />
    </div>
    {error && <span className="form-error">{error}</span>}
    {hint && !error && <span className="form-hint">{hint}</span>}
  </div>
))
Input.displayName = 'Input'
