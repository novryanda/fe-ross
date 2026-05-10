'use client'
import { useState, useEffect, useCallback } from 'react'
import { formatCountdown, isExpiringSoon } from '@/lib/utils'

export function useCountdown(expiresAt: string | null | undefined) {
  const [timeStr, setTimeStr] = useState(expiresAt ? formatCountdown(expiresAt) : '--:--:--')
  const [isExpired, setIsExpired] = useState(false)
  const [isWarning, setIsWarning] = useState(false)

  useEffect(() => {
    if (!expiresAt) return
    const tick = () => {
      const str = formatCountdown(expiresAt)
      setTimeStr(str)
      setIsExpired(str === 'Expired')
      setIsWarning(isExpiringSoon(expiresAt))
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [expiresAt])

  return { timeStr, isExpired, isWarning }
}
