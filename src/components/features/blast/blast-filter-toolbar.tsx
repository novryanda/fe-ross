'use client'
import { Search, SlidersHorizontal } from 'lucide-react'

interface BlastFilterToolbarProps {
  search: string
  onSearchChange: (value: string) => void
  platform: string
  onPlatformChange: (value: string) => void
  status: string
  onStatusChange: (value: string) => void
  attempt: string
  onAttemptChange: (value: string) => void
  sort: string
  onSortChange: (value: string) => void
}

export function BlastFilterToolbar({
  search,
  onSearchChange,
  platform,
  onPlatformChange,
  status,
  onStatusChange,
  attempt,
  onAttemptChange,
  sort,
  onSortChange,
}: BlastFilterToolbarProps) {
  return (
    <div className="blast-filter-toolbar">
      <div className="blast-filter-control has-icon">
        <Search size={15} />
        <input
          className="input-field"
          value={search}
          onChange={event => onSearchChange(event.target.value)}
          placeholder="Search target link or source account..."
        />
      </div>
      <div className="blast-filter-control">
        <select className="input-field" value={platform} onChange={event => onPlatformChange(event.target.value)}>
          <option value="">All Platforms</option>
          <option value="INSTAGRAM">Instagram</option>
          <option value="TIKTOK">TikTok</option>
          <option value="X_TWITTER">X/Twitter</option>
          <option value="FACEBOOK">Facebook</option>
        </select>
      </div>
      <div className="blast-filter-control">
        <select className="input-field" value={status} onChange={event => onStatusChange(event.target.value)}>
          <option value="">All Target Status</option>
          <option value="ACTIVE">Active</option>
          <option value="PAUSED">Paused</option>
          <option value="ARCHIVED">Archived</option>
        </select>
      </div>
      <div className="blast-filter-control">
        <select className="input-field" value={attempt} onChange={event => onAttemptChange(event.target.value)}>
          <option value="">All Attempts</option>
          <option value="AVAILABLE">Available</option>
          <option value="KEPT">Kept / Claimed</option>
          <option value="COMPLETED">Completed</option>
          <option value="EXPIRED">Expired</option>
          <option value="RELEASED">Released</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>
      <div className="blast-filter-control has-icon">
        <SlidersHorizontal size={15} />
        <select className="input-field" value={sort} onChange={event => onSortChange(event.target.value)}>
          <option value="newest">Sort: Newest</option>
          <option value="oldest">Sort: Oldest</option>
          <option value="completion">Sort: Completion</option>
          <option value="attempts">Sort: Attempts</option>
        </select>
      </div>
    </div>
  )
}
