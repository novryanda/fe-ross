import { Lock } from 'lucide-react'

export function ReadonlyNotice({ text = 'Mode read-only. Anda dapat melihat data dan mengunduh laporan, tetapi tidak dapat membuat atau mengubah data.' }: { text?: string }) {
  return (
    <div className="info-banner info-banner-cyan">
      <Lock size={15} style={{ color: 'var(--cyan)', flexShrink: 0, marginTop: 1 }} />
      <span>{text}</span>
    </div>
  )
}
