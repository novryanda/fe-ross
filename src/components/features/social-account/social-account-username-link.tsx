import type { CSSProperties } from 'react'
import type { SocialAccount } from '@/types'

interface SocialAccountUsernameLinkProps {
  account?: Pick<SocialAccount, 'username' | 'profileUrl'> | null
  username?: string | null
  profileUrl?: string | null
  className?: string
  style?: CSSProperties
  fallback?: string
}

export function SocialAccountUsernameLink({
  account,
  username,
  profileUrl,
  className = 'ext-link',
  style,
  fallback = '-',
}: SocialAccountUsernameLinkProps) {
  const resolvedUsername = account?.username ?? username
  const resolvedProfileUrl = account?.profileUrl ?? profileUrl

  if (!resolvedUsername) {
    return <span style={style}>{fallback}</span>
  }

  const label = `@${resolvedUsername}`

  if (!resolvedProfileUrl) {
    return <span style={{ fontWeight: 800, ...style }}>{label}</span>
  }

  return (
    <a
      href={resolvedProfileUrl}
      target="_blank"
      rel="noreferrer"
      className={className}
      style={{ fontWeight: 800, ...style }}
    >
      {label}
    </a>
  )
}
