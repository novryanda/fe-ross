import type { BlastAttemptStatus, CampaignStatus, CommentCommandStatus, CommentTaskStatus, Stance, Platform, BlastTargetStatus, UserStatus, SocialAccountStatus } from '@/types'
import { getAttemptStatusConfig, getCampaignStatusConfig, getCommentCommandStatusConfig, getCommentTaskStatusConfig, getStanceConfig, getPlatformLabel, getPlatformClass } from '@/lib/utils'

interface StatusBadgeProps {
  status: BlastAttemptStatus | CampaignStatus | CommentCommandStatus | CommentTaskStatus | BlastTargetStatus | UserStatus | SocialAccountStatus
  type: 'attempt' | 'campaign' | 'task' | 'command' | 'user' | 'social'
  size?: 'sm' | 'md'
}

export function StatusBadge({ status, type, size = 'md' }: StatusBadgeProps) {
  let config: { label: string; color: string; bg: string }
  if (type === 'attempt') config = getAttemptStatusConfig(status as BlastAttemptStatus)
  else if (type === 'campaign') config = getCampaignStatusConfig(status as CampaignStatus)
  else if (type === 'command') config = getCommentCommandStatusConfig(status as CommentCommandStatus)
  else if (type === 'task') config = getCommentTaskStatusConfig(status as CommentTaskStatus)
  else {
    const entityConfig: Record<UserStatus | SocialAccountStatus, { label: string; color: string; bg: string }> = {
      ACTIVE: { label: 'Active', color: 'var(--status-active)', bg: 'var(--status-active-bg)' },
      INACTIVE: { label: 'Inactive', color: 'var(--text-muted)', bg: 'rgba(100, 116, 139, 0.12)' },
      ARCHIVED: { label: 'Archived', color: 'var(--status-cancelled)', bg: 'var(--status-cancelled-bg)' },
    }
    config = entityConfig[status as UserStatus | SocialAccountStatus]
  }

  if (!config) return null

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
      padding: size === 'sm' ? '0.15rem 0.45rem' : '0.2rem 0.6rem',
      borderRadius: 99, background: config.bg,
      color: config.color, fontSize: size === 'sm' ? '0.65rem' : '0.7rem',
      fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase',
      border: `1px solid ${config.color}30`, whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: config.color, flexShrink: 0 }} />
      {config.label}
    </span>
  )
}

export function StanceBadge({ stance, size = 'md' }: { stance: Stance; size?: 'sm' | 'md' }) {
  const config = getStanceConfig(stance)
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '0.25rem',
      padding: size === 'sm' ? '0.15rem 0.45rem' : '0.2rem 0.6rem',
      borderRadius: 99, background: config.bg, color: config.color,
      fontSize: size === 'sm' ? '0.65rem' : '0.7rem', fontWeight: 700,
      letterSpacing: '0.04em', textTransform: 'uppercase',
      border: `1px solid ${config.color}40`,
    }}>
      {stance === 'PRO' ? '+' : '-'} {config.label}
    </span>
  )
}

export function PlatformBadge({ platform, size = 'md' }: { platform: Platform; size?: 'sm' | 'md' }) {
  const getBrandStyle = (p: Platform) => {
    switch (p) {
      case 'INSTAGRAM':
        return {
          background: 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)',
          icon: '/instagram.svg'
        }
      case 'TIKTOK':
        return {
          background: '#69C9D0', // TikTok Cyan
          icon: '/tiktok.svg'
        }
      case 'X_TWITTER':
        return {
          background: '#FFFFFF',
          icon: '/x.svg'
        }
      case 'FACEBOOK':
        return {
          background: '#1877F2',
          icon: '/facebook.svg'
        }
      default:
        return { background: 'var(--text-muted)', icon: '' }
    }
  }

  const style = getBrandStyle(platform)
  const iconSize = size === 'sm' ? 12 : 14

  return (
    <span className={`platform-badge platform-${platform.toLowerCase().replace('_', '-')}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
      <div 
        style={{
          width: iconSize,
          height: iconSize,
          background: style.background,
          WebkitMaskImage: `url(${style.icon})`,
          maskImage: `url(${style.icon})`,
          WebkitMaskRepeat: 'no-repeat',
          maskRepeat: 'no-repeat',
          WebkitMaskSize: 'contain',
          maskSize: 'contain',
          flexShrink: 0
        }}
      />
      {platform === 'X_TWITTER' ? 'X' : platform.charAt(0) + platform.slice(1).toLowerCase()}
    </span>
  )
}

export function RoleBadge({ role, size = 'md' }: { role: string; size?: 'sm' | 'md' }) {
  let color = 'var(--text-muted)'
  let bg = 'rgba(255,255,255,0.05)'
  
  if (role === 'ADMIN') {
    color = 'var(--cyan)'
    bg = 'rgba(0, 240, 255, 0.1)'
  } else if (role === 'BUZZER') {
    color = '#8b5cf6'
    bg = 'rgba(139, 92, 246, 0.1)'
  } else if (role === 'VIEWER') {
    color = '#39ff14'
    bg = 'rgba(57, 255, 20, 0.1)'
  }

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: size === 'sm' ? '0.15rem 0.4rem' : '0.2rem 0.5rem',
      borderRadius: 4, background: bg, color: color,
      fontSize: size === 'sm' ? '0.6rem' : '0.65rem', fontWeight: 700,
      letterSpacing: '0.04em', textTransform: 'uppercase',
      border: `1px solid ${color}40`,
    }}>
      {role}
    </span>
  )
}
