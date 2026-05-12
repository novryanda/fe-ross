import type { Platform } from '@/types'

interface PlatformSelectorProps {
  value: Platform | undefined
  onChange: (platform: Platform) => void
}

export function PlatformSelector({ value, onChange }: PlatformSelectorProps) {
  return (
    <div className="platform-card-grid platform-card-grid-compact" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
      {(['INSTAGRAM', 'TIKTOK', 'X_TWITTER', 'FACEBOOK'] as Platform[]).map(item => {
        const selected = value === item
        const brandStyles: Record<Platform, { bg: string; icon: string }> = {
          INSTAGRAM: { bg: 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)', icon: '/instagram.svg' },
          TIKTOK: { bg: '#69C9D0', icon: '/tiktok.svg' },
          X_TWITTER: { bg: '#FFFFFF', icon: '/x.svg' },
          FACEBOOK: { bg: '#1877F2', icon: '/facebook.svg' }
        }
        const style = brandStyles[item]
        
        return (
          <button 
            key={item} 
            type="button" 
            className={`platform-select-card-wide ${selected ? 'selected' : ''}`} 
            onClick={() => onChange(item)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.65rem 0.85rem',
              background: 'rgba(255,255,255,0.02)',
              border: selected ? '1px solid var(--cyan)' : '1px solid var(--border-subtle)',
              borderRadius: '12px',
              width: '100%',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <div 
              style={{ 
                width: 18, height: 18, 
                background: style.bg,
                WebkitMaskImage: `url(${style.icon})`,
                maskImage: `url(${style.icon})`,
                WebkitMaskRepeat: 'no-repeat',
                maskRepeat: 'no-repeat',
                WebkitMaskSize: 'contain',
                maskSize: 'contain',
                opacity: selected ? 1 : 0.6
              }} 
            />
            <span style={{ 
              color: selected ? 'var(--text-primary)' : 'var(--text-secondary)',
              fontWeight: 700,
              fontSize: '0.82rem',
              textTransform: 'capitalize'
            }}>
              {item === 'X_TWITTER' ? 'X / Twitter' : item.toLowerCase().replace('_', ' ')}
            </span>
          </button>
        )
      })}
    </div>
  )
}
