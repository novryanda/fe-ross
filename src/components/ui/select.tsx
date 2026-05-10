import type { SelectHTMLAttributes } from 'react'
import { forwardRef } from 'react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
  placeholder?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(({ label, error, options, placeholder, ...props }, ref) => (
  <div className="form-group">
    {label && <label className="form-label" htmlFor={props.id}>{label}</label>}
    <select ref={ref} className="input-field" style={{ borderColor: error ? 'var(--status-expired)' : undefined }} {...props}>
      {placeholder && <option value="">{placeholder}</option>}
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
    {error && <span className="form-error">{error}</span>}
  </div>
))
Select.displayName = 'Select'
