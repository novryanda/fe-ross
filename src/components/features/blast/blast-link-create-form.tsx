'use client'

import Link from 'next/link'
import type { FormEvent, ReactNode } from 'react'
import { CheckCircle2, Circle, Info, Link2, RadioTower, Send, StickyNote, Users } from 'lucide-react'
import { PLATFORM_OPTIONS } from '@/components/features/campaign/enterprise-campaign-form'
import { Button } from '@/components/ui/button'
import type { Platform } from '@/types'

const PLATFORM_BRAND: Record<Platform, { bg: string; selectedBorder: string }> = {
  INSTAGRAM: { bg: 'linear-gradient(45deg, #f09433, #e6683c, #dc2743, #cc2366, #bc1888)', selectedBorder: 'rgba(236, 72, 153, 0.65)' },
  TIKTOK: { bg: '#69C9D0', selectedBorder: 'rgba(105, 201, 208, 0.65)' },
  X_TWITTER: { bg: '#FFFFFF', selectedBorder: 'rgba(255, 255, 255, 0.35)' },
  FACEBOOK: { bg: '#1877F2', selectedBorder: 'rgba(24, 119, 242, 0.65)' },
}

const STATUS_OPTIONS = [
  {
    value: 'ACTIVE' as const,
    label: 'ACTIVE',
    description: 'Blast link aktif dan siap digunakan',
    dotColor: 'var(--status-active)',
  },
  {
    value: 'PAUSED' as const,
    label: 'PAUSED',
    description: 'Blast link dijeda untuk sementara',
    dotColor: 'var(--status-paused)',
  },
]

const INSTRUCTION_MAX = 500
const INTERNAL_NOTES_MAX = 500

interface BlastLinkCreateFormProps {
  campaignId: string
  platformOptions: Platform[]
  platform: Platform
  onPlatformChange: (platform: Platform) => void
  socialAccountId: string
  onSocialAccountChange: (id: string) => void
  accounts: { id: string; username: string; displayName?: string }[]
  accountsLoading: boolean
  postUrl: string
  onPostUrlChange: (value: string) => void
  instruction: string
  onInstructionChange: (value: string) => void
  internalNotes: string
  onInternalNotesChange: (value: string) => void
  status: 'ACTIVE' | 'PAUSED'
  onStatusChange: (status: 'ACTIVE' | 'PAUSED') => void
  canSubmit: boolean
  submitting: boolean
  onSubmit: () => void
}

export function BlastLinkCreateForm({
  campaignId,
  platformOptions,
  platform,
  onPlatformChange,
  socialAccountId,
  onSocialAccountChange,
  accounts,
  accountsLoading,
  postUrl,
  onPostUrlChange,
  instruction,
  onInstructionChange,
  internalNotes,
  onInternalNotesChange,
  status,
  onStatusChange,
  canSubmit,
  submitting,
  onSubmit,
}: BlastLinkCreateFormProps) {
  const visiblePlatforms = PLATFORM_OPTIONS.filter(item =>
    platformOptions.length ? platformOptions.includes(item.value) : true,
  )

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    onSubmit()
  }

  return (
    <form className="blast-create-form" onSubmit={handleSubmit}>
      <section className="blast-create-section">
        <BlastFormSectionHeader
          number={1}
          icon={<Link2 size={16} />}
          title="Target Information"
          subtitle="Tentukan platform, akun sumber, dan status blast."
        />

        <div className="blast-create-field">
          <label className="blast-create-label">
            Platform <span className="blast-create-required">Required</span>
          </label>
          <div className="blast-create-platform-grid">
            {visiblePlatforms.map(item => {
              const selected = platform === item.value
              const brand = PLATFORM_BRAND[item.value]
              return (
                <button
                  key={item.value}
                  type="button"
                  className={`blast-create-platform-card ${selected ? 'selected' : ''}`}
                  style={selected ? { borderColor: brand.selectedBorder } : undefined}
                  onClick={() => onPlatformChange(item.value)}
                >
                  <div className="blast-create-platform-icon">
                    <div
                      className="blast-create-platform-mask"
                      style={{
                        background: brand.bg,
                        WebkitMaskImage: `url(${item.icon})`,
                        maskImage: `url(${item.icon})`,
                      }}
                    />
                  </div>
                  <span className="blast-create-platform-label">{item.label}</span>
                  <SelectionIndicator selected={selected} />
                </button>
              )
            })}
          </div>
        </div>

        <div className="blast-create-field">
          <label className="blast-create-label">
            Source Social Account <span className="blast-create-required">Required</span>
          </label>
          <select
            className="blast-create-select"
            value={socialAccountId}
            onChange={event => onSocialAccountChange(event.target.value)}
            disabled={accountsLoading}
            required
          >
            <option value="">Pilih akun sumber</option>
            {accounts.map(account => (
              <option key={account.id} value={account.id}>
                @{account.username}{account.displayName ? ` · ${account.displayName}` : ''}
              </option>
            ))}
          </select>
          <p className="blast-create-hint">Akun yang terkait dengan target post yang akan di-blast.</p>
        </div>

        <div className="blast-create-field">
          <label className="blast-create-label">
            Status <span className="blast-create-required">Required</span>
          </label>
          <div className="blast-create-status-grid">
            {STATUS_OPTIONS.map(option => {
              const selected = status === option.value
              return (
                <button
                  key={option.value}
                  type="button"
                  className={`blast-create-status-card ${selected ? 'selected' : ''}`}
                  onClick={() => onStatusChange(option.value)}
                >
                  <div className="blast-create-status-main">
                    <span className="blast-create-status-dot" style={{ background: option.dotColor }} />
                    <div className="blast-create-status-copy">
                      <strong>{option.label}</strong>
                      <span>{option.description}</span>
                    </div>
                  </div>
                  <SelectionIndicator selected={selected} accent={option.dotColor} />
                </button>
              )
            })}
          </div>
        </div>

        <div className="blast-create-field">
          <label className="blast-create-label">Target Post URL</label>
          <div className="blast-create-url-wrap">
            <Link2 size={16} className="blast-create-url-icon" />
            <input
              className="blast-create-url-input"
              type="url"
              value={postUrl}
              onChange={event => onPostUrlChange(event.target.value)}
              placeholder="https://..."
              required
            />
          </div>
          <p className="blast-create-hint">Masukkan URL post yang akan digunakan sebagai target blast.</p>
        </div>
      </section>

      <section className="blast-create-section">
        <BlastFormSectionHeader
          number={2}
          icon={<RadioTower size={16} />}
          title="Instructions"
          subtitle="Berikan instruksi untuk Buzzer dan catatan internal."
        />

        <div className="blast-create-instructions-grid">
          <div className="blast-create-field">
            <label className="blast-create-label">
              Instruction for Buzzers <span className="blast-create-optional">Optional</span>
            </label>
            <div className="blast-create-textarea-wrap">
              <Users size={15} className="blast-create-textarea-icon" />
              <textarea
                className="blast-create-textarea"
                rows={5}
                value={instruction}
                maxLength={INSTRUCTION_MAX}
                onChange={event => onInstructionChange(event.target.value)}
                placeholder="Instruksi interaksi untuk Buzzer..."
              />
              <span className="blast-create-char-count">{instruction.length} / {INSTRUCTION_MAX}</span>
            </div>
            <p className="blast-create-hint">Contoh: Like, komen positif, share, save, dll.</p>
          </div>

          <div className="blast-create-field">
            <label className="blast-create-label">
              Internal Notes <span className="blast-create-optional">Optional</span>
            </label>
            <div className="blast-create-textarea-wrap">
              <StickyNote size={15} className="blast-create-textarea-icon" />
              <textarea
                className="blast-create-textarea"
                rows={5}
                value={internalNotes}
                maxLength={INTERNAL_NOTES_MAX}
                onChange={event => onInternalNotesChange(event.target.value)}
                placeholder="Catatan internal admin..."
              />
              <span className="blast-create-char-count">{internalNotes.length} / {INTERNAL_NOTES_MAX}</span>
            </div>
            <p className="blast-create-hint">Hanya dapat dilihat oleh admin.</p>
          </div>
        </div>
      </section>

      <section className="blast-create-section">
        <BlastFormSectionHeader
          number={3}
          icon={<Send size={16} />}
          title="Publish"
          subtitle="Setelah dibuat, attempt pertama langsung tersedia untuk Buzzer pertama yang Keep."
        />

        <div className="blast-create-publish-banner">
          <Info size={18} />
          <span>Blast link akan langsung aktif setelah dibuat dan siap untuk di-keep oleh buzzer.</span>
        </div>
      </section>

      <div className="blast-create-footer">
        <Link href={`/campaigns/${campaignId}/blast-links`} className="btn-secondary blast-create-cancel">
          Cancel
        </Link>
        <Button type="submit" disabled={!canSubmit} loading={submitting} icon={<Send size={14} />}>
          Create Blast Link
        </Button>
      </div>
    </form>
  )
}

function BlastFormSectionHeader({
  number,
  icon,
  title,
  subtitle,
}: {
  number: number
  icon: ReactNode
  title: string
  subtitle: string
}) {
  return (
    <div className="blast-create-section-header">
      <div className="blast-create-section-title-row">
        <span className="blast-create-step-number">{number}</span>
        <span className="blast-create-section-icon">{icon}</span>
        <strong>{title}</strong>
      </div>
      <p className="blast-create-section-subtitle">{subtitle}</p>
    </div>
  )
}

function SelectionIndicator({ selected, accent }: { selected: boolean; accent?: string }) {
  if (selected) {
    return (
      <span className="blast-create-selection-check" style={accent ? { background: accent, color: '#0b1220' } : undefined}>
        <CheckCircle2 size={14} />
      </span>
    )
  }

  return (
    <span className="blast-create-selection-empty">
      <Circle size={14} />
    </span>
  )
}
