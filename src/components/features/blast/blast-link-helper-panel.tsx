import { CheckCircle2, Eye, RadioTower, Users, Zap } from 'lucide-react'
import { PlatformBadge, StatusBadge } from '@/components/ui/badges'
import { formatDate } from '@/lib/utils'
import type { Campaign, Platform, SocialAccount } from '@/types'

interface BlastLinkHelperPanelProps {
  campaign?: Campaign
  memberCount?: number
  selectedPlatform?: Platform
  selectedAccount?: SocialAccount
  postUrl?: string
}

const BLAST_FLOW_STEPS = [
  {
    title: 'Admin menerbitkan blast link',
    description: 'Admin atau PIC menambahkan target post ke campaign.',
  },
  {
    title: 'Semua Buzzer campaign dapat melihatnya',
    description: 'Blast terbuka untuk Buzzer yang menjadi member campaign.',
  },
  {
    title: 'Buzzer pertama yang Keep mengunci attempt',
    description: 'Attempt dikunci oleh Buzzer pertama yang eligible.',
  },
  {
    title: 'Buzzer submit bukti dan metrik',
    description: 'Buzzer mengirim bukti interaksi beserta metrik performa.',
  },
] as const

export function BlastLinkHelperPanel({
  campaign,
  memberCount,
  selectedPlatform,
  selectedAccount,
  postUrl,
}: BlastLinkHelperPanelProps) {
  const resolvedMemberCount = memberCount ?? campaign?.memberCount

  return (
    <aside className="helper-panel helper-panel--embedded">
      <div className="helper-block">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', marginBottom: '0.9rem' }}>
          <RadioTower size={16} style={{ color: 'var(--cyan)' }} />
          <strong>Ringkasan Campaign</strong>
        </div>
        <div style={{ display: 'grid', gap: '0.8rem' }}>
          <div>
            <div className="blast-metric-label">Nama Campaign</div>
            <div style={{ fontWeight: 800 }}>{campaign?.name ?? '-'}</div>
          </div>
          <div>
            <div className="blast-metric-label">Status</div>
            {campaign && <StatusBadge status={campaign.status} type="campaign" size="sm" />}
          </div>
          <div>
            <div className="blast-metric-label">Platform Tersedia</div>
            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
              {campaign?.platforms.length
                ? campaign.platforms.map(platform => <PlatformBadge key={platform} platform={platform} size="sm" />)
                : <span className="muted-meta">-</span>}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <div className="blast-metric-label">Member</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 800 }}>
                <Users size={13} style={{ color: 'var(--cyan)' }} />
                {resolvedMemberCount ?? '-'}
              </div>
            </div>
            <div>
              <div className="blast-metric-label">Periode</div>
              <div className="muted-meta">
                {campaign
                  ? `${formatDate(campaign.startDate)} - ${campaign.endDate ? formatDate(campaign.endDate) : 'Tanpa batas'}`
                  : '-'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="helper-block">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', marginBottom: '0.85rem' }}>
          <Zap size={16} style={{ color: 'var(--status-kept)' }} />
          <strong>Cara Kerja</strong>
        </div>
        <div className="mini-stepper">
          {BLAST_FLOW_STEPS.map((step, index) => (
            <div className="mini-step" key={step.title}>
              <div className="mini-step-dot">{index + 1}</div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.8rem' }}>{step.title}</div>
                <div className="muted-meta">{step.description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="helper-block">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', marginBottom: '0.85rem' }}>
          <Eye size={16} style={{ color: 'var(--violet)' }} />
          <strong>Preview</strong>
        </div>
        <div className="preview-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '0.7rem' }}>
            {selectedPlatform
              ? <PlatformBadge platform={selectedPlatform} size="sm" />
              : <span className="muted-meta">Pilih platform</span>}
            <StatusBadge status="AVAILABLE" type="attempt" size="sm" />
          </div>
          <div style={{ fontWeight: 800 }}>@{selectedAccount?.username ?? 'source_account'}</div>
          <div className="muted-meta">{selectedAccount?.displayName ?? 'Preview akun sumber'}</div>
          <div style={{ marginTop: '0.85rem', color: postUrl ? 'var(--cyan)' : 'var(--text-muted)', fontSize: '0.78rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {postUrl || 'https://social-platform.com/post/...'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.85rem', color: 'var(--status-active)', fontSize: '0.75rem', fontWeight: 800 }}>
            <CheckCircle2 size={13} />
            Terbuka untuk semua Buzzer member campaign
          </div>
        </div>
      </div>
    </aside>
  )
}
